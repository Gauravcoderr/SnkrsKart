import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SECRETS = ROOT / "secrets"
OUT = ROOT / "data" / "growth"
ACCOUNT = "5750742430"
TIMEOUT = 60
API = "https://merchantapi.googleapis.com"


def token():
    tok = json.loads((SECRETS / "merchant_token.json").read_text())
    client = json.loads((SECRETS / "merchant_oauth_client.json").read_text())["web"]
    body = urllib.parse.urlencode({
        "client_id": client["client_id"], "client_secret": client["client_secret"],
        "refresh_token": tok["refresh_token"], "grant_type": "refresh_token"}).encode()
    req = urllib.request.Request(client["token_uri"], data=body, method="POST")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read())["access_token"]


def call(tok, url, body=None, method=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method or ("POST" if data else "GET"),
                                 headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        try:
            detail = json.loads(detail)["error"]["message"]
        except (ValueError, KeyError, TypeError):
            detail = detail[:300]
        raise RuntimeError(f"{e.code} {url.split('?')[0].replace(API, '')}: {detail}")


def list_products(tok):
    rows, page = [], None
    while True:
        q = {"pageSize": 1000}
        if page:
            q["pageToken"] = page
        doc = call(tok, f"{API}/products/v1/accounts/{ACCOUNT}/products?" + urllib.parse.urlencode(q))
        rows.extend(doc.get("products", []))
        page = doc.get("nextPageToken")
        if not page:
            return rows


def report(tok, query):
    rows, page = [], None
    while True:
        body = {"query": query, "pageSize": 1000}
        if page:
            body["pageToken"] = page
        doc = call(tok, f"{API}/reports/v1/accounts/{ACCOUNT}/reports:search", body)
        rows.extend(doc.get("results", []))
        page = doc.get("nextPageToken")
        if not page:
            return rows


def save(name, doc):
    (OUT / f"merchant_{name}.json").write_text(json.dumps({"pulled": date.today().isoformat(), **doc}, ensure_ascii=False), encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tok = token()
    end = date.today() - timedelta(days=1)
    start90 = end - timedelta(days=89)
    failures = 0
    try:
        products = list_products(tok)
        save("products", {"products": products})
        print(f"products: {len(products)}")
    except RuntimeError as e:
        failures += 1
        print(f"products: {e}", file=sys.stderr)
    endpoints = {
        "datasources": (f"{API}/datasources/v1/accounts/{ACCOUNT}/dataSources", None),
        "account": (f"{API}/accounts/v1/accounts/{ACCOUNT}", None),
        "account_issues_list": (f"{API}/accounts/v1/accounts/{ACCOUNT}/issues?pageSize=50", None),
        "render_account_issues": (f"{API}/issueresolution/v1/accounts/{ACCOUNT}:renderaccountissues?languageCode=en-US", {}),
        "programs": (f"{API}/accounts/v1/accounts/{ACCOUNT}/programs", None),
        "shipping_settings": (f"{API}/accounts/v1/accounts/{ACCOUNT}/shippingSettings", None),
    }
    for name, (url, body) in endpoints.items():
        try:
            doc = call(tok, url, body)
            save(name, doc)
            print(f"{name}: ok")
            if name == "datasources":
                for ds in doc.get("dataSources", []):
                    try:
                        up = call(tok, f"{API}/datasources/v1/{ds['name']}/fileUploads/latest")
                        save("latest_upload_" + ds["dataSourceId"], up)
                        print(f"latest upload {ds['dataSourceId']}: {up.get('processingState')} itemsTotal={up.get('itemsTotal')} issues={[(i.get('title'), i.get('count')) for i in up.get('issues', [])]}")
                    except RuntimeError as e:
                        print(f"latest upload {ds['dataSourceId']}: {e}", file=sys.stderr)
        except RuntimeError as e:
            failures += 1
            print(f"{name}: {e}", file=sys.stderr)
    queries = {
        "product_view_min": "SELECT id, offer_id, title, brand, price, condition, availability, item_group_id, creation_time, expiration_date, "
                            "aggregated_reporting_context_status, item_issues, click_potential, click_potential_rank FROM product_view",
        "product_performance_90": f"SELECT offer_id, date, clicks, impressions, click_through_rate, conversions FROM product_performance_view "
                                  f"WHERE date BETWEEN '{start90}' AND '{end}' AND marketing_method = 'ORGANIC'",
        "non_product_performance": f"SELECT date, clicks, impressions, click_through_rate FROM non_product_performance_view WHERE date BETWEEN '{start90}' AND '{end}'",
        "price_competitiveness": "SELECT id, offer_id, title, brand, price, benchmark_price, report_country_code FROM price_competitiveness_product_view",
        "price_insights": "SELECT id, offer_id, title, brand, price, suggested_price, predicted_impressions_change_fraction, predicted_clicks_change_fraction, "
                          "predicted_conversions_change_fraction, effectiveness FROM price_insights_product_view",
        "best_sellers_brand": "SELECT report_date, report_granularity, report_country_code, report_category_id, brand, rank, previous_rank, relative_demand, "
                              "previous_relative_demand, relative_demand_change FROM best_sellers_brand_view "
                              "WHERE report_granularity = 'WEEKLY' AND report_country_code = 'IN' AND report_category_id = 187 ORDER BY rank LIMIT 200",
        "best_sellers_products": "SELECT report_date, report_granularity, report_country_code, report_category_id, title, brand, category_l1, category_l2, category_l3, "
                                 "rank, previous_rank, relative_demand, previous_relative_demand, relative_demand_change, inventory_status, brand_inventory_status, variant_gtins "
                                 "FROM best_sellers_product_cluster_view WHERE report_granularity = 'WEEKLY' AND report_country_code = 'IN' AND report_category_id = 187 ORDER BY rank LIMIT 1000",
        "best_sellers_products_monthly": "SELECT report_date, report_granularity, report_country_code, report_category_id, title, brand, category_l2, category_l3, rank, previous_rank, "
                                         "relative_demand, relative_demand_change, inventory_status FROM best_sellers_product_cluster_view "
                                         "WHERE report_granularity = 'MONTHLY' AND report_country_code = 'IN' AND report_category_id = 187 ORDER BY rank LIMIT 1000",
        "competitive_visibility": f"SELECT date, domain, is_your_domain, traffic_source, report_category_id, report_country_code, page_overlap_rate, higher_position_rate, "
                                  f"relative_visibility, ads_organic_ratio FROM competitive_visibility_competitor_view "
                                  f"WHERE date BETWEEN '{start90}' AND '{end}' AND report_category_id = 187 AND report_country_code = 'IN' AND traffic_source = 'ORGANIC'",
        "competitive_visibility_benchmark": f"SELECT date, report_category_id, report_country_code, traffic_source, your_domain_visibility_trend, category_benchmark_visibility_trend "
                                            f"FROM competitive_visibility_benchmark_view WHERE date BETWEEN '{start90}' AND '{end}' AND report_category_id = 187 "
                                            f"AND report_country_code = 'IN' AND traffic_source = 'ORGANIC'",
    }
    for name, q in queries.items():
        try:
            rows = report(tok, q)
            save(name, {"query": q, "rows": rows})
            print(f"{name}: {len(rows)} rows")
        except RuntimeError as e:
            failures += 1
            print(f"{name}: {e}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, urllib.error.URLError, KeyError, ValueError) as e:
        print(f"merchant pull failed: {e}", file=sys.stderr)
        sys.exit(3)
