import hfoffline
import json
import random
import sys
import time
from pathlib import Path

from mlx_lm import generate, load
from mlx_lm.sample_utils import make_sampler

from factlock import lock, unlock
from textutil import chunk_paragraphs

ROOT = Path(__file__).resolve().parent.parent
HUMAN = ROOT / "data" / "human.jsonl"
OUT = ROOT / "data" / "pairs.jsonl"
MODEL = "mlx-community/Qwen2.5-1.5B-Instruct-4bit"

PROMPTS = [
    "Rewrite this sneaker news passage as an engaging, polished blog section for a sneaker website. Keep every fact, name, date, style code and price exactly.",
    "You are a helpful content writer. Turn the passage below into a well-structured, SEO-friendly blog paragraph about these sneakers. Preserve all facts exactly.",
    "Improve the following text so it reads like a professional, informative sneaker blog post. Do not change any facts, numbers or names.",
]


def source_chunks(ours: bool):
    if ours:
        sel = ROOT / "data" / "ours_humanlike.jsonl"
        return [json.loads(l) for l in sel.open()]
    docs = [json.loads(l) for l in HUMAN.open()]
    chunks = []
    for d in docs:
        for c in chunk_paragraphs(d["paragraphs"], 70, 220)[:4]:
            chunks.append({"source": d["source"], "url": d["url"], "human": c})
    random.shuffle(chunks)
    return chunks


def main(limit: int, ours: bool = False):
    global OUT
    random.seed(7)
    if ours:
        OUT = ROOT / "data" / "pairs_ours.jsonl"
    chunks = source_chunks(ours)
    done = set()
    if OUT.exists():
        done = {json.loads(l)["human"][:200] for l in OUT.open()}
    model, tok = load(MODEL)
    sampler = make_sampler(temp=0.7, top_p=0.95)
    out = OUT.open("a")
    n = len(done)
    t0 = time.time()
    stats = {"tried": 0, "rejected": 0}
    for c in chunks:
        if n >= limit:
            break
        if c["human"][:200] in done:
            continue
        instr = random.choice(PROMPTS)
        locked, mapping = lock(c["human"])
        msgs = [{"role": "user", "content": f"{instr} Tokens like [[E_A]] or [[N_B]] are names and numbers: copy every one of them exactly, each at least once.\n\n---\n{locked}\n---\n\nReturn only the rewritten text."}]
        prompt = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
        ai_locked = generate(model, tok, prompt=prompt, max_tokens=480, sampler=sampler).strip()
        ai, info = unlock(ai_locked, mapping, require_all=False)
        stats["tried"] += 1
        if ai is None or len(ai.split()) < 40:
            stats["rejected"] += 1
            continue
        out.write(json.dumps({**c, "ai": ai, "prompt": instr, "locked": True,
                              "missing": info["missing"]}, ensure_ascii=False) + "\n")
        out.flush()
        n += 1
        if n % 10 == 0:
            print(f"{n} pairs, {time.time() - t0:.0f}s, tried {stats['tried']}, rejected {stats['rejected']}", flush=True)
    out.close()


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--out" in " ".join(sys.argv):
        OUT = Path(sys.argv[sys.argv.index("--out") + 1])
        args = [a for a in args if a != str(OUT)]
    main(int(args[0]) if args else 900, "--ours" in sys.argv)
