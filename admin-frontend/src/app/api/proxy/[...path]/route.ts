import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("afiya_admin_token")?.value;
  if (!token) {
    return Response.json({ message: "សូមចូលគណនីម្ចាស់ហាង។" }, { status: 401 });
  }

  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const target = new URL(`${API_URL}/${encodedPath}`);
  target.search = request.nextUrl.search;
  const headers = new Headers({ Accept: "application/json", Authorization: `Bearer ${token}` });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    const responseType = upstream.headers.get("content-type");
    if (responseType) responseHeaders.set("Content-Type", responseType);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend API proxy request failed", error);
    return Response.json({ message: "មិនអាចភ្ជាប់ទៅកាន់ API បានទេ។" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
