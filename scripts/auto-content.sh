#!/bin/zsh
# ---------------------------------------------------------------------------
# SNKRS CART — unattended content pipeline runner
#
# Rotates the blog / drop / sneaker skills across invocations and produces a
# REVIEWABLE DRAFT BRANCH. It deliberately does NOT publish and does NOT send
# marketing email.
#
# Invoked by ~/Library/LaunchAgents/com.snkrscart.autocontent.plist every
# 172800s (2 days). Also safe to run by hand:
#
#   ./scripts/auto-content.sh              # rotate to whichever skill is next
#   ./scripts/auto-content.sh blog         # force a specific skill
#   DRY_RUN=1 ./scripts/auto-content.sh    # print the plan, invoke nothing
#
# Design note: git is owned entirely by THIS script, never by the model. The
# branch is cut before Claude is invoked and pushed after it exits, and main is
# asserted to never be the push target. The prompt separately forbids git and
# email, but that is defence in depth, not the primary control.
# ---------------------------------------------------------------------------
set -uo pipefail

# --- launchd gives us almost no environment, so be explicit -----------------
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# `claude` resolves its keychain auth via the process identity. Without USER /
# LOGNAME it reports "Not logged in · Please run /login" even though the
# keychain entry is perfectly readable. Backfill them if launchd did not.
: "${USER:=$(/usr/bin/id -un)}"
: "${LOGNAME:=$USER}"
: "${SHELL:=/bin/zsh}"
: "${TMPDIR:=/tmp}"
export USER LOGNAME SHELL TMPDIR

REPO="$HOME/snkrs-cart"
CLAUDE_BIN="$HOME/.local/bin/claude"
STATE_FILE="$REPO/.auto-content-state"
LOG_DIR="$HOME/Library/Logs"
LOG="$LOG_DIR/snkrscart-autocontent.log"
LOCK_DIR="/tmp/snkrscart-autocontent.lock"

# Per-run spend ceiling. This is the real blast-radius limit on an unattended
# run, more so than tool permissions. Override with MAX_USD=... if needed.
MAX_USD="${MAX_USD:-8}"
SKILL_ROTATION=(blog drop sneaker)

mkdir -p "$LOG_DIR"

log() { print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }
die() { log "FATAL: $*"; release_lock; exit 1; }

release_lock() { [[ -d "$LOCK_DIR" ]] && rmdir "$LOCK_DIR" 2>/dev/null; }

# --- keep the log from growing without bound -------------------------------
rotate_log() {
  if [[ -f "$LOG" ]]; then
    local lines
    lines=$(wc -l < "$LOG" | tr -d ' ')
    if (( lines > 5000 )); then
      tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
    fi
  fi
}

# --- single-instance guard (mkdir is atomic; macOS has no flock binary) -----
acquire_lock() {
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    # Reap a lock left behind by a crashed run.
    if [[ -f "$LOCK_DIR/pid" ]]; then
      local old
      old=$(cat "$LOCK_DIR/pid" 2>/dev/null)
      if [[ -n "$old" ]] && ! kill -0 "$old" 2>/dev/null; then
        log "stale lock from pid $old, reclaiming"
        rm -rf "$LOCK_DIR"
        mkdir "$LOCK_DIR" 2>/dev/null || return 1
      else
        return 1
      fi
    else
      return 1
    fi
  fi
  print -r -- "$$" > "$LOCK_DIR/pid"
  return 0
}

