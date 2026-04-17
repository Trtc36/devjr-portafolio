"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "nav.home" },
  { href: "/projects", label: "nav.projects" },
  { href: "/blog", label: "nav.blog" },
  { href: "/about", label: "nav.about" },
  { href: "/contact", label: "nav.contact" },
] as const;

export default function MainNav() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 rounded-full border border-[hsla(var(--border),0.75)] bg-[hsla(var(--surface),0.82)] p-1 shadow-[0_16px_32px_-28px_hsla(var(--shadow-strong),0.45)] md:flex">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            locale={locale}
            className={cn(
              "rounded-full px-3 py-2 text-sm transition-all duration-200",
              isActive
                ? "bg-[hsl(var(--surface-highlight))] text-[hsl(var(--foreground))] shadow-[0_8px_20px_-16px_hsla(var(--shadow-strong),0.5)]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-highlight))] hover:text-[hsl(var(--foreground))]",
            )}
          >
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
