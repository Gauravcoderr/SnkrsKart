ML="${0:A:h:h}"
REPO="${ML:h}"
PY="$ML/.venv/bin/python"

need_venv() {
  if [[ ! -x "$PY" ]]; then
    echo "No Python environment yet. Run: $ML/commands/setup.sh"
    exit 1
  fi
}

need_power() {
  [[ "${FORCE:-0}" == "1" ]] && return 0
  local ac watts pct
  ac="$(pmset -g ac 2>/dev/null)"
  watts="$(print -r -- "$ac" | awk -F'= ' '/Wattage/{gsub(/W/,"",$2); print $2}')"
  pct="$(pmset -g batt | grep -oE '[0-9]+%' | head -1 | tr -d '%')"
  if [[ -z "$watts" ]]; then
    echo "Not plugged in (battery ${pct}%). Heavy jobs can shut the Mac down. Plug in a 30W+ USB-C charger, or rerun with FORCE=1."
    exit 2
  fi
  if (( watts < 30 )); then
    echo "Charger is ${watts}W (battery ${pct}%). This job needs 30W or more. Use the Mac's own charger, or rerun with FORCE=1."
    exit 2
  fi
}

busy_check() {
  if pgrep -f "mlx_lm lora|promote.py promote|eval_rewriter.py|gen_ai_pairs.py" >/dev/null 2>&1; then
    echo "A training or evaluation job is already running. Check with commands/status.sh or stop it with commands/stop.sh."
    exit 3
  fi
}
