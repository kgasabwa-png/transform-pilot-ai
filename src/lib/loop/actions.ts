// DraftActions — the unit of work in the Approval Queue.
// Each one is something an agent already prepared. The CSM approves,
// edits, or rejects. No dead buttons; every action has a concrete
// downstream effect represented in this file.

import type { AgentId } from "./agents";
import { hoursAgo, minutesAgo } from "./time";

export type ActionKind =
  | "email"           // draft email ready to send
  | "crm-update"      // change a CRM field (stage, score, owner, etc.)
  | "meeting"         // booked / proposed calendar slot
  | "flag"            // raise a risk/expansion flag with a recommendation
  | "forecast-move";  // adjust a forecast number (VP surface)

export type ActionStatus =
  | "pending"     // waiting for the human
  | "approved"    // human green-lit, in flight (simulated)
  | "shipped"    // simulated send/update completed
  | "edited"     // human modified before approving
  | "overridden" // human said no with a reason
  | "skipped";

export type EvidenceRef = {
  // Cite-back: which account receipts justify this action.
  accountId: string;
  receiptId: string; // matches Receipt.id in portfolio.ts
};

export type EmailDraft = {
  to: string;          // "Devin Park <dpark@halcyon.health>"
  cc?: string;
  subject: string;
  body: string;
};

export type CrmUpdate = {
  object: string;      // "Account · Halcyon Health"
  field: string;       // "Renewal stage"
  before: string;      // "Commit"
  after: string;       // "Risk"
};

export type MeetingProposal = {
  attendee: string;        // "Renee Okafor (new CFO, Northwind)"
  durationMin: number;
  slots: string[];         // human-readable proposed slots
  agenda: string;
};

export type ForecastMove = {
  quarter: string;     // "Q3"
  before: number;      // dollars
  after: number;
  reason: string;
};

export type FlagPayload = {
  level: "expansion" | "risk" | "info";
  recommendation: string;
};

export type DraftAction = {
  id: string;
  kind: ActionKind;
  agent: AgentId;
  accountId: string;
  preparedAt: Date;        // when the agent staged it
  arrImpact: number;       // signed dollars at stake
  oneLine: string;         // single sentence the human reads first
  why: string;             // why now, in the agent's voice
  evidence: EvidenceRef[]; // 1-3 receipt refs
  status: ActionStatus;

  // Per-kind payload. Only one is set; the rest are undefined.
  email?: EmailDraft;
  crm?: CrmUpdate;
  meeting?: MeetingProposal;
  forecast?: ForecastMove;
  flag?: FlagPayload;
};

// ─────────────────────── Sample queue ───────────────────────
// Times keyed off of "now" so the desk always feels live.

