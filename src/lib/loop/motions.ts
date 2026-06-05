// Motions — the unit the CSM ships in the Save Room.
// A Motion is NOT a single email. It's a save play with 4-6 ordered
// steps that the agent has already prepared. One click ships them all
// in sequence. Inline edit on any step. Override teaches the agent.

import type { AgentId } from "./agents";
import { hoursAgo, minutesAgo } from "./time";

export type StepKind =
  | "email"
  | "slack"
  | "calendar"
  | "crm"
  | "doc";

export type MotionStep = {
  id: string;
  kind: StepKind;
  to: string;          // recipient or object
  title: string;       // one-line preview shown in the card
  body: string;        // editable body / detail
  meta?: string;       // small note ("3 min after step 1", "internal only")
  shippedCopy: string; // line displayed during simulated ship
};

export type EvidenceRef = {
  accountId: string;
  receiptId: string;
};

export type MotionStatus = "pending" | "shipping" | "shipped" | "overridden";

export type MotionKind = "save" | "expand" | "renew";

export type Motion = {
  id: string;
  kind: MotionKind;
  agent: AgentId;
  accountId: string;
  preparedAt: Date;
  arrImpact: number;       // positive dollars at stake (pulled back if shipped)
  headline: string;        // "Save Quill — multi-thread reset before the RFP closes"
  why: string;             // one paragraph the human reads
  evidence: EvidenceRef[]; // 2-4 cited receipts
  steps: MotionStep[];
  status: MotionStatus;
};

// ─────────────────────── Sample queue ───────────────────────

