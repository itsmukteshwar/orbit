import { NextResponse } from "next/server";
import { fixtureCounts } from "@/mocks/fixtures";

/** Dev route: dumps fixture record counts so the mock layer can be sanity-checked. */
export function GET() {
  return NextResponse.json({
    ok: true,
    seed: 20260718,
    generatedAt: new Date().toISOString(),
    counts: fixtureCounts(),
  });
}
