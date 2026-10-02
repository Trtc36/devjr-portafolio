import { PageShell } from "@/components/layout/page-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell>
      <PageHero
        title="Page not found"
        description="This page doesn't exist. Head back to the homepage."
        actions={
          <Button asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain anchor intentional: no i18n/locale context exists outside the [locale] segment for the next-intl Link */}
            <a href="/en">Home</a>
          </Button>
        }
      />
    </PageShell>
  );
}
