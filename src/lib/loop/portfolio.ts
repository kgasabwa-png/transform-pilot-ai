// Receipts Inbox — synthetic portfolio.
// 8 accounts a CSM would actually own. Each has:
//   - The score their CS platform (Gainsight-style) reports today.
//   - The score the Receipts Inbox computes from what the customer is
//     actually saying across calls, Slack, and email.
//   - Receipts: line-level evidence with channel + timestamp + quote,
//     so the CSM can click any score and see *why*.
//
// The gap between the two scores is the product.

export type Channel = "call" | "slack" | "email";

export type Receipt = {
  id: string;
  channel: Channel;
  source: string; // e.g. "QBR · Oct 24" or "#northwind-ops · Nov 2 09:14"
  speaker?: string;
  quote: string;
  signal:
    | "champion_change"
    | "economic_buyer_shift"
    | "competitive_mention"
    | "adoption_drop"
    | "scope_expansion"
    | "roadmap_dependency"
    | "support_escalation"
    | "exec_silence"
    | "renewal_intent"
    | "advocacy";
  weight: number; // -3 (very negative) … +3 (very positive)
};

export type Account = {
  id: string;
  name: string;
  segment: "Enterprise" | "Mid-Market" | "SMB";
  arr: number;
  renewalDays: number; // days from "today"
  csm: string;
  // What the incumbent CS platform shows today.
  vendorScore: { value: number; label: "Green" | "Yellow" | "Red"; basis: string };
  // What the Receipts Inbox computes.
  receiptsScore: { value: number; label: "Green" | "Yellow" | "Red" };
  // The single sentence that would land in a forecast review.
  headline: string;
  // What the CSM should do in the next 48h.
  nextPlay: string;
  receipts: Receipt[];
};

const fmtARR = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
export const formatARR = fmtARR;

