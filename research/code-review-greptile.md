# Greptile: how it reviews code

Researched 2026-10-02. Every claim carries a tag and a source key from **Sources**:
`[F]` fetched and read, `[S]` search snippet or relayed by another agent and not
re-fetched, `[I]` inferred here from the evidence, `[E]` an estimate made here.

## Summary

- The v5 rebuild changed the fan-out shape, not the amount of work: one narrow agent per
  bug hypothesis, all in parallel. Median review time fell from 5:04 to 2:25 and the
  share of comments authors addressed rose from 52% to 66% in the same release `[F: v5]`.
- Greptile has published no separate refuter or verification pass. Precision comes from
  the investigating agent challenging its own hypothesis, per-team learned filters, a
  cheap gate that runs only on re-reviews, and attached runtime evidence `[F: v3, shutup,
  aku-variants, trex-eng]`.
- Every standalone LLM judging step they disclosed was abandoned or dropped: a 1–10
  severity judge, a nitpick label, and later the `severity-reclassifier` and
  `post-review-deduplication` model aliases `[F: shutup, hn-nit, aku-f52]`.
- Models are tiered by step: a frontier model for judgement, a fast no-thinking model for
  grep and tracing, nano models for gates. The self-hosted default moved from an Opus
  variant to a Sonnet one in June 2026 with no published quality delta `[F: valid,
  aku-proxy, aku-052]`.
- For `review-pr`, the largest lever is a scope pass that emits hypotheses, then one
  self-verifying agent per hypothesis, replacing dimension finders plus a refuter per
  finding `[E]`. Greptile's deepest tier reviews a comparable PR in 5–11 minutes
  `[I: demo]`.

## Pipeline

Stages, pieced together from the self-hosting repository and the engineering posts:

1. A webhook receives the PR event and queues a review on Hatchet `[F: aku-arch]`.
2. The `worker` "clones repositories, runs the review sandbox, posts comments". Each pod
   runs two reviews at once by default `[F: aku-arch, aku-scaling]`.
3. The review agent runs inside a coding-agent harness with a terminal on the checkout:
   "Claude Code" for the Anthropic variant, "OpenCode" for the OpenAI one
   `[F: aku-variants, sandbox]`.
4. The orchestrator reads the diff and pulls rules, memory and ticket context. "One
   sub-agent handles memory retrieval" `[F: claude]`.
5. It spawns "a swarm of agents that each explore one hypothesis for a potential bug"
   `[F: v5]`. With T-Rex on, it also spawns "a dedicated TREX agent per issue, all running
   in parallel" in a sandbox `[F: trex-eng]`.
6. Filters apply: strictness 1–3, comment types, learned suppression, and on re-reviews
   the `post-review-gate` `[F: docs-nit, docs-learn, aku-variants]`.
7. It posts a summary with a 0–5 confidence score and inline comments badged P0–P2
   `[F: docs-anatomy]`. A tester saw them arrive "all at once" `[F: devto]`.

| Precomputed | Done per review |
| --- | --- |
| Chunk-and-embed index in pgvector `[F: aku-arch]` | Clone, fetch the exact PR commits `[F: trex-eng]` |
| Code graph of files, functions, calls `[F: docs-graph]` | Diff reading and hypothesis generation `[I: inversion]` |
| Knowledge-base wiki per repo `[F: valid, docs-kb]` | Grep and call tracing by subagents `[F: valid]` |
| Learned rules and voted-comment embeddings `[F: shutup]` | Filtering and gating `[F: aku-variants]` |
| Per-repository sandbox snapshots `[F: trex-eng]` | Runtime checks and artifacts `[F: trex-eng]` |

The wiki holds, per area, "what it does, how it works, how it's architected ... bugs that
have been introduced in the past here, and potential sources of risk". It refreshes on
merge to main and on a scheduled crawl `[F: valid, nemo-ultra]`. The founder said "we can
index on every commit" because PRs are rare next to editor saves `[F: yt-pod]`.

## Speed

| Measurement | Value | Tag |
| --- | --- | --- |
| Median review, v4 → v5, over a million PRs | 5:04 → 2:25 | `[F: v5]` |
| Docs guidance: small / medium / large PR | ~1–2 / ~3 / 3–5 min | `[F: docs-dev]` |
| Tester's mean commit-to-first-finding, pre-v5 | 4.9 min, P95 38.0 min | `[F: devto]` |
| Demo PR, 5 files +1530/−63: Base / Plus / Apex | 3.0 / 3.8 / 6.4 min | `[I: demo]` |
| Demo PRs, 18 files +498/−146 and 7 files +344/−19 | 3.6 / 5.2 / 10.3 and 3.2 / 3.4 / 5.5 min | `[I: demo]` |
| Plugin's Bash timeout for a CLI review | 600000 ms | `[F: plugin]` |

