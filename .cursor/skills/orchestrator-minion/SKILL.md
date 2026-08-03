---
name: orchestrator-minion
description: Split multi-step work into TASK.md waves and parallel Minion sessions.
---

# Orchestrator → Minion

## Orchestrator (this chat)

1. Copy `docs/TASK.template.md` → `docs/TASK.md`.
2. Atomic checkboxes; waves with **no overlapping files**.
3. Do **not** implement code in the orchestrator session.

## Minion (fresh Composer + Grok 4.5)

1. One checkbox only.
2. Implement → `make quick-check` → mark `[x]` in `docs/TASK.md`.
3. Close the chat.

## Parallel

Open 3–4 Minions per wave when paths don't overlap. Serialize if shared file/schema/dependency A→B.
