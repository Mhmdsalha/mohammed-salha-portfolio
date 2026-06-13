export type Locale = "en" | "ar";

export type ProjectCategory = "salla" | "webapp" | "pos" | "other";

export type Project = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  category: ProjectCategory;
  tags: string[];
  thumbnail_url: string | null;
  images: string[];
  live_url: string | null;
  github_url: string | null;
  featured: boolean;
  order_num: number;
  created_at: string;
  updated_at: string;
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