The v5 post prints the unit as "seconds"; the docs and a founder post read as minutes
`[F: v5, docs-dev]` `[S: x-v5]`. The demo timings are the gap between PR creation and the
bot's summary comment. The tier mapping is confirmed by blog links only for the first
demo repository and assumed for the others by PR number `[I: demo, tiers]`.

What bought the time:

- **Parallel narrow agents.** "Since these agents run in parallel, our end to end latency
  is much smaller" `[F: v5]`.
- **No duplicated exploration.** Separate agents "often overlapped, exploring the same
  parts of the codebase twice without either agent knowing what the other had already
  found". The fix: a subagent "inherits what the Greptile reviewer agent already found,
  has its own context window, and is scoped to the specific problem" `[F: trex-eng]`.
- **Precomputed understanding.** The knowledge base "eliminates the tens of thousands of
  tokens that the agent would otherwise consume re-learning how the codebase works"
  `[F: valid]`.
- **Cheap models for token-heavy steps.** See **Models and effort**.
- **Prompt caching.** v3 used about three times the context tokens of v2 at "75% lower
  inference costs" `[F: v3]`, with "cache hit rates close to 90%" `[F: claude]`. This is a
  cost claim; no latency effect is stated.
- **Effort tiers.** Higher tiers give a review "more time to run subagents and tasks in
  parallel" at 1, 3 or 10 credits `[F: tiers]`.

Two cautions. Greptile says "We intentionally deprioritize latency in our evaluation"
`[F: trex-eng]`. And the 2024 judge step "made the bot extremely slow because there was
now a whole new inference call in the workflow" `[F: shutup]`: an added serial pass is
the one thing they report as a latency regression.

## Precision and recall

Filters and checks, in the order they appeared:

- **Learned suppression by embedding.** Past comments are embedded per team. A new comment
  with "a cosine similarity exceeding some threshold with at least 3 unique downvoted
  comments" is blocked; three upvoted neighbours pass it. Address rate went "from 19% to
  55+%" within two weeks `[F: shutup]`.
- **Classes that are never suppressed.** Security vulnerabilities, memory leaks, infinite
  loops, null dereferences, missing input validation `[F: docs-nit]`.
- **Self-challenge inside the loop.** v3's precision gain was attributed to "an increased
  threshold for 'sureness' since v3 can challenge its own hypothesis more strongly"
  `[F: v3]`.
- **Coverage by hook.** The team "uses hooks to inject determinism where it matters ...
  ensuring that every file in a pull request gets examined" `[F: claude]`.
- **A gate on re-reviews only.** "`post-review-gate` is used only on a later review that
  already has Greptile comments ... a missing route fails open and the review still
  posts" `[F: aku-variants]`. An earlier config routed by review number: first review to
  one variant, later ones to a "regated" variant `[F: aku-052]`. What the gate compares
  is not documented `[I]`.
- **Evidence attached to runtime findings.** An early T-Rex agent "would sometimes
  hallucinate about how thoroughly it had tested something". Artifacts fixed that: "Bad
  evidence is worse than no evidence" `[F: trex-eng]`.
- **A different model from the author's.** Cross-model recall on high-severity bugs was
  60.0% and 62.0% against 53.7% and 50.5% same-model, on 500 PRs per author model
  `[F: inversion]`. The pairing of figures to bars is read from the chart `[I]`.

The model-inversion study also describes two failure shapes that bear on fan-out.
Opus built 59.4% of its context while reading the diff and posted 7–8 comments. GPT
built 82.5% while investigating and posted 1–2 `[F: inversion]`. The verifying model lost
recall: it "would often identify the bugs I expected it to post ... Yet it wouldn't post
them",
and recovered when told to target 7–10 comments. The wide model lost precision: "a
holistic approach without proper verification produces false positives" `[F: inversion]`.

