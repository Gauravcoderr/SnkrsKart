import type { Drop } from '@/types';
import { dateKey } from '@/lib/calendar';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export function dropItemListJsonLd(upcoming: Drop[], name: string, url: string) {
  if (upcoming.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    numberOfItems: upcoming.length,
    itemListElement: upcoming.slice(0, 50).map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/drops/${d.slug}`,
      name: d.name,
      item: {
        '@type': 'Event',
        name: d.name,
        startDate: dateKey(d.releaseDate),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        location: { '@type': 'VirtualLocation', url: `${SITE_URL}/drops/${d.slug}` },
        url: `${SITE_URL}/drops/${d.slug}`,
        ...(d.image ? { image: d.image } : {}),
        organizer: { '@type': 'Organization', name: d.brand },
      },
    })),
  };
}
