---
name: goal
description: "Autonomous goal-execution framework. Auto-enhances the user's prompt, self-reviews the codebase, defines AIM and ROLE, executes in a self-checking loop until every success criterion is met — no mid-task check-ins. Trigger on: /goal, 'set a goal', 'goal mode', 'goal:', 'execute this goal'. Accepts task description as argument."
---

# Goal Execution Framework — Autonomous Mode

When invoked with `$ARGUMENTS`, run all phases in sequence without stopping for approval.

---

## Phase -1 — ENHANCE (auto, silent, always first)

Sharpen the raw input using this diagnostic checklist before doing anything else:

| Dimension | Fix if weak |
| --------- | ----------- |
| **Role** | Add `You are a [specific expert]` to the task framing |
| **Target** | Replace pronouns with concrete file/function/route names (infer from context) |
| **Success criteria** | Add binary verifiable conditions (test passes, tsc clean, UI shows X) |
| **Constraints** | Add explicit `Do NOT touch` guards |
| **Scope** | Split compound tasks into ordered steps |
| **CoT need** | Add "Think through X before Y" if task requires diagnosis or tradeoff analysis |
| **Stack anchor** | Name the actual framework/runtime where it affects the solution |

Show the sharpened version before proceeding:

```
## GOAL (enhanced)
[Role-first. Concrete targets. CoT signal if needed. Constraints. Success criteria.]

*Enhanced from: "[original raw input]"*
```

Then immediately continue to Phase 0. Do NOT ask "should I run this?".

---

## Phase 0 — CODEBASE INVESTIGATION (silent)

Read before assuming. Run these in parallel:

1. **Locate** — `grep` / `find` for the exact files, functions, routes, types tied to the task
2. **Understand current state** — what does the code do NOW? What is broken, missing, or suboptimal?
3. **Map dependencies** — what calls what? What breaks if X changes?
4. **Spot hard constraints** — TypeScript types, existing tests, env vars, config flags, API contracts
5. **Identify failure modes** — what are the 2-3 most likely ways the implementation could fail or regress?

Do this silently. Phase 1's AIM must be grounded in what you observed — not assumptions.

---

## Phase 1 — AIM

State the goal concisely, informed by Phase 0:

```
## AIM
[One sentence: what will be TRUE when this is done that is NOT true now.]

### Success criteria (binary — all must pass before DONE)
- [ ] [Verifiable criterion 1 — command / observable / state change]
- [ ] [Verifiable criterion 2]
- [ ] [Verifiable criterion 3]

### Pre-flight risk check
- Risk 1: [most likely failure mode from Phase 0] → Mitigation: [how to guard against it]
- Risk 2: [second failure mode] → Mitigation: [...]

### Scope boundary
- Touch: [files / systems in scope]
- Do NOT touch: [explicit out-of-scope items]
```

---

## Phase 2 — ROLE

Declare the specific role and execution plan:

```
## ROLE
[Exact job title — e.g. "Senior TypeScript Developer", "MongoDB Schema Architect", "Next.js App Router Specialist", "Debugging Specialist"]

### Execution plan
1. [Step 1 — specific file, tool, or action. Mark parallel steps with ⟂]
2. [Step 2 ⟂]  ← these two run in parallel
3. [Step 3 — depends on 1 and 2]
...
N. [Self-check — verify against each success criterion]
```

Steps marked ⟂ run with parallel tool calls. Dependent steps wait.

---

## Phase 3 — EXECUTE + SELF-LOOP

Execute each step. Log one line per completed step:
`✓ Step N — [what was done, file:line if relevant]`

### Self-check after all steps complete

```
## SELF-CHECK
- [ criterion 1 ] → PASS / FAIL — [evidence: command output, file diff, or observation]
- [ criterion 2 ] → PASS / FAIL — [evidence]
- [ criterion 3 ] → PASS / FAIL — [evidence]
```

### On failure — critique before re-executing

If any criterion FAILs, do NOT simply re-execute. First generate a textual critique:

```
## CRITIQUE (Step N failed)
Root cause: [what actually went wrong — from observed output, not guessing]
Approach flaw: [why the previous approach produced this outcome]
Revised approach: [what changes to the execution plan address the root cause]
```

Then revise the execution plan and re-execute from the failing step. Repeat until all pass.

Loop limit: 3 attempts per criterion. After 3, classify as a true blocker.

### True blockers — only stop here

