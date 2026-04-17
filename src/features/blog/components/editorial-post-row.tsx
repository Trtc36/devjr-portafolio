import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { localizeCopy } from "@/lib/content";
import { formatDate } from "@/lib/formatters";
import type { BlogPost } from "@/features/blog/types/blog-post";

export function EditorialPostRow({
  locale,
  post,
  ctaLabel,
}: {
  locale: AppLocale;
  post: BlogPost;
  ctaLabel: string;
}) {
  return (
    <Card className="group h-full hover:border-[hsl(var(--accent-soft))] hover:shadow-[0_28px_56px_-34px_hsla(var(--shadow-strong),0.34)]">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag.id}>{localizeCopy(tag.name, locale)}</Badge>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold tracking-tight">
            {localizeCopy(post.title, locale)}
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-[hsl(var(--foreground-soft))] md:text-base">
            {localizeCopy(post.excerpt, locale)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
        <span>{formatDate(post.publishedAt, locale)}</span>
        <span>{post.readTime}</span>
      </CardContent>

      <CardFooter className="border-t border-[hsl(var(--border))] pt-5">
        <Link
          href={`/blog/${post.slug}`}
          locale={locale}
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors group-hover:text-[hsl(var(--accent))]"
        >
          {ctaLabel}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
