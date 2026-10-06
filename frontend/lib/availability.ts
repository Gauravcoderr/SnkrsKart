import { Availability } from '@/types';

export interface AvailabilityMeta {
  label: string;
  short: string;
  shipDays: number;
  transitDays: [number, number];
  description: string;
  badgeClass: string;
  dotClass: string;
}

export const AVAILABILITY_META: Record<Availability, AvailabilityMeta> = {
  instant: {
    label: 'Instant',
    short: '24h',
    shipDays: 1,
    transitDays: [2, 4],
    description: 'Ships within 24 hours',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  inhand: {
    label: 'In hand',
    short: '3 days',
    shipDays: 3,
    transitDays: [2, 4],
    description: 'Ships in 3 days',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  eta: {
    label: 'Pre-order',
    short: '~20 days',
    shipDays: 20,
    transitDays: [2, 5],
    description: 'Ships in about 20 days',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
};

export const AVAILABILITY_ORDER: Availability[] = ['instant', 'inhand', 'eta'];

export const SELLER_COMMISSION_PCT = 10;

export function computeListPrice(sellerPrice: number): number {
  return Math.ceil((Math.round(sellerPrice) * (100 + SELLER_COMMISSION_PCT)) / 1000) * 10;
}

export function isAvailability(v: unknown): v is Availability {
  return v === 'instant' || v === 'inhand' || v === 'eta';
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function deliveryWindow(availability: Availability, from: Date = new Date()): { start: Date; end: Date } {
  const meta = AVAILABILITY_META[availability];
  return {
    start: addDays(from, meta.shipDays + meta.transitDays[0]),
    end: addDays(from, meta.shipDays + meta.transitDays[1]),
  };
}

const dayMonth = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function formatDeliveryWindow(availability: Availability, from?: Date): string {
  const { start, end } = deliveryWindow(availability, from);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${dayMonth(end)}`;
  }
  return `${dayMonth(start)} – ${dayMonth(end)}`;
}

export function slowestAvailability(list: Array<Availability | undefined>): Availability {
  let worst: Availability = 'instant';
  for (const a of list) {
    const v = a ?? 'inhand';
    if (AVAILABILITY_ORDER.indexOf(v) > AVAILABILITY_ORDER.indexOf(worst)) worst = v;
  }
  return worst;
}
