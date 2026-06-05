// Synthetic QBR transcript + baked agent outputs for Loop demo.
// Each citation is a 1-indexed line number into TRANSCRIPT_LINES.

export const ACCOUNT = {
  name: "Northwind Logistics",
  csm: "Keila Ramos",
  ae: "Marcus Lin",
  arr: "$184,000",
  renewal: "March 14, 2026",
  health: "Yellow",
  product: "Atlas Routing Cloud",
};

export const TRANSCRIPT_LINES: { speaker: string; text: string }[] = [
  { speaker: "Keila (CSM)", text: "Thanks for making time. Before we get into Q4 numbers — Priya, I heard Daniel moved over to Ops. Is he still your exec sponsor on this?" },
  { speaker: "Priya (VP Ops)", text: "Honestly, no. Daniel's now running the warehouse modernization track and our new CFO Renee is the one asking the hard questions about routing spend. I'd like to bring her in next time." },
  { speaker: "Keila (CSM)", text: "Got it — I'll set up a 30-min intro with Renee before the next review. What's she focused on?" },
  { speaker: "Priya (VP Ops)", text: "Cost per delivered mile, and proof that the routing platform pays for itself. She's reviewing every line item over $100k in February." },
  { speaker: "Marcus (AE)", text: "Useful to know. We can pull a value-realization brief that lines up with how Renee is going to look at it." },
  { speaker: "Priya (VP Ops)", text: "That would actually help me a lot. Can you get it to me by end of next week? I want to socialize it before the budget meeting." },
  { speaker: "Keila (CSM)", text: "We can have a draft to you by Friday the 13th. Let's talk adoption — how is the dispatcher team using the new lane optimization?" },
  { speaker: "Priya (VP Ops)", text: "Mixed. The Phoenix and Dallas teams love it. Atlanta has basically not turned it on. Their dispatch lead Marcus — different Marcus, sorry — thinks it overrides his judgment." },
  { speaker: "Keila (CSM)", text: "That tracks with what I'm seeing in usage. Atlanta is at 11% weekly active versus 78% in Phoenix. Would it help if I ran a working session with the Atlanta team in January?" },
  { speaker: "Priya (VP Ops)", text: "Yes. And bring data — show him what Phoenix saved last quarter. He won't argue with the numbers, he'll argue with the framing." },
  { speaker: "Keila (CSM)", text: "Done. I'll target the second week of January and pull a side-by-side." },
  { speaker: "Priya (VP Ops)", text: "One more thing while we're here. We're piloting Optoro for returns routing. If that works we may want Atlas to pull from their feed instead of our WMS." },
  { speaker: "Marcus (AE)", text: "We do have an Optoro connector in beta. I'll get you on the early access list this week and loop in our solutions architect." },
  { speaker: "Priya (VP Ops)", text: "Great. Also — and this is sensitive — we're being asked to look at one of your competitors as part of the budget exercise. It's procedural, not a real evaluation, but Renee will ask." },
  { speaker: "Keila (CSM)", text: "Appreciate you flagging it. The value brief should answer most of that, and I'll make sure the Optoro integration timeline is in writing so it's not a question mark." },
  { speaker: "Priya (VP Ops)", text: "Perfect. Last topic: we're expanding into Mexico in Q2. Cross-border lanes, customs. Does Atlas handle that today?" },
  { speaker: "Marcus (AE)", text: "Cross-border is on the roadmap for Q1 GA. I can get you the spec sheet and time with the PM if it's material to your Q2 plan." },
  { speaker: "Priya (VP Ops)", text: "It's material. Put it on the list. Okay — I have to jump. Same time next quarter?" },
  { speaker: "Keila (CSM)", text: "Same time next quarter. I'll send the recap tonight." },
];

export type Citation = { line: number; quote: string };

export type RecordUpdate = {
  field: string;
  before: string;
  after: string;
  citations: Citation[];
};

