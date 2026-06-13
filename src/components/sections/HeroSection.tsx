"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, Github, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { getPublicEnv } from "@/lib/env";
import { Locale, SiteSettings } from "@/types";

const roles = ["Full-Stack Developer", "Salla Store Specialist", "Arabic Web Experiences"];

export function HeroSection({
  locale,
  settings
}: {
  locale: Locale;
  settings?: SiteSettings;
}) {
  const [roleIndex, setRoleIndex] = useState(0);
  const [typedRole, setTypedRole] = useState("");
  const isAr = locale === "ar";
  const publicEnv = getPublicEnv();
  const contact = settings ?? {
    ...publicEnv,
    phone: publicEnv.whatsapp,
    khamsat: "#",
    mostaql: "#"
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRoleIndex((index) => (index + 1) % roles.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const fullText = roles[roleIndex];
    let index = 0;
    setTypedRole("");

    const typeInterval = window.setInterval(() => {
      index += 1;
      setTypedRole(fullText.slice(0, index));

      if (index >= fullText.length) {
        window.clearInterval(typeInterval);
      }
    }, 42);

    return () => window.clearInterval(typeInterval);
  }, [roleIndex]);

  return (
    <section className="relative flex min-h-0 items-start overflow-visible px-0 pb-10 pt-0 md:min-h-screen md:items-center md:px-6 md:py-24">
      <svg aria-hidden="true" className="absolute size-0">
        <clipPath id="hero-card-clip" clipPathUnits="objectBoundingBox">
          <path d="M0.05,-0.16 H0.95 Q1,-0.16 1,-0.04 V0.88 Q1,0.94 0.95,0.955 L0.05,1 Q0,1 0,0.88 V-0.04 Q0,-0.16 0.05,-0.16 Z" />
        </clipPath>
      </svg>

      <div className="hero-shell mx-auto w-full max-w-[1340px] overflow-visible drop-shadow-[0_18px_44px_rgba(0,0,0,0.34)]">
        <div
          dir="ltr"
          className="hero-card hero-card-mask relative overflow-hidden rounded-b-[34px] rounded-t-none bg-[#f3f6f8] px-5 pb-0 pt-[132px] text-[#050505] md:min-h-[480px] md:overflow-visible md:rounded-[64px] md:px-10 md:pb-8 md:pt-8 lg:px-14"
        >
          <div className="hero-card-grid absolute inset-0 rounded-b-[34px] rounded-t-none opacity-55 [background-image:linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:38px_38px] md:rounded-[64px]" />
          <div className="absolute -right-20 top-4 h-72 w-72 rounded-full bg-[#00cfff]/15 blur-3xl" />

          <Image
            src="/images/mohammed-avatar-hero.png"
            alt="Mohammed Salha avatar"
            width={873}
            height={935}
            priority
            className="hero-character pointer-events-none absolute -right-2 -top-4 z-10 hidden h-[calc(100%+14px)] w-auto max-w-none object-contain object-bottom drop-shadow-[0_26px_34px_rgba(0,0,0,0.22)] lg:block"
          />

          <div className="relative z-20 grid gap-4 lg:min-h-[420px] lg:grid-cols-[0.54fr_0.46fr] lg:items-center lg:gap-6">
            <div className="hero-copy mx-auto flex w-full max-w-[760px] flex-col items-center text-center lg:mx-0 lg:block lg:max-w-none lg:text-left">
              <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-[#00cfff]/25 bg-white px-4 py-2 text-xs font-semibold text-[#59616a] shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
                <span
                  className="size-2 shrink-0 rounded-full bg-[#00cfff] shadow-[0_0_14px_rgba(0,207,255,0.85)]"
                  style={{ animation: "pulse-dot 1.7s infinite" }}
                />
                <span className="truncate">
                  {isAr ? "متاح للعمل | Available for work" : "Available for work | متاح للعمل"}
                </span>
              </div>

              <div className="mt-5 space-y-3 md:mt-7 md:space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#009fb0] md:text-xs md:tracking-[0.22em]">
                  Portfolio / Full-stack
                </p>
                <h1 className="mx-auto max-w-[620px] font-duran text-[clamp(2.85rem,15vw,4.35rem)] font-black leading-[0.9] tracking-normal text-[#050505] md:text-[clamp(3.8rem,7vw,6rem)] lg:mx-0">
                  Mohammed Salha
                </h1>
                <div className="mx-auto inline-flex min-h-11 w-full max-w-[330px] items-center justify-center rounded-full border border-[#00cfff]/45 bg-white px-5 font-mono text-sm font-semibold text-[#007f91] shadow-[0_12px_30px_rgba(0,207,255,0.12)] sm:max-w-[420px] sm:text-base lg:mx-0 lg:justify-start">
                  <span aria-live="polite">{typedRole}</span>
                  <span className="ml-1 h-5 w-px animate-pulse bg-[#00cfff] shadow-[0_0_10px_rgba(0,207,255,0.8)]" />
                </div>
              </div>

              <p
                dir={isAr ? "rtl" : "ltr"}
                className="mx-auto mt-4 max-w-xl text-balance text-center text-[15px] font-semibold leading-7 text-[#3f4650] sm:text-base md:mt-5 md:text-lg md:leading-8 lg:mx-0 lg:text-left"
              >
                {isAr
                  ? "أبني تجارب رقمية راقية، متاجر سلة، وتطبيقات ويب عربية تجمع بين الأداء، التصميم، وتجربة الاستخدام الواضحة."
                  : "Building premium digital experiences, Salla stores, and Arabic-first web applications with careful design and fast execution."}
              </p>

              <div className="mt-5 flex w-full max-w-[360px] flex-col gap-3 sm:max-w-md sm:flex-row lg:mt-6">
                <a
                  href="#projects"
                  className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#00aeca] bg-[#00cfff] px-6 text-sm font-black text-[#041316] shadow-[0_16px_34px_rgba(0,207,255,0.22)] transition hover:bg-[#25dcff] md:min-h-12"
                >
                  {isAr ? "شاهد أعمالي" : "View My Work"} <ArrowUpRight size={16} />
                </a>
                <a
                  href="#contact"
                  className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-black/12 bg-white px-6 text-sm font-black text-[#050505] shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition hover:border-[#00aeca]/60 hover:text-[#007f91] md:min-h-12"
                >
                  {isAr ? "تواصل معي" : "Get in Touch"}
                </a>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3 lg:mt-5 lg:justify-start">
                {[
                  { href: contact.github, label: "GitHub", icon: Github },
                  { href: contact.linkedin, label: "LinkedIn", icon: Linkedin },
                  { href: contact.twitter, label: "X", icon: Twitter },
                  {
                    href: `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`,
                    label: "WhatsApp",
                    icon: MessageCircle
                  }
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#59616a] shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition hover:border-[#00aeca]/55 hover:text-[#009fb0]"
                  >
                    <item.icon size={17} />
                  </a>
                ))}
              </div>
            </div>

            <div className="relative mx-auto mt-1 h-[250px] w-full max-w-[420px] overflow-visible sm:h-[300px] md:h-[370px] lg:hidden">
              <Image
                src="/images/mohammed-avatar-hero.png"
                alt="Mohammed Salha avatar"
                width={873}
                height={935}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="absolute left-1/2 -bottom-1 h-[calc(100%+8px)] w-auto max-w-none -translate-x-1/2 object-contain object-bottom drop-shadow-[0_26px_34px_rgba(0,0,0,0.22)]"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 hidden w-px flex-col items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] md:flex">
          <span className="h-12 w-px bg-gradient-to-b from-[var(--neon)] to-transparent" />
          scroll
        </div>
      </div>
    </section>
  );
}
