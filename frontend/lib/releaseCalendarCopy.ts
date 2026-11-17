import type { Drop } from '@/types';
import { formatDropDate } from '@/lib/calendar';
import { formatDropPrice } from '@/lib/utils';
import type { ReleaseCalendar } from '@/lib/releaseCalendars';

export function retailPriceText(d: Pick<Drop, 'retailPrice' | 'currency'>): string {
  if (!d.retailPrice) return 'TBC';
  return `${formatDropPrice(d.retailPrice, d.currency)}${d.currency === 'USD' ? ' (US retail)' : ''}`;
}

export function calendarSummary(cal: ReleaseCalendar, upcoming: Drop[], released: Drop[], year: number): string {
  const parts: string[] = [];
  const next = upcoming[0];
  if (next) {
    const price = next.retailPrice ? `, at a retail price of ${retailPriceText(next)}` : '';
    parts.push(`The next ${cal.label} release is ${next.name} on ${formatDropDate(next.releaseDate)}${price}.`);
    const more = upcoming.length - 1;
    if (more > 0) {
      const last = formatDropDate(upcoming[upcoming.length - 1].releaseDate, { month: 'long', year: 'numeric' });
      parts.push(`${more} more ${cal.label} ${more === 1 ? 'release is' : 'releases are'} confirmed through ${last}.`);
    }
  } else {
    parts.push(`No upcoming ${cal.label} release date is confirmed yet. New dates are added as soon as the brand announces them.`);
  }
  if (released.length > 0) {
    parts.push(`${released.length} ${cal.label} ${released.length === 1 ? 'pair has' : 'pairs have'} released so far in ${year}.`);
  }
  return parts.join(' ');
}
