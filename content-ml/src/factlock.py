import re
from string import ascii_uppercase

BRANDS = {"nike", "jordan", "adidas", "balance", "crocs", "yeezy", "converse", "puma", "asics", "reebok",
          "vans", "dunk", "airmax", "stockx", "goat", "snkrs", "vegnonveg", "superkicks", "myntra", "ajio"}
LEAD_STOP = {"the", "a", "an", "this", "that", "these", "those", "its", "our", "your", "their", "his", "her",
             "in", "on", "at", "for", "with", "after", "before", "when", "while", "but", "and", "if", "so",
             "now", "then", "here", "there", "as", "from", "by", "to", "of", "it", "we", "you", "they", "i",
             "what", "why", "how", "yes", "no", "also", "both", "each", "every", "some", "most", "all",
             "that's", "it's", "there's", "here's", "what's", "we're", "you're", "they're", "i'm", "i've",
             "we've", "don't", "doesn't", "isn't", "can't", "won't", "let's", "who", "where", "which",
             "since", "unlike", "buy", "get", "grab", "expect", "look", "like", "despite", "following", "ahead",
             "during", "although", "though", "once", "thanks", "according", "instead", "meanwhile", "still", "even",
             "just", "only", "today", "tomorrow", "yesterday", "recently", "finally", "fans", "rumors", "rumours",
             "pick", "cop", "shop", "check", "see", "find", "keep", "make", "take", "head", "stay", "until", "after",
             "before", "because", "however", "plus", "first", "next", "last", "more", "less", "every"}
UPPER = "A-ZÀ-ÖØ-Þ"
TOKEN = rf"[{UPPER}](?:[^\W_]|[&\-]|['’](?=[^\W\d_]))*"
SPAN_RE = re.compile(rf"{TOKEN}(?:[ \t]+(?:{TOKEN}|\d+(?:\.\d+)?[A-Za-z]*|x|of|the|de|des|du|la|le|da|di|van|von|y)(?!\w))*")
FACT_RE = re.compile(r"[₹$]\s?\d{1,3}(?:,\d{2,3})+(?:\.\d+)?(?:[kK]\b)?|[₹$]\s?\d+(?:\.\d+)?(?:[kK]\b)?|\b[A-Z0-9]{2,}\d*-\d{3}\b|"
                     r"\b\d+(?:[,.:/]\d+)*(?:st|nd|rd|th|am|pm|AM|PM|s|k|K|US|UK|mm|cm)?\b")
LOOSE_RE = re.compile(r"\[{1,2}\s*/?\s*([ENTent])\s*_\s*([A-Za-z]+)\s*\]{1,2}")
PH_RE = re.compile(r"\[\[([ENT])_([A-Z]+)\]\]")
RESIDUE_RE = re.compile(r"\[\[?\s*[ENT]_[A-Za-z0-9]*\s*\]?\]?|\[[ENT]_[A-Z]+\]")
TAG_SPAN_RE = re.compile(r"<(a|strong|em|b|i|code|span)\b[^>]*>.*?</\1>|<br\s*/?>|<[^>]+>", re.S | re.I)


def _label(i):
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = ascii_uppercase[r] + s
    return s


def _sentence_starts(text):
    starts = {0}
    for m in re.finditer(r"[.!?:]\s+|\n+", text):
        starts.add(m.end())
    return starts


def _entity_values(text):
    starts = _sentence_starts(text)
    mid_tokens = set()
    spans = []
    raw_spans = []
    for m in SPAN_RE.finditer(text):
        toks = m.group(0).split()
        at_start = m.start() in starts
        while toks and toks[0].lower().replace("’", "'") in LEAD_STOP:
            toks = toks[1:]
            at_start = False
        raw_spans.append((toks, at_start))
        if not at_start:
            mid_tokens.update(t.lower() for t in toks)
    for toks, at_start in raw_spans:
        while toks and toks[-1].lower() in {"x", "of", "the", "de", "des", "du", "la", "le", "da", "di", "van", "von", "y"}:
            toks = toks[:-1]
        if not toks:
            continue
        spans.append((" ".join(toks), at_start))
    out = set()
    for val, at_start in spans:
        toks = val.split()
        if len(toks) >= 2 or not at_start or toks[0].lower() in BRANDS or toks[0].lower() in mid_tokens:
            if len(val) > 1 and val.lower() not in LEAD_STOP:
                out.add(val)
    return out


def lock(text):
    mapping = {}
    locked = text
    ents = sorted(_entity_values(text), key=len, reverse=True)
    for i, val in enumerate(ents):
        ph = f"[[E_{_label(i)}]]"
        pat = re.compile(rf"(?<![\w\[]){re.escape(val)}(?![\w\]])")
        if pat.search(locked):
            locked = pat.sub(ph, locked)
            mapping[ph] = val
    n = 0
    def repl(m):
        nonlocal n
        val = m.group(0)
        for ph, v in mapping.items():
            if v == val and ph.startswith("[[N_"):
                return ph
        ph = f"[[N_{_label(n)}]]"
        n += 1
        mapping[ph] = val
        return ph
    parts = re.split(r"(\[\[[ENT]_[A-Z]+\]\])", locked)
    locked = "".join(p if PH_RE.fullmatch(p) else FACT_RE.sub(repl, p) for p in parts)
    return locked, mapping


def apply_mapping(text, mapping):
    for ph, val in sorted(mapping.items(), key=lambda kv: len(kv[1]), reverse=True):
        if ph.startswith("[[E_"):
            text = re.sub(rf"(?<![\w\[]){re.escape(val)}(?![\w\]])", ph, text)
    parts = re.split(r"(\[\[[ENT]_[A-Z]+\]\])", text)
    inv = {v.replace(" ", ""): k for k, v in mapping.items() if k.startswith("[[N_")}
    return "".join(p if PH_RE.fullmatch(p) else FACT_RE.sub(lambda m: inv.get(m.group(0).replace(" ", ""), m.group(0)), p) for p in parts)


def unlocked_leftovers(locked_text, mapping):
    bare = PH_RE.sub(" ", locked_text)
    left = [m.group(0) for m in FACT_RE.finditer(bare)]
    left += [v for k, v in mapping.items() if k.startswith("[[E_") and re.search(rf"(?<!\w){re.escape(v)}(?!\w)", bare)]
    return left


def canonical(text):
    return LOOSE_RE.sub(lambda m: f"[[{m.group(1).upper()}_{m.group(2).upper()}]]", text)


def unlock(text, mapping, require_all=True):
    text = canonical(text)
    found = set(m.group(0) for m in PH_RE.finditer(text))
    unknown = found - set(mapping)
    missing = set(mapping) - found
    residue = [r for r in RESIDUE_RE.findall(PH_RE.sub("", text)) if r.strip()]
    if unknown or residue or (require_all and missing):
        return None, {"unknown": sorted(unknown), "missing": sorted(missing), "residue": residue}
    out = PH_RE.sub(lambda m: mapping.get(m.group(0), m.group(0)), text)
    return out, {"unknown": [], "missing": sorted(missing), "residue": []}


def has_residue(text):
    return bool(RESIDUE_RE.search(PH_RE.sub("", text))) or bool(PH_RE.search(text))


def lock_tags(inner_html):
    mapping = {}
    n = 0

    def repl(m):
        nonlocal n
        ph = f"[[T_{_label(n)}]]"
        n += 1
        mapping[ph] = m.group(0)
        return ph

    return TAG_SPAN_RE.sub(repl, inner_html), mapping


def tag_text(mapping):
    return {ph: re.sub(r"<[^>]+>", "", v) for ph, v in mapping.items()}
