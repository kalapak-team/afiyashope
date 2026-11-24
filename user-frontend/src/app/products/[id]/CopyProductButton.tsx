"use client";

import { useState } from "react";
import { translate, type Language } from "@/lib/i18n";

export function CopyProductButton({
  name,
  price,
  description,
  language,
}: {
  name: string;
  price: string;
  description: string;
  language: Language;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = (text: string) => translate(language, text);

  async function copyInfo() {
    try {
      await navigator.clipboard.writeText(`${name}\n${t("តម្លៃ៖")} ${price}\n${description}`);
      setCopied(true);
    } catch (error) {
      console.error("Copy product info failed", error);
      setFailed(true);
    }
  }

  return (
    <button
      className="min-h-11 rounded-full border border-[#ff9999] bg-pink-50 px-4 py-2 text-sm font-bold text-pink-700 hover:bg-pink-100"
      type="button"
      onClick={copyInfo}
    >
      {copied ? t("✓ បានចម្លងព័ត៌មានរួចរាល់") : failed ? t("មិនអាចចម្លងបានទេ") : t("📋 ចម្លងព័ត៌មានម៉ូដ")}
    </button>
  );
}
