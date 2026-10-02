# The code review landscape: how other systems review code

Researched 2026-10-02; a snapshot, true as of that date. Evidence: **(F)** fetched, raw
text read; **(S)** search snippet only; **(I)** inferred by the author; **(E)** the
author's estimate. A tag covers the claims before it, back to the previous tag. Numbers
in brackets point to [Sources](#sources). CodeRabbit, Greptile and Alibaba have their
own papers.

## Summary

- No system that names its models runs the largest one at high effort on every step.
  Cloudflare, Anthropic's `code-review` plugin, Sentry and Uber tier by step; Baz scored
  7/8 on its benchmark with "GPT-5 by OpenAI with low reasoning". (F)
- The one published before/after for speed is Sentry: smaller models on low-reasoning
  steps, a thinking budget on every step and an iteration cap cut average latency "by
  roughly 50%", with evals and spot checks showing no loss. (F)
- Cloudflare is the fastest dimension-split system: median 3m39s, P99 10m21s, up to
  seven specialists, no verifier agent per finding. Anthropic's two verifying products
  state 5 to 10 minutes and 20 minutes. (F)
- Three fan-out shapes ship: dimension specialists, one agentic reviewer, and one narrow
  agent per capped hypothesis. Identical voting passes were retired by Cursor and kept
  out of Kodus's default. (F)
- Verifiers discard real bugs. Kodus lost seven serious findings in one run and 31 of 83
  true positives to verifier voting; Refute-or-Promote lost a real CVE to a unanimous
  kill. The published fix: discard only on a concrete refutation. (F)
- More passes buy recall and pay in noise wherever it was measured: Kodus (+12 bugs,
  +158 false positives), CR-Bench, SWR-Bench. (F)
- For `review-pr` the evidence supports, in order: effort and model tier per step, a
  wall-clock budget per agent, and bounded verification fan-out. (I)

## Cursor Bugbot

- **Pipeline.** Version 1 (July 2025) was fixed: "Run eight parallel passes with
  randomized diff order", bucket similar bugs, "Majority voting to filter out bugs found
  during only one pass", "Run results through a validator model to catch false
  positives", dedupe against earlier runs. Autumn 2025: one agent that "could reason
  over the diff, call tools, and decide where to dig deeper instead of following a fixed
  sequence of passes." [1] (F)
- **Speed.** June 2026: "over 3x faster to run, 22% cheaper", and "90% of Bugbot runs
  now finish in under three minutes", credited to "harness improvements and progress
  we've made training Composer 2.5". It can review only "what's new since the last
  review" and skips a diff it already reviewed locally. [2] (F)
- **Precision.** Resolution rate, judged by an LLM at merge time, rose from 52% to "over
  70%" in 40 experiments [1] (F); 78% by April 2026 [3] (S). The stance flipped with the
  architecture: the agent "was too cautious. We shifted to aggressive prompts". [1] (F)
- **Models and effort.** A model trained in-house; no effort setting is published.
  Context moved from static to dynamic: "The model consistently pulled in the additional
  context it needed at runtime". Bugs flagged per run rose from 0.4 to 0.7. [1] (F)

## Cloudflare AI code review

- **Pipeline.** A coordinator launches "up to seven specialised reviewers" by dimension:
  security, performance, code quality, documentation, release, compliance, `AGENTS.md`.
  A size rule runs first: at most 10 changed lines is trivial (2 agents), at most 100 is
  lite (4), and the rest, or any security-sensitive path, is full (7+). The coordinator
  then judges alone: dedup, re-categorise, and a "Reasonableness filter: Speculative
  issues, nitpicks, false positives, and convention-contradicted findings get dropped.
  If the coordinator isn't sure, it uses its tools to read the source code and verify."
  [4] (F)
- **Speed.** Budgets: "Per-task: 5 minutes (10 for code quality, which reads more
  files)", "Overall: 25 minutes", and a session silent for 60 seconds is killed. Agents
  get paths, not diffs: per-file patch files and one shared context file, because
  copying context "across seven concurrent reviewers would multiply our token costs by
  7x". Lock files, minified and `@generated` files are stripped first. Median 3m39s, P90
  6m27s, P99 10m21s over 131,246 runs. [4] (F)
