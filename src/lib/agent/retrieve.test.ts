import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildQueryTerms, selectRelevantContext, turnsFromUIMessages } from "./retrieve";
import type { AgentPromise, AgentMemory } from "./context";

describe("buildQueryTerms", () => {
  it("returns empty map for no turns", () => {
    expect(buildQueryTerms([]).size).toBe(0);
  });

  it("filters stopwords", () => {
    const bag = buildQueryTerms([{ role: "user", text: "the quick fox" }]);
    expect(bag.has("the")).toBe(false);
    expect(bag.has("quick")).toBe(true);
    expect(bag.has("fox")).toBe(true);
  });

  it("filters short words (<3 chars)", () => {
    const bag = buildQueryTerms([{ role: "user", text: "go to AI lab" }]);
    expect(bag.has("go")).toBe(false);
    expect(bag.has("to")).toBe(false);
    expect(bag.has("lab")).toBe(true);
  });

  it("boosts user role over assistant", () => {
    const userBag = buildQueryTerms([{ role: "user", text: "meeting with Sarah" }]);
    const assistantBag = buildQueryTerms([{ role: "assistant", text: "meeting with Sarah" }]);
    const userMeeting = userBag.get("meeting") ?? 0;
    const assistantMeeting = assistantBag.get("meeting") ?? 0;
    expect(userMeeting).toBeGreaterThan(assistantMeeting);
  });

  it("weights later turns higher than earlier ones", () => {
    const bag = buildQueryTerms([
      { role: "user", text: "budget review" },
      { role: "user", text: "Sarah pricing" },
    ]);
    // "pricing" from the later turn should have higher weight than "budget" from the earlier turn
    const pricing = bag.get("pricing") ?? 0;
    const budget = bag.get("budget") ?? 0;
    expect(pricing).toBeGreaterThan(budget);
  });

  it("only uses last 6 turns", () => {
    const turns = Array.from({ length: 10 }, (_, i) => ({
      role: "user",
      text: `turntoken${i} xylophone${i}word`,
    }));
    const bag = buildQueryTerms(turns);
    // turn0..turn3 are outside the last-6 window; tokens must be >=3 chars, no stopwords
    expect(bag.has("xylophone0word")).toBe(false);
    expect(bag.has("xylophone9word")).toBe(true);
  });
});

describe("turnsFromUIMessages", () => {
  it("extracts text parts from UIMessages", () => {
    const msgs = [
      {
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
      },
      {
        role: "assistant",
        parts: [{ type: "text", text: "Hi there" }, { type: "tool-invocation" }],
      },
    ];
    const turns = turnsFromUIMessages(msgs);
    expect(turns).toHaveLength(2);
    expect(turns[0]).toEqual({ role: "user", text: "Hello" });
    expect(turns[1]).toEqual({ role: "assistant", text: "Hi there" });
  });

  it("skips messages with no text parts", () => {
    const msgs = [
      { role: "assistant", parts: [{ type: "tool-invocation" }] },
      { role: "user", parts: [{ type: "text", text: "hi" }] },
    ];
    const turns = turnsFromUIMessages(msgs);
    expect(turns).toHaveLength(1);
    expect(turns[0].role).toBe("user");
  });

  it("handles messages with no parts array", () => {
    const turns = turnsFromUIMessages([{ role: "user" }]);
    expect(turns).toHaveLength(0);
  });

  it("joins multiple text parts with space", () => {
    const msgs = [
      {
        role: "user",
        parts: [
          { type: "text", text: "part one" },
          { type: "text", text: "part two" },
        ],
      },
    ];
    const turns = turnsFromUIMessages(msgs);
    expect(turns[0].text).toBe("part one part two");
  });
});

