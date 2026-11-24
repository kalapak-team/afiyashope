export type ProductImage = {
  id: number;
  url: string;
  sort_order: number;
};

export type Product = {
  id: number;
  name: string;
  tag: "pastel" | "luxury" | "set";
  price: number;
  old_price: number | null;
  stock: "in_stock" | "out_of_stock";
  description: string | null;
  images: ProductImage[];
};

export type ShopSettings = {
  shop_name: string;
  shop_subtitle: string;
  fb_url: string;
  avatar_url: string | null;
  banner_url: string | null;
  protect_copy: boolean;
};

export type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ResourceResponse<T> = { data: T };

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Catalog API request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getProducts(options: {
  search?: string;
  tag?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<{ products: Product[]; pagination: Pagination }> {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.tag && options.tag !== "all") params.set("tag", options.tag);
  params.set("page", String(options.page || 1));
  params.set("per_page", String(options.perPage || 16));
  const result = await request<ResourceResponse<Product[]> & { meta: Pagination }>(`/products?${params}`);
  return { products: result.data, pagination: result.meta };
}

export async function getProduct(id: string): Promise<Product> {
  const result = await request<ResourceResponse<Product>>(`/products/${encodeURIComponent(id)}`);
  return result.data;
}

export async function getSettings(): Promise<ShopSettings> {
  const result = await request<ResourceResponse<ShopSettings>>("/settings");
  return result.data;
}

export function formatRiel(value: number | null, language: "km" | "en" = "km"): string {
  const locale = language === "en" ? "en-US" : "km-KH";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value ?? 0)} ៛`;
}

export function productImage(product: Product): string {
  return product.images[0]?.url || "/abaya-placeholder.svg";
}
