"use client";

import { useEffect } from "react";
import { fontVariables } from "@/app/fonts";
import { useErrorCopy } from "@/components/site/ErrorCopy";

// Shown when a page under /ar or /en fails, e.g. the database is unreachable (DataError, D-028),
// instead of Next's unbranded English 500. Localised through the layout's ErrorCopyProvider. The
// designed version comes with the other error pages in P4-9.
export default function LocaleError({ error, reset }: { error: Error; reset: () => void }) {
  const copy = useErrorCopy();

  useEffect(() => {
    console.error(error);
  }, [error]);

  if (!copy) return null;

  return (
    <main
      className={`${fontVariables} flex min-h-screen items-center justify-center bg-paper p-6 font-body text-ink`}
    >
      <div role="alert" className="max-w-md space-y-3 text-center">
        <h1 className="font-display text-3xl font-black">{copy.title}</h1>
        <p className="text-ink-2">{copy.body}</p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-full bg-ink px-5 font-semibold text-paper"
          >
            {copy.retry}
          </button>
          <a href={copy.homeHref} className="font-semibold text-accent underline">
            {copy.backHome}
          </a>
        </div>
      </div>
    </main>
  );
}
