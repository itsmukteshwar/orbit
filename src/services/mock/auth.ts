/**
 * Mock AuthService — in-memory session + optional localStorage flag.
 *
 * Session model (all mock / no real backend):
 *   - actingUser          module-level var — survives hot reload, reset on logout
 *   - pendingSignups map  email → PendingSignup (verified flag lives here)
 *   - loginAttempts map   email → fail count   (lockout at LOCKOUT_AT)
 *   - localStorage key    "orbit_session" = "1" written on login, cleared on logout
 */

import type { Role, User } from "@/types/domain";
import type { AuthService, SignupInput } from "@/services/auth";
import { db } from "@/services/mock/db";
import { simulate } from "@/services/mock/util";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface PendingSignup {
  orgName: string;
  name: string;
  email: string;
  phone: string;
  token: string;
  verified: boolean;
}

/* ── Module state ─────────────────────────────────────────────────────────── */

let actingUser: User = db.users.find((u) => u.role === "org_admin") ?? db.users[0];

/** token → PendingSignup */
const pendingSignups = new Map<string, PendingSignup>();
/** Also index by email for resend */
const pendingByEmail = new Map<string, PendingSignup>();

/** email → consecutive fail count */
const loginAttempts = new Map<string, number>();
const LOCKOUT_AT = 5;

/* ── Password reset state ─────────────────────────────────────────────────── */

interface ResetEntry {
  email: string;
  token: string;
  expiresAt: number; // ms timestamp
  used: boolean;
}

/** token → ResetEntry */
const resetTokens = new Map<string, ResetEntry>();
/** email → token (so we can invalidate old tokens on re-request) */
const resetByEmail = new Map<string, string>();
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour (generous for mock)

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function makeToken(): string {
  return `vt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function trySetSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("orbit_session", "1");
  }
}

function clearSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("orbit_session");
    window.localStorage.removeItem("orbit_pending_email");
    window.localStorage.removeItem("orbit_pending_token");
  }
}

/* ── Service ──────────────────────────────────────────────────────────────── */

export const mockAuthService: AuthService = {
  /* ---- currentUser ---- */
  async currentUser() {
    await simulate("auth.currentUser");
    return actingUser;
  },

  /* ---- switchRole (dev-only) ---- */
  async switchRole(role: Role) {
    await simulate("auth.switchRole");
    const user = db.users.find((u) => u.role === role);
    if (!user) throw new Error(`No fixture user with role ${role}`);
    actingUser = user;
    return user;
  },

  /* ---- login ---- */
  async login(email: string, _password: string) {
    await simulate("auth.login");

    const fails = loginAttempts.get(email) ?? 0;
    if (fails >= LOCKOUT_AT) {
      throw new Error("LOCKED");
    }

    // Check verified pending signups first
    const pending = pendingByEmail.get(email);
    if (pending) {
      if (!pending.verified) {
        throw new Error("EMAIL_UNVERIFIED");
      }
      // Treat as a fresh org_admin
      const user = db.users.find((u) => u.role === "org_admin") ?? db.users[0];
      actingUser = { ...user, email, name: pending.name };
      loginAttempts.delete(email);
      trySetSession();
      return actingUser;
    }

    // Fall back to fixture users (any password accepted in mock)
    const fixture = db.users.find((u) => u.email === email);
    if (fixture) {
      actingUser = fixture;
      loginAttempts.delete(email);
      trySetSession();
      return actingUser;
    }

    // Wrong credentials
    loginAttempts.set(email, fails + 1);
    const remaining = LOCKOUT_AT - (fails + 1);
    if (remaining <= 0) throw new Error("LOCKED");
    throw new Error(`INVALID_CREDENTIALS:${remaining}`);
  },

  /* ---- logout ---- */
  async logout() {
    await simulate("auth.logout");
    clearSession();
  },

  /* ---- signup ---- */
  async signup(data: SignupInput) {
    await simulate("auth.signup");

    if (db.users.some((u) => u.email === data.email) || pendingByEmail.has(data.email)) {
      throw new Error("An account with this email already exists.");
    }

    const token = makeToken();
    const entry: PendingSignup = { ...data, token, verified: false };
    pendingSignups.set(token, entry);
    pendingByEmail.set(data.email, entry);

    return { verificationToken: token };
  },

  /* ---- verifyEmail ---- */
  async verifyEmail(token: string) {
    await simulate("auth.verifyEmail");
    const entry = pendingSignups.get(token);
    if (!entry) throw new Error("Verification link is invalid or has expired.");
    entry.verified = true;
  },

  /* ---- resendVerification ---- */
  async resendVerification(email: string) {
    await simulate("auth.resendVerification");

    const existing = pendingByEmail.get(email);
    if (!existing) throw new Error("No pending signup found for this email.");
    if (existing.verified) throw new Error("Email is already verified.");

    // Rotate token
    pendingSignups.delete(existing.token);
    const token = makeToken();
    existing.token = token;
    pendingSignups.set(token, existing);

    return { verificationToken: token };
  },

  /* ---- forgotPassword ---- */
  async forgotPassword(email: string) {
    await simulate("auth.forgotPassword");

    // Invalidate any existing token for this email
    const old = resetByEmail.get(email);
    if (old) resetTokens.delete(old);

    const token = makeToken().replace("vt_", "rt_");
    const entry: ResetEntry = {
      email,
      token,
      expiresAt: Date.now() + RESET_TTL_MS,
      used: false,
    };
    resetTokens.set(token, entry);
    resetByEmail.set(email, token);

    // Mock: always succeeds even if email unknown (prevents email enumeration)
    return { resetToken: token };
  },

  /* ---- validateResetToken ---- */
  async validateResetToken(token: string) {
    await simulate("auth.validateResetToken");

    const entry = resetTokens.get(token);
    if (!entry || entry.used) throw new Error("INVALID");
    if (Date.now() > entry.expiresAt) throw new Error("EXPIRED");
    return { email: entry.email };
  },

  /* ---- resetPassword ---- */
  async resetPassword(token: string, _newPassword: string) {
    await simulate("auth.resetPassword");

    const entry = resetTokens.get(token);
    if (!entry || entry.used) throw new Error("INVALID");
    if (Date.now() > entry.expiresAt) throw new Error("EXPIRED");

    entry.used = true;
    resetByEmail.delete(entry.email);

    // In a real impl: hash + store the new password.
    // Mock: just mark entry used; login still accepts any password for fixture users.
  },
};
