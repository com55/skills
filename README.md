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

## Install

```bash
npx github:com55/skills
# or, to install just one skill/agent by name:
npx github:com55/skills --only scrutinize-reviewer
```

One command installs everything this repo has: every `skills/<name>/`
directory goes to `~/.claude/skills/` *and* `~/.agents/skills/` (the
latter is the emerging vendor-neutral convention, e.g. OpenCode reads it
too), and every `agents/*.md` goes to `~/.claude/agents/` *and*
`~/.agents/agents/` (no tool is confirmed to read that second path yet —
it's a cheap bet on the same convention extending to agents). Cursor reads
`~/.claude/skills/` and `~/.claude/agents/` natively, so this one command
covers Claude Code and Cursor both — no separate Cursor-specific step.

`--only <name>` installs just the skill and/or agent with that name (e.g.
`--only grounded-python` installs only the skill — there's no matching
agent for it, and that's fine; `--only scrutinize-reviewer` installs both
the skill and the agent, since both exist under that name).

Start a new session in your harness afterwards to pick up what was
installed.

### Alternative: `npx skills add`

If you already use [`npx skills`](https://github.com/vercel-labs/skills)
(it auto-detects installed coding agents and handles more harnesses than
just Claude Code/Cursor), it works for the skills half of this repo too —
it just has no concept of the `agents/` directory, so `scrutinize-reviewer`
installed this way only gets the skill, not the agent:

```bash
npx skills add com55/skills --skill grounded-python
npx skills add com55/skills --skill scrutinize-reviewer
# or, all of them:
npx skills add com55/skills --skill '*'
```

## Workflow glue (manual step)

The `scrutinize-reviewer` skill+agent don't self-invoke on their own — they
need a standing instruction telling the orchestrator *when* to reach for
them. Add this to your own `CLAUDE.md` (Claude Code) or `AGENTS.md` /
`~/.cursor/rules/` (Cursor):

```markdown
## Scrutinize Workflow Preferences

- **Spec-refinement loop before implementation.** After brainstorming/writing-plans produces a spec, loop it through the `scrutinize-reviewer` agent — dispatched as a fresh subagent, not run inline — before implementation starts: dispatch against the spec → report findings back → wait. Revise and re-dispatch only if asked for another round (or told up front to loop until clean). A later round may include a diff of what changed since the previous round, so scrutinize can judge whether *this revision* is actually an improvement — but keep each dispatch a fresh subagent even then, so it stays an outsider with no attachment to why the previous round happened, only to what changed. Catching problems in the spec is cheap; catching them after implementation is not.
- **Augment SDD per-task review.** In a subagent-driven-development flow, the built-in task-reviewer only checks whether a task's output matches its brief/spec (conformance). Add a scrutinize-reviewer pass per task in addition to — not instead of — that standard check, even when the task-reviewer already passed: conformant work can still have a better implementation, and scrutinize's "is there a simpler/more elegant way" step catches improvements that pure conformance review misses.
- **SDD per-task verdicts.** One review round per task is automatic; don't pause after every task by default. `ship`: continue to the next task, recording minor findings as deferred. `fix-then-ship`: fix, verify the fix independently, then continue without a per-task re-review (stop if verification fails and you can't resolve it). `rework` / `reject`: stop and wait for a decision; ask before any re-review. Save every review result, then run one combined review of the whole branch after the last task; any further round needs an explicit ask.
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

### grounded-python

Born from working with libraries that update often, libraries with
breaking changes across versions, and custom/bespoke modules and
functions. Repeatedly, an agent would write code straight from its
pretrained knowledge without checking whether that was still the correct
way to call a given library — producing code that didn't work, was
outdated, or misused the API. This skill exists to force verification of
the actual correct usage before writing, cutting off that whole failure
mode. Most useful for anyone working with custom/bespoke code, where
there's no well-known "obvious" API for the agent to fall back on and it
would otherwise just make something up. Costs a modest amount of extra
tokens per use.

### scrutinize-reviewer

Grew out of using the `scrutinize` skill from
[thananon/9arm-skills](https://github.com/thananon/9arm-skills) and
liking it a lot — it reviews code/spec quality, catches bugs and
vulnerabilities, and surfaces better ways to reach the same goal. Used it
constantly, including on specs before any implementation starts, to catch
problems and find better approaches while everything is still on paper.
Wired it into the subagent-driven-development workflow as an addition to
the existing per-task review, which normally only checks whether the
agent's output matches the spec — but matching the brief doesn't mean
it's the best way to have done it. The extra scrutinize pass catches more
issues and better approaches along the way. Changes the shape of the
workflow and uses meaningfully more tokens — worth it for anything where
getting it right matters more than moving fast.

## License

MIT
