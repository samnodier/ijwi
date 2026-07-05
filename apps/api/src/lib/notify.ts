// Sends a short message to a phone number. Provider precedence:
//   1. Africa's Talking (AT_API_KEY)   — best delivery in Rwanda / East Africa
//   2. Twilio          (TWILIO_*)      — SMS or WhatsApp
//   3. Log             (no config)     — so the app works with zero setup
//
// DEMO_PHONE overrides the recipient: during a demo every alert can be routed
// to one phone (yours) while the response still reports the authority it would
// really go to.

export type NotifyChannel =
  | "africastalking-sms"
  | "twilio-sms"
  | "twilio-whatsapp"
  | "log";

export interface NotifyResult {
  channel: NotifyChannel;
  to: string;
  delivered: boolean;
}

function normalize(number: string): string {
  return number.replace(/^whatsapp:/, "").trim();
}

// ── Africa's Talking ────────────────────────────────────────────────────────
async function sendViaAfricasTalking(to: string, body: string): Promise<NotifyResult> {
  const apiKey = process.env.AT_API_KEY as string;
  const username = process.env.AT_USERNAME?.trim() || "sandbox";
  const from = process.env.AT_FROM?.trim();
  // The username decides the environment: "sandbox" hits the sandbox host.
  const base =
    username === "sandbox"
      ? "https://api.sandbox.africastalking.com"
      : "https://api.africastalking.com";

  const params = new URLSearchParams({ username, to, message: body });
  if (from) params.set("from", from);

  try {
    const res = await fetch(`${base}/version1/messaging`, {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params,
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn(`[notify] Africa's Talking ${res.status}: ${text}`);
      return { channel: "africastalking-sms", to, delivered: false };
    }

    let delivered = true;
    try {
      const data = JSON.parse(text) as {
        SMSMessageData?: { Message?: string; Recipients?: { status?: string }[] };
      };
      const recipients = data.SMSMessageData?.Recipients ?? [];
      delivered =
        recipients.length > 0 && recipients.every((r) => r.status === "Success");
      if (!delivered) {
        console.warn(`[notify] Africa's Talking: ${data.SMSMessageData?.Message ?? text}`);
      }
    } catch {
      // Non-JSON success body — assume queued.
    }

    return { channel: "africastalking-sms", to, delivered };
  } catch (err) {
    console.warn(`[notify] Africa's Talking error: ${String(err)}`);
    return { channel: "africastalking-sms", to, delivered: false };
  }
}

// ── Twilio (SMS or WhatsApp) ─────────────────────────────────────────────────
async function sendViaTwilio(recipient: string, body: string): Promise<NotifyResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID as string;
  const token = process.env.TWILIO_AUTH_TOKEN as string;
  const from = process.env.TWILIO_FROM as string;

  const wantsWhatsApp =
    (process.env.NOTIFY_CHANNEL ?? "").toLowerCase() === "whatsapp" ||
    from.startsWith("whatsapp:");

  const toAddr = wantsWhatsApp ? `whatsapp:${normalize(recipient)}` : normalize(recipient);
  const fromAddr = wantsWhatsApp ? `whatsapp:${normalize(from)}` : normalize(from);
  const channel: NotifyChannel = wantsWhatsApp ? "twilio-whatsapp" : "twilio-sms";

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: toAddr, From: fromAddr, Body: body }),
      },
    );
    if (!res.ok) {
      console.warn(`[notify] Twilio ${res.status}: ${await res.text()}`);
      return { channel, to: toAddr, delivered: false };
    }
    return { channel, to: toAddr, delivered: true };
  } catch (err) {
    console.warn(`[notify] Twilio error: ${String(err)}`);
    return { channel, to: recipient, delivered: false };
  }
}

export async function sendMessage(to: string, body: string): Promise<NotifyResult> {
  const recipient = process.env.DEMO_PHONE?.trim() || to;

  if (process.env.AT_API_KEY) {
    return sendViaAfricasTalking(normalize(recipient), body);
  }

  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM
  ) {
    return sendViaTwilio(recipient, body);
  }

  console.log(`[notify:log] → ${recipient}\n${body}`);
  return { channel: "log", to: recipient, delivered: true };
}
