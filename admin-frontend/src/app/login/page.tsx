import type { Metadata } from "next";
import { LoginPanel } from "./LoginPanel";

export const metadata: Metadata = { title: "ចូលគណនីម្ចាស់ហាង" };

export default function LoginPage() {
  return <LoginPanel />;
}
