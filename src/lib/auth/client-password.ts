import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// CLIENT_USERS.password_hash storage — Node's built-in scrypt, no extra dependency
// (staff auth goes through Supabase Auth instead; see supabase/migrations/00000000000008_rbac.sql).
export async function hashClientPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyClientPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [scheme, salt, hashHex] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hashHex) return false;

  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(hashHex, "hex");
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}
