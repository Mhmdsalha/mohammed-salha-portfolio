import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase URL or service role key in .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const projects = [
  {
    slug: "al-nakhba-real-estate",
    title_ar: "النخبة للعقارات",
    title_en: "Al Nakhba Real Estate",
    description_ar:
      "واجهة عقارية عربية فاخرة تعرض فرص البيع والاستثمار وإدارة العقارات بتجربة واضحة ومصممة للثقة.",
    description_en:
      "A premium Arabic real estate website for curated sales, investment, and property management opportunities.",
    category: "webapp",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "RTL", "Real Estate"],
    thumbnail_url: null,
    images: [],
    live_url: "https://al-nakhba-real-estate.vercel.app/",
    github_url: "https://github.com/Mhmdsalha/al-nakhba-real-estate",
    featured: true,
    order_num: 1
  },
  {
    slug: "lamsa-beauty-store",
    title_ar: "لمسة - متجر جمال فاخر",
    title_en: "Lamsa - Luxury Beauty Store",
    description_ar:
      "متجر سلة فاخر لمنتجات الجمال، يركز على عرض المنتجات بطريقة راقية وتجربة شراء واضحة وسريعة.",
    description_en:
      "A premium Salla beauty storefront with refined product discovery, elegant sections, and conversion-focused shopping flows.",
    category: "salla",
    tags: ["Salla", "Next.js", "Tailwind CSS", "Arabic UX", "E-commerce"],
    thumbnail_url: null,
    images: [],
    live_url: "https://lamsa-store-design.vercel.app/",
    github_url: null,
    featured: false,
    order_num: 2
  },
  {
    slug: "oud-abaya-store",
    title_ar: "عُود - متجر عبايات فاخر",
    title_en: "Oud - Luxury Abaya Store",
    description_ar:
      "تجربة متجر سلة داكنة وفاخرة لعلامة عبايات، تجمع بين الطابع العربي الأصيل وتجربة تجارة حديثة.",
    description_en:
      "A luxury abaya Salla storefront with a dark editorial identity, RTL polish, and modern commerce patterns.",
    category: "salla",
    tags: ["Salla", "Next.js", "Tailwind CSS", "RTL", "Luxury UI"],
    thumbnail_url: null,
    images: [],
    live_url: "https://oud-store-design.vercel.app/",
    github_url: null,
    featured: false,
    order_num: 3
  },
  {
    slug: "lolo-kids-store",
    title_ar: "لولو - متجر أطفال",
    title_en: "Lolo - Children's Store",
    description_ar:
      "متجر أطفال عربي بتصميم لطيف ومنظم، يوازن بين إحساس مرح وواجهة شراء عملية وسهلة.",
    description_en:
      "A playful premium Salla kids store with polished product browsing, Arabic-friendly layout, and soft visual hierarchy.",
    category: "salla",
    tags: ["Salla", "Next.js", "Tailwind CSS", "Responsive UI", "Kids Store"],
    thumbnail_url: null,
    images: [],
    live_url: "https://lolo-store-design.vercel.app/",
    github_url: null,
    featured: false,
    order_num: 4
  },
  {
    slug: "arzaq-marketplace",
    title_ar: "أرزاق - منصة عمل حر",
    title_en: "Arzaq - Freelance Marketplace",
    description_ar:
      "منصة سوق خدمات عربية محلية بتجربة واضحة للبائعين والمشترين، ولوحات ومكوّنات مهيأة للتوسع.",
    description_en:
      "An Arabic freelance marketplace concept with seller and buyer flows, structured marketplace cards, and scalable full-stack UX.",
    category: "webapp",
    tags: ["Next.js", "TypeScript", "Supabase", "Marketplace", "RTL"],
    thumbnail_url: null,
    images: [],
    live_url: "https://arzaq-ps.vercel.app/",
    github_url: null,
    featured: false,
    order_num: 5
  },
  {
    slug: "saree3-pos",
    title_ar: "سريع - نظام نقاط بيع",
    title_en: "Saree3 POS - Point of Sale System",
    description_ar:
      "نظام نقاط بيع عربي للمتاجر، يركز على سرعة الكاشير، وضوح المنتجات، وإدارة عمليات البيع اليومية.",
    description_en:
      "An Arabic-first POS system concept focused on fast checkout, retail clarity, product operations, and dashboard-style workflows.",
    category: "pos",
    tags: ["Next.js", "TypeScript", "Dashboard", "POS", "RTL"],
    thumbnail_url: null,
    images: [],
    live_url: "https://saree3pos.vercel.app/",
    github_url: null,
    featured: false,
    order_num: 6
  }
];

const { data, error } = await supabase
  .from("projects")
  .upsert(projects, { onConflict: "slug" })
  .select("id, slug, title_en, live_url");

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.table(data);
