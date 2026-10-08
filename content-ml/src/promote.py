import json
import re
import shutil
import sys
import time
from pathlib import Path

from corpus import MODELS
from train_data import flywheel_pairs

STATE = MODELS / "last_train.json"
LIVE = MODELS / "rewriter-lora"
MARGIN = 5


def pick_checkpoint(adapter_dir: Path, log: Path):
    vals = {int(m.group(1)): float(m.group(2))
            for m in re.finditer(r"Iter (\d+): Val loss ([\d.]+)", log.read_text())}
    ckpts = {int(p.name[:7]): p for p in adapter_dir.glob("0*_adapters.safetensors")}
    scored = [(vals[i], i) for i in ckpts if i in vals]
    if not scored:
        return None
    loss, it = min(scored)
    shutil.copy(ckpts[it], adapter_dir / "adapters.safetensors")
    return {"iter": it, "val_loss": loss}


def decide(cand, ref):
    if ref is None:
        return False, "no reference model evaluated"
    checks = {
        "accepted_margin": cand["accepted"] - ref["accepted"] >= MARGIN,
        "facts": cand["facts_preserved_rate"] >= ref["facts_preserved_rate"] - 0.02,
        "entities": cand["entities_preserved_rate"] >= ref["entities_preserved_rate"] - 0.02,
        "copying": cand["copied_rate"] <= ref["copied_rate"] + 0.02,
    }
    return all(checks.values()), checks


def promote(cand_dir: Path):
    from eval_rewriter import run
    models = [("base_qwen_1.5b", None), ("candidate", str(cand_dir))]
    if (LIVE / "adapters.safetensors").exists():
        models.insert(1, ("live", str(LIVE)))
    stamp = time.strftime("%Y%m%d-%H%M%S")
    out = MODELS / f"promotion_{stamp}.json"
    results = {m["model"]: m for m in run(models, 100, out)}
    cand = results.get("candidate")
    ref = results.get("live") or results.get("base_qwen_1.5b")
    ok, checks = decide(cand, ref) if cand else (False, "candidate failed to evaluate")
    decision = {"promoted": ok, "checks": checks, "against": "live" if "live" in results else "base", "results": results, "ts": stamp}
    if ok:
        prev = MODELS / "rewriter-lora-prev"
        shutil.rmtree(prev, ignore_errors=True)
        if LIVE.exists():
            LIVE.rename(prev)
        cand_dir.rename(LIVE)
        (MODELS / "rewriter_metrics.json").write_text(json.dumps([cand], indent=2))
    (MODELS / f"promotion_{stamp}_decision.json").write_text(json.dumps(decision, indent=2))
    STATE.write_text(json.dumps({"flywheel_pairs": len(flywheel_pairs()), "ts": time.time(), "last_decision": ok}))
    print(json.dumps({k: v for k, v in decision.items() if k != "results"}, indent=2))
    for name, m in results.items():
        print(name, {k: m[k] for k in ("accepted", "accept_rate", "ai_score_before", "ai_score_after", "facts_preserved_rate", "empty_rate")})


def due(min_new: int):
    seen = json.loads(STATE.read_text())["flywheel_pairs"] if STATE.exists() else 0
    now = len(flywheel_pairs())
    print(json.dumps({"flywheel_pairs": now, "at_last_train": seen, "due": now - seen >= min_new}))
    return now - seen >= min_new


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "pick":
        print(json.dumps(pick_checkpoint(Path(sys.argv[2]), Path(sys.argv[3]))))
    elif cmd == "promote":
        promote(Path(sys.argv[2]))
    elif cmd == "due":
        sys.exit(0 if due(int(sys.argv[2]) if len(sys.argv) > 2 else 30) else 10)
