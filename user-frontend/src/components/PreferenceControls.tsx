"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { translate, type Language } from "@/lib/i18n";

type ThemeSetting = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
type OpenMenu = "language" | "theme" | null;
type PendingLanguage = { value: Language };

const PREFERENCES_EVENT = "afiya-preferences-change";
const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "gb" },
  { value: "km", label: "ខ្មែរ", flag: "kh" },
];

const themeOptions: { value: ThemeSetting; label: string }[] = [
  { value: "light", label: "ភ្លឺ" },
  { value: "dark", label: "ងងឹត" },
  { value: "system", label: "ប្រព័ន្ធ" },
];

function subscribe(callback: () => void) {
  const colorScheme = window.matchMedia(COLOR_SCHEME_QUERY);
  window.addEventListener(PREFERENCES_EVENT, callback);
  window.addEventListener("storage", callback);
  colorScheme.addEventListener("change", callback);
  return () => {
    window.removeEventListener(PREFERENCES_EVENT, callback);
    window.removeEventListener("storage", callback);
    colorScheme.removeEventListener("change", callback);
  };
}

function getThemeSettingSnapshot(): ThemeSetting {
  const storedTheme = localStorage.getItem("afiya-theme");
  return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
    ? storedTheme
    : "system";
}

function getResolvedThemeSnapshot(): ResolvedTheme {
  const setting = getThemeSettingSnapshot();
  if (setting !== "system") return setting;
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light";
}

function ThemeIcon({ theme }: { theme: ThemeSetting }) {
  if (theme === "light") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
    );
  }

  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18m-9-9a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function PreferenceControls({ language }: { language: Language }) {
  const router = useRouter();
  const t = (text: string) => translate(language, text);
  const themeSetting = useSyncExternalStore<ThemeSetting>(
    subscribe,
    getThemeSettingSnapshot,
    () => "system",
  );
  const theme = useSyncExternalStore<ResolvedTheme>(subscribe, getResolvedThemeSnapshot, () => "light");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [pendingLanguage, setPendingLanguage] = useState<PendingLanguage | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.cookie = `afiya_language=${language}; path=/; max-age=31536000; samesite=lax`;
    if (window.location.pathname === "/") {
      document.title = language === "en"
        ? "Afiya Shope — Luxury Abaya Boutique"
        : "Afiya Shope — ហាង Abaya ប្រណិត";
    }
  }, [language]);

  useEffect(() => {
    if (pendingLanguage === null) return;
    document.cookie = `afiya_language=${pendingLanguage.value}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [pendingLanguage, router]);

  useEffect(() => {
    if (openMenu === null) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !controlsRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    window.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  function changeLanguage(next: Language) {
    localStorage.setItem("afiya-language", next);
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
    setPendingLanguage({ value: next });
    setOpenMenu(null);
  }

  function changeTheme(next: ThemeSetting) {
    localStorage.setItem("afiya-theme", next);
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
    setOpenMenu(null);
  }

  function toggleMenu(menu: Exclude<OpenMenu, null>) {
    setOpenMenu((current) => current === menu ? null : menu);
  }

  return (
    <div ref={controlsRef} className="preference-controls" aria-label={t("ការកំណត់បង្ហាញ")}>
      <div className="preference-menu-container">
        <button
          className="preference-menu-trigger"
          type="button"
          aria-label={t("ភាសា")}
          aria-expanded={openMenu === "language"}
          aria-controls="language-preferences"
          onClick={() => toggleMenu("language")}
        >
          <GlobeIcon />
        </button>
        {openMenu === "language" ? (
          <div
            className="preference-menu"
            id="language-preferences"
            role="group"
            aria-label={t("ភាសា")}
          >
            {languages.map((option) => (
              <button
                className={`preference-menu-item${language === option.value ? " selected" : ""}`}
                type="button"
                aria-pressed={language === option.value}
                key={option.value}
                onClick={() => changeLanguage(option.value)}
              >
                <span className={`fi fi-${option.flag} preference-flag`} aria-hidden="true" />
                <span>{option.label}</span>
                {language === option.value ? <CheckIcon /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="preference-menu-container">
        <button
          className="preference-menu-trigger"
          type="button"
          aria-label={t("រចនាបថ")}
          aria-expanded={openMenu === "theme"}
          aria-controls="theme-preferences"
          onClick={() => toggleMenu("theme")}
        >
          <ThemeIcon theme={themeSetting} />
        </button>
        {openMenu === "theme" ? (
          <div
            className="preference-menu"
            id="theme-preferences"
            role="group"
            aria-label={t("រចនាបថ")}
          >
            {themeOptions.map((option) => (
              <button
                className={`preference-menu-item${themeSetting === option.value ? " selected" : ""}`}
                type="button"
                aria-pressed={themeSetting === option.value}
                key={option.value}
                onClick={() => changeTheme(option.value)}
              >
                <span className="preference-option-icon">
                  <ThemeIcon theme={option.value} />
                </span>
                <span>{t(option.label)}</span>
                {themeSetting === option.value ? <CheckIcon /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
