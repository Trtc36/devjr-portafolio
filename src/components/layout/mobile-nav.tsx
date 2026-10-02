"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("nav.openMenu")}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-[mobileNavOverlayIn_200ms_ease-out] data-[state=closed]:animate-[mobileNavOverlayOut_200ms_ease-in]" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col gap-6 border-l border-[hsla(var(--border),0.75)] bg-[hsl(var(--surface))] p-6 shadow-[0_16px_32px_-28px_hsla(var(--shadow-strong),0.45)] data-[state=open]:animate-[mobileNavPanelIn_200ms_ease-out] data-[state=closed]:animate-[mobileNavPanelOut_200ms_ease-in]">
          <Dialog.Title className="sr-only">{t("nav.menuTitle")}</Dialog.Title>
          <div className="flex items-center justify-end">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" aria-label={t("nav.closeMenu")}>
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  locale={locale}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
