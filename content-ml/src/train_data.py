import difflib
import hashlib
import json
import random
import re

from corpus import DATA, read_jsonl
from factlock import apply_mapping, has_residue, lock, unlocked_leftovers
from textutil import html_to_paragraphs

SYSTEM = ("You are the SNKRS CART sneaker editor. Rewrite the paragraph so it reads like an experienced human "
          "sneaker journalist wrote it: uneven sentence lengths, plain verbs, no stock AI words, no hype adjectives, "
          "no 'you' marketing voice. Tokens like [[E_A]] are names, [[N_A]] are numbers and [[T_A]] are links: copy "
          "every one exactly once and never invent new ones. Do not add new facts. Return only the paragraph.")

SENT_SPLIT = re.compile(r"(?:(?<=[.!?])|(?<=[.!?][\"'”’)\]]))\s+(?=[A-Z0-9\"'“‘(₹$\[])")
CAP_TOKEN = re.compile(r"[^\W\d_][\w'’&\-]*")
CHATTER = re.compile(r"sneaker ?files|just ?fresh ?kicks|nice ?kicks|sneaker ?news|sneaker ?history|doctors ?of ?running|"
                     r"wear ?testers|keep it locked|stay tuned|check (?:them |it )?out|"
                     r"(?:photos|images|pics|look|gallery|pictures)\s+(?:below|above)|\bbelow\b[^.]{0,40}\b(?:photos|images|look|pics)\b|"
                     r"\(via\b|\bvia @|\bh/t\b|let us know|in the comments|follow us|head over to|sound off|"
                     r"enjoy (?:the |a |an )?(?:detailed |closer |official )?(?:look|images|photos|pics)", re.I)
LEAKED = re.compile(r"^\s*(?:here(?:'s| is) (?:the|a|your) (?:rewritten|revised|improved|updated|polished)|sure[,!]|certainly[,!]|"
                    r"as an ai|rewritten (?:text|paragraph|version))|return only|tokens like \[\[|\bparagraph:\s*$|^---", re.I | re.M)


def user_prompt(text):
    return f"Paragraph:\n{text}"


def facts(text):
    from enhance import facts as f
    return set(f(text))


def entities(text):
    from enhance import entities as e
    return e(text)


def split_for(group):
    h = int(hashlib.md5(group.encode()).hexdigest(), 16) % 20
    return "test" if h == 0 else "valid" if h == 1 else "train"


def clean_pair(src, tgt):
    if has_residue(src) or has_residue(tgt) or LEAKED.search(src):
        return False
    return True


def invented_names(sentence, src_words):
    toks = CAP_TOKEN.findall(sentence)[1:]
    return [w for w in toks if w[0].isupper() and w.lower().rstrip("'s’") not in src_words and w.lower() not in src_words]


def repair(src, tgt):
    fs, es = facts(src), entities(src)
    src_words = {w.lower().rstrip("'s’") for w in CAP_TOKEN.findall(src)} | {w.lower() for w in CAP_TOKEN.findall(src)}
    paras = []
    for para in tgt.split("\n"):
        kept = [x for x in SENT_SPLIT.split(para.strip())
                if x and facts(x) <= fs and entities(x) <= es and not CHATTER.search(x)
                and not invented_names(x, src_words | COMMON_CAPS)]
        if kept:
            paras.append(" ".join(kept))
    out = "\n\n".join(paras)
    ft, et = facts(out), entities(out)
    if len(fs - ft) > 1:
        return None
    if es and len(es & et) / len(es) < 0.6:
        return None
    ls, lt = len(src.split()), len(out.split())
    if lt < 30 or not 0.7 <= lt / max(1, ls) <= 1.4:
        return None
    return out


COMMON_CAPS = {"the", "a", "an", "this", "that", "these", "those", "it", "its", "it's", "in", "on", "at", "for", "with",
               "and", "but", "or", "so", "if", "as", "while", "when", "after", "before", "since", "though", "although",
               "we", "you", "they", "he", "she", "i", "i'm", "there", "here", "what", "why", "how", "now", "then",
               "still", "even", "just", "also", "both", "each", "every", "some", "most", "all", "no", "not", "yes",
               "one", "two", "three", "first", "next", "last", "new", "more", "less", "our", "your", "their", "his", "her",
               "to", "from", "by", "of", "about", "over", "under", "into", "like", "unlike", "despite", "because",
               "however", "plus", "today", "honestly", "look", "expect", "keep", "that's", "there's", "here's", "what's"}


