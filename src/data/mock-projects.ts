import { Project } from "@/types";

const now = new Date().toISOString();

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
    updated_at: now
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
    live_url: "https://example.com",
    github_url: null,
    featured: false,
    order_num: 5,
    created_at: now,
    updated_at: now
  },
  {
    id: "mock-saree3",
    slug: "saree3-pos",
    title_ar: "سريع - نظام نقاط بيع",
    title_en: "Saree3 POS - Point of Sale System",
    description_ar: "نظام نقاط بيع عربي سريع للمتاجر مع تركيز على الكاشير والمخزون.",
    description_en:
      "A fast Arabic-first POS system designed for retail workflows, inventory, and checkout speed.",
    category: "pos",
    tags: ["POS", "Dashboard", "RTL"],
    thumbnail_url: null,
    images: [],
    live_url: "https://example.com",
    github_url: null,
    featured: false,
    order_num: 6,
    created_at: now,
    updated_at: now
  }
];
