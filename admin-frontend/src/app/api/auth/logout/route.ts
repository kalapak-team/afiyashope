import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("afiya_admin_token")?.value;
  let upstreamFailure = false;

  if (token) {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      upstreamFailure = !response.ok;
    } catch (error) {
      console.error("API sign-out request failed", error);
      upstreamFailure = true;
    }
  }

  const response = NextResponse.json(
    { message: upstreamFailure ? "បានចាកចេញក្នុងឧបករណ៍នេះ ប៉ុន្តែមិនអាចបញ្ចប់វគ្គ API បានទេ។" : "បានចាកចេញរួចរាល់។" },
    { status: upstreamFailure ? 502 : 200 },
  );
  response.cookies.set("afiya_admin_token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
