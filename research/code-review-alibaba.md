# OpenCodeReview: how it reviews code

_Researched 2026-10-02. Evidence: **[F]** fetched and read first-hand, **[S]** search snippet or summariser output only, **[I]** my inference. Subject: `alibaba/open-code-review` (CLI `ocr`, Apache-2.0, 43k stars, v1.12.11) — the dictated name matches it exactly and it ships source, prompts and a paper. Runners-up: Qoder CN (ex-Tongyi Lingma) `/code-review` and "Ultra Review" sub-agents (closed, IDE-only) [S]; `alibaba/aacr-bench` (the benchmark, not a reviewer) [F]; `spencermarx/open-code-review` (same name, not Alibaba) [F]._

## Summary

- **Shape.** A script picks the files, then one sub-agent per _file group_ runs in
  parallel (8 at a time). Each agent carries every review dimension as one checklist.
  There is no fan-out by dimension and no agent per bug hypothesis. [F]
- **Speed.** 1m23s per PR against 13m06s for Claude Code `/code-review` on the same model,
  at about 1/15 of the tokens. The model spends no turns on triage, tools return bounded
  output, and every auxiliary step is a single request with no tools. [F]
- **Verification.** One diff-only "prove it wrong or approve" request per group, not one
  agent per finding. It is a single request without tools and, on a strong model, deletes
  only 2–3% of comments (estimate). Precision is earned inside the finder. [F] [I]
- **Models.** One model for every step. `--effort` means review _rounds_ (1/2/3), not
  reasoning depth. Thinking is disabled by default in CI. No tiering was ever measured. [F]
- **The trade.** Recall is 20.0% against Claude Code's 28.9%. The system buys precision
  with recall, on a vendor benchmark, with no ablations. It does not show "faster with no
  loss"; copy its speed mechanisms, not its recall. [F]

## Pipeline

Current source, v1.12.11. The paper covers v1.3.1: per-file agents, one round. [F]

| #   | Stage  | Model requests        | What happens                                                                                                  |
| --- | ------ | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Select | 0                     | Drop binary, secret, excluded, unsupported, deleted, and over-size files. Test files are excluded by default. |
| 2   | Rules  | 0                     | First matching glob picks one checklist per file (54 built-in).                                               |
| 3   | Group  | 0 or 1                | Under 4 files: none. Otherwise one request over file _metadata_ only.                                         |
| 4   | Plan   | 0 or 1 per group      | Only when a file has ≥50 changed lines, or 2+ files total ≥100. No tools.                                     |
| 5   | Review | tool loop, ≤100 turns | Six tools. Findings leave through `code_comment`.                                                             |
| 6   | Anchor | 0, rarely 1           | String-match the quoted snippet to line numbers, off the main loop.                                           |
| 7   | Filter | 1 per group per round | Diff-only falsification. Deletes, never adds.                                                                 |
| 8   | Rounds | repeat 5–7            | Up to 1/2/3 passes; stops when a pass adds nothing.                                                           |

**Fan-out is by file group.** The paper rejects both ends: one agent over the whole change
"dilutes the signal", and "overly fine partitioning (e.g., per hunk or per function
review) maximizes parallelism but fragments a coherent change across isolated agents". [F]
Groups are semantic bundles (interface + implementation, i18n variants), at most 10 files.
Under 4 files the grouping request is skipped: all files share one agent if total churn is
under 200 lines, otherwise one agent per file. [F]

**Dimensions are a checklist, not agents.** The rule document for a file's language is
pasted into the one prompt: correctness, security, performance, maintainability, tests.
**Hypotheses are generated, not fanned out.** The plan request returns a numbered list,
`[high|medium|low]` plus the tool calls that would check each, and the _same_ agent then
works through it. The prompt says "Do not invent issues to fill the list." [F]