export function buildActions(): DraftAction[] {
  return [
    {
      id: "act-quill-email",
      kind: "email",
      agent: "renewal-risk",
      accountId: "quill",
      preparedAt: hoursAgo(2),
      arrImpact: 96000,
      oneLine: "Send champion-to-champion reset to Quill before EOD — 11d to renewal.",
      why: "Procurement BCC'd a competitor's RFP rubric to us 14 days ago and Quill's champion has gone quiet. Without a written reason-why-not on the RFP shortlist by EOD, this renewal is decided without us in the room.",
      evidence: [
        { accountId: "quill", receiptId: "ql-1" },
        { accountId: "quill", receiptId: "ql-2" },
      ],
      status: "pending",
      email: {
        to: "Mara Lin <mara@quillmedia.com>",
        subject: "Quick one before Friday — staying on your shortlist",
        body: `Hi Mara,

Saw the RFP scoring rubric land in our inbox by accident two weeks ago — no harm done, but it told me what you already knew: this renewal is a real evaluation, not a renewal.

I'd rather hear it from you directly than guess from a rubric. Two asks:

1) 15 minutes this week — you and me — to walk through what's actually on the rubric and where we stand.
2) If we're not on the shortlist, I'd like to know why in writing so I can either fix it or save you a meeting.

I can do today 3-5pm or tomorrow before noon. Pick whichever, or send back a time that works.

— Sam`,
      },
    },
    {
      id: "act-halcyon-meeting",
      kind: "meeting",
      agent: "exec-silence",
      accountId: "halcyon",
      preparedAt: hoursAgo(3),
      arrImpact: 312000,
      oneLine: "Book exec-to-exec reset with Devin Park (Halcyon) — 41d to renewal, 14d of silence.",
      why: "Champion Marie left 14 days ago. Replacement Devin was the discovery-call skeptic and hasn't replied to three follow-ups. Your VP needs to land this before week 3 of silence.",
      evidence: [
        { accountId: "halcyon", receiptId: "hc-1" },
        { accountId: "halcyon", receiptId: "hc-2" },
        { accountId: "halcyon", receiptId: "hc-3" },
      ],
      status: "pending",
      meeting: {
        attendee: "Devin Park (VP Clinical Ops, Halcyon Health)",
        durationMin: 30,
        slots: ["Thu 10:30a", "Thu 3:00p", "Fri 9:00a"],
        agenda:
          "Open with the cycle-time outcome Devin already cares about (not platform). Bring one clinical-ops case study, no product slides.",
      },
    },
    {
      id: "act-northwind-crm",
      kind: "crm-update",
      agent: "champion-watch",
      accountId: "northwind",
      preparedAt: hoursAgo(4),
      arrImpact: 184000,
      oneLine: "Move Northwind from Commit → Risk and add Renee Okafor as economic buyer.",
      why: "Two separate call mentions plus a LinkedIn role change confirm Renee Okafor is the new CFO, and she's reviewing every $100k+ line in February. Our CRM still lists the old contact as decision-maker.",
      evidence: [
        { accountId: "northwind", receiptId: "nw-1" },
        { accountId: "northwind", receiptId: "nw-2" },
      ],
      status: "pending",
      crm: {
        object: "Account · Northwind Logistics",
        field: "Forecast stage · Economic buyer",
        before: "Commit · Daniel Asare",
        after: "Risk · Renee Okafor (CFO)",
      },
    },
    {
      id: "act-blueprint-flag",
      kind: "flag",
      agent: "expansion-scout",
      accountId: "blueprint",
      preparedAt: hoursAgo(6),
      arrImpact: 240000,
      oneLine: "Promote Blueprint Robotics to expansion — Phoenix + Austin standardization confirmed.",
      why: "Director of Eng wrote in Slack last week: 'we standardize on this for Phoenix and Austin starting Q1.' Procurement is on the way. Save-motion would be the wrong play; this is a proposal moment.",
      evidence: [
        { accountId: "blueprint", receiptId: "bp-1" },
        { accountId: "blueprint", receiptId: "bp-2" },
      ],
      status: "pending",
      flag: {
        level: "expansion",
        recommendation:
          "Skip the save check-in. Auto-draft a 2-site expansion proposal and pull procurement into the renewal call as one conversation.",
      },
    },
    {
      id: "act-meridian-email",
      kind: "email",
      agent: "renewal-risk",
      accountId: "meridian",
      preparedAt: hoursAgo(8),
      arrImpact: 240000,
      oneLine: "Ask Product for a written multi-currency GA date — Meridian's Q1 plan depends on it.",
      why: "The CFO said in roadmap review that their EU launch is timed to multi-currency GA. If we can't put a date in writing this week, their forecast slips and ours does too.",
      evidence: [{ accountId: "meridian", receiptId: "md-1" }],
      status: "pending",
      email: {
        to: "Priya Anand <priya@yourco.com> (PM, multi-currency)",
        subject: "Need a written GA date — Meridian forecast at risk",
        body: `Priya,

Meridian's CFO has tied their EU launch to our multi-currency GA. If the date slips, his Q1 forecast slips and ours follows — $240k ARR.

Can you send me the current confidence interval on the GA date in writing today? I don't need a guarantee, I need something I can hand to a finance team.

Happy to jump on 10 min if it's easier.

— Jordan`,
      },
    },
    {
      id: "act-pelican-flag",
      kind: "flag",
      agent: "exec-silence",
      accountId: "pelican",
      preparedAt: hoursAgo(10),
      arrImpact: 28000,
      oneLine: "Raise acquisition-risk on Pelican Foods — assignability question asked twice in 30d.",
      why: "Founder asked twice about contract assignability and mentioned a 'strategic conversation.' This doesn't show in any platform health score. Pre-build the assignment paperwork now to be useful to the buyer, not blocking.",
      evidence: [
        { accountId: "pelican", receiptId: "pl-1" },
        { accountId: "pelican", receiptId: "pl-2" },
      ],
      status: "pending",
      flag: {
        level: "info",
        recommendation:
          "Draft assignment language with legal this week. Then quietly let the founder know it's ready. Becomes a wedge with the acquirer.",
      },
    },
    {
      id: "act-tessera-crm",
      kind: "crm-update",
      agent: "champion-watch",
      accountId: "tessera",
      preparedAt: hoursAgo(12),
      arrImpact: 410000,
      oneLine: "Upgrade Tessera Bank from Yellow → Green and tag multi-year expansion opportunity.",
      why: "CIO sync transcript: 'You're table stakes. Let's talk multi-year with expanded footprint.' Three of four BUs are advocates. The fourth is an enablement gap, not a product gap — don't let it drag the score.",
      evidence: [
        { accountId: "tessera", receiptId: "ts-1" },
        { accountId: "tessera", receiptId: "ts-2" },
      ],
      status: "pending",
      crm: {
        object: "Account · Tessera Bank",
        field: "Health score · Renewal type",
        before: "Yellow (67) · 1-year",
        after: "Green (84) · Multi-year + expansion",
      },
    },
  ];
}
