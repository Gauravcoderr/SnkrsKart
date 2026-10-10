---
description: "Instagram posts for SNKRS CART products in stock. Builds a carousel (launch card, angle shots, price and sizes, shop link) from live stock, writes the caption in the brand voice and saves a draft for approval in /admin/instagram. Trigger on: /ig-products, 'post our new arrivals', 'instagram post for this product', 'post new stock'. Pass product slugs, or nothing for new arrivals."
---

# /ig-products: Instagram drafts for products in stock

Nothing is posted from here. The draft lands in `/admin/instagram`; a human approves it. Approval is refused later if a pair has sold out meanwhile.

## Step 1: pick the products

- Slugs given (`/ig-products air-jordan-1-high-og-royal-black-game-royal-white`): one slug makes a single-pair carousel; several make a roundup (max 6).
- Nothing given: new arrivals, pairs added in the last 7 days that are in stock and were never posted.

```bash
cd /Users/gauravrauthan/snkrs-cart/backend
npx ts-node --transpile-only src/scripts/igDraft.ts starter product <slug> [<slug>...] --out ../.claude/instagram/specs/$(date +%F)-products.json 2>/dev/null
# or
npx ts-node --transpile-only src/scripts/igDraft.ts starter new-arrivals --days 7 --out ../.claude/instagram/specs/$(date +%F)-new-arrivals.json 2>/dev/null
```

Prices, UK sizes and ship times on the slides come from live stock (store sizes plus seller listings, the same offers the product page shows). Never type them by hand.

## Step 2: caption

Follow `.claude/skills/ig-caption/SKILL.md` in the voice of `.claude/instagram/voice.md`:

- First line under 125 characters with the pair and the ₹ price ("Air Jordan 1 High OG Royal, from ₹18,995, UK 7 to 10.").
- One ask (save, share, or link in bio), 3 to 5 specific hashtags, no em dashes.
- Never name other stores, never invent stock counts ("only 2 left") or reviews, never imply we are an official brand retailer.

```bash
cd /Users/gauravrauthan/snkrs-cart
python3 -I .claude/skills/ig-caption/caption.py /tmp/ig-cap.txt --keywords "<model name>"
python3 -I .claude/skills/ig-human/humanize.py /tmp/ig-cap.txt -o /tmp/ig-cap.txt --report
```

Put the result in the spec's `caption`.

## Step 3: preview and create

```bash
cd /Users/gauravrauthan/snkrs-cart/backend
npx ts-node --transpile-only src/scripts/igDraft.ts render ../.claude/instagram/specs/<file>.json /tmp/ig-products
npx ts-node --transpile-only src/scripts/igDraft.ts create ../.claude/instagram/specs/<file>.json 2>/dev/null
```

Look at every slide before `create`. A watermark warning means a product photo was taken from another site and carries its mark: drop that image from the spec's slides (or the product), never pass `--allow-watermark` for a photo we do not own. Prefer our own photos where the product has them.

Confirm `✅ Instagram draft` and give the admin link: https://www.snkrscart.com/admin/instagram

## Unattended

`scripts/auto-content.sh` runs `igDraft.ts auto-products --days 3` after every scheduled content run: new stock becomes a draft with a facts-only caption, watermarked photos are dropped automatically.
