"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { GlassCard } from "@/components/ui/GlassCard";

const initialState = { success: true, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <GlassCard className="w-full max-w-md p-8">
      <div className="mx-auto mb-7 flex size-14 items-center justify-center rounded-2xl border border-[var(--border-neon)] text-[var(--neon)] shadow-[0_0_28px_rgba(0,245,255,0.18)]">
        <span className="font-duran text-2xl font-black">MS</span>
      </div>
      <h1 className="text-center font-duran text-3xl font-black text-white">Dashboard</h1>
      <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
        Enter your portfolio control room.
      </p>
      <form action={action} className="mt-8 space-y-4">
        <label className="block text-sm text-[var(--text-secondary)]" htmlFor="password">
          Password
        </label>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.03] px-4">
          <LockKeyhole size={16} className="text-[var(--text-muted)]" />
          <input
            id="password"
            name="password"
            type="password"
            className="min-h-12 flex-1 bg-transparent text-white outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Enter dashboard password"
            required
          />
        </div>
        {!state.success ? (
          <p className="text-sm text-[var(--danger)]">{state.message}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="focus-ring min-h-12 w-full rounded-full border border-[var(--border-neon)] bg-[rgba(0,245,255,0.1)] font-semibold text-white transition hover:shadow-[0_0_28px_rgba(0,245,255,0.18)] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Entering..." : "Enter Dashboard"}
        </button>
      </form>
    </GlassCard>
  );
}
