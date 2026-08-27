import { describe, it, expect } from "vitest";
import { financialYearFor } from "./invoices";

describe("financialYearFor", () => {
  it("stays in the same FY for a date before April", () => {
    expect(financialYearFor(new Date("2026-03-31"))).toBe("2025-26");
  });

  it("rolls into the new FY starting April 1", () => {
    expect(financialYearFor(new Date("2026-04-01"))).toBe("2026-27");
  });

  it("wraps the short-year suffix across a century boundary", () => {
    expect(financialYearFor(new Date("2099-05-01"))).toBe("2099-00");
  });
});
