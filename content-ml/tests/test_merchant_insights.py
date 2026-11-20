import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

import merchant_insights as mi


def price_row(title, price, benchmark, brand="Nike"):
    return {
        "priceCompetitivenessProductView": {
            "offerId": title.lower().replace(" ", "-"),
            "title": title,
            "brand": brand,
            "price": {"amountMicros": str(price * 1_000_000), "currencyCode": "INR"},
            "benchmarkPrice": {
                "amountMicros": str(benchmark * 1_000_000),
                "currencyCode": "INR",
            },
        }
    }


def performance_row(offer_id, day, clicks, impressions):
    return {
        "productPerformanceView": {
            "offerId": offer_id,
            "date": {"year": 2026, "month": 11, "day": day},
            "clicks": str(clicks),
            "impressions": str(impressions),
        }
    }


def cluster(rank, brand, inventory, title="Some Shoe"):
    return {
        "rank": str(rank),
        "brand": brand,
        "title": title,
        "inventoryStatus": inventory,
        "relativeDemand": "HIGH",
        "relativeDemandChange": "FLAT",
    }


def merchant(accepted_status, account_issues=(), accepted=None):
    total = sum(accepted_status.values()) if accepted is None else accepted
    return {
        "accepted_status": accepted_status,
        "account_issues_pulled": True,
        "account_issues": list(account_issues),
        "products_accepted_by_google": total,
        "feed_items_sent": 419,
        "latest_upload": None,
        "review_requested": None,
        "product_performance_90d": mi.product_performance_summary(
            [performance_row("a-uk-8", 1, 11, 352)]
        ),
        "price_competitiveness": mi.price_competitiveness(
            [
                price_row("Shoe One - UK 8", 11000, 10000),
                price_row("Shoe Two - UK 8", 10000, 10000),
            ]
        ),
        "sourcing_list": [],
    }


PRICE_ROWS = [
    price_row("Shoe One - UK 8", 11000, 10000),
    price_row("Shoe One - UK 9", 12000, 10000),
    price_row("Shoe Two - UK 7", 10500, 10000),
    price_row("Shoe Three - M", 9000, 10000),
    price_row("Shoe Four - UK 6", 9500, 10000),
    price_row("No Benchmark - UK 6", 9500, 0),
]


class ProductLabelTest(unittest.TestCase):
    def test_size_suffix_is_removed(self):
        self.assertEqual(
            mi.product_label("Air Jordan 1 Low Game Royal - Royal Blue - UK 9"),
            "Air Jordan 1 Low Game Royal - Royal Blue",
        )
        self.assertEqual(
            mi.product_label("Puma Regular Jacket - Off White - L"),
            "Puma Regular Jacket - Off White",
        )
        self.assertEqual(
            mi.product_label("Nike Quest 6 - Orange - UK 5.5"), "Nike Quest 6 - Orange"
        )

    def test_colour_suffix_is_kept(self):
        self.assertEqual(
            mi.product_label("Nike Dunk Low - Panda"), "Nike Dunk Low - Panda"
        )
        self.assertEqual(mi.product_label("Plain Title"), "Plain Title")


class ProductPerformanceTest(unittest.TestCase):
    def test_sums_clicks_and_impressions_across_rows(self):
        rows = [
            performance_row("a-uk-8", 3, 3, 22),
            performance_row("b-uk-9", 1, 0, 32),
            performance_row("a-uk-8", 7, 1, 10),
        ]
        self.assertEqual(
            mi.product_performance_summary(rows, "2026-11-20"),
            {
                "available": True,
                "pulled": "2026-11-20",
                "clicks": 4,
                "impressions": 64,
                "offers_shown": 2,
                "first_day": "2026-11-01",
                "last_day": "2026-11-07",
            },
        )

    def test_empty_pull_means_zero_not_missing(self):
        summary = mi.product_performance_summary([])
        self.assertTrue(summary["available"])
        self.assertEqual(
            (summary["clicks"], summary["impressions"], summary["first_day"]),
            (0, 0, None),
        )

    def test_missing_file_is_reported_as_not_available(self):
        summary = mi.product_performance_summary(None)
        self.assertFalse(summary["available"])
        self.assertIn("missing or has no rows key", summary["reason"])
        self.assertNotIn("clicks", summary)