export const ACCOUNTS: Account[] = [
  {
    id: "northwind",
    name: "Northwind Logistics",
    segment: "Enterprise",
    arr: 184000,
    renewalDays: 68,
    csm: "Keila Ramos",
    vendorScore: { value: 72, label: "Green", basis: "Login frequency healthy · NPS 8 · 0 open Sev-1s" },
    receiptsScore: { value: 38, label: "Red" },
    headline:
      "New CFO is reviewing every $100k+ line item and a competitor look-alike is already in motion. Champion change happened off-platform.",
    nextPlay:
      "Get a value-realization brief in the CFO's framing (cost per delivered mile) into Priya's hands by Friday — before the budget meeting socializes.",
    receipts: [
      {
        id: "nw-1",
        channel: "call",
        source: "QBR · Oct 24, 14:06",
        speaker: "Priya (VP Ops)",
        quote:
          "Daniel's now running warehouse modernization and our new CFO Renee is the one asking the hard questions about routing spend.",
        signal: "economic_buyer_shift",
        weight: -3,
      },
      {
        id: "nw-2",
        channel: "call",
        source: "QBR · Oct 24, 14:11",
        speaker: "Priya (VP Ops)",
        quote: "She's reviewing every line item over $100k in February.",
        signal: "renewal_intent",
        weight: -2,
      },
      {
        id: "nw-3",
        channel: "call",
        source: "QBR · Oct 24, 14:38",
        speaker: "Priya (VP Ops)",
        quote:
          "We're being asked to look at one of your competitors as part of the budget exercise. Procedural, but Renee will ask.",
        signal: "competitive_mention",
        weight: -3,
      },
      {
        id: "nw-4",
        channel: "slack",
        source: "#atlas-northwind · Nov 1, 16:22",
        speaker: "Atlanta dispatch lead",
        quote:
          "Honestly the lane optimizer overrides judgment more than it helps. We've stopped using it on long-haul.",
        signal: "adoption_drop",
        weight: -2,
      },
      {
        id: "nw-5",
        channel: "email",
        source: "Email thread · Nov 4",
        speaker: "Priya → Keila",
        quote:
          "Can you send the Optoro integration timeline in writing so I can include it in the budget memo?",
        signal: "scope_expansion",
        weight: +1,
      },
    ],
  },
  {
    id: "halcyon",
    name: "Halcyon Health",
    segment: "Enterprise",
    arr: 312000,
    renewalDays: 41,
    csm: "Jordan Pace",
    vendorScore: { value: 81, label: "Green", basis: "DAU up 12% QoQ · CSAT 4.6 · QBR attended" },
    receiptsScore: { value: 29, label: "Red" },
    headline:
      "Champion left two weeks ago. Replacement was their internal skeptic. The exec sponsor has gone silent on three follow-ups.",
    nextPlay:
      "Land an exec-to-exec call this week. Do NOT lead with product — lead with a clinical-ops outcome the new VP already cares about.",
    receipts: [
      {
        id: "hc-1",
        channel: "slack",
        source: "#halcyon-success · Oct 28, 11:03",
        speaker: "Marie (Champion, departing)",
        quote:
          "FYI Friday is my last day. Devin is taking over the platform decision — you've met him.",
        signal: "champion_change",
        weight: -3,
      },
      {
        id: "hc-2",
        channel: "email",
        source: "Email thread · Nov 3 (no reply since)",
        speaker: "Jordan → Devin",
        quote:
          "Wanted to schedule a 30-min reset. Sent options for this week and next — happy to make it work whenever.",
        signal: "exec_silence",
        weight: -2,
      },
      {
        id: "hc-3",
        channel: "call",
        source: "Discovery (8 mo ago) · Feb 14",
        speaker: "Devin (then-Director)",
        quote:
          "I think we're solving a workflow problem with a software bandage. I'd want to see hard ROI before renewing.",
        signal: "competitive_mention",
        weight: -3,
      },
      {
        id: "hc-4",
        channel: "slack",
        source: "#halcyon-success · Nov 5, 09:41",
        speaker: "Halcyon analyst",
        quote:
          "Pulling utilization for Devin's review. He asked for a 3-yr cost comparison vs. building internally.",
        signal: "renewal_intent",
        weight: -2,
      },
    ],
  },
  {
    id: "blueprint",
    name: "Blueprint Robotics",
    segment: "Mid-Market",
    arr: 64000,
    renewalDays: 22,
    csm: "Keila Ramos",
    vendorScore: { value: 44, label: "Yellow", basis: "DAU flat · 2 open tickets · last login 9d ago" },
    receiptsScore: { value: 78, label: "Green" },
    headline:
      "Quiet usage masks the real story: they're standardizing on us across two new business units. Renewal is a foregone conclusion; the play is expansion, not save.",
    nextPlay:
      "Skip the save motion. Send a proposal for the two new BUs and pull the procurement lead into the renewal call.",
    receipts: [
      {
        id: "bp-1",
        channel: "slack",
        source: "#blueprint-internal · Oct 30, 13:18",
        speaker: "Ravi (Director of Eng)",
        quote:
          "Decision: we standardize on this for the Phoenix and Austin sites starting Q1. Don't want two stacks.",
        signal: "scope_expansion",
        weight: +3,
      },
      {
        id: "bp-2",
        channel: "email",
        source: "Email · Nov 2",
        speaker: "Ravi → Keila",
        quote:
          "Procurement is going to reach out. Treat the renewal and the expansion as one conversation if you can.",
        signal: "renewal_intent",
        weight: +3,
      },
      {
        id: "bp-3",
        channel: "call",
        source: "Working session · Nov 6",
        speaker: "Ravi",
        quote:
          "We've stopped logging in because it just runs. That's a feature, not a problem.",
        signal: "advocacy",
        weight: +2,
      },
    ],
  },
  {
    id: "meridian",
    name: "Meridian Retail",
    segment: "Enterprise",
    arr: 240000,
    renewalDays: 94,
    csm: "Jordan Pace",
    vendorScore: { value: 88, label: "Green", basis: "Power user count +18% · executive QBR attended" },
    receiptsScore: { value: 51, label: "Yellow" },
    headline:
      "Healthy on the surface, but a Q1 roadmap dependency (multi-currency) is now a customer commitment. Any slip becomes a renewal conversation.",
    nextPlay:
      "Get product on a call with Meridian's CFO team within 2 weeks. Confirm GA date in writing. Flag internally before the epic moves.",
    receipts: [
      {
        id: "md-1",
        channel: "call",
        source: "Roadmap review · Oct 19",
        speaker: "Meridian CFO",
        quote:
          "Our EU launch is timed to your multi-currency release. If that slips, my forecast slips, and I'll need a backup plan.",
        signal: "roadmap_dependency",
        weight: -2,
      },
      {
        id: "md-2",
        channel: "email",
        source: "Email · Oct 22",
        speaker: "Jordan → PM",
        quote:
          "Need a hard date on multi-currency GA. Customer is building Q1 around it.",
        signal: "roadmap_dependency",
        weight: -1,
      },
    ],
  },
  {
    id: "tessera",
    name: "Tessera Bank",
    segment: "Enterprise",
    arr: 410000,
    renewalDays: 132,
    csm: "Sam Okafor",
    vendorScore: { value: 67, label: "Yellow", basis: "Adoption split across BUs · 1 Sev-2 last month" },
    receiptsScore: { value: 84, label: "Green" },
    headline:
      "Vendor score is dragged by one BU. The other three are quietly the strongest advocates we have and the CIO has already greenlit a 2x expansion verbally.",
    nextPlay:
      "Don't fix the one BU before the renewal. Lead with the CIO conversation, attach a multi-year + expansion proposal, and isolate the BU as a separate workstream.",
    receipts: [
      {
        id: "ts-1",
        channel: "call",
        source: "CIO sync · Nov 1",
        speaker: "Tessera CIO",
        quote:
          "You're table stakes for us now. I'd like to talk multi-year with an expanded footprint at the next review.",
        signal: "renewal_intent",
        weight: +3,
      },
      {
        id: "ts-2",
        channel: "slack",
        source: "#tessera-rm · Nov 4, 10:02",
        speaker: "Tessera platform lead",
        quote:
          "Three BUs are all-in. The fourth has a different workflow — that's an enablement gap, not a product gap.",
        signal: "adoption_drop",
        weight: 0,
      },
    ],
  },
  {
    id: "quill",
    name: "Quill Media",
    segment: "Mid-Market",
    arr: 96000,
    renewalDays: 11,
    csm: "Sam Okafor",
    vendorScore: { value: 58, label: "Yellow", basis: "Usage stable · CSAT 4.1 · QBR rescheduled" },
    receiptsScore: { value: 22, label: "Red" },
    headline:
      "11 days to renewal. Procurement has been quietly running a competitive RFP for three weeks and our champion hasn't told us.",
    nextPlay:
      "Today: champion-to-champion call. Get on the RFP shortlist or get a written reason why not. Escalate to your VP if no response by EOD.",
    receipts: [
      {
        id: "ql-1",
        channel: "email",
        source: "Email (BCC'd to us in error) · Oct 28",
        speaker: "Quill procurement → competitor",
        quote:
          "Attaching our scoring rubric for the publishing-ops platform RFP. Responses due Nov 8.",
        signal: "competitive_mention",
        weight: -3,
      },
      {
        id: "ql-2",
        channel: "slack",
        source: "Slack Connect · Nov 2, 17:44",
        speaker: "Champion",
        quote:
          "Hey — can we move the QBR? Things are a little crazy on my end this quarter.",
        signal: "exec_silence",
        weight: -2,
      },
      {
        id: "ql-3",
        channel: "call",
        source: "Last QBR · Sep 12",
        speaker: "Quill CMO",
        quote:
          "We get value but the per-seat pricing is the conversation every renewal.",
        signal: "renewal_intent",
        weight: -1,
      },
    ],
  },
  {
    id: "arbor",
    name: "Arbor Energy",
    segment: "Mid-Market",
    arr: 72000,
    renewalDays: 180,
    csm: "Keila Ramos",
    vendorScore: { value: 35, label: "Red", basis: "DAU down 22% · 4 open tickets · NPS 5" },
    receiptsScore: { value: 62, label: "Yellow" },
    headline:
      "The drop is real but explainable: a reorg moved 3 power users. The new team has already booked enablement and is leaning in.",
    nextPlay:
      "Don't trigger a save play — it'll signal alarm to a team that's already committed. Run the enablement, then re-baseline the score in 30 days.",
    receipts: [
      {
        id: "ar-1",
        channel: "email",
        source: "Email · Oct 20",
        speaker: "New Arbor lead",
        quote:
          "I just inherited this. Can we do a full re-onboarding for my team of six? Block out a half-day.",
        signal: "advocacy",
        weight: +2,
      },
      {
        id: "ar-2",
        channel: "slack",
        source: "#arbor-cs · Nov 3",
        speaker: "Arbor analyst",
        quote: "The dashboards saved us a full day this week. More please.",
        signal: "advocacy",
        weight: +2,
      },
    ],
  },
  {
    id: "pelican",
    name: "Pelican Foods",
    segment: "SMB",
    arr: 28000,
    renewalDays: 55,
    csm: "Sam Okafor",
    vendorScore: { value: 76, label: "Green", basis: "Daily active · onboarding complete · 0 tickets" },
    receiptsScore: { value: 41, label: "Yellow" },
    headline:
      "Healthy product usage, but the founder mentioned an acquisition twice in the last 30 days. Acquisition risk doesn't show up in any health score.",
    nextPlay:
      "Surface the acquisition signal to your VP. Pre-build the assignment paperwork now so we're not the reason the deal slips — that's how you become indispensable to the buyer too.",
    receipts: [
      {
        id: "pl-1",
        channel: "call",
        source: "Check-in · Oct 16",
        speaker: "Pelican founder",
        quote:
          "We're talking to a strategic. Probably nothing, but the team is heads-down on diligence.",
        signal: "renewal_intent",
        weight: -2,
      },
      {
        id: "pl-2",
        channel: "email",
        source: "Email · Nov 4",
        speaker: "Pelican founder",
        quote:
          "Hey — quick one. Is the contract assignable to a parent entity if our structure changes?",
        signal: "renewal_intent",
        weight: -2,
      },
    ],
  },
];

// Aggregate metric: how many "surprise renewals" (>20 pt gap between
// vendor score and receipts score) the inbox catches.
export function surpriseCount(accounts: Account[]) {
  return accounts.filter(
    (a) => Math.abs(a.vendorScore.value - a.receiptsScore.value) >= 20,
  ).length;
}

export function arrAtRisk(accounts: Account[]) {
  return accounts
    .filter((a) => a.receiptsScore.label === "Red")
    .reduce((s, a) => s + a.arr, 0);
}
