import { NextRequest, NextResponse } from "next/server";
import { getMonthAvailability } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 0-indexed

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  const days = await getMonthAvailability(year, month);
  return NextResponse.json({ days });
}
