import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("afiya_admin_token")?.value;
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/proxy") && !token) {
    return NextResponse.json({ message: "សូមចូលគណនីម្ចាស់ហាង។" }, { status: 401 });
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname !== "/login" && !token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.).*)"],
};
