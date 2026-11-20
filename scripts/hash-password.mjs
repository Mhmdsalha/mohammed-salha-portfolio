// Prints the dashboard auth env values (docs/DECISIONS.md D-006, D-007).
// Usage: node scripts/hash-password.mjs   then type the password and press Enter.
// The password is read from stdin so it never lands in shell history.
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import bcrypt from "bcryptjs";

const rl = createInterface({ input: process.stdin, output: process.stderr });
const password = (await rl.question("Dashboard password (12+ characters): ")).trim();
rl.close();

if (password.length < 12) {
  console.error("Use at least 12 characters.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

console.log(`DASHBOARD_PASSWORD_HASH=${Buffer.from(hash, "utf8").toString("base64")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
