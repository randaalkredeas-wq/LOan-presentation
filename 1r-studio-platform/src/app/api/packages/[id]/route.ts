import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  descriptionEn: z.string().min(1).optional(),
  descriptionAr: z.string().min(1).optional(),
  price: z.coerce.number().positive().optional(),
  depositAmount: z.coerce.number().nonnegative().optional(),
  directCost: z.coerce.number().nonnegative().optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const pkg = await prisma.package.update({ where: { id }, data });
  return NextResponse.json({ id: pkg.id });
}
