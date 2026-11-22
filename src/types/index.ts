import type { Tables } from "@/types/database";

export type Locale = "en" | "ar";

// Database rows come from the generated types (src/types/database.ts, D-028); the check
// constraints of supabase/migrations/0002_rebuild.sql narrow their text columns here.
export const PROJECT_CATEGORIES = ["webapp", "system", "platform", "store"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_LABELS = ["training", "graduation", "applied"] as const;
export type ProjectLabel = (typeof PROJECT_LABELS)[number];

export const SKILL_CATEGORIES = ["frontend", "backend", "database", "infra"] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export type Project = Omit<Tables<"projects">, "category" | "label"> & {
  category: ProjectCategory;
  label: ProjectLabel | null;
};

/** A skill with the slugs of the public projects that use it (P4-6 tiles). */
export type Skill = Omit<Tables<"skills">, "category"> & {
  category: SkillCategory;
  projectSlugs: string[];
};

export type ProjectFormValues = {
  title_en: string;
  title_ar: string;
  slug: string;
  category: ProjectCategory;
  description_en: string;
  description_ar: string;
  live_url: string;
  github_url: string;
  tags: string[];
  thumbnail_url: string;
  images: string[];
  featured: boolean;
  order_num: number;
};

export type SiteSettings = {
  whatsapp: string;
  phone: string;
  email: string;
  github: string;
  linkedin: string;
  twitter: string;
  khamsat: string;
  mostaql: string;
};
