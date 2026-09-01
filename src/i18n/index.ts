import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE, LANGUAGES, type LanguageCode } from "./languages";

/**
 * Every `src/i18n/locales/<lang>/<namespace>.json` file is bundled automatically,
 * so adding a namespace is just adding three JSON files.
 */
const modules = import.meta.glob<Record<string, unknown>>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const lang of LANGUAGES) resources[lang.code] = {};

for (const [path, value] of Object.entries(modules)) {
  const match = /\.\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
  if (!match) continue;
  const [, lang, ns] = match as unknown as [string, LanguageCode, string];
  if (!resources[lang]) resources[lang] = {};
  resources[lang]![ns] = value;
}

export const NAMESPACES = Object.keys(resources[DEFAULT_LANGUAGE] ?? {});

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: resources as never,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: "common",
    ns: NAMESPACES.length ? NAMESPACES : ["common"],
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });
}

export default i18n;