**Dedupe is structural.** Each agent owns its files: "never produce comments targeting
files outside it". Later rounds receive earlier findings with "Do not repeat them." There
is no post-hoc dedupe on the review path; near-duplicates are an open bug (#709).
**Caps:** 30 confirmed findings per group ends further rounds; 100 tool turns, then one
"grace round" limited to `code_comment` and `task_done`; no cap on total comments. [F]

## Speed

Vendor benchmark, 200 PRs; median 152 changed lines, mean 242, maximum 971 (my count over
the 196 samples in `positive_samples.json`). OpenCodeReview rows are v1.3.1. [F]

| System, model                | Tokens in / out per PR | Avg time | Precision | Recall |
| ---------------------------- | ---------------------- | -------- | --------- | ------ |
| OCR, Claude-4.6-Opus         | 375K / 10K             | 1m23s    | 33.9%     | 20.0%  |
| OCR, Claude-4.8-Opus         | 342K / 11K             | 1m06s    | 37.8%     | 11.7%  |
| OCR, GPT-5.5                 | 409K / 13K             | 2m51s    | 32.1%     | 15.5%  |
| OCR, Deepseek-V4-Pro         | 350K / 44K             | 6m28s    | 30.6%     | 12.7%  |
| Claude Code, Claude-4.6-Opus | 5,603K / 60K           | 13m06s   | 7.2%      | 28.9%  |
| Claude Code, Claude-4.8-Opus | 2,039K / 23K           | 5m38s    | 15.9%     | 12.7%  |

Where the time goes away:

- **No model turns on triage.** Selection, rule matching and the changed-file list are
  computed and pasted into the prompt. The agent starts on the diff. [F]
- **Bounded tools, no shell.** `file_read` returns at most 500 lines, `code_search` 100
  matches with a 10s timeout. This is what stops the "token snowball". [F]
- **Auxiliary steps are single requests without tools.** Grouping sees metadata only and
  answers with integer indices. The plan gets tool _descriptions_ as text. The filter sees
  only the diff. The re-anchor prompt ends in `/no_think`. [F]
- **Stages are gated on size.** "For small changes the plan adds latency without value,
  so it's skipped". The grouping request is skipped under 4 files. [F]
- **Output tokens track wall-clock.** Across backends, 10K output tokens is 1m23s and 44K
  is 6m28s. Provider speed confounds this, but it agrees with the 72-minute run in which
  half the time was thinking. [I]

Field reports: 9 files, 8 findings, 410K tokens, 1m16s (#709); 10 files, 1.5M tokens,
2m44s to 4m03s on an unnamed model (#247). The bundled Claude Code command says "Set a
5-minute timeout". A local-GPU user waits 8 minutes for a one-line change (#1206). [F]

Estimate for the reference PR (10 files, 692 changed lines, the benchmark's 90th
percentile): 3–6 minutes at the default two rounds, because wall-clock is the slowest
group, not the sum. This is my estimate; no published run matches that size. [I]

## Precision and recall

On the same model OpenCodeReview posts 889 comments and matches 301; Claude Code posts
5,980 and matches 435. That is 69% of the true positives from 15% of the comments. [F]
The README states the cost: "its Recall is lower than general-purpose agents — a
deliberate trade-off favoring precision over noise". [F]

**Verification has three layers, and the cheap ones do most of the work.**

1. _Inside the finder._ 32 of 54 rule documents say "Favor precision over recall: report
   only defects that are likely real". The Go rules add: "Before reporting a non-local
   claim, use `file_read` and `code_search` to establish the relevant call sites". The
   system prompt allows a comment only once an issue is "identified and confirmed". [F]
2. _In code._ Every comment must quote `existing_code` verbatim from the diff. A
   sliding-window match turns it into line numbers; a unique match in another file
   re-files the comment; only then is the model asked. No match leaves line `0`. [F]
3. _The filter._ One request per group per round. It sees the diffs and the comments,
   and nothing the finder read through tools. [F]

The filter prompt is the most reusable text in the repository:

```text
remove only the comments that this diff **proves** to be factually wrong.
Removing a correct comment silently destroys a real finding.
"Suspicious", "I cannot verify this", "low value" ... all mean approve.
```

Removal has two grounds only: the code the comment describes is absent from its file's
diff, or one diff line literally contradicts it, "not derived through a chain of
reasoning". Memory safety, concurrency, linkage, behavioural change and unused parameters
are never removed. An unparseable answer keeps every comment. [F]

**What the filter measurably does.** An A/B over 194 commit ranges on Claude-4.6-Opus
found "the filter removing 22 comments at 36% precision: 8 of them reported real
defects". After the rewrite, a replay of 455 recorded filter calls gave "precision 36%
-> 88%, real findings deleted 8 -> 0, at +37% filter tokens and +7% mean latency" (cost
of the rewrite over the old filter). The author calls it "a training-set result". [F]

Twenty-two removals against roughly 900 comments is 2–3% (estimate; the two counts come
from different versions). Issue #833 says the same in Chinese: with strong models such as
Claude Opus the filter removes very few false positives, hence `--no-filter`. [F] The
paper credits the filter for the precision gap and offers no ablation. The repository's
own data says the finder-side constraints carry it. [I]

**Recall levers.** A second pass with confirmed findings injected and the plan removed
("Round 2+ strips the plan to avoid it acting as a coverage ceiling"); a gate before
finishing ("confirm you have given every `<file>` ... its own pass"); the grace round. [F]

**Caveats.** The benchmark is the vendor's. An LLM judges semantic matches. A valid
comment missing from ground truth counts as a false positive. One outside test on 10 PRs
reported about 12% precision; the maintainer blamed a since-fixed tool bug. [S] The blog
claims an internal "false-positive rate under 5%" without defining it. [F]

## Models and effort

- **No tiering exists.** `agent.go`: "The template carries no per-phase model override,
  so plan, main_task, memory compression, re-location and review filter all send this
  value." [F]
- **`--effort` is not reasoning effort.** `low`, `medium`, `high` map to
  `MaxReviewRounds` 1, 2, 3. The per-group timeout scales with it: 15, 30, 45 minutes. [F]
- **Reasoning depth is a pass-through.** The GitHub Action ships
  `default: '{"thinking": {"type": "disabled"}}'`, "for compatibility with various LLM
  providers". An optional `llm_reasoning_effort` applies to every request alike. Per-task
  overrides were requested in #1149 ("Cheap auxiliary tasks waste the most when reasoning
  is forced to `max`") and not built. [F]
- **The verifier is the same model.** Independence comes from what it can see: "the
  information boundary may matter more than the model identity". [F]
- **Measured model effect.** Across six backends F1 runs 17.9–25.1%, all above the best
  Claude Code setup (14.1%): "system design contributes more ... than model choice". [F]
- **A newer model is not a safe swap.** Claude-4.8-Opus wrote 465 comments where 4.6
  wrote 889 and matched 176 against 301: higher precision, 42% fewer true positives. [F]
  The benchmark's thinking setting is unstated; 10K output tokens per PR suggests none. [I]

## Tried and removed

| Was                                                               | Now                                          | Why                                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| One agent per file (v1.3.1)                                       | Semantic file groups (v1.10.0)               | "Per-file review misses cross-file inconsistencies". First cut "recall from 20.0% to 12.7%"; headers "lost 79% of their comments". [F] |
| Filter step "misidentifies clearly normal code as a defect"       | Two literal grounds plus vetoes              | It "invited a value judgement and was the entry point for most wrong removals". [F]                                                    |
| Filter emits ids, then reasons                                    | `analysis` field serialised first            | The model wrote "I should not remove it" after the id was already listed. [F]                                                          |
| Filter with forced tool choice                                    | Tool choice left free                        | Forced tool choice conflicts with thinking. [F]                                                                                        |
| Plan as JSON, then MUST/SHOULD tiers with `[quick]`/`[deep]` tags | Plain numbered text                          | "Nothing parses the plan output"; the missing third tier starved `low` findings. [F]                                                   |
| Plan shown in every round                                         | Round 1 only                                 | It acts as "a coverage ceiling". [F]                                                                                                   |
| Plan gated on group churn                                         | Gated on the largest file                    | Otherwise the plan phase is "effectively unconditional". [F]                                                                           |
| Grouping request always                                           | Skipped under 4 files; indices, not paths    | "the call buys no information"; path output overflowed and forced per-file fallback. [F]                                               |
| Model re-anchors a failed snippet first                           | Cross-file string search first               | The model "answers with whatever token in that diff looks closest". [F]                                                                |
| 20, then 30 tool turns, hard stop                                 | 100 turns, then a grace round                | Findings were lost when the budget ran out. [F]                                                                                        |
| Release on unit tests                                             | Full 200-PR eval before any core-path change | An AI-chosen tool change broke code search as launch traffic arrived; one eval run takes 8 hours. [F]                                  |

Not built: diff-only "rapid review" (#1206, open) and a higher-recall "Ultra Mode". [F]

## What transfers to review-pr

Ranked by time saved against strength of evidence.

1. **Do triage in the orchestrator, not in agents.** Hand each finder its diffs, the other
   changed files and its checklist. _Risk:_ low; do not copy the test-file exclusion.
2. **Replace one refuter agent per finding with one batched, diff-only falsifier.** No
   tools, deletion only, keep-all on failure, reasoning before ids, a never-remove list.
   Move evidence gathering into the finder: a verbatim snippet and a checked call site
   before any non-local claim. _Risk:_ high if today's refuters reject many findings; this
   filter catches only what the diff contradicts and removed 2–3% here. Measure the
   refuter's rejection rate first, and keep it for claims resting on code outside the
   diff. [I]
3. **Fan out by file group with dimensions as a checklist.** Each diff is read once, not
   once per dimension, and file ownership removes most duplicates. _Risk:_ the highest for
   recall. This shape scores 20.0% recall against 28.9%, and grouping starved secondary
   files until a per-file pass was enforced. A/B it; bundle only small changes.
4. **Gate stages on size.** No plan under 50 changed lines per file, no grouping request
   under 4 files, stop when a pass adds nothing. _Risk:_ the thresholds are tuned to their
   benchmark and carry no published numbers.
5. **Spend reasoning only in finders.** Run grouping, dedupe, anchoring and posting as
   single requests at minimal effort, or as code. _Risk:_ unmeasured upstream; the 4.6 to
   4.8 swap cut true positives by 42%, so re-measure after any model or effort change.
6. **Buy recall with a second pass, not deeper thinking.** Inject confirmed findings, drop
   the plan, stop when nothing new arrives. _Risk:_ adds a pass of wall-clock; its effect
   on recall is unpublished.
7. **Anchor by quoted snippet, resolved in code**, so posting threads needs no agent.
   _Risk:_ none to quality; unanchored comments still need a file-level fallback.
8. **Keep a fixed PR set with known findings** to prove "no loss". _Risk:_ cost only.

## Not found

- An ablation of the filter, the plan, grouping or rounds. The paper has none.
- Precision, recall or time per `--effort` level, or for the grouped pipeline after its
  recall fix. PR #808 leaves "Run evaluation benchmark to confirm recall recovery" open.
- Any measurement of thinking on against off, of reasoning effort, or of a cheaper model
  on any single step. Any per-stage latency breakdown, including the filter's share.
- The tool-call trace analysis the README cites, and any architecture detail of the
  internal Alibaba system beyond blog claims (20k monthly users).
- The original write-up of the independent 10-PR test, the maintainer's reply to it, and
  the full Hacker News thread; only search fragments were seen.

## Sources

Paths are relative to a temporary clone of `github.com/alibaba/open-code-review` at
`a758d9c` (2026-09-29). Every entry is FETCHED unless marked SNIPPET.

- `internal/agent/{agent,grouping,selection,util}.go`, `internal/llmloop/{loop,pool}.go`,
  `internal/diff/resolver.go` — orchestration, tool loop, anchoring.
- `internal/config/template/{task_template.json,effort.go,prompts/*.md}`,
  `internal/config/toolsconfig/tools.json`, `internal/config/rules/rule_docs/*.md`,
  `internal/config/allowlist/default_exclude_patterns.json` — prompts and config.
- `action.yml`, `README.md`, `ROADMAP.md`, `skills/*/SKILL.md`,
  `plugins/open-code-review/claude-code/commands/review.md`.
- `pages/src/content/docs/en/architecture.md`, `pages/src/components/BenchmarkSection.tsx`,
  `pages/src/content/blog/en/oss-two-month-retrospective.md` (2026-07-29).
- Commits `c8b6a39` (2026-08-15), `a662400` (2026-08-25), `da102ec` (2026-08-31),
  `da972b2` (2026-08-13), `494bf1c` (2026-09-12), `9a371c9` (2026-08-15).
- Issues #709, #1206, #1149, #247, #833 and PR #808, read with `gh` on 2026-10-02.
- <https://arxiv.org/abs/2608.09290> v2, 2026-08-11, PDF read in full.
- <https://github.com/alibaba/aacr-bench> — `dataset/`, `evaluation/`, cloned 2026-10-02.
- <https://www.infoq.com/news/2026/09/alibaba-opencodereview/>, 2026-09-20. SNIPPET
- <https://developer.aliyun.com/article/1752926>, 2026-08-03. SNIPPET
- <https://news.ycombinator.com/item?id=48406358>, 2026-06. SNIPPET
- <https://www.alibabacloud.com/help/en/lingma/april-2026-product-announcement>. SNIPPET
- INFERRED from the above: the 2–3% filter share, the 3–6 minute estimate, and the link
  between output tokens and wall-clock.
