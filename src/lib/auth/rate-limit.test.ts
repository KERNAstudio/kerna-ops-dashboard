import { describe, it, expect, vi } from "vitest";
import { createFakeAdminClient } from "@/test-utils/fakeSupabase";
import { isRateLimited } from "./rate-limit";

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60000).toISOString();
}

describe("isRateLimited", () => {
  it("is not limited under the failure threshold", () => {
    const db = { login_attempts: [
      { identifier: "a@b.com", success: false, created_at: minutesAgo(1) },
      { identifier: "a@b.com", success: false, created_at: minutesAgo(2) },
    ] };
    return expect(isRateLimited(createFakeAdminClient(db), "a@b.com")).resolves.toBe(false);
  });

  it("locks out after 5 recent failures", () => {
    const db = {
      login_attempts: Array.from({ length: 5 }, (_, i) => ({ identifier: "a@b.com", success: false, created_at: minutesAgo(i) })),
    };
    return expect(isRateLimited(createFakeAdminClient(db), "a@b.com")).resolves.toBe(true);
  });

  it("does not lock out once a recent attempt succeeded", () => {
    const db = {
      login_attempts: [
        { identifier: "a@b.com", success: true, created_at: minutesAgo(1) },
        ...Array.from({ length: 4 }, (_, i) => ({ identifier: "a@b.com", success: false, created_at: minutesAgo(i + 2) })),
      ],
    };
    return expect(isRateLimited(createFakeAdminClient(db), "a@b.com")).resolves.toBe(false);
  });

  it("scopes the limit per identifier", () => {
    const db = {
      login_attempts: Array.from({ length: 5 }, (_, i) => ({ identifier: "other@b.com", success: false, created_at: minutesAgo(i) })),
    };
    return expect(isRateLimited(createFakeAdminClient(db), "a@b.com")).resolves.toBe(false);
  });
});
