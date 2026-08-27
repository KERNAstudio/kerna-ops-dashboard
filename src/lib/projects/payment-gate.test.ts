import { describe, it, expect } from "vitest";
import { isProjectFullyPaid } from "./payment-gate";

// CLAUDE.md non-negotiable: "Vault download is payment-gated." This gate has regressed
// once already in spirit (raw file_url links bypassed it before Storage) — pin the exact
// rule here so a future refactor can't silently loosen it.
describe("isProjectFullyPaid", () => {
  it("is true only for 'completed'", () => {
    expect(isProjectFullyPaid("completed")).toBe(true);
  });

  it("is false for every other lifecycle stage", () => {
    for (const status of [
      "lead_generated",
      "quotation_sent",
      "quotation_approved",
      "advance_paid",
      "team_assigned",
      "scope_approved",
      "in_development",
      "deliverable_sent",
      "final_payment_pending",
    ]) {
      expect(isProjectFullyPaid(status)).toBe(false);
    }
  });
});
