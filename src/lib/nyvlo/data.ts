// Seeded demo data for Nyvlo. Pure functions / static objects — no backend yet.

export type Confidence = "high" | "medium" | "low";
export type PromiseStatus = "overdue" | "today" | "pending" | "upcoming" | "done";

export interface PromiseItem {
  id: string;
  title: string;
  person: string;
  company?: string;
  sourceKind: "meeting" | "note" | "page" | "email" | "calendar";
  sourceLabel: string;
  sourceQuote: string;
  capturedAt: string;       // ISO
  dueLabel: string;         // "Today", "Friday", "Overdue 2d"
  status: PromiseStatus;
  confidence: Confidence;
  draft?: string;
}

export interface MemoryItem {
  id: string;
  at: string;               // ISO
  kind: "meeting" | "note" | "page" | "email" | "calendar";
  title: string;
  detail?: string;
  url?: string;
  people?: string[];
}

export interface MeetingItem {
  id: string;
  title: string;
  whenLabel: string;
  startISO: string;
  attendees: string[];
  prep?: string;
}

export const user = {
  name: "Keila",
  email: "keila@nyvlo.com",
  timezone: "America/New_York",
};

export const promises: PromiseItem[] = [
  {
    id: "p1",
    title: "Send pricing deck to Sarah",
    person: "Sarah Chen",
    company: "Acme Analytics",
    sourceKind: "meeting",
    sourceLabel: "Acme — pricing sync",
    sourceQuote: "\"I'll get the updated pricing deck over to you by Friday so we can take it to the CFO.\"",
    capturedAt: "2026-06-17T15:10:00Z",
    dueLabel: "Overdue · 2 days",
    status: "overdue",
    confidence: "high",
    draft: "Hi Sarah — attaching the updated pricing deck I promised on Tuesday. I included the Enterprise tier we discussed plus the 2-year option for the CFO conversation. Happy to walk through it live Thursday if useful.\n\n— Keila",
  },
  {
    id: "p2",
    title: "Reply to David — recruiter scheduling",
    person: "David Okafor",
    company: "Luma Labs",
    sourceKind: "email",
    sourceLabel: "Re: Luma Labs · interview slot",
    sourceQuote: "\"Let me know which of these three times works and I'll lock it in.\"",
    capturedAt: "2026-06-16T20:42:00Z",
    dueLabel: "Overdue · 3 days",
    status: "overdue",
    confidence: "high",
    draft: "Hey David — sorry for the slow turn. Friday 2pm ET works best. Send me the calendar invite and I'll be ready. Looking forward.\n\n— Keila",
  },
  {
    id: "p3",
    title: "Share Q3 roadmap with Maria",
    person: "Maria Lopez",
    company: "Northwind",
    sourceKind: "note",
    sourceLabel: "Manual note · Northwind QBR",
    sourceQuote: "\"Promised Maria I'd send the Q3 roadmap once it's signed off internally.\"",
    capturedAt: "2026-06-18T13:05:00Z",
    dueLabel: "Today",
    status: "today",
    confidence: "high",
  },
  {
    id: "p4",
    title: "Review proposal from Mike",
    person: "Mike Tanaka",
    company: "Helix",
    sourceKind: "email",
    sourceLabel: "Helix proposal v3",
    sourceQuote: "\"Would love your take on section 4 before we send it client-side.\"",
    capturedAt: "2026-06-15T11:30:00Z",
    dueLabel: "Overdue · 4 days",
    status: "overdue",
    confidence: "medium",
  },
  {
    id: "p5",
    title: "Follow up on Acme renewal terms",
    person: "Sarah Chen",
    company: "Acme Analytics",
    sourceKind: "meeting",
    sourceLabel: "Acme — pricing sync",
    sourceQuote: "\"We'll need a final answer on the multi-year discount before end of month.\"",
    capturedAt: "2026-06-17T15:24:00Z",
    dueLabel: "Friday",
    status: "pending",
    confidence: "medium",
  },
  {
    id: "p6",
    title: "Prep notes for Luma interview",
    person: "Self",
    sourceKind: "calendar",
    sourceLabel: "Friday 2pm · Luma final round",
    sourceQuote: "\"Final round — meet the founding team. Bring portfolio.\"",
    capturedAt: "2026-06-19T09:00:00Z",
    dueLabel: "Friday",
    status: "upcoming",
    confidence: "high",
  },
  {
    id: "p7",
    title: "Intro Jordan to the design team",
    person: "Jordan Pham",
    sourceKind: "note",
    sourceLabel: "Coffee w/ Jordan",
    sourceQuote: "\"Said I'd intro him to Priya this week.\"",
    capturedAt: "2026-06-18T22:11:00Z",
    dueLabel: "This week",
    status: "pending",
    confidence: "low",
  },
  {
    id: "p8",
    title: "Send the OKR doc you mentioned in standup",
    person: "Team",
    sourceKind: "page",
    sourceLabel: "Saved · OKR template",
    sourceQuote: "\"I'll drop the OKR template in the team channel after standup.\"",
    capturedAt: "2026-06-19T14:02:00Z",
    dueLabel: "Done",
    status: "done",
    confidence: "high",
  },
];

