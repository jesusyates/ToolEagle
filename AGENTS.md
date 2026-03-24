# ToolEagle — Instructions for AI assistants

**All project rules and memory live in one file only:**

→ **`docs/MEMORY.md`**

On the **first** substantial turn in a chat (or when the user says **「读记忆本」** / you need to re-sync after edits), **read `docs/MEMORY.md`**. Do **not** re-read on every user message unless a re-read is needed (see rule file below).

There are **no** separate architecture / country-site / V98 rule docs — everything is merged there.

**Information hierarchy** (when docs disagree): see **`docs/MEMORY.md` § 零点五·一** — MEMORY wins for direction; `PROJECT-STATUS-REPORT-FOR-CHATGPT.md` describes current state; code is ground truth for behavior; historical `docs/V*.md` is background only.

**Memory alignment (token-efficient):** `.cursor/rules/00-memory-read-policy.mdc` instructs the assistant to **Read `docs/MEMORY.md` once per conversation** before the first substantive reply, and **again only when needed** (user asks, file changed, major decision, or stale context)—**not** before every user message. Edit only `docs/MEMORY.md` for rule content.
