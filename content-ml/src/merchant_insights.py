import json
import re
import statistics
import sys
from pathlib import Path

REPORT = (
    Path(__file__).resolve().parent.parent / "data" / "growth" / "growth_report.json"
)
PRICE_BAND_PCT = 5.0
SOURCING_LIMIT = 40
PRODUCTS_ABOVE_LIMIT = 25
ELIGIBLE_STATUSES = ("ELIGIBLE", "ELIGIBLE_LIMITED")
SIZE_SUFFIX = re.compile(r"^(UK \d+(\.5)?|\d+(\.5)?|XXS|XS|S|M|L|XL|XXL|XXXL)$")
SHOE_WORDS = {
    "sneaker",
    "sneakers",
    "shoe",
    "shoes",
    "running",
    "jordan",
    "dunk",
    "samba",
    "air",
    "force",
    "new balance",
    "nike",
    "adidas",
    "puma",
    "asics",
    "crocs",
}


def rupees(money):
    return int(money["amountMicros"]) / 1_000_000


def iso_day(date):
    return f"{date['year']}-{date['month']:02d}-{date['day']:02d}"


def product_label(title):
    if " - " not in title:
        return title
    name, last = title.rsplit(" - ", 1)
    if SIZE_SUFFIX.match(last.strip()):
        return name
    return title


def product_performance_summary(rows, pulled=None):
    if rows is None:
        return {
            "available": False,
            "reason": "merchant_product_performance_90.json is missing or has no rows key",
        }
    views = [row["productPerformanceView"] for row in rows]
    days = sorted(iso_day(view["date"]) for view in views)
    return {
        "available": True,
        "pulled": pulled,
        "clicks": sum(int(view.get("clicks", 0)) for view in views),
        "impressions": sum(int(view.get("impressions", 0)) for view in views),
        "offers_shown": len({view.get("offerId") for view in views}),
        "first_day": days[0] if days else None,
        "last_day": days[-1] if days else None,
    }


def benchmarked_items(rows):
    items = []
    for row in rows:
        view = row["priceCompetitivenessProductView"]
        price = rupees(view["price"])
        benchmark = rupees(view["benchmarkPrice"])
        if benchmark <= 0:
            continue
        items.append(
            {
                "offer_id": view.get("offerId", ""),
                "title": view.get("title", ""),
                "brand": view.get("brand", ""),
                "price": round(price),
                "benchmark": round(benchmark),
                "gap_pct": round(100 * (price - benchmark) / benchmark, 1),
            }
        )
    return items


def products_above_benchmark(items):
    by_product = {}
    for item in items:
        by_product.setdefault(product_label(item["title"]), []).append(item)
    products = []
    for name, sizes in by_product.items():
        median_gap = round(statistics.median(size["gap_pct"] for size in sizes), 1)
        if median_gap <= PRICE_BAND_PCT:
            continue
        products.append(
            {
                "product": name,
                "brand": sizes[0]["brand"],
                "sizes_benchmarked": len(sizes),
                "our_price_min": min(size["price"] for size in sizes),
                "our_price_max": max(size["price"] for size in sizes),
                "benchmark_median": round(
                    statistics.median(size["benchmark"] for size in sizes)
                ),
                "median_gap_pct": median_gap,
            }
        )
    products.sort(key=lambda product: -product["median_gap_pct"])
    return products[:PRODUCTS_ABOVE_LIMIT]


def price_competitiveness(rows, pulled=None):
    if rows is None:
        return {
            "available": False,
            "reason": "merchant_price_competitiveness.json is missing or has no rows key",
        }
    items = benchmarked_items(rows)
    above = [item for item in items if item["gap_pct"] > PRICE_BAND_PCT]
    below = [item for item in items if item["gap_pct"] < -PRICE_BAND_PCT]
    median_gap = (
        round(statistics.median(item["gap_pct"] for item in items), 1)
        if items
        else None
    )
    return {
        "available": True,
        "pulled": pulled,
        "band_pct": PRICE_BAND_PCT,
        "benchmarked_items": len(items),
        "above_benchmark": len(above),
        "below_benchmark": len(below),
        "within_band": len(items) - len(above) - len(below),
        "median_gap_pct": median_gap,
        "products_above": products_above_benchmark(items),
    }


