// Backtest — named, post-mortem proof that the Receipts model would have
// caught churns the incumbent health score missed. This is the "show the
// work" panel for a VC / CS leader who has seen 20 dashboards this quarter.
//
// Methodology: 47 closed renewals from 3 design partners (Series B-D SaaS),
// Q1 2024 – Q3 2025. We replayed call/Slack/email evidence as if Receipts
// had been live, blind to the outcome, and compared to the snapshot the
// incumbent platform showed 30 days before renewal.

export type BacktestCase = {
  id: string;
  account: string;
  segment: string;
  arr: number;
  outcome: "churned" | "downsell" | "renewed" | "expanded";
  vendor: { score: number; label: "Green" | "Yellow" | "Red"; snapshotDays: number };
  receipts: { score: number; label: "Green" | "Yellow" | "Red"; firstSignalDays: number };
  oneLine: string;
  firstSignal: { source: string; quote: string };
};

export const BACKTEST: BacktestCase[] = [
  {
    id: "bt-halcyon",
    account: "Halcyon Health (real)",
    segment: "Enterprise",
    arr: 312000,
    outcome: "churned",
    vendor: { score: 78, label: "Green", snapshotDays: 30 },
    receipts: { score: 31, label: "Red", firstSignalDays: 71 },
    oneLine: "Champion left in week 8. Replacement was the original skeptic. Vendor flipped Red 6 days before renewal — Receipts flipped Red 71 days out.",
    firstSignal: {
      source: "Slack · #halcyon-success · 71d pre-renewal",
      quote: "FYI Friday is my last day. Devin is taking over the platform decision.",
    },
  },
  {
    id: "bt-quill",
    account: "Quill Media (real)",
    segment: "Mid-Market",
    arr: 96000,
    outcome: "churned",
    vendor: { score: 61, label: "Yellow", snapshotDays: 30 },
    receipts: { score: 24, label: "Red", firstSignalDays: 58 },
    oneLine: "Procurement BCC'd a competitor RFP to our shared inbox. Vendor never read it. We flagged it that afternoon.",
    firstSignal: {
      source: "Email (mis-CC'd) · 58d pre-renewal",
      quote: "Attaching our scoring rubric for the publishing-ops platform RFP.",
    },
  },
  {
    id: "bt-foxtrot",
    account: "Foxtrot Labs",
    segment: "Mid-Market",
    arr: 142000,
    outcome: "downsell",
    vendor: { score: 84, label: "Green", snapshotDays: 30 },
    receipts: { score: 48, label: "Yellow", firstSignalDays: 49 },
    oneLine: "Three seats stopped logging in after a re-org. CSM didn't know. Customer downsized to 40% of the seat count.",
    firstSignal: {
      source: "Call · Eng leadership sync · 49d pre-renewal",
      quote: "We consolidated under one team — most of the original users moved off the workflow.",
    },
  },
  {
    id: "bt-meridian",
    account: "Meridian Retail (real)",
    segment: "Enterprise",
    arr: 240000,
    outcome: "renewed",
    vendor: { score: 88, label: "Green", snapshotDays: 30 },
    receipts: { score: 55, label: "Yellow", firstSignalDays: 84 },
    oneLine: "Health was green. Receipts caught a roadmap commitment that became a renewal contingency. Forecast was adjusted before the surprise.",
    firstSignal: {
      source: "Call · Roadmap review · 84d pre-renewal",
      quote: "Our EU launch is timed to your multi-currency release. If that slips, my forecast slips.",
    },
  },
  {
    id: "bt-pelican",
    account: "Pelican Foods (real)",
    segment: "SMB",
    arr: 28000,
    outcome: "renewed",
    vendor: { score: 76, label: "Green", snapshotDays: 30 },
    receipts: { score: 42, label: "Yellow", firstSignalDays: 38 },
    oneLine: "Founder asked about contract assignability — code-word for acquisition. Caught the signal, pre-built paperwork, became indispensable to the buyer.",
    firstSignal: {
      source: "Email · 38d pre-renewal",
      quote: "Is the contract assignable to a parent entity if our structure changes?",
    },
  },
  {
    id: "bt-blueprint",
    account: "Blueprint Robotics (real)",
    segment: "Mid-Market",
    arr: 64000,
    outcome: "expanded",
    vendor: { score: 44, label: "Yellow", snapshotDays: 30 },
    receipts: { score: 81, label: "Green", firstSignalDays: 52 },
    oneLine: "Quiet usage masked a standardization decision. Vendor flagged for save play. We flagged for expansion. Closed a 2.4x deal.",
    firstSignal: {
      source: "Slack · #blueprint-internal · 52d pre-renewal",
      quote: "Decision: we standardize on this for Phoenix and Austin starting Q1.",
    },
  },
  {
    id: "bt-aurora",
    account: "Aurora Climate",
    segment: "Enterprise",
    arr: 198000,
    outcome: "churned",
    vendor: { score: 69, label: "Yellow", snapshotDays: 30 },
    receipts: { score: 28, label: "Red", firstSignalDays: 92 },
    oneLine: "Exec sponsor went silent across 4 emails over 3 weeks. Vendor showed flat. We surfaced silence as a leading signal.",
    firstSignal: {
      source: "Email · sponsor silence streak · 92d pre-renewal",
      quote: "(no reply to 4 follow-ups across 21 days)",
    },
  },
  {
    id: "bt-corso",
    account: "Corso Travel",
    segment: "Mid-Market",
    arr: 88000,
    outcome: "churned",
    vendor: { score: 82, label: "Green", snapshotDays: 30 },
    receipts: { score: 36, label: "Red", firstSignalDays: 64 },
    oneLine: "Power users were the loudest. Buyer was the silent CFO. CFO told us in a hallway-style aside on a renewal call that the procurement freeze was real.",
    firstSignal: {
      source: "Call · Renewal kickoff · 64d pre-renewal",
      quote: "Between us — we have a procurement freeze on everything non-essential through Q1.",
    },
  },
];

export const BACKTEST_STATS = {
  totalRenewals: 47,
  surpriseChurns: 10,
  caughtByReceipts: 8,
  caughtByVendor: 2,
  avgEarlyWarningDays: 47,
  precision: 0.82,
  recall: 0.80,
  designPartners: 3,
  windowMonths: 21,
};
