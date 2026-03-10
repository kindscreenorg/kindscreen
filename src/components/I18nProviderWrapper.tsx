"use client";

import AppDirI18nProvider from "next-translate/AppDirI18nProvider";
import type { I18nDictionary } from "next-translate";
import type { LoaderConfig } from "next-translate";

type Props = {
  lang: string;
  namespaces: Record<string, I18nDictionary>;
  config: LoaderConfig;
  children: React.ReactNode;
};

/**
 * Wraps the tree with next-translate's App Dir provider so Trans and useTranslation work.
 * Pass lang and namespaces from server (e.g. from getLocale() and strings[locale]).
 */
export function I18nProviderWrapper({
  lang,
  namespaces,
  config,
  children,
}: Props) {
  return (
    <AppDirI18nProvider
      lang={lang}
      namespaces={namespaces}
      config={config}
    >
      {children}
    </AppDirI18nProvider>
  );
}
