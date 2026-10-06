const AFTERSHIP_SLUGS: Record<string, string> = {
  'Delhivery': 'delhivery',
  'DTDC': 'dtdc',
  'Blue Dart': 'bluedart',
  'Ekart Logistics': 'ekart',
  'XpressBees': 'xpressbees',
  'Shadowfax': 'shadowfax',
  'Ecom Express': 'ecom-express',
  'India Post': 'india-post',
  'FedEx': 'fedex',
  'DHL': 'dhl',
};

const NATIVE_DEEP_LINKS: Record<string, (n: string) => string> = {
  'Shiprocket': (n) => `https://shiprocket.co/tracking/${n}`,
  'Blue Dart': (n) => `https://www.bluedart.com/web/guest/trackdartresultthirdparty?trackFor=0&trackNo=${n}`,
  'FedEx': (n) => `https://www.fedex.com/apps/fedextrack/?action=track&trackingnumber=${n}`,
  'DHL': (n) => `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${n}`,
};

export const AFTERSHIP_GENERIC_URL = 'https://www.aftership.com/track';

export function getAfterShipUrl(service: string, trackingNumber: string): string | null {
  const slug = AFTERSHIP_SLUGS[service];
  if (!slug || !trackingNumber) return null;
  return `https://www.aftership.com/track/${slug}/${encodeURIComponent(trackingNumber.trim())}`;
}

export function getTrackingUrl(service: string, trackingNumber: string): string | null {
  if (!trackingNumber) return null;
  const native = NATIVE_DEEP_LINKS[service];
  if (native) return native(encodeURIComponent(trackingNumber.trim()));
  return getAfterShipUrl(service, trackingNumber) ?? AFTERSHIP_GENERIC_URL;
}

export function isDeepLink(service: string): boolean {
  return service in NATIVE_DEEP_LINKS || service in AFTERSHIP_SLUGS;
}

export function isAfterShipLink(service: string): boolean {
  return !(service in NATIVE_DEEP_LINKS) && service in AFTERSHIP_SLUGS;
}

export const SHIPMENT_TAG_LABEL: Record<string, string> = {
  Pending: 'Label created',
  InfoReceived: 'Picked up by courier',
  InTransit: 'In transit',
  OutForDelivery: 'Out for delivery',
  AttemptFail: 'Delivery attempt failed',
  Delivered: 'Delivered',
  AvailableForPickup: 'Ready for pickup',
  Exception: 'Delivery exception',
  Expired: 'No recent updates',
};

export type ShipmentTone = 'ok' | 'active' | 'warn' | 'neutral';

export function shipmentTone(tag: string): ShipmentTone {
  if (tag === 'Delivered') return 'ok';
  if (tag === 'AttemptFail' || tag === 'Exception' || tag === 'Expired') return 'warn';
  if (tag === 'InTransit' || tag === 'OutForDelivery' || tag === 'InfoReceived' || tag === 'AvailableForPickup') return 'active';
  return 'neutral';
}

export function shipmentHeadline(shipment: { tag: string; subtagMessage?: string }): string {
  return SHIPMENT_TAG_LABEL[shipment.tag] || shipment.subtagMessage || shipment.tag || 'Tracking registered';
}

export function formatCheckpointTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diffH = Math.round((Date.now() - d.getTime()) / 3600000);
  if (diffH < 1) return 'just now';
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
