export function getPublicEnv() {
  return {
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "+970xxxxxxxxx",
    email: process.env.NEXT_PUBLIC_EMAIL ?? "your@email.com",
    github: process.env.NEXT_PUBLIC_GITHUB ?? "https://github.com/username",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN ?? "https://linkedin.com/in/username",
    twitter: process.env.NEXT_PUBLIC_TWITTER ?? "https://x.com/username"
  };
}

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
