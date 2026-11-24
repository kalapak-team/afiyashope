import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/ProductGallery";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProtectedContent } from "@/components/ProtectedContent";
import { ShopFooter } from "@/components/ShopFooter";
import { ShopHeader } from "@/components/ShopHeader";
import { formatRiel, getProduct, getSettings } from "@/lib/api";
import { translate } from "@/lib/i18n";
import { CopyProductButton } from "./CopyProductButton";

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    const image = product.images[0]?.url || "/abaya-placeholder.svg";
    return {
      title: product.name,
      description: product.description || `ម៉ូដ ${product.name} — ${formatRiel(product.price)} នៅ Afiya Shope។`,
      openGraph: {
        title: `${product.name} | Afiya Shope`,
        description: product.description || `ម៉ូដ Abaya ប្រណិត តម្លៃ ${formatRiel(product.price)}។`,
        images: [{ url: image }],
        type: "website",
      },
    };
  } catch {
    return { title: "ម៉ូដ Abaya", description: "កាតាឡុក Afiya Shope" };
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<LoadingScreen message="កំពុងផ្ទុកព័ត៌មានម៉ូដ…" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: ProductPageProps) {
  const { id } = await params;
  const [cookieStore, productResult, settings] = await Promise.all([
    cookies(),
    getProduct(id).then((value) => ({ status: "fulfilled" as const, value }), (reason) => ({ status: "rejected" as const, reason })),
    getSettings().then((value) => ({ status: "fulfilled" as const, value }), (reason) => ({ status: "rejected" as const, reason })),
  ]);
  const language = cookieStore.get("afiya_language")?.value === "en" ? "en" : "km";
  const t = (text: string) => translate(language, text);
  if (productResult.status === "rejected") notFound();
  if (settings.status === "rejected") throw settings.reason;
  const product = productResult.value;
  const shop = settings.value;
  const inStock = product.stock === "in_stock";

  return (
    <ProtectedContent enabled={shop.protect_copy}>
      <ShopHeader settings={shop} activeTag="all" search="" language={language} />
      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <Link href="/" className="mb-4 inline-flex text-sm font-bold text-[#1696c4] hover:underline">{t("‹ ត្រឡប់ទៅបញ្ជីម៉ូដ")}</Link>
        <article className="grid gap-5 rounded-3xl border border-[#ff9999]/70 bg-white/90 p-3 shadow-xl shadow-pink-100/60 md:grid-cols-2 md:gap-7 md:p-6">
          <ProductGallery product={product} language={language} />
          <section className="flex flex-col gap-4 py-1">
            <div>
              <span className={`stock-badge${inStock ? "" : " out"}`}>{inStock ? `✅ ${t("មានក្នុងស្តុក")}` : `❌ ${t("អស់ស្តុក")}`}</span>
              <h1 className="mt-3 text-2xl font-bold leading-relaxed text-slate-900">{product.name}</h1>
            </div>
            <div className="flex items-baseline gap-2">
              {product.old_price ? <span className="old-price">{formatRiel(product.old_price, language)}</span> : null}
              <span className="detail-price">{formatRiel(product.price, language)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-8 text-slate-600">{product.description || t("សូមឆាតមកកាន់ហាងដើម្បីសួរព័ត៌មានបន្ថែមអំពីម៉ូដនេះ។")}</p>
            <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
              <a className="primary-link" href={shop.fb_url} target="_blank" rel="noopener noreferrer">{t("💬 បញ្ជាទិញម៉ូដនេះតាម Facebook")}</a>
              <CopyProductButton name={product.name} price={formatRiel(product.price, language)} description={product.description || ""} language={language} />
            </div>
          </section>
        </article>
      </main>
      <ShopFooter settings={shop} language={language} />
    </ProtectedContent>
  );
}

