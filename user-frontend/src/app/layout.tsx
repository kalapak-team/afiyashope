import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Afiya Shope — ហាង Abaya ប្រណិត",
    template: "%s | Afiya Shope",
  },
  description: "ហាង Abaya ប្រណិត និងទាន់សម័យ។ សេវាដឹកជញ្ជូនទូទាំង ២៥ ខេត្ត-ក្រុង។",
  openGraph: {
    title: "Afiya Shope — ហាង Abaya ប្រណិត",
    description: "សម្រស់សុភាពរាបសារ ជាមួយម៉ូដ Abaya ប្រណិត។",
    locale: "km_KH",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="km">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
