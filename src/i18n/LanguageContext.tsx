import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRANSLATIONS, type Lang } from "./translations";

const LANG_STORAGE_KEY = "livingwords:lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (value: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Korean is the base/default language for the site (it's what the typing
// game is really built around), so a brand-new visitor with nothing saved
// yet starts in Korean. Anyone who's picked English before keeps getting
// English, same "read synchronously in useState's initializer" trick as
// ThemeContext/useReadMode use to avoid a flash of the wrong language.
function readStored(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return stored === "en" || stored === "ko" ? stored : "ko";
  } catch {
    return "ko"; // localStorage can throw in some locked-down contexts
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored);

  const setLang = useCallback((value: Lang) => {
    setLangState(value);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, value);
    } catch {
      /* ignore - preference just won't survive a reload */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = TRANSLATIONS[lang];
      let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
