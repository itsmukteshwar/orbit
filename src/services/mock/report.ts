import type { ReportService } from "@/services/report";
import { db } from "@/services/mock/db";
import { simulate } from "@/services/mock/util";

const countBy = <T>(items: T[], key: (item: T) => string): Record<string, number> =>
  items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

export const mockReportService: ReportService = {
  async registrationSummary(eventId) {
    await simulate("report.registrationSummary");
    const regs = db.registrations.filter((r) => r.eventId === eventId);
    return {
      total: regs.length,
      byStatus: countBy(regs, (r) => r.status),
      byCategory: db.categories
        .filter((c) => c.eventId === eventId)
        .map((c) => ({ categoryId: c.id, name: c.name, count: regs.filter((r) => r.categoryId === c.id).length })),
      bySource: countBy(regs, (r) => r.source),
    };
  },
  async checkinSummary(eventId) {
    await simulate("report.checkinSummary");
    const checkins = db.checkins.filter((c) => c.eventId === eventId);
    const byDayNum = checkins.reduce<Record<number, number>>((acc, c) => {
      acc[c.day] = (acc[c.day] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: checkins.length,
      byDay: byDayNum,
      byGate: db.gates
        .filter((g) => g.eventId === eventId)
        .map((g) => ({ gateId: g.id, name: g.name, count: checkins.filter((c) => c.gateId === g.id).length })),
      duplicates: checkins.filter((c) => c.result === "duplicate").length,
    };
  },
  async foodSummary(eventId) {
    await simulate("report.foodSummary");
    const sessions = db.mealSessions.filter((m) => m.eventId === eventId);
    const sessionIds = new Set(sessions.map((s) => s.id));
    const redemptions = db.redemptions.filter((r) => sessionIds.has(r.mealSessionId));
    return {
      totalRedemptions: redemptions.length,
      duplicates: redemptions.filter((r) => r.result === "duplicate").length,
      byWindow: sessions.map((s) => ({
        mealSessionId: s.id,
        name: s.name,
        day: s.day,
        redeemed: redemptions.filter((r) => r.mealSessionId === s.id && r.result === "ok").length,
      })),
      byPreference: countBy(redemptions, (r) => r.foodPreference),
    };
  },
};
