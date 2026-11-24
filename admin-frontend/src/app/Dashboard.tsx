"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, compressImage, formatRiel, type AdminImage, type AdminProduct, type ProductPage, type ShopSettings } from "@/lib/api";
import { PreferenceControls, usePreferences } from "@/components/PreferencesProvider";
import { LoadingIndicator, LoadingSpinner } from "@/components/LoadingIndicator";
import { formatNumber, translate } from "@/lib/i18n";

type AdminUser = { id: number; name: string; email: string };
type Stats = { total: number; in_stock: number; out_of_stock: number };
type DraftImage = { key: string; url: string; image?: AdminImage; file?: File };
type Toast = { text: string; kind: "success" | "error" };

const EMPTY_SETTINGS: ShopSettings = {
  shop_name: "Afiya Shope",
  shop_subtitle: "",
  fb_url: "https://www.facebook.com/",
  avatar_url: null,
  banner_url: null,
  protect_copy: false,
};

export function Dashboard() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = (text: string) => translate(language, text);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, in_stock: 0, out_of_stock: 0 });
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<ShopSettings>(EMPTY_SETTINGS);
  const [toast, setToast] = useState<Toast | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"products" | "settings">("products");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ProductPage["meta"]>({ current_page: 1, last_page: 1, total: 0 });
  const [productModal, setProductModal] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [settingsAvatar, setSettingsAvatar] = useState<File | null>(null);
  const [settingsBanner, setSettingsBanner] = useState<File | null>(null);
  const [settingsBannerPreview, setSettingsBannerPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const notify = useCallback((text: string, kind: Toast["kind"] = "success") => {
    const localized = translate(language, text);
    setToast({ text: localized, kind });
    window.setTimeout(() => setToast((current) => current?.text === localized ? null : current), 3200);
  }, [language]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "16" });
      if (search) params.set("search", search);
      if (stockFilter) params.set("stock", stockFilter);
      if (tagFilter) params.set("tag", tagFilter);
      const [me, nextStats, list, nextSettings] = await Promise.all([
        api<AdminUser>("auth/me"),
        api<Stats>("admin/stats"),
        api<ProductPage>(`admin/products?${params}`),
        api<{ data: ShopSettings }>("settings"),
      ]);
      setUser(me);
      setStats(nextStats);
      setProducts(list.data);
      setPagination(list.meta);
      setSettingsDraft(nextSettings.data);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "មិនអាចផ្ទុកទិន្នន័យបានទេ។";
      setError(translate(language, message));
      if (!message.includes("ចូលគណនី")) notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, stockFilter, tagFilter, notify, language]);

  useEffect(() => {
    const handleUnauthenticated = () => router.replace("/login");
    window.addEventListener("afiya:unauthenticated", handleUnauthenticated);
    return () => window.removeEventListener("afiya:unauthenticated", handleUnauthenticated);
  }, [router]);

  useEffect(() => {
    if (!settingsBannerPreview) return;
    return () => URL.revokeObjectURL(settingsBannerPreview);
  }, [settingsBannerPreview]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const visiblePages = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, pagination.last_page - 4));
    return Array.from({ length: Math.min(5, pagination.last_page) }, (_, index) => start + index);
  }, [page, pagination.last_page]);

  function openProduct(product: AdminProduct | null) {
    setEditing(product);
    setDraftImages(product?.images.map((image) => ({
      key: `existing-${image.id}`,
      url: image.url,
      image,
    })) || []);
    setProductModal(true);
  }

  async function chooseImages(files: FileList | null) {
    if (!files?.length) return;
    try {
      const selected = Array.from(files);
      if (draftImages.length + selected.length > 5) throw new Error("អាចដាក់រូបភាពបានអតិបរមា ៥ រូប។");
      const compressed = await Promise.all(selected.map(compressImage));
      const next = compressed.map((file) => ({
        key: `new-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
        file,
      }));
      setDraftImages((current) => [...current, ...next]);
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "មិនអាចរៀបចំរូបភាពបានទេ។", "error");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function moveDraft(fromKey: string, toKey: string) {
    setDraftImages((current) => {
      const from = current.findIndex((item) => item.key === fromKey);
      const to = current.findIndex((item) => item.key === toKey);
      if (from < 0 || to < 0 || from === to) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  async function removeDraftImage(item: DraftImage) {
    try {
      if (item.image && editing) {
        await api(`admin/products/${editing.id}/images/${item.image.id}`, { method: "DELETE" });
      }
      setDraftImages((current) => current.filter((entry) => entry.key !== item.key));
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "មិនអាចលុបរូបភាពបានទេ។", "error");
    }
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      tag: String(form.get("tag") || "pastel"),
      price: Number(form.get("price")),
      old_price: String(form.get("old_price") || "").trim() ? Number(form.get("old_price")) : null,
      stock: String(form.get("stock") || "in_stock"),
      description: String(form.get("description") || "").trim() || null,
    };
    if (draftImages.length > 5) {
      notify("អាចដាក់រូបភាពបានអតិបរមា ៥ រូប។", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = editing
        ? await api<{ data: AdminProduct }>(`admin/products/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await api<{ data: AdminProduct }>("admin/products", { method: "POST", body: JSON.stringify(payload) });
      const productId = editing?.id || saved.data.id;
      const newFiles = draftImages.flatMap((image) => image.file ? [image.file] : []);
      let updatedProduct = saved.data;
      if (newFiles.length) {
        const imageForm = new FormData();
        newFiles.forEach((file) => imageForm.append("images[]", file));
        const uploaded = await api<{ data: AdminProduct }>(`admin/products/${productId}/images`, {
          method: "POST",
          body: imageForm,
        });
        updatedProduct = uploaded.data;
      }
      const uploadedImages = updatedProduct.images.filter((image) => !draftImages.some((draft) => draft.image?.id === image.id));
      const uploadIterator = uploadedImages[Symbol.iterator]();
      const orderedIds = draftImages.map((draft) => draft.image?.id ?? uploadIterator.next().value?.id).filter((id): id is number => typeof id === "number");
      if (orderedIds.length) {
        await api(`admin/products/${productId}/images/reorder`, {
          method: "PUT",
          body: JSON.stringify({ image_ids: orderedIds }),
        });
      }
      setProductModal(false);
      await loadData();
      notify(editing ? "បានកែសម្រួលម៉ូដរួចរាល់។" : "បានបន្ថែមម៉ូដថ្មីរួចរាល់។");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "មិនអាចរក្សាទុកម៉ូដបានទេ។", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: AdminProduct) {
    const confirmation = language === "en"
      ? `Are you sure you want to delete “${product.name}”?`
      : `តើអ្នកប្រាកដថាចង់លុប «${product.name}» មែនទេ?`;
    if (!window.confirm(confirmation)) return;
    try {
      await api(`admin/products/${product.id}`, { method: "DELETE" });
      await loadData();
      notify("បានលុបម៉ូដ និងរូបភាពទាក់ទងរួចរាល់។");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "មិនអាចលុបម៉ូដបានទេ។", "error");
    }
  }

  async function toggleStock(product: AdminProduct) {
    const nextStock = product.stock === "in_stock" ? "out_of_stock" : "in_stock";
    try {
      await api(`admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...product, stock: nextStock }),
      });
      await loadData();
      notify("បានកែប្រែស្ថានភាពស្តុករួចរាល់។");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "មិនអាចកែស្ថានភាពស្តុកបានទេ។", "error");
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      shop_name: String(form.get("shop_name") || "").trim(),
      shop_subtitle: String(form.get("shop_subtitle") || "").trim(),
      fb_url: String(form.get("fb_url") || "").trim(),
      protect_copy: form.get("protect_copy") === "on",
    };
    try {
      const result = await api<{ data: ShopSettings }>("admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      let newSettings = result.data;
      if (settingsAvatar) {
        const avatarForm = new FormData();
        avatarForm.append("avatar", settingsAvatar);
        const avatarResult = await api<{ data: ShopSettings }>("admin/settings/avatar", {
          method: "POST",
          body: avatarForm,
        });
        newSettings = avatarResult.data;
        setSettingsAvatar(null);
      }
      if (settingsBanner) {
        const bannerForm = new FormData();
        bannerForm.append("banner", settingsBanner);
        const bannerResult = await api<{ data: ShopSettings }>("admin/settings/banner", {
          method: "POST",
          body: bannerForm,
        });
        newSettings = bannerResult.data;
        setSettingsBanner(null);
        setSettingsBannerPreview(null);
      }
      setSettingsDraft(newSettings);
      notify("បានរក្សាទុកការកំណត់ហាងរួចរាល់។");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "មិនអាចរក្សាទុកការកំណត់បានទេ។", "error");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await api("auth/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: form.get("current_password"),
          password: form.get("password"),
          password_confirmation: form.get("password_confirmation"),
        }),
      });
      setPasswordModal(false);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) notify("ពាក្យសម្ងាត់បានប្ដូរ ប៉ុន្តែមិនអាចបញ្ចប់វគ្គ API បានទេ។", "error");
      router.replace("/login");
      router.refresh();
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "មិនអាចប្ដូរពាក្យសម្ងាត់បានទេ។", "error");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) notify("វគ្គ API មានបញ្ហា ប៉ុន្តែបានដកសិទ្ធិចូលក្នុងកម្មវិធី។", "error");
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="admin-header">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/afiya-shope-logo.png" alt="Afiya Shope" width={160} height={60} className="h-10 w-24 object-contain sm:h-12 sm:w-32" />
            <p className="m-0 text-xs text-slate-500">{t("ផ្ទាំងគ្រប់គ្រងម្ចាស់ហាង")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <PreferenceControls />
            <span className="hidden text-xs text-slate-600 sm:inline">{user?.name || user?.email}</span>
            <button type="button" className="button button-soft" onClick={() => setPasswordModal(true)}>{t("ប្ដូរពាក្យសម្ងាត់")}</button>
            <button type="button" className="button button-danger" onClick={logout}>{t("ចាកចេញ")}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 text-2xl font-bold text-slate-900">{language === "en" ? `Hello ${user?.name || "Shop owner"} 👋` : `សួស្តី ${user?.name || "ម្ចាស់ហាង"} 👋`}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("គ្រប់គ្រងម៉ូដ និងព័ត៌មានហាងរបស់អ្នក។")}</p>
          </div>
          <nav className="flex gap-2" aria-label={t("ផ្នែកគ្រប់គ្រង")}>
            <button className={`tab-button${view === "products" ? " active" : ""}`} onClick={() => setView("products")} type="button">{t("កាតាឡុកម៉ូដ")}</button>
            <button className={`tab-button${view === "settings" ? " active" : ""}`} onClick={() => setView("settings")} type="button">{t("ការកំណត់ហាង")}</button>
          </nav>
        </div>

        {error ? <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error} <button type="button" className="ml-2 underline" onClick={() => void loadData()}>{t("ព្យាយាមម្ដងទៀត")}</button></div> : null}

        {view === "products" ? (
          <>
            <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label={t("ម៉ូដសរុប")} value={stats.total} accent="blue" language={language} />
              <StatCard label={t("មានក្នុងស្តុក")} value={stats.in_stock} accent="green" language={language} />
              <StatCard label={t("អស់ស្តុក")} value={stats.out_of_stock} accent="rose" language={language} />
            </section>
            <section className="admin-card mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-lg font-bold">{t("បញ្ជីម៉ូដ")} ({formatNumber(stats.total, language)}/200)</h2>
                <button className="button button-primary" type="button" disabled={stats.total >= 200} onClick={() => openProduct(null)}>{t("＋ បន្ថែមម៉ូដ")}</button>
              </div>
              <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_165px_165px_auto]" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
                <input className="field" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t("ស្វែងរកឈ្មោះ ឬការពិពណ៌នា...")} aria-label={t("ស្វែងរកម៉ូដ")} />
                <select className="field" value={tagFilter} onChange={(event) => { setTagFilter(event.target.value); setPage(1); }} aria-label={t("តម្រងប្រភេទ")}>
                  <option value="">{t("ប្រភេទទាំងអស់")}</option>
                  <option value="pastel">{t("🌸 ពណ៌ Pastel")}</option>
                  <option value="luxury">{t("✨ ម៉ូដប្រណិត")}</option>
                  <option value="set">{t("👗 ឈុតពេញ")}</option>
                </select>
                <select className="field" value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setPage(1); }} aria-label={t("តម្រងស្តុក")}>
                  <option value="">{t("ស្តុកទាំងអស់")}</option>
                  <option value="in_stock">{t("មានក្នុងស្តុក")}</option>
                  <option value="out_of_stock">{t("អស់ស្តុក")}</option>
                </select>
                <button className="button button-soft" type="submit">{t("ស្វែងរក")}</button>
              </form>
              {loading ? <LoadingState language={language} /> : products.length ? (
                <>
                  <div className="table-wrap mt-4">
                    <table className="admin-table">
                      <thead><tr><th>{t("ម៉ូដ")}</th><th>{t("ប្រភេទ")}</th><th>{t("តម្លៃ")}</th><th>{t("ស្តុក")}</th><th>{t("រូប")}</th><th>{t("សកម្មភាព")}</th></tr></thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td><span className="font-bold">{product.name}</span><span className="block text-[10px] text-slate-500">{product.description}</span></td>
                            <td>{t(TAG_LABELS[product.tag])}</td>
                            <td className="whitespace-nowrap font-bold text-[#1696c4]">{formatRiel(product.price, language)}</td>
                            <td><span className={`pill${product.stock === "out_of_stock" ? " out" : ""}`}>{t(product.stock === "in_stock" ? "មានក្នុងស្តុក" : "អស់ស្តុក")}</span></td>
                            <td>{formatNumber(product.images.length, language)}/5</td>
                            <td>
                              <div className="flex min-w-[180px] flex-wrap gap-1.5">
                                <button className="button button-soft !min-h-8 !px-2.5 !text-[11px]" type="button" onClick={() => openProduct(product)}>{t("កែ")}</button>
                                <button className="button button-soft !min-h-8 !px-2.5 !text-[11px]" type="button" onClick={() => void toggleStock(product)}>{t("ប្ដូរស្តុក")}</button>
                                <button className="button button-danger !min-h-8 !px-2.5 !text-[11px]" type="button" onClick={() => void deleteProduct(product)}>{t("លុប")}</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {visiblePages.map((number) => (
                      <button key={number} className={`tab-button${page === number ? " active" : ""}`} type="button" onClick={() => setPage(number)}>{formatNumber(number, language)}</button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-lg font-bold">{t("មិនមានម៉ូដត្រូវនឹងការស្វែងរកទេ។")}</p>
                  <button type="button" className="button button-soft" onClick={() => { setSearch(""); setSearchInput(""); }}>{t("បង្ហាញម៉ូដទាំងអស់")}</button>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="admin-card mt-5 max-w-3xl">
            <h2 className="m-0 text-lg font-bold">{t("កំណត់ព័ត៌មានហាង")}</h2>
            <form className="mt-4 grid gap-4" onSubmit={saveSettings}>
              <label className="grid gap-1.5 text-sm font-bold">{t("ឈ្មោះហាង")}<input className="field" name="shop_name" defaultValue={settingsDraft.shop_name} maxLength={100} required /></label>
              <label className="grid gap-1.5 text-sm font-bold">{t("ចំណងជើងរង")}<input className="field" name="shop_subtitle" defaultValue={settingsDraft.shop_subtitle} maxLength={200} /></label>
              <label className="grid gap-1.5 text-sm font-bold">{t("តំណ Facebook Page")}<input className="field" name="fb_url" type="url" defaultValue={settingsDraft.fb_url} required /></label>
              <div className="flex flex-wrap items-center gap-3">
                {settingsDraft.avatar_url ? <Image src={settingsDraft.avatar_url} alt={t("រូបតំណាងហាង")} width={76} height={76} unoptimized className="h-[76px] w-[76px] rounded-full border-2 border-[#29B6E8] object-cover" /> : null}
                <label className="grid gap-1 text-sm font-bold">{t("រូបតំណាងហាង")}
                  <input className="field max-w-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try { setSettingsAvatar(await compressImage(file)); }
                    catch (reason) { notify(reason instanceof Error ? reason.message : "មិនអាចរៀបចំរូបភាពបានទេ។", "error"); }
                  }} />
                </label>
              </div>
              <div className="grid gap-3">
                <p className="m-0 text-sm font-bold">{t("រូបភាពបដា")}</p>
                {settingsBannerPreview || settingsDraft.banner_url ? (
                  <Image
                    src={settingsBannerPreview || settingsDraft.banner_url || ""}
                    alt={t("មើលរូបភាពបដា")}
                    width={480}
                    height={180}
                    unoptimized
                    className="h-36 w-full max-w-xl rounded-2xl border border-pink-200 object-cover"
                  />
                ) : (
                  <p className="m-0 text-sm text-slate-500">{t("មិនទាន់មានរូបភាពបដាទេ។")}</p>
                )}
                <label className="grid gap-1 text-sm font-bold">
                  {t("ជ្រើសរើសរូបភាពសម្រាប់បដា")}
                  <input
                    className="field max-w-sm"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.currentTarget.value = "";
                      if (!file) return;
                      try {
                        const compressed = await compressImage(file);
                        setSettingsBanner(compressed);
                        setSettingsBannerPreview(URL.createObjectURL(compressed));
                      } catch (reason) {
                        notify(reason instanceof Error ? reason.message : "មិនអាចរៀបចំរូបភាពបានទេ។", "error");
                      }
                    }}
                  />
                </label>
                <p className="m-0 text-xs text-slate-500">{t("រូបភាពនឹងបង្ហាញនៅខាងស្តាំបដា និងត្រូវបានបង្ហាប់ស្វ័យប្រវត្តិមុនផ្ទុកឡើង។")}</p>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-pink-100 bg-pink-50/50 p-3 text-sm font-bold">
                <input type="checkbox" name="protect_copy" defaultChecked={settingsDraft.protect_copy} className="h-5 w-5 accent-[#29B6E8]" />
                {t("ការពារការចម្លង និងចុចស្ដាំក្នុងគេហទំព័រភ្ញៀវ")}
              </label>
              <button className="button button-primary w-fit" type="submit" disabled={saving || loading} aria-busy={saving || loading}>
                {saving ? <LoadingSpinner /> : null}{saving ? t("កំពុងរក្សាទុក…") : t("រក្សាទុកការកំណត់")}
              </button>
            </form>
          </section>
        )}
      </main>

      {productModal ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProductModal(false); }}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-pink-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div><p className="m-0 text-[10px] font-bold tracking-widest text-pink-600">{t("គ្រប់គ្រងកាតាឡុក")}</p><h2 id="product-modal-title" className="m-0 text-lg font-bold">{t(editing ? "កែសម្រួលម៉ូដ" : "បន្ថែមម៉ូដថ្មី")}</h2></div>
              <button type="button" className="button button-soft !min-h-8 !px-3" onClick={() => setProductModal(false)}>✕</button>
            </div>
            <form className="grid gap-4 p-5" onSubmit={saveProduct}>
              <label className="grid gap-1.5 text-sm font-bold">{t("ឈ្មោះម៉ូដ")}<input className="field" name="name" defaultValue={editing?.name || ""} maxLength={150} required /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold">{t("ប្រភេទ")}<select className="field" name="tag" defaultValue={editing?.tag || "pastel"}><option value="pastel">{t("🌸 ពណ៌ Pastel")}</option><option value="luxury">{t("✨ ម៉ូដប្រណិត")}</option><option value="set">{t("👗 ឈុតពេញ")}</option></select></label>
                <label className="grid gap-1.5 text-sm font-bold">{t("ស្តុក")}<select className="field" name="stock" defaultValue={editing?.stock || "in_stock"}><option value="in_stock">{t("មានក្នុងស្តុក")}</option><option value="out_of_stock">{t("អស់ស្តុក")}</option></select></label>
                <label className="grid gap-1.5 text-sm font-bold">{t("តម្លៃ (៛)")}<input className="field" type="number" name="price" min="0" step="1" defaultValue={editing?.price ?? ""} required /></label>
                <label className="grid gap-1.5 text-sm font-bold">{t("តម្លៃដើម (៛)")}<input className="field" type="number" name="old_price" min="0" step="1" defaultValue={editing?.old_price ?? ""} /></label>
              </div>
              <label className="grid gap-1.5 text-sm font-bold">{t("ការពិពណ៌នា")}<textarea className="field min-h-24" name="description" defaultValue={editing?.description || ""} maxLength={10000} /></label>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="m-0 text-sm font-bold">{t("រូបភាព")} ({formatNumber(draftImages.length, language)}/5) — {t("អូសដើម្បីរៀបលំដាប់")}</p>
                  <button className="button button-soft" type="button" disabled={draftImages.length >= 5} onClick={() => fileInput.current?.click()}>{t("＋ ជ្រើសរូបភាព")}</button>
                  <input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void chooseImages(event.target.files)} />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {draftImages.map((image, index) => (
                    <div key={image.key} draggable onDragStart={() => setDraggedKey(image.key)} onDragOver={(event) => event.preventDefault()} onDrop={() => draggedKey && moveDraft(draggedKey, image.key)} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-pink-200 bg-pink-50">
                      <Image src={image.url} alt={`${t("រូបភាព")} ${formatNumber(index + 1, language)}`} fill sizes="120px" unoptimized className="object-cover" />
                      <span className="absolute left-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-white">{index + 1}</span>
                      <button className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-xs font-bold text-white" type="button" aria-label={t("លុបរូបភាព")} onClick={() => void removeDraftImage(image)}>×</button>
                    </div>
                  ))}
                  {!draftImages.length ? <p className="col-span-full rounded-xl border border-dashed border-pink-200 p-5 text-center text-xs text-slate-500">{t("មិនទាន់មានរូបភាព។")}</p> : null}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-pink-100 pt-4">
                <button className="button button-soft" type="button" onClick={() => setProductModal(false)}>{t("បោះបង់")}</button>
                <button className="button button-primary" type="submit" disabled={saving} aria-busy={saving}>
                  {saving ? <LoadingSpinner /> : null}{saving ? t("កំពុងរក្សាទុក…") : t("រក្សាទុកម៉ូដ")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {passwordModal ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPasswordModal(false); }}>
          <section className="modal-panel max-w-md" role="dialog" aria-modal="true" aria-labelledby="password-title">
            <div className="flex items-center justify-between border-b border-pink-100 px-5 py-4"><h2 id="password-title" className="m-0 text-lg font-bold">{t("ប្ដូរពាក្យសម្ងាត់")}</h2><button className="button button-soft !min-h-8 !px-3" type="button" onClick={() => setPasswordModal(false)}>✕</button></div>
            <form className="grid gap-4 p-5" onSubmit={changePassword}>
              <label className="grid gap-1.5 text-sm font-bold">{t("ពាក្យសម្ងាត់បច្ចុប្បន្ន")}<input className="field" name="current_password" type="password" autoComplete="current-password" required /></label>
              <label className="grid gap-1.5 text-sm font-bold">{t("ពាក្យសម្ងាត់ថ្មី")}<input className="field" name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
              <label className="grid gap-1.5 text-sm font-bold">{t("បញ្ជាក់ពាក្យសម្ងាត់ថ្មី")}<input className="field" name="password_confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>
              <button className="button button-primary" type="submit" disabled={saving} aria-busy={saving}>
                {saving ? <LoadingSpinner /> : null}{saving ? t("កំពុងរក្សាទុក…") : t("ប្ដូរពាក្យសម្ងាត់")}
              </button>
            </form>
          </section>
        </div>
      ) : null}
      {toast ? <div className={`toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div> : null}
    </div>
  );
}

function StatCard({ label, value, accent, language }: { label: string; value: number; accent: string; language: "km" | "en" }) {
  const colors: Record<string, string> = {
    blue: "border-sky-200 text-[#1696c4]",
    green: "border-emerald-200 text-emerald-700",
    rose: "border-rose-200 text-rose-700",
  };
  return (
    <article className={`admin-card border ${colors[accent]}`}>
      <p className="m-0 text-sm font-bold text-slate-600">{label}</p>
      <p className="mb-0 mt-2 text-3xl font-extrabold">{formatNumber(value, language)}</p>
    </article>
  );
}

function LoadingState({ language }: { language: "km" | "en" }) {
  return (
    <div className="admin-loading-state" aria-busy="true">
      <LoadingIndicator message={translate(language, "កំពុងផ្ទុកទិន្នន័យ…")} />
    </div>
  );
}

const TAG_LABELS: Record<AdminProduct["tag"], string> = {
  pastel: "🌸 Pastel",
  luxury: "✨ ប្រណិត",
  set: "👗 ឈុតពេញ",
};
