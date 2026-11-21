import datetime as dt
import json
import math
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

import growth
import trending


def model(slug, title, brand):
    return {
        "slug": slug,
        "title": title,
        "brand": growth.brand_of(brand),
        "tokens": trending.model_tokens(title, brand),
    }


MODELS = [
    model("af1", "Nike Air Force 1", "Nike"),
    model("aj1", "Air Jordan 1", "Jordan"),
    model("aj1-low", "Air Jordan 1 Low", "Jordan"),
    model("samba", "Adidas Samba", "Adidas"),
    model("nb550", "New Balance 550", "New Balance"),
    model("kobe", "Nike Kobe 3 Low Protro", "Nike"),
]


def merchant_row(rank, title, brand="Nike", change="FLAT", inventory="NOT_IN_INVENTORY"):
    return {
        "bestSellersProductClusterView": {
            "rank": str(rank),
            "title": title,
            "brand": brand,
            "relativeDemandChange": change,
            "inventoryStatus": inventory,
            "reportDate": {"year": 2026, "month": 11, "day": 9},
        }
    }


def who(key, brand="nike"):
    return {"key": key, "slug": key, "title": key, "brand": brand}


class AssignTest(unittest.TestCase):
    def test_longer_model_wins(self):
        self.assertEqual(trending.assign(MODELS, "Men's Air Jordan 1 Low OG")["slug"], "aj1-low")
        self.assertEqual(trending.assign(MODELS, "air jordan 1 chicago")["slug"], "aj1")

    def test_brand_and_gender_words_are_ignored(self):
        self.assertEqual(trending.assign(MODELS, "Nike Men's Air Force 1 07")["slug"], "af1")
        self.assertEqual(trending.assign(MODELS, "women air force 1 price")["slug"], "af1")
        self.assertEqual(trending.assign(MODELS, "adidas samba og")["slug"], "samba")

    def test_whole_tokens_only(self):
        self.assertIsNone(trending.assign(MODELS, "air force 10"))
        self.assertIsNone(trending.assign(MODELS, "sambas"))

    def test_kids_rows_are_excluded(self):
        self.assertIsNone(trending.assign(MODELS, "Nike Air Force 1 Kids"))
        self.assertIsNone(trending.assign(MODELS, "air jordan 1 low gs"))

    def test_other_brand_does_not_match(self):
        self.assertIsNone(trending.assign(MODELS, "Campus Samba Style", brand="campus"))
        self.assertEqual(trending.assign(MODELS, "Men's Air Jordan 1 Low", brand="nike")["slug"], "aj1-low")
        rows = [merchant_row(2, "Men Campus Oxyfit Walking Shoes", brand="Campus")]
        self.assertIsNone(trending.merchant_family([model("campus", "Adidas Campus", "Adidas")], rows)[0]["who"]["slug"])

    def test_bare_number_needs_a_brand(self):
        self.assertIsNone(trending.assign(MODELS, "550 shoes"))
        self.assertEqual(trending.assign(MODELS, "new balance 550 white")["slug"], "nb550")


class MerchantTest(unittest.TestCase):
    def test_best_row_per_model_riser_and_unmatched_title(self):
        rows = [
            merchant_row(5, "Nike Men's Air Force 1 07", change="FLAT"),
            merchant_row(3, "Nike Air Force 1 Shadow", change="RISER", inventory="IN_STOCK"),
            merchant_row(9, "Nike Men's Court Vision Low | Soft Cushion"),
            merchant_row(12, "Nike Court Vision Low - UK 9"),
        ]
        ranked = trending.merchant_family(MODELS, rows)
        self.assertEqual([item["rank"] for item in ranked], [3, 9])
        self.assertTrue(ranked[0]["riser"])
        self.assertEqual(ranked[0]["inventory"], "IN_STOCK")
        self.assertIsNone(ranked[1]["who"]["slug"])
        self.assertEqual(ranked[1]["who"]["title"], "Nike Court Vision Low")
        self.assertEqual(trending.merchant_week(rows), "2026-11-09")