def strip_unlocked(locked_tgt, mapping, src_words_n):
    paras = []
    for para in locked_tgt.split("\n"):
        kept = [x for x in SENT_SPLIT.split(para.strip()) if x and not unlocked_leftovers(x, mapping)]
        if kept:
            paras.append(" ".join(kept))
    out = "\n\n".join(paras)
    n = len(out.split())
    if n < 30 or not 0.7 <= n / max(1, src_words_n) <= 1.4:
        return None
    return out


def sample(src, tgt):
    return {"messages": [{"role": "system", "content": SYSTEM},
                         {"role": "user", "content": user_prompt(src)},
                         {"role": "assistant", "content": tgt}]}


def flywheel_pairs():
    published = {d["slug"]: d for d in read_jsonl(DATA / "ours.jsonl") if d.get("published")}
    first_by_slug = {}
    accepted = set()
    for r in sorted(read_jsonl(DATA / "runs.jsonl"), key=lambda r: (r.get("round", 1), r.get("ts", 0))):
        if r.get("round") == 1 and r["slug"] not in first_by_slug:
            first_by_slug[r["slug"]] = r
        accepted.update(" ".join(x.split()) for x in r.get("accepted_rewrites", []))
    out = []
    for slug, run in first_by_slug.items():
        final = published.get(slug)
        if not final:
            continue
        draft = run["draft"]
        first = html_to_paragraphs(draft.get("html", "")) if draft.get("html") else [p for p in draft.get("text", "").split("\n\n") if p.strip()]
        last = html_to_paragraphs(final.get("html", "")) if final.get("html") else [p for p in final.get("text", "").split("\n\n") if p.strip()]
        sm = difflib.SequenceMatcher(a=first, b=last, autojunk=False)
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag != "replace" or (i2 - i1) != (j2 - j1):
                continue
            for a, b in zip(first[i1:i2], last[j1:j2]):
                if len(a.split()) < 25 or " ".join(b.split()) in accepted:
                    continue
                if difflib.SequenceMatcher(a=a, b=b).ratio() < 0.35:
                    continue
                out.append({"group": "run:" + slug, "src": a, "tgt": b})
    return out


def main():
    rnd = random.Random(5)
    items, dropped = [], 0
    for p in read_jsonl(DATA / "pairs.jsonl"):
        if clean_pair(p["ai"], p["human"]):
            items.append({"group": p["url"], "src": p["ai"], "tgt": p["human"], "w": 1})
        else:
            dropped += 1
    for p in read_jsonl(DATA / "pairs_claude.jsonl"):
        if clean_pair(p["ai"], p["human"]):
            items.append({"group": p["url"], "src": p["ai"], "tgt": p["human"], "w": 1})
        else:
            dropped += 1
    for p in read_jsonl(DATA / "pairs_ours.jsonl"):
        if clean_pair(p["ai"], p["human"]):
            items.append({"group": "ours:" + p["slug"], "src": p["ai"], "tgt": p["human"], "w": 1})
        else:
            dropped += 1
    for p in flywheel_pairs():
        items.append({**p, "w": 1})
    kept = []
    for i in items:
        fixed = repair(i["src"], i["tgt"])
        if fixed:
            kept.append({**i, "tgt": fixed})
    split = {"train": [], "valid": [], "test": []}
    raw_eval = []
    for i in kept:
        key = split_for(i["group"])
        locked_src, mapping = lock(i["src"])
        locked_tgt = strip_unlocked(apply_mapping(i["tgt"], mapping), mapping, len(i["src"].split()))
        if locked_tgt is None:
            continue
        split[key].extend([sample(locked_src, locked_tgt)] * (i["w"] if key == "train" else 1))
        if key != "train":
            raw_eval.append({"src": i["src"], "tgt": i["tgt"], "split": key, "group": i["group"]})
    rnd.shuffle(split["train"])
    outdir = DATA / "rewriter"
    outdir.mkdir(exist_ok=True)
    for k, rows in split.items():
        with (outdir / f"{k}.jsonl").open("w") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    with (outdir / "eval_raw.jsonl").open("w") as f:
        for r in raw_eval:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(json.dumps({"candidates": len(items), "dropped_dirty": dropped, "kept_fact_safe": len(kept),
                      "flywheel": sum(1 for i in items if i["group"].startswith("run:")),
                      **{k: len(v) for k, v in split.items()}}))


if __name__ == "__main__":
    main()
