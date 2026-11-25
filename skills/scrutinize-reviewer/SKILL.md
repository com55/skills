---
name: scrutinize-reviewer
description: Usage guide for the `scrutinize-reviewer` subagent (Agent tool) — when to dispatch it and how to run its two recurring patterns (spec-refinement loop before implementation, SDD per-task augmentation). Invoke this before dispatching the scrutinize-reviewer agent if you haven't already read it this session, or whenever deciding whether an outsider-perspective review is warranted right now.
---

# Using the scrutinize-reviewer agent

This skill is read by the orchestrator (you) to decide **when** and **how** to dispatch the `scrutinize-reviewer` subagent. The agent itself only needs to know how to *do* the review once running — that content lives in its own file, not here.

## When to invoke the agent

- **Reviewing a PR or diff.** The user hands you a branch, commit range, or PR number and wants a real second opinion, not a rubber stamp.
- **Sanity-checking a plan or design doc before it's built.** The user wants to know if the approach is sound before committing engineering time to it.
- **Gating a spec before implementation (loop pattern).** A spec/plan just came out of brainstorming or writing-plans. Before any code gets written, run the loop below. Catching spec problems here is cheap; catching them after implementation is not.
- **Augmenting per-task review in an SDD (subagent-driven-development) flow.** The flow's built-in task-reviewer only checks whether a task's output matches its brief/spec — but conformant work can still have a better implementation. Dispatch scrutinize-reviewer alongside (or after) the standard task-review, even when the task-reviewer already passed.
- **Getting a genuinely outsider opinion on a change.** Someone (the user, or you) already reasoned their way to a conclusion and needs a reviewer with zero attachment to that reasoning.

## Usage pattern: spec-refinement loop

1. A spec/plan comes out of brainstorming, writing-plans, or similar.
2. Dispatch `scrutinize-reviewer` against the spec (fresh subagent — new dispatch, not a continued conversation).
3. Report findings/verdict back to whoever owns the spec — then **stop and wait**. Do not revise the spec or re-dispatch on your own.
4. Only continue if the user asks for another round, or told you upfront to loop automatically until clean. If they do: revise the spec based on the findings, then re-dispatch — optionally include a diff of what changed since the last round, so the reviewer can also judge whether *this revision* is actually an improvement, not just review the new spec cold.
5. Repeat 3-4 (report → wait → revise-if-asked → re-dispatch) until the verdict is ship / fix-then-ship with only nits left.

Keep each dispatch a fresh subagent even when passing a diff for context — the point is the reviewer has no attachment to *why* the previous round happened, only to what changed.

**Do not auto-loop.** Each round can run on an expensive model, so it has a real per-round cost — a "reject"/"rework" verdict is a reason to report and ask, not a trigger to silently re-dispatch.

## Usage pattern: SDD per-task augmentation

When running subagent-driven-development (or any variant of it), dispatch `scrutinize-reviewer` as an extra pass per task, in addition to — not instead of — the flow's normal task-reviewer. The verdict decides whether to continue to the next task or stop. Don't pause after every task by default: it slows the run down for no benefit.

```
task done → verify independently → dispatch scrutinize (one round, automatic) → read the verdict
  → ship:           ledger → short progress report → next task
  → fix-then-ship:  dispatch fix (subagent) → verify independently → ledger → short progress report → next task
  → rework/reject:  ledger → report → STOP and wait for a decision
after the last task → one combined final review of the whole branch
```

If the user or the project's own instructions define a different pacing, follow those.

- Task-reviewer verdict (the flow's own, if it has one) = conformance to brief. Scrutinize verdict = is this actually the best way to have done it. A task can pass the first and still get a non-trivial finding from the second.
- **Verify independently first**, both before the initial scrutinize dispatch and after any fix — check the implementer's/fixer's actual output yourself (diff, tests), don't hand scrutinize a self-report you haven't looked at.
- **One round per task is automatic.** Dispatch scrutinize once per task without asking first — that's the whole point of the augmentation.
- **Act on the verdict:**
  - `ship`: continue to the next task without asking. Record minor findings and nits in the ledger as deferred.
  - `fix-then-ship`: fix according to the review (as its own subagent task), verify the fix independently, then continue to the next task without asking and without a per-task re-review. If the verification fails and you can't resolve it, stop and report.
  - `rework` / `reject`: stop, report the findings, and wait for a decision. If a fix is chosen, dispatch it as its own subagent task, verify it independently, and **ask before dispatching scrutinize round 2** (and every later round). Cap the fix-loop rounds the way the parent SDD flow does.
  - A finding that's really about the task's brief/spec rather than the implementation: surface it instead of silently picking a side.
- **Defer, don't fix everything on a `ship`.** Carry deferred findings explicitly into whichever later/related task's own dispatch prompt they belong to, or into the final review.
- **Keep the full results.** For every task, save the verdict, every finding, what was fixed and how it was verified in the ledger, and give a short progress report as you go.
- **Review everything together at the end.** After the last task, run one combined final review of the whole branch, giving it all the saved results so it can check the work and fixes together. Any further review round after that needs an explicit ask.

## Model selection

You choose the model when you dispatch, via the Agent tool's `model` parameter — the agent itself can't change what it's running as once it's started. `inherit` is the floor: never dispatch below it regardless of perceived task size, since the entire point of this agent is catching what a weaker pass would miss.

- **Default / low-risk** (routine PR, internal tooling, easily reverted): dispatch with `inherit`.
- **High-risk** (security-sensitive code, prod/infra changes, data migrations, anything hard to reverse, or a plan with a large blast radius): override to the strongest model your harness makes available (e.g. `opus`/`fable` on Claude Code).
- When in doubt about the risk level, treat it as high-risk.
- If a returned report flags that the actual stakes were higher than the dispatch model assumed, re-dispatch at a stronger model rather than accepting the under-powered pass — don't let a single "inherit" review stand as final on something that turned out to touch auth/prod/irreversible state.

## Dispatch checklist

- Pick the model per "Model selection" above.
- Give the subagent everything it needs in the prompt — it starts with zero context. For a diff-aware re-dispatch, include both the current artifact and what changed since the last round.
- Read the returned verdict and act on it as the matching usage pattern above says (for a one-off or spec review, report and stop). A "reject" or "rework" verdict always means the next step is the owner's call, not an automatic re-loop.

## Fallback: no installed agent

`npx skills add` only ever installs this `SKILL.md` (plus files bundled inside this skill's own directory) — it has no concept of the top-level `agents/` directory this repo also ships, so a fresh `npx skills add com55/skills --skill scrutinize-reviewer` alone does **not** give you the native `scrutinize-reviewer` subagent.

If no `scrutinize-reviewer` subagent is available in this session (not installed, or the harness doesn't support custom agents at all): read `references/agent-instructions.md`, relative to this skill's own base directory (the "Base directory for this skill: .../scrutinize-reviewer" line every skill invocation reports), and dispatch it through whatever generic subagent/task-dispatch tool the harness provides — pass that file's content as the subagent's prompt. The model-selection guidance above still applies to that dispatch.