def sourcing_list(clusters, our_brands):
    carried = {brand.lower() for brand in our_brands}
    wanted = []
    for cluster in sorted(clusters, key=lambda cluster: int(cluster["rank"])):
        if cluster.get("brand", "").lower() not in carried:
            continue
        if cluster.get("inventoryStatus") == "IN_STOCK":
            continue
        wanted.append(
            {
                "rank": int(cluster["rank"]),
                "title": cluster.get("title", ""),
                "brand": cluster.get("brand", ""),
                "demand": cluster.get("relativeDemand"),
                "change": cluster.get("relativeDemandChange"),
                "inventory": cluster.get("inventoryStatus"),
            }
        )
    return wanted[:SOURCING_LIMIT]


def eligible_items(merchant):
    return sum(
        count
        for status, count in merchant["accepted_status"].items()
        if status in ELIGIBLE_STATUSES
    )


def account_state(merchant):
    has_critical_issue = any(
        issue.get("severity") == "CRITICAL" for issue in merchant["account_issues"]
    )
    if has_critical_issue:
        return "restricted"
    if not merchant.get("account_issues_pulled", True):
        return "unknown"
    if merchant["products_accepted_by_google"] == 0:
        return "unknown"
    if eligible_items(merchant) == 0:
        return "restricted"
    return "live"


def pulled_note(section):
    if section.get("pulled"):
        return f" Data pulled {section['pulled']}."
    return " Pull date not recorded."


def performance_sentence(performance):
    if not performance["available"]:
        return (
            "Free listing performance is not available: " + performance["reason"] + "."
        )
    return (
        f"Free listings brought {performance['clicks']} clicks on {performance['impressions']} impressions "
        f"in the last 90 days ({performance['offers_shown']} offers shown)."
        + pulled_note(performance)
    )


def price_sentence(prices):
    if not prices["available"]:
        return "Price benchmarks are not available: " + prices["reason"] + "."
    if prices["benchmarked_items"] == 0:
        return "Google has no price benchmark for any item yet." + pulled_note(prices)
    return (
        f"{prices['above_benchmark']} of {prices['benchmarked_items']} benchmarked items are priced more than "
        f"{prices['band_pct']:g} percent above Google's India benchmark (median gap {prices['median_gap_pct']:g} percent)."
        + pulled_note(prices)
    )


def restricted_action(merchant):
    return {
        "rank": 1,
        "action": "Clear the Merchant Center account restriction so products can show",
        "why": f"{eligible_items(merchant)} of {merchant['products_accepted_by_google']} items in the account are eligible; "
        f"feed sent {merchant['feed_items_sent']} items, latest upload {merchant['latest_upload']}, status {merchant['accepted_status']}. "
        f"Account issues: {[issue.get('title') for issue in merchant['account_issues']]}. "
        f"{performance_sentence(merchant['product_performance_90d'])} Review requested {merchant['review_requested']}.",
        "how": "Finish Google's root-cause list: business info and verified phone/address in Merchant Center, Google Business Profile linked, policy text identical on site and in MC, visible reviews, no placeholder images; after approval ask support to lift the item limit (new accounts start capped). Re-fetch the feed and confirm itemsTotal equals processed.",
        "expected": "Free listings become possible for the in-stock sizes in the feed; no click estimate until the account is cleared.",
        "effort": "M",
        "confidence": "high",
        "metric": "merchant.accepted_status eligible share; merchant.product_performance_90d clicks",
    }


