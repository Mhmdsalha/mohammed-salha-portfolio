import { notFound } from "next/navigation";

// Any path under /ar or /en that no other route matches is a 404, rendered by
// src/app/[locale]/not-found.tsx inside the localised layout (P3-2, D-026).
export default function CatchAllNotFound() {
  notFound();
}
