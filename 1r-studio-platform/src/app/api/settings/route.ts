import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  businessNameEn: z.string().min(1).optional(),
  businessNameAr: z.string().min(1).optional(),
  fixedCostsMonthly: z.coerce.number().nonnegative().optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  await prisma.settings.upsert({ where: { id: "singleton" }, update: data, create: { id: "singleton", ...data } });
  return NextResponse.json({ ok: true });
}
