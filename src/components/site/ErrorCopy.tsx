"use client";

import { createContext, useContext, type ReactNode } from "react";

// The error page's copy (D-028). Error boundaries must be client components, and there is no
// NextIntlClientProvider (D-026), so the locale layout resolves these few strings on the server
// and passes them down; the message files never reach the browser.

export type ErrorCopy = {
  title: string;
  body: string;
  retry: string;
  backHome: string;
  homeHref: string;
};

const ErrorCopyContext = createContext<ErrorCopy | null>(null);

export function ErrorCopyProvider({ copy, children }: { copy: ErrorCopy; children: ReactNode }) {
  return <ErrorCopyContext.Provider value={copy}>{children}</ErrorCopyContext.Provider>;
}

export function useErrorCopy(): ErrorCopy | null {
  return useContext(ErrorCopyContext);
}