describe("selectRelevantContext", () => {
  const now = Date.now();

  function makePromise(overrides: Partial<AgentPromise> = {}): AgentPromise {
    return {
      id: "p-1",
      summary: "Send pricing deck to Sarah",
      owed_to: "Sarah",
      channel: "email",
      due_at: new Date(now + 24 * 3600_000).toISOString(), // due in 1 day
      evidence_snippet: "I'll send the pricing deck",
      status: "open",
      ...overrides,
    };
  }

  function makeMemory(overrides: Partial<AgentMemory> = {}): AgentMemory {
    return {
      id: "m-1",
      title: "Meeting with Sarah about pricing",
      snippet: "Discussed Q3 pricing strategy",
      kind: "meeting",
      occurred_at: new Date(now - 3600_000).toISOString(), // 1 hour ago
      ...overrides,
    };
  }

  it("returns totals matching input array lengths", () => {
    const result = selectRelevantContext({
      turns: [],
      promises: [makePromise(), makePromise({ id: "p-2" })],
      memory: [makeMemory()],
    });
    expect(result.totals).toEqual({ promises: 2, memory: 1 });
  });

  it("respects promiseLimit", () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      makePromise({ id: `p-${i}`, summary: `Promise ${i}` }),
    );
    const result = selectRelevantContext({
      turns: [],
      promises,
      memory: [],
      promiseLimit: 5,
    });
    expect(result.promises).toHaveLength(5);
  });

  it("respects memoryLimit", () => {
    const memory = Array.from({ length: 20 }, (_, i) =>
      makeMemory({ id: `m-${i}`, title: `Memory ${i}` }),
    );
    const result = selectRelevantContext({
      turns: [],
      promises: [],
      memory,
      memoryLimit: 3,
    });
    expect(result.memory).toHaveLength(3);
  });

  it("prioritizes overdue promises", () => {
    const overdue = makePromise({
      id: "overdue",
      summary: "Overdue task",
      due_at: new Date(now - 86400_000).toISOString(),
      status: "open",
    });
    const future = makePromise({
      id: "future",
      summary: "Far future task",
      due_at: new Date(now + 30 * 86400_000).toISOString(),
      status: "open",
    });
    const result = selectRelevantContext({
      turns: [],
      promises: [future, overdue],
      memory: [],
    });
    // Overdue should come first (must-include + higher due score)
    expect(result.promises[0].id).toBe("overdue");
  });

  it("ranks promises by keyword match when query is present", () => {
    const match = makePromise({
      id: "match",
      summary: "Budget review spreadsheet",
    });
    const noMatch = makePromise({
      id: "no-match",
      summary: "Unrelated completely different topic",
      due_at: new Date(now + 365 * 86400_000).toISOString(), // far future, low due boost
      status: "done",
    });
    const result = selectRelevantContext({
      turns: [{ role: "user", text: "What about the budget review?" }],
      promises: [noMatch, match],
      memory: [],
    });
    // "match" should score higher due to keyword overlap with the query
    const matchIdx = result.promises.findIndex((p) => p.id === "match");
    const noMatchIdx = result.promises.findIndex((p) => p.id === "no-match");
    expect(matchIdx).toBeLessThan(noMatchIdx);
  });

  it("ranks memory by keyword match when query present", () => {
    const match = makeMemory({
      id: "m-match",
      title: "Budget review notes",
      occurred_at: new Date(now - 30 * 86400_000).toISOString(), // old
    });
    const noMatch = makeMemory({
      id: "m-no",
      title: "Random unrelated item",
      occurred_at: new Date(now - 30 * 86400_000).toISOString(), // old
    });
    const result = selectRelevantContext({
      turns: [{ role: "user", text: "What about the budget review?" }],
      promises: [],
      memory: [noMatch, match],
    });
    expect(result.memory[0].id).toBe("m-match");
  });

  it("handles empty inputs gracefully", () => {
    const result = selectRelevantContext({
      turns: [],
      promises: [],
      memory: [],
    });
    expect(result.promises).toEqual([]);
    expect(result.memory).toEqual([]);
    expect(result.totals).toEqual({ promises: 0, memory: 0 });
  });
});
