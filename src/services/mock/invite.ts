/**
 * Mock InviteService — pre-seeded tokens for all testable states.
 *
 * Pre-seeded slugs (use these in the URL):
 *   invite_VALID_NEW      → new-user path  (event_manager)
 *   invite_VALID_EXISTING → existing-user  (scanner, ananya.rao@malwaexpo.in)
 *   invite_EXPIRED        → EXPIRED error
 *   invite_REVOKED        → REVOKED error
 *   invite_ACCEPTED       → ACCEPTED error
 *   <anything else>       → INVALID error
 */

import type { Role, User } from "@/types/domain";
import type { AcceptInput, InvitePayload, InviteService } from "@/services/invite";
import { db } from "@/services/mock/db";
import { simulate } from "@/services/mock/util";
import { useRoleStore } from "@/lib/roles";

/* ── Invite record ────────────────────────────────────────────────────────── */

type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

interface InviteRecord extends InvitePayload {
  status: InviteStatus;
  expiresAt: number;
}

/* ── Pre-seeded tokens ────────────────────────────────────────────────────── */

const HOUR = 60 * 60 * 1000;

const SEED_INVITES: InviteRecord[] = [
  {
    token: "invite_VALID_NEW",
    orgName: "Malwa Expo Co",
    orgId: "org_01",
    email: "newmember@acme.in",
    role: "event_manager",
    invitedBy: "Ananya Rao",
    isNewUser: true,
    status: "pending",
    expiresAt: Date.now() + 48 * HOUR,
  },
  {
    token: "invite_VALID_EXISTING",
    orgName: "Malwa Expo Co",
    orgId: "org_01",
    email: "ananya.rao@malwaexpo.in",
    role: "scanner",
    invitedBy: "Ravi Kumar",
    isNewUser: false,
    status: "pending",
    expiresAt: Date.now() + 48 * HOUR,
  },
  {
    token: "invite_EXPIRED",
    orgName: "Malwa Expo Co",
    orgId: "org_01",
    email: "late@example.com",
    role: "desk",
    invitedBy: "Ananya Rao",
    isNewUser: true,
    status: "expired",
    expiresAt: Date.now() - HOUR,
  },
  {
    token: "invite_REVOKED",
    orgName: "Malwa Expo Co",
    orgId: "org_01",
    email: "revoked@example.com",
    role: "food_operator",
    invitedBy: "Ananya Rao",
    isNewUser: true,
    status: "revoked",
    expiresAt: Date.now() + 48 * HOUR,
  },
  {
    token: "invite_ACCEPTED",
    orgName: "Malwa Expo Co",
    orgId: "org_01",
    email: "already@example.com",
    role: "desk",
    invitedBy: "Ananya Rao",
    isNewUser: false,
    status: "accepted",
    expiresAt: Date.now() + 48 * HOUR,
  },
];

/** Runtime mutable store (accepts mutate status in-session) */
const store = new Map<string, InviteRecord>(
  SEED_INVITES.map((r) => [r.token, { ...r }]),
);

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function assertValid(record: InviteRecord | undefined): asserts record is InviteRecord {
  if (!record) throw new Error("INVALID");
  if (record.status === "revoked") throw new Error("REVOKED");
  if (record.status === "accepted") throw new Error("ACCEPTED");
  if (record.status === "expired" || Date.now() > record.expiresAt) throw new Error("EXPIRED");
}

/** Activate the invited role in the zustand store + set actingUser. */
function activateRole(role: Role, name: string, email: string, orgId: string): User {
  // Find the closest fixture user for this role, or synthesise one
  const fixture = db.users.find((u) => u.role === role) ?? db.users[0];
  const user: User = {
    ...fixture,
    name,
    email,
    orgId,
  };

  // Write to zustand outside React (zustand supports this)
  if (typeof window !== "undefined") {
    useRoleStore.getState().setRole(role);
  }

  return user;
}

/* ── Service ──────────────────────────────────────────────────────────────── */

export const mockInviteService: InviteService = {
  async validateInvite(token: string) {
    await simulate("invite.validate");
    const record = store.get(token);
    assertValid(record);
    // Return a clean payload (omit internal fields)
    const { status: _s, expiresAt: _e, ...payload } = record;
    return payload;
  },

  async acceptInvite(token: string, data: AcceptInput) {
    await simulate("invite.accept");
    const record = store.get(token);
    assertValid(record);

    const name = data.name ?? record.email.split("@")[0];
    const user = activateRole(record.role, name, record.email, record.orgId);

    record.status = "accepted";
    return user;
  },
};
