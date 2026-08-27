import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// ACCESS_METHODS needs "the tightest encryption-at-rest... in the whole schema" (§1 note).
// AES-256-GCM, key derived once from CREDENTIAL_ENCRYPTION_KEY (set in .env.local — generate
// with `openssl rand -hex 32` or similar; never reuse CLIENT_SESSION_SECRET for this).
const key = scryptSync(process.env.CREDENTIAL_ENCRYPTION_KEY!, "kerna-credential-vault", 32);

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(stored: string): string {
  const [ivHex, authTagHex, dataHex] = stored.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
}

export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 4) return "•".repeat(plaintext.length);
  return "•".repeat(plaintext.length - 4) + plaintext.slice(-4);
}
