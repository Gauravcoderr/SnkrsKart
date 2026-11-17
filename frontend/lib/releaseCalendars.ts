import type { Drop } from '@/types';

type CalendarDrop = Pick<Drop, 'name' | 'brand' | 'releaseDate'>;

export interface ReleaseCalendar {
  slug: string;
  label: string;
  heading: string;
  matches: (drop: CalendarDrop) => boolean;
  title: (year: number) => string;
}

function calendar(slug: string, label: string, matches: ReleaseCalendar['matches'], heading = `${label} Release Dates`): ReleaseCalendar {
  return { slug, label, heading, matches, title: (year) => `${label} Release Dates ${year} and Prices | Snkrs Cart` };
}

export const RELEASE_CALENDARS: ReleaseCalendar[] = [
  calendar('jordan', 'Jordan', (d) => d.brand === 'Jordan'),
  calendar('nike', 'Nike', (d) => d.brand === 'Nike'),
  calendar('kobe', 'Nike Kobe', (d) => /\bkobe\b/i.test(d.name)),
  calendar('nike-caitlin-1', 'Caitlin Clark', (d) => /\bcaitlin\b/i.test(d.name), 'Nike Caitlin 1 and Caitlin Clark Shoe Release Dates'),
];

export function findCalendar(slug: string): ReleaseCalendar | undefined {
  return RELEASE_CALENDARS.find((c) => c.slug === slug);
}

export function calendarDrops<D extends CalendarDrop>(cal: ReleaseCalendar, drops: D[], today: string): { upcoming: D[]; released: D[] } {
  const day = (d: D) => d.releaseDate.slice(0, 10);
  const mine = drops.filter(cal.matches);
  return {
    upcoming: mine.filter((d) => day(d) >= today).sort((a, b) => day(a).localeCompare(day(b))),
    released: mine
      .filter((d) => day(d) < today && day(d).slice(0, 4) === today.slice(0, 4))
      .sort((a, b) => day(b).localeCompare(day(a))),
  };
}
