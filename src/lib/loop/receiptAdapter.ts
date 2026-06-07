// Adapt a LaneAction's evidence into the Receipt shape that ReceiptModal
// expects. Lets us wire one "source of truth" modal across every surface
// without duplicating call/slack/email rendering logic.

import type { LaneAction } from "./consoleData";
import type { Receipt } from "./portfolio";

function inferChannel(source: string): Receipt["channel"] {
  const s = source.toLowerCase();
  if (s.includes("slack") || s.includes("dm")) return "slack";
  if (s.includes("email") || s.includes("gmail") || s.includes("recap")) return "email";
  return "call";
}

function inferSignal(action: LaneAction): Receipt["signal"] {
  const a = action.agent;
  if (a === "renewal-risk") return "renewal_intent";
  if (a === "expansion-scout") return "scope_expansion";
  if (a === "exec-silence") return "exec_silence";
  if (a === "champion-watch") return "champion_change";
  return "renewal_intent";
}

function inferSpeaker(quote: string): string | undefined {
  // Quotes often end in " — Speaker, role, ts"
  const dash = quote.lastIndexOf("—");
  if (dash > 0) return quote.slice(dash + 1).trim();
  return undefined;
}

export function receiptFromAction(a: LaneAction): Receipt {
  const channel = inferChannel(a.source);
  const negative = a.blast === "money" || a.confidence < 70;
  return {
    id: `r-${a.id}`,
    channel,
    source: a.source,
    speaker: inferSpeaker(a.evidence) ?? `${a.account} contact`,
    quote: a.evidence.replace(/^"|"$/g, "").split(" — ")[0],
    signal: inferSignal(a),
    weight: negative ? -2 : a.blast === "customer-facing" ? 1 : 2,
  };
}