export type EmailDraft = {
  to: string;
  subject: string;
  bodyParagraphs: { text: string; citations: Citation[] }[];
};

export type CrmChange = {
  object: string;
  field: string;
  before: string;
  after: string;
  citations: Citation[];
};

export type RiskItem = {
  title: string;
  severity: "low" | "medium" | "high";
  rationale: string;
  recommendedPlay: string;
  citations: Citation[];
};

export type ClosePackage = {
  recordUpdates: RecordUpdate[];
  email: EmailDraft;
  crmChanges: CrmChange[];
  risks: RiskItem[];
};

const c = (line: number, quote: string): Citation => ({ line, quote });

export const BAKED_CLOSE: ClosePackage = {
  recordUpdates: [
    {
      field: "Executive sponsor",
      before: "Daniel Hsu (VP Ops)",
      after: "Renee Castellanos (CFO) — economic buyer; Priya remains operational owner",
      citations: [c(2, "Daniel's now running the warehouse modernization track and our new CFO Renee is the one asking the hard questions"), c(4, "She's reviewing every line item over $100k in February")],
    },
    {
      field: "Adoption status",
      before: "Healthy — 64% weekly active",
      after: "Split — Phoenix 78% / Dallas healthy / Atlanta 11% (dispatch-lead resistance)",
      citations: [c(8, "Atlanta has basically not turned it on. Their dispatch lead… thinks it overrides his judgment"), c(9, "Atlanta is at 11% weekly active versus 78% in Phoenix")],
    },
    {
      field: "Expansion signals",
      before: "None tracked",
      after: "Optoro returns-routing integration (Q1) + cross-border Mexico lanes (Q2, material to plan)",
      citations: [c(12, "If that works we may want Atlas to pull from their feed instead of our WMS"), c(16, "we're expanding into Mexico in Q2. Cross-border lanes, customs"), c(18, "It's material. Put it on the list.")],
    },
    {
      field: "Renewal risk",
      before: "Low",
      after: "Medium — competitive look-alike triggered by CFO budget review",
      citations: [c(14, "we're being asked to look at one of your competitors as part of the budget exercise"), c(4, "She's reviewing every line item over $100k in February")],
    },
  ],
  email: {
    to: "Priya Shah <priya@northwind-logistics.com>",
    subject: "Northwind × Atlas — Q4 recap and what we'll get to you",
    bodyParagraphs: [
      {
        text: "Priya — thanks for the time today. Quick recap and what we owe you, in order of your priorities.",
        citations: [],
      },
      {
        text: "Renee + value brief. I'll set up a 30-min intro with Renee before the next review and bring a value-realization brief framed against cost per delivered mile. Draft to you by Friday Jan 13 so you can socialize it before the budget meeting.",
        citations: [c(3, "I'll set up a 30-min intro with Renee before the next review"), c(4, "Cost per delivered mile, and proof that the routing platform pays for itself"), c(7, "We can have a draft to you by Friday the 13th")],
      },
      {
        text: "Atlanta working session. Targeting the second week of January with a Phoenix-vs-Atlanta side-by-side built from Q4 actuals — so the conversation is about numbers, not framing.",
        citations: [c(10, "show him what Phoenix saved last quarter. He won't argue with the numbers, he'll argue with the framing"), c(11, "I'll target the second week of January and pull a side-by-side")],
      },
      {
        text: "Optoro + cross-border. Marcus is getting you on the Optoro connector early-access list this week and adding our SA. For Mexico cross-border, we'll send the Q1 GA spec and time with the PM since you flagged it as material to Q2 planning.",
        citations: [c(13, "I'll get you on the early access list this week and loop in our solutions architect"), c(17, "Cross-border is on the roadmap for Q1 GA. I can get you the spec sheet and time with the PM")],
      },
      {
        text: "If anything here is off, just reply on the thread. — Keila",
        citations: [],
      },
    ],
  },
  crmChanges: [
    {
      object: "Account",
      field: "Executive Sponsor",
      before: "Daniel Hsu",
      after: "Renee Castellanos (CFO)",
      citations: [c(2, "our new CFO Renee is the one asking the hard questions")],
    },
    {
      object: "Account",
      field: "Health Score",
      before: "Yellow",
      after: "Yellow — flagged (competitive review + adoption split)",
      citations: [c(14, "we're being asked to look at one of your competitors"), c(9, "Atlanta is at 11% weekly active")],
    },
    {
      object: "Opportunity",
      field: "Expansion — Optoro Integration",
      before: "—",
      after: "Created · Stage: Discovery · Est. ARR: $40k · Trigger: customer-led",
      citations: [c(12, "we may want Atlas to pull from their feed instead of our WMS")],
    },
    {
      object: "Opportunity",
      field: "Expansion — Cross-Border (MX)",
      before: "—",
      after: "Created · Stage: Qualifying · Tied to Q1 GA roadmap · Material to customer Q2 plan",
      citations: [c(16, "we're expanding into Mexico in Q2"), c(18, "It's material. Put it on the list.")],
    },
    {
      object: "Task",
      field: "Renee intro — schedule before next QBR",
      before: "—",
      after: "Assigned: Keila · Due: 2026-01-22",
      citations: [c(3, "I'll set up a 30-min intro with Renee before the next review")],
    },
    {
      object: "Task",
      field: "Value brief draft to Priya",
      before: "—",
      after: "Assigned: Keila + Marcus · Due: 2026-01-13",
      citations: [c(6, "Can you get it to me by end of next week?"), c(7, "draft to you by Friday the 13th")],
    },
    {
      object: "Task",
      field: "Atlanta enablement working session",
      before: "—",
      after: "Assigned: Keila · Target: week of 2026-01-12 · Bring Phoenix side-by-side",
      citations: [c(9, "Would it help if I ran a working session with the Atlanta team in January?"), c(11, "second week of January and pull a side-by-side")],
    },
  ],
  risks: [
    {
      title: "Competitive look-alike during CFO budget review",
      severity: "high",
      rationale: "New economic buyer (Renee) is reviewing every >$100k line item and procurement is being asked to look at a competitor. Priya called it procedural, but procedural reviews become real when the value story is weak.",
      recommendedPlay: "Front-run with the value brief in Renee's framing (cost per delivered mile) and get the Optoro + cross-border timelines in writing inside the same document so the renewal isn't a single-issue conversation.",
      citations: [c(4, "She's reviewing every line item over $100k in February"), c(14, "we're being asked to look at one of your competitors as part of the budget exercise"), c(15, "I'll make sure the Optoro integration timeline is in writing")],
    },
    {
      title: "Atlanta adoption gap (11% WAU)",
      severity: "medium",
      rationale: "Dispatch lead is rejecting the product on framing, not data. If this persists into the renewal cycle it will be cited as 'doesn't work for our network.'",
      recommendedPlay: "January working session with a Phoenix-Atlanta side-by-side built from Q4 actuals. Make the dispatch lead the hero of the rollout rather than the obstacle.",
      citations: [c(8, "Atlanta has basically not turned it on"), c(10, "show him what Phoenix saved last quarter")],
    },
    {
      title: "Cross-border Mexico is a roadmap dependency",
      severity: "medium",
      rationale: "Customer's Q2 expansion is now tied to our Q1 GA. Any roadmap slip becomes a customer-impacting commitment.",
      recommendedPlay: "Get PM on a 30-min call within 2 weeks; confirm GA date in writing; flag internally so the cross-border epic doesn't slip without surfacing this account.",
      citations: [c(16, "we're expanding into Mexico in Q2"), c(17, "Cross-border is on the roadmap for Q1 GA"), c(18, "It's material")],
    },
  ],
};

export const PASTE_HINT =
  "Paste a customer-conversation transcript here (QBR, discovery call, exec sync). Or use the sample QBR to see the close.";