export const meetings: MeetingItem[] = [
  {
    id: "m1",
    title: "Northwind QBR",
    whenLabel: "Today · 10:00",
    startISO: "2026-06-19T14:00:00Z",
    attendees: ["Maria Lopez", "Devon Park"],
    prep: "Bring Q3 roadmap. Maria flagged budget concerns last QBR.",
  },
  {
    id: "m2",
    title: "1:1 with manager",
    whenLabel: "Today · 15:30",
    startISO: "2026-06-19T19:30:00Z",
    attendees: ["Priya Raman"],
  },
  {
    id: "m3",
    title: "Luma Labs — final round",
    whenLabel: "Friday · 14:00",
    startISO: "2026-06-20T18:00:00Z",
    attendees: ["David Okafor", "+ founding team"],
    prep: "Portfolio + 2 case studies. David asked about the Granola redesign.",
  },
];

export const memories: MemoryItem[] = [
  { id: "x1", at: "2026-06-19T18:42:00Z", kind: "note", title: "Promised Maria the Q3 roadmap", detail: "After standup — said I'd send once signed off." },
  { id: "x2", at: "2026-06-19T17:05:00Z", kind: "page", title: "Acme — pricing v4", url: "notion.so/acme-pricing-v4" },
  { id: "x3", at: "2026-06-19T14:00:00Z", kind: "meeting", title: "Northwind QBR", people: ["Maria Lopez", "Devon Park"] },
  { id: "x4", at: "2026-06-18T22:11:00Z", kind: "note", title: "Coffee w/ Jordan", detail: "Said I'd intro him to Priya." },
  { id: "x5", at: "2026-06-18T15:30:00Z", kind: "email", title: "Re: Helix proposal v3", detail: "Mike asked for review of section 4." },
  { id: "x6", at: "2026-06-17T15:10:00Z", kind: "meeting", title: "Acme — pricing sync", people: ["Sarah Chen"] },
  { id: "x7", at: "2026-06-17T11:22:00Z", kind: "page", title: "OKR template — engineering", url: "coda.io/okr-template" },
  { id: "x8", at: "2026-06-16T20:42:00Z", kind: "email", title: "Luma Labs · interview slot", detail: "David sent 3 times." },
];

export const reliability = {
  promisesMade: 27,
  completed: 24,
  forgotten: 3,
  score: 89,
  weekDeltas: [4, 6, 3, 8, 5, 1, 0], // sparkline
};

export function answerCommand(q: string): string {
  const x = q.toLowerCase();
  if (x.includes("forget") || x.includes("forgot") || x.includes("owe") || x.includes("overdue")) {
    return [
      "You're sitting on 4 things that need attention:",
      "",
      "1. Send pricing deck to Sarah Chen (Acme) — promised Tuesday, overdue 2 days. Draft ready.",
      "2. Reply to David at Luma about the interview slot — he sent 3 times, you haven't picked one.",
      "3. Review section 4 of Mike's Helix proposal — he asked Sunday.",
      "4. Share Q3 roadmap with Maria — due today after the QBR.",
    ].join("\n");
  }
  if (x.includes("sarah")) {
    return "Sarah Chen (Acme Analytics): in Tuesday's pricing sync she asked for the updated pricing deck by Friday, and flagged she needs a final answer on multi-year discount before end of month. Both still open.";
  }
  if (x.includes("tomorrow") || x.includes("prep")) {
    return "Tomorrow you have Acme QBR at 10am — Maria last flagged budget concerns, bring the Q3 roadmap. Friday is the Luma final round at 2pm — David asked about the Granola redesign in your last call.";
  }
  if (x.includes("week") || x.includes("summarize") || x.includes("recap")) {
    return "This week: 27 commitments made, 24 completed, 3 still open. Most discussed: pricing (Acme), hiring (Luma), Q3 planning (Northwind). Your reliability score: 89.";
  }
  return "I checked your last 7 days of memory. Nothing urgent matches that question — try \"what am I forgetting?\" or \"what did I promise Sarah?\"";
}
