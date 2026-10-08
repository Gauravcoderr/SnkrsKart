#!/bin/zsh
set -euo pipefail
ROOT="${0:A:h}"
PY="$ROOT/.venv/bin/python -W ignore"
cd "$ROOT/src"
mkdir -p "$ROOT/data/drafts" "$ROOT/models"

step="${1:-all}"
PAIRS="${PAIRS:-1600}"
OURS="${OURS:-150}"
ITERS="${ITERS:-600}"
MIN_NEW="${MIN_NEW:-30}"
CAND="$ROOT/models/rewriter-lora-candidate"

collect() {
  eval $PY collect_human.py 400
  export_ours
}
claude_pairs() { eval $PY import_claude_pairs.py; }
gsc() { eval $PY gsc.py pull && eval $PY gsc.py queue; }
export_ours() { (cd "$ROOT/../backend" && npx ts-node --transpile-only src/scripts/exportContentCorpus.ts); }
pairs()    { eval $PY gen_ai_pairs.py "$PAIRS"; }
scorer()   { eval $PY train_scorer.py; }
ours()     { eval $PY select_ours.py "$OURS" && eval $PY gen_ai_pairs.py "$OURS" --ours; }
lora() {
  local out="$1"
  rm -rf "$out"
  eval $PY train_data.py
  eval $PY -m mlx_lm lora --model mlx-community/Qwen2.5-1.5B-Instruct-4bit --train \
    --data "$ROOT/data/rewriter" --adapter-path "$out" \
    --iters "$ITERS" --batch-size 1 --num-layers 8 --max-seq-length 1024 \
    --learning-rate 1e-4 --mask-prompt --grad-checkpoint --steps-per-eval 100 --val-batches 25 --save-every 100 \
    2>&1 | tee "$ROOT/data/lora.log"
  eval $PY promote.py pick "$out" "$ROOT/data/lora.log"
}
rewriter() {
  lora "$CAND"
  eval $PY promote.py promote "$CAND"
}
evaluate() { eval $PY eval_rewriter.py --limit 100; }

case "$step" in
  all) collect; pairs; scorer; ours; rewriter; evaluate ;;
  retrain) export_ours; scorer; rewriter ;;
  retrain-if-due)
    rc=0; eval $PY promote.py due "$MIN_NEW" || rc=$?
    if [[ $rc -eq 0 ]]; then export_ours; scorer; rewriter
    elif [[ $rc -eq 10 ]]; then echo "retrain not due"
    else echo "due check failed rc=$rc"; exit $rc; fi ;;
  promote) eval $PY promote.py promote "$CAND" ;;
  collect|export_ours|pairs|claude_pairs|gsc|scorer|ours|rewriter|evaluate) "$step" ;;
  *) echo "usage: train.sh [all|retrain|retrain-if-due|collect|export_ours|pairs|claude_pairs|gsc|scorer|ours|rewriter|promote|evaluate]"; exit 1 ;;
esac