- **Precision.** In the prompts: "telling an LLM what not to do is where the actual
  prompt engineering value resides." No precision figure; about 1.2 findings a review,
  and 288 "break glass" overrides, 0.6% of merge requests. [4] (F)
- **Models and effort.** Top tier (Opus 4.7, GPT-5.4) is "Reserved exclusively for the
  Review Coordinator"; standard tier (Sonnet 4.6, GPT-5.3 Codex) runs code quality,
  security and performance; Kimi K2.5 runs the text-heavy reviewers. Median cost $0.98;
  full reviews average $1.68. No quality effect of the tiering is measured. [4] (F)

## Anthropic's reviewers

- **Pipeline.** Four products. The `code-review` plugin: a Haiku agent checks
  eligibility (closed, draft, "trivial change that is obviously correct", already
  reviewed), then four finders run in parallel, two Sonnet agents on `CLAUDE.md`
  compliance and two Opus bug agents, then "For each issue found in the previous step by
  agents 3 and 4, launch parallel subagents to validate the issue." [5] Managed Code
  Review: "Each agent looks for a different class of issue, then a verification step
  checks candidates against actual code behavior". [7] Ultrareview: "every reported
  finding is independently reproduced and verified". [9] The security-review action: one
  finder sub-task, then one parallel sub-task per vulnerability "to filter out
  false-positives", dropping "a confidence less than 8"; regex exclusions and a
  generated-file filter run before any model filter. [10] (F)
- **Speed.** Managed: "completing in 20 minutes on average", and "trivial ones get a
  lightweight pass". [7][8] Ultrareview: "roughly 5 to 10 minutes", refusing diffs over
  500 files or 8,000 lines. [9] Plugin agents are told "Do not test tools or make
  exploratory calls", and one Opus finder must "Focus only on the diff itself without
  reading extra context". [5] (F)
- **Precision.** Plugin finders are restrained: "If you are not certain an issue is
  real, do not flag it", and nothing a linter catches "(do not run the linter to
  verify)". [5] Managed: "less than 1% of findings are marked incorrect" internally;
  findings on 84% of PRs over 1,000 lines (7.5 issues) and 31% under 50 lines. [8] (F)
- **Models and effort.** Plugin: Haiku gates, Sonnet summarises and checks rules, Opus
  finds bugs; validators are "Opus subagents for bugs and logic issues, and sonnet
  agents for CLAUDE.md violations". [5] Local `/code-review` takes an effort level: low
  and medium report "only the findings it's most confident in"; high to max "broaden
  coverage and may include findings the review is less sure about". [7] Managed cost,
  $15 to $25, scales with "how many issues require verification". [7] (F)

## Sentry Seer

- **Pipeline.** "a multi-step pipeline based on hypothesis and verification". Over five
  changed files, an LLM narrows to the "most error-prone files". Then: "A drafting agent
  creates a report containing an initial analysis of potential bugs. This report is
  split into at most 3 bug hypotheses." "Concurrently, each hypothesis is analyzed by a
  dedicated agent." "A final agent gathers all the results". One drafter writes every
  hypothesis, so no cross-agent dedup is needed. The stated reason: "By focusing the
  verifying agents into a single hypothesis they can deep dive and more correctly assert
  if that is a valid bug or not." [13] (F)
- **Speed.** "we reworked the review pipeline to bring average latency down by roughly
  50%": "For some tasks that required less reasoning, we switched to more performant
  models", and a thinking budget "for all steps, and maximum iterations to the
  hypothesis and verification steps, to prevent overthinking." [14] (F)
- **Precision.** Each verifier writes a verdict, then revises it "after applying the bug
  guidelines" for that bug class. A last filter drops low confidence or severity (scale
  "0.000 to 1.000") and anything close to a previously downvoted suggestion. [13] (F)
- **Models and effort.** Unnamed. The measured effect is the speed change itself: "We
  ran evals & spot checks to ensure the performance improvements didn't negatively
  impact the reviews", on a set of "around 70 items". No absolute numbers. [13][14] (F)

