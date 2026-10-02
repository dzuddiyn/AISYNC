# GitHub Copilot Instructions — AISYNC

Use `AGENTS.md` as the primary repository-wide operating contract.

Before making changes:
1. Read `AGENTS.md`.
2. Read `TASKS.md` and identify the current task.
3. Read the relevant sections of `DESIGN.md` and `ACTION_PLAN.md`.
4. Inspect the existing implementation, tests, Git status, and related files.

Working rules:
- Work on the current task only unless the user explicitly expands scope.
- Prefer repository search, file inspection, terminal commands, and test execution over asking the user to copy/paste project content.
- Treat `TASKS.md` as the authority for the current execution task if summaries elsewhere are stale.
- Preserve LOCKED owner decisions and confirmed design boundaries.
- Make the smallest coherent change.
- Run relevant tests and verify actual behavior before claiming PASS.
- Do not fabricate write, commit, record, verification, or receipt evidence.
- Keep credentials and secrets out of source, logs, links, browser-visible payloads, tests, and proofs.
- Do not commit, push, merge, rebase, reset, force-push, delete branches, or rewrite history unless the user explicitly asks.

For a command like "Continue T-007":
- locate T-007 in `TASKS.md`;
- inspect its dependencies and lineage;
- continue from the factual repository checkpoint;
- implement, test, and verify only T-007;
- update evidence/tracking only when justified;
- stop before T-008.

At completion, report:
- Task
- Result
- Changed
- Tests
- Verification
- Git status
- Next

Keep the report concise and evidence-based.
