import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <PageShell>
      <PageHero
        title={t("notFound.title")}
        description={t("notFound.description")}
        actions={
          <>
            <Button asChild>
              <Link href="/">{t("notFound.backHome")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/blog">{t("notFound.viewBlog")}</Link>
            </Button>
          </>
        }
      />
    </PageShell>
  );
}
