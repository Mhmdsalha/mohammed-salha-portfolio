import { NextRequest, NextResponse } from "next/server";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  getSessionKey,
  verifySessionToken
} from "@/lib/auth/session";
import { DEFAULT_LOCALE, LOCALES, LOCALE_HEADER, isLocale } from "@/lib/i18n/locales";

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

// Tells src/app/global-not-found.tsx which language an unmatched URL is in. Always overwritten,
// so a visitor's own header is never used.
function nextWithLocale(request: NextRequest, first: string) {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, isLocale(first) ? first : DEFAULT_LOCALE);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // "/" opens the Arabic site (Arabic first, P3-2). Temporary, so it can follow the visitor's
  // language later without browsers caching it.
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    return NextResponse.redirect(url, 307);
  }

  // Paths outside every route group (e.g. /xyz) move under the default locale, as next-intl does;
  // /ar/xyz then gets the localised 404 from src/app/global-not-found.tsx (D-026).
  const first = pathname.split("/")[1] ?? "";
  if (
    !isLocale(first) &&
    first !== "dashboard" &&
    first !== "dev" &&
    !first.startsWith("_") &&
    !pathname.includes(".")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url, 307);
  }

  const localeDashboardPrefix = LOCALES.find(
    (locale) => pathname === `/${locale}/dashboard` || pathname.startsWith(`/${locale}/dashboard/`)
  );

  if (localeDashboardPrefix) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(`/${localeDashboardPrefix}/dashboard`, "/dashboard");
    return NextResponse.redirect(url);
  }

  if (!isDashboardPath(pathname)) {
    return nextWithLocale(request, first);
  }

  if (pathname === LOGIN_PATH) {
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
  // "api" only as a whole segment, so /apifoo is redirected like any other unknown path.
  matcher: ["/((?!api(?:/|$)|_next/static|_next/image|favicon.ico).*)"]
};
