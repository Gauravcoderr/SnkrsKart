import { Drop } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

// Drops are stored as date-only values (midnight UTC), so calendar entries are all-day events.
function ymdCompact(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function dropStart(drop: Pick<Drop, 'releaseDate'>): Date {
  return new Date(`${drop.releaseDate.slice(0, 10)}T00:00:00Z`);
}

function dropDetails(drop: Pick<Drop, 'name' | 'brand' | 'colorway' | 'where' | 'slug'>): string {
  const parts = [`${drop.brand} release`];
  if (drop.colorway) parts.push(`Colorway: ${drop.colorway}`);
  if (drop.where) parts.push(`Where: ${drop.where}`);
  parts.push(`${SITE_URL}/drops/${drop.slug}`);
  return parts.join('\n');
}

export function googleCalendarUrl(drop: Pick<Drop, 'name' | 'brand' | 'colorway' | 'where' | 'slug' | 'releaseDate'>): string {
  const start = dropStart(drop);
  const end = new Date(start.getTime() + 86400000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${drop.name} drop`,
    dates: `${ymdCompact(start)}/${ymdCompact(end)}`,
    details: dropDetails(drop),
    location: drop.where || 'Online',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(drop: Pick<Drop, 'name' | 'brand' | 'colorway' | 'where' | 'slug' | 'releaseDate'>): string {
  const start = dropStart(drop);
  const end = new Date(start.getTime() + 86400000);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SNKRS CART//Drop Calendar//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:drop-${drop.slug}@snkrscart.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymdCompact(start)}`,
    `DTEND;VALUE=DATE:${ymdCompact(end)}`,
    `SUMMARY:${icsEscape(`${drop.name} drop`)}`,
    `DESCRIPTION:${icsEscape(dropDetails(drop))}`,
    `LOCATION:${icsEscape(drop.where || 'Online')}`,
    `URL:${SITE_URL}/drops/${drop.slug}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(`${drop.name} drops tomorrow`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(drop: Pick<Drop, 'name' | 'brand' | 'colorway' | 'where' | 'slug' | 'releaseDate'>): void {
  const blob = new Blob([buildIcs(drop)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${drop.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Shared date helpers for drop pages. All comparisons use the UTC calendar date,
// matching how release dates are stored (date-only, midnight UTC).
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateKey(releaseDate: string): string {
  return releaseDate.slice(0, 10);
}

export function daysUntil(releaseDate: string): number {
  return Math.round((new Date(dateKey(releaseDate)).getTime() - new Date(todayKey()).getTime()) / 86400000);
}

export function formatDropDate(releaseDate: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }): string {
  return new Date(dateKey(releaseDate)).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
}
