// Drives the scripted timeline. Returns a `progress` map keyed by step
// index with { state: 'queued'|'active'|'done', tick } so panels can
// decide what to reveal.

import { useEffect, useState, useCallback } from "react";
import type { Scenario } from "./scenarios";
import { RUN_DURATION_MS } from "./scenarios";

export type StepState = "queued" | "active" | "done";

export function useRun(scenario: Scenario, autoplay = true) {
  const [startedAt, setStartedAt] = useState<number | null>(
    autoplay ? Date.now() : null,
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (startedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 80);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const elapsed = startedAt === null ? 0 : now - startedAt;
  const isComplete = startedAt !== null && elapsed >= RUN_DURATION_MS;

  const states: StepState[] = scenario.steps.map((step) => {
    if (startedAt === null) return "queued";
    if (elapsed < step.t) return "queued";
    if (elapsed < step.t + step.duration) return "active";
    return "done";
  });

  const stepProgress: number[] = scenario.steps.map((step) => {
    if (startedAt === null || elapsed < step.t) return 0;
    if (elapsed >= step.t + step.duration) return 1;
    return Math.min(1, (elapsed - step.t) / step.duration);
  });

  const replay = useCallback(() => {
    setStartedAt(Date.now());
    setNow(Date.now());
  }, []);

  return { startedAt, elapsed, isComplete, states, stepProgress, replay };
}
