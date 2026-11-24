// When may mock data stand in for a missing database? (D-028, D-029, A7 review of D1-4)
// Fail closed: only where nobody can mistake it for the real site.
//  * never in a Vercel production deployment;
//  * a Vercel preview (behind Vercel login, blocked by robots.txt);
//  * development and tests;
//  * a production build or server started with ALLOW_MOCK_DATA=1 (CI, local e2e runs).
// Anything else running in production without Supabase env (a self-hosted `next start`, or
// Vercel with its system variables hidden) throws instead of showing fake projects.
export function mockDataAllowed(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "preview") return true;
  if (process.env.ALLOW_MOCK_DATA === "1") return true;
  return process.env.NODE_ENV !== "production";
}
