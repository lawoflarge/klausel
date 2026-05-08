import { useTranslations } from "next-intl";

export default function LandingPage() {
  const t = useTranslations("landing");
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">{t("hero_title")}</h1>
      <p className="mt-4 text-lg">{t("hero_subtitle")}</p>
      <p className="mt-2 font-medium">{t("hero_price")}</p>
    </main>
  );
}
