# CodeRabbit: how it reviews code

Researched 2026-10-02. Every claim carries a tag and a source key from **Sources**:
`[F]` fetched and read, `[S]` search snippet only, `[I]` inferred here from the evidence,
`[E]` an estimate made here. Benchmark numbers are CodeRabbit's own unless marked.

## Summary

- Fan-out is wide where it is cheap, narrow where it is expensive. Small models summarise
  files, compress context and verify; the frontier reviewer makes about two calls per PR
  `[F: sonnet55, fable51]`. No source shows dimension-split finders in PR review `[I]`.
- Routing comes first: "Every CodeRabbit review begins with a routing decision"
  `[F: router]`. Trivial, junior and senior cohorts get low, medium and high effort, and
  the flagship model runs only on senior-tier changes `[F: sonnet55, opus48]`.
- Effort above the default did not raise recall for Sonnet 5, Fable 5.1, Opus 5, or Opus
  5.5 on the broad set. It did on Opus 5.5's 13 hardest cases, and one step below default
  cost Opus 4.8 five points `[F: sonnet5, fable51, opus5, opus55, opus48]`.
- Every comment passes "verification, deduplication, and assertive filtering"
  `[F: opus5]`. Verification is shell-script evidence plus a judge, on "shared smaller
  models" `[F: massive, sed, sonnet55]`. Precision after it: 29–39% `[F: opus55]`.
- A full review takes a mean of 5:27 to 8:31 on 2026 benchmark runs `[F: sonnet55, nemo]`.
  For `review-pr`: route, one shared brief, two or three cohort finders at medium effort,
  batched cheap verification; 8–13 minutes `[E]`.

## Pipeline

It is a fixed pipeline with one agentic stage: "It's not like agentic loop that everyone
else has. I mean it's a pipeline in a way and a lot of the work goes in preparing the
context" `[F: sed]`.

**Kept between reviews (needs a service):** learnings in PostgreSQL plus LanceDB
embeddings; an embedding index of functions, tests, prior PRs and issues; a seven-day
sandbox cache of the repo with dependencies installed; the router model and the eval set
`[F: docs, massive, router, online]`. **Built per review:** everything below, including
the code graph, "re-generated each time" `[F: ctx-eng]`.

1. **Queue and scope.** A queued worker (one-hour timeout, 8 vCPU, 32 GiB `[F: gcp]`)
   skips drafts, title keywords and bot authors, drops 142 default ignored patterns (lock
   files, generated, minified, build output) and the repo's `path_filters`, and on a new
   push takes only the range since the last reviewed commit `[F: docs]`.
2. **Sandbox and tools.** Clone, install dependencies, run the relevant ones of 50+
   linters and scanners `[F: docs, gcp]`.
3. **Route.** A small model tags complexity; a scorer "converts those tags into a review
   configuration" `[F: router]`.
4. **Context, in parallel.** Code graph (definitions, references, co-changed files),
   learnings, linked issues, rules files, past PRs, web search. Cheap or open models
   compress it into a PR summary "before any review comments are generated" `[F: nemo]`.
5. **Group.** File summaries, a walkthrough and a "layer grouping" feed the reviewer;
   related blocks cluster into cohorts ordered by dependency `[F: sonnet55, engine]`.
6. **Review.** A main agent splits "a main root task" into subtasks; the graph "is
   dynamic", capped at a depth of "five or ten". Agents write shell (`cat`, `grep`,
   `ast-grep`) instead of tool calls `[F: sed, gcp]`. Frontier calls per run: 22 for 13
   reviews, 84 for 44, 92 for 45 `[F: sonnet55, fable51]`.
7. **Verify, dedup, filter, post once.** "we don't share any of those suggestions with the
   user but wait until we've completed all steps" `[F: ide]`.

The 2023 open-source action is the ancestor and the only public prompts. A light model
summarised each file and emitted `[TRIAGE]: <NEEDS_REVIEW or APPROVED>`; a heavy model
reviewed each `NEEDS_REVIEW` file hunk by hunk and answered `LGTM!` per line range, which
was dropped. Defaults: `gpt-3.5-turbo`, `gpt-4`, six concurrent calls `[F: oss]`.

