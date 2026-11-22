import type { AppLocale } from "@/lib/i18n/locales";
import { absoluteUrl, localePath } from "@/lib/seo";

// schema.org JSON-LD for Google's rich results (P3-3, D-027): a ProfilePage about the owner on
// the home page, and a breadcrumb trail on project pages.

type Profile = {
  locale: AppLocale;
  name: string;
  alternateName: string;
  jobTitle: string;
  description: string;
  sameAs: string[];
};

export function profilePageJsonLd(profile: Profile) {
  const url = absoluteUrl(localePath(profile.locale));
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    inLanguage: profile.locale,
    mainEntity: {
      "@type": "Person",
      "@id": `${absoluteUrl("/")}#person`,
      name: profile.name,
      alternateName: profile.alternateName,
      jobTitle: profile.jobTitle,
      description: profile.description,
      image: absoluteUrl("/images/portrait.webp"),
      url,
      ...(profile.sameAs.length > 0 ? { sameAs: profile.sameAs } : {})
    }
  };
}

export function breadcrumbJsonLd(locale: AppLocale, items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localePath(locale, item.path))
    }))
  };
}
