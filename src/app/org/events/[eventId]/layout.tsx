import { EventContextBar } from "@/components/kit/EventContextBar";

/** Event context (P-06c): every event-scoped page gets the context bar strip. */
export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <>
      <EventContextBar eventId={eventId} />
      {children}
    </>
  );
}
