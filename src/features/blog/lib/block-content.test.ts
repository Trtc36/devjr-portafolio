import { describe, it, expect } from "vitest";
import { sanitizeBlogContentDocument } from "./block-content";
import type { BlogContentDocument } from "./block-content";

describe("sanitizeBlogContentDocument", () => {
  it("sanitizes paragraph, header and image caption text", () => {
    const doc: BlogContentDocument = {
      blocks: [
        { type: "paragraph", data: { text: "<script>alert(1)</script>safe" } },
        { type: "header", data: { text: "<img onerror=alert(1)>title", level: 2 } },
        { type: "image", data: { caption: "<script>alert(1)</script>caption", file: { url: "https://x/y.png" } } },
      ],
    };
    const result = sanitizeBlogContentDocument(doc);
    expect(result.blocks[0]).toMatchObject({ data: { text: "safe" } });
    expect((result.blocks[1] as { data: { text: string } }).data.text).toBe("title");
    expect((result.blocks[2] as { data: { caption: string } }).data.caption).toBe("caption");
  });

  it("sanitizes nested list items at every depth", () => {
    const doc: BlogContentDocument = {
      blocks: [
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "<script>alert(1)</script>top",
              { content: "<script>alert(2)</script>mid", items: ["<script>alert(3)</script>deep"] },
            ],
          },
        },
      ],
    };
    const result = sanitizeBlogContentDocument(doc);
    const items = (result.blocks[0] as { data: { items: unknown[] } }).data.items;
    expect(items[0]).toBe("top");
    expect((items[1] as { content: string }).content).toBe("mid");
    expect((items[1] as { items: string[] }).items[0]).toBe("deep");
  });

  it("does not sanitize code blocks", () => {
    const doc: BlogContentDocument = { blocks: [{ type: "code", data: { code: "<script>x</script>" } }] };
    const result = sanitizeBlogContentDocument(doc);
    expect((result.blocks[0] as { data: { code: string } }).data.code).toBe("<script>x</script>");
  });
});
