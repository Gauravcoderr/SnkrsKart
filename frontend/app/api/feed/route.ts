import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

/**
 * Legacy Google Shopping feed URL. The maintained feed lives at /google-merchant-feed.xml
 * (per-size items, full product data). Keep this path alive as a permanent redirect so any
 * Merchant Center or third-party fetcher still pointed here keeps working.
 */
export function GET() {
  return NextResponse.redirect(`${SITE_URL}/google-merchant-feed.xml`, 301);
}
