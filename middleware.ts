import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "ar"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeDashboardPrefix = locales.find((locale) =>
    pathname === `/${locale}/dashboard` || pathname.startsWith(`/${locale}/dashboard/`)
  );

  if (localeDashboardPrefix) {
    const normalizedPathname = pathname.replace(`/${localeDashboardPrefix}/dashboard`, "/dashboard");
    const url = request.nextUrl.clone();
    url.pathname = normalizedPathname;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("dashboard_token")?.value;
    if (token !== "authenticated") {
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!hasLocale && pathname !== "/" && !pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
