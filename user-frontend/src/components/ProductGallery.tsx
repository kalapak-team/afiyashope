"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/api";
import { productImage } from "@/lib/api";
import { formatNumber, translate, type Language } from "@/lib/i18n";

export function ProductGallery({ product, language }: { product: Product; language: Language }) {
  const images = product.images.length
    ? product.images.slice(0, 5)
    : [{ id: 0, url: productImage(product), sort_order: 0 }];
  const [active, setActive] = useState(0);
  const show = (step: number) => setActive((index) => (index + step + images.length) % images.length);
  const t = (text: string) => translate(language, text);

  return (
    <div className="grid gap-3">
      <div className="detail-image relative grid place-items-center">
        <Image
          src={images[active].url}
          alt={language === "en" ? `${product.name}, image ${active + 1}` : `${product.name} រូប ${active + 1}`}
          fill
          sizes="(max-width: 768px) 95vw, 620px"
          className="object-contain"
          unoptimized
          priority
        />
        {images.length > 1 ? (
          <>
            <button type="button" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl shadow" onClick={() => show(-1)} aria-label={t("រូបមុន")}>‹</button>
            <button type="button" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl shadow" onClick={() => show(1)} aria-label={t("រូបបន្ទាប់")}>›</button>
          </>
        ) : null}
        <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white">
          {formatNumber(active + 1, language)} / {formatNumber(images.length, language)}
        </span>
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              className={`thumb-button relative${index === active ? " active" : ""}`}
              key={image.id}
              type="button"
              aria-label={`${t("មើលរូបទី")} ${formatNumber(index + 1, language)}`}
              onClick={() => setActive(index)}
            >
              <Image src={image.url} alt="" fill sizes="58px" className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
