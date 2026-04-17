import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader } from "@/components/card";
import { PageShell } from "@/components/page-shell";
import { SectionShell } from "@/components/section-shell";
import type { AppLocale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";

type AboutPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata({ params }: AboutPageProps) {
  const { locale } = await params;

  return buildMetadata({
    locale,
    title: "DevJR | About",
    description:
      "Professional profile focused on backend architecture, data systems and engineering decision-making.",
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <PageShell className="space-y-10">
      <SectionShell
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        description={t("hero.description")}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {t("sections.philosophyTitle")}
              </h2>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">
              {t("sections.philosophyBody")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {t("sections.approachTitle")}
              </h2>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">
              {t("sections.approachBody")}
            </CardContent>
          </Card>
        </div>
      </SectionShell>
    </PageShell>
  );
}
