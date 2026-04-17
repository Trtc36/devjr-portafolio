import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/common";

export function TagFilterBar({
  basePath,
  locale,
  tags,
  activeTag,
  allLabel,
}: {
  basePath: "/projects" | "/blog";
  locale: AppLocale;
  tags: Tag[];
  activeTag?: string;
  allLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href={basePath} locale={locale}>
        <Badge
          variant={activeTag ? "default" : "accent"}
          className={cn(
            "cursor-pointer transition-all hover:border-[hsl(var(--accent-soft))] hover:text-[hsl(var(--foreground))]",
            !activeTag && "font-semibold",
          )}
        >
          {allLabel}
        </Badge>
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={{ pathname: basePath, query: { tag: tag.slug } }}
          locale={locale}
        >
          <Badge
            variant={activeTag === tag.slug ? "accent" : "default"}
            className="cursor-pointer transition-all hover:border-[hsl(var(--accent-soft))] hover:text-[hsl(var(--foreground))]"
          >
            {tag.name[locale]}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