export function buildMotions(): Motion[] {
  return [
    {
      id: "m-quill-save",
      kind: "save",
      agent: "renewal-risk",
      accountId: "quill",
      preparedAt: minutesAgo(42),
      arrImpact: 96000,
      headline:
        "Save Quill Media — 11d to renewal, competitor RFP closes Friday.",
      why:
        "Procurement BCC'd a competitor's scoring rubric to us 14 days ago. Champion has gone quiet through 3 follow-ups. Without a written reason-why-not on the shortlist by EOD Thursday, this renewal is decided without us in the room. The save play below multi-threads above the champion, anchors on the rubric, and pulls your VP in.",
      evidence: [
        { accountId: "quill", receiptId: "ql-1" },
        { accountId: "quill", receiptId: "ql-2" },
        { accountId: "quill", receiptId: "ql-3" },
      ],
      status: "pending",
      steps: [
        {
          id: "s1",
          kind: "email",
          to: "Mara Lin <mara@quillmedia.com>",
          title: "Champion reset — rubric ask + 15 min this week",
          body: `Hi Mara,

Saw the RFP scoring rubric land in our inbox by accident two weeks ago. No harm done — but it told me what you already knew: this is a real evaluation, not a renewal.

I'd rather hear it from you than guess from a rubric. Two asks:

1) 15 minutes this week — you and me — to walk through what's actually on the rubric and where we stand.
2) If we're not on the shortlist, tell me why in writing so I can either fix it or save you a meeting.

Today 3–5p or tomorrow before noon. Or send a time.

— Sam`,
          shippedCopy: "Emailing Mara Lin (champion)…",
        },
        {
          id: "s2",
          kind: "email",
          to: "Renata Voss <renata@quillmedia.com> (CMO, economic buyer)",
          title: "Exec-to-exec — rubric, in writing, no slides",
          body: `Renata,

Quick FYI before this week gets away from us. Mara's team is running an evaluation that lands Friday. I've asked her for the rubric so we can either respond to it cleanly or step aside cleanly — either is fine, but I want it to be a decision, not a default.

If a 20-minute exec sync would help — yours, mine — I'll make it work this week.

— Sam`,
          meta: "sends 3 min after step 1 to avoid pile-on",
          shippedCopy: "Emailing Renata Voss (CMO)…",
        },
        {
          id: "s3",
          kind: "calendar",
          to: "Wed 2:00p · 30 min · VP Sales (Lisa) + Sam + Renata (Quill CMO)",
          title: "Exec save call — held now, release Thursday if not needed",
          body:
            "Holds Wed 2:00p on Lisa's calendar with a soft invite to Renata. Releases automatically Thursday 9am if Renata hasn't accepted, so Lisa's day stays clean.",
          shippedCopy: "Holding Wed 2:00p on Lisa's calendar…",
        },
        {
          id: "s4",
          kind: "crm",
          to: "Salesforce · Account · Quill Media",
          title: "Stage Commit → At Risk · add competitor flag",
          body:
            "Flips Quill from Commit to At Risk in the forecast, adds 'Competitive RFP in progress' to next-step, and tags Renata as economic buyer. Logs the rubric BCC as the source of truth.",
          shippedCopy: "Updating Salesforce…",
        },
        {
          id: "s5",
          kind: "slack",
          to: "#renewals · @ekim (manager)",
          title: "1-line manager brief — what just shipped + the hold",
          body:
            "Posts a 1-line brief to your manager so the exec hold isn't a surprise on her calendar Wednesday morning, with a link back to this motion.",
          shippedCopy: "Briefing Ellen (manager)…",
        },
      ],
    },
    {
      id: "m-halcyon-save",
      kind: "save",
      agent: "exec-silence",
      accountId: "halcyon",
      preparedAt: hoursAgo(2),
      arrImpact: 312000,
      headline:
        "Save Halcyon Health — 14d of silence from new sponsor, 41d to renewal.",
      why:
        "Champion Marie left 14 days ago. Replacement Devin was the discovery-call skeptic and hasn't replied to three follow-ups. Don't lead with product — lead with the clinical-ops outcome Devin already cares about. This play lands a 30-min exec reset, briefs your VP, and pre-builds the 3-yr cost comparison Devin is already pulling internally.",
      evidence: [
        { accountId: "halcyon", receiptId: "hc-1" },
        { accountId: "halcyon", receiptId: "hc-2" },
        { accountId: "halcyon", receiptId: "hc-3" },
        { accountId: "halcyon", receiptId: "hc-4" },
      ],
      status: "pending",
      steps: [
        {
          id: "s1",
          kind: "email",
          to: "Devin Park <devin@halcyon.health>",
          title: "Reset, framed around cycle-time (not platform)",
          body: `Devin —

You inherited a vendor relationship two weeks before a renewal. That's not the deal anyone wants, so I want to be useful, not pushy.

One specific ask: 30 minutes this week to walk you through what we've actually moved on cycle time in Q3 — the metric you flagged in discovery. No slides. No platform tour. Just the number, how we got it, and where it could go in year 2.

Thu 10:30a, Thu 3p, or Fri 9a — whichever is least bad.

— Jordan`,
          shippedCopy: "Emailing Devin Park…",
        },
        {
          id: "s2",
          kind: "doc",
          to: "Shared drive · Halcyon · 3-yr cost-vs-build memo",
          title: "Pre-build the 3-yr cost comparison Devin's analyst is pulling",
          body:
            "Drafts a 2-page memo: 3-yr fully-loaded cost vs. internal build, sourced from the utilization data Devin's analyst is already requesting. Lands in his inbox before he asks for it.",
          shippedCopy: "Drafting cost-vs-build memo…",
        },
        {
          id: "s3",
          kind: "calendar",
          to: "Thu 10:30a · 30 min · Jordan + Devin (hold)",
          title: "Hold three exec slots — release whichever Devin doesn't take",
          body:
            "Holds Thu 10:30a, Thu 3:00p, and Fri 9:00a. Auto-releases the two slots Devin doesn't accept so Jordan's calendar isn't blocked for nothing.",
          shippedCopy: "Holding 3 slots on Jordan's calendar…",
        },
        {
          id: "s4",
          kind: "crm",
          to: "Salesforce · Account · Halcyon Health",
          title: "Stage Commit → At Risk · sponsor change logged",
          body:
            "Moves Halcyon from Commit to At Risk. Logs Marie's departure and Devin's role as new economic buyer. Adds the cost-vs-build memo as next artifact.",
          shippedCopy: "Updating Salesforce…",
        },
        {
          id: "s5",
          kind: "slack",
          to: "#renewals · @ekim (manager)",
          title: "Manager brief — exec call held, memo in flight, $312k at stake",
          body:
            "1-line summary to Ellen so she can decide whether to join the Thursday call without a 1:1.",
          shippedCopy: "Briefing Ellen (manager)…",
        },
      ],
    },
    {
      id: "m-blueprint-expand",
      kind: "expand",
      agent: "expansion-scout",
      accountId: "blueprint",
      preparedAt: hoursAgo(4),
      arrImpact: 240000,
      headline:
        "Expand Blueprint Robotics — Phoenix + Austin standardization confirmed in writing.",
      why:
        "Director of Eng wrote in Slack last week: 'we standardize on this for Phoenix and Austin starting Q1.' Procurement is on the way. Save-motion is the wrong play — this is a proposal moment. The play below sends a 2-site expansion proposal, books the joint renewal-expansion conversation, and flips Blueprint from At Risk to Expand in the forecast.",
      evidence: [
        { accountId: "blueprint", receiptId: "bp-1" },
        { accountId: "blueprint", receiptId: "bp-2" },
        { accountId: "blueprint", receiptId: "bp-3" },
      ],
      status: "pending",
      steps: [
        {
          id: "s1",
          kind: "doc",
          to: "Shared drive · Blueprint · 2-site expansion proposal",
          title: "Draft Phoenix + Austin proposal — pricing + rollout timeline",
          body:
            "Drafts a 1-page proposal with 2-site pricing, a 60-day rollout plan, and a single signature line. Pulls usage benchmarks from the existing site so procurement has a real ROI anchor.",
          shippedCopy: "Drafting 2-site expansion proposal…",
        },
        {
          id: "s2",
          kind: "email",
          to: "Ravi Patel <ravi@blueprintrobotics.com> (Director of Eng)",
          title: "Send proposal — tee up the joint renewal-expansion call",
          body: `Ravi,

Caught your note that Phoenix and Austin standardize on us in Q1. Attached: a 1-pager so procurement has something to point at.

I'd like to fold the renewal and the expansion into one conversation rather than two — your suggestion, not mine. Got 20 min Thu or Fri?

— Keila`,
          shippedCopy: "Emailing Ravi Patel with proposal…",
        },
        {
          id: "s3",
          kind: "calendar",
          to: "Thu 11:00a · 30 min · Keila + Ravi + Blueprint procurement",
          title: "Hold the joint renewal-expansion call",
          body:
            "Holds Thu 11:00a with procurement included from the start so this is one signature, not two.",
          shippedCopy: "Holding Thu 11:00a…",
        },
        {
          id: "s4",
          kind: "crm",
          to: "Salesforce · Account · Blueprint Robotics",
          title: "Stage At Risk → Expand · +$240k opportunity",
          body:
            "Reclassifies Blueprint from At Risk (where the vendor score put it) to Expand. Opens a $240k expansion opportunity tied to Phoenix + Austin.",
          shippedCopy: "Updating Salesforce…",
        },
      ],
    },
    {
      id: "m-northwind-save",
      kind: "save",
      agent: "champion-watch",
      accountId: "northwind",
      preparedAt: hoursAgo(6),
      arrImpact: 184000,
      headline:
        "Save Northwind — new CFO is reviewing every $100k+ line in February.",
      why:
        "Two separate call mentions plus a LinkedIn role change confirm Renee Okafor is Northwind's new CFO and is auditing every line item over $100k. CRM still lists the old contact as decision-maker. This play gets a CFO-framed value brief (cost per delivered mile) to Priya before the budget meeting socializes, updates the stakeholder graph, and warms Renee directly.",
      evidence: [
        { accountId: "northwind", receiptId: "nw-1" },
        { accountId: "northwind", receiptId: "nw-2" },
        { accountId: "northwind", receiptId: "nw-3" },
      ],
      status: "pending",
      steps: [
        {
          id: "s1",
          kind: "doc",
          to: "Shared drive · Northwind · CFO value brief",
          title: "1-page value brief in CFO framing (cost per delivered mile)",
          body:
            "Drafts a 1-page brief: cost per delivered mile before vs. after, sourced from the last 6 months of Northwind data. Frames the renewal as a cost reduction, not a software line item.",
          shippedCopy: "Drafting CFO value brief…",
        },
        {
          id: "s2",
          kind: "email",
          to: "Priya Anand <priya@northwind.com> (VP Ops, champion)",
          title: "Send brief — get it into Renee's pre-read before the meeting",
          body: `Priya,

Heard Renee is reviewing every $100k+ line. Attached: a 1-pager in her framing — cost per delivered mile, before/after.

If you can include it in her pre-read, great. If not, happy to walk her through it directly. Either way, I'd rather she see our number on her terms than guess at it.

— Keila`,
          shippedCopy: "Emailing Priya Anand…",
        },
        {
          id: "s3",
          kind: "email",
          to: "Renee Okafor <renee@northwind.com> (CFO)",
          title: "Warm intro to Renee — 15 min if useful, no pitch",
          body: `Renee,

Congrats on the CFO role. Quick note: my team supports Priya's logistics operation, and I know you're auditing the line items.

If a 15-minute call would save you a guess about ours, I'll send three times. No pitch, no slides — just the numbers in your framing. If not, no follow-up.

— Keila`,
          shippedCopy: "Emailing Renee Okafor (CFO)…",
        },
        {
          id: "s4",
          kind: "crm",
          to: "Salesforce · Account · Northwind Logistics",
          title: "Stage Commit → At Risk · Renee added as economic buyer",
          body:
            "Updates stakeholder graph: Renee Okafor → CFO + economic buyer. Old contact retained as logistics owner. Flips forecast stage to At Risk and adds the value-brief as artifact.",
          shippedCopy: "Updating Salesforce…",
        },
      ],
    },
    {
      id: "m-tessera-renew",
      kind: "renew",
      agent: "champion-watch",
      accountId: "tessera",
      preparedAt: hoursAgo(8),
      arrImpact: 410000,
      headline:
        "Renew + expand Tessera Bank — CIO verbalized multi-year, 3 of 4 BUs are advocates.",
      why:
        "CIO sync transcript: 'You're table stakes. Let's talk multi-year with expanded footprint.' Three of four BUs are advocates; the fourth is an enablement gap, not a product gap. Don't fix the one BU before the renewal — isolate it as a workstream. This play lands the multi-year proposal at the CIO level and quarantines the BU-4 enablement.",
      evidence: [
        { accountId: "tessera", receiptId: "ts-1" },
        { accountId: "tessera", receiptId: "ts-2" },
      ],
      status: "pending",
      steps: [
        {
          id: "s1",
          kind: "doc",
          to: "Shared drive · Tessera · Multi-year + expansion proposal",
          title: "Draft 3-yr multi-BU proposal with expanded footprint",
          body:
            "Pulls usage from the 3 advocate BUs, prices a 3-yr commit with expanded seats, separates BU-4 as a 90-day enablement workstream so it doesn't drag the deal.",
          shippedCopy: "Drafting multi-year proposal…",
        },
        {
          id: "s2",
          kind: "email",
          to: "Tessera CIO <cio@tessera.com>",
          title: "Send proposal — anchor on his 'table stakes' language",
          body: `Mark,

You said in our Nov 1 sync: 'You're table stakes. Let's talk multi-year with expanded footprint.' Attached, on your terms — 3 yr, expanded seats across BU-1/2/3, BU-4 isolated as a 90-day enablement workstream.

20 minutes any morning this week to walk it.

— Sam`,
          shippedCopy: "Emailing Tessera CIO…",
        },
        {
          id: "s3",
          kind: "crm",
          to: "Salesforce · Account · Tessera Bank",
          title: "Stage Yellow → Green · open $410k multi-year opportunity",
          body:
            "Promotes Tessera from Yellow to Green based on conversation grade, not the dragged vendor score. Opens a $410k multi-year + expansion opportunity.",
          shippedCopy: "Updating Salesforce…",
        },
        {
          id: "s4",
          kind: "slack",
          to: "#renewals · @ekim (manager)",
          title: "Manager brief — $410k multi-year + expansion in flight",
          body:
            "1-line summary to Ellen so she sees the upgrade before the weekly forecast review.",
          shippedCopy: "Briefing Ellen (manager)…",
        },
      ],
    },
    {
      id: "m-pelican-flag",
      kind: "save",
      agent: "exec-silence",
      accountId: "pelican",
      preparedAt: hoursAgo(10),
      arrImpact: 28000,
      headline:
        "Pelican Foods — pre-build assignment paperwork before the acquisition closes.",
      why:
        "Founder asked twice about contract assignability in 30 days and mentioned a 'strategic conversation.' Doesn't show in any platform health score. The play below pre-builds the assignment paperwork with legal so we become indispensable to the buyer instead of a blocker.",
      evidence: [
        { accountId: "pelican", receiptId: "pl-1" },
        { accountId: "pelican", receiptId: "pl-2" },
      ],
      status: "pending",
      steps: [
        {
          id: "s1",
          kind: "doc",
          to: "Shared drive · Pelican · Assignment language draft",
          title: "Draft assignment language with legal",
          body:
            "Drafts standard assignment-to-parent-entity language with our legal team. Sits in the shared drive ready to send the moment the founder asks for it.",
          shippedCopy: "Drafting assignment language with legal…",
        },
        {
          id: "s2",
          kind: "email",
          to: "Pelican founder <founder@pelican.com>",
          title: "Quiet note — paperwork ready when you need it",
          body: `Hey —

Following up on your assignability question. I had our legal team draft standard parent-entity assignment language so it's ready when you need it. No urgency, just wanted to be useful.

— Sam`,
          shippedCopy: "Emailing Pelican founder…",
        },
        {
          id: "s3",
          kind: "crm",
          to: "Salesforce · Account · Pelican Foods",
          title: "Add hidden tag — Acquisition risk · paperwork pre-built",
          body:
            "Adds an internal-only acquisition-risk tag and notes that assignment language is pre-built. Surfaces to manager review, not to customer.",
          shippedCopy: "Updating Salesforce…",
        },
      ],
    },
  ];
}
