import { getRequestConfig } from "next-intl/server";
import { Locale } from "@/types";

const locales: Locale[] = ["en", "ar"];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const safeLocale = locales.includes(requested as Locale) ? (requested as Locale) : "en";

  return {
    locale: safeLocale,
    messages: (await import(`@/messages/${safeLocale}.json`)).default
  };
});
