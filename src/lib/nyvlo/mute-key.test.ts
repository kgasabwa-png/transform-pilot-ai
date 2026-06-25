import { describe, it, expect } from "vitest";
import { deriveMuteKey } from "./mute-key";

describe("deriveMuteKey", () => {
  it("returns unknown for empty string", () => {
    const result = deriveMuteKey("");
    expect(result).toEqual({ key: "url:unknown", label: "Unknown source" });
  });

  it("returns raw-url fallback for non-URL strings", () => {
    const result = deriveMuteKey("not a url at all");
    expect(result.key).toBe("url:not a url at all");
    expect(result.label).toBe("not a url at all");
  });

  it("truncates long non-URL key to 200 chars", () => {
    const long = "x".repeat(300);
    const result = deriveMuteKey(long);
    expect(result.key).toBe(`url:${long.slice(0, 200)}`);
    expect(result.label).toBe(long.slice(0, 80));
  });

  // Gmail
  it("extracts Gmail thread id from hash", () => {
    const result = deriveMuteKey(
      "https://mail.google.com/mail/u/0/#inbox/FMfcgzQXJZhRKfDsNjblTVpUnMMBpjqz",
    );
    expect(result.key).toBe("gmail:thread:FMfcgzQXJZhRKfDsNjblTVpUnMMBpjqz");
    expect(result.label).toContain("Gmail thread");
  });

  it("falls back to generic for Gmail without thread id", () => {
    const result = deriveMuteKey("https://mail.google.com/mail/u/0/#inbox");
    expect(result.key).toBe("url:mail.google.com/mail");
  });

  // Slack
  it("extracts Slack channel id", () => {
    const result = deriveMuteKey("https://app.slack.com/client/T12345678/C98765432");
    expect(result.key).toBe("slack:channel:C98765432");
    expect(result.label).toBe("Slack channel C98765432");
  });

  it("falls back for Slack URL without channel pattern", () => {
    const result = deriveMuteKey("https://app.slack.com/plans");
    expect(result.key).toBe("url:app.slack.com/plans");
  });

  // Linear
  it("extracts Linear issue key", () => {
    const result = deriveMuteKey("https://linear.app/team/ENG/issue/ENG-123/fix-the-bug");
    expect(result.key).toBe("linear:issue:ENG-123");
    expect(result.label).toBe("Linear ENG-123");
  });

  it("falls back for Linear URL without issue pattern", () => {
    const result = deriveMuteKey("https://linear.app/settings");
    expect(result.key).toBe("url:linear.app/settings");
  });

  // Notion
  it("extracts Notion page id from URL", () => {
    const pageId = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";
    const result = deriveMuteKey(`https://www.notion.so/workspace/My-Page-${pageId}`);
    expect(result.key).toBe(`notion:page:${pageId}`);
    expect(result.label).toContain("Notion page");
  });

  it("handles notion.site domains", () => {
    const pageId = "abcdef0123456789abcdef0123456789";
    const result = deriveMuteKey(`https://team.notion.site/Page-Title-${pageId}`);
    expect(result.key).toBe(`notion:page:${pageId}`);
  });

  it("falls back for Notion URL without 32-char page id", () => {
    const result = deriveMuteKey("https://www.notion.so/workspace");
    expect(result.key).toBe("url:notion.so/workspace");
  });

  // Generic fallback
  it("uses host + first path segment for unknown URLs", () => {
    const result = deriveMuteKey("https://example.com/docs/page");
    expect(result.key).toBe("url:example.com/docs");
    expect(result.label).toBe("example.com/docs");
  });

  it("strips www prefix in generic fallback", () => {
    const result = deriveMuteKey("https://www.example.com/about");
    expect(result.key).toBe("url:example.com/about");
  });

  it("handles root URL with no path segments", () => {
    const result = deriveMuteKey("https://example.com");
    expect(result.key).toBe("url:example.com");
    expect(result.label).toBe("example.com");
  });
});
