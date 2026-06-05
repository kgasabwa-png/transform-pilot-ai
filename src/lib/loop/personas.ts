// Persona-aware framing. Same engine, three different "first screens"
// depending on whether the user is the CSM doing the work, the manager
// running the team, or the leader presenting the number.

export type PersonaId = "csm" | "manager" | "leader";

export type Persona = {
  id: PersonaId;
  label: string;
  who: string;
  promise: string;
  hero: { eyebrow: string; title: string; sub: string };
  playFraming: { eyebrow: string; question: string };
  watchlistTitle: string;
  watchlistSub: string;
  priorityAgents: ("champion-watch" | "renewal-risk" | "expansion-scout" | "exec-silence")[];
  topMetricLabel: string;
  hides: { brief?: boolean; backtest?: boolean; wedge?: boolean };
};

export const PERSONAS: Record<PersonaId, Persona> = {
  csm: {
    id: "csm",
    label: "CSM / Renewals",
    who: "The CSM or renewals manager carrying the book.",
    promise: "Walk in ready, not behind. Three plays before lunch.",
    hero: {
      eyebrow: "Your morning · Tue Nov 11 · 7:42a",
      title: "Three plays before lunch. Every claim cited.",
      sub: "Your night-shift research desk read every call, Slack, and email on your book overnight. You walk in with a 90-second brief — not a 60-tab inbox.",
    },
    playFraming: {
      eyebrow: "Your play",
      question: "What you should do in the next 48 hours.",
    },
    watchlistTitle: "Every account on your book — scored on what the customer actually said.",
    watchlistSub: "Sorted by where your CRM is most wrong.",
    priorityAgents: ["renewal-risk", "exec-silence", "champion-watch", "expansion-scout"],
    topMetricLabel: "Your three plays today",
    hides: { backtest: true, wedge: true },
  },
  manager: {
    id: "manager",
    label: "CS Manager",
    who: "The middle manager coaching 6–10 CSMs.",
    promise: "See where the team is flying blind — before the QBR.",
    hero: {
      eyebrow: "Team rollup · 8 CSMs · 312 accounts",
      title: "Coach where the gap is widest.",
      sub: "See every account on your team where the in-CRM score and the conversation-grade score disagree by 20+. That's where coaching has the highest ROI this week.",
    },
    playFraming: {
      eyebrow: "Coaching moment",
      question: "Where your CSM's read disagrees with the room. Use this at 1:1 this week.",
    },
    watchlistTitle: "Your team's biggest blind spots.",
    watchlistSub: "Largest CRM-vs-conversation gaps across all 8 CSMs · sorted by ARR impact.",
    priorityAgents: ["renewal-risk", "champion-watch", "expansion-scout", "exec-silence"],
    topMetricLabel: "Largest CRM-vs-conversation gaps",
    hides: { brief: false, backtest: true },
  },
  leader: {
    id: "leader",
    label: "VP / Chief Customer Officer",
    who: "The CCO, VP CS, or Head of Renewals owning the number.",
    promise: "A renewal forecast your CFO will finally trust.",
    hero: {
      eyebrow: "Forecast · Q1 · cited",
      title: "The renewal number your CFO can audit.",
      sub: "Every score rebuilt from the customer's own voice — and every claim cited back to the exact moment they said it. Drill from forecast → account → quote.",
    },
    playFraming: {
      eyebrow: "Forecast impact",
      question: "How this account moves the Q1 number, and the moment in a call that proves it.",
    },
    watchlistTitle: "ARR mis-scored in your CRM today.",
    watchlistSub: "Every account where the conversation grade disagrees with the platform score by 20+ points.",
    priorityAgents: ["renewal-risk", "expansion-scout", "exec-silence", "champion-watch"],
    topMetricLabel: "ARR mis-scored in your CRM today",
    hides: { brief: false, backtest: false, wedge: false },
  },
};

export const PERSONA_ORDER: PersonaId[] = ["csm", "manager", "leader"];