class PriceCompetitivenessTest(unittest.TestCase):
    def test_counts_use_a_five_percent_band_with_the_edge_inside(self):
        report = mi.price_competitiveness(PRICE_ROWS)
        self.assertEqual(report["benchmarked_items"], 5)
        self.assertEqual(report["above_benchmark"], 2)
        self.assertEqual(report["below_benchmark"], 1)
        self.assertEqual(report["within_band"], 2)
        self.assertEqual(report["median_gap_pct"], 5.0)

    def test_products_above_groups_sizes_and_lists_only_products_over_the_band(self):
        products = mi.price_competitiveness(PRICE_ROWS)["products_above"]
        self.assertEqual(
            products,
            [
                {
                    "product": "Shoe One",
                    "brand": "Nike",
                    "sizes_benchmarked": 2,
                    "our_price_min": 11000,
                    "our_price_max": 12000,
                    "benchmark_median": 10000,
                    "median_gap_pct": 15.0,
                }
            ],
        )

    def test_products_above_is_sorted_by_gap_and_capped(self):
        rows = [
            price_row(f"Shoe {n} - UK 8", 10000 + 100 * n, 10000) for n in range(6, 40)
        ]
        products = mi.price_competitiveness(rows)["products_above"]
        self.assertEqual(len(products), mi.PRODUCTS_ABOVE_LIMIT)
        self.assertEqual(products[0]["product"], "Shoe 39")
        self.assertEqual(products[0]["median_gap_pct"], 39.0)

    def test_no_benchmarks_and_missing_file(self):
        empty = mi.price_competitiveness([])
        self.assertEqual(
            (
                empty["available"],
                empty["benchmarked_items"],
                empty["median_gap_pct"],
                empty["products_above"],
            ),
            (True, 0, None, []),
        )
        self.assertFalse(mi.price_competitiveness(None)["available"])


class SourcingListTest(unittest.TestCase):
    def test_keeps_carried_brands_not_in_stock_in_rank_order(self):
        clusters = [
            cluster(3, "Nike", "NOT_IN_INVENTORY"),
            cluster(1, "Red Tape", "NOT_IN_INVENTORY"),
            cluster(2, "adidas", "IN_STOCK"),
            cluster(5, "PUMA", "OUT_OF_STOCK"),
        ]
        rows = mi.sourcing_list(clusters, {"nike", "adidas", "Puma"})
        self.assertEqual(
            [(row["rank"], row["brand"], row["inventory"]) for row in rows],
            [(3, "Nike", "NOT_IN_INVENTORY"), (5, "PUMA", "OUT_OF_STOCK")],
        )

    def test_list_is_capped(self):
        clusters = [
            cluster(rank, "Nike", "NOT_IN_INVENTORY") for rank in range(45, 0, -1)
        ]
        rows = mi.sourcing_list(clusters, {"nike"})
        self.assertEqual(len(rows), mi.SOURCING_LIMIT)
        self.assertEqual(rows[0]["rank"], 1)


