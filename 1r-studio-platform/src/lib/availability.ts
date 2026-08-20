// Availability engine — single source of truth for both the calendar UI and booking validation.
import { prisma } from "./prisma";
import { startOfDay } from "date-fns";

const ACTIVE = ["NEW", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] as const;

export type DayStatus = "available" | "unavailable" | "past";

export interface DayAvailability {
  date: string; // yyyy-mm-dd
  status: DayStatus;
  availableSlots: number;
  totalSlots: number;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getContext() {
  const [settings, timeSlots] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.timeSlot.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const workingDays = settings?.workingDays ?? [0, 1, 2, 3, 4, 6];
  return { workingDays, timeSlots };
}

/** Availability for every day in a given month (0-indexed month), for calendar rendering. */
export async function getMonthAvailability(year: number, month: number): Promise<DayAvailability[]> {
  const { workingDays, timeSlots } = await getContext();
  const today = startOfDay(new Date());
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));

  const [blockedDates, locks] = await Promise.all([
    prisma.blockedDate.findMany({ where: { date: { gte: firstDay, lte: lastDay } } }),
    prisma.bookingSlotLock.findMany({ where: { eventDate: { gte: firstDay, lte: lastDay } } }),
  ]);
  const blockedByDate = new Map(blockedDates.map((b) => [dateKey(b.date), b]));
  const locksByDate = new Map<string, Set<string>>();
  for (const l of locks) {
    const k = dateKey(l.eventDate);
    if (!locksByDate.has(k)) locksByDate.set(k, new Set());
    locksByDate.get(k)!.add(l.eventTime);
  }

  const totalSlots = Math.max(timeSlots.length, 1);
  const results: DayAvailability[] = [];

  for (let day = 1; day <= lastDay.getUTCDate(); day++) {
    const d = new Date(Date.UTC(year, month, day));
    const key = dateKey(d);

    if (d < today) {
      results.push({ date: key, status: "past", availableSlots: 0, totalSlots });
      continue;
    }
    if (!workingDays.includes(d.getUTCDay())) {
      results.push({ date: key, status: "unavailable", availableSlots: 0, totalSlots });
      continue;
    }
    const blocked = blockedByDate.get(key);
    if (blocked?.isFullDay) {
      results.push({ date: key, status: "unavailable", availableSlots: 0, totalSlots });
      continue;
    }
    const takenSlots = locksByDate.get(key) ?? new Set();
    const blockedSlots = new Set(blocked?.blockedSlots ?? []);
    const remaining = timeSlots.filter((s) => !takenSlots.has(s.label) && !blockedSlots.has(s.label));

    results.push({
      date: key,
      status: remaining.length > 0 ? "available" : "unavailable",
      availableSlots: remaining.length,
      totalSlots,
    });
  }

  return results;
}

export interface SlotAvailability {
  label: string;
  available: boolean;
}

/** Availability for a single date's time slots, for the time-selection step. */
export async function getDayAvailability(dateISO: string): Promise<{ dateAvailable: boolean; slots: SlotAvailability[] }> {
  const { workingDays, timeSlots } = await getContext();
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  const today = startOfDay(new Date());

  if (d < today || !workingDays.includes(d.getUTCDay())) {
    return { dateAvailable: false, slots: timeSlots.map((s) => ({ label: s.label, available: false })) };
  }

  const [blocked, locks] = await Promise.all([
    prisma.blockedDate.findUnique({ where: { date: d } }),
    prisma.bookingSlotLock.findMany({ where: { eventDate: d } }),
  ]);

  if (blocked?.isFullDay) {
    return { dateAvailable: false, slots: timeSlots.map((s) => ({ label: s.label, available: false })) };
  }

  const taken = new Set(locks.map((l) => l.eventTime));
  const blockedSlots = new Set(blocked?.blockedSlots ?? []);
  const slots = timeSlots.map((s) => ({ label: s.label, available: !taken.has(s.label) && !blockedSlots.has(s.label) }));

  return { dateAvailable: slots.some((s) => s.available), slots };
}

/** Server-side re-validation before creating a booking — never trust the client. */
export async function isSlotAvailable(dateISO: string, time: string): Promise<boolean> {
  const { slots } = await getDayAvailability(dateISO);
  return slots.some((s) => s.label === time && s.available);
}
