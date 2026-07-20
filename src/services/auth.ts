import type { Role, User } from "@/types/domain";
import { mockAuthService } from "@/services/mock/auth";

export interface SignupInput {
  orgName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthService {
  currentUser(): Promise<User>;
  /** Mock role switcher — swaps the acting user to the fixture user with that role. */
  switchRole(role: Role): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  signup(data: SignupInput): Promise<{ verificationToken: string }>;
  /** Consume the one-time token from the verification email link. */
  verifyEmail(token: string): Promise<void>;
  /** Re-send a verification email (resets the token). */
  resendVerification(email: string): Promise<{ verificationToken: string }>;
  /** Send a password-reset link. Returns the reset token (mock only; real impl would email it). */
  forgotPassword(email: string): Promise<{ resetToken: string }>;
  /** Check whether a reset token is still valid. Throws "INVALID" or "EXPIRED". */
  validateResetToken(token: string): Promise<{ email: string }>;
  /** Consume the reset token and set a new password. */
  resetPassword(token: string, newPassword: string): Promise<void>;
}

export const authService: AuthService = mockAuthService;
