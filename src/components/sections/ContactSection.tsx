import { Github, Linkedin, Mail, MessageCircle, Phone, Twitter } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Locale, SiteSettings } from "@/types";

function hasValue(value: string) {
  return Boolean(value && value.trim() && value !== "#");
}

export function ContactSection({
  locale,
  settings
}: {
  locale: Locale;
  settings: SiteSettings;
}) {
  const isAr = locale === "ar";
  const whatsappDigits = settings.whatsapp.replace(/[^\d]/g, "");
  const socialLinks = [
    { label: "GitHub", href: settings.github, icon: Github },
    { label: "LinkedIn", href: settings.linkedin, icon: Linkedin },
    { label: "X", href: settings.twitter, icon: Twitter },
    { label: "خمسات", href: settings.khamsat, icon: MessageCircle },
    { label: "مستقل", href: settings.mostaql, icon: MessageCircle }
  ].filter((item) => hasValue(item.href));

  return (
    <section id="contact" className="section-shell py-24 md:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <SectionLabel>{"// 04 - CONTACT"}</SectionLabel>
        <h2 className="font-duran text-4xl font-black text-white md:text-6xl">
          {isAr ? "نبني شيئاً مميزاً معاً" : "Let's Build Something"}
        </h2>
        <p className="neon-text font-arabic mt-4 text-2xl font-semibold">
          {isAr ? "Let's Build Something" : "نبني شيئاً مميزاً معاً"}
        </p>
        <p className="mt-5 text-[var(--text-secondary)]">
          {isAr
            ? "متاح للمشاريع المستقلة والتعاون."
            : "Available for freelance projects and collaborations."}
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {hasValue(settings.whatsapp) ? (
          <GlassCard className="border-[rgba(16,185,129,0.25)] p-6 shadow-[0_0_34px_rgba(16,185,129,0.08)]">
            <MessageCircle className="size-9 text-[var(--success)]" />
            <h3 className="mt-6 text-2xl font-semibold text-white">WhatsApp</h3>
            <p className="mt-2 text-[var(--text-secondary)]">{settings.whatsapp}</p>
            <NeonButton href={whatsappDigits ? `https://wa.me/${whatsappDigits}` : "#"} className="mt-7">
              {isAr ? "أرسل رسالة" : "Send Message"} →
            </NeonButton>
          </GlassCard>
        ) : null}

        {hasValue(settings.phone) ? (
          <GlassCard className="p-6">
            <Phone className="size-9 text-[var(--neon)]" />
            <h3 className="mt-6 text-2xl font-semibold text-white">Phone</h3>
            <p className="mt-2 text-[var(--text-secondary)]">{settings.phone}</p>
            <NeonButton href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} variant="ghost" className="mt-7">
              {isAr ? "اتصل الآن" : "Call Now"} →
            </NeonButton>
          </GlassCard>
        ) : null}

        {hasValue(settings.email) ? (
          <GlassCard className="p-6">
            <Mail className="size-9 text-[var(--neon)]" />
            <h3 className="mt-6 text-2xl font-semibold text-white">Email</h3>
            <p className="mt-2 text-[var(--text-secondary)]">{settings.email}</p>
            <NeonButton href={`mailto:${settings.email}`} variant="ghost" className="mt-7">
              {isAr ? "أرسل بريد" : "Send Email"} →
            </NeonButton>
          </GlassCard>
        ) : null}
      </div>

      {socialLinks.length > 0 ? (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {socialLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="focus-ring glass glass-hover inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-[var(--text-secondary)] hover:text-white"
            >
              <item.icon size={15} />
              {item.label}
            </a>
          ))}
        </div>
      ) : null}

      <GlassCard className="mt-8 flex flex-col items-center justify-between gap-3 p-5 text-center text-sm text-[var(--text-secondary)] md:flex-row md:text-start">
        <span>Gaza, Palestine</span>
        <span>{isAr ? "متاح للعمل عن بُعد عالمياً" : "Open to remote work worldwide"}</span>
      </GlassCard>
    </section>
  );
}
