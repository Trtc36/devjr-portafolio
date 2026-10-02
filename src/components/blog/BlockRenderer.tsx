import Image from "next/image";
import {
  sanitizeBlogContentDocument,
  type BlogContentDocument,
  type BlogListItem,
} from "@/features/blog/lib/block-content";

function renderInlineHtml(value: string) {
  return { __html: value };
}

function renderListItems(items: BlogListItem[]) {
  return items.map((item, index) => {
    if (typeof item === "string") {
      return (
        <li
          key={`${item}-${index}`}
          dangerouslySetInnerHTML={renderInlineHtml(item)}
        />
      );
    }

    return (
      <li key={`${item.content}-${index}`}>
        <span dangerouslySetInnerHTML={renderInlineHtml(item.content)} />
        {item.items && item.items.length > 0 ? (
          <ul className="mt-3 list-disc space-y-2 pl-6">
            {renderListItems(item.items)}
          </ul>
        ) : null}
      </li>
    );
  });
}

export function BlockRenderer({ content }: { content: BlogContentDocument }) {
  const safeContent = sanitizeBlogContentDocument(content);

  return (
    <div className="space-y-6">
      {safeContent.blocks.map((block, index) => {
        const key = block.id ?? `${block.type}-${index}`;

        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={key}
                className="leading-8 text-[hsl(var(--foreground-soft))]"
                dangerouslySetInnerHTML={renderInlineHtml(block.data.text)}
              />
            );
          case "header": {
            const level = Math.min(3, Math.max(2, block.data.level ?? 2));
            const HeadingTag = level === 3 ? "h3" : "h2";

            return (
              <HeadingTag
                key={key}
                className="font-semibold tracking-tight text-[hsl(var(--foreground))]"
                dangerouslySetInnerHTML={renderInlineHtml(block.data.text)}
              />
            );
          }
          case "code":
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 text-sm leading-7"
              >
                <code>{block.data.code}</code>
              </pre>
            );
          case "image": {
            const imageUrl = block.data.file?.url ?? block.data.url;

            if (!imageUrl) {
              return null;
            }

            return (
              <figure key={key} className="space-y-3">
                <Image
                  src={imageUrl}
                  alt={block.data.caption || "Blog image"}
                  width={1200}
                  height={675}
                  sizes="100vw"
                  className="h-auto w-full rounded-2xl border border-[hsl(var(--border))] object-cover"
                />
                {block.data.caption ? (
                  <figcaption
                    className="text-sm text-[hsl(var(--muted-foreground))]"
                    dangerouslySetInnerHTML={renderInlineHtml(block.data.caption)}
                  />
                ) : null}
              </figure>
            );
          }
          case "list": {
            const ListTag = block.data.style === "ordered" ? "ol" : "ul";
            const listClassName =
              block.data.style === "ordered"
                ? "list-decimal space-y-2 pl-6"
                : "list-disc space-y-2 pl-6";

            return (
              <ListTag
                key={key}
                className={`text-[hsl(var(--foreground-soft))] ${listClassName}`}
              >
                {renderListItems(block.data.items)}
              </ListTag>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
