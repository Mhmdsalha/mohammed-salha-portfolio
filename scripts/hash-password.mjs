// Prints the dashboard auth env values (docs/DECISIONS.md D-006, D-007).
// Usage: node scripts/hash-password.mjs   then type the password and press Enter.
// The password is read from a hidden prompt so it never lands in shell history or on screen.
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
    process.stderr.write(question);
    // Swallow the echo of typed characters; the prompt itself was already written.
    rl._writeToOutput = () => {};
    rl.question("", (answer) => {
      rl.close();
      process.stderr.write("\n");
      resolve(answer);
    });
  });
}

// Not trimmed: login compares the exact string, so spaces must count here too.
const password = await askHidden("Dashboard password (12-72 bytes): ");
const bytes = Buffer.byteLength(password, "utf8");

if (bytes < 12 || bytes > 72) {
  // bcrypt ignores everything past 72 bytes, so longer passwords would be silently truncated.
  console.error(`Use between 12 and 72 bytes (got ${bytes}).`);
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

console.log(`DASHBOARD_PASSWORD_HASH=${Buffer.from(hash, "utf8").toString("base64")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
