import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/unauthorized", "/solicitar-acesso"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Check for session cookie (httpOnly cookie set by the BFF)
  const session = request.cookies.get("compra_session");

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icons|api).*)"],
};
