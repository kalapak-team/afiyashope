import { NextRequest, NextResponse } from "next/server";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  const credentials = await request.json().catch(() => null);
  if (!credentials || typeof credentials.email !== "string" || typeof credentials.password !== "string") {
    return NextResponse.json({ message: "សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់។" }, { status: 422 });
  }

  const upstream = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(credentials),
    cache: "no-store",
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ message: "មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេបានទេ។" }, { status: 502 });

  const body = await upstream.json().catch(() => ({}));
  if (!upstream.ok || typeof body.token !== "string") {
    return NextResponse.json(body, { status: upstream.status });
  }

  const response = NextResponse.json({ user: body.user });
  response.cookies.set("afiya_admin_token", body.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
