// Chief of Staff — scripted demo scenarios.
// A scenario is a call that just ended + the exact artifacts the agent
// will produce across tools. Times are ms-relative to t=0 (call end).

export type Tool = "salesforce" | "gmail" | "slack" | "asana";

export type Artifact =
  | {
      tool: "salesforce";
      kind: "field-update";
      object: string; // "Opportunity · Acme Renewal Q3"
      updates: { field: string; from: string; to: string }[];
    }
  | {
      tool: "gmail";
      kind: "draft";
      to: string;
      from: string;
      subject: string;
      // body composed paragraph-by-paragraph as the agent writes it
      body: string[];
    }
  | {
      tool: "slack";
      kind: "message";
      channel: string; // "#cs-acme"
      author: string;
      lines: string[]; // each line streams in
    }
  | {
      tool: "asana";
      kind: "tasks";
      project: string;
      tasks: { title: string; owner: string; due: string }[];
    };

export type Step = {
  t: number; // ms from t=0
  duration: number; // how long the panel stays "writing"
  artifact: Artifact;
};

export type Scenario = {
  id: string;
  account: string;
  arr: number; // renewal $
  callTitle: string;
  callDuration: number; // minutes
  endedAtLabel: string; // "just now"
  participants: { name: string; role: string }[];
  heardOnCall: string; // the one-sentence signal the agent caught
  steps: Step[];
};

// One hero scenario, fully scripted. Adding more later = more bullets.
export const HERO: Scenario = {
  id: "acme-qbr",
  account: "Acme Industrial",
  arr: 480_000,
  callTitle: "Acme · Q3 QBR",
  callDuration: 47,
  endedAtLabel: "just now",
  participants: [
    { name: "Sarah Chen", role: "VP Ops · Acme" },
    { name: "Marcus Webb", role: "Director · Acme" },
    { name: "You", role: "CSM" },
  ],
  heardOnCall:
    "Sarah flagged Snowflake bill anxiety, asked for SOC 2 II by Nov 1, and Marcus said the new VP wants a demo before signing.",
  steps: [
    {
      t: 400,
      duration: 2200,
      artifact: {
        tool: "salesforce",
        kind: "field-update",
        object: "Opportunity · Acme Renewal Q3",
        updates: [
          { field: "Renewal Risk", from: "Low", to: "Medium" },
          { field: "Next Step", from: "—", to: "Exec sync w/ new VP" },
          { field: "Champion", from: "Sarah Chen", to: "Sarah Chen + Marcus Webb" },
          { field: "Blocker", from: "—", to: "SOC 2 Type II by Nov 1" },
        ],
      },
    },
    {
      t: 1100,
      duration: 4800,
      artifact: {
        tool: "gmail",
        kind: "draft",
        to: "sarah.chen@acme.com",
        from: "you@company.com",
        subject: "Acme · recap + the three things we owe you",
        body: [
          "Sarah — quick recap so nothing slips between now and renewal.",
          "On the Snowflake bill: I'm pulling our cost-per-query benchmark for your workload and will have it to you Thursday. If it's not within 15% of where you are today, we walk you through the migration math ourselves.",
          "On SOC 2 Type II: our auditor confirmed the report drops Oct 24. I've asked them to send you the bridge letter directly — should land in your inbox by EOW.",
          "On the new VP: held 30 min on her calendar Wed Oct 16, 2pm PT. I'll send the agenda and a 4-slide demo deck by Monday so she walks in warm.",
          "Anything I missed?",
        ],
      },
    },
    {
      t: 2200,
      duration: 2400,
      artifact: {
        tool: "slack",
        kind: "message",
        channel: "#cs-acme-internal",
        author: "Chief of Staff",
        lines: [
          "📞 QBR done · Sarah + Marcus · 47 min",
          "🟡 Risk bumped Low → Medium. Three reasons:",
          "  1. Snowflake cost anxiety — they want benchmark by Thu",
          "  2. SOC 2 II hard requirement by Nov 1",
          "  3. New VP joined; wants a demo before signing $480k",
          "I drafted the recap email + held the exec sync. Approve in your inbox.",
        ],
      },
    },
    {
      t: 3400,
      duration: 2200,
      artifact: {
        tool: "asana",
        kind: "tasks",
        project: "Acme · Renewal Q3",
        tasks: [
          {
            title: "Pull Snowflake cost-per-query benchmark for Acme workload",
            owner: "Solutions Eng",
            due: "Thu",
          },
          {
            title: "Forward SOC 2 II bridge letter from auditor → Sarah",
            owner: "Trust team",
            due: "Fri",
          },
          {
            title: "Build 4-slide exec demo deck for new VP",
            owner: "You",
            due: "Mon",
          },
        ],
      },
    },
  ],
};

export const RUN_DURATION_MS = 6400; // a beat after the last step finishes
export const ACTION_COUNT = 14; // 4 SF fields + 5 email paras + 6 slack lines + 3 tasks ≈ marketing rounding
export const TIME_SAVED_MIN = 47;
