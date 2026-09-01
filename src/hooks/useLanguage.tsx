import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import i18n from "@/i18n";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguageCode,
  type LanguageCode,
} from "@/i18n/languages";
import { supabase } from "@/integrations/supabase/client";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

function readStored(): LanguageCode | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguageCode(raw) ? raw : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  const apply = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    void i18n.changeLanguage(code);
    if (typeof document !== "undefined") document.documentElement.lang = code;
  }, []);

  // Local preference first (instant, works signed-out), then the saved profile value.
  useEffect(() => {
    const stored = readStored();
    if (stored) apply(stored);

    let cancelled = false;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", auth.user.id)
        .maybeSingle();
      const remote = data?.language;
      if (cancelled || !isLanguageCode(remote)) return;
      if (!stored && remote !== DEFAULT_LANGUAGE) apply(remote);
    })();

    return () => {
      cancelled = true;
    };
  }, [apply]);

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      apply(code);
      if (typeof window !== "undefined") window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      void (async () => {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        await supabase.from("profiles").update({ language: code }).eq("id", auth.user.id);
      })();
    },
    [apply],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Convenience wrapper so components can grab `t` and the current language together. */
export function useAppTranslation(ns?: string | string[]) {
  const { t, i18n: instance } = useTranslation(ns);
  return { t, language: instance.language as LanguageCode };
}
