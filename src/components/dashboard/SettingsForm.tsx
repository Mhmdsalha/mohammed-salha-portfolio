"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateSiteSettings } from "@/actions/settings";
import { GlassCard } from "@/components/ui/GlassCard";
import { SiteSettings } from "@/types";

const fields: Array<{
  name: keyof SiteSettings;
  label: string;
  placeholder: string;
  type?: string;
}> = [
  { name: "whatsapp", label: "WhatsApp Number", placeholder: "+970xxxxxxxxx" },
  { name: "phone", label: "Phone Number", placeholder: "+970xxxxxxxxx" },
  { name: "email", label: "Email", placeholder: "name@example.com", type: "email" },
  { name: "github", label: "GitHub URL", placeholder: "https://github.com/username" },
  { name: "linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/username" },
  { name: "twitter", label: "X URL", placeholder: "https://x.com/username" },
  { name: "khamsat", label: "Khamsat URL", placeholder: "https://khamsat.com/..." },
  { name: "mostaql", label: "Mostaql URL", placeholder: "https://mostaql.com/..." }
];

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    const values = Object.fromEntries(
      fields.map((field) => [field.name, String(formData.get(field.name) ?? "").trim()])
    );

    startTransition(async () => {
      const result = await updateSiteSettings(values);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <form action={onSubmit}>
      <GlassCard className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="text-sm font-semibold text-white">{field.label}</span>
              <input
                name={field.name}
                type={field.type ?? "text"}
                defaultValue={settings[field.name]}
                placeholder={field.placeholder}
                className="field mt-2"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="focus-ring inline-flex min-h-11 items-center rounded-full border border-[var(--border-neon)] bg-[rgba(0,245,255,0.08)] px-6 text-sm font-semibold text-white transition hover:shadow-[0_0_24px_rgba(0,245,255,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </GlassCard>
    </form>
  );
}