## Uber uReview

- **Pipeline.** Prompt chains, not agents: ingestion "filters out low-signal targets
  such as configuration files, generated code, and experimental directories"; three
  assistants generate (bugs, best practices, security); then "A secondary prompt
  evaluates each comment's quality and assigns a confidence score", "a semantic
  similarity filter merges overlapping suggestions", and a category classifier
  suppresses categories "with historically low developer value". [15] (F)
- **Speed.** "within a median of 4 minutes"; context is pre-built, not explored. [15]
  (F)
- **Precision.** Thresholds are set "per assistant, per language, and comment category".
  75% of comments are marked useful; 65% are addressed, against 51% for human comments.
  Style and readability categories were cut for poor ratings. [15] (F)
- **Models and effort.** Best F1: "Claude-4-Sonnet as the primary comment generator"
  with "o4-mini-high as the review grader"; GPT-4.1 as grader was "4.5 points below".
  The grader is a small reasoning model at high effort. [15] (F)

## Qodo and PR-Agent

- **Pipeline.** Qodo 2.0 splits by dimension, "Each agent is optimized for a specific
  type of analysis and operates with its own dedicated context", then one judge
  "resolves conflicts, removes duplicates, and filters out low-signal results". [16]
  PR-Agent, its open-source ancestor, is one prompt per tool, capped: "A concise list
  (0-{{ num_max_findings }} issues)", default `num_max_findings = 3`. [18] (F)
- **Speed.** PR-Agent fits the diff to one prompt: files sorted by the repo's main
  languages, "remove all hunks of type deletion-only", patches added up to a token
  buffer, the rest listed by name. [17] Config has `ai_timeout=120`, `ignore_bot_pr` and
  incremental review. [18] (F) Qodo 2.0 gives no latency figure.
- **Precision.** Qodo: "Precision can be tuned through filtering and prioritization once
  issues are found. Recall cannot." It claims F1 60.1% and recall 56.7% on its own
  benchmark. [16] PR-Agent's prompt: "For lower-severity concerns, be certain before
  flagging." [18] (F)
- **Models and effort.** PR-Agent defaults to medium `reasoning_effort`, with an
  optional `model_weak`, "a weaker model to use for some easier tasks". [18] (F) Qodo
  publishes no models.

## Kodus

- **Pipeline.** Diff, finder, verification, "Anchoring and severity filters", delivered
  comment; measured per stage on 136 labelled bugs. Duplicates are removed "before the
  expensive verification stage". [19] (F)
- **Speed.** Only cost is reported: soft, depth-first coverage "matched or improved F1
  while costing roughly 25% to 36% less" than forcing full coverage. [19] (F)
- **Precision.** "In one run, verification discarded seven serious findings, including
  an SSRF, a race condition, a FIPS bypass, and a null-related bug. The verifier was
  treating uncertainty as evidence against the finding." The new rule, "Verification
  could discard a finding when it had a concrete reason to refute the claim", "roughly
  doubled delivered recall in the relevant comparison" and kept more false positives.
  Baseline: 72 of 136 bugs, 170 false positives. [19] (F)
- **Models and effort.** Gemini Flash, Gemini Pro, GPT-5.4 and Claude Sonnet: "Their
  delivered F1 remained in roughly the same 0.33 to 0.40 range", at $0.29 to $1.16 a PR.
  "once the model was capable of running the review, changing model tier did not repair
  the architectural losses around it." Misses were recognition failures: "The model saw
  the line." [19] (F)

## OpenAI Codex review

- **Pipeline.** One reviewer model, trained for the task, with repository tools and code
  execution. Diff-only review "results in the fastest review time. However, it often
  misses important context"; repository access gave "a stronger reviewer, catching more
  critical issues and raising fewer false alarms". [20] (F)
- **Speed.** No duration. "A system that is slow, noisy, or cumbersome will be
  bypassed." [20] (F)
- **Precision.** "we explicitly accepted a measured tradeoff: modestly reduced recall in
  exchange for high signal quality and developer trust." Authors act on 52.7% of
  comments. [20] (F)
