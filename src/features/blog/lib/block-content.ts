import { sanitizeInlineHtml } from "./sanitize-html";

export type BlogParagraphBlock = {
  id?: string;
  type: "paragraph";
  data: {
    text: string;
  };
};

export type BlogHeaderBlock = {
  id?: string;
  type: "header";
  data: {
    text: string;
    level?: number;
  };
};

export type BlogCodeBlock = {
  id?: string;
  type: "code";
  data: {
    code: string;
  };
};

export type BlogImageBlock = {
  id?: string;
  type: "image";
  data: {
    caption?: string;
    file?: {
      url?: string;
    };
    url?: string;
  };
};

export type BlogListItem =
  | string
  | {
      content: string;
      items?: BlogListItem[];
    };

export type BlogListBlock = {
  id?: string;
  type: "list";
  data: {
    style?: "ordered" | "unordered";
    items: BlogListItem[];
  };
};

export type BlogContentBlock =
  | BlogParagraphBlock
  | BlogHeaderBlock
  | BlogCodeBlock
  | BlogImageBlock
  | BlogListBlock;

export type BlogContentDocument = {
  time?: number;
  version?: string;
  blocks: BlogContentBlock[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeParagraphBlock(value: Record<string, unknown>): BlogParagraphBlock {
  const data = isRecord(value.data) ? value.data : {};

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    type: "paragraph",
    data: {
      text: typeof data.text === "string" ? data.text : "",
    },
  };
}

function normalizeHeaderBlock(value: Record<string, unknown>): BlogHeaderBlock {
  const data = isRecord(value.data) ? value.data : {};
  const level = typeof data.level === "number" ? data.level : 2;

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    type: "header",
    data: {
      text: typeof data.text === "string" ? data.text : "",
      level: Math.min(3, Math.max(1, level)),
    },
  };
}

function normalizeCodeBlock(value: Record<string, unknown>): BlogCodeBlock {
  const data = isRecord(value.data) ? value.data : {};

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    type: "code",
    data: {
      code: typeof data.code === "string" ? data.code : "",
    },
  };
}

function normalizeImageBlock(value: Record<string, unknown>): BlogImageBlock {
  const data = isRecord(value.data) ? value.data : {};
  const file = isRecord(data.file) ? data.file : {};

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    type: "image",
    data: {
      caption: typeof data.caption === "string" ? data.caption : "",
      url: typeof data.url === "string" ? data.url : undefined,
      file: {
        url: typeof file.url === "string" ? file.url : undefined,
      },
    },
  };
}

function normalizeListItem(item: unknown): BlogListItem {
  if (typeof item === "string") {
    return item;
  }

  if (!isRecord(item)) {
    return "";
  }

  const nestedItems = Array.isArray(item.items)
    ? item.items.map(normalizeListItem)
    : [];

  return {
    content: typeof item.content === "string" ? item.content : "",
    items: nestedItems,
  };
}

function normalizeListBlock(value: Record<string, unknown>): BlogListBlock {
  const data = isRecord(value.data) ? value.data : {};
  const items = Array.isArray(data.items) ? data.items.map(normalizeListItem) : [];

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    type: "list",
    data: {
      style: data.style === "ordered" ? "ordered" : "unordered",
      items,
    },
  };
}

function normalizeBlock(value: unknown): BlogContentBlock | null {
  if (!isRecord(value) || typeof value.type !== "string") {
    return null;
  }

  switch (value.type) {
    case "paragraph":
      return normalizeParagraphBlock(value);
    case "header":
      return normalizeHeaderBlock(value);
    case "code":
      return normalizeCodeBlock(value);
    case "image":
      return normalizeImageBlock(value);
    case "list":
      return normalizeListBlock(value);
    default:
      return null;
  }
}

export function createEmptyBlogContentDocument(): BlogContentDocument {
  return {
    time: Date.now(),
    version: "2.31.0",
    blocks: [
      {
        type: "paragraph",
        data: {
          text: "",
        },
      },
    ],
  };
}

export function normalizeBlogContentDocument(value: unknown): BlogContentDocument {
  if (Array.isArray(value)) {
    const blocks = value.map(normalizeBlock).filter((block) => block !== null);

    return {
      time: Date.now(),
      version: "2.31.0",
      blocks,
    };
  }

  if (!isRecord(value)) {
    return createEmptyBlogContentDocument();
  }

  const blocksSource = Array.isArray(value.blocks) ? value.blocks : [];
  const blocks = blocksSource
    .map(normalizeBlock)
    .filter((block) => block !== null);

  return {
    time: typeof value.time === "number" ? value.time : Date.now(),
    version: typeof value.version === "string" ? value.version : "2.31.0",
    blocks,
  };
}

export function parseBlogContentJson(value: string | null | undefined): BlogContentDocument {
  if (!value) {
    return createEmptyBlogContentDocument();
  }

  try {
    return normalizeBlogContentDocument(JSON.parse(value));
  } catch {
    return createEmptyBlogContentDocument();
  }
}

export function stringifyBlogContentDocument(value: BlogContentDocument): string {
  return JSON.stringify(value);
}

function flattenListItems(items: BlogListItem[]): string[] {
  return items.flatMap((item) => {
    if (typeof item === "string") {
      return [item];
    }

    return [item.content, ...(item.items ? flattenListItems(item.items) : [])];
  });
}

function sanitizeListItem(item: BlogListItem): BlogListItem {
  if (typeof item === "string") {
    return sanitizeInlineHtml(item);
  }

  return {
    content: sanitizeInlineHtml(item.content),
    items: item.items ? item.items.map(sanitizeListItem) : item.items,
  };
}

function sanitizeBlock(block: BlogContentBlock): BlogContentBlock {
  switch (block.type) {
    case "paragraph":
      return {
        ...block,
        data: {
          ...block.data,
          text: sanitizeInlineHtml(block.data.text),
        },
      };
    case "header":
      return {
        ...block,
        data: {
          ...block.data,
          text: sanitizeInlineHtml(block.data.text),
        },
      };
    case "image":
      return {
        ...block,
        data: {
          ...block.data,
          caption:
            block.data.caption !== undefined
              ? sanitizeInlineHtml(block.data.caption)
              : block.data.caption,
        },
      };
    case "list":
      return {
        ...block,
        data: {
          ...block.data,
          items: block.data.items.map(sanitizeListItem),
        },
      };
    case "code":
      return block;
    default:
      return block;
  }
}

export function sanitizeBlogContentDocument(doc: BlogContentDocument): BlogContentDocument {
  return {
    ...doc,
    blocks: doc.blocks.map(sanitizeBlock),
  };
}

export function extractTextFromBlogContent(value: BlogContentDocument): string {
  return value.blocks
    .flatMap((block) => {
      switch (block.type) {
        case "paragraph":
          return [block.data.text];
        case "header":
          return [block.data.text];
        case "code":
          return [block.data.code];
        case "image":
          return [block.data.caption ?? ""];
        case "list":
          return flattenListItems(block.data.items);
        default:
          return [];
      }
    })
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
