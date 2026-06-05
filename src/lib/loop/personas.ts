// Persona-aware framing. Same engine, three different "first screens"
// depending on whether the user is the CSM doing the work, the manager
// running the team, or the leader presenting the number.
//
// Naming note: we explicitly do NOT call this "for managers vs ICs."
// Receipts augments humans — it never replaces them. The copy reflects that.

export type PersonaId = "csm" | "manager" | "leader";

export type Persona = {
  id: PersonaId;
  label: string; // Sidebar / chip label
  who: string; // who this is for
  promise: string; // 12-word morning promise
  hero: { eyebrow: string; title: string; sub: string };
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
    priorityAgents: ["renewal-risk", "expansion-scout", "exec-silence", "champion-watch"],
    topMetricLabel: "ARR mis-scored in your CRM today",
    hides: { brief: false, backtest: false, wedge: false },
  },
};

export const PERSONA_ORDER: PersonaId[] = ["csm", "manager", "leader"];
