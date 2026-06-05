// "Today's Brief" — the daily-use hook. Three actions a CSM should do
// before lunch, each tied to an account in the portfolio. This is what
// turns the demo into a tool a person opens every morning.

import { ACCOUNTS } from "./portfolio";

export type BriefItem = {
  rank: 1 | 2 | 3;
  accountId: string;
  urgency: "now" | "today" | "this-week";
  action: string;
  because: string;
  arrAtStake: number;
};

export const TODAYS_BRIEF: BriefItem[] = [
  {
    rank: 1,
    accountId: "quill",
    urgency: "now",
    action: "Call Quill's champion. Get on the RFP shortlist or get the reason why not — in writing — by EOD.",
    because: "11 days to renewal. Procurement BCC'd a competitor's scoring rubric to us 14 days ago. Champion has gone quiet.",
    arrAtStake: 96000,
  },
  {
    rank: 2,
    accountId: "halcyon",
    urgency: "today",
    action: "Land an exec-to-exec call with Devin this week. Lead with clinical-ops outcome, not product.",
    because: "Champion left 14 days ago. Replacement was the discovery-call skeptic. Three follow-ups, zero replies.",
    arrAtStake: 312000,
  },
  {
    rank: 3,
    accountId: "northwind",
    urgency: "this-week",
    action: "Draft a CFO-framed value brief (cost per delivered mile). Get it to Priya by Friday — before the budget meeting socializes.",
    because: "New CFO is reviewing every $100k+ line item. Competitor look-alike is already in the procedural evaluation.",
    arrAtStake: 184000,
  },
];

export function briefAccount(id: string) {
  return ACCOUNTS.find((a) => a.id === id);
}
