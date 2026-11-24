import type { Metadata } from "next";
import { PreferencesProvider } from "@/components/PreferencesProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "គ្រប់គ្រង Afiya Shope",
  description: "ផ្ទាំងគ្រប់គ្រងម្ចាស់ហាង Afiya Shope",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="km">
      <body>
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