def unknown_action():
    return {
        "rank": 1,
        "action": "Pull Merchant Center data before judging free listings",
        "why": "The Merchant product view or the account issues list is missing from data/growth, so the account state is not known.",
        "how": "Run commands/growth.sh without --no-pull; the Merchant pull needs secrets/merchant_token.json and secrets/merchant_oauth_client.json.",
        "expected": "The next report states whether listings are live and how they perform.",
        "effort": "S",
        "confidence": "high",
        "metric": "merchant.products_accepted_by_google > 0",
    }


def live_action(merchant):
    other_issues = [issue.get("title") for issue in merchant["account_issues"]]
    issue_note = f" Open account issues: {other_issues}." if other_issues else ""
    return {
        "rank": 1,
        "action": "Make free listings earn clicks: fix prices above Google's benchmark and stock what India searches",
        "why": f"{eligible_items(merchant)} of {merchant['products_accepted_by_google']} items are eligible. "
        f"{performance_sentence(merchant['product_performance_90d'])} {price_sentence(merchant['price_competitiveness'])}{issue_note}",
        "how": "Go through merchant.price_competitiveness.products_above with the sellers and bring the listed pairs to the benchmark or explain the premium; "
        "pass merchant.sourcing_list to sellers as the pairs to list next; print both with commands/sourcing.sh.",
        "expected": "More free listing impressions and clicks on pairs priced at or under the benchmark. Google publishes no figure for the benchmark effect, so judge it on the next pull.",
        "effort": "M",
        "confidence": "medium",
        "metric": "merchant.product_performance_90d clicks; merchant.price_competitiveness above_benchmark",
    }


def listings_action(merchant):
    state = account_state(merchant)
    if state == "restricted":
        return restricted_action(merchant)
    if state == "unknown":
        return unknown_action()
    return live_action(merchant)


def price_range(product):
    if product["our_price_min"] == product["our_price_max"]:
        return str(product["our_price_min"])
    return f"{product['our_price_min']} to {product['our_price_max']}"


def table(headers, rows):
    lines = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    for row in rows:
        lines.append("| " + " | ".join(str(cell) for cell in row) + " |")
    return "\n".join(lines)


def render_report(report):
    merchant = report["merchant"]
    prices = merchant["price_competitiveness"]
    parts = [
        f"# Sourcing and price report ({report['generated']})",
        "",
        "## Free listings",
        "",
        performance_sentence(merchant["product_performance_90d"]),
        "",
        "## Priced above Google's India benchmark",
        "",
        price_sentence(prices),
        "",
    ]
    if prices["available"] and prices["products_above"]:
        parts.append(
            table(
                [
                    "Product",
                    "Brand",
                    "Sizes",
                    "Our price (Rs)",
                    "Benchmark (Rs)",
                    "Gap %",
                ],
                [
                    [
                        product["product"],
                        product["brand"],
                        product["sizes_benchmarked"],
                        price_range(product),
                        product["benchmark_median"],
                        product["median_gap_pct"],
                    ]
                    for product in prices["products_above"]
                ],
            )
        )
        parts.append("")
    parts += ["## Sourcing list: in demand on Google India, not in our stock", ""]
    if merchant["sourcing_list"] is None:
        parts.append(
            "Best-seller data has not been pulled (merchant_best_sellers_products.json is missing)."
        )
    elif merchant["sourcing_list"]:
        parts.append(
            table(
                ["India rank", "Product", "Brand", "Demand", "Trend", "Our stock"],
                [
                    [
                        row["rank"],
                        row["title"],
                        row["brand"],
                        row["demand"],
                        row["change"],
                        row["inventory"],
                    ]
                    for row in merchant["sourcing_list"]
                ],
            )
        )
    else:
        parts.append("No best seller from brands we carry is missing from our stock in this pull.")
    return "\n".join(parts) + "\n"


def main():
    if not REPORT.is_file():
        print("No growth report yet. Run: commands/growth.sh")
        return 1
    print(render_report(json.loads(REPORT.read_text(encoding="utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
