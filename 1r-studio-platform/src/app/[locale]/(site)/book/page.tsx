import { getServices } from "@/lib/catalog";
import { toServiceDTO } from "@/lib/catalog-dto";
import { BookingWizard } from "@/components/booking/booking-wizard";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const { package: packageSlug } = await searchParams;
  const services = await getServices();
  return <BookingWizard services={services.map(toServiceDTO)} initialPackageSlug={packageSlug} />;
}
