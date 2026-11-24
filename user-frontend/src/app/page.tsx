import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { ProductCard } from "@/components/ProductCard";
import { CategoryRail } from "@/components/CategoryRail";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProtectedContent } from "@/components/ProtectedContent";
import { ShopFooter } from "@/components/ShopFooter";
import { ShopHeader } from "@/components/ShopHeader";
import { getProducts, getSettings } from "@/lib/api";
import { formatNumber, translate } from "@/lib/i18n";

type PageProps = {
  searchParams: Promise<{ search?: string; tag?: string; page?: string }>;
};

export default function Home({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingScreen message="កំពុងផ្ទុកកាតាឡុកម៉ូដ…" />}>
      <HomeCatalog searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeCatalog({ searchParams }: PageProps) {
  await connection();
  const query = await searchParams;
  const cookieStore = await cookies();
  const language = cookieStore.get("afiya_language")?.value === "en" ? "en" : "km";
  const t = (text: string) => translate(language, text);
  const search = query.search?.trim() || "";
  const tag = query.tag || "all";
  const page = Math.max(1, Number(query.page) || 1);
  const [{ products, pagination }, settings] = await Promise.all([
    getProducts({ search, tag, page }),
    getSettings(),
  ]);
  const pageLink = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tag !== "all") params.set("tag", tag);
    params.set("page", String(nextPage));
    return `/?${params.toString()}`;
  };

  return (
    <ProtectedContent enabled={settings.protect_copy}>
      <ShopHeader settings={settings} activeTag={tag} search={search} language={language} />
      <section className={`fashion-hero${settings.banner_url ? " has-banner" : ""}`}>
        {settings.banner_url ? (
          <Image
            src={settings.banner_url}
            alt={t("រូបភាពបដាហាង Afiya Shope")}
            fill
            priority
            sizes="100vw"
            className="fashion-hero-image"
            unoptimized
          />
        ) : null}
        <div className="fashion-hero-shade" />
        <div className="fashion-hero-content mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="fashion-hero-copy">
            <span className="hero-kicker">{t("✨ កម្រងម៉ូដថ្មី ២០២៦")}</span>
            <h1>{t("សម្រស់សុភាពរាបសារ ជាមួយម៉ូដ Abaya ប្រណិត")}</h1>
            <p>{settings.shop_subtitle || t("ជ្រើសរើសម៉ូដដែលអ្នកស្រឡាញ់ ហើយឆាតមកកាន់ហាងដើម្បីបញ្ជាទិញ។ សាច់ក្រណាត់គុណភាពខ្ពស់ និងម៉ូដទាន់សម័យ។")}</p>
            <a className="primary-link" href={settings.fb_url} target="_blank" rel="noopener noreferrer">
              {t("💬 ឆាតសួរព័ត៌មានតាម Facebook")} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="hero-side-note" aria-hidden="true">
            <span>AFIYA</span>
            <span>ABAYA · 2026</span>
          </div>
        </div>
      </section>

      <CategoryRail activeTag={tag} search={search} language={language} />

      <main className="mx-auto min-h-[50vh] max-w-7xl px-3 pb-16 pt-5 sm:px-6">
        <div className="collection-heading">
          <div>
            <span className="collection-kicker">{t("កម្រងម៉ូដ Afiya Shope")}</span>
            <h2>{search ? t("លទ្ធផលស្វែងរក") : t("ស្វែងរកម៉ូដដែលអ្នកស្រឡាញ់")}</h2>
            <p>{search ? `“${search}”` : t("ជ្រើសរើសរចនាបថដែលសមនឹងអ្នក")}</p>
          </div>
          <div className="collection-meta">
            <span className="collection-count">
              {language === "en" ? `${formatNumber(pagination.total, language)} styles` : `ម៉ូដ ${formatNumber(pagination.total, language)} ម៉ូដ`}
            </span>
            <span className="collection-page">
              {language === "en"
                ? `Page ${formatNumber(pagination.current_page, language)} / ${formatNumber(pagination.last_page, language)}`
                : `ទំព័រ ${formatNumber(pagination.current_page, language)} / ${formatNumber(pagination.last_page, language)}`}
            </span>
          </div>
        </div>
        {products.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {products.map((product) => <ProductCard key={product.id} product={product} language={language} />)}
            </div>
            {pagination.last_page > 1 ? (
              <nav className="mt-7 flex items-center justify-center gap-3" aria-label={t("ទំព័របញ្ជីម៉ូដ")}>
                {pagination.current_page > 1 ? <Link className="primary-link" href={pageLink(pagination.current_page - 1)}>{t("‹ ទំព័រមុន")}</Link> : null}
                {pagination.current_page < pagination.last_page ? <Link className="primary-link" href={pageLink(pagination.current_page + 1)}>{t("ទំព័របន្ទាប់ ›")}</Link> : null}
              </nav>
            ) : null}
          </>
        ) : (
          <div className="empty-panel">
            <div className="text-4xl">🌸</div>
            <h2 className="mt-3 text-lg font-bold">{t("រកមិនឃើញម៉ូដដែលអ្នកស្វែងរកទេ")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("សូមសាកល្បងពាក្យផ្សេង ឬមើលម៉ូដទាំងអស់។")}</p>
            <Link href="/" className="primary-link mt-4">{t("បង្ហាញម៉ូដទាំងអស់")}</Link>
          </div>
        )}
      </main>
      <ShopFooter settings={settings} language={language} />
    </ProtectedContent>
  );
}

