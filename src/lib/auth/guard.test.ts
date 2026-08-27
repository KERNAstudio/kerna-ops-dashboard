import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdminClient } from "@/test-utils/fakeSupabase";
import type { StaffActor, ClientActor } from "./session";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("./session", () => ({ getActor: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { getActor } from "./session";
import { guard } from "./guard";

function staff(overrides: Partial<StaffActor> = {}): StaffActor {
  return {
    type: "staff",
    id: "user-1",
    name: "Test User",
    email: "user@kerna.test",
    roles: [],
    permissions: new Set(),
    ...overrides,
  };
}

function client(overrides: Partial<ClientActor> = {}): ClientActor {
  return { type: "client", clientUserId: "cu-1", clientId: "client-1", email: "c@kerna.test", ...overrides };
}

let db: Record<string, Record<string, unknown>[]>;

beforeEach(() => {
  db = {
    projects: [{ id: "proj-1", client_id: "client-1" }],
    clients: [{ id: "client-1", poc_user_id: "poc-user" }],
    module_assignments: [{ id: "ma-1", module_id: "mod-1", user_id: "dev-user", project_modules: { project_id: "proj-1" } }],
  };
  vi.mocked(createAdminClient).mockReturnValue(createFakeAdminClient(db));
});

// §3 route guard order: (1) auth (2) role (3) project scope (4) module scope (5) permission.
describe("guard()", () => {
  it("redirects to /login when nobody is authenticated", async () => {
    vi.mocked(getActor).mockResolvedValue(null);
    await expect(guard()).rejects.toThrow("REDIRECT:/login");
  });

  it("lets Founder through any project regardless of ownership ('broad' access)", async () => {
    vi.mocked(getActor).mockResolvedValue(staff({ roles: ["founder"] }));
    const actor = await guard({ projectId: "proj-1" });
    expect(actor.type).toBe("staff");
  });

  it("blocks a Sales rep from a project they don't own", async () => {
    vi.mocked(getActor).mockResolvedValue(staff({ id: "some-sales-rep", roles: ["sales"] }));
    await expect(guard({ projectId: "proj-1" })).rejects.toThrow("REDIRECT:/403");
  });

  it("lets the POC through their project even without the role-level permission", async () => {
    // §3: POC gets "everything on that project" even if their base role (sales) doesn't
    // carry PAYMENT_EDIT globally — this is the bug found and fixed mid-session.
    vi.mocked(getActor).mockResolvedValue(staff({ id: "poc-user", roles: ["sales"], permissions: new Set() }));
    const actor = await guard({ projectId: "proj-1", permission: "PAYMENT_EDIT" });
    expect(actor.type).toBe("staff");
  });

  it("blocks a permission check for a non-POC even with projectId scoped correctly elsewhere", async () => {
    vi.mocked(getActor).mockResolvedValue(
      staff({ id: "dev-user", roles: ["dev"], permissions: new Set() })
    );
    // dev-user has module scope (assigned) but not the PROJECT_EDIT permission, and isn't POC.
    await expect(guard({ projectId: "proj-1", permission: "PROJECT_EDIT" })).rejects.toThrow("REDIRECT:/403");
  });

  it("lets an assigned dev into their module, blocks them from a module they're not on", async () => {
    vi.mocked(getActor).mockResolvedValue(staff({ id: "dev-user", roles: ["dev"], permissions: new Set() }));
    const actor = await guard({ projectId: "proj-1", moduleId: "mod-1" });
    expect(actor.type).toBe("staff");

    await expect(guard({ projectId: "proj-1", moduleId: "mod-99" })).rejects.toThrow("REDIRECT:/403");
  });

  it("scopes a client to their own project only", async () => {
    vi.mocked(getActor).mockResolvedValue(client({ clientId: "client-1" }));
    const actor = await guard({ projectId: "proj-1" });
    expect(actor.type).toBe("client");

    vi.mocked(getActor).mockResolvedValue(client({ clientId: "some-other-client" }));
    await expect(guard({ projectId: "proj-1" })).rejects.toThrow("REDIRECT:/403");
  });

  it("rejects a client from a staff-only route (allowClient: false)", async () => {
    vi.mocked(getActor).mockResolvedValue(client());
    await expect(guard({ allowClient: false })).rejects.toThrow("REDIRECT:/403");
  });

  it("enforces allowStaffRoles", async () => {
    vi.mocked(getActor).mockResolvedValue(staff({ roles: ["sales"] }));
    await expect(guard({ allowStaffRoles: ["founder"] })).rejects.toThrow("REDIRECT:/403");

    vi.mocked(getActor).mockResolvedValue(staff({ roles: ["founder"] }));
    const actor = await guard({ allowStaffRoles: ["founder"] });
    expect(actor.type).toBe("staff");
  });
});
