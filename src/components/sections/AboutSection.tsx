import type { CSSProperties } from "react";
import {
  BadgeCheck,
  Cpu,
  GraduationCap,
  Layers3,
  LineChart,
  MonitorSmartphone,
  Sparkles
} from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Locale } from "@/types";

const skills = [
  { name: "Next.js", value: 92 },
  { name: "TypeScript", value: 88 },
  { name: "Tailwind CSS", value: 94 },
  { name: "Salla", value: 90 },
  { name: "Supabase", value: 84 },
  { name: "PostgreSQL", value: 78 },
  { name: "UI/UX", value: 86 },
  { name: "Python", value: 72 }
];

const focusItems = [
  {
    icon: MonitorSmartphone,
    title: "Modern Interfaces",
    ar: "واجهات حديثة",
    text: "Responsive, fast, and polished across Arabic and English experiences."
  },
  {
    icon: Layers3,
    title: "Salla Commerce",
    ar: "متاجر سلة",
    text: "Storefronts that balance brand taste, conversion, and smooth buying flows."
  },
  {
    icon: LineChart,
    title: "Product Thinking",
    ar: "تفكير منتجي",
    text: "Clear priorities, scalable data, and dashboards that keep content easy to manage."
  }
];

const workflow = [
  "Discovery",
  "UI Direction",
  "Development",
  "Launch"
];

function SkillMeter({ name, value }: { name: string; value: number }) {
  return (
    <div
      className="group rounded-[26px] p-[4px] shadow-[0_18px_40px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(0,195,225,0.16)]"
      style={
        {
          "--skill-progress": value,
          background:
            "conic-gradient(from -90deg, #00cfff 0deg, #00cfff calc(var(--skill-progress) * 3.6deg), rgba(5,5,5,0.12) calc(var(--skill-progress) * 3.6deg), rgba(5,5,5,0.12) 360deg)"
        } as CSSProperties
      }
    >
      <div className="relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-[22px] bg-white px-5 py-5 text-center md:min-h-[168px]">
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#00cfff] to-transparent opacity-70" />
        <p className="font-duran text-5xl font-black leading-none text-[#050505] md:text-6xl">
          {value}%
        </p>
        <div>
          <p className="text-base font-semibold text-[#2f3842]">{name}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-[#00cfff] shadow-[0_0_18px_rgba(0,207,255,0.55)] transition-all duration-700"
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutSection({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  return (
    <section id="about" className="relative overflow-hidden py-24 md:py-32">
      <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden rounded-[38px] border border-white/80 bg-[#f3f6f8] px-4 py-10 text-[#050505] shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:rounded-[52px] md:px-8 md:py-14">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.035)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00cfff] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div>
              <SectionLabel className="text-[#009fb0]">{"// 01 - ABOUT"}</SectionLabel>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-duran text-4xl font-black text-[#050505] md:text-6xl">
                  {isAr ? "نبذة عني" : "About Me"}
                </h2>
                <span className="rounded-full border border-[#00cfff]/35 bg-white px-4 py-2 text-xs font-bold text-[#007f91] shadow-[0_12px_28px_rgba(0,207,255,0.12)]">
                  Full-stack / Salla / UI
                </span>
              </div>

              <p
                dir={isAr ? "rtl" : "ltr"}
                className={`mt-6 max-w-2xl text-lg font-semibold leading-9 text-[#303b46] ${
                  isAr ? "text-right" : "text-left"
                }`}
              >
                {isAr
                  ? "مطوّر ويب متكامل من غزة، فلسطين، أبني واجهات حديثة ومتاجر سلة للسوق العربي بتوازن بين الأداء، التفاصيل البصرية، وسهولة الإدارة من الداشبورد."
                  : "Full-stack developer from Gaza, Palestine building modern web experiences and Salla stores for the Arab market with a balance of performance, visual detail, and dashboard control."}
              </p>

              <p
                dir={isAr ? "rtl" : "ltr"}
                className={`mt-5 max-w-2xl text-base leading-8 text-[#65707a] ${
                  isAr ? "text-right" : "text-left"
                }`}
              >
                {isAr
                  ? "أهتم بأن تكون التجربة ثنائية اللغة واضحة، سريعة، ومصممة لتبدو راقية من أول شاشة حتى آخر إجراء داخل المنتج."
                  : "I care about bilingual experiences that feel clear, fast, and premium from the first screen to the final product action."}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  isAr ? "RTL مصقول وتجربة عربية واضحة" : "Polished RTL and Arabic UX",
                  isAr ? "واجهات قابلة للإدارة من Supabase" : "Dashboard-managed Supabase content",
                  isAr ? "متاجر سلة بهوية تجارية قوية" : "Salla stores with strong brand direction",
                  isAr ? "تنفيذ سريع بدون التضحية بالجودة" : "Fast execution without losing quality"
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-[#34404c] shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
                  >
                    <BadgeCheck className="size-5 shrink-0 text-[#00aeca]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[26px] border border-black/10 bg-white p-6 shadow-[0_14px_34px_rgba(0,0,0,0.07)]">
                  <p className="font-duran text-5xl font-black text-[#00aeca]">5+</p>
                  <p className="mt-3 text-sm font-semibold text-[#050505]">Live Projects</p>
                  <p className="font-arabic text-sm text-[#65707a]">مشاريع منشورة</p>
                </div>
                <div className="rounded-[26px] border border-black/10 bg-white p-6 shadow-[0_14px_34px_rgba(0,0,0,0.07)]">
                  <p className="font-duran text-5xl font-black text-[#00aeca]">70+</p>
                  <p className="mt-3 text-sm font-semibold text-[#050505]">Clients</p>
                  <p className="font-arabic text-sm text-[#65707a]">عميل</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_16px_38px_rgba(0,0,0,0.07)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <GraduationCap className="mb-4 text-[#00aeca]" />
                    <p className="text-xl font-semibold text-[#050505]">Computer Engineering</p>
                    <p className="mt-2 text-sm text-[#59616a]">Islamic University of Gaza</p>
                  </div>
                  <Sparkles className="size-6 text-[#00aeca]" />
                </div>
                <div className="mt-5 flex items-center gap-2 font-mono text-xs text-[#65707a]">
                  <Cpu size={14} />
                  Engineering precision, product taste
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-[#050505] p-5 text-white shadow-[0_20px_45px_rgba(0,0,0,0.18)]">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#00cfff]">
                  Workflow
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {workflow.map((step, index) => (
                    <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="font-mono text-[11px] text-white/40">0{index + 1}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {focusItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[26px] border border-black/10 bg-white/80 p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]"
              >
                <item.icon className="size-7 text-[#00aeca]" />
                <h3 className="mt-4 text-xl font-black text-[#050505]">{item.title}</h3>
                <p className="font-arabic mt-1 text-sm font-semibold text-[#65707a]">{item.ar}</p>
                <p className="mt-3 text-sm leading-6 text-[#59616a]">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#009fb0]">
                  Capability map
                </p>
                <h3 className="mt-2 font-duran text-3xl font-black text-[#050505] md:text-4xl">
                  {isAr ? "المهارات الأساسية" : "Core Skills"}
                </h3>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#65707a]">
                {isAr
                  ? "نسب تقريبية تعكس أكثر الأدوات والمجالات التي أستخدمها في بناء المشاريع."
                  : "A quick signal of the tools and disciplines I use most when building projects."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {skills.map((skill) => (
                <SkillMeter key={skill.name} name={skill.name} value={skill.value} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
