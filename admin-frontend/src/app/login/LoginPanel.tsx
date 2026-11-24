"use client";

import Image from "next/image";
import { Suspense } from "react";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { PreferenceControls, usePreferences } from "@/components/PreferencesProvider";
import { translate } from "@/lib/i18n";
import { LoginForm } from "./LoginForm";

export function LoginPanel() {
  const { language } = usePreferences();
  const t = (text: string) => translate(language, text);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="admin-card w-full max-w-md p-6 sm:p-8">
        <div className="mb-4 flex justify-end"><PreferenceControls /></div>
        <Image src="/afiya-shope-logo.png" alt="Afiya Shope" width={180} height={68} className="mx-auto h-14 w-36 object-contain" />
        <h1 className="mt-2 text-center font-serif text-2xl font-bold text-slate-900">{t("ចូលប្រើគណនីម្ចាស់ហាង")}</h1>
        <p className="mt-2 text-center text-sm text-slate-500">{t("សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក។")}</p>
        <Suspense fallback={<LoadingIndicator message={t("កំពុងរៀបចំ…")} className="loading-indicator--compact" />}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
