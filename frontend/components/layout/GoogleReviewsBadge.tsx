'use client';

import Script from 'next/script';

/**
 * Google Customer Reviews seller-rating badge. On by default. Until the store has seller
 * ratings the widget prints "no rating available"; set NEXT_PUBLIC_GCR_BADGE=0 to hide it.
 */
const MERCHANT_ID = process.env.NEXT_PUBLIC_GMC_MERCHANT_ID || '5750742430';
const ENABLED = process.env.NEXT_PUBLIC_GCR_BADGE !== '0';

export default function GoogleReviewsBadge() {
  if (!ENABLED) return null;
  return (
    <Script
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="lazyOnload"
      onLoad={() => {
        (window as unknown as { merchantwidget?: { start: (o: Record<string, unknown>) => void } })
          .merchantwidget?.start({ merchant_id: Number(MERCHANT_ID), position: 'BOTTOM_LEFT', region: 'IN' });
      }}
    />
  );
}