- **Models and effort.** A budget sweep on issues PR authors had confirmed: "Even at a
  small fraction of the generator's token spend, the verifier catches a large share of
  previously identified high-severity issues", and "the additional budget mostly
  improves calibration and reduces false alarms". Performance "drops more rapidly with
  thinking budget on reviewing model generated code compared to the human-written". No
  figures are given. [20] (F)

## GitHub Copilot review

- **Pipeline.** One tool-calling agent that explores the repository, plans first on long
  PRs, and "catches issues as it reads, not just at the end". [21] (F)
- **Speed.** No duration. Dependency management files, log files and SVG files are
  skipped; a PR is reviewed once unless set to review each push. [22] (F)
- **Precision.** "Silence is better than noise. In 71% of the reviews, Copilot code
  review surfaces actionable feedback. In the remaining 29%, the agent says nothing at
  all." About 5.1 comments per review. [21] (F)
- **Models and effort.** The one published trade of depth for speed: "adopting a more
  advanced reasoning model improved positive feedback rates by 6%, even though review
  latency increased by 16%." [21] (F)

## Ellipsis

- **Pipeline.** "several Comment Generators run in parallel to find different types of
  issues", each attaching "Evidence (links to code snippets)"; then dedup, a confidence
  threshold, and a Logical Correctness filter for hallucinations. [23] (F)
- **Speed.** "latency is not nearly as big of a concern as accuracy". [23] (F)
- **Precision.** The filter pipeline cuts false positives; no figure is given. [23] (F)
- **Models and effort.** Generators mix models: "why choose between GPT-4o and
  Sonnet-3.6 when you can have both?" From January 2025, before current models. [23] (F)

## Baz

- **Pipeline.** Map context, infer intent, generate Socratic questions, then "Spawn
  independent sub-agents, each assigned to prove or disprove one risk"; contract "input
  = risk hypothesis, output = evidence + verdict". Finder and verifier are one agent per
  hypothesis; a reflection step consolidates. [24] (F)
- **Speed.** No duration; sub-agents get "scoped search to reduce cost". [24] (F)
- **Precision.** 7/8 on eight real production-bug PRs, against 4.5/8 for the earlier
  Baz, 3.5/8 Codex and 3/8 Claude Code. Eight cases is a small sample. [24] (F)
- **Models and effort.** That run used "GPT-5 by OpenAI with low reasoning". [24] (F)

## What the papers measured

- **SWR-Bench** [25] (F). Running one reviewer n times and aggregating with one more
  call: Gemini-2.5-Flash at n=10 reached F1 "21.91% (a 43.67% increase)" and recall
  "30.44% (a 118.83% increase)"; precision stayed the limit. A debating multi-agent
  reviewer averaged F1 9.22% against 18.73% for one well-engineered prompt: "the
  interaction overhead and potential for error propagation among agents can render the
  task-solving process less controllable".
- **CR-Bench** [26] (F). A Reflexion agent that iterates on its own review raised
  GPT-5.2 recall from 27.01% to 32.76% and cut signal-to-noise from 5.11 to 1.95; on
  GPT-5-mini it fell from 2.89 to 0.91. "if we pressure an agent to identify more bugs
  (like Reflexion), the noise increases".
- **Refute-or-Promote** [27] (F). Staged adversarial review "killed roughly 79% of 171
  candidates": the first stage eliminated about 63% of them, the second about 42% of the
  survivors, and the cross-model critic made about 3% of all kills. "Unanimity is a
  low-signal event": a non-existent OpenSSL bug was endorsed unanimously and "killed
  only by a single empirical test". The other direction too: a real overflow,
  CVE-2026-41254, "was unanimously killed and recovered only via human override"; the
  pipeline "relies on the human orchestrator to rescue true positives incorrectly
  killed". Limits: one operator, "No ablation studies", recall not measured.
- **Do More Agents Help?** [28] (F, abstract and introduction). With GPT-4.1 under one
  protocol, "at most one of six tested MAS exceeds the matched single-agent anchor"; the
  other five "trail by 2.56-11.29 points and occupy more expensive accuracy-cost
  trade-offs". General benchmarks, not code review.
