import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader } from "@/components/card";
import { PageShell } from "@/components/page-shell";
import { SectionShell } from "@/components/section-shell";
import type { AppLocale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";

type ContactPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale } = await params;

  return buildMetadata({
    locale,
    title: "DevJR | Contact",
    description:
      "Direct contact channels for backend, data and platform engineering collaboration.",
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <PageShell className="space-y-10">
      <SectionShell
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        description={t("hero.description")}
      >
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("channels.email")}</h2>
            </CardHeader>
            <CardContent>contact@devjr.dev</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("channels.location")}</h2>
            </CardHeader>
            <CardContent>Mexico City · Remote-friendly</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("channels.availability")}
              </h2>
            </CardHeader>
            <CardContent>{tCommon("common.contactCta")}</CardContent>
          </Card>
        </div>
      </SectionShell>
    </PageShell>
  );
}
