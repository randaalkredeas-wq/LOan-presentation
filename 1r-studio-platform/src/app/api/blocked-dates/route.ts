import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().optional(),
  type: z.enum(["VACATION", "BLOCKED", "FULLY_BOOKED", "CUSTOM"]).default("BLOCKED"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const blocked = await prisma.blockedDate.upsert({
    where: { date: new Date(`${data.date}T00:00:00.000Z`) },
    update: { isFullDay: true, type: data.type, reason: data.reason },
    create: { date: new Date(`${data.date}T00:00:00.000Z`), isFullDay: true, type: data.type, reason: data.reason },
  });
  return NextResponse.json({ id: blocked.id });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  await prisma.blockedDate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
