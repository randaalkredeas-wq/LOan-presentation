import { TrackForm } from "@/components/booking/track-form";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { orderNumber } = await searchParams;
  return <TrackForm initialOrderNumber={orderNumber} />;
}
