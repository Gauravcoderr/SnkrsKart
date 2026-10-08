import html
import re

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"[ \t\r\f\v]+")


def html_to_paragraphs(raw: str):
    raw = re.sub(r"(?is)<(script|style|figure|figcaption|iframe|table)[^>]*>.*?</\1>", " ", raw or "")
    raw = re.sub(r"(?i)<br\s*/?>", "\n", raw)
    raw = re.sub(r"(?i)</(p|h[1-6]|li|div|blockquote)>", "\n\n", raw)
    text = html.unescape(TAG_RE.sub(" ", raw))
    paras = []
    for block in re.split(r"\n\s*\n", text):
        block = WS_RE.sub(" ", block.replace("\n", " ")).strip()
        if block:
            paras.append(block)
    return paras


def html_to_text(raw: str) -> str:
    return "\n\n".join(html_to_paragraphs(raw))


def chunk_paragraphs(paras, min_words=80, max_words=260):
    chunks, cur, n = [], [], 0
    for p in paras:
        w = len(p.split())
        if w < 6:
            continue
        if n + w > max_words and n >= min_words:
            chunks.append("\n\n".join(cur))
            cur, n = [], 0
        cur.append(p)
        n += w
    if n >= min_words:
        chunks.append("\n\n".join(cur))
    return chunks
