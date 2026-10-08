import json
import re
from pathlib import Path

from textutil import chunk_paragraphs, html_to_paragraphs

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
MODELS = ROOT / "models"

LOCAL_TOKENS = {
    "india", "indian", "indians", "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai", "pune",
    "vegnonveg", "superkicks", "crepdog", "myntra", "ajio", "flipkart", "snkrs", "cart", "gst", "igst",
    "customs", "duty", "rupee", "rupees", "lakh", "inr", "rs", "tata", "cliq", "bollywood", "cricket",
}
TOKEN_RE = re.compile(r"[a-z][a-z'\-]+")


UK_US = [(r"colour", "color"), (r"favour", "favor"), (r"flavour", "flavor"), (r"honour", "honor"),
         (r"labour", "labor"), (r"neighbour", "neighbor"), (r"behaviour", "behavior"), (r"grey", "gray"),
         (r"\b(real|recogn|organ|emphas|minim|maxim|prior|custom|special|stabil|optim|categor|summar|capital)is(e|ed|es|ing)\b", r"\1iz\2"),
         (r"centre", "center"), (r"metre", "meter"), (r"cheque", "check"), (r"programme", "program"),
         (r"travell", "travel"), (r"jewellery", "jewelry"), (r"trainers\b", "sneakers")]


def normalize(text: str) -> str:
    t = text.lower().replace("₹", " $ ").replace("’", "'").replace("-", " ")
    for a, b in UK_US:
        t = re.sub(a, b, t)
    t = re.sub(r"\d", "0", t)
    return " ".join(w for w in TOKEN_RE.findall(t) if w not in LOCAL_TOKENS and not w.startswith("india"))


def read_jsonl(path):
    p = Path(path)
    return [json.loads(l) for l in p.open()] if p.exists() else []


def our_blog_chunks():
    out = []
    for d in read_jsonl(DATA / "ours.jsonl"):
        if d["kind"] != "blog" or not d.get("published", True):
            continue
        for i, c in enumerate(chunk_paragraphs(html_to_paragraphs(d.get("html", "")), 70, 220)):
            out.append({"group": "ours:" + d["slug"], "text": c, "slug": d["slug"], "idx": i})
    return out


def human_chunks(exclude_urls=()):
    out = []
    ex = set(exclude_urls)
    for d in read_jsonl(DATA / "human.jsonl"):
        if d["url"] in ex:
            continue
        for c in chunk_paragraphs(d["paragraphs"], 70, 220)[:2]:
            out.append({"group": d["url"], "text": c})
    return out
