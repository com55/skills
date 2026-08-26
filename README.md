# com55/skills

Personal Claude Code / Cursor skills and agents, kept in one repo so they
install the same way everywhere.

## What's inside

- **`grounded-python`** (skill) — forces a docs-first protocol before
  writing Python code that touches any third-party library: verify the
  real API via [Context7](https://context7.com) (or `grep` for local
  code) before calling it, never write from memory.
- **`scrutinize-reviewer`** (skill + agent) — an outsider-perspective,
  end-to-end reviewer for a plan, PR, or code change. Questions whether
  the change should exist before checking whether it works; traces the
  real call graph, not just the diff.

## Install — skills

Uses [`npx skills`](https://github.com/vercel-labs/skills), which auto-detects
Claude Code and Cursor and installs into the right directory for each:

```bash
npx skills add com55/skills --skill grounded-python
npx skills add com55/skills --skill scrutinize-reviewer
# or, all of them:
npx skills add com55/skills --skill '*'
```

## Install — agents

`npx skills` only ever installs `SKILL.md` files — it has no concept of
subagents. This repo's `agents/` directory needs its own install step:

```bash
npx github:com55/skills
# or, to install just one agent:
npx github:com55/skills --only scrutinize-reviewer
```

This copies into `~/.claude/agents/` — Cursor reads that same directory
natively (alongside its own `~/.cursor/agents/`), so this one step covers
both Claude Code and Cursor.

Start a new session in your harness afterwards to pick up the new agent.

## Workflow glue (manual step)

The `scrutinize-reviewer` skill+agent don't self-invoke on their own — they
need a standing instruction telling the orchestrator *when* to reach for
them. Add this to your own `CLAUDE.md` (Claude Code) or `AGENTS.md` /
`~/.cursor/rules/` (Cursor):

```markdown
## Scrutinize Workflow Preferences

- **Spec-refinement loop before implementation.** After brainstorming/writing-plans produces a spec, loop it through the `scrutinize-reviewer` agent — dispatched as a fresh subagent, not run inline — before implementation starts: dispatch against the spec → report findings back → revise the spec → re-dispatch → repeat until the verdict is clean (ship / fix-then-ship with only nits left). A later round may include a diff of what changed since the previous round, so scrutinize can judge whether *this revision* is actually an improvement — but keep each dispatch a fresh subagent even then, so it stays an outsider with no attachment to why the previous round happened, only to what changed. Catching problems in the spec is cheap; catching them after implementation is not.
- **Augment SDD per-task review.** In a subagent-driven-development flow, the built-in task-reviewer only checks whether a task's output matches its brief/spec (conformance). Add a scrutinize-reviewer pass per task in addition to — not instead of — that standard check, even when the task-reviewer already passed: conformant work can still have a better implementation, and scrutinize's "is there a simpler/more elegant way" step catches improvements that pure conformance review misses. Non-blocking findings are reported, not auto-applied — acting on them is still the user's/orchestrator's call.
```

This is a manual copy-paste, on purpose — an installer that auto-edits a
file it doesn't own is a good way to clobber something you actually meant
to keep.

## Credits

`scrutinize-reviewer` builds on the `scrutinize` skill originally from
[thananon/9arm-skills](https://github.com/thananon/9arm-skills) — full
credit to that repo for the underlying review methodology (outsider
stance, intent-first questioning, end-to-end tracing) this agent wraps and
extends with subagent dispatch + spec-loop/SDD usage patterns.

## Origin of each skill

*(to be filled in — background/history per skill)*

## License

MIT
