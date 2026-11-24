"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePreferences } from "@/components/PreferencesProvider";
import { LoadingSpinner } from "@/components/LoadingIndicator";
import { translate } from "@/lib/i18n";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = usePreferences();
  const t = (text: string) => translate(language, text);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const messages = payload.errors ? Object.values(payload.errors as Record<string, string[]>).flat().join(" ") : "";
        throw new Error(messages || payload.message || "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។");
      }
      const requestedPath = searchParams.get("next");
      const next = requestedPath && requestedPath.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/";
      router.replace(next);
      router.refresh();
    } catch (reason) {
      setError(t(reason instanceof Error ? reason.message : "មិនអាចចូលគណនីបានទេ។"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={submit}>
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        {t("អ៊ីមែល")}
        <input className="field" type="email" name="email" autoComplete="username" required maxLength={255} />
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        {t("ពាក្យសម្ងាត់")}
        <input className="field" type="password" name="password" autoComplete="current-password" required />
      </label>
      {error ? <p role="alert" className="m-0 rounded-xl bg-rose-50 p-3 text-sm font-bold leading-6 text-rose-700">{error}</p> : null}
      <button className="button button-primary w-full" type="submit" disabled={loading} aria-busy={loading}>
        {loading ? <LoadingSpinner /> : null}{loading ? t("កំពុងចូលគណនី…") : t("ចូលគណនី")}
      </button>
    </form>
  );
}