class ListingsActionTest(unittest.TestCase):
    def test_live_account_gets_the_price_and_stock_action(self):
        live = merchant(
            {"ELIGIBLE": 414, "NOT_ELIGIBLE_OR_DISAPPROVED": 4, "ELIGIBLE_LIMITED": 1}
        )
        self.assertEqual(mi.account_state(live), "live")
        action = mi.listings_action(live)
        self.assertEqual(action["rank"], 1)
        self.assertNotIn("suspension", action["action"].lower())
        self.assertNotIn("restriction", action["action"].lower())
        self.assertIn("415 of 419 items are eligible", action["why"])
        self.assertIn("11 clicks on 352 impressions", action["why"])
        self.assertIn("1 of 2 benchmarked items", action["why"])

    def test_critical_account_issue_keeps_the_clear_restriction_action(self):
        suspended = merchant(
            {"ELIGIBLE": 414}, [{"title": "Misrepresentation", "severity": "CRITICAL"}]
        )
        self.assertEqual(mi.account_state(suspended), "restricted")
        action = mi.listings_action(suspended)
        self.assertIn("Clear the Merchant Center account restriction", action["action"])
        self.assertIn("Misrepresentation", action["why"])

    def test_no_eligible_items_is_restricted(self):
        self.assertEqual(
            mi.account_state(merchant({"NOT_ELIGIBLE_OR_DISAPPROVED": 8})), "restricted"
        )

    def test_no_product_rows_is_unknown_not_suspended(self):
        unknown = merchant({})
        self.assertEqual(mi.account_state(unknown), "unknown")
        self.assertIn(
            "Pull Merchant Center data", mi.listings_action(unknown)["action"]
        )

    def test_minor_account_issue_stays_live_and_is_mentioned(self):
        live = merchant(
            {"ELIGIBLE": 10},
            [{"title": "Phone not verified", "severity": "SUGGESTION"}],
        )
        self.assertEqual(mi.account_state(live), "live")
        self.assertIn("Phone not verified", mi.listings_action(live)["why"])


class RenderReportTest(unittest.TestCase):
    def test_report_lists_overpriced_products_and_sourcing_rows(self):
        data = merchant({"ELIGIBLE": 2})
        data["sourcing_list"] = mi.sourcing_list(
            [cluster(7, "Nike", "NOT_IN_INVENTORY", "Nike Air Force 1 07")], {"nike"}
        )
        text = mi.render_report({"generated": "2026-11-21", "merchant": data})
        self.assertIn("| Shoe One | Nike | 1 | 11000 | 10000 | 10.0 |", text)
        self.assertIn(
            "| 7 | Nike Air Force 1 07 | Nike | HIGH | FLAT | NOT_IN_INVENTORY |", text
        )

    def test_price_range_shows_both_ends_only_when_they_differ(self):
        self.assertEqual(mi.price_range({"our_price_min": 11000, "our_price_max": 12000}), "11000 to 12000")
        self.assertEqual(mi.price_range({"our_price_min": 11000, "our_price_max": 11000}), "11000")

    def test_report_says_when_there_is_no_sourcing_data(self):
        text = mi.render_report(
            {"generated": "2026-11-21", "merchant": merchant({"ELIGIBLE": 2})}
        )
        self.assertIn("No best seller from brands we carry is missing from our stock in this pull.", text)


class MissingDataTest(unittest.TestCase):
    def test_pull_date_is_carried_into_the_summary_and_the_sentence(self):
        summary = mi.product_performance_summary([performance_row("a-uk-8", 1, 2, 30)], "2026-11-20")
        self.assertEqual(summary["pulled"], "2026-11-20")
        self.assertIn("Data pulled 2026-11-20.", mi.performance_sentence(summary))
        undated = mi.product_performance_summary([performance_row("a-uk-8", 1, 2, 30)])
        self.assertIn("Pull date not recorded.", mi.performance_sentence(undated))
        prices = mi.price_competitiveness([price_row("Shoe One - UK 8", 11000, 10000)], "2026-11-19")
        self.assertIn("Data pulled 2026-11-19.", mi.price_sentence(prices))

    def test_missing_account_issue_list_is_unknown_not_live(self):
        data = merchant({"ELIGIBLE": 414})
        data["account_issues_pulled"] = False
        self.assertEqual(mi.account_state(data), "unknown")

    def test_report_tells_never_pulled_from_nothing_to_source(self):
        data = merchant({"ELIGIBLE": 2})
        data["sourcing_list"] = None
        never_pulled = mi.render_report({"generated": "2026-11-21", "merchant": data})
        self.assertIn("Best-seller data has not been pulled", never_pulled)
        data["sourcing_list"] = []
        nothing_missing = mi.render_report({"generated": "2026-11-21", "merchant": data})
        self.assertIn("No best seller from brands we carry is missing from our stock in this pull.", nothing_missing)
        self.assertNotIn("has not been pulled", nothing_missing)


if __name__ == "__main__":
    unittest.main()
