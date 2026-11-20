import json
import sys
from pathlib import Path
from urllib.parse import urlsplit

DATA = Path(__file__).resolve().parent.parent / "data"
REPORT = DATA / "growth" / "growth_report.json"
REFRESH_QUEUE = DATA / "refresh_queue.json"
PAGE_QUERIES = DATA / "growth" / "gsc_page_query_90.json"
REFRESH_LIMIT = 5
NEW_TOPIC_LIMIT = 8
CLUSTER_LIMIT = 5
QUERIES_PER_ROW = 5
MIN_REFRESH_IMPRESSIONS = 100
MIN_CLUSTER_IMPRESSIONS = 200
PAGE_ONE_LAST_POSITION = 10.0
BLOG_PREFIX = "/blogs/"
REQUIRED_SECTIONS = ("opportunities_by_page", "opportunities_page_query_top", "momentum_queries", "query_clusters")


def path_of(url):
    return urlsplit(url).path or "/"


def ranking_pages(report, page_query_rows):
    pages = {}
    for row in report.get("commercial_queries_without_shop_page", []):
        if row.get("ranking_page"):
            pages[row["query"]] = row["ranking_page"]
    for row in report.get("opportunities_page_query_top", []):
        pages[row["query"]] = row["path"]
    best = {}
    for row in page_query_rows:
        known = best.get(row["query"])
        if known is None or row["impressions"] > known["impressions"]:
            best[row["query"]] = row
    for query, row in best.items():
        pages[query] = path_of(row["page"])
    return pages


def queue_queries(queue):
    by_path = {}
    for page in queue.get("pages", []):
        if page.get("kind") != "blog":
            continue
        by_path[BLOG_PREFIX + page["slug"]] = [
            query["query"] for query in page.get("queries", [])
        ]
    return by_path


def page_queries(report, path):
    rows = [
        row
        for row in report.get("opportunities_page_query_top", [])
        if row["path"] == path
    ]
    rows.sort(key=lambda row: -row["impressions"])
    return [row["query"] for row in rows]


def refresh_candidates(report, queue):
    queued = queue_queries(queue)
    blogs = [
        page
        for page in report.get("opportunities_by_page", [])
        if page["kind"] == "blog" and page["impressions"] >= MIN_REFRESH_IMPRESSIONS
    ]
    blogs.sort(key=lambda page: -page["total_opportunity_90d"])
    candidates = []
    for page in blogs[:REFRESH_LIMIT]:
        queries = []
        for query in queued.get(page["path"], []) + page_queries(report, page["path"]):
            if query not in queries:
                queries.append(query)
        candidates.append(
            {
                "slug": page["path"][len(BLOG_PREFIX) :],
                "path": page["path"],
                "impressions": page["impressions"],
                "clicks": page["clicks"],
                "position": page["position"],
                "gain_clicks_90d": round(page["total_opportunity_90d"]),
                "queries": queries[:QUERIES_PER_ROW],
            }
        )
    return candidates


def new_topic_candidates(report, page_query_rows):
    pages = ranking_pages(report, page_query_rows)
    momentum = report.get("momentum_queries", {})
    rows = sorted(
        momentum.get("rising", []) + momentum.get("new", []),
        key=lambda row: -row["delta"],
    )
    topics = []
    for row in rows:
        covered_by = pages.get(row["query"])
        if covered_by and covered_by.startswith(BLOG_PREFIX):
            continue
        topics.append(
            {
                "query": row["query"],
                "impressions_28d": row["impr_28"],
                "gain_28d": row["delta"],
                "position": row["pos_28"],
                "intent": row.get("intent", ""),
                "ranking_page": covered_by,
            }
        )
    return topics[:NEW_TOPIC_LIMIT]


def weak_clusters(report):
    clusters = [
        cluster
        for cluster in report.get("query_clusters", [])
        if cluster["position"] > PAGE_ONE_LAST_POSITION
        and cluster["impressions"] >= MIN_CLUSTER_IMPRESSIONS
    ]
    clusters.sort(key=lambda cluster: -cluster["impressions"])
    return [
        {
            "label": cluster["label"],
            "impressions": cluster["impressions"],
            "position": cluster["position"],
            "queries": [
                query[0] for query in cluster.get("top_queries", [])[:QUERIES_PER_ROW]
            ],
            "pages": cluster.get("top_pages", [])[:3],
        }
        for cluster in clusters[:CLUSTER_LIMIT]
    ]


def build(report, queue, page_query_rows):
    return {
        "generated": report.get("generated"),
        "refresh": refresh_candidates(report, queue),
        "new_topics": new_topic_candidates(report, page_query_rows),
        "weak_clusters": weak_clusters(report),
    }


def render(plan):
    lines = [
        f"Blog topic candidates (growth report {plan['generated']})",
        "",
        "REFRESH FIRST: posts that already rank. Update these before writing a new post on the same query.",
    ]
    if not plan["refresh"]:
        lines.append("  none")
    for index, row in enumerate(plan["refresh"], 1):
        lines.append(
            f"  {index}. {row['slug']}: {row['impressions']} impressions, position {row['position']}, "
            f"{row['clicks']} clicks, modelled gain {row['gain_clicks_90d']} clicks per 90 days"
        )
        lines.append("     queries: " + "; ".join(row["queries"]))
    lines += ["", "NEW TOPICS: rising India queries with no post of ours ranking."]
    if not plan["new_topics"]:
        lines.append("  none")
    for index, row in enumerate(plan["new_topics"], 1):
        where = (
            f"ranks with {row['ranking_page']}"
            if row["ranking_page"]
            else "no page of ours recorded"
        )
        lines.append(
            f'  {index}. "{row["query"]}": {row["impressions_28d"]} impressions in 28 days '
            f"(+{row['gain_28d']}), position {row['position']}, {where}"
        )
    lines += ["", "WEAK CLUSTERS: demand exists and we rank past page one."]
    if not plan["weak_clusters"]:
        lines.append("  none")
    for index, row in enumerate(plan["weak_clusters"], 1):
        lines.append(
            f"  {index}. {row['label']}: {row['impressions']} impressions at position {row['position']}"
        )
        lines.append("     queries: " + "; ".join(row["queries"]))
        lines.append("     our pages: " + (", ".join(row["pages"]) or "none"))
    return "\n".join(lines) + "\n"


def missing_sections(report):
    return [name for name in REQUIRED_SECTIONS if name not in report]


def main(argv):
    if not REPORT.is_file():
        print("No growth report yet. Run: commands/growth.sh")
        return 1
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    missing = missing_sections(report)
    if missing:
        print("The growth report lacks these sections: " + ", ".join(missing) + ". Run: commands/growth.sh")
        return 1
    if not PAGE_QUERIES.is_file():
        print("data/growth/gsc_page_query_90.json is missing, so there is no way to tell which searches our posts already answer. Run: commands/growth.sh")
        return 1
    page_query_rows = json.loads(PAGE_QUERIES.read_text(encoding="utf-8")).get("rows", [])
    queue = {}
    if REFRESH_QUEUE.is_file():
        queue = json.loads(REFRESH_QUEUE.read_text(encoding="utf-8"))
    plan = build(report, queue, page_query_rows)
    if "--json" in argv:
        print(json.dumps(plan, ensure_ascii=False, indent=1))
        return 0
    print(render(plan))
    if not REFRESH_QUEUE.is_file():
        print("Note: data/refresh_queue.json is missing (commands/gsc-pull.sh writes it); the refresh list uses the growth report only.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
