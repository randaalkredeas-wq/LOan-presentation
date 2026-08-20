import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable } from "@/lib/availability";
import { generateOrderNumber } from "@/lib/booking-number";

const bodySchema = z.object({
  packageId: z.string().min(1),
  addonIds: z.array(z.string()).default([]),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventTime: z.string().min(1),
  customer: z.object({
    fullName: z.string().trim().min(2),
    phone: z.string().trim().min(6),
    email: z.string().trim().email().optional().or(z.literal("")),
  }),
  location: z.string().trim().optional(),
  additionalRequirements: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const pkg = await prisma.package.findUnique({
    where: { id: parsed.packageId },
    include: { addons: true, service: true },
  });
  if (!pkg || !pkg.isActive) {
    return NextResponse.json({ error: "package_not_found" }, { status: 404 });
  }

  // Frontend-first check for a friendly error — the transaction below is the real guard.
  const available = await isSlotAvailable(parsed.eventDate, parsed.eventTime);
  if (!available) {
    return NextResponse.json({ error: "slot_taken" }, { status: 409 });
  }

  const chosenAddons = pkg.addons.filter((a) => parsed.addonIds.includes(a.id) && a.isActive);
  const addonsTotal = chosenAddons.reduce((sum, a) => sum + Number(a.price), 0);
  const total = Number(pkg.price) + addonsTotal;
  const eventDate = new Date(`${parsed.eventDate}T00:00:00.000Z`);

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Match returning customers by phone (not a unique column — multiple historical
      // records are possible, so we take the most recently created match).
      const existingCustomer = await tx.customer.findFirst({
        where: { phone: parsed.customer.phone },
        orderBy: { createdAt: "desc" },
      });
      const resolvedCustomer =
        existingCustomer ??
        (await tx.customer.create({
          data: { fullName: parsed.customer.fullName, phone: parsed.customer.phone, email: parsed.customer.email || null },
        }));

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: resolvedCustomer.id,
          serviceId: pkg.serviceId,
          packageId: pkg.id,
          eventDate,
          eventTime: parsed.eventTime,
          location: parsed.location || null,
          additionalRequirements: parsed.additionalRequirements || null,
          notes: parsed.notes || null,
          packagePriceSnapshot: pkg.price,
          addonsTotalSnapshot: addonsTotal,
          total,
          directCostSnapshot: pkg.directCost,
          depositAmount: pkg.depositAmount,
          status: "NEW",
          paymentStatus: "UNPAID",
          source: "WEBSITE",
          addons: {
            create: chosenAddons.map((a) => ({
              addonOptionId: a.id, nameEnSnapshot: a.nameEn, nameArSnapshot: a.nameAr, priceSnapshot: a.price, qty: 1,
            })),
          },
        },
        include: { customer: true, service: true, package: true },
      });

      // This unique-constraint insert is what actually prevents double-booking under concurrency.
      await tx.bookingSlotLock.create({
        data: { eventDate, eventTime: parsed.eventTime, orderId: created.id },
      });

      return created;
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      customerName: order.customer.fullName,
      serviceNameEn: order.service.nameEn, serviceNameAr: order.service.nameAr,
      packageNameEn: order.package.nameEn, packageNameAr: order.package.nameAr,
      eventDate: parsed.eventDate,
      eventTime: order.eventTime,
      total: total.toString(),
      status: order.status,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
