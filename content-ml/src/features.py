import math
import re
from statistics import mean, pstdev

SENT_RE = re.compile(r"(?<=[.!?])[\"')\]]*\s+(?=[A-Z0-9\"'(₹$])")
WORD_RE = re.compile(r"[A-Za-z][A-Za-z'\-]*")

AI_LEXICON = [
    "delve", "tapestry", "testament", "underscore", "underscores", "elevate", "elevates", "elevated",
    "seamless", "seamlessly", "vibrant", "bustling", "realm", "landscape", "boasts", "boasting",
    "showcases", "showcasing", "embodies", "embodying", "meticulous", "meticulously", "intricate",
    "captivating", "unparalleled", "unwavering", "pivotal", "paramount", "furthermore", "moreover",
    "additionally", "notably", "ultimately", "essentially", "arguably", "undeniably", "remarkable",
    "stunning", "striking", "sleek", "versatile", "timeless", "game-changer", "game-changing",
    "must-have", "head-turning", "statement piece", "perfect blend", "perfect choice", "look no further",
    "whether you're", "whether you are", "in conclusion", "in summary", "overall,", "it's worth noting",
    "it is worth noting", "when it comes to", "in today's", "fast-paced", "a nod to", "pays homage",
    "pay homage", "rich history", "iconic silhouette", "sneakerheads alike", "fans alike", "enthusiasts alike",
    "take your", "to the next level", "stay tuned", "don't miss", "commitment to", "blend of style",
    "style and comfort", "comfort and style", "eye-catching", "standout", "exudes", "effortlessly",
    "navigate", "navigating", "journey", "dive into", "let's", "foster", "resonate", "resonates",
]
HEDGES = ["may", "might", "could", "perhaps", "possibly", "likely", "seems", "appears"]
FIRST_PERSON = re.compile(r"\b(I|I'm|I've|my|me|we|we're|our|us)\b")
SECOND_PERSON = re.compile(r"\b(you|your|you're|yours)\b", re.I)
NUM_RE = re.compile(r"\d")
QUOTE_RE = re.compile(r"[\"“”]")
NOT_JUST = re.compile(r"\bnot (just|only|merely)\b[^.]{0,80}\b(but|it's|it is)\b", re.I)
TRIPLE = re.compile(r"\b\w+(?: \w+)?, \w+(?: \w+)?,? and \w+", re.I)
CAP_ENTITY = re.compile(r"(?<![.!?]\s)(?<!^)\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*")

FEATURE_NAMES = [
    "sent_mean", "sent_std", "sent_cv", "sent_max_ratio", "short_sent_rate", "long_sent_rate",
    "para_cv", "mattr", "word_len", "long_word_rate", "ai_lex_rate", "ai_lex_types", "hedge_rate",
    "first_person_rate", "second_person_rate", "digit_rate", "quote_rate", "emdash_rate", "excl_rate",
    "question_rate", "colon_rate", "semicolon_rate", "paren_rate", "not_just_rate", "triple_rate",
    "same_start_rate", "entity_rate", "comma_per_sent", "adverb_ly_rate", "flesch",
]


def sentences(text):
    out = []
    for para in text.split("\n"):
        para = para.strip()
        if para:
            out.extend(s.strip() for s in SENT_RE.split(para) if s.strip())
    return out


def mattr(words, window=50):
    if len(words) < window:
        return len(set(words)) / max(1, len(words))
    vals = [len(set(words[i:i + window])) / window for i in range(0, len(words) - window + 1, 10)]
    return mean(vals)


def syllables(word):
    word = word.lower()
    groups = re.findall(r"[aeiouy]+", word)
    n = len(groups)
    if word.endswith("e") and n > 1:
        n -= 1
    return max(1, n)


def extract(text: str):
    sents = sentences(text)
    words = WORD_RE.findall(text)
    lw = [w.lower() for w in words]
    nw = max(1, len(words))
    ns = max(1, len(sents))
    slen = [len(WORD_RE.findall(s)) for s in sents] or [0]
    paras = [p for p in text.split("\n") if p.strip()]
    plen = [len(p.split()) for p in paras] or [0]
    low = text.lower()
    lex_hits = [t for t, r in LEX_RES if r.search(low)]
    lex_count = sum(len(r.findall(low)) for t, r in LEX_RES if t in lex_hits)
    starts = [s.split()[0].lower() for s in sents if s.split()]
    same_start = sum(1 for a, b in zip(starts, starts[1:]) if a == b) / max(1, len(starts) - 1)
    sm = mean(slen)
    sd = pstdev(slen) if len(slen) > 1 else 0.0
    pm = mean(plen)
    syl = sum(syllables(w) for w in words)
    flesch = 206.835 - 1.015 * (nw / ns) - 84.6 * (syl / nw)
    per100 = 100.0 / nw
    return [
        sm, sd, sd / sm if sm else 0.0, (max(slen) / sm) if sm else 0.0,
        sum(1 for x in slen if x <= 8) / ns, sum(1 for x in slen if x >= 30) / ns,
        (pstdev(plen) / pm) if pm and len(plen) > 1 else 0.0,
        mattr(lw), mean(len(w) for w in words) if words else 0.0,
        sum(1 for w in words if len(w) >= 9) / nw,
        lex_count * per100, len(lex_hits),
        sum(lw.count(h) for h in HEDGES) * per100,
        len(FIRST_PERSON.findall(text)) * per100, len(SECOND_PERSON.findall(text)) * per100,
        len(NUM_RE.findall(text)) * per100, len(QUOTE_RE.findall(text)) * per100,
        (text.count("—") + text.count(" - ")) * per100, text.count("!") / ns, text.count("?") / ns,
        text.count(":") / ns, text.count(";") / ns, text.count("(") / ns,
        len(NOT_JUST.findall(text)) / ns, len(TRIPLE.findall(text)) / ns, same_start,
        len(CAP_ENTITY.findall(text)) * per100, text.count(",") / ns,
        sum(1 for w in lw if w.endswith("ly") and len(w) > 4) * per100, flesch,
    ]


LEX_RES = [(t, re.compile(r"(?<![a-z])" + re.escape(t) + r"(?![a-z])")) for t in AI_LEXICON]


def lexicon_hits(text: str):
    low = text.lower()
    return [t for t, r in LEX_RES if r.search(low)]
