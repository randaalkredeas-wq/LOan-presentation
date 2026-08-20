import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber")?.trim();
  const phone = searchParams.get("phone")?.trim();

  if (!orderNumber || !phone) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber, customer: { phone } },
    include: { customer: true, service: true, package: true, payments: true },
  });

  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const paid = order.payments.reduce((s, p) => s + Number(p.amount), 0);

  return NextResponse.json({
    orderNumber: order.orderNumber,
    customerName: order.customer.fullName,
    serviceNameEn: order.service.nameEn, serviceNameAr: order.service.nameAr,
    packageNameEn: order.package.nameEn, packageNameAr: order.package.nameAr,
    eventDate: order.eventDate.toISOString().slice(0, 10),
    eventTime: order.eventTime,
    total: order.total.toString(),
    paid: paid.toString(),
    status: order.status,
    paymentStatus: order.paymentStatus,
  });
}
