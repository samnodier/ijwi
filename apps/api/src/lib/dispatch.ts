import { emergencyNumbers } from "../data/emergencyNumbers.js";
import { sendMessage, type NotifyChannel } from "./notify.js";
import type { EmergencyNumber, ReportDTO } from "../types.js";

// Report category / keyword → emergency-number category slug. First match wins,
// so more specific / higher-priority rules are listed first. We scan both the
// report's category and its description so routing still works when the
// category is vague or missing.
interface RoutingRule {
  keywords: string[];
  target: string; // must match an EmergencyNumber.category
  label: string; // human-readable reason, included in the dispatched message
}

const ROUTING_RULES: RoutingRule[] = [
  { keywords: ["gbv", "gender", "domestic", "rape", "sexual"], target: "gbv", label: "Gender-based violence" },
  { keywords: ["fire", "burning", "smoke", "flame"], target: "fire", label: "Fire" },
  { keywords: ["flood", "flooding", "submerged", "overflow", "drain", "rain"], target: "fire", label: "Flooding / water emergency" },
  { keywords: ["accident", "crash", "collision", "traffic", "knocked", "hit-and-run"], target: "traffic", label: "Traffic accident" },
  { keywords: ["injured", "injury", "ambulance", "bleeding", "unconscious", "medical", "sick"], target: "medical", label: "Medical emergency" },
  { keywords: ["crime", "theft", "robbery", "assault", "violence", "gun", "attack", "suspicious", "safety"], target: "security", label: "Security / crime" },
  { keywords: ["power", "electric", "electricity", "streetlight", "street light", "outage", "transformer", "cable"], target: "power", label: "Power / electricity fault" },
  { keywords: ["pipe", "tap", "sewer", "wasac", "leak", "water supply", "no water"], target: "water", label: "Water supply issue" },
  { keywords: ["scam", "cybercrime", "phishing"], target: "fraud", label: "Fraud / cybercrime" },
  { keywords: ["corruption", "bribe", "embezzle", "kickback"], target: "corruption", label: "Corruption" },
  { keywords: ["stalled", "abandoned", "unfinished", "delay", "gov_delay", "project", "injustice"], target: "governance", label: "Stalled project / injustice" },
  { keywords: ["infrastructure", "pothole", "road", "bridge", "dumping", "garbage", "litter", "waste"], target: "governance", label: "Infrastructure / public services" },
  { keywords: ["child", "minor"], target: "child", label: "Child protection" },
];

function findNumber(category: string): EmergencyNumber | undefined {
  return emergencyNumbers.find((n) => n.category === category);
}

export interface RoutingDecision {
  authority: EmergencyNumber;
  reason: string;
}

/** Decide which authority a report should be sent to, based on its category/text. */
export function resolveAuthority(
  category?: string | null,
  description?: string | null,
): RoutingDecision {
  if (category) {
    const cleanedCategory = category.toLowerCase().trim();
    const authority = findNumber(cleanedCategory);
    if (authority) {
      const rule = ROUTING_RULES.find((r) => r.target === authority.category);
      return { authority, reason: rule ? rule.label : `Directed to ${authority.name}` };
    }
  }

  const haystack = `${category ?? ""} ${description ?? ""}`.toLowerCase();

  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      const authority = findNumber(rule.target);
      if (authority) return { authority, reason: rule.label };
    }
  }

  // ALWAYS SEND: no keyword matched (category is missing, empty, "other", or
  // otherwise unknown) — we still resolve to the general emergency authority so
  // that a report is never dropped for lack of a classification.
  const fallback = findNumber("general") ?? emergencyNumbers[0];
  return { authority: fallback, reason: "General / uncategorized" };
}

/** Build the SMS-style context message sent to the responding authority. */
export function buildContextMessage(report: ReportDTO, decision: RoutingDecision): string {
  const where = report.location?.address
    ? report.location.address
    : report.location
      ? `${report.location.lat.toFixed(5)}, ${report.location.lng.toFixed(5)}`
      : "location not provided";
  const photos = report.photos.length ? ` | ${report.photos.length} photo(s) attached` : "";

  return (
    `IJWI ALERT [${decision.reason}]\n` +
    `${report.title ? report.title + " — " : ""}${report.description}\n` +
    `Location: ${where}${photos}\n` +
    `Report ID: ${report.id}`
  );
}

export interface DispatchResult {
  authorityName: string;
  number: string;
  reason: string;
  message: string;
  channel: NotifyChannel;
  delivered: boolean;
  // Where the message was actually delivered (may differ from `number` when
  // DEMO_PHONE is set to route everything to one phone for a demo).
  deliveredTo: string;
  sentAt: string;
}

/**
 * Route a report to the correct authority and send the context to their phone
 * number via the notify sender (Twilio SMS/WhatsApp, or logged when no
 * provider is configured). Never throws — dispatch must not block a citizen's
 * report from being saved. resolveAuthority() always returns an authority
 * (falling back to "general"), so every call here results in a dispatch.
 */
export async function dispatchReport(report: ReportDTO): Promise<DispatchResult> {
  const decision = resolveAuthority(report.category, report.description);
  const message = buildContextMessage(report, decision);

  const sent = await sendMessage(decision.authority.number, message);

  return {
    authorityName: decision.authority.name,
    number: decision.authority.number,
    reason: decision.reason,
    message,
    channel: sent.channel,
    delivered: sent.delivered,
    deliveredTo: sent.to,
    sentAt: new Date().toISOString(),
  };
}
