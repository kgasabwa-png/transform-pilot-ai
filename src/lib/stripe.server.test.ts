import { describe, it, expect } from "vitest";
import { getStripeErrorMessage } from "./stripe.server";

describe("getStripeErrorMessage", () => {
  it("returns generic message for null", () => {
    expect(getStripeErrorMessage(null)).toBe("Stripe request failed");
  });

  it("returns generic message for undefined", () => {
    expect(getStripeErrorMessage(undefined)).toBe("Stripe request failed");
  });

  it("returns generic message for non-object", () => {
    expect(getStripeErrorMessage("some string")).toBe("Stripe request failed");
    expect(getStripeErrorMessage(42)).toBe("Stripe request failed");
  });

  it("extracts message from object", () => {
    const err = { message: "Card declined" };
    expect(getStripeErrorMessage(err)).toBe("Card declined");
  });

  it("extracts message from raw sub-object", () => {
    const err = { raw: { message: "Card declined from raw" } };
    expect(getStripeErrorMessage(err)).toBe("Card declined from raw");
  });

  it("prefers raw.message over top-level message", () => {
    const err = {
      message: "Top level",
      raw: { message: "Raw message" },
    };
    expect(getStripeErrorMessage(err)).toBe("Raw message");
  });

  it("appends type, code, decline_code, param, requestId when present", () => {
    const err = {
      message: "Card declined",
      type: "card_error",
      code: "card_declined",
      decline_code: "insufficient_funds",
      param: "source",
      requestId: "req_abc123",
    };
    const result = getStripeErrorMessage(err);
    expect(result).toContain("Card declined");
    expect(result).toContain("card_error");
    expect(result).toContain("card_declined");
    expect(result).toContain("insufficient_funds");
    expect(result).toContain("source");
    expect(result).toContain("req_abc123");
  });

  it("appends details from raw when present", () => {
    const err = {
      message: "Error",
      raw: {
        type: "api_error",
        code: "rate_limit",
      },
    };
    const result = getStripeErrorMessage(err);
    expect(result).toContain("api_error");
    expect(result).toContain("rate_limit");
  });

  it("returns message without parens when no details exist", () => {
    const err = { message: "Simple error" };
    expect(getStripeErrorMessage(err)).toBe("Simple error");
  });

  it("returns generic for object with no message", () => {
    expect(getStripeErrorMessage({ code: "test" })).toBe("Stripe request failed");
  });

  it("returns generic for empty object", () => {
    expect(getStripeErrorMessage({})).toBe("Stripe request failed");
  });
});
