import type { LoaderConfig } from "next-translate";

/**
 * Minimal config for next-translate when used with AppDirI18nProvider.
 * Namespaces are supplied at runtime from our strings; this only sets defaults.
 */
export const nextTranslateConfig: LoaderConfig = {
  defaultNS: "common",
  keySeparator: ".",
};
