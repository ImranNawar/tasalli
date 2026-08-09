import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "ur";

interface LanguageContextValue {
  /** Current language ('en' | 'ur') */
  lang: Lang;
  /** Set language explicitly */
  setLang: (lang: Lang) => void;
  /** Toggle between en/ur */
  toggleLang: () => void;
  /** HTML dir attribute value */
  dir: "ltr" | "rtl";
  /** CSS font family class suffix to apply */
  fontClass: string;
  /** Auto-detect and switch based on text content */
  detectAndSet: (text: string) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANG_KEY = "tasalli.lang";

function getStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "ur" || stored === "en") return stored;
  } catch { /* ignore */ }
  return "en";
}

const URDU_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsUrdu(text: string): boolean {
  return URDU_REGEX.test(text);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch { /* ignore */ }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "ur" : "en");
  }, [lang, setLang]);

  const detectAndSet = useCallback(
    (text: string) => {
      if (containsUrdu(text)) {
        setLang("ur");
      }
    },
    [setLang],
  );

  // Apply dir and lang to the HTML element
  useEffect(() => {
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = lang === "ur" ? "ur" : "en";
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      dir: lang === "ur" ? "rtl" : "ltr",
      fontClass: lang === "ur" ? "urdu-text" : "",
      detectAndSet,
    }),
    [lang, setLang, toggleLang, detectAndSet],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}