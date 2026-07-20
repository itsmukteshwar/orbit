import type { FoodService } from "@/services/food";
import type { Redemption, RedemptionResult } from "@/types/domain";
import { db, findOrThrow } from "@/services/mock/db";
import { paginate, runtimeId, simulate } from "@/services/mock/util";

export const mockFoodService: FoodService = {
  async mealSessions(eventId) {
    await simulate("food.mealSessions");
    return db.mealSessions.filter((m) => m.eventId === eventId);
  },
  async counters(eventId) {
    await simulate("food.counters");
    return db.counters.filter((c) => c.eventId === eventId);
  },
  async listRedemptions(params) {
    await simulate("food.listRedemptions");
    const f = params?.filters;
    const items = db.redemptions
      .filter(
        (r) =>
          (!f?.mealSessionId || r.mealSessionId === f.mealSessionId) &&
          (!f?.counterId || r.counterId === f.counterId) &&
          (!f?.result || r.result === f.result),
      )
      .sort((a, b) => b.at.localeCompare(a.at));
    return paginate(items, params?.cursor, params?.limit ?? 50);
  },
  async redeem(input) {
    await simulate("food.redeem");
    const session = findOrThrow(db.mealSessions, input.mealSessionId, "MealSession");
    const pass = db.passes.find((p) => p.qrToken === input.qrToken);

    let result: RedemptionResult;
    if (!pass || pass.status !== "active") result = "not_entitled";
    else if (session.status === "closed" || session.status === "upcoming") result = "window_closed";
    else {
      const reg = db.registrations.find((r) => r.id === pass.registrationId);
      const entitled = reg && session.categoryIds.includes(reg.categoryId);
      if (!entitled) result = "not_entitled";
      else if (
        db.redemptions.some(
          (r) => r.passId === pass.id && r.mealSessionId === session.id && r.result === "ok",
        )
      )
        result = "duplicate";
      else result = "ok";
    }

    let redemption: Redemption | null = null;
    if (pass) {
      const reg = db.registrations.find((r) => r.id === pass.registrationId);
      redemption = {
        id: runtimeId("rdm"),
        mealSessionId: session.id,
        passId: pass.id,
        counterId: input.counterId,
        result,
        foodPreference: reg?.foodPreference ?? "veg",
        at: new Date().toISOString(),
      };
      db.redemptions.unshift(redemption);
    }
    return { result, redemption };
  },
  async setCounterActive(counterId, active) {
    await simulate("food.setCounterActive");
    const counter = findOrThrow(db.counters, counterId, "Counter");
    counter.active = active;
    return counter;
  },
  async setWindowStatus(mealSessionId, status) {
    await simulate("food.setWindowStatus");
    const session = findOrThrow(db.mealSessions, mealSessionId, "MealSession");
    session.status = status;
    return session;
  },
};
