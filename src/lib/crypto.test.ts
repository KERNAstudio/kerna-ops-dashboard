import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, maskSecret } from "./crypto";

// ACCESS_METHODS is called out in §1 as needing "the tightest encryption-at-rest... in the
// whole schema" — this pins the round-trip and the tamper-detection AES-GCM gives for free.
describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret", () => {
    const plaintext = "SuperSecretPass99";
    expect(decryptSecret(encryptSecret(plaintext))).toBe(plaintext);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encryptSecret("same-input");
    const b = encryptSecret("same-input");
    expect(a).not.toBe(b);
  });

  it("fails to decrypt if the stored value is tampered with", () => {
    const stored = encryptSecret("SuperSecretPass99");
    const [iv, tag, data] = stored.split(":");
    const tampered = `${iv}:${tag}:${data.slice(0, -2)}00`;
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe("maskSecret", () => {
  it("keeps only the last 4 characters visible", () => {
    const masked = maskSecret("SuperSecretPass99");
    expect(masked.endsWith("ss99")).toBe(true);
    expect(masked.length).toBe("SuperSecretPass99".length);
    expect(masked.slice(0, -4)).toBe("•".repeat("SuperSecretPass99".length - 4));
  });

  it("masks entirely when 4 characters or shorter", () => {
    expect(maskSecret("abcd")).toBe("••••");
  });
});
