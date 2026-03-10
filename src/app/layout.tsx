import type { Metadata, Viewport } from "next";
import { Nunito, Poppins } from "next/font/google";
import "./globals.css";
import { getLocale, getT } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/client";
import { I18nProviderWrapper } from "@/components/I18nProviderWrapper";
import { nextTranslateConfig } from "@/lib/i18n/next-translate-config";
import { strings } from "@/lib/i18n/strings";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KindScreen — Parent-reviewed. Kid-approved.",
  description:
    "A curated catalog of YouTube videos safe for children aged 3–12. Watched by real parents. Verified by consensus. Zero surprises.",
  keywords: [
    "kids videos",
    "safe youtube",
    "children content",
    "parent curated",
    "kids safe",
  ],
  openGraph: {
    title: "KindScreen — Parent-reviewed. Kid-approved.",
    description:
      "A curated catalog of YouTube videos safe for children aged 3–12.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getT();
  const namespaces = { common: strings[locale] };

  return (
    <I18nProviderWrapper
      lang={locale}
      namespaces={namespaces}
      config={nextTranslateConfig}
    >
      <html
        lang={locale === "pt" ? "pt-BR" : "en"}
        className={`${nunito.variable} ${poppins.variable}`}
      >
        <body className="bg-cream font-sans text-warm antialiased">
          <LocaleProvider t={t}>{children}</LocaleProvider>
        </body>
      </html>
    </I18nProviderWrapper>
  );
}