| Number | Value | Tag |
| --- | --- | --- |
| Comments before filtering, 2024 | ~19% good, 2% wrong, 79% nits | `[F: shutup]` |
| Action rate, v2 → v3 | 34.75% → 59.24% | `[F: v3]` |
| Upvote/downvote ratio, v2 → v3 | 1.44 → 5.13 | `[F: v3]` |
| Comments addressed, v3 → v4 (LLM-judged) | 30% → 43% | `[F: v4]` |
| Addressed comments per PR, v3 → v4 | 0.92 → 1.60 | `[F: v4]` |
| Comments addressed, v4 → v5 | 52% → 66% | `[F: v5]` |
| Own benchmark, 50 bugs in 5 repos, July 2025 | 82% caught; 58% of critical | `[F: bench]` |
| Runtime execution on top of review | "20% more bugs" | `[F: trex]` |
| Comments per PR, founder's figure | "about four" | `[F: yt-talk]` |
| Independent tester, 120 findings on 55 PRs | 2.2 per PR, zero false positives | `[F: devto]` |
| Rival vendor's rescoring, 39 PRs | 33.5% precision, 34.0% recall | `[F, S: codepulse]` |

The address-rate baselines do not line up between releases (59% after v3, 30% as v3's
starting point, 43% after v4, 52% as v4's starting point), so the definition or the
population changed between posts `[I]`. The rival's figures come from its own harness and
it says so `[F: codepulse]`.

The eval set is mined from history: "we find pull requests that have the word patch or
fix in their name and then we find the original pull request that caused the thing"
`[F: yt-pod]`. Recall is scored against it; precision is scored as run-to-run consistency
`[F: trex-eng]`.

## Models and effort

"A lightweight internal router sends each task to the model that handles it best"
`[F: nemo-ultra]`. The self-hosted proxy config names the steps `[F: aku-proxy]`:

| Step alias | Model, 2026-09-28 |
| --- | --- |
| `review` (default) | `claude-sonnet-4-6` |
| `review-deep` | `claude-opus-4-6` |
| `review-light` | `claude-haiku-4-5` |
| `refiner` (role undocumented) | `claude-sonnet-4-6` |
| `post-review-gate`, `comment-classifier`, `addressed-judge` | `gpt-5.4-nano` |
| `memory-embeddings` | `text-embedding-3-small` |
| `memory-clustering`, `memory-learning`, `reply-agent` | `claude-sonnet-4-6` |
| `dsv4-flash-leased-nothink` (OpenAI variant only) | DeepSeek v4 flash, or `gpt-5.6-luna` at `reasoning_effort: low` |

- **Where the frontier model goes.** "for simple tasks like running grep and following
  traces which are very token-heavy but don't need frontier intelligence, we use fast
  open source models", freeing budget for "the evaluation of complex technical decisions"
  `[F: valid]`.
- **Reasoning effort.** The only disclosed setting is the no-think alias above
  `[F: aku-proxy]`. That it serves the grep-and-trace subagents is a deduction `[I]`.
- **Default model moved down.** The self-hosted default variant changed from `opus-v8` to
  `rsv11-stndrd4` on 2026-06-29 `[F: aku-052]`; `rsv11` needs "Claude Sonnet 4.6 or
  better" `[F: aku-variants]`. In the earlier customer story "Greptile runs on Opus 4.5"
  `[F: claude]`. No quality comparison was published for the switch.
- **Small model as first-pass reviewer.** A 12B-active model returned a review "in 12.5
  seconds with just 2 tool calls" on a 19-file, 134 KB diff and found a real CORS
  regression, but was "strongest on issues legible from the patch itself. When a comment
  depended on more surrounding context, coverage was thinner" `[F: nemo-super]`.
- **Small model for indexing and classification.** 1.73x indexing throughput at 0.38x
  cost, and reply classification about 78% cheaper, with accuracy described only as
  correct "across our test scenarios" `[F: nemo-ultra]`.
- **Tier as an effort dial.** On one PR, Base found 1 issue, Plus 2, Apex 3 plus a test
  gap `[F: tiers]`, in 3.0, 3.8 and 6.4 minutes `[I: demo]`.
- **User-facing knobs.** Since September 2025 users can pick the model and "the maximum
  number of agentic turns per review" to "balance speed, depth, and cost" `[F: docs-log]`.

## Architecture timeline

| When | Change | Stated reason |
| --- | --- | --- |
| 2024 | Fixed flowchart over an embedding index; code translated to prose and chunked per function `[F: v3, search]` | "Noise negatively impacts retrieval quality in a huge way" `[F: search]` |
| Dec 2024 | Per-team embedding filter on voted comments `[F: shutup]` | Prompting and LLM judging failed; "Nits are subjective" `[F: shutup]` |
| May 2025 | Long-term memory from teammates' PR comments; scoped rules; ticket context `[F: update]` | To "learn your company's idiosyncrasies" `[F: update]` |
| Sep 2025 | v3: one agent loop with shell and grep on the checkout `[F: v3, sandbox]` | "The rigidity of the flowchart prevents the system from using new information" `[F: v3]` |
| Mar 2026 | v4 `[F: v4]` | "far lower false positive rate"; no architecture disclosed `[F: v4]` |
| Jun 2026 | T-Rex: orchestrator spawning sandboxed subagents per issue `[F: trex-eng]` | A separate agent duplicated work; a single agent "got overloaded" `[F: trex-eng]` |
| Jun 2026 | Default variant Opus → Sonnet; review-number routing `[F: aku-052]` | None given |
| Aug 2026 | v5: swarm of hypothesis-scoped agents `[F: v5]` | "agents perform better when their task is narrowly scoped" `[F: v5]` |
| Sep 2026 | Review tiers Base, Plus, Apex, Auto `[F: tiers]` | More parallel subagent time for hard PRs `[F: tiers]` |

## Tried and removed

- **Prompting the model to be quieter.** "We simply could not get the LLM to produce
  fewer nits without also producing fewer critical comments". Few-shot examples made it
  worse: the model "inferred superficial characteristics" `[F: shutup]`.
- **An LLM severity judge, 1–10, cut below 7.** "The LLMs judgment of its own output was
  nearly random" `[F: shutup]`. Later: "LLMs are reluctant to risk downplaying the
  severity of an issue and therefore are unable to usefully filter out nits"
  `[F: hn-nit]`.
- **A NITPICK label on comments.** "Better but not good enough. It also often labeled
  critical issues as nitpicks" `[F: hn-label]`.
- **Forcing a finding.** "The bot was instructed to find exactly one bug. The wrong
  cases were all false positives" `[F: hn-one]`.
- **Fine-tuning.** Ruled out for "cost, speed, and lack of portability" `[F: shutup]`.
- **A precomputed context set per review.** "That used to be how we did it, but this
  method performed better on super large codebases ... grepping is a highly effective way
  to trace function calls" `[F: hn-grep]`.
- **The index-time LLM summarizer service.** Scaled to zero on 2026-06-29, deleted on
  2026-07-26 `[F: aku-662, aku-857]`. The wiki-building agent replaced it
  `[I: nemo-ultra]`.
- **Severity reclassifier and post-review deduplication.** Both aliases were present in
  May 2026 and removed on 2026-09-21 as "unused models and aliases" `[F: aku-f52]`. That
  they were pipeline passes folded into the agent is a deduction `[I]`.
- **A standalone test-writing agent, then one agent doing everything.** "Generating
  tests wasn't the same activity as finding bugs"; merged, there was "too much context
  for one agent to manage cleanly" `[F: trex-eng]`.
- **Bullet-point reports from subagents.** They "gave us no way to verify"
  `[F: trex-eng]`.
- **LLM-as-judge for code quality in research.** "Dint feel right" `[F: hn-judge]`. It is
  still used to score whether a comment was addressed `[F: v4]`.

## What it posts

- **One summary comment, edited in place.** It opens with `<!-- greptile_summary -->`
  `[F: gh-openmrs]`. On a PR of 22 commits reviewed three times it stayed one comment:
  created 2026-08-03 04:12Z, last edited 14:30Z, footer `Reviews (3)`, and no review
  object `[F: gh-dad]`. A user who measured the same concluded that the footer is the
  freshness signal and the comment's timestamp is not `[F: dad-366]`.
- **The footer carries the round.** `Reviews (N) · Last reviewed commit: <link>`
  `[F: docs-anatomy, gh-openmrs]`.
- **Each finding links to its thread.** The summary lists a finding as one numbered line
  ending in a link to its inline comment. The inline comment opens with a P0–P2 badge and
  a bold title. On a first review the inline comments ride a review object, state
  `COMMENTED` `[F: gh-openmrs]`.
- **Shape.** An `h2` "Confidence Score: 4/5" beside a re-trigger badge, a bold risk label,
  `Findings`, a `<details open>` Summary, and a hidden
  `<!-- greptile_confidence_score:4 -->` `[F: gh-openmrs]`.
- **No emoji on headings and no review duration** anywhere in the comment
  `[F: gh-openmrs]`.
- **Config.** `updateSummaryOnly` updates the summary and posts no inline comments;
  `shouldUpdateDescription` writes the summary into the PR description `[S: docs-json]`.

`review-pr` took the first three: a marker comment rewritten every round, the footer, and
one line per task linking to its thread. It adds `Took <minutes>m` to the footer, which
Greptile does not show.

## What transfers to review-pr

Baseline: 72 minutes on a 10-file, +534/−158 PR, every agent on the largest model at
high effort. Target: 10–15 minutes at equal quality. All minute figures below are `[E]`.

1. **Hypotheses, not dimensions; investigator and refuter merged (25–35 min).** One
   scope pass reads the whole diff and emits hypotheses, each with a location and what
   would confirm or kill it. One agent per hypothesis runs in parallel and returns a
   verdict with evidence. Greptile's stated grounds: narrow scope lets an agent "explore
   much deeper when needed" `[F: v5]`, and "Bugs can't clearly be divided into, say,
   security and logic" `[F: valid]`. How Greptile generates, dedupes or caps hypotheses
   is unpublished; the nearest evidence is that models "identify potential issues" while
   reading the diff `[F: inversion]` and that tiers bound subagent time `[F: tiers]`.
   Dedupe before dispatch, by location and root cause `[E]`.
   *Risk:* the scope pass becomes the single point for recall, and a wide scoper
   over-posts `[F: inversion]`. Hold a coverage check that every changed file is named
   by a hypothesis or an explicit "nothing suspected", as their hook does `[F: claude]`.
2. **Model and effort per step (10–15 min).** Largest model for the scope pass and for
   judging confirmed findings; a small model at low effort for call-site enumeration and
   tracing; the smallest for dedupe and gating `[F: valid, aku-proxy]`.
   *Risk:* a small model stays "close to the diff" `[F: nemo-super]`, and Greptile
   published no quality figure for its own Opus-to-Sonnet move. Measure on PRs mined from
   later fix commits, as they do `[F: yt-pod]`, before lowering any step.
3. **Findings carry evidence; verification becomes checking, not re-investigating
   (5–10 min).** Each finding returns the trace that proves it: the call chain with
   locations, the grep output, or a test run. A refuter then runs only for serious
   findings whose evidence is not mechanical `[E]`. A local checkout can run a targeted
   test, which is the cheap form of T-Rex `[I: trex-eng]`.
   *Risk:* an agent can overstate what it checked `[F: trex-eng]`; reject findings whose
   evidence cannot be re-run or re-read.
4. **A shared brief (5–10 min).** *Needs a persistent service at Greptile:* the wiki,
   graph and learned rules are precomputed. The no-service equivalent is one brief the
   probe writes per run and every subagent receives, optionally cached in the checkout
   keyed by base commit, plus pointers to existing docs in the manner of
   `.greptile/files.json` `[F: docs-cfg]`.
   *Risk:* an error in the brief reaches every agent.
5. **Suppression and re-review (3–8 min on repeat runs).** *Needs a persistent service
   at Greptile:* the voted-comment vector store. The no-service equivalent is a checked-in
   file of dismissed finding patterns, and fetching prior review threads at probe time so
   a re-run checks only the new commits against findings already raised.
   *Risk:* over-suppression; keep a never-suppress list `[F: docs-nit]`.
6. **Effort tier by PR risk (large on small PRs, none on this one).** Cap the number of
   hypothesis agents by size and touched paths `[F: docs-tiers]`.
   *Risk:* direct recall loss. Their own Base run found one of the four issues Apex
   found `[F: tiers]`, so this conflicts with the no-loss constraint unless reserved for
   trivial PRs.

Does not transfer: a reviewer from a different model family `[F: inversion]`. A fresh
context gives independence of context only `[I]`; the founder's objection is that shared
"model/harness/tools/system prompts ... fail in similar ways" `[F: hn-indep]`.

## Not found

- How v5 generates, deduplicates, ranks or caps hypotheses, and how many agents run.
- Any explicit verification, refuter or judge pass in v4 or v5, or its time cost.
- A measured quality effect of model choice or reasoning effort on the review step.
- v4's architecture, and what "refiner" and the re-review gate actually do.
- Per-stage latency, tokens or dollars per review, and the cosine threshold.
- A false-positive rate from Greptile, or a catch-rate benchmark newer than July 2025.
- Prompts, an eval harness or review source: the `cli` repository holds only an
  installer `[F: skills]`.
- Why the first PR in each demo repository took 20–22 minutes regardless of size, down
  to a 1-file, +12/−3 change `[F: demo]`. A tier is unlikely; first-run setup is a
  guess `[I]`.

## Sources

`B` is `https://www.greptile.com/blog/`, `D` is `https://www.greptile.com/docs/`, `A` is
`https://github.com/greptileai/akupara`, `H` is `https://news.ycombinator.com/item?id=`.
Dates on docs pages are the fetch date.

| Key | Source | Date | Read |
| --- | --- | --- | --- |
| v5 | `B/greptile-v5` | 2026-08-05 | F |
| v4 | `B/greptile-v4` | 2026-03-05 | F |
| v3 | `B/greptile-v3-agentic-code-review` | 2025-11-26 | F |
| shutup, search | `B/make-llms-shut-up`, `B/semantic-codebase-search` | 2024-12-18, 2025-04-15 | F |
| update, sandbox | `B/greptile-update`, `B/sandboxing-agents-at-the-kernel-level` | 2025-05-30, 2025-09-29 | F |
| trex, trex-eng | `B/trex`, `B/trex-code-execution` | 2026-06-15, 2026-06-17 | F |
| valid | `B/automating-code-validation` | 2026-07-10 | F |
| inversion | `B/model-inversion` | 2026-07-21 | F |
| nemo-super, nemo-ultra | `B/nvidia-nemotron-{super,ultra}-in-code-review` | 2026-03-11, 2026-06-04 | F |
| tiers | `B/introducing-plus-and-apex` | 2026-09-25 | F |
| bench | `https://www.greptile.com/benchmarks` | 2025-07 | F |
| docs-dev, docs-anatomy | `D/code-review/{developer-essentials,first-pr-review}.md` | 2026-10-02 | F |
| docs-cfg, docs-tiers | `D/code-review/{greptile-config-reference,review-tiers}.md` | 2026-10-02 | F |
| docs-nit | `D/how-greptile-works/nitpicks.md`, `D/code-review/controlling-nitpickiness.md` | 2026-10-02 | F |
| docs-learn, docs-graph, docs-kb | `D/how-greptile-works/{memory-and-learning,graph-based-codebase-context,knowledge-bases}.md` | 2026-10-02 | F |
| docs-log | `D/changelog.md` | 2026-10-02 | F |
| aku-variants, aku-proxy | `A/blob/main/docs/configuration/review-variants.md`, `A/blob/main/deploy/docker-compose/llmproxy-config.yaml` | 2026-09-28 | F |
| aku-arch, aku-scaling | `A/blob/main/docs/{reference/architecture,operations/scaling}.md` | 2026-09 | F |
| aku-052, aku-662 | `A/commit/052ea78`, `A/commit/662b412` | 2026-06-29 | F |
| aku-857, aku-f52 | `A/commit/8574fa3`, `A/commit/f52bdc1` | 2026-07-26, 2026-09-21 | F |
| plugin | `https://github.com/greptileai/claude-plugin` (`commands/review.md`) | 2026-10-01 | F |
| skills | `https://github.com/greptileai/skills`, `https://github.com/greptileai/cli` | 2026-10-01 | F |
| demo | GitHub API timestamps, `greptileai/demo-{celestia-core,onyx,itk,cline,fuser}` | 2026-09-21..25 | F, mapping I |
| gh-openmrs, gh-dad | GitHub API: comments and reviews on `openmrs/openmrs-esm-core#1930`, `vfarcic/dot-agent-deck#353` | 2026-10-02, 2026-08-03 | F |
| dad-366 | `https://github.com/vfarcic/dot-agent-deck/issues/366` | 2026-08-03 | F |
| docs-json | `D/code-review/greptile-json-reference` | 2026-10-02 | S |
| claude | `https://claude.com/customers/greptile` | undated on page | F |
| hn-label, hn-one, hn-grep | `H42483721`, `H43862283`, `H45417130` | 2024-12-22, 2025-05-01, 2025-09-29 | F |
| hn-judge, hn-indep, hn-nit | `H46305093`, `H46769696`, `H46776408` | 2025-12-17, 2026-01-26, 2026-01-27 | F |
| devto | `https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f` | 2026-05-12 | F |
| yt-pod, yt-talk | `https://www.youtube.com/watch?v=aR6CTD5Gl_E`, `...?v=474j-n1Ltxc` (auto-caption transcripts) | 2025-11-19, 2026-09-27; dates S | F |
| codepulse | `https://codepulse.review/` | 2026-08-21 | F precision, S recall |
| x-v5 | `https://x.com/dakshgup/status/2085018917563769025` | 2026-08-05 | S, fetch refused |
