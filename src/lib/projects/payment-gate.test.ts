import { describe, it, expect } from "vitest";
import { isProjectFullyPaid } from "./payment-gate";

// CLAUDE.md non-negotiable: "Vault download is payment-gated." This gate has regressed
// once already in spirit (raw file_url links bypassed it before Storage) — pin the exact
// rule here so a future refactor can't silently loosen it. The rule became admin-configurable
// (§8 "payment unlock rule") but the DEFAULT threshold of 100% must keep reproducing the old
// all-or-nothing behavior exactly; only an explicit Founder-set lower threshold may unlock early.
describe("isProjectFullyPaid", () => {
  it("is true for 'completed' regardless of paidPercent", () => {
    expect(isProjectFullyPaid("completed", 0, 100)).toBe(true);
  });

  it("at the default 100% threshold, nothing unlocks before 'completed'", () => {
    for (const status of ["advance_paid", "in_development", "deliverable_sent", "final_payment_pending"]) {
      expect(isProjectFullyPaid(status, 99.999, 100)).toBe(false);
    }
  });

  it("unlocks early once paidPercent crosses an explicitly lowered threshold", () => {
    expect(isProjectFullyPaid("final_payment_pending", 80, 80)).toBe(true);
    expect(isProjectFullyPaid("final_payment_pending", 79, 80)).toBe(false);
  });
});
