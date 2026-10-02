---
mode: agent
description: Continue one AISYNC task from the repository's current factual checkpoint.
---

Continue the AISYNC task identified by ${input:taskId:Task ID, e.g. T-007}.

Follow these rules:

1. Read `AGENTS.md` first.
2. Read `.github/copilot-instructions.md`.
3. Locate ${input:taskId} in `TASKS.md` and treat that task definition as execution authority.
4. Read only the relevant lineage and constraints from `DESIGN.md` and `ACTION_PLAN.md`.
5. Inspect the existing implementation, tests, and Git state before editing.
6. Continue from the current factual repository checkpoint; do not restart the task from scratch.
7. Implement only the smallest coherent slice needed for ${input:taskId}.
8. Run relevant tests and verify actual behavior.
9. Update tracking/evidence files only when the result is factually proven.
10. Do not start the next queued task.
11. Do not commit, push, merge, rebase, reset, or rewrite history unless explicitly instructed.

At the end, report only:

- Task:
- Result:
- Changed:
- Tests:
- Verification:
- Git status:
- Next:
