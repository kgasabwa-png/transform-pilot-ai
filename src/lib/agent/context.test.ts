import { describe, it, expect } from "vitest";
import { buildSystemPrompt, type AgentPromise, type AgentMemory } from "./context";

describe("buildSystemPrompt", () => {
  const basePromise: AgentPromise = {
    id: "p-1",
    summary: "Send pricing deck",
    owed_to: "Sarah",
    channel: "email",
    due_at: "2025-01-15T10:00:00Z",
    evidence_snippet: "I'll send it over by Friday",
    status: "open",
  };

  const baseMemory: AgentMemory = {
    id: "m-1",
    title: "Q3 Planning meeting",
    snippet: "Discussed roadmap priorities",
    kind: "meeting",
    occurred_at: "2025-01-10T14:00:00Z",
  };

  it("includes the user's name", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [],
      memory: [],
    });
    expect(prompt).toContain("Alice");
  });

  it("includes today's date", () => {
    const prompt = buildSystemPrompt({
      userName: "Bob",
      promises: [],
      memory: [],
    });
    // Should contain a weekday name (Monday, Tuesday, etc.)
    expect(prompt).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
  });

  it("shows no promises placeholder when list is empty", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [],
      memory: [],
    });
    expect(prompt).toContain("(no open promises tracked yet)");
  });

  it("shows no memory placeholder when list is empty", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [],
      memory: [],
    });
    expect(prompt).toContain("(no memory items captured yet)");
  });

  it("formats promises with numbered list", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [basePromise],
      memory: [],
    });
    expect(prompt).toContain('1. [p-1] "Send pricing deck"');
    expect(prompt).toContain("owed to Sarah");
    expect(prompt).toContain("email");
    expect(prompt).toContain("open");
  });

  it("includes evidence snippet when present", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [basePromise],
      memory: [],
    });
    expect(prompt).toContain("I'll send it over by Friday");
  });

  it("omits owed_to when null", () => {
    const noOwed = { ...basePromise, owed_to: null };
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [noOwed],
      memory: [],
    });
    expect(prompt).not.toContain("owed to");
  });

  it("omits evidence snippet when null", () => {
    const noEvidence = { ...basePromise, evidence_snippet: null };
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [noEvidence],
      memory: [],
    });
    expect(prompt).not.toContain("Evidence:");
  });

  it("formats memory items", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [],
      memory: [baseMemory],
    });
    expect(prompt).toContain("Q3 Planning meeting");
    expect(prompt).toContain("Discussed roadmap priorities");
    expect(prompt).toContain("meeting");
  });

  it("omits memory snippet when null", () => {
    const noSnippet = { ...baseMemory, snippet: null };
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [],
      memory: [noSnippet],
    });
    expect(prompt).toContain("Q3 Planning meeting");
    // Memory line should NOT contain " — " between title and kind
    const memorySection = prompt.split("# Memory items")[1] ?? "";
    expect(memorySection).toContain("- Q3 Planning meeting (meeting)");
    expect(memorySection).not.toContain("Q3 Planning meeting — ");
  });

  it("shows totals when provided", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [basePromise],
      memory: [baseMemory],
      totals: { promises: 42, memory: 100 },
    });
    expect(prompt).toContain("showing 1 of 42 promises");
    expect(prompt).toContain("1 of 100 memory items");
  });

  it("handles invalid due_at gracefully", () => {
    const badDue = { ...basePromise, due_at: "not-a-date" };
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [badDue],
      memory: [],
    });
    expect(prompt).toContain("no due date");
  });

  it("handles null due_at", () => {
    const noDue = { ...basePromise, due_at: null };
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [noDue],
      memory: [],
    });
    expect(prompt).toContain("no due date");
  });

  it("formats valid due_at as ISO string", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [basePromise],
      memory: [],
    });
    expect(prompt).toContain("2025-01-15T10:00:00.000Z");
  });

  it("includes channel fallback to 'note'", () => {
    const noChannel = { ...basePromise, channel: null };
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [noChannel],
      memory: [],
    });
    expect(prompt).toContain("note");
  });

  it("includes tool descriptions", () => {
    const prompt = buildSystemPrompt({
      userName: "Alice",
      promises: [],
      memory: [],
    });
    expect(prompt).toContain("draft_email_reply");
    expect(prompt).toContain("prep_meeting_brief");
    expect(prompt).toContain("research_person");
    expect(prompt).toContain("search_memory");
  });
});
