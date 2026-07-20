import type { CheckinService, GateInput, PairingCodeInput } from "@/services/checkin";
import type { Checkin, CheckinResult, Device, Gate } from "@/types/domain";
import { db } from "@/services/mock/db";
import { paginate, runtimeId, simulate } from "@/services/mock/util";

export const mockCheckinService: CheckinService = {
  async list(params) {
    await simulate("checkin.list");
    const f = params?.filters;
    const items = db.checkins
      .filter(
        (c) =>
          (!f?.eventId || c.eventId === f.eventId) &&
          (!f?.gateId || c.gateId === f.gateId) &&
          (f?.day === undefined || c.day === f.day) &&
          (!f?.result || c.result === f.result),
      )
      .sort((a, b) => b.at.localeCompare(a.at));
    return paginate(items, params?.cursor, params?.limit ?? 50);
  },

  async scan(input) {
    await simulate("checkin.scan");
    const pass = db.passes.find((p) => p.qrToken === input.qrToken);

    let result: CheckinResult;
    if (!pass) result = "invalid";
    else if (pass.status === "revoked") result = "revoked";
    else if (
      db.checkins.some((c) => c.passId === pass.id && c.day === input.day && c.result === "ok")
    )
      result = "duplicate";
    else result = "ok";

    let checkin: Checkin | null = null;
    if (pass) {
      checkin = {
        id: runtimeId("chk"),
        eventId: input.eventId,
        passId: pass.id,
        gateId: input.gateId,
        deviceId: input.deviceId,
        direction: "in",
        result,
        day: input.day,
        at: new Date().toISOString(),
      };
      db.checkins.unshift(checkin);
    }
    return { result, checkin };
  },

  async gates(eventId) {
    await simulate("checkin.gates");
    return db.gates.filter((g) => g.eventId === eventId);
  },

  async devices(eventId) {
    await simulate("checkin.devices");
    const gateIds = new Set(db.gates.filter((g) => g.eventId === eventId).map((g) => g.id));
    const counterIds = new Set(db.counters.filter((c) => c.eventId === eventId).map((c) => c.id));
    return db.devices.filter(
      (d) =>
        !d.revoked &&
        ((d.gateId && gateIds.has(d.gateId)) || (d.counterId && counterIds.has(d.counterId))),
    );
  },

  /* ── Gate CRUD ─────────────────────────────────────────────────────────── */

  async addGate(eventId, input: GateInput) {
    await simulate("checkin.addGate");
    const gate: Gate = { id: runtimeId("gat"), eventId, ...input };
    db.gates.push(gate);
    return gate;
  },

  async updateGate(id, patch) {
    await simulate("checkin.updateGate");
    const gate = db.gates.find((g) => g.id === id);
    if (!gate) throw new Error(`Gate ${id} not found`);
    Object.assign(gate, patch);
    return gate;
  },

  async deleteGate(id) {
    await simulate("checkin.deleteGate");
    const idx = db.gates.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error(`Gate ${id} not found`);
    db.gates.splice(idx, 1);
    // Detach devices from this gate
    db.devices.filter((d) => d.gateId === id).forEach((d) => { d.gateId = null; });
  },

  /* ── Device ops ─────────────────────────────────────────────────────────── */

  async generatePairingCode(input: PairingCodeInput) {
    await simulate("checkin.generatePairingCode");
    const code = String(Math.floor(100_000 + Math.random() * 900_000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const device: Device = {
      id: runtimeId("dev"),
      gateId: input.gateId,
      counterId: input.counterId,
      label: input.label,
      sync: "offline",
      queuedScans: 0,
      lastSeenAt: new Date().toISOString(),
    };
    db.devices.push(device);
    return { device, code, expiresAt };
  },

  async revokeDevice(id) {
    await simulate("checkin.revokeDevice");
    const device = db.devices.find((d) => d.id === id);
    if (!device) throw new Error(`Device ${id} not found`);
    device.revoked = true;
    device.sync = "offline";
    return device;
  },
};
