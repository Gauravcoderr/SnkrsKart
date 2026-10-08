#!/bin/zsh
set -uo pipefail
pids="$(pgrep -f 'mlx_lm lora|promote.py promote|eval_rewriter.py|gen_ai_pairs.py|train.sh (rewriter|retrain|promote)')"
if [[ -z "$pids" ]]; then echo "Nothing running."; exit 0; fi
echo "Stopping: $(echo $pids | tr '\n' ' ')"
kill $=pids 2>/dev/null
sleep 2
echo "Stopped. Saved data and the live model are untouched; a partly trained candidate can be retrained with commands/train-rewriter.sh"
