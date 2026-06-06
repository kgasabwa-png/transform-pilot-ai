// Autonomy model: blast radius decides what CAN auto-ship,
// confidence decides what DOES. An action auto-ships only when
// both `internal` and `high`. Everything else queues for review.

export type BlastRadius = "internal" | "customer-facing" | "money";

export type ConfidenceTier = "high" | "medium" | "low";

export const BLAST_LABEL: Record<BlastRadius, string> = {
  internal: "Internal",
  "customer-facing": "Customer-facing",
  money: "Money",
};

export const BLAST_BLURB: Record<BlastRadius, string> = {
  internal: "CRM fields, internal Slack, CSM tasks. Reversible. No customer sees it.",
  "customer-facing": "Emails, calendar invites, recaps to the champion. Always needs you.",
  money: "Discounts, quote changes, contract edits. Needs you + a manager co-sign.",
};

export function tierFromConfidence(c: number): ConfidenceTier {
  if (c >= 90) return "high";
  if (c >= 60) return "medium";
  return "low";
}

export function canAutoShip(blast: BlastRadius, confidence: number): boolean {
  return blast === "internal" && tierFromConfidence(confidence) === "high";
}

export type LaneId = "shipped" | "quick" | "judgment" | "watch";

export const LANE_META: Record<LaneId, { title: string; sub: string }> = {
  shipped: {
    title: "Shipped while you slept",
    sub: "High-confidence internal actions. 30-day revert on every row.",
  },
  quick: {
    title: "Quick review",
    sub: "Medium confidence. Swipe through — about 90 seconds.",
  },
  judgment: {
    title: "Needs your judgment",
    sub: "Low confidence or money on the line. Full evidence.",
  },
  watch: {
    title: "Watch",
    sub: "Signals from the world — not actions yet. Promote when ready.",
  },
};
