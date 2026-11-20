import { NextRequest, NextResponse } from "next/server";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  getSessionKey,
  verifySessionToken
} from "@/lib/auth/session";

const locales = ["en", "ar"];
const LOGIN_PATH = "/dashboard/login";

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete({ name: LEGACY_SESSION_COOKIE, path: "/dashboard" });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeDashboardPrefix = locales.find(
    (locale) => pathname === `/${locale}/dashboard` || pathname.startsWith(`/${locale}/dashboard/`)
  );

  if (localeDashboardPrefix) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(`/${localeDashboardPrefix}/dashboard`, "/dashboard");
    return NextResponse.redirect(url);
  }

  if (pathname === LOGIN_PATH || !isDashboardPath(pathname)) {
    return NextResponse.next();
  }

  // First gate only. Server actions re-check with requireAdmin(), because an action can be
  // POSTed to any route, including ones this middleware lets through.
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    getSessionKey()
  );

  return session ? NextResponse.next() : redirectToLogin(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
