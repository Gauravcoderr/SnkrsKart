/**
 * Store facts told to AI agents (MCP get_store_policies, agents.md). Keep them equal to what
 * checkout actually does: shipping mirrors SHIPPING_COST in backend/src/routes/orders.ts (free on
 * every order since 2026-10-10), returns and dispatch mirror the policy pages.
 */

import { AVAILABILITY_META } from '@/lib/availability';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const SHIPPING_FEE_INR = 0;

export const STORE_FACTS = {
  name: 'SNKRS CART',
  url: SITE_URL,
  market: 'Ships within India only. Prices in INR.',
  catalogue: 'New, authentic sneakers and streetwear: Nike, Jordan, Adidas, New Balance, Crocs.',
  sizing: 'Shoe sizes are UK sizes.',
  authenticity: 'Every pair is checked for authenticity before dispatch. Partner-seller pairs are photo-verified by SNKRS CART before they ship.',
  shipping: {
    country: 'IN',
    cost: 'Free on every order',
    fee_inr: SHIPPING_FEE_INR,
    dispatch: {
      instant: AVAILABILITY_META.instant.description,
      inhand: AVAILABILITY_META.inhand.description,
      preorder: AVAILABILITY_META.eta.description,
    },
    delivery_after_dispatch: '3 to 7 business days',
  },
  returns: 'Returns only for damaged, wrong or authenticity issues, reported within 48 hours of delivery.',
  payment: 'Paid online at checkout: UPI, debit/credit cards, net banking. No cash on delivery.',
  checkout: 'The buyer completes checkout on snkrscart.com with an email OTP and pays themselves. Agents cannot place orders.',
  contact: { email: 'info@snkrscart.com', phone: '+91-94109-03791' },
  pages: {
    shipping: `${SITE_URL}/shipping`,
    returns: `${SITE_URL}/returns`,
    terms: `${SITE_URL}/terms`,
    faqs: `${SITE_URL}/faqs`,
  },
} as const;