class SearchTest(unittest.TestCase):
    def test_impressions_rank_and_rising(self):
        rows90 = [
            {"query": "air force 1 price", "impressions": 100},
            {"query": "adidas samba", "impressions": 300},
            {"query": "random query", "impressions": 900},
        ]
        rows28 = [{"query": "adidas samba", "impressions": 50}, {"query": "air force 1", "impressions": 10}]
        rows_prev = [{"query": "adidas samba", "impressions": 60}, {"query": "air force 1", "impressions": 4}]
        ranked = trending.search_family(MODELS, rows90, rows28, rows_prev)
        self.assertEqual([item["who"]["slug"] for item in ranked], ["samba", "af1"])
        self.assertEqual([item["rising"] for item in ranked], [False, True])

    def test_a_small_or_proportionally_small_gain_is_not_rising(self):
        rows90 = [{"query": "adidas samba", "impressions": 300}, {"query": "air force 1", "impressions": 100}]
        cases = [((1, 0), False), ((104, 100), False), ((110, 100), False), ((9, 4), True), ((150, 100), True)]
        for (now, before), expected in cases:
            rows28 = [{"query": "adidas samba", "impressions": now}]
            rows_prev = [{"query": "adidas samba", "impressions": before}] if before else []
            ranked = trending.search_family(MODELS, rows90, rows28, rows_prev)
            self.assertEqual(ranked[0]["rising"], expected, (now, before))

    def test_rising_is_not_guessed_without_the_comparison_files(self):
        ranked = trending.search_family(MODELS, [{"query": "adidas samba", "impressions": 5}], None, None)
        self.assertFalse(ranked[0]["rising"])


class LaunchTest(unittest.TestCase):
    TODAY = dt.date(2026, 11, 21)

    def drop(self, title, offset, brand="Nike"):
        day = self.TODAY + dt.timedelta(days=offset)
        return {"title": title, "brand": brand, "date": day.isoformat() + "T00:00:00.000Z"}

    def test_window_edges(self):
        drops = [
            self.drop("Nike Air Force 1 Low", -30),
            self.drop("Adidas Samba OG", -31, "Adidas"),
            self.drop("Air Jordan 1 High", 45, "Jordan"),
            self.drop("Nike Kobe 3 Low Protro", 46),
        ]
        ranked = trending.launch_family(MODELS, drops, self.TODAY)
        self.assertEqual({item["who"]["slug"] for item in ranked}, {"af1", "aj1"})

    def test_upcoming_first_then_decay(self):
        drops = [
            self.drop("Nike Air Force 1 Low", -30),
            self.drop("Adidas Samba OG", -3, "Adidas"),
            self.drop("Air Jordan 1 High", 20, "Jordan"),
            self.drop("Nike Kobe 3 Low Protro", 2),
        ]
        ranked = trending.launch_family(MODELS, drops, self.TODAY)
        self.assertEqual([item["who"]["slug"] for item in ranked], ["kobe", "aj1", "samba", "af1"])
        self.assertEqual(ranked[0]["recency"], 1.0)
        self.assertAlmostEqual(ranked[2]["recency"], round(math.exp(-3 / 30), 4))
        self.assertAlmostEqual(ranked[3]["recency"], round(math.exp(-1), 4))


class FusionTest(unittest.TestCase):
    def test_hand_computed_score(self):
        families = {
            "merchant": [{"who": who("a"), "rank": 20, "riser": False, "inventory": None}],
            "search": [{"who": who(str(i))} for i in range(9)] + [{"who": who("a")}],
            "launch": [{"who": who(str(i))} for i in range(7)] + [{"who": who("a")}],
        }
        row = next(row for row in trending.fuse(families) if row["who"]["key"] == "a")
        self.assertEqual(row["families"], {"merchant": 20, "search": 10, "launch": 8})
        self.assertAlmostEqual(row["score"], 0.35 / 80 + 0.25 / 70 + 0.15 / 68)

    def test_admission_rule(self):
        two = {"families": {"search": 3, "launch": 9}}
        solo_good = {"families": {"merchant": 50}}
        solo_bad = {"families": {"merchant": 51}}
        solo_search = {"families": {"search": 1}}
        self.assertTrue(trending.admitted(two))
        self.assertTrue(trending.admitted(solo_good))
        self.assertFalse(trending.admitted(solo_bad))
        self.assertFalse(trending.admitted(solo_search))

    def test_brand_filter(self):
        families = {
            "merchant": [
                {"who": who("nike-model", "nike"), "rank": 4, "riser": False, "inventory": None},
                {"who": who("puma-model", "puma"), "rank": 5, "riser": False, "inventory": None},
            ]
        }
        self.assertEqual([row["model"] for row in trending.shortlist(families)], ["nike-model"])
        self.assertEqual(len(trending.shortlist(families, all_brands=True)), 2)

    def test_shortlist_orders_by_score(self):
        families = {
            "merchant": [
                {"who": who("one"), "rank": 1, "riser": False, "inventory": None},
                {"who": who("two"), "rank": 2, "riser": True, "inventory": "IN_STOCK"},
            ],
            "launch": [{"who": who("two"), "date": "2026-12-01", "upcoming": True}],
        }
        rows = trending.shortlist(families)
        self.assertEqual([row["model"] for row in rows], ["two", "one"])
        self.assertTrue(rows[0]["riser"])
        self.assertTrue(rows[0]["stocked"])
        self.assertEqual(rows[0]["launch_date"], "2026-12-01")