- Missing secret / env var you cannot generate
- Requires user action outside the codebase (dashboard, external API key, manual deploy)
- Genuine ambiguity unresolvable from code or context after investigation

State blockers precisely: what is missing, where it is needed, what the user must provide.

---

## Phase 4 — DONE RECEIPT

Only emit when all criteria pass:

```
## DONE
✓ [criterion 1] — verified by [command / file / observation]
✓ [criterion 2] — verified by [command / file / observation]
✓ [criterion 3] — verified by [command / file / observation]

[One sentence: what changed. One sentence: what's next if relevant.]
```

---

## Execution rules

- **No mid-task check-ins.** Phase -1 → 0 → 1 → 2 → 3 → 4 runs uninterrupted.
- **Parallel tool calls** for all independent steps (marked ⟂).
- **Critique before retry.** On failure, diagnose root cause from actual output, then revise approach — not brute-force re-execution.
- **Self-prompt to continue.** If a step reveals additional in-scope work, incorporate it and keep going.
- **Scope discipline.** Only touch what the execution plan covers. Note out-of-scope issues in DONE receipt.
- **No filler.** No "Great!", "Certainly!", "Happy to help!". Just the phases.
- **One clarifying question maximum.** Only if the task is genuinely ambiguous after reading the code. Then continue immediately after the answer.

---

## Example run

**User:** `/goal fix the og image thing in utils`

**Phase -1 — ENHANCE:**
```
## GOAL (enhanced)
You are a Senior TypeScript Developer.

In frontend/lib/utils.ts, fix getOgImageUrl() so it injects the Cloudinary OG transform (c_fill,w_1200,h_630,q_auto,f_jpg) after /upload/ without stripping folder path segments like blog-images/ or products/.

Think through what the current regex matches against 3 URL shapes before writing any code.

Do NOT touch: callers of getOgImageUrl(), next.config.mjs, any other function in utils.ts.

Done when:
- /upload/blog-images/cover.jpg → /upload/c_fill,w_1200,h_630,q_auto,f_jpg/blog-images/cover.jpg
- Existing transforms are replaced, not duplicated
- npx tsc --noEmit exits 0

*Enhanced from: "fix the og image thing in utils"*
```

**[Phase 0 — silent: Read utils.ts:27-36, grep callers, trace regex against 3 URL shapes]**

**Phase 1 — AIM:**
```
## AIM
getOgImageUrl() preserves Cloudinary folder paths when injecting the OG transform.

### Success criteria
- [ ] /upload/blog-images/cover.jpg → /upload/c_fill,.../blog-images/cover.jpg
- [ ] Existing transforms replaced, not duplicated
- [ ] tsc --noEmit: 0 errors

### Pre-flight risk check
- Risk 1: regex also matches plain folder names like blog-images/ → Mitigation: anchor pattern to transform-specific token structure (letter_value)
- Risk 2: callers pass non-Cloudinary URLs → Mitigation: guard clause already present, don't remove it

### Scope boundary
- Touch: frontend/lib/utils.ts (getOgImageUrl only)
- Do NOT touch: callers, next.config.mjs
```

**Phase 2 — ROLE:**
```
## ROLE
Senior TypeScript Developer — regex fix for Cloudinary transform injection

### Execution plan
1. Trace current regex against 3 URL shapes to confirm failure mode ⟂
2. Write corrected regex anchored on transform token pattern ⟂
3. Edit utils.ts:29
4. Run: cd frontend && npx tsc --noEmit
5. Self-check all 3 criteria
```

**Phase 3 — EXECUTE:**
✓ Step 1 — confirmed: blog-images/ matched because blog satisfies [a-z]+, root cause clear
✓ Step 2 — new regex matches only segments where token after _ is alphanumeric (c_fill, w_1200), not plain words
✓ Step 3 — edited utils.ts:29
✓ Step 4 — tsc: 0 errors

```
## SELF-CHECK
- [folder path preserved] → PASS — blog-images/ survives transform injection
- [existing transforms replaced] → PASS — c_fill,w_800/ replaced correctly
- [tsc passes] → PASS — 0 errors
```

```
## DONE
✓ Folder paths preserved — regex anchored on transform-specific pattern
✓ Existing transforms replaced — verified against 3 URL shapes
✓ tsc --noEmit: 0 errors

Fix is in frontend/lib/utils.ts:29. No callers needed updating.
```
