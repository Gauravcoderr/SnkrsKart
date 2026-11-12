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

Upload: download the CSV or JSONL and upload it in Business Hub (launch-week press says the Hub takes CSV or JSONL; OpenAI's help article could not be read by us, so confirm the accepted format on the upload screen). Refresh at least daily; the files regenerate on every request with a 1 hour cache.

What OpenAI's developer spec says about delivery (read 2026-11-11, https://developers.openai.com/commerce/specs/file-upload/overview): feeds are pushed over SFTP as a full daily snapshot, preferred formats parquet, then jsonl.gz, csv.gz or tsv.gz, UTF-8, same file name overwritten each run; a product missing from a snapshot is kept for up to 14 days. No public-URL fetch is documented. That SFTP route is "currently available to approved partners" who apply at https://chatgpt.com/merchants. If OpenAI asks for a gzip file, run `curl -s https://www.snkrscart.com/openai-product-feed.jsonl | gzip > snkrscart-products.jsonl.gz`.

Deploy status: the feed routes were committed as 86b067f on branch `content/blogs-2026-11-11` (another session had checked that branch out). Production is deployed from `main`, which does not have them yet, so the URLs above return 404 until that branch is merged into `main`. The branch's Vercel preview deployment has the routes but sits behind Vercel Authentication, so only a signed-in Vercel team member can open it; it is not a URL to hand to OpenAI. Verified on 2026-11-11 by running the app locally against the production API: both files return 200 with 407 rows, the same count as the Google feed.

Spec compliance of each row (checked with `cd frontend && NEXT_PUBLIC_API_URL=https://api.snkrscart.com/api/v1 npx --yes tsx --tsconfig tsconfig.json scripts/check-openai-feed.ts` against the live catalogue; exits 1 and names the rows on any violation):

| Spec rule | How the feed meets it |
|---|---|
| 9 required fields (item_id, title, description, url, brand, seller_name, image_url, availability, price) | always present; the check fails on any empty one |
| availability enum | in_stock, out_of_stock, backorder (Pre-order sizes), pre_order (coming soon) |
| price "amount CURRENCY" | `12999.00 INR`; shipping_price `0.00 INR` (zero means free) |
| title up to 150, description up to 5000 chars | enforced by the shared feed text helpers |
| variants: group_id differs from item_id, listing_has_variations true, variant_dict of strings | per-size rows carry all three; un-sized products carry none |
| CSV booleans lowercase true/false, arrays comma-joined with commas in URLs as %2C, objects as JSON | done in the CSV writer |
| no placeholder values (null, unknown, n/a) | fields are omitted instead of filled |
| mpn only with brand, never invented | real style codes only (`validMpn`) |
| checkout flags | is_eligible_search true, is_eligible_checkout false (no checkout integration) |

## 4. Open questions for OpenAI

1. Is India an eligible market for Business Hub claims, and is INR accepted in product feeds? The spec says the standard upload targets the US and that other countries and currencies need OpenAI confirmation.
2. Does the Hub accept uncompressed CSV or JSONL uploads, or only the SFTP push with parquet or gzip files described in the commerce spec?
   The developer spec names only SFTP push for approved partners (apply at chatgpt.com/merchants); the Hub's own upload format is undocumented outside press coverage.
3. When do Business Agents open outside the US? (Not needed yet.)

## 5. What claiming does and does not do

OpenAI says claiming does not guarantee higher placement or more sales. The win is control over the facts ChatGPT shows (name, policies, feed with live prices and stock) and the mentions and clicks dashboard. Instant Checkout was retired in March 2026, so discovery and a correct profile are the whole ChatGPT play for now. Sponsored Business Agents and ChatGPT Ads are paid and separate.

## 6. Sources

- PPC Land, Business Hub launch: https://ppc.land/businesses-gain-chatgpt-click-and-mention-counts-in-openais-business-hub/
- Business Today (India): https://www.businesstoday.in/technology/news/story/chatgpt-could-soon-let-you-talk-directly-to-businesses-openai-introduces-new-ai-agents-566851-2026-11-11
- Shiprocket AiTLAS guide: https://aitlas.shiprocket.in/blog/chatgpt-business-hub/
- OpenAI commerce feed spec: https://developers.openai.com/commerce/specs/feed
- OpenAI announcement (blocks automated fetches): https://openai.com/index/introducing-businesses-chatgpt/
