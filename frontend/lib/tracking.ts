// Courier tracking deep-links.
// ✓ = URL format user-verified or from official docs.
// ~ = links to carrier tracking homepage (no reliable GET deep-link found).
// null = carrier tracking not publicly accessible via URL.
const TRACKING_URLS: Record<string, (n: string) => string | null> = {
  // ✓ Shiprocket — direct AWB path
  'Shiprocket':      (n) => `https://shiprocket.co/tracking/${n}`,

  // ~ Delhivery — deep-link format unconfirmed; links to tracking home
  'Delhivery':       (_) => `https://www.delhivery.com/track`,

  // ~ DTDC — no GET-based deep link; links to trace page
  'DTDC':            (_) => `https://www.dtdc.com/trace.asp`,

  // ✓ Blue Dart — user-verified URL
  'Blue Dart':       (n) => `https://www.bluedart.com/web/guest/trackdartresultthirdparty?trackFor=0&trackNo=${n}`,

  // ~ Ekart Logistics (Flipkart)
  'Ekart Logistics': (n) => `https://ekartlogistics.com/shipmenttrack/${n}`,

  // ~ XpressBees
  'XpressBees':      (n) => `https://www.xpressbees.com/shipment/tracking?awbNo=${n}`,

  // ~ Shadowfax
  'Shadowfax':       (n) => `https://tracker.shadowfax.in/?awb=${n}`,

  // ~ Ecom Express (merged into Delhivery) — links to Delhivery tracking home
  'Ecom Express':    (_) => `https://www.delhivery.com/track`,

  // ~ India Post — links to main site (no reliable deep-link param)
  'India Post':      (_) => `https://www.indiapost.gov.in/`,

  // ✓ FedEx — official format
  'FedEx':           (n) => `https://www.fedex.com/apps/fedextrack/?action=track&trackingnumber=${n}`,

  // ✓ DHL India — standard format
  'DHL':             (n) => `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${n}`,
};

export function getTrackingUrl(service: string, trackingNumber: string): string | null {
  const fn = TRACKING_URLS[service];
  return fn ? fn(trackingNumber) : null;
}
