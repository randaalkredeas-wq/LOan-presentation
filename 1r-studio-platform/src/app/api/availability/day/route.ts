import { NextRequest, NextResponse } from "next/server";
import { getDayAvailability } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const result = await getDayAvailability(date);
  return NextResponse.json(result);
}
