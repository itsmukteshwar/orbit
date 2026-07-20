import type { ListParams, Page } from "@/services/types";
import type { Checkin, CheckinResult, Device, Gate } from "@/types/domain";
import { mockCheckinService } from "@/services/mock/checkin";

export interface CheckinFilters {
  eventId?: string;
  gateId?: string;
  day?: number;
  result?: CheckinResult;
}

export interface ScanInput {
  eventId: string;
  qrToken: string;
  gateId: string;
  deviceId: string;
  day: number;
}

export interface GateInput {
  name: string;
  location: string;
  kind: Gate["kind"];
}

export interface PairingCodeInput {
  label: string;
  gateId: string | null;
  counterId: string | null;
  eventId: string;
}

export interface CheckinService {
  list(params?: ListParams<CheckinFilters>): Promise<Page<Checkin>>;
  /** Validates a QR token and records a check-in. Returns result + record. */
  scan(input: ScanInput): Promise<{ result: CheckinResult; checkin: Checkin | null }>;
  gates(eventId: string): Promise<Gate[]>;
  devices(eventId: string): Promise<Device[]>;
  /** Gate CRUD */
  addGate(eventId: string, input: GateInput): Promise<Gate>;
  updateGate(id: string, patch: Partial<GateInput>): Promise<Gate>;
  deleteGate(id: string): Promise<void>;
  /** Generates a 6-digit pairing code valid for 10 minutes and creates a pending device. */
  generatePairingCode(input: PairingCodeInput): Promise<{ device: Device; code: string; expiresAt: string }>;
  /** Revokes a device — it loses access immediately. */
  revokeDevice(id: string): Promise<Device>;
}

export const checkinService: CheckinService = mockCheckinService;
