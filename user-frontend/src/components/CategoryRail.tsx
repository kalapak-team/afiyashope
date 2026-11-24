import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/lib/catalog";
import { translate, type Language } from "@/lib/i18n";

export function CategoryRail({
  activeTag,
  search,
  language,
}: {
  activeTag: string;
  search: string;
  language: Language;
}) {
  const t = (text: string) => translate(language, text);

  return (
    <nav className="category-rail" aria-label={t("ទិញតាមប្រភេទ")}>
      <div className="category-rail-inner mx-auto max-w-7xl px-3 sm:px-6">
        <p className="category-rail-label">{t("ទិញតាមប្រភេទ")}</p>
        <div className="category-rail-items">
          {PRODUCT_CATEGORIES.map((category) => {
            const params = new URLSearchParams();
            if (category.value !== "all") params.set("tag", category.value);
            if (search) params.set("search", search);
            const href = params.size ? `/?${params.toString()}` : "/";

            return (
              <Link
                key={category.value}
                href={href}
                className={`category-rail-link${activeTag === category.value ? " active" : ""}`}
                aria-current={activeTag === category.value ? "page" : undefined}
              >
                {t(category.text)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