## Speed

| Stated duration | Scope | Tag |
| --- | --- | --- |
| "often taking 10-20 minutes to complete" | whole review task, 2025-04 | `[F: gcp]` |
| "up to five minutes before you see the first comment", or one to three | 2025-11 | `[F: slow]` |
| mean 8:31 per full review trace | production mix, 105 problems, 2026-06 | `[F: nemo]` |
| mean 5:27 (13 hard PRs); mean 6:33, median 5:44 (44 PRs) | Sonnet 5.5 lanes; Sonnet 5 took 9:55 and 13:31 | `[F: sonnet55]` |
| "can take 7-30+ minutes depending on the scope of changes" | CLI | `[F: docs]` |

Target: "A five minute review is fine. Thirty minutes is not." `[F: codex]`. Mechanisms:

- **Fewer deliberation tokens.** Sonnet 5.5 halved wall-clock against Sonnet 5 on
  identical inputs: per call it read 110.7k tokens against 247.5k, wrote 5.8k against
  21.6k, thought 464 words against 2,771, and caught more `[F: sonnet55]`.
- **Cheap models for high-volume steps.** Small-model summaries plus triage saved "almost
  50% on costs" `[F: cost23]`. At the junior tier an open model matched the frontier blend
  "with almost 50% less median latency" `[F: nemo]`.
- **Skipping work.** Trivial diffs are approved by the cheap model; on re-review a file
  is skipped when its new summary means the same as the old one `[F: cost23]`. "there is
  a short circuit and so far no one has noticed or complained" `[F: sed]`.
- **Scope cuts, warm state, bounded recursion.** Excluding files "keeps reviews focused
  and fast"; the cache lets runs "start faster" `[F: docs]`; depth is capped `[F: sed]`.

The IDE path cut time to first comment "by ~90%" by dropping the clone, code graph and
sandbox runs, lightening verification and sending comments as produced. The stated price:
architectural and whole-codebase findings are left to the PR review `[F: ide]`.

## Precision and recall

Recall first: "filtering is easier than recovering a missed bug" `[F: gpt56]`.

**Candidates.** One reviewer covers every dimension. The six categories (security,
stability, data integrity, correctness, performance, maintainability) are labels on
comments `[F: docs]`, not separate agents `[I]`. Loker's public demo sends one prompt
listing six bug classes, with one-hop callers and callees, to `gpt-5-mini` at `effort:
low` `[F: odsc]`. Only the whole-repo Security scan splits by dimension, after a Map
stage: "Specialized agents investigate different risk areas in parallel" `[F: security]`.

**Dedup and gating.** "Deduplication by normalized text + file/line is a necessary
post-processing step, and we've seen cases where 30 - 40 raw comments collapse to 10 - 20
unique findings" `[F: opus47]`. Bugs always show; "Refactors show only if the model marks
them as essential"; nitpicks are hidden unless the profile is `assertive` `[F: codex]`.
No numeric cap was found. On 44 benchmark PRs, 2.5 to 3.3 comments survive per PR `[I]`.

**Verification.** Each suggestion is verified separately `[F: ide]`:

- Script evidence, on demand. "When something needs checking, CodeRabbit generates
  shell/Python checks (think grep, ast-grep) to confirm an assumption or extract proof
  from the codebase before we post the comment" `[F: massive]`.
- A judge, and suppression on thin evidence. "the validation is done by another kind of a
  judge LLM"; a finding made without "the relevant context" is hidden, read partly from
  "the quality of commands it's running" `[F: sed]`.
- Rules and learnings. Comments are checked "against the code, the team's guidelines, and
  the repository configuration" `[F: engine]`. A reply to a comment becomes a stored
  learning, applied "only when it is relevant to that change" `[F: docs]`.
- Unverified is a state, not a deletion: in the CLI such findings "remain available
  for inspection, without AI fix prompts, and are counted separately" `[F: docs]`.
- Security findings get a stricter verifier that "reopens the cited paths" and checks
  reachability, safeguards elsewhere and exploit conditions `[F: security]`.

