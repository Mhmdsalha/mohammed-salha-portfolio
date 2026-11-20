export type TokenViolation = { line: number; rule: string; match: string };
export declare const TOKEN_SOURCES: string[];
export declare const LEGACY_ALLOWLIST: Set<string>;
export declare function findViolations(text: string): TokenViolation[];
export declare function checkRepo(root?: string): {
  problems: (TokenViolation & { file: string })[];
  staleAllowlist: string[];
};
