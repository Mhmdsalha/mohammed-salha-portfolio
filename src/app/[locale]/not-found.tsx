import { getLocale } from "next-intl/server";
import { NotFoundContent } from "@/components/site/NotFoundContent";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";

// notFound() from a page under /ar or /en, e.g. an unknown project slug (P3-2). Rendered inside
// the locale layout, so it has the right <html lang dir>. Next 15.5 sends its error shell first
// for a thrown notFound() and renders this on the client (D-026). Unmatched URLs never get here:
// src/app/global-not-found.tsx renders them on the server.
export default async function LocaleNotFound() {
  const current = await getLocale();
  return <NotFoundContent locale={isLocale(current) ? current : DEFAULT_LOCALE} />;
}
