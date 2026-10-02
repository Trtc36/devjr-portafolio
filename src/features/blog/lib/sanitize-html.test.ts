import { describe, it, expect } from "vitest";
import { sanitizeInlineHtml } from "./sanitize-html";

describe("sanitizeInlineHtml", () => {
  it("strips script tags", () => {
    expect(sanitizeInlineHtml("hi<script>alert(1)</script>")).toBe("hi");
  });

  it("strips event handler attributes from img", () => {
    expect(sanitizeInlineHtml('<img src=x onerror="alert(1)">')).not.toContain("onerror");
  });

  it("strips javascript: hrefs", () => {
    expect(sanitizeInlineHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("keeps allowed formatting tags", () => {
    expect(sanitizeInlineHtml("<b>bold</b> and <i>italic</i>")).toBe("<b>bold</b> and <i>italic</i>");
  });

  it("keeps an https link with its href", () => {
    expect(sanitizeInlineHtml('<a href="https://example.com">link</a>')).toBe(
      '<a href="https://example.com">link</a>',
    );
  });
});
