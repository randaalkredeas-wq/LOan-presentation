import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().trim().min(1),
  categoryId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expenseType: z.enum(["DIRECT", "OPERATING"]),
  isRecurring: z.boolean().default(false),
  paymentMethod: z.string().min(1),
  notes: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      name: parsed.name, categoryId: parsed.categoryId, amount: parsed.amount,
      date: new Date(`${parsed.date}T00:00:00.000Z`), expenseType: parsed.expenseType,
      isRecurring: parsed.isRecurring, paymentMethod: parsed.paymentMethod, notes: parsed.notes || null,
    },
  });

  return NextResponse.json({ id: expense.id });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const expenses = await prisma.expense.findMany({
    where: from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {},
    include: { category: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json({ expenses });
}
