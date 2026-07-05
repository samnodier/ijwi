// Sends a short message to a phone number. Uses Twilio (SMS or WhatsApp) when
// configured, otherwise logs the message so the app works with zero setup.
//
// DEMO_PHONE overrides the recipient: during a demo every alert can be routed
// to one phone (yours) while the response still reports the authority it would
// really go to.

export type NotifyChannel = "twilio-sms" | "twilio-whatsapp" | "log";

export interface NotifyResult {
  channel: NotifyChannel;
  to: string;
  delivered: boolean;
}

function normalize(number: string): string {
  return number.replace(/^whatsapp:/, "").trim();
}

export async function sendMessage(to: string, body: string): Promise<NotifyResult> {
  const recipient = process.env.DEMO_PHONE?.trim() || to;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  const wantsWhatsApp =
    (process.env.NOTIFY_CHANNEL ?? "").toLowerCase() === "whatsapp" ||
    Boolean(from && from.startsWith("whatsapp:"));

  if (sid && token && from) {
    const toAddr = wantsWhatsApp ? `whatsapp:${normalize(recipient)}` : normalize(recipient);
    const fromAddr = wantsWhatsApp
      ? `whatsapp:${normalize(from)}`
      : normalize(from);

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

      const channel: NotifyChannel = wantsWhatsApp ? "twilio-whatsapp" : "twilio-sms";
      if (!res.ok) {
        console.warn(`[notify] Twilio ${res.status}: ${await res.text()}`);
        return { channel, to: toAddr, delivered: false };
      }
      return { channel, to: toAddr, delivered: true };
    } catch (err) {
      console.warn(`[notify] send failed: ${String(err)}`);
      return {
        channel: wantsWhatsApp ? "twilio-whatsapp" : "twilio-sms",
        to: recipient,
        delivered: false,
      };
    }
  }

  console.log(`[notify:log] → ${recipient}\n${body}`);
  return { channel: "log", to: recipient, delivered: true };
}
