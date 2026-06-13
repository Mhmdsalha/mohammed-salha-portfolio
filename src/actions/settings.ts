"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasDashboardSession } from "@/lib/dashboard-auth";
import { saveSiteSettings } from "@/lib/site-settings";

function normalizeOptional(value: unknown) {
  const text = String(value ?? "").trim();
  return text === "#" ? "" : text;
}

const optionalText = z.preprocess(normalizeOptional, z.string());
const optionalEmail = z.preprocess(
  normalizeOptional,
  z.string().refine((value) => value === "" || z.string().email().safeParse(value).success, {
    message: "Enter a valid email."
  })
);
const optionalUrl = z.preprocess(
  normalizeOptional,
  z.string().refine((value) => value === "" || z.string().url().safeParse(value).success, {
    message: "Enter a valid URL."
  })
);

const settingsSchema = z.object({
  whatsapp: optionalText,
  phone: optionalText,
  email: optionalEmail,
  github: optionalUrl,
  linkedin: optionalUrl,
  twitter: optionalUrl,
  khamsat: optionalUrl,
  mostaql: optionalUrl
});

export async function updateSiteSettings(data: unknown) {
  if (!(await hasDashboardSession())) {
    return { success: false, message: "Unauthorized." };
  }

  const parsed = settingsSchema.safeParse(data);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".") || "contact fields";
    return { success: false, message: `Please check ${field}: ${issue?.message ?? "invalid value"}` };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, message: "Missing Supabase credentials." };
  }

  try {
    await saveSiteSettings(parsed.data);
    revalidatePath("/");
    revalidatePath("/ar");
    revalidatePath("/en");
    revalidatePath("/dashboard/settings");

    return { success: true, message: "Contact settings updated." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update settings."
    };
  }
}
