import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdminClient } from "@/test-utils/fakeSupabase";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import { detectPaymentOverdue, detectClientRejectionLoop, detectSubscriptionOverdue } from "./detect";

let db: Record<string, Record<string, unknown>[]>;

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

beforeEach(() => {
  db = {
    system_settings: [
      { key: "payment_overdue_days", value: 10 },
      { key: "client_rejection_threshold", value: 3 },
    ],
    payments: [],
    projects: [{ id: "proj-1", client_id: "client-1" }],
    clients: [{ id: "client-1", poc_user_id: "poc-user" }],
    escalations: [],
    notifications: [],
    audit_logs: [],
    user_roles: [],
    project_modules: [],
    module_versions: [],
    approvals: [],
    subscriptions: [],
  };
  vi.mocked(createAdminClient).mockReturnValue(createFakeAdminClient(db));
});

// §5 rule: "Payment Overdue | due_date + 10d < today, unpaid | High"
describe("detectPaymentOverdue", () => {
  it("creates a high-severity escalation for a payment pending past the threshold", async () => {
    db.payments.push({ id: "pay-1", project_id: "proj-1", status: "pending", created_at: daysAgo(15) });

    await detectPaymentOverdue();

    expect(db.escalations).toHaveLength(1);
    const escalation = db.escalations[0] as { escalation_type: string; severity: string; owner_id: string };
    expect(escalation.escalation_type).toBe("payment_overdue");
    expect(escalation.severity).toBe("high");
    expect(escalation.owner_id).toBe("poc-user"); // §5: owner is the project's POC
  });

  it("does not flag a payment still within the threshold", async () => {
    db.payments.push({ id: "pay-1", project_id: "proj-1", status: "pending", created_at: daysAgo(3) });
    await detectPaymentOverdue();
    expect(db.escalations).toHaveLength(0);
  });

  it("does not flag a payment that's already been received", async () => {
    db.payments.push({ id: "pay-1", project_id: "proj-1", status: "received", created_at: daysAgo(15) });
    await detectPaymentOverdue();
    expect(db.escalations).toHaveLength(0);
  });

  it("is idempotent — running it twice doesn't create a duplicate escalation", async () => {
    db.payments.push({ id: "pay-1", project_id: "proj-1", status: "pending", created_at: daysAgo(15) });
    await detectPaymentOverdue();
    await detectPaymentOverdue();
    expect(db.escalations).toHaveLength(1);
  });

  it("respects an admin-edited threshold from system_settings instead of the hardcoded default", async () => {
    db.system_settings = [{ key: "payment_overdue_days", value: 2 }];
    db.payments.push({ id: "pay-1", project_id: "proj-1", status: "pending", created_at: daysAgo(3) });
    await detectPaymentOverdue();
    expect(db.escalations).toHaveLength(1); // would've been "not overdue" under the default 10-day threshold
  });
});

// §5 rule: "Client Rejection Loop | client_rejection_count >= 3 | Medium"
describe("detectClientRejectionLoop", () => {
  function seedApprovals(count: number) {
    db.project_modules.push({ id: "mod-1", project_id: "proj-1" });
    db.module_versions.push({ id: "ver-1", module_id: "mod-1" });
    for (let i = 0; i < count; i++) {
      db.approvals.push({ id: `appr-${i}`, module_version_id: "ver-1", status: "changes_requested" });
    }
  }

  it("creates a medium-severity escalation once the rejection count crosses the threshold", async () => {
    seedApprovals(3);
    await detectClientRejectionLoop();
    expect(db.escalations).toHaveLength(1);
    const escalation = db.escalations[0] as { escalation_type: string; severity: string };
    expect(escalation.escalation_type).toBe("client_rejection_loop");
    expect(escalation.severity).toBe("medium");
  });

  it("does not flag a project below the threshold", async () => {
    seedApprovals(2);
    await detectClientRejectionLoop();
    expect(db.escalations).toHaveLength(0);
  });
});

// Subscriptions have no §5 rule of their own — modeled on Payment Overdue: due date + grace
// period elapsed, still active, unpaid.
describe("detectSubscriptionOverdue", () => {
  it("flags an active subscription once due_date + grace_period has passed", async () => {
    db.subscriptions.push({ project_id: "proj-1", next_due_date: daysAgo(10).slice(0, 10), grace_period_days: 7, status: "active" });
    await detectSubscriptionOverdue();
    expect(db.escalations).toHaveLength(1);
    const escalation = db.escalations[0] as { escalation_type: string; severity: string; owner_id: string };
    expect(escalation.escalation_type).toBe("subscription_overdue");
    expect(escalation.severity).toBe("high");
    expect(escalation.owner_id).toBe("poc-user");
  });

  it("does not flag a subscription still within its grace period", async () => {
    db.subscriptions.push({ project_id: "proj-1", next_due_date: daysAgo(3).slice(0, 10), grace_period_days: 7, status: "active" });
    await detectSubscriptionOverdue();
    expect(db.escalations).toHaveLength(0);
  });

  it("does not flag a paused or cancelled subscription", async () => {
    db.subscriptions.push({ project_id: "proj-1", next_due_date: daysAgo(30).slice(0, 10), grace_period_days: 7, status: "paused" });
    await detectSubscriptionOverdue();
    expect(db.escalations).toHaveLength(0);
  });
});
