import type { PGlite } from "@electric-sql/pglite";

export const OUTPUT: string;
export function migratedDatabase(): Promise<PGlite>;
export function generateDatabaseTypes(): Promise<string>;
