import type { ListParams, Page } from "@/services/types";
import type { Counter, MealSession, Redemption, RedemptionResult } from "@/types/domain";
import { mockFoodService } from "@/services/mock/food";

export interface RedemptionFilters {
  mealSessionId?: string;
  counterId?: string;
  result?: RedemptionResult;
}

export interface RedeemInput {
  qrToken: string;
  mealSessionId: string;
  counterId: string;
}

export interface FoodService {
  mealSessions(eventId: string): Promise<MealSession[]>;
  counters(eventId: string): Promise<Counter[]>;
  listRedemptions(params?: ListParams<RedemptionFilters>): Promise<Page<Redemption>>;
  /** Validates entitlement + duplicates and records a redemption. */
  redeem(input: RedeemInput): Promise<{ result: RedemptionResult; redemption: Redemption | null }>;
  setCounterActive(counterId: string, active: boolean): Promise<Counter>;
  setWindowStatus(mealSessionId: string, status: MealSession["status"]): Promise<MealSession>;
}

export const foodService: FoodService = mockFoodService;