class AutocompleteTest(unittest.TestCase):
    def test_counts_price_shaped_suggestions(self):
        def suggest(query):
            if query.endswith("price in india"):
                return ["nike air force 1 price in india", "nike air force 1 white", "nike air force 1 price"]
            return ["nike air force 1 price", "unrelated price"]

        ranked, failed, lookups = trending.autocomplete_family(MODELS, ["af1", "samba"], suggest, pause=0)
        self.assertEqual((failed, lookups), (0, 4))
        self.assertEqual(len(ranked), 1)
        self.assertEqual(ranked[0]["suggestions"], 2)


class HonestAbsenceTest(unittest.TestCase):
    def folder_with(self, folder, merchant_rows):
        Path(folder, "merchant_best_sellers_products.json").write_text(json.dumps({"pulled": "2026-11-20", "rows": merchant_rows}))
        Path(folder, "gsc_query_90.json").write_text(json.dumps({"pulled": "2026-11-20", "rows": [{"query": "adidas samba", "impressions": 9}]}))

    def test_failed_lookups_are_not_an_empty_answer(self):
        def down(query):
            raise OSError("offline")

        ranked, failed, lookups = trending.autocomplete_family(MODELS, ["af1", "samba"], down, pause=0)
        self.assertEqual((ranked, failed, lookups), ([], 4, 4))
        with tempfile.TemporaryDirectory() as folder:
            self.folder_with(folder, [merchant_row(7, "Nike Air Force 1")])
            with mock.patch.object(growth, "G", Path(folder)), mock.patch.object(trending, "read_vocabulary", return_value=(MODELS, [], None)), mock.patch.object(
                trending, "AUTOCOMPLETE_PAUSE", 0
            ):
                result = trending.build(dt.date(2026, 11, 21), use_autocomplete=True, suggest=down)
        entry = result["families"]["autocomplete"]
        self.assertFalse(entry["available"])
        self.assertIn("lookups failed", entry["reason"])

    def test_some_failed_lookups_leave_a_note(self):
        calls = []

        def flaky(query):
            calls.append(query)
            if len(calls) == 1:
                raise OSError("blocked")
            return ["nike air force 1 price"]

        ranked, failed, lookups = trending.autocomplete_family(MODELS, ["af1"], flaky, pause=0)
        self.assertEqual((len(ranked), failed, lookups), (1, 1, 2))

    def test_merchant_rows_without_a_rank_make_the_family_unavailable(self):
        broken = {"bestSellersProductClusterView": {"title": "Nike Air Force 1", "brand": "Nike", "position": "3"}}
        with tempfile.TemporaryDirectory() as folder:
            self.folder_with(folder, [broken, broken])
            with mock.patch.object(growth, "G", Path(folder)), mock.patch.object(trending, "read_vocabulary", return_value=(MODELS, [], None)):
                result = trending.build(dt.date(2026, 11, 21))
        entry = result["families"]["merchant"]
        self.assertFalse(entry["available"])
        self.assertEqual(entry["reason"], "0 of 2 rows had a rank")

    def test_the_pull_date_and_skipped_rows_are_reported(self):
        broken = {"bestSellersProductClusterView": {"title": "Nike Air Force 1", "brand": "Nike"}}
        with tempfile.TemporaryDirectory() as folder:
            self.folder_with(folder, [merchant_row(7, "Nike Air Force 1"), broken])
            with mock.patch.object(growth, "G", Path(folder)), mock.patch.object(trending, "read_vocabulary", return_value=(MODELS, [], None)):
                result = trending.build(dt.date(2026, 11, 21))
        entry = result["families"]["merchant"]
        self.assertEqual(entry["pulled"], "2026-11-20")
        self.assertEqual(entry["note"], "1 of 2 rows had no rank")
        self.assertIn("pulled 2026-11-20", trending.render(result, 10))

    def test_a_bad_row_in_ours_is_skipped_and_named(self):
        good = {"kind": "profile", "published": True, "slug": "af1", "title": "Nike Air Force 1", "brand": "Nike"}
        bad = {"kind": "profile", "published": True, "slug": "x", "name": "No Title", "brand": "Nike"}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "ours.jsonl"
            path.write_text(json.dumps(good) + "\n" + json.dumps(bad) + "\n{truncated")
            models, drops, problem = trending.read_vocabulary(path)
            self.assertEqual([model["slug"] for model in models], ["af1"])
            self.assertIn("2 row(s)", problem)
            self.assertIn("line 2", problem)
            path.write_text(json.dumps(bad))
            self.assertEqual(trending.read_vocabulary(path)[:2], (None, None))
            self.assertEqual(trending.read_vocabulary(Path(folder) / "absent.jsonl")[:2], (None, None))

    def test_without_a_vocabulary_a_row_says_profile_not_checked(self):
        row = {"rising": False, "riser": False, "launch_date": None, "released": None, "profile": None, "stocked": None}
        self.assertEqual(trending.flags(row), "no profile")
        self.assertEqual(trending.flags(row, False), "profile not checked")

    def test_a_run_with_no_family_fails_and_keeps_the_saved_shortlist(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "shortlist.json"
            target.write_text("kept")
            with mock.patch.object(growth, "G", Path(folder)), mock.patch.object(trending, "OUTPUT", target), mock.patch.object(
                trending, "read_vocabulary", return_value=(None, None, "data/ours.jsonl is missing")
            ), mock.patch("builtins.print"):
                code = trending.main([])
            self.assertEqual(code, 1)
            self.assertEqual(target.read_text(), "kept")


class MissingFileTest(unittest.TestCase):
    def test_missing_inputs_make_families_unavailable(self):
        with tempfile.TemporaryDirectory() as folder, mock.patch.object(growth, "G", Path(folder)), mock.patch.object(
            trending, "OURS", Path(folder) / "ours.jsonl"
        ), mock.patch.object(trending, "read_vocabulary", return_value=(None, None, "data/ours.jsonl is missing")):
            result = trending.build(dt.date(2026, 11, 21))
        for name in ("merchant", "search", "launch", "autocomplete"):
            self.assertFalse(result["families"][name]["available"])
        self.assertEqual(result["rows"], [])
        self.assertIn("gsc_query_90", result["families"]["search"]["file"])
        self.assertIn("NOT AVAILABLE", trending.render(result, 10))
        self.assertIn("Fewer than two", trending.render(result, 10))

    def test_one_missing_family_leaves_the_others_scoring_unchanged(self):
        with tempfile.TemporaryDirectory() as folder:
            Path(folder, "merchant_best_sellers_products.json").write_text(
                json.dumps({"pulled": "x", "rows": [merchant_row(7, "Nike Air Force 1")]})
            )
            Path(folder, "gsc_query_90.json").write_text("not json")
            with mock.patch.object(growth, "G", Path(folder)), mock.patch.object(
                trending, "read_vocabulary", return_value=(MODELS, [], None)
            ):
                result = trending.build(dt.date(2026, 11, 21))
        self.assertFalse(result["families"]["search"]["available"])
        self.assertTrue(result["families"]["merchant"]["available"])
        self.assertEqual(result["rows"][0]["families"], {"merchant": 7})
        self.assertAlmostEqual(result["rows"][0]["score"], round(0.35 / 67, 5))


class WriteTest(unittest.TestCase):
    def test_write_is_atomic_and_complete(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "trending" / "shortlist.json"
            trending.write({"generated_at": "2026-11-21", "rows": []}, target)
            self.assertEqual(json.loads(target.read_text())["generated_at"], "2026-11-21")
            self.assertFalse(target.with_name("shortlist.json.tmp").exists())


if __name__ == "__main__":
    unittest.main()