- **Read together** (I). Repeated finding raises recall and noise in step. A verifier
  told to kill also kills real findings unless an empirical check can overrule it.

## Where the systems disagree

- **Fan-out shape.** Dimension specialists: Cloudflare, Anthropic, Qodo, Uber, Ellipsis.
  One agent: Bugbot, Codex, Copilot. One narrow agent per capped hypothesis: Sentry and
  Baz. Cursor says one agent gave "the largest gains"; Qodo says one agent doing
  everything "leads to tradeoffs between depth, speed, and coverage". Neither publishes
  a controlled comparison. [1][16] (F) Every single-agent system runs a model its vendor
  trains or tunes for review. (I)
- **Voting passes.** Cursor called them "One of the most effective quality improvements
  we found early on", then replaced them. SWR-Bench measures a gain. Kodus found the
  union of passes nearly doubled false positives. [1][25][19] (F)
- **Verification.** One validator per finding: three Anthropic products, Sentry, Baz.
  One judge over all findings: Cloudflare, Qodo. A score threshold: Uber, Ellipsis.
  Nothing separate: Bugbot today, Codex, Copilot. Only the Anthropic plugin is seen
  changing sides, from threshold to validators. [5] (F)
- **Finder stance.** Restrained: Anthropic plugin, Cloudflare, PR-Agent. Aggressive:
  Cursor, and Kodus once verification was fixed ("The finder is allowed to raise
  candidates more freely"). [1][5][19] (F)
- **Diff-only or exploring.** One Anthropic plugin finder is diff-only by instruction;
  OpenAI, Copilot, Cursor and Baz credit repository access. [5][20][21][1][24] (F)
- **Bigger model, more thinking.** Copilot: +6% positive feedback for +16% latency.
  Kodus: no change in delivered F1 across tiers. Sentry: less thinking, no measured
  loss. OpenAI: extra budget buys calibration. Baz: low reasoning. [21][19][14][20][24]
  (F)
- **Running checks.** The Anthropic plugin forbids running the linter. Refute-or-Promote
  and Kodus name execution as the strongest evidence, and Cursor plans "letting Bugbot
  run code to verify its own bug reports". [5][27][19][1] (F)

## Tried and removed

- **Cursor.** The eight-pass voting pipeline and its validator model. Also: "Many
  changes, surprisingly, regressed our metrics." [1] (F)
- **Anthropic plugin.** Commit `9babb8d` (2025-12-06) deleted the per-issue Haiku
  scorer, its 0-100 rubric and "Filter out any issues with a score less than 80"; three
  finders (git blame and history, previous PR comments, code comments); and a second
  eligibility check. Validators replaced the scorer and Opus replaced Sonnet for bugs.
  No reason is published, and the README still describes the old design. [5][6] (F)
- **Kodus.** Multi-pass finding as default: "Its recall gain was real, and so was its
  false-positive problem." Verifier voting: 83 true and 294 false positives became 52
  and 159. Per-hunk verdicts "made the result worse, dropping from 36% to 31%". Hard
  coverage: more cost, lower delivered F1. The graph tool: "Across roughly 600 tool
  calls, usage of the graph tool was zero." Prompt changes: "no effect beyond normal
  run-to-run variation". [19] (F)
- **Sentry, Uber, Copilot.** Unbounded thinking and iterations [14]; single-shot
  prompting and the readability and style categories [15]; finalising findings only at
  the end of a review [21]. (F)
- **Anthropic's harness work.** Sprint decomposition went when a newer model no longer
  needed it: "every component in a harness encodes an assumption about what the model
  can't do on its own". The evaluator stayed, with a boundary: "It is worth the cost
  when the task sits beyond what the current model does reliably solo." [11] (F)

## What transfers to review-pr

The measured run: 72 minutes on a 10-file, +534/−158 PR, every agent on the largest
model at high effort, about half of agent time spent thinking. Cloudflare's rule calls
that PR full tier, so tiering by size would not have shortened it. Stages already fan
out in parallel, so wall clock is the slowest agent of each stage, summed: per-agent
time and stage count matter more than agent count. (I) Minutes are estimates against
that run; time each stage once and re-rank. (E)

1. **Set effort and model per step; cap thinking and iterations.** Keep the largest
   model where a miss is a recognition failure: the bug finder and the bug verifier.
   Use medium or low effort elsewhere, and a smaller model for convention and
   documentation dimensions, eligibility, summary and dedup. Saves 20 to 30 minutes. (E)
   Support: Sentry [14]; the tiers at Cloudflare and in the Anthropic plugin [4][5]; Baz
   at low reasoning [24]; OpenAI's sweep [20]. Quality risk: budget buys calibration, so
   a low-effort verifier passes more false alarms [20]; Copilot gained 6% from deeper
   reasoning [21]; a small model collapsed under iterative bug hunting [26]. Adopt
   against a fixed PR set, as Sentry did.
2. **Give every agent a wall-clock budget and kill stragglers.** Cloudflare's 5 minutes
   a reviewer, 10 for the heaviest, and a hard cap hold its P99 at 10m21s [4]. Anthropic
   found "Agents struggle to judge appropriate effort for different tasks, so we
   embedded scaling rules in the prompts" [12]. Saves 10 to 20 minutes. (E) Quality
   risk: a deep trace is cut short. Report a timed-out dimension as not reviewed, never
   as clean; Kodus: "Those states should never be indistinguishable." [19]
3. **For bugs, draft, cap, then one agent per hypothesis.** One drafter reads the diff
   and writes at most three hypotheses; each goes to one agent that must prove or
   disprove it with evidence [13][24][18]. This folds the bug finder and its refuter
   into one stage and bounds fan-out. Keep dimension specialists for the rest. Saves 5
   to 15 minutes. (E) Quality risk: the cap drops a fourth real bug. Cloudflare averages
   1.2 findings a review, Anthropic 7.5 on PRs over 1,000 lines [4][8]; scale the cap
   with diff size.
4. **Keep one verifier per serious finding and change its rule.** Discard only on a
   concrete refutation; pass doubt through as lower confidence [19]. Require `file:line`
   evidence from finders so the verifier checks a claim instead of re-deriving it
   [23][24]. Run the claim where that is cheap [27]. Skip verification for convention
   findings that quote the rule. Little time saved; this protects recall while items 1
   to 3 cut time. (I) Quality risk: more false positives survive, as Kodus saw.
5. **Write the context once.** The orchestrator writes filtered per-file patches and one
   shared context file; agents read them and may still grep [4]. Strip lockfiles,
   generated and minified files and deletion-only hunks first [4][10][17]. Saves 3 to 8
   minutes. (E) Quality risk: low; exempt migrations, as Cloudflare does.
6. **Tell finders what not to flag.** Fewer candidates means fewer verifiers [4][5][18].
   Quality risk: Cursor found a restrained agent "too cautious" [1]. Restrain by
   category (style, pre-existing, linter-catchable), not by certainty. (I)
7. **Review only the delta on re-push**, carrying open findings forward [2][4]. Saves
   most of a re-review and nothing on a first review. (E) Quality risk: interactions
   between old and new code go unseen.

Do not add identical voting passes, verifier voting, per-hunk agents, a coverage or
recovery pass, or a larger model on every step. Each was measured and lost. [19][26] (F)

## Not found

- A controlled comparison of fan-out shapes on one benchmark with one model.
- A head-to-head time cost of per-finding verification against one batched judge.
- Per-step durations for any system; only whole-review figures are published.
- A reasoning-effort ablation for code review with numbers.
- Models, agent counts and effort for managed Code Review and ultrareview.
- Precision figures for Cloudflare, Sentry, Ellipsis and Copilot.
- How Sentry splits one draft report into hypotheses, beyond "at most 3".
- Why Anthropic replaced the plugin's score threshold with validators.

## Sources

1. [Cursor, "Building a better Bugbot"](https://cursor.com/blog/building-bugbot), 2026-01-15, FETCHED
2. [Cursor, "Bugbot is now over 3x faster"](https://cursor.com/blog/bugbot-updates-june-2026), 2026-06-10, FETCHED
3. [Cursor, "Bugbot now self-improves with learned rules"](https://cursor.com/blog/bugbot-learning), 2026-04-08, SNIPPET
4. [Cloudflare, "Orchestrating AI Code Review at scale"](https://blog.cloudflare.com/ai-code-review/), 2026-04-20, FETCHED
5. [Anthropic, `code-review` plugin command file](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md), last changed 2026-03-12, rewrite commit `9babb8d` 2025-12-06, FETCHED
6. [Anthropic, `code-review` plugin README](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/README.md), undated, FETCHED
7. [Claude Code docs, "Code Review"](https://code.claude.com/docs/en/code-review), undated, FETCHED
8. [Anthropic, "Code Review for Claude Code"](https://claude.com/blog/code-review), 2026-03-09, FETCHED
9. [Claude Code docs, "Find bugs with ultrareview"](https://code.claude.com/docs/en/ultrareview), undated, FETCHED
10. [Anthropic, `claude-code-security-review`](https://github.com/anthropics/claude-code-security-review), command file, filter code and README, undated, FETCHED
11. [Anthropic, "Harness design for long-running application development"](https://www.anthropic.com/engineering/harness-design-long-running-apps), 2026-03-24, FETCHED
12. [Anthropic, "How we built our multi-agent research system"](https://www.anthropic.com/engineering/multi-agent-research-system), 2025-06-13, FETCHED
13. [Sentry, "Building a Code Review system that uses prod data to predict bugs"](https://blog.sentry.io/building-a-code-review-system-that-uses-prod-data-to-predict-bugs), 2025-12-18, FETCHED
14. [Sentry, "AI Code Review: 30K Bugs Lighter, 50% faster"](https://blog.sentry.io/ai-code-review-30k-bugs-lighter-50-faster/), 2025-10-27, FETCHED
15. [Uber, "uReview: Scalable, Trustworthy GenAI for Code Review at Uber"](https://www.uber.com/blog/ureview/), 2025-08-12, FETCHED
16. [Qodo, "Introducing Qodo 2.0"](https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/), 2026-02-04, FETCHED
17. [PR-Agent docs, "Compression strategy"](https://docs.pr-agent.ai/core-abilities/compression_strategy/), undated, FETCHED
18. [PR-Agent, `configuration.toml` and `pr_reviewer_prompts.toml`](https://github.com/The-PR-Agent/pr-agent/tree/main/pr_agent/settings), `main` branch, FETCHED
19. [Kodus, "We ran 20 experiments to improve AI code review recall"](https://kodus.io/en/ai-code-review-recall/), 2026-08-18, FETCHED
20. [OpenAI, "A Practical Approach to Verifying Code at Scale"](https://alignment.openai.com/scaling-code-verification/), 2025-12-01, FETCHED
21. [GitHub, "60 million Copilot code reviews and counting"](https://github.blog/ai-and-ml/github-copilot/60-million-copilot-code-reviews-and-counting/), 2026-03-05, FETCHED
22. [GitHub docs, "About GitHub Copilot code review"](https://docs.github.com/en/copilot/concepts/agents/code-review), undated, FETCHED
23. [Nick Bradford, "How we built Ellipsis"](https://www.nsbradford.com/blog/how-we-built-ellipsis), 2025-01-30, FETCHED
24. [Baz, "The Architecture of Agentic Code Review"](https://baz.ai/resources/engineering-intuition-at-scale-the-architecture-of-agentic-code-review), 2025-12-15, FETCHED
25. [SWR-Bench, "Benchmarking and Studying the LLM-based Code Review"](https://arxiv.org/abs/2509.01494), arXiv 2509.01494v1, 2025-09, FETCHED
26. [CR-Bench, "Evaluating the Real-World Utility of AI Code Review Agents"](https://arxiv.org/abs/2603.11078), arXiv 2603.11078v1, 2026-03-10, FETCHED
27. [Refute-or-Promote](https://arxiv.org/abs/2604.19049), arXiv 2604.19049v1, 2026-04-21, FETCHED
28. [Do More Agents Help?](https://arxiv.org/abs/2606.05670), arXiv 2606.05670v1, 2026-06-04, FETCHED (abstract and introduction)