| Measure | Value | Tag |
| --- | --- | --- |
| Own sets, production mix | 61.3% recall, 39.3% precision (80 patterns); 5/13, 29.4% (13 hard cases) | `[F: opus55]` |
| Same 13, Opus 5.5 Standard / Sonnet 5.5 | 8/13 at 66.7% / 6/13 at 41.2% | `[F: opus55, sonnet55]` |
| Martian online bench (developer actions) | 49.2% precision, 53.5% recall, ~300k PRs, Jan–Feb 2026; 64.9% and 51.6%, rank 5, 2026-07-30 per a rival | `[F: martian, greptile-m]` |
| After adopting o3 | "50% increase in accurate suggestions" | `[F: openai]` |
| Move to GPT-5 | comments "nearly doubled", acceptance fell | `[F: codex]` |

Users report both noise ("it's made PRs unreadable") and the opposite ("wanting to read
the low confidence comments") `[F: hn]`.

## Models and effort

| When | Cheap tier | Reasoning tier | Tag |
| --- | --- | --- | --- |
| 2023 | `gpt-3.5-turbo`: summary, triage | `gpt-4`: per-file review | `[F: oss, cost23]` |
| 2025-05/06 | GPT-4.1 family: summaries, context clean-up, "routine QA checks" | o3, o4-mini: cross-file bugs; "seven or eight models" in all | `[F: openai, sed]` |
| 2025-08/09 | — | GPT-5 "core reasoning model", then GPT-5 Codex | `[F: gpt5, codex]` |
| 2026-01 | Nemotron 3 Nano: summaries (self-hosted) | GPT-5.2-Codex, Claude 4.5: review and "review verification" | `[F: nemo]` |
| 2026-05/06 | Nemotron 3 Ultra viable at trivial and junior tiers | Opus 4.8 on senior-tier changes only | `[F: nemo, opus48]` |
| 2026-09 | "shared smaller models that handle summaries and verification" | GPT-5.6 lanes; Sonnet 5.5 taking "simple and moderate reviews" | `[F: sonnet55, opus5]` |

Verification therefore moved from the frontier tier to the smaller tier during 2026
`[I]`; no quality delta is published. Effort is set per cohort: "Low, medium, and high
effort for the trivial, junior, and senior review cohorts respectively" `[F: sonnet55]`.

| Model | Lower setting | Higher setting | Tag |
| --- | --- | --- | --- |
| Sonnet 5.5, thinking off / on | 5/13, 38.5%, 5:58 | 6/13, 41.2%, 5:27, +15% cost | `[F: sonnet55]` |
| Opus 5.5, Standard / Max | 63.8% recall, 38.6% (80 patterns); 8/13, 66.7% (hard) | 62.5%, 35.7%; 10/13, 52.0% | `[F: opus55]` |
| Fable 5.1, Low / High | 61.0% recall, 18:38 | 57.1%, 21:36, same call count | `[F: fable51]` |
| Sonnet 5 | ~50% recall | "barely moved its score and roughly doubled the cost" | `[F: sonnet5]` |
| Opus 5, medium / x-high | most issues found, 110 nitpicks | 39.3% precision, 55.2% recall | `[F: opus5]` |
| Opus 4.8, one step down / default | −4 points precision, −5 pass rate | 61% pass, 33.8% | `[F: opus48]` |

Their reading: "treat effort as a choice between failure modes" `[F: opus5]`. Model size
still matters at the top: "four of our 13 hard cases defeated every Sonnet configuration
we ran" `[F: sonnet55]`. An independent study found Haiku 4.5 ahead of Sonnet 4.6, and
F1 falling from 0.657 on diffs under 10 lines to 0.043 over 150 `[F: arxiv]`.

## Tried and removed

- Per-file review with no cross-file context; now "a total redesign" `[F: oss]`.
- One agent loop ("single loop doesn't work for us") and typed tool calls ("We actually
  generate code as instead of doing tool calls") `[F: sed]`.
- A pre-built index as the main repo context: "It's not being pre indexed … We just
  create this live" `[F: sed]`.
- Vector similarity to decide re-review: "wouldn't be effective in our case"; an LLM
  compares summaries instead `[F: cost23]`.
- Streaming model output `[F: ide]`; one prompt for every model, now a core prompt plus
  "prompt subunits" `[F: prompts]`.
- GPT-5 as sole core reasoner: its "always think hard" style raised review time, comments
  "nearly doubled" and acceptance fell `[F: codex]`. Top effort by default `[F: sonnet5]`.
- Emoji feedback as a learning signal `[F: emoji]`; user-selected models `[F: online]`.

## What transfers to review-pr

Ranked by expected minutes saved `[E]`. Each item ends with its quality risk.

1. **Tier effort by cohort.** Half the measured time was thinking. Medium by default, high
   for senior-tier cohorts, never the top setting. *Risk:* the top setting caught 10/13
   against 8/13 on the hardest cases.
2. **Route first.** One small-model call tags the PR and each cohort. *Risk:* a subtle
   change tagged trivial; CodeRabbit's router matches its reference 80.7% of the time
   `[F: router]`. Keep the 2023 rule: "When in doubt, always err on the side of caution".
3. **Build one brief, once.** File summaries that note signature changes, PR intent, and
   one-hop callers and callees of changed symbols, handed to every finder. *Risk:* a wrong
   summary misleads all finders; the 2023 prompt bans verdicts in summaries `[F: oss]`.
4. **Split finders by cohort, not dimension.** Two or three finders, each owning a
   dependency-ordered group of hunks and a checklist of all dimensions; add a security
   finder only when the router sees auth, input or secrets. *Risk:* a generalist
   under-attends a dimension; no source tests dimension against cohort splitting `[I]`.
5. **Dedup in code before verifying**: normalised text plus file and line. *Risk:* two
   distinct bugs on one line merge.
6. **Verify in batches on a smaller model, with shell evidence.** One verifier per cohort
   runs `grep`, `ast-grep`, the type checker or a test and must cite output to drop a
   finding; otherwise post it as unverified. Keep a per-finding refuter for critical
   severity only. *Risk:* a weaker verifier kills a true positive.
7. **Gate by severity, do not cap.** Bugs always, refactors only when essential, nitpicks
   dropped before verification. *Risk:* useful low-confidence comments are lost.
8. **Filter scope and run linters, type checker and tests before any model**, passing only
   the top issues. *Risk:* a poisoned lock file goes unread.
9. **Review only the delta on re-runs.** *Needs state*, below.

| Needs a service at CodeRabbit | No-service equivalent |
| --- | --- |
| Last-reviewed commit | Hidden marker in the posted review; the 2023 action used `<!-- commit_ids_reviewed_start -->` `[F: oss]` |
| Learnings store | A learnings file in the repo, matched by path glob |
| Code graph, semantic index | `git grep` or `ast-grep` on changed symbols; `git log --name-only` for co-change |
| Sandbox cache, fine-tuned router | The local checkout; a prompt on the smallest model |
| Eval set of ~100 known-bug PRs | A few past PRs with frozen finder inputs, re-run after each change; CodeRabbit replays "a frozen cassette" `[F: sonnet55]` |

Budget for the 10-file PR `[E]`: brief 1–2 min, finders 4–6, verification 2–4, post 1.

## Not found

- Time spent in verification alone, and the verifier's own precision or recall.
- Production thresholds: judge vote counts, confidence cut-offs, any cap on comments.
- The current model per stage by name; "production model mix" is never itemised.
- A measured comparison of fan-out shapes (dimension, file, hypothesis, cohort).
- Raw candidate counts before verification, beyond the 30–40 to 10–20 example.
- Current prompts. The CLI skill only calls the hosted service `[F: skills]`.
- The upstream `coderabbitai/ai-pr-reviewer` (404; a fork was read), Martian's own
  leaderboard numbers (the page needs scripts), and any HN latency figures.

## Sources

`B/` is `https://www.coderabbit.ai/blog/`; `D/` is `https://docs.coderabbit.ai/`.

| Key | URL | Date | Tag |
| --- | --- | --- | --- |
| oss | `https://github.com/rohitpaulk/ai-pr-reviewer` (`src/prompts.ts`, `review.ts`, `commenter.ts`, `action.yml`, `README.md`; fork at upstream commit d5ec397) | 2023-11-26 | F |
| cost23, ide | `B/how-we-built-cost-effective-generative-ai-application`, `B/how-we-built-our-ai-code-review-tool-for-ides` | 2023-12-22, 2025-05-14 | F |
| gcp | `https://cloud.google.com/blog/products/ai-machine-learning/how-coderabbit-built-its-ai-code-review-agent-with-google-cloud-run` | 2025-04-23 | F |
| openai | `https://openai.com/index/coderabbit/` (through a reader proxy; direct fetch 403) | 2025-05-22, date S | F |
| sed | `https://pod.wave.co/podcast/software-engineering-daily/coderabbit-and-rag-for-code-review-with-harjot-gill-41e3d15a` (transcript) | 2025-06-24 | F |
| ctx-eng, massive | `B/context-engineering-ai-code-reviews`, `B/how-coderabbit-delivers-accurate-ai-code-reviews-on-massive-codebases` | 2025-07-17, 09-05 | F |
| gpt5, codex | `B/benchmarking-gpt-5-why-its-a-generational-leap-in-reasoning`, `B/gpt-5-codex-how-it-solves-for-gpt-5s-drawbacks` | 2025-08-07, 09-30 | F |
| prompts, slow, emoji, online | `B/the-end-of-one-sized-fits-all-prompts-why-llm-models-are-no-longer-interchangeable`, `B/the-rise-of-slow-ai-why-devs-should-stop-speedrunning-stupid`, `B/why-emojis-suck-for-reinforcement-learning`, `B/behind-the-curtain-what-it-really-takes-to-bring-a-new-model-online-at-coderabbit` | 2025-10-24, 11-05, 11-07, 12-05 | F |
| odsc, skills | `https://github.com/coderabbitai/odsc-west-2025` (`review_demo.py`), `https://github.com/coderabbitai/skills` (`skills/code-review/SKILL.md`) | 2025-10-30, 2026-10-01 | F |
| nemo | `B/coderabbit-ai-code-reviews-now-support-nvidia-nemotron`, `B/coderabbit-supports-nvidia-nemotron-3-ultra`, `B/nemotron-3-ultra-release` | 2026-01-05, 06-04, 06-04 | F |
| hn, arxiv | `https://news.ycombinator.com/item?id=46766961`, `https://arxiv.org/abs/2606.15689` (abstract only) | 2026-01-26, 04-09 | F |
| martian, greptile-m | `B/coderabbit-tops-martian-code-review-benchmark`, `https://www.greptile.com/content-library/greptile-martian-code-review-benchmark` | 2026-03-03, 07-30 | F |
| opus47, opus48, engine | `B/claude-opus-4-7-for-ai-code-review`, `B/opus-4-8-release`, `B/explainable-reviews-coderabbit-review-context-engine`, `B/coderabbit-review-reads-a-pr-how-author-would-explain-it` | 2026-04-16, 05-28, 05-19, 06-09 | F |
| sonnet5, gpt56, opus5 | `B/claude-sonnet-5-review`, `B/gpt-5-6-sol-and-terra-benchmark`, `B/opus-5-model-review` | 2026-06-30, 07-09, 07-24 | F |
| router, security | `B/teaching-nvidia-nemotron-3-5-lightning-to-route-code-reviews`, `B/introducing-coderabbit-security` | 2026-08-11, 08-13 | F |
| fable51, opus55, sonnet55 | `B/fable-5-1-model-review`, `B/opus-5-5-model-review`, `B/sonnet-5-5-model-review` | 2026-09-01, 09-22, 09-28 | F |
| docs | `D/guides/code-review-overview`, `D/configuration/path-instructions`, `D/configuration/auto-review`, `D/reference/configuration`, `D/reference/caching`, `D/knowledge-base/learnings`, `D/tools`, `D/cli`, `D/changelog`, `D/llms.txt` | read 2026-10-02 | F |
