import bcrypt from "bcryptjs";

// A valid bcrypt hash of a random string. Compared against when no real hash is configured,
// so a misconfigured server answers in the same time as a wrong password.
const DUMMY_HASH = "$2b$12$9i5Fn2nOO7hUDWFC7ruf2e6F1.4l9W4OVtaBd6xuiT1UKl9SsTxMu";

/**
 * DASHBOARD_PASSWORD_HASH holds a bcrypt hash encoded as base64, because Next.js expands `$`
 * in .env files and would truncate a raw `$2b$12$...` value (docs/DECISIONS.md D-007).
 * Returns null if the value is missing or does not decode to a bcrypt hash.
 */
export function decodePasswordHash(encoded = process.env.DASHBOARD_PASSWORD_HASH): string | null {
  if (!encoded) {
    return null;
  }

  const decoded = Buffer.from(encoded.trim(), "base64").toString("utf8");
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(decoded) ? decoded : null;
}

/** Constant-time check of the dashboard password. Fails closed when no valid hash is set. */
export async function verifyDashboardPassword(
  password: string,
  encodedHash = process.env.DASHBOARD_PASSWORD_HASH
): Promise<boolean> {
  const hash = decodePasswordHash(encodedHash);

  if (!hash) {
    console.error(
      encodedHash?.trim().startsWith("$2")
        ? "DASHBOARD_PASSWORD_HASH looks like a raw bcrypt hash; base64-encode it (node scripts/hash-password.mjs). Dashboard login is disabled."
        : "DASHBOARD_PASSWORD_HASH is missing or invalid; dashboard login is disabled."
    );
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }

  return bcrypt.compare(password, hash);
}
