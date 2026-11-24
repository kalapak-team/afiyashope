import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { formatRiel, productImage } from "@/lib/api";
import { formatNumber, translate, type Language } from "@/lib/i18n";

export function ProductCard({ product, language }: { product: Product; language: Language }) {
  const inStock = product.stock === "in_stock";
  const t = (text: string) => translate(language, text);
  return (
    <article className="product-card flex flex-col">
      <Link className="product-photo" href={`/products/${product.id}`} aria-label={language === "en" ? `View style ${product.name}` : `មើលម៉ូដ ${product.name}`}>
        <Image src={productImage(product)} alt={product.name} fill sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 23vw" unoptimized />
        <span className="photo-count">📷 {formatNumber(product.images.length, language)} {t("រូប")}</span>
      </Link>
      <div className="product-card-info">
        <span className={`stock-badge${inStock ? "" : " out"}`}>{inStock ? `✅ ${t("មានក្នុងស្តុក")}` : `❌ ${t("អស់ស្តុក")}`}</span>
        <h2 className="product-name">{product.name}</h2>
        <div className="product-price-line">
          {product.old_price ? <span className="old-price">{formatRiel(product.old_price, language)}</span> : null}
          <span className="current-price">{formatRiel(product.price, language)}</span>
        </div>
      </div>
      <Link className="product-details-link" href={`/products/${product.id}`}>
        {t("មើលព័ត៌មានម៉ូដ")} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
