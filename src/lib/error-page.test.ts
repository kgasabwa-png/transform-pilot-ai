import { describe, it, expect } from "vitest";
import { renderErrorPage } from "./error-page";

describe("renderErrorPage", () => {
  it("returns an HTML string", () => {
    const html = renderErrorPage();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("</html>");
  });

  it("contains error title", () => {
    const html = renderErrorPage();
    expect(html).toContain("This page didn't load");
  });

  it("contains a retry button", () => {
    const html = renderErrorPage();
    expect(html).toContain("Try again");
    expect(html).toContain("location.reload()");
  });

  it("contains a home link", () => {
    const html = renderErrorPage();
    expect(html).toContain('href="/"');
    expect(html).toContain("Go home");
  });

  it("sets viewport meta tag", () => {
    const html = renderErrorPage();
    expect(html).toContain('name="viewport"');
  });

  it("includes styling", () => {
    const html = renderErrorPage();
    expect(html).toContain("<style>");
  });
});
