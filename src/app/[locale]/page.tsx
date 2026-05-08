import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { headers } from "next/headers";
import { buttonVariants } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { track } from "@/lib/analytics/posthog-server";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("landing");
  const distinctId = (await headers()).get("x-forwarded-for") ?? "anon";
  await track(distinctId, "landing_viewed", { locale });
  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-6 border-b">
        <span className="text-xl font-semibold">Klausel</span>
        <LanguageToggle />
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
          {t("hero_title")}
        </h1>
        <p className="mt-6 text-lg max-w-2xl text-muted-foreground">
          {t("hero_subtitle")}
        </p>
        <p className="mt-4 text-base font-medium">{t("hero_price")}</p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/upload" className={buttonVariants({ size: "lg" })}>
            {t("cta_upload")}
          </Link>
          <Link
            href="/sample"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {t("cta_sample")}
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground max-w-xl">
          {t("trust")}
        </p>
      </section>
    </main>
  );
}
