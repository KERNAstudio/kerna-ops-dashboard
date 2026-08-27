import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdminClient } from "@/test-utils/fakeSupabase";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import { advanceProjectStatus } from "./lifecycle";

let db: Record<string, Record<string, unknown>[]>;

beforeEach(() => {
  db = { projects: [{ id: "proj-1", status: "quotation_approved" }], audit_logs: [] };
  vi.mocked(createAdminClient).mockReturnValue(createFakeAdminClient(db));
});

// §2: the lifecycle chain only ever moves forward, and only from the exact prior stage —
// this is what makes it safe for payments/modules/overview actions to all call the same
// helper without coordinating on what state the project is "supposed" to be in.
describe("advanceProjectStatus", () => {
  it("advances when the project is in the expected prior status", async () => {
    await advanceProjectStatus("proj-1", "quotation_approved", "advance_paid", "user-1", "status_advance_paid");
    expect(db.projects[0].status).toBe("advance_paid");
  });

  it("is a no-op when the project isn't in the expected prior status", async () => {
    db.projects[0].status = "in_development"; // already well past quotation_approved
    await advanceProjectStatus("proj-1", "quotation_approved", "advance_paid", "user-1", "status_advance_paid");
    expect(db.projects[0].status).toBe("in_development");
  });

  it("never downgrades — calling it a second time after advancing is a no-op", async () => {
    await advanceProjectStatus("proj-1", "quotation_approved", "advance_paid", "user-1", "status_advance_paid");
    await advanceProjectStatus("proj-1", "quotation_approved", "advance_paid", "user-1", "status_advance_paid");
    expect(db.projects[0].status).toBe("advance_paid");
    // only the first call should have written an audit entry
    expect(db.audit_logs.length).toBe(1);
  });

  it("writes an audit log entry with the previous and new state on a real transition", async () => {
    await advanceProjectStatus("proj-1", "quotation_approved", "advance_paid", "user-1", "status_advance_paid");
    expect(db.audit_logs).toHaveLength(1);
    const entry = db.audit_logs[0] as { action: string; previous_state: { status: string }; new_state: { status: string } };
    expect(entry.action).toBe("status_advance_paid");
    expect(entry.previous_state.status).toBe("quotation_approved");
    expect(entry.new_state.status).toBe("advance_paid");
  });
});
