import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

import topics


def page(path, kind, impressions, gain, clicks=1, position=8.0):
    return {
        "path": path,
        "kind": kind,
        "impressions": impressions,
        "clicks": clicks,
        "position": position,
        "total_opportunity_90d": gain,
    }


def page_query(path, query, impressions):
    return {"path": path, "query": query, "impressions": impressions}


def momentum(query, delta, impressions=100, position=6.0):
    return {
        "query": query,
        "delta": delta,
        "impr_28": impressions,
        "pos_28": position,
        "intent": "navigational",
    }


REPORT = {
    "generated": "2026-11-21",
    "opportunities_by_page": [
        page("/brands/new-balance", "brand", 4441, 130.7),
        page("/blogs/festival", "blog", 8997, 264.5),
        page("/blogs/pokemon", "blog", 1541, 37.6),
        page("/blogs/tiny", "blog", 99, 500.0),
    ],
    "opportunities_page_query_top": [
        page_query("/blogs/festival", "indian sneaker festival 2026", 3181),
        page_query("/blogs/festival", "sneaker festival 2026", 720),
        page_query("/blogs/pokemon", "adidas pokemon shoes", 406),
    ],
    "commercial_queries_without_shop_page": [
        {"query": "jhope nike shoes price", "ranking_page": "/blogs/jhope"},
        {"query": "new balance india", "ranking_page": "/brands/new-balance"},
    ],
    "momentum_queries": {
        "rising": [
            momentum("adidas pokemon shoes", 241),
            momentum("jhope nike shoes price", 204),
            momentum("new balance india", 50),
        ],
        "new": [momentum("gully labs new collab", 120), momentum("small one", 5)],
    },
    "query_clusters": [
        {
            "label": "sneakers best sneaker",
            "impressions": 1197,
            "position": 19.3,
            "top_queries": [
                ["best white sneakers 2025", 168, 0, 5.8],
                ["indian sneaker brands", 90, 0, 21.0],
            ],
            "top_pages": ["/blogs/a", "/blogs/b"],
        },
        {
            "label": "on page one",
            "impressions": 5000,
            "position": 8.0,
            "top_queries": [],
            "top_pages": [],
        },
        {
            "label": "too small",
            "impressions": 199,
            "position": 30.0,
            "top_queries": [],
            "top_pages": [],
        },
        {
            "label": "jordan air 1",
            "impressions": 745,
            "position": 22.2,
            "top_queries": [["air jordan 1", 42, 0, 8.8]],
            "top_pages": [],
        },
    ],
}

QUEUE = {
    "pages": [
        {
            "kind": "blog",
            "slug": "festival",
            "queries": [
                {"query": "indian sneaker festival 2026 lineup"},
                {"query": "indian sneaker festival 2026"},
            ],
        },
        {
            "kind": "drop",
            "slug": "festival",
            "queries": [{"query": "should not appear"}],
        },
    ]
}


class RefreshCandidatesTest(unittest.TestCase):
    def test_only_blogs_with_enough_impressions_ordered_by_modelled_gain(self):
        rows = topics.refresh_candidates(REPORT, QUEUE)
        self.assertEqual([row["slug"] for row in rows], ["festival", "pokemon"])
        self.assertEqual(rows[0]["gain_clicks_90d"], 264)

    def test_queue_queries_come_first_without_repeats(self):
        rows = topics.refresh_candidates(REPORT, QUEUE)
        self.assertEqual(
            rows[0]["queries"],
            [
                "indian sneaker festival 2026 lineup",
                "indian sneaker festival 2026",
                "sneaker festival 2026",
            ],
        )
        self.assertEqual(rows[1]["queries"], ["adidas pokemon shoes"])

    def test_list_is_capped(self):
        report = dict(
            REPORT,
            opportunities_by_page=[
                page(f"/blogs/p{n}", "blog", 500, n) for n in range(9)
            ],
        )
        rows = topics.refresh_candidates(report, {})
        self.assertEqual(len(rows), topics.REFRESH_LIMIT)
        self.assertEqual(rows[0]["slug"], "p8")


class NewTopicsTest(unittest.TestCase):
    def test_queries_already_answered_by_a_blog_are_left_for_refresh(self):
        rows = topics.new_topic_candidates(REPORT, [])
        self.assertEqual(
            [row["query"] for row in rows],
            ["gully labs new collab", "new balance india", "small one"],
        )

    def test_ranking_page_is_reported_when_it_is_not_a_blog(self):
        rows = {row["query"]: row for row in topics.new_topic_candidates(REPORT, [])}
        self.assertEqual(
            rows["new balance india"]["ranking_page"], "/brands/new-balance"
        )
        self.assertIsNone(rows["gully labs new collab"]["ranking_page"])
        self.assertEqual(rows["gully labs new collab"]["gain_28d"], 120)


class RankingPagesTest(unittest.TestCase):
    def test_search_console_rows_decide_which_page_answers_a_query(self):
        rows = [
            {"page": "https://www.snkrscart.com/blogs/collab#heading-2", "query": "gully labs new collab", "impressions": 90},
            {"page": "https://www.snkrscart.com/drops/collab", "query": "gully labs new collab", "impressions": 10},
        ]
        self.assertEqual(topics.ranking_pages(REPORT, rows)["gully labs new collab"], "/blogs/collab")
        queries = [row["query"] for row in topics.new_topic_candidates(REPORT, rows)]
        self.assertEqual(queries, ["new balance india", "small one"])

    def test_path_of_drops_host_query_and_fragment(self):
        self.assertEqual(topics.path_of("https://www.snkrscart.com/blogs/a-post#heading-1"), "/blogs/a-post")
        self.assertEqual(topics.path_of("https://www.snkrscart.com/products?search=dunk"), "/products")
        self.assertEqual(topics.path_of("https://www.snkrscart.com"), "/")
        self.assertEqual(topics.path_of("/brands/nike"), "/brands/nike")

    def test_a_report_without_its_sections_is_named_as_incomplete(self):
        self.assertEqual(topics.missing_sections(REPORT), [])
        self.assertEqual(
            topics.missing_sections({"generated": "2026-11-21", "query_clusters": []}),
            ["opportunities_by_page", "opportunities_page_query_top", "momentum_queries"],
        )


class WeakClustersTest(unittest.TestCase):
    def test_only_big_clusters_past_page_one_biggest_first(self):
        rows = topics.weak_clusters(REPORT)
        self.assertEqual(
            [row["label"] for row in rows], ["sneakers best sneaker", "jordan air 1"]
        )
        self.assertEqual(
            rows[0]["queries"], ["best white sneakers 2025", "indian sneaker brands"]
        )
        self.assertEqual(rows[0]["pages"], ["/blogs/a", "/blogs/b"])


class RenderTest(unittest.TestCase):
    def test_text_lists_the_three_groups(self):
        text = topics.render(topics.build(REPORT, QUEUE, []))
        self.assertIn(
            "1. festival: 8997 impressions, position 8.0, 1 clicks, modelled gain 264 clicks per 90 days",
            text,
        )
        self.assertIn(
            '1. "gully labs new collab": 100 impressions in 28 days (+120), position 6.0, no page of ours recorded',
            text,
        )
        self.assertIn(
            "1. sneakers best sneaker: 1197 impressions at position 19.3", text
        )

    def test_empty_report_says_none(self):
        text = topics.render(topics.build({"generated": "2026-11-21"}, {}, []))
        self.assertEqual(text.count("  none"), 3)


if __name__ == "__main__":
    unittest.main()
