"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasDashboardSession } from "@/lib/dashboard-auth";
import { saveSiteSettings } from "@/lib/site-settings";

const optionalUrl = z.string().url("Enter a valid URL.").or(z.literal(""));

const settingsSchema = z.object({
  whatsapp: z.string().min(6, "WhatsApp number is required."),
  phone: z.string().min(6, "Phone number is required."),
  email: z.string().email("Enter a valid email."),
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
    return { success: false, message: "Please check the contact fields." };
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
