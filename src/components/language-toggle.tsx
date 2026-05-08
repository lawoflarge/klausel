"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const otherLocale = locale === "en" ? "de" : "en";
  const base = pathname.replace(/^\/(en|de)/, "") || "/";
  const target = otherLocale === "en" ? base : `/de${base}`;
  return (
    <Link href={target} className="text-sm underline">
      {otherLocale.toUpperCase()}
    </Link>
  );
}
