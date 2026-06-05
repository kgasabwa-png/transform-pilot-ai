// CoachingMoments — what the Coaching Room shows to a CS manager.
// Each one is a specific, replayable moment from a CSM's call this week
// plus an agent-drafted next-time line the manager can send or save.

import { daysAgo, hoursAgo } from "./time";

export type Severity = "high" | "medium" | "low";

export type CoachingMoment = {
  id: string;
  csm: string;
  csmInitials: string;
  accountId: string;
  accountName: string;
  callDate: Date;
  momentTimestamp: string; // "00:14:22" in the call
  callDurationMin: number;
  severity: Severity;
  arrUpside: number;        // ARR likely added if pattern is fixed
  headline: string;         // what the manager sees first
  transcriptSnippet: {
    customer: string;
    csmSaid: string;
  };
  whatToSayNextTime: string;
  pattern?: string;         // optional: "3rd time this month"
  status: "pending" | "sent" | "saved";
};

export type TeamPattern = {
  id: string;
  headline: string;
  detail: string;
  csmCount: number;
  missCount: number;
  arrUpside: number;
};

export function buildCoachingMoments(): CoachingMoment[] {
  return [
    {
      id: "cm-1",
      csm: "Maya Patel",
      csmInitials: "MP",
      accountId: "tessera",
      accountName: "Tessera Bank",
      callDate: hoursAgo(18),
      momentTimestamp: "00:14:22",
      callDurationMin: 47,
      severity: "high",
      arrUpside: 240000,
      headline: "Missed a multi-year expansion opening from the CIO. Pulled to the discount talk instead.",
      transcriptSnippet: {
        customer:
          "You're table stakes for us now. I'd like to talk multi-year with an expanded footprint at the next review.",
        csmSaid:
          "Totally — and on pricing, we can definitely look at a renewal incentive for committing early...",
      },
      whatToSayNextTime:
        "When a CIO says 'table stakes + expanded footprint,' the next 30 seconds is exec packaging, not pricing. Try: 'That's a different conversation than the renewal — can I bring our VP for a 20-min on what footprint you're imagining?'",
      pattern: "2nd missed expansion signal this month",
      status: "pending",
    },
    {
      id: "cm-2",
      csm: "Dre Williams",
      csmInitials: "DW",
      accountId: "halcyon",
      accountName: "Halcyon Health",
      callDate: hoursAgo(40),
      momentTimestamp: "00:08:11",
      callDurationMin: 32,
      severity: "high",
      arrUpside: 312000,
      headline: "Champion transition mentioned in passing — Dre didn't pause to map the new buyer.",
      transcriptSnippet: {
        customer:
          "Oh, fyi Marie's leaving Friday. Devin's taking over — you've met him.",
        csmSaid:
          "Got it, thanks for the heads up. So back to the QBR data...",
      },
      whatToSayNextTime:
        "Champion transition mid-call beats the agenda. Try: 'Wait — that changes the renewal. Can we spend 10 min on what Devin cares about so I don't show up cold?'",
      pattern: "3rd time this quarter Dre stayed on agenda through a champion change",
      status: "pending",
    },
    {
      id: "cm-3",
      csm: "Dre Williams",
      csmInitials: "DW",
      accountId: "quill",
      accountName: "Quill Media",
      callDate: daysAgo(3),
      momentTimestamp: "00:22:47",
      callDurationMin: 28,
      severity: "medium",
      arrUpside: 96000,
      headline: "Over-discounted in final-stage without flagging exec approval threshold.",
      transcriptSnippet: {
        customer: "We get value but the per-seat pricing is the conversation every renewal.",
        csmSaid: "I can probably get you 20% off if we lock in today.",
      },
      whatToSayNextTime:
        "20% triggers the exec-approval line. Don't offer it as a 'probably' — that signals to procurement we'll go further. Try: 'Pricing is a conversation we should have with Maya from our side too — let me set that up.'",
      pattern: "3 deals this week dropped >15% in final stage",
      status: "pending",
    },
    {
      id: "cm-4",
      csm: "Lou Hernandez",
      csmInitials: "LH",
      accountId: "northwind",
      accountName: "Northwind Logistics",
      callDate: daysAgo(2),
      momentTimestamp: "00:05:18",
      callDurationMin: 41,
      severity: "medium",
      arrUpside: 184000,
      headline: "New economic buyer (CFO) named twice — Lou kept the deck on the original champion.",
      transcriptSnippet: {
        customer:
          "Our new CFO Renee is the one asking the hard questions about routing spend.",
        csmSaid: "Right — so as Daniel saw in our last review, the lane optimizer...",
      },
      whatToSayNextTime:
        "Two mentions of a new economic buyer means rebuild the meeting. Try: 'Let's stop and put Renee at the center for a minute — what's the framing she'd find most useful?'",
      status: "pending",
    },
  ];
}

export function buildTeamPatterns(): TeamPattern[] {
  return [
    {
      id: "tp-1",
      headline: "Team is missing procurement signals — 4 in 30 days.",
      detail:
        "When procurement enters a renewal conversation, your team treats it as an FYI. It's actually the buying-process signal. A 20-min workshop closes this gap.",
      csmCount: 5,
      missCount: 4,
      arrUpside: 620000,
    },
    {
      id: "tp-2",
      headline: "Discounting drift: 3 deals dropped >15% without exec sign-off.",
      detail:
        "Three CSMs offered 15%+ discounts in final-stage calls without flagging the exec-approval threshold. Procurement noticed.",
      csmCount: 3,
      missCount: 3,
      arrUpside: 180000,
    },
  ];
}
