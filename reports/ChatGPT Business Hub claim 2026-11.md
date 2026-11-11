# ChatGPT Business Hub claim pack (November 2026)

Prepared 2026-11-11 for the owner to claim SNKRS CART in OpenAI's "Businesses in ChatGPT" beta (launched 2026-11-10). The claim needs the owner's ChatGPT login, a code sent to the business phone or email (or a DNS record), and a government ID check, so it cannot be scripted. Everything else is ready below.

## 1. Where and how

1. Sign in at https://chatgpt.com/business-hub with the account that should own the listing (use the info@snkrscart.com Google login so it is not tied to a personal account).
2. Search for SNKRS CART and claim it. If the profile does not exist yet, create it with the details in section 2.
3. Verify. Options reported at launch: a code by text or automated call to the business phone, a code to the business email, or a DNS TXT record on snkrscart.com (Hostinger DNS). DNS is the cleanest: add the TXT record OpenAI shows, wait for propagation, then verify.
4. Identity check through Persona with the proprietor's government ID (Ashutosh Lingwal, Proprietor).
5. If OpenAI puts the claim on a waitlist (reported for non-US claims on launch day), it continues by email. Nothing more to do until then.
6. After verification, fill the profile (section 2) and upload the product feed (section 3).

## 2. Profile fields (paste as is)

- Business name: SNKRS CART
- Website: https://www.snkrscart.com
- Category: Shoe store / Sneaker store (online)
- Country: India. Ships within India only. Prices in INR.
- Email: info@snkrscart.com
- Phone: +91 94109 03791
- Instagram: the store's Instagram only (no Facebook or X; those links are not live)
- Logo: https://www.snkrscart.com/logo-104.png (or the full-size logo from the brand folder)

Description:

> SNKRS CART is an Indian online sneaker store selling new, authentic pairs from Nike, Jordan, Adidas, New Balance and Crocs, with shoe sizes in UK sizing. Every pair is checked for authenticity before dispatch, and pairs from partner sellers are photo-verified by SNKRS CART before they ship. Shipping is free on every order across India: in-stock pairs dispatch within 3 business days and Pre-order sizes in about 20 days, with delivery 3 to 7 business days after dispatch. Payment is online at checkout (UPI, cards, net banking); there is no cash on delivery. Returns are accepted only for damaged, wrong or authenticity issues reported within 48 hours of delivery.

Delivery policy: Free shipping across India on every order. Dispatch within 3 business days for in-stock sizes; Pre-order sizes about 20 days. Delivery 3 to 7 business days after dispatch. Orders can be cancelled free before dispatch. Policy page: https://www.snkrscart.com/shipping

Return policy: Returns only for damaged, wrong or authenticity issues, reported within 48 hours of delivery; refund within 7 days once approved. Policy page: https://www.snkrscart.com/returns

Grievance officer (Consumer Protection E-Commerce Rules 2020): Ashutosh Lingwal, Proprietor, info@snkrscart.com, +91 94109 03791. Acknowledged within 48 hours, resolved within one month.

Keep every policy sentence identical to the shipping, returns, terms and FAQ pages and to Merchant Center. A reviewer who finds a different promise on any surface reads it as misrepresentation.

## 3. Product feed

Both files are built from the same per-size data as the Google Merchant feed and the product page JSON-LD, so ids, prices and stock states match everywhere.

- JSONL: https://www.snkrscart.com/openai-product-feed.jsonl
- CSV: https://www.snkrscart.com/openai-product-feed.csv

What is in each row: `item_id` (same as the Google `g:id`), `title`, plain-text `description`, product `url` with the size preselected, `brand`, `seller_name` SNKRS CART, `image_url` plus up to 10 extra images, `availability` (in_stock, backorder for Pre-order sizes, pre_order for coming-soon products, out_of_stock), `price` as `12999.00 INR`, `shipping_price` `0.00 INR`, `condition` new, `product_category` Apparel & Accessories > Shoes, `gender`, `age_group`, `color`, `size` and `size_system` UK, `mpn` only when the SKU is a real style code, `group_id` plus `variant_dict` for sized products, `return_policy` URL, `is_eligible_search` true, `is_eligible_checkout` false.

Not sent, on purpose: `accepts_returns` (OpenAI has no defective-only option, so the field stays unspecified and the policy URL carries the rule), `sale_price` (we never charge a reference price), `target_countries` and `store_country` (OpenAI says the standard upload targets the US; India must be enabled by OpenAI first).

Upload: download the CSV or JSONL and upload it in Business Hub, or give OpenAI the URL if the Hub accepts a scheduled fetch. Refresh at least daily; the files regenerate on every request with a 1 hour cache.

## 4. Open questions for OpenAI

1. Is India an eligible market for Business Hub claims, and is INR accepted in product feeds? The spec says the standard upload targets the US and that other countries and currencies need OpenAI confirmation.
2. Does the Hub accept uncompressed CSV or JSONL uploads, or only the SFTP push with parquet or gzip files described in the commerce spec?
3. When do Business Agents open outside the US? (Not needed yet.)

## 5. What claiming does and does not do

OpenAI says claiming does not guarantee higher placement or more sales. The win is control over the facts ChatGPT shows (name, policies, feed with live prices and stock) and the mentions and clicks dashboard. Instant Checkout was retired in March 2026, so discovery and a correct profile are the whole ChatGPT play for now. Sponsored Business Agents and ChatGPT Ads are paid and separate.

## 6. Sources

- PPC Land, Business Hub launch: https://ppc.land/businesses-gain-chatgpt-click-and-mention-counts-in-openais-business-hub/
- Business Today (India): https://www.businesstoday.in/technology/news/story/chatgpt-could-soon-let-you-talk-directly-to-businesses-openai-introduces-new-ai-agents-566851-2026-11-11
- Shiprocket AiTLAS guide: https://aitlas.shiprocket.in/blog/chatgpt-business-hub/
- OpenAI commerce feed spec: https://developers.openai.com/commerce/specs/feed
- OpenAI announcement (blocks automated fetches): https://openai.com/index/introducing-businesses-chatgpt/
