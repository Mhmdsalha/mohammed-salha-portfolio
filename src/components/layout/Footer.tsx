import { Locale, SiteSettings } from "@/types";

export function Footer({
  locale,
  settings
}: {
  locale: Locale;
  settings: SiteSettings;
}) {
  const isAr = locale === "ar";

  return (
    <footer className="section-shell border-t border-[rgba(0,245,255,0.25)] py-10">
      <div className="flex flex-col gap-5 text-center text-sm text-[var(--text-secondary)] md:flex-row md:items-center md:justify-between md:text-start">
        <p className="font-duran text-lg font-black text-white">Mohammed Salha</p>
        <p>{isAr ? "صُمم وبُني من غزة، فلسطين" : "Designed and built from Gaza, Palestine"}</p>
        <div className="flex items-center justify-center gap-4">
          <a className="focus-ring hover:text-[var(--neon)]" href={settings.github}>
            GitHub
          </a>
          <a className="focus-ring hover:text-[var(--neon)]" href={settings.linkedin}>
            LinkedIn
          </a>
          <a className="focus-ring hover:text-[var(--neon)]" href={settings.twitter}>
            X
          </a>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">© 2026</p>
    </footer>
  );
}
