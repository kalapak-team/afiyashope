export type AdminImage = { id: number; url: string; sort_order: number };
export type AdminProduct = {
  id: number;
  name: string;
  tag: "pastel" | "luxury" | "set";
  price: number;
  old_price: number | null;
  stock: "in_stock" | "out_of_stock";
  description: string | null;
  images: AdminImage[];
};
export type ShopSettings = {
  shop_name: string;
  shop_subtitle: string;
  fb_url: string;
  avatar_url: string | null;
  banner_url: string | null;
  protect_copy: boolean;
};
export type ProductPage = { data: AdminProduct[]; meta: { current_page: number; last_page: number; total: number } };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");
  const response = await fetch(`/api/proxy/api/v1/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      void fetch("/api/auth/logout", { method: "POST" }).catch((error) => {
        console.error("Could not clear the expired admin session", error);
      }).finally(() => window.dispatchEvent(new Event("afiya:unauthenticated")));
    }
    const validationMessage = payload.errors
      ? Object.values(payload.errors as Record<string, string[]>).flat().join(" ")
      : "";
    throw new Error(validationMessage || payload.message || "សំណើមិនអាចបញ្ចប់បានទេ។");
  }
  return payload as T;
}

export function formatRiel(value: number | null, language: "km" | "en" = "km") {
  const locale = language === "en" ? "en-US" : "km-KH";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value ?? 0)} ៛`;
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("សូមជ្រើសរើសឯកសាររូបភាព។");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("មិនអាចរៀបចំរូបភាពបានទេ។");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("មិនអាចបង្ហាប់រូបភាពបានទេ។")), "image/jpeg", 0.8);
  });
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
}
