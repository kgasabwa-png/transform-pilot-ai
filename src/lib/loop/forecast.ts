// Forecast Floor data — the VP's living number.
// A rolled-up quarter total + a changelog of every dollar that moved
// this week, each one attributable to an agent and a cited moment.

import type { AgentId } from "./agents";
import { currentQuarter, daysAgo, hoursAgo } from "./time";

export type ForecastDelta = {
  id: string;
  accountId: string;
  accountName: string;
  agent: AgentId;
  delta: number;          // signed dollars
  before: number;
  after: number;
  reason: string;         // one cited sentence
  csmAware: boolean;      // has the owning CSM seen this yet?
  csm: string;
  at: Date;
};

export type ForecastSummary = {
  quarter: string;
  total: number;
  uncertainty: number; // ± dollars
  weekDelta: number;   // net change this week
  deltasThisWeek: number;
  csmBlindCount: number;     // deltas the CSM hasn't seen
  csmBlindARR: number;
};

export function buildForecastDeltas(): ForecastDelta[] {
  return [
    {
      id: "fd-1",
      accountId: "quill",
      accountName: "Quill Media",
      agent: "renewal-risk",
      delta: -180000,
      before: 96000,
      after: 0,
      reason:
        "Procurement BCC'd a competitor's RFP rubric to us 14d ago. Champion has gone quiet through 2 follow-ups. Renewal is 11d out.",
      csmAware: false,
      csm: "Sam Okafor",
      at: hoursAgo(6),
    },
    {
      id: "fd-2",
      accountId: "blueprint",
      accountName: "Blueprint Robotics",
      agent: "expansion-scout",
      delta: +240000,
      before: 64000,
      after: 304000,
      reason:
        "Director of Eng confirmed Phoenix + Austin standardization in Slack. Procurement reaching out — expansion is a foregone conclusion.",
      csmAware: true,
      csm: "Keila Ramos",
      at: hoursAgo(14),
    },
    {
      id: "fd-3",
      accountId: "halcyon",
      accountName: "Halcyon Health",
      agent: "exec-silence",
      delta: -120000,
      before: 312000,
      after: 192000,
      reason:
        "Champion departed 14d ago, replacement was the original skeptic. 3 follow-ups, zero replies. Risk-adjusted by 40%.",
      csmAware: false,
      csm: "Jordan Pace",
      at: daysAgo(1),
    },
    {
      id: "fd-4",
      accountId: "northwind",
      accountName: "Northwind Logistics",
      agent: "champion-watch",
      delta: -90000,
      before: 184000,
      after: 94000,
      reason:
        "New CFO confirmed as economic buyer through 2 call mentions + LinkedIn role change. Reviewing every $100k+ line in February.",
      csmAware: true,
      csm: "Keila Ramos",
      at: daysAgo(2),
    },
    {
      id: "fd-5",
      accountId: "tessera",
      accountName: "Tessera Bank",
      agent: "champion-watch",
      delta: +200000,
      before: 410000,
      after: 610000,
      reason:
        "CIO verbalized multi-year + expansion intent on Nov 1 sync. Three of four BUs are advocates. Upgrading from 1-year base.",
      csmAware: false,
      csm: "Sam Okafor",
      at: daysAgo(3),
    },
    {
      id: "fd-6",
      accountId: "pelican",
      accountName: "Pelican Foods",
      agent: "exec-silence",
      delta: -22000,
      before: 28000,
      after: 6000,
      reason:
        "Founder asked twice about contract assignability — strategic acquisition in progress. Risk doesn't show in platform score.",
      csmAware: true,
      csm: "Sam Okafor",
      at: daysAgo(4),
    },
  ];
}

export function summarizeForecast(deltas: ForecastDelta[]): ForecastSummary {
  const baseQuarter = 4_820_000; // synthetic but stable
  const weekDelta = deltas.reduce((s, d) => s + d.delta, 0);
  const total = baseQuarter + weekDelta;
  const blind = deltas.filter((d) => !d.csmAware);
  return {
    quarter: currentQuarter(),
    total,
    uncertainty: 310_000,
    weekDelta,
    deltasThisWeek: deltas.length,
    csmBlindCount: blind.length,
    csmBlindARR: blind.reduce((s, d) => s + Math.abs(d.delta), 0),
  };
}
