import Image from "next/image";
import Link from "next/link";
import type { ShopSettings } from "@/lib/api";
import { PRODUCT_CATEGORIES } from "@/lib/catalog";
import { translate, type Language } from "@/lib/i18n";

export function ShopFooter({
  settings,
  language,
}: {
  settings: ShopSettings;
  language: Language;
}) {
  const t = (text: string) => translate(language, text);

  return (
    <footer className="shop-footer">
      <div className="shop-footer-inner mx-auto max-w-7xl px-4 sm:px-6">
        <div className="shop-footer-grid">
          <section className="shop-footer-brand">
            <Link href="/" className="shop-footer-logo" aria-label={t("ទំព័រដើម Afiya Shope")}>
              <Image
                src={settings.avatar_url || "/afiya-shope-logo.png"}
                alt={t("ឡូហ្គោ Afiya Shope")}
                width={settings.avatar_url ? 54 : 160}
                height={settings.avatar_url ? 54 : 60}
                className={settings.avatar_url ? "shop-footer-avatar" : "shop-footer-wordmark"}
                unoptimized
              />
            </Link>
            <p>{settings.shop_subtitle || t("ហាង Abaya ប្រណិត និងទាន់សម័យនៅកម្ពុជា")}</p>
          </section>

          <nav className="shop-footer-section" aria-label={t("ទិញតាមប្រភេទ")}>
            <h2>{t("ទិញតាមប្រភេទ")}</h2>
            <ul>
              {PRODUCT_CATEGORIES.map((category) => {
                const href = category.value === "all" ? "/" : `/?tag=${category.value}`;
                return (
                  <li key={category.value}>
                    <Link href={href}>{t(category.text)}</Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section className="shop-footer-section">
            <h2>{t("សេវាកម្មអតិថិជន")}</h2>
            <ul className="shop-footer-facts">
              <li>{t("ដឹកជញ្ជូនទូទាំង ២៥ ខេត្ត-ក្រុង")}</li>
              <li>{t("បញ្ជាទិញតាម Facebook")}</li>
            </ul>
          </section>

          <section className="shop-footer-section shop-footer-contact">
            <h2>{t("ទំនាក់ទំនងហាង")}</h2>
            <p>{t("ឆាតមកយើងខ្ញុំតាម Facebook")}</p>
            <a className="shop-footer-facebook" href={settings.fb_url} target="_blank" rel="noopener noreferrer">
              <span className="shop-footer-facebook-icon" aria-hidden="true">f</span>
              {t("ទិញងាយស្រួលតាម Facebook")}
              <span aria-hidden="true">↗</span>
            </a>
          </section>
        </div>

        <div className="shop-footer-bottom">
          <span>© {new Date().getFullYear()} {settings.shop_name} · {t("រក្សាសិទ្ធិគ្រប់យ៉ាង")}</span>
          <span>{t("រចនាដោយក្តីស្រឡាញ់")} <span className="shop-footer-heart" aria-hidden="true">♡</span></span>
        </div>
      </div>
    </footer>
  );
}
