#!/bin/zsh
set -uo pipefail
source "${0:A:h}/_lib.sh"
need_venv
cd "$ML/src"
"$PY" -W ignore - <<'PY' 2>/dev/null
import json, glob, os
from pathlib import Path
M, D = Path("../models"), Path("../data")
def load(p):
    try: return json.loads(Path(p).read_text())
    except Exception: return None
def lines(p):
    try: return sum(1 for _ in open(p))
    except Exception: return 0
s = load(M / "scorer_metrics.json") or {}
print("Scorer        :", s.get("version", "missing"), "| held-out AUC", s.get("auc_blend"))
live = (M / "rewriter-lora" / "adapters.safetensors").exists()
cand = (M / "rewriter-lora-candidate" / "adapters.safetensors").exists()
print("Rewriter live :", "yes" if live else "no", "| candidate waiting:", "yes" if cand else "no")
dec = sorted(glob.glob(str(M / "promotion_*_decision.json")))
if dec:
    d = load(dec[-1])
    print("Last promotion:", Path(dec[-1]).name, "| promoted:", d.get("promoted"), "| vs", d.get("against"))
    for name, m in (d.get("results") or {}).items():
        print(f"   {name:16} accepted {m.get('accepted')}/{m.get('n')}  facts kept {m.get('facts_preserved_rate')}  AI score {m.get('ai_score_before')} -> {m.get('ai_score_after')}")
else:
    print("Last promotion: none yet")
print("Data          : human articles", lines(D / "human.jsonl"), "| local pairs", lines(D / "pairs.jsonl"),
      "| Claude pairs", lines(D / "pairs_claude.jsonl"), "| enhancer runs logged", lines(D / "runs.jsonl"))
q = load(D / "refresh_queue.json")
if q:
    items = q.get("pages", q) if isinstance(q, dict) else q
    print("Refresh queue :", len(items), "pages (top 3):", ", ".join(str(i.get("slug") or i.get("page")) for i in items[:3]))
else:
    print("Refresh queue : no Search Console data yet (commands/gsc-pull.sh)")
PY
echo "Battery       : $(pmset -g batt | grep -oE '[0-9]+%;[^;]+' | head -1)  charger: $(pmset -g ac | awk -F'= ' '/Wattage/{print $2}')"
running="$(pgrep -fl 'mlx_lm lora|promote.py promote|eval_rewriter.py|gen_ai_pairs.py' | cut -c1-80)"
echo "Running jobs  : ${running:-none}"
