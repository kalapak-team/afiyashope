import Image from "next/image";
import Link from "next/link";
import type { ShopSettings } from "@/lib/api";
import { PreferenceControls } from "@/components/PreferenceControls";
import { PRODUCT_CATEGORIES } from "@/lib/catalog";
import { translate, type Language } from "@/lib/i18n";

export function ShopHeader({
  settings,
  activeTag,
  search,
  language,
}: {
  settings: ShopSettings;
  activeTag: string;
  search: string;
  language: Language;
}) {
  const t = (text: string) => translate(language, text);

  return (
    <>
      <div className="announcement-bar">
        <div className="announcement-inner mx-auto max-w-7xl px-3 sm:px-6">
          <span>{t("ដឹកជញ្ជូនទូទាំង ២៥ ខេត្ត-ក្រុង")}</span>
          <a href={settings.fb_url} target="_blank" rel="noopener noreferrer">
            {t("ទិញងាយស្រួលតាម Facebook")} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <header className="site-header">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="masthead">
            <form action="/" className="shop-search">
              <input
                className="search-field"
                name="search"
                type="search"
                defaultValue={search}
                placeholder={t("ស្វែងរកឈ្មោះ ម៉ូដ ពណ៌ ឬតម្លៃ...")}
                aria-label={t("ស្វែងរកផលិតផល")}
              />
              {activeTag !== "all" ? <input type="hidden" name="tag" value={activeTag} /> : null}
              <button type="submit" className="search-submit" aria-label={t("ស្វែងរក")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4.5 4.5" />
                </svg>
              </button>
            </form>
            <Link href="/" className="brand-mark" aria-label={t("ទំព័រដើម Afiya Shope")}>
              <Image
                className={settings.avatar_url ? "avatar" : "shop-logo"}
                src={settings.avatar_url || "/afiya-shope-logo.png"}
                alt={t("ឡូហ្គោ Afiya Shope")}
                width={settings.avatar_url ? 54 : 160}
                height={settings.avatar_url ? 54 : 60}
                unoptimized
              />
            </Link>
            <PreferenceControls language={language} />
          </div>
          <nav className="shop-navigation" aria-label={t("តម្រងម៉ូដ")}>
            <span className="shop-navigation-label">{t("ស្វែងរកតាមប្រភេទ")}</span>
            <div className="shop-navigation-links">
              {PRODUCT_CATEGORIES.map((filter) => {
                const params = new URLSearchParams();
                if (filter.value !== "all") params.set("tag", filter.value);
                if (search) params.set("search", search);
                const href = params.size ? `/?${params.toString()}` : "/";
                return (
                  <Link
                    className={`filter-link${activeTag === filter.value ? " active" : ""}`}
                    href={href}
                    key={filter.value}
                  >
                    {t(filter.text)}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
