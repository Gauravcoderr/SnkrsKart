'use client';

import Script from 'next/script';

/**
 * Google Customer Reviews opt-in. Google emails the buyer a short survey after the
 * estimated delivery date; results build the store's seller rating shown on Shopping
 * listings and ads. Renders nothing without an order id and email.
 * Requires the program to be enabled in Merchant Center → Growth → Manage programs.
 */
const MERCHANT_ID = process.env.NEXT_PUBLIC_GMC_MERCHANT_ID || '5750742430';
const DELIVERY_DAYS = 7; // matches the 3-7 day transit window in product schema

interface Props {
  orderId: string;
  email: string;
}

export default function GoogleCustomerReviewsOptIn({ orderId, email }: Props) {
  if (!orderId || !email) return null;

  const est = new Date(Date.now() + DELIVERY_DAYS * 86_400_000).toISOString().slice(0, 10);
  const payload = JSON.stringify({
    merchant_id: Number(MERCHANT_ID),
    order_id: orderId,
    email,
    delivery_country: 'IN',
    estimated_delivery_date: est,
  });

  // Define the callback first, then load platform.js, so the onload hook always finds it.
  const code = `
    window.renderOptIn = function () {
      window.gapi.load('surveyoptin', function () {
        window.gapi.surveyoptin.render(${payload});
      });
    };
    (function () {
      var s = document.createElement('script');
      s.src = 'https://apis.google.com/js/platform.js?onload=renderOptIn';
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    })();
  `;

  return <Script id="gcr-optin" strategy="afterInteractive">{code}</Script>;
}
