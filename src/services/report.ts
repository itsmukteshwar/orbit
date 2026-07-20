import { mockReportService } from "@/services/mock/report";

export interface RegistrationSummary {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Array<{ categoryId: string; name: string; count: number }>;
  bySource: Record<string, number>;
}

export interface CheckinSummary {
  total: number;
  byDay: Record<number, number>;
  byGate: Array<{ gateId: string; name: string; count: number }>;
  duplicates: number;
}

export interface FoodSummary {
  totalRedemptions: number;
  duplicates: number;
  byWindow: Array<{ mealSessionId: string; name: string; day: number; redeemed: number }>;
  byPreference: Record<string, number>;
}

export interface ReportService {
  registrationSummary(eventId: string): Promise<RegistrationSummary>;
  checkinSummary(eventId: string): Promise<CheckinSummary>;
  foodSummary(eventId: string): Promise<FoodSummary>;
}

export const reportService: ReportService = mockReportService;
