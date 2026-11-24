"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type PropsWithChildren } from "react";
import { translate, type Language } from "@/lib/i18n";

type Theme = "light" | "dark";
type Preferences = {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);
const PREFERENCES_EVENT = "afiya-preferences-change";

function subscribePreferences(callback: () => void) {
  window.addEventListener(PREFERENCES_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PREFERENCES_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getLanguageSnapshot(): Language {
  return localStorage.getItem("afiya-language") === "en" ? "en" : "km";
}

function getThemeSnapshot(): Theme {
  return localStorage.getItem("afiya-theme") === "dark" ? "dark" : "light";
}

function getServerLanguage(): Language {
  return "km";
}

function getServerTheme(): Theme {
  return "light";
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const language = useSyncExternalStore(subscribePreferences, getLanguageSnapshot, getServerLanguage);
  const theme = useSyncExternalStore(subscribePreferences, getThemeSnapshot, getServerTheme);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document.title = language === "en"
      ? window.location.pathname === "/login" ? "Owner sign in" : "Afiya Shope management"
      : window.location.pathname === "/login" ? "ចូលគណនីម្ចាស់ហាង" : "គ្រប់គ្រង Afiya Shope";
  }, [language, theme]);

  const setLanguage = useCallback((next: Language) => {
    localStorage.setItem("afiya-language", next);
    document.cookie = `afiya_language=${next}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = getThemeSnapshot() === "light" ? "dark" : "light";
    localStorage.setItem("afiya-theme", next);
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
  }, []);

  const value = useMemo(() => ({ language, theme, setLanguage, toggleTheme }), [language, theme, setLanguage, toggleTheme]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Preferences {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used within PreferencesProvider.");
  return value;
}

export function PreferenceControls() {
  const { language, theme, setLanguage, toggleTheme } = usePreferences();
  const t = (text: string) => translate(language, text);

  return (
    <div className="preference-controls" aria-label={t("ការកំណត់បង្ហាញ")}>
      <div className="preference-languages" aria-label={t("ភាសា")}>
        <button type="button" aria-pressed={language === "km"} onClick={() => setLanguage("km")}>ខ្មែរ</button>
        <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
      </div>
      <button
        className="preference-theme"
        type="button"
        onClick={toggleTheme}
        aria-label={t(theme === "light" ? "បើករបៀបងងឹត" : "បើករបៀបភ្លឺ")}
      >
        {theme === "light" ? `🌙 ${t("ងងឹត")}` : `☀️ ${t("ភ្លឺ")}`}
      </button>
    </div>
  );
}
