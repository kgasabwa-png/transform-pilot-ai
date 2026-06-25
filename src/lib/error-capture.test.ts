import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { consumeLastCapturedError } from "./error-capture";

describe("consumeLastCapturedError", () => {
  it("returns undefined when no error has been captured", () => {
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("returns undefined on second call (consumed)", () => {
    // After any previous consume, a second call should always return undefined
    const first = consumeLastCapturedError();
    const second = consumeLastCapturedError();
    expect(second).toBeUndefined();
  });
});
