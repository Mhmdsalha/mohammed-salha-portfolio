import { Project } from "@/types";

const now = new Date().toISOString();

export const mockProjects: Project[] = [
  {
    id: "mock-lamsa",
    slug: "lamsa-beauty-store",
    title_ar: "لمسة - متجر جمال فاخر",
    title_en: "Lamsa - Luxury Beauty Store",
    description_ar: "تجربة متجر سلة راقية لعلامة جمال عربية مع واجهة شراء ناعمة ومركزة.",
    description_en:
      "A premium Salla storefront for a beauty brand with refined product discovery and elegant conversion flows.",
    category: "salla",
    tags: ["Salla", "UX", "Arabic", "E-commerce"],
    thumbnail_url: null,
    images: [],
    live_url: "https://example.com",
    github_url: null,
    featured: true,
    order_num: 1,
    created_at: now,
    updated_at: now
  },
  {
    id: "mock-oud",
    slug: "oud-abaya-store",
    title_ar: "عُود - متجر عبايات فاخر",
    title_en: "Oud - Luxury Abaya Store",
    description_ar: "هوية رقمية داكنة وفاخرة لمتجر عبايات يوازن بين الأصالة والتجارة الحديثة.",
    description_en:
      "A dark luxury abaya storefront balancing Arabic craft, editorial visuals, and modern commerce.",
    category: "salla",
    tags: ["Salla", "Luxury", "RTL"],
    thumbnail_url: null,
    images: [],
    live_url: "https://example.com",
    github_url: null,
    featured: false,
    order_num: 2,
    created_at: now,
    updated_at: now
  },
  {
    id: "mock-lolo",
    slug: "lolo-kids-store",
    title_ar: "لولو - متجر أطفال",
    title_en: "Lolo - Children's Store",
    description_ar: "متجر أطفال لطيف ومنظم بواجهات عربية واضحة وتجربة شراء سريعة.",
    description_en:
      "A playful yet premium kids store with clear Arabic flows and polished product browsing.",
    category: "salla",
    tags: ["Salla", "Kids", "Design System"],
    thumbnail_url: null,
    images: [],
    live_url: "https://example.com",
    github_url: null,
    featured: false,
    order_num: 3,
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
    order_num: 4,
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
    order_num: 5,
    created_at: now,
    updated_at: now
  }
];
