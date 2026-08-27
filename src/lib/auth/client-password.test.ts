import { describe, it, expect } from "vitest";
import { hashClientPassword, verifyClientPassword } from "./client-password";

// CLIENT_USERS auth path (§3: staff use Supabase Auth, clients use this — see the rbac
// migration's comment for why they're split).
describe("hashClientPassword / verifyClientPassword", () => {
  it("verifies the correct password", async () => {
    const hash = await hashClientPassword("TestPass123!");
    expect(await verifyClientPassword("TestPass123!", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashClientPassword("TestPass123!");
    expect(await verifyClientPassword("WrongPassword", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const a = await hashClientPassword("same-input");
    const b = await hashClientPassword("same-input");
    expect(a).not.toBe(b);
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    expect(await verifyClientPassword("anything", "not-a-real-hash")).toBe(false);
  });
});
