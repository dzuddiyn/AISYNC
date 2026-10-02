# AGENTS.md — AISYNC Repository Agent Instructions

This file is the shared operating contract for AI coding agents working in this repository, including GitHub Copilot, OpenAI Codex, and compatible future agents.

## 1. Mission

AISYNC is shared transport/write infrastructure.

The method/reasoning layer owns meaning and decisions.
AISYNC owns transport, contract validation, destination translation, persistence, verification, and factual receipts.

Do not blur those boundaries.

## 2. Work from the repository, not from user copy/paste

Before asking the user for project context, inspect the repository yourself.

Prefer to:
- read the relevant files;
- search the repository;
- inspect existing code and tests;
- run terminal commands;
- run the relevant test suite;
- inspect Git state and diffs.

Do not ask the user to paste a file, error log, code block, task definition, or architecture text when it is already available in the repository or terminal.

Ask the user only when a genuinely external decision, credential, approval, or unavailable fact is required.

## 3. Authority and read order

For implementation work, use this order:

1. `AGENTS.md` — agent operating rules.
2. `TASKS.md` — executable task queue and current task authority.
3. `DESIGN.md` — confirmed design/architecture and LOCKED boundaries.
4. `ACTION_PLAN.md` — implementation planning and findings.
5. Relevant source, contract, adapter, transport, DB, docs, proof, and test files.
6. `README.md` — project overview only; it may lag behind the execution queue.

If files disagree about the current task, `TASKS.md` wins.

If an implementation idea conflicts with a LOCKED owner decision or confirmed design, stop that implementation path and report the conflict. Do not silently rewrite the decision.

## 4. Default execution discipline

Work on one current task at a time unless the user explicitly expands scope.

For a task such as `T-007`:

1. Read the task definition and dependencies in `TASKS.md`.
2. Trace its relevant decision/design lineage.
3. Inspect the existing implementation and tests before editing.
4. Identify the smallest coherent implementation slice.
5. Make the change.
6. Run relevant tests/checks.
7. Verify actual behavior or persisted state where the task requires it.
8. Report factual evidence.
9. Update tracking/evidence files only when the result is actually proven.
10. Do not begin the next queued task automatically.

Do not mark a task PASS merely because code compiles, a command exits zero, an API returns success, or a write was attempted. Use the task's stated pass condition and required verification.

## 5. AISYNC architectural guardrails

Preserve these repository boundaries:

- ZASS Full / ZASSIMPLE / ZASSELECTION are method/reasoning layers.
- AISYNC is the shared transport/write layer.
- GitHub is the canonical artifact destination where defined by the confirmed design.
- Google Sheets is the operational/index ASC DB for v0.1 and must not silently become a competing canonical master.
- ASC Core must remain method-agnostic.
- Method-owned semantics must not be invented or rewritten by ASC.
- Native integrations are optional fast paths.
- ASC Link is the universal fallback path.
- Explicit confirmation is required before fallback persistence.
- Destination credentials must remain server-side and must not be exposed in links, browser-visible payloads, logs, tests, proofs, or committed files.
- A successful write response alone is not proof of verified persistence.
- Receipts and HISTORY must be factual and distinguish success from failure.

## 6. Change discipline

Before editing:
- inspect `git status`;
- inspect the files involved;
- look for existing tests and conventions;
- avoid speculative rewrites.

While editing:
- make the smallest coherent change;
- preserve existing interfaces unless the task requires a change;
- avoid unrelated formatting or refactors;
- do not duplicate logic that already has an owner elsewhere in the architecture.

After editing:
- inspect the diff;
- run the narrowest relevant tests first;
- run broader tests when the change can affect shared behavior;
- state what was tested and what was not tested.

## 7. Git safety

Do not commit, push, merge, rebase, reset, force-push, delete branches, or rewrite history unless the user explicitly asks for that action.

Never discard unrelated user changes.

When the working tree is not clean, distinguish pre-existing changes from changes made by the agent.

When asked to prepare work for commit, leave a clear factual summary of:
- files changed;
- tests run;
- verification result;
- remaining limitations.

## 8. Secrets and live systems

Never print or commit credentials.

Treat tokens, API keys, OAuth material, Apps Script properties, GitHub PATs, and deployment secrets as runtime-only unless the confirmed design explicitly states otherwise.

For live-write tests:
- use only the intended controlled target;
- minimize the write;
- capture factual identifiers;
- re-read/verify when the task requires persistence proof;
- never fabricate commit IDs, record IDs, timestamps, or success states.

## 9. Evidence and truthfulness

Use factual result language.

Preferred states include:
- PASS — only when the defined pass condition is proven;
- FAILED — attempted and proven unsuccessful;
- BLOCKED — cannot continue because a required dependency or external condition is unavailable;
- IN PROGRESS — implementation or verification is incomplete.

For writes, distinguish proposed state from actually persisted state.

If verification is incomplete after a write, say so explicitly. Preserve any factual identifiers already obtained without upgrading the result to verified success.

## 10. Interaction style for this repository

The user wants minimal manual handoff.

Therefore:
- act on repository context directly;
- use terminal/tools instead of asking for copy-paste;
- keep progress reports short and evidence-based;
- surface only decisions that genuinely require the owner;
- do not repeatedly explain information already present in the repository.

When the user says something equivalent to “continue T-007”, first read the repository state and continue from the current factual checkpoint.

## 11. Completion response

At the end of an implementation turn, report compactly:

- Task:
- Result:
- Changed:
- Tests:
- Verification:
- Git status:
- Next:

Do not start the Next task unless explicitly instructed.
