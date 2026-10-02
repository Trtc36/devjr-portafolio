"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <PageHero
        title={t("error.title")}
        description={t("error.description")}
        actions={
          <>
            <Button onClick={() => unstable_retry()}>{t("error.retry")}</Button>
            <Button asChild variant="secondary">
              <Link href="/">{t("error.backHome")}</Link>
            </Button>
          </>
        }
      />
    </PageShell>
  );
}
