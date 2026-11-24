import { Project } from "@/types";

// Local development only, when no Supabase env is set (src/lib/projects.ts). Never used when the
// database is configured, and never in a Vercel deployment (D-028).
const now = "2026-11-23T00:00:00.000Z";

export const mockProjects: Project[] = [
  {
    id: "mock-al-nakhba",
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
    order_num: 1,
    created_at: now,
    updated_at: now,
    label: null,
    featured_order: 1,
    highlights_ar: [],
    highlights_en: [],
    published: true
  },
  {
    id: "mock-arzaq",
    slug: "arzaq-marketplace",
    title_ar: "أرزاق - منصة عمل حر",
    title_en: "Arzaq - Freelance Marketplace",
    description_ar: "منصة سوق خدمات عربية محلية مع تدفقات بائعين ومشترين ولوحات واضحة.",
    description_en:
      "A full-stack Arabic marketplace platform with seller, buyer, and operational workflows.",
    category: "webapp",
    tags: ["Next.js", "Supabase", "Marketplace"],
    thumbnail_url: null,
    images: [],
    live_url: "https://arzaq-ps.vercel.app/",
    github_url: "https://github.com/Mhmdsalha/arzaq",
    featured: false,
    order_num: 5,
    created_at: now,
    updated_at: now,
    label: "training",
    featured_order: null,
    highlights_ar: [],
    highlights_en: [],
    published: true
  },
  {
    id: "mock-saree3",
    slug: "saree3-pos",
    title_ar: "سريع - نظام نقاط بيع",
    title_en: "Saree3 POS - Point of Sale System",
    description_ar: "نظام نقاط بيع عربي سريع للمتاجر مع تركيز على الكاشير والمخزون.",
    description_en:
      "A fast Arabic-first POS system designed for retail workflows, inventory, and checkout speed.",
    category: "system",
    tags: ["POS", "Dashboard", "RTL"],
    thumbnail_url: null,
    images: [],
    live_url: "https://saree3pos.vercel.app/",
    github_url: "https://github.com/Mhmdsalha/saree3-pos-project",
    featured: false,
    order_num: 6,
    created_at: now,
    updated_at: now,
    label: "training",
    featured_order: null,
    highlights_ar: [],
    highlights_en: [],
    published: true
  }
];