# --- pick this run's skill --------------------------------------------------
next_skill() {
  local forced="${1:-}"
  if [[ -n "$forced" ]]; then print -r -- "$forced"; return; fi
  local idx=0
  [[ -f "$STATE_FILE" ]] && idx=$(cat "$STATE_FILE" 2>/dev/null | tr -dc '0-9')
  [[ -z "$idx" ]] && idx=0
  local count=${#SKILL_ROTATION[@]}
  # zsh arrays are 1-indexed
  local pick="${SKILL_ROTATION[$(( idx % count + 1 ))]}"
  # A dry run must not consume a rotation slot.
  [[ "${DRY_RUN:-0}" == "1" ]] || print -r -- "$(( (idx + 1) % count ))" > "$STATE_FILE"
  print -r -- "$pick"
}

# --- the draft-mode contract handed to the model ----------------------------
build_prompt() {
  local skill="$1" branch="$2"
  cat <<PROMPT
/${skill}

AUTOMATED DRAFT RUN. You are running unattended from a launchd timer with no
human watching. These constraints override the skill's own Step 5b and Step 6:

1. DO NOT run any git command. Not add, not commit, not push, not checkout.
   This script already put you on branch "${branch}" and will handle the commit
   and push after you exit. If you run git yourself you will corrupt that.

2. DO NOT send marketing email. Skip the blog skill's Step 5b entirely. Do not
   run sendBlogEmail.ts. Do not edit it. A human triggers the blast after review.

3. Seed blogs with published: false. A human flips this to true after reading
   the drafts. Everything else about the seed step is unchanged.

4. Run the verifyBlogs.ts gate (Step 4b) and do not stop until it prints that
   all blogs passed. This is the only quality check in an unattended run, so
   treat a FAIL as blocking, not advisory.

5. Leave the new blog objects IN seedBlogs.ts. Do not strip them. The human
   reviewer needs to read them in the diff, and this script commits that file.

6. If research is blocked (403s, no verifiable facts, nothing newsworthy this
   week), produce FEWER items or none at all and say so plainly. Do not pad and
   do not invent facts to hit a count. A run that writes nothing and explains
   why is a successful run.

End your output with a line starting "SUMMARY:" giving what you created and any
source that was unreachable.
PROMPT
}

# ===========================================================================
# --- environment self-test ---------------------------------------------------
# Run through launchd (`launchctl kickstart`) to prove the real scheduled
# context works, without spending a full pipeline run to find out.
probe() {
  local ok=1
  log "--- probe start (uid=$(/usr/bin/id -u) user=${USER:-UNSET}) ---"
  log "probe: PATH=$PATH"
  log "probe: HOME=${HOME:-UNSET} LOGNAME=${LOGNAME:-UNSET} TMPDIR=${TMPDIR:-UNSET}"

  for bin in node npx git "$CLAUDE_BIN"; do
    if command -v "$bin" >/dev/null 2>&1 || [[ -x "$bin" ]]; then
      log "probe: OK   found $bin"
    else
      log "probe: FAIL missing $bin"; ok=0
    fi
  done

  if [[ -d "$REPO/.git" ]]; then log "probe: OK   repo at $REPO"
  else log "probe: FAIL no repo at $REPO"; ok=0; fi

  if [[ -r "$REPO/backend/.env" ]]; then log "probe: OK   backend/.env readable"
  else log "probe: FAIL backend/.env unreadable (secrets unavailable)"; ok=0; fi

  # The one that actually bites: can claude authenticate in this context?
  local out
  out="$(print -r -- 'reply with the single word READY' \
        | "$CLAUDE_BIN" -p --max-budget-usd 0.5 2>&1 | tr -d '\r' | tail -2)"
  if print -r -- "$out" | grep -qi 'READY'; then
    log "probe: OK   claude authenticated"
  else
    log "probe: FAIL claude auth — got: ${out:0:160}"
    ok=0
  fi

  if (( ok )); then log "--- probe PASSED: scheduled runs will work ---"; return 0
  else log "--- probe FAILED: fix the above before trusting the timer ---"; return 1; fi
}

main() {
  rotate_log

  if [[ "${1:-}" == "--probe" || "${PROBE:-0}" == "1" ]]; then
    probe; return $?
  fi

  local forced="${1:-}"
  local skill; skill="$(next_skill "$forced")"

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    log "DRY_RUN — would run skill='$skill' budget=\$$MAX_USD in $REPO"
    build_prompt "$skill" "content/auto-${skill}-DRYRUN"
    return 0
  fi

  acquire_lock || { log "another run holds the lock, skipping this tick"; exit 0; }
  trap release_lock EXIT INT TERM

  [[ -x "$CLAUDE_BIN" ]] || die "claude not executable at $CLAUDE_BIN"
  [[ -d "$REPO/.git" ]]  || die "no git repo at $REPO"
  command -v node >/dev/null || die "node not on PATH ($PATH)"

  cd "$REPO" || die "cannot cd $REPO"

  # Refuse to run on a dirty tree; we would otherwise commit unrelated work.
  if [[ -n "$(git status --porcelain)" ]]; then
    die "working tree dirty, refusing to run. Commit or stash first."
  fi

  local branch="content/auto-${skill}-$(date '+%Y%m%d-%H%M')"

  log "=== run start: skill=$skill branch=$branch budget=\$$MAX_USD ==="

  git fetch --quiet origin           || log "warn: git fetch failed, continuing on local main"
  git checkout --quiet main          || die "cannot checkout main"
  git pull --quiet --ff-only origin main 2>/dev/null || log "warn: pull skipped"
  git checkout --quiet -b "$branch"  || die "cannot create branch $branch"

  local prompt; prompt="$(build_prompt "$skill" "$branch")"
  local rc=0

  print -r -- "$prompt" | "$CLAUDE_BIN" \
      -p \
      --permission-mode bypassPermissions \
      --max-budget-usd "$MAX_USD" \
      --effort high \
      >> "$LOG" 2>&1 || rc=$?

  log "claude exited rc=$rc"

  # --- commit whatever the run produced ------------------------------------
  local current; current="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$current" == "main" ]]; then
    die "expected branch $branch but HEAD is main — refusing to push"
  fi

  if [[ -z "$(git status --porcelain)" ]]; then
    log "no file changes produced; deleting empty branch"
    git checkout --quiet main
    git branch --quiet -D "$branch"
    log "=== run end: nothing to review ==="
    return 0
  fi

  git add -A
  git -c user.name="SNKRS CART Automation" \
      -c user.email="automation@snkrscart.com" \
      commit --quiet -m "content(draft): automated ${skill} run $(date '+%Y-%m-%d')

Unattended draft from scripts/auto-content.sh. Blogs seeded with
published: false. No marketing email sent. Review before merging."

  if git push --quiet -u origin "$branch" 2>>"$LOG"; then
    log "pushed $branch — review at https://github.com/Gauravcoderr/SnkrsKart/compare/$branch?expand=1"
  else
    log "warn: push failed; branch $branch exists locally only"
  fi

  git checkout --quiet main
  log "=== run end: branch $branch ready for review ==="
}

main "$@"
