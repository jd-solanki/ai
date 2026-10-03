# Minor findings: how paid PR reviewers handle them

Researched 2026-10-03. Every claim carries a tag and a source key from **Sources**:
`[F]` fetched and read, `[S]` search snippet or relayed by another agent and not
re-fetched, `[I]` inferred here from the evidence, `[E]` an estimate made here. How each
tool reviews is in `code-review-coderabbit.md` and `code-review-greptile.md`; this note
covers only minor, low-severity and nitpick findings.

## Summary

- Both vendors keep two labels apart: what kind of remark it is and how bad it is.
  CodeRabbit has a type (nitpick, potential issue, refactor suggestion) and a severity
  (critical, major, minor, trivial, info). Greptile has a badge (P0, P1, P2) and a type
  (logic, syntax, style). The review model assigns both `[F: cr-findings, gr-anatomy]`.
- Neither drops minors by default. CodeRabbit's default `chill` profile posts minor
  defects as inline threads and folds nitpicks into a collapsed block of the review body.
  Greptile posts P2 as inline threads, like P0 and P1 `[F: gh-bf, gh-litellm]`.
- A minor defect and a nitpick are gated differently. With CodeRabbit's opt-in
  request-changes workflow, a `🟡 Minor` inline thread requests changes, but a review
  holding only folded nitpicks was approved six seconds later `[F: gh-bf]`. Greptile never
  requests changes, and one summary scored 5/5 while calling an open P2 "non-blocking"
  `[F: gh-rakazo]`.
- On new commits both review only the delta, resolve their own threads once fixed, and
  edit one summary in place. CodeRabbit restates still-open inline findings under
  `♻️ Duplicate comments` instead of opening new threads. A folded nitpick was not carried
  into later rounds `[F: cr-cmd, gh-tsd, gh-tri]`.
- Both hand fixes to an agent. CodeRabbit's fix-all prompt includes nitpicks and opens
  with "Verify each finding against current code. Fix only still-valid issues". Greptile's
  own `greploop` skill treats every unresolved comment, P2 included, as work until 5/5
  `[F: gh-bf, gr-greploop]`.
- Suppression is learned, not prompted. Greptile drops a class after three ignores but
  never security or input-validation classes; CodeRabbit stores chat corrections as
  learnings `[F: gr-reduce, cr-learn]`. Greptile: "we simply could not get the LLM to
  produce fewer nits without also producing fewer critical comments" `[F: shutup]`.
- Against pile-up, CodeRabbit documents a post-merge action that files every comment left
  unresolved at merge as a tracker issue `[F: cr-pma]`.
- The other tools agree that minors do not block. Copilot labels High, Medium and Low but
  only comments, unless approvals are enabled. Qodo calls Medium "Non-blocking" and keeps
  below-threshold findings in the summary. Bugbot's check is `neutral` when it finds
  issues. Qodo's and Bugbot's auto-fix skip minors by default
  `[F: cp-use, qd-anatomy, qd-thresh, bb-docs, qd-fix, bb-log]`.

| | CodeRabbit (`chill`, default) | Greptile (strictness 2, default) |
| --- | --- | --- |
| Minor defect | Inline thread, `🟡 Minor` | Inline thread, P2 |
| Polish | Folded `🧹 Nitpick comments` in the review body | Inline thread, P2, `style` type |
| Blocks merge | Inline threads only, and only with `request_changes_workflow` | No; check passes, review is `COMMENTED` |
| Next round | Fixed threads resolved; open ones restated as duplicates | Fixed threads resolved; summary lists what is open |
| Fix path | Per-comment agent prompt, fix-all prompt, Autofix | Suggested code, Fix with your Agent, Fix All |

## Severity model

**CodeRabbit.** A finding carries "four independent closed vocabularies. They are four
separate axes, not one severity ladder: a nitpick can be a security finding"
`[F: cr-findings]`.

- Type: "Nitpick | An optional polish suggestion"; "Potential issue | A possible defect
  requiring attention"; "Refactor suggestion | A suggested structural improvement"
  `[F: cr-findings]`.
- Severity: critical, major, minor, trivial, ranked; info and none sit outside the
  ranking. "🟡 Minor - Issues that should be addressed but don't critically impact the
  system"; "🔵 Trivial - Low-impact suggestions for code quality improvements"
  `[F: cr-findings, cr-overview]`.
- Effort: quick win, heavy lift, low-value fix, poor tradeoff. It "lets you pull the quick
  wins into this pull request and push the heavy lifts into a follow-up without arguing
  about severity first" `[F: cr-findings]`.
- Posted comments now lead with category, severity and effort, such as
  `_🎯 Functional Correctness_ | _🟡 Minor_ | _⚡ Quick win_`. In March 2026 they led with
  type and severity, `_⚠️ Potential issue_ | _🟠 Major_` `[F: gh-bf, gh-tsd]`. The
  folded nitpick on `#5624` carried `🔵 Trivial` `[F: gh-bf]`.
- Who decides: the review model. Swapping models moves the mix: Opus 4.8 "minor and
  nitpick findings both roughly double"; Sonnet 5 "labeled two critical and one of those
  was wrong" `[F: opus48, sonnet55]`. CodeRabbit files nitpicks under "low confidence"
  `[F: opus5]`. No rule mapping a finding to a level is published `[I]`.

**Greptile.**

- Badges: "P0 | Critical | Must fix before merging"; "P1 | High | Should fix — bugs,
  incorrect behavior, edge cases"; "P2 | Medium | Consider fixing — code quality,
  maintainability, best practices". There is no lower level `[F: gr-anatomy]`. Badges
  shipped on 2026-03-28 `[F: gr-log]`.
- Types: `logic`, `syntax`, `style`, all on by default `[F: gr-nit]`. A team rule in
  `.greptile/config.json` can carry `"severity": "low" | "medium" | "high"` `[F: gr-cfg]`.
- Confidence score, 0–5, from "the severity and quantity of issues found, the complexity
  of changes, and how well the code aligns with your codebase patterns". 4/5 reads "Minor
  polish needed | Merge after small fixes" `[F: gr-anatomy]`.
- Who decides: the review agent. Greptile tried a 1–10 LLM severity judge and a NITPICK
  label and dropped both; see "Tried and removed" in `code-review-greptile.md`.

## Posting

**CodeRabbit.** `reviews.profile` is `quiet`, `chill` or `assertive`, default `chill`:
"quiet for only the most important feedback, chill for balanced feedback, assertive for
more feedback (which may feel nitpicky)" `[F: cr-config]`.

- Quiet, added 2026-07-02, "posts only the most important comments inline — critical and
  major issues that are also high-impact — and groups everything else into collapsed
  sections in the review summary" `[F: cr-glossary, cr-log]`. In practice the review body
  opens "Quiet mode is enabled, so only the most important comments were posted inline".
  The first review put two `🟠 Major` items inline and one `🟡 Minor` under
  `🟡 Other comments (1)`; the second put two `🟡 Minor` items under
  `🟡 Other comments (2)` `[F: gh-ph]`.
- Chill posts minor-severity defects inline. Nitpicks go into
  `<details><summary>🧹 Nitpick comments (1)</summary>` in the review body, grouped by
  file, each with its own `🤖 Prompt for AI Agents` `[F: gh-bf]`.
- The docs disagree with that. A 2025 post says "nitpicks are hidden unless you opt into
  Assertive mode" `[F: codex]`, and the report docs say the nitpick count "will be 0
  unless assertive/nitpick mode is enabled" `[F: cr-reports]`. Chill reviews in October
  2026 carry the folded nitpick block `[F: gh-bf]`. "Hidden" now reads as "folded" `[I]`.
- Linters follow the profile too: PHPStan's default level is 3 under `chill` ("real bugs
  only") and 8 under `assertive` `[F: cr-config]`.

**Greptile.** P2 is posted the same way as P0 and P1: an inline thread with a badge and a
bold title, and one numbered line in the summary's `Findings` linking to the thread. The
two summaries read in full had no collapsed block for low-severity findings
`[F: gh-litellm, gh-rakazo]`.

- `strictness`: "`1` = verbose (all issues)", "`2` = balanced (default)", "`3` = critical
  only". A subdirectory's `.greptile/config.json` can override it `[F: gr-nit]`.
- `commentTypes`: "This array replaces the default". The documented recipe for "Code
  quality without style nitpicks" is `["logic", "syntax"]` `[F: gr-nit]`.
- `updateSummaryOnly`: "Only update summary, don't post individual inline comments"
  `[F: gr-json]`.
- The summary's verdict line names only what blocks: "The PR is not ready to merge while
  the PowerShell installer can leave generated credentials committable and miss an
  existing database", over a list of two P1 and five P2 `[F: gh-litellm]`.

## Merge gating

**CodeRabbit.** Nothing gates by default; `request_changes_workflow` defaults to `false`
`[F: cr-config]`. With it on:

- "If the review posts actionable inline comments, CodeRabbit submits a request-changes
  review." Approval needs a reviewed latest commit, "All required review threads must be
  resolved", and no failing pre-merge check `[F: cr-rcw]`.
- A minor defect blocks. Two `🟡 Minor` inline threads produced `CHANGES_REQUESTED` on
  `betaflight-configurator#5624`. On `#5575` a `🟡 Minor` thread requested changes at
  22:58; CodeRabbit approved a later commit at 23:12, and the thread shows
  `resolvedBy: coderabbitai[bot]` `[F: gh-bf]`.
- A nitpick does not. On `#5575` a review whose only content was one folded nitpick was
  submitted at 20:49:39 and an approval of the same commit followed at 20:49:45
  `[F: gh-bf]`. The changelog: "Grouped or lower-priority feedback no longer blocks
  auto-approval" (2026-07-10) `[F: cr-log]`. Under `quiet`, minors are grouped, so they
  stop blocking too `[I]`.
- Escape hatch: `@coderabbitai resolve` or `approve` "removes the review blocker so the PR
  can be merged, but it does not mark the comment as accepted" `[F: cr-metrics]`. Authors
  may use both on their own PRs unless `allow_author_approval: false` (2026-10-01)
  `[F: cr-log]`.
- The only severity-threshold check is the Security check: "Set **Block on** to the lowest
  severity you want to block. The default is **Critical**", with options down to "Trivial
  and above" `[F: cr-sec]`.
- In Change Stack, minors land in Advisory: "Optional cleanup and low-priority guidance";
  "a change can ship with them outstanding" `[F: cr-findings]`.

**Greptile.**

- Every Greptile review on the 16 PRs whose reviews were listed was `COMMENTED`
  `[F: gh-gr]`, and no doc page read offers a request-changes mode `[I]`.
- The `Greptile Review` check concluded `success` on a PR scored 4/5 with an open P1:
  "13 files reviewed, 1 comments added." It reports completion, not a verdict
  `[F: gh-omarchy]` `[I]`.
- The score treats P2 as soft. One summary at `Reviews (3)` read "Confidence Score: 5/5"
  and "The PR appears safe to merge; the remaining new issue is a non-blocking source of
  end-to-end test flakiness" over one open P2. The author fixed it anyway; `Reviews (4)`
  read "no outstanding findings remain" 13 minutes later `[F: gh-rakazo]`.
- Across 44 summaries read on 2026-10-03: the five listing only P2 scored 4, 4, 4, 5 and
  5; 26 of the 27 listing any P1 scored 4 or lower; 10 of the 12 with no findings scored
  5 `[F: gh-gr]`.
- Auto-approve, a beta that is off by default, "only approves PRs with a clean **5/5
  Greptile review**", and "If Greptile finds an issue ... it will not approve the PR".
  "When new commits are pushed to an approved PR, Greptile dismisses its earlier approval"
  `[F: gr-approve, gr-cfg]`.

## Across rounds

**CodeRabbit.**

- Each push gets an incremental review, on by default `[F: cr-config]`. It "takes all
  comments that CodeRabbit has made since its most recent full review into consideration,
  and generates a review of only the new changes" `[F: cr-cmd]`.
- "During the next review, CodeRabbit checks its open threads and resolves those that the
  changes addressed" `[F: cr-rcw]`. Threads on `TanStack/devtools#290` and
  `betaflight-configurator#5575` show `resolvedBy: coderabbitai[bot]` `[F: gh-tsd, gh-bf]`.
- Still-open inline findings are not re-posted as threads. The third review on
  `TanStack/devtools#290` restated two earlier inline findings under
  `♻️ Duplicate comments (2)` in its body; the fourth restated one `[F: gh-tsd]`.
- Folded nitpicks belong to their review. That PR's first nitpick did not reappear in any
  later review; the third review's nitpick was a new one `[F: gh-tsd]`. Unaddressed
  nitpicks drop out of view after one round `[I]`.
- Change Stack compares snapshots "finding by finding, whether it remains, was addressed,
  or was skipped" `[F: cr-findings]`. The summary comment is edited in place; see "What it
  posts" in `code-review-coderabbit.md`.

**Greptile.**

- Greptile resolves its own threads. On `TriliumNext/Trilium#11829`, after 15 reviews,
  all nine threads, eight of them P2, were resolved by `greptile-apps[bot]` `[F: gh-tri]`.
  The docs: "When you push a commit that touches the flagged files, Greptile marks the
  corresponding review comments as addressed" `[F: gr-agent]`. The analytics use an
  LLM judge instead: "'Addressed' is determined by an LLM-as-judge" `[F: gr-log]`.
- The summary lists only what is open now and says what changed: "The change since the
  previous review adds an end-to-end test for failed refresh and retry" `[F: gh-rakazo]`.
  Re-review dedup is the `post-review-gate`; see `code-review-greptile.md`.
- Rounds do not run dry. `thomhurst/Respire#678` reached `Reviews (74)` and 31 threads,
  seven of them P2, within two days; "Stale Sentinel gets priority" or "takes priority"
  titles three of them `[F: gh-respire]`. After "repeated re-reviews of a user's pushes"
  Greptile posts a tip about "fixing all findings with your coding agent" `[F: gr-org]`.

## Resolution path

**CodeRabbit.**

- Every comment, nitpicks included, carries `🤖 Prompt for AI Agents`
  (`enable_prompt_for_ai_agents`, default `true`) `[F: cr-config, gh-bf]`.
- The review body ends with `🤖 Prompt to fix review comments`: the inline comments, then
  a `Nitpick comments:` block. It opens "Verify each finding against current code. Fix only
  still-valid issues, skip the rest with a brief reason, keep changes minimal, and
  validate" `[F: gh-bf]`.
- Autofix: a `🪄 Fix CodeRabbit comments on this PR` checkbox, or `@coderabbitai autofix`,
  which "scans unresolved review threads started by CodeRabbit". It pushes a commit or a
  stacked PR `[F: cr-autofix]`. Whether the command form reaches folded nitpicks, which
  are not threads, is undocumented `[I]`.
- One-click commit needs a `suggestion` block "anchored to real lines on the **new** side
  of the diff" `[F: cr-reviewing]`; a folded nitpick has no such anchor `[I]`.
- Learnings: reply in the thread, e.g. "@coderabbitai Don't suggest adding user IDs to
  error messages." "For one-time exceptions ... resolve the comment without creating a
  learning" `[F: cr-learn]`.
- After merge, a documented example action: "Any CodeRabbit comment left unresolved at
  merge time becomes a tracked Linear issue, so review findings don't get lost", told "Do
  not create tickets for comments that were resolved or for nitpicks explicitly marked as
  non-blocking" `[F: cr-pma]`.

**Greptile.**

- "Most comments include a code suggestion you can apply" `[F: gr-anatomy]`. Each comment
  has **Fix with your Agent**; the summary has **Fix All**, which "sends every issue at
  once" `[F: gr-agent]`.
- `greploop` (v1.3): loop until "5/5 confidence score with zero unresolved comments", at
  most five iterations. For each unresolved comment: "If actionable, make the fix"; "If
  informational or a false positive, note it but still resolve the thread". There is no
  severity filter `[F: gr-greploop]`.
- Learning: "Greptile reads the **first** and **last** commit of every PR to see which
  comments were addressed". A comment type ignored three or more times is suppressed
  unless it is a critical bug. "Never Gets Suppressed": security vulnerabilities, memory
  leaks, infinite loops, null pointer exceptions, missing input validation
  `[F: gr-reduce]`.

## What the vendors say

**Greptile.**

- "~19% were good, 2% were flat-out incorrect, and 79% were nits - comments that were
  technically true but not something the dev cared about" (2024) `[F: shutup]`.
- "Nits are subjective - definitions and standards vary from team to team" `[F: shutup]`.
- On a NITPICK label: "It also often labeled critical issues as nitpicks, which is
  unacceptable in our context" `[F: hn-label]`.
- 2026: "LLMs are reluctant to risk downplaying the severity of an issue and therefore are
  unable to usefully filter out nits" `[F: hn-nit]`.
- The docs frame it as attention: "Developers focus on easy-to-fix style issues while
  missing critical bugs"; "Low addressed rate? Your rules may be too noisy"
  `[F: gr-reduce, gr-analytics]`.

**CodeRabbit.**

- "Refactors show only if the model marks them as essential. Nitpicks are opt-in"
  (2025-09-30), after GPT-5 nearly doubled comments per review `[F: codex]`.
- Quiet exists so "nothing is lost while the inline noise stays low" `[F: cr-log]`.
- Nitpicks sometimes hold real bugs: "The baseline's nitpick-level comments detect 2
  additional EPs (+8.7pp) beyond its main comments" `[F: gemini31]`.
- Its own scoring leaves them out: "at least one regular actionable comment passed
  (outside-diff and nitpick comments excluded)" `[F: sonnet55]`. Opus 5 "adds a
  substantial nitpick tail": 110 nitpicks in one configuration `[F: opus5]`.
- Acceptance is measured per severity, and closing a thread is not acceptance: "Manually
  resolving the conversation" and `@coderabbitai resolve` do not count `[F: cr-metrics]`.
  No per-severity figures are published.

## Other tools

These are short and come from primary docs. Claims tagged `[S: helper]` were relayed by
a helper agent and not re-fetched.

**GitHub Copilot code review.**

- Severity: "Copilot labels each comment with a severity level of "High," "Medium," or
  "Low"" (since 2026-05-12) `[F: cp-use, cp-may]`. Low comments go inline, and the overview
  counts them: "Findings: 1 [Medium] · 2 [Low]" under "🟡 Changes recommended"
  `[F: gh-vsc]`. No severity threshold is documented `[S: helper]`.
- Gating: "By default, Copilot leaves a "Comment" review, not an "Approve" review or a
  "Request changes" review". Approvals are a preview, "off by default", and dismissed on
  new commits. The docs list this as unsupported: "Block a PR from merging unless all
  Copilot code review comments are addressed" `[F: cp-use, cp-cust]`. A "Changes
  recommended" verdict was still a `COMMENTED` review `[F: gh-vsc]`.
- Rounds: one review per PR unless set to review each push `[F: cp-con]`. Since
  2026-09-11 "Copilot now resolves that comment during its rereview". Since 2026-09-18 it
  honours a reply asking to leave an issue open, and the overview shows "Resolved since
  last review" and "Previously missed" `[F: cp-sep11, cp-sep18]`. The docs still say
  re-reviews "may repeat the same comments again, even if they have been dismissed"
  `[F: cp-use]`. On `microsoft/vscode#339437` Copilot resolved all three threads, two of
  them Low, and the next overview read "🟢 Approval recommended" `[F: gh-vsc]`.
- Vendor numbers: an ensemble "increased the average number of addressed comments per
  review by 47% for high severity findings, 31% for medium, and 11% for low". Shell tools
  made Copilot surface "more high severity findings and fewer nits" `[F: cp-sep11]`.

**Graphite Agent (formerly Diamond).**

- No severity scale is documented, only categories such as "Code quality/style" and
  "Logic bug" `[F: gt-feat]`. None of 83 sampled comments carried a label on GitHub
  `[S: helper]`.
- Everything posts inline. Natural-language exclusions cut minors: "Skip specific types
  of comments", with the example "Don't leave comments about naming changes that could be
  considered nits". "If an exclusion is written too broadly, then Graphite Agent may not
  leave valid comments" `[F: gt-cust, gt-feat]`.
- All 51 sampled reviews were `COMMENTED`. Humans resolved all 58 resolved threads
  sampled `[S: helper]`.
- Claims: "<3% false-positive rate", and "focus on the big picture rather than getting
  caught up in typos and stylistic nits" (2024). Now: "Less than 5% negative comment rate"
  `[F: gt-launch, gt-feat]`.

**Qodo and PR-Agent.**

- Qodo tiers: High, "High-priority or blocking issues that should be addressed before
  merging"; Medium, "Non-blocking issues that improve code quality"; Low, "Lower-impact or
  informational findings that provide context or optional guidance". A separate relevance
  axis reads "Low: Similar findings were typically ignored" `[F: qd-anatomy]`. A judge
  agent "filters out anything low-confidence" `[S: qd-home]`.
- Posting: "The severity threshold applies only to inline comments", and "A finding below
  the threshold still appears in the summary, it's never dropped entirely"
  `[F: qd-thresh]`. Qodo's low-noise recipe sends High to "Both", Medium to "Summary" and
  Low to "Drop" `[F: qd-noise]`. The docs disagree on the default threshold `[S: helper]`.
- Rounds: "it re-evaluates every finding that's still open against the changes made since
  the finding was raised". Fixed findings are struck through in place `[F: qd-track]`.
- Auto-fix defaults to "`3` (default) | Fixes High findings only"; `1` "Fixes all
  findings, including Low" `[F: qd-fix]`.
- Why: "The abundance of minor suggestions often drowned out genuinely important
  findings", and "the labels and the importance score weren't accurate enough". After the
  cut, "The acceptance rate of each code suggestion increased by 50%" (2025-01-29)
  `[F: qd-blog]`.
- PR-Agent: a reflect pass scores each suggestion. It gives "moderate scores (3-7) to
  suggestions that tackle minor issues, improve code style", and 0 for "Adding docstring,
  type hints, or comments" `[F: pa-reflect]`. Defaults: `suggestions_score_threshold=0`,
  `focus_only_on_problems=true`, `num_max_findings = 3`, `persistent_comment=true`,
  `persistent_inline_comments = false`, `auto_resolve_fixed_inline_threads = false`
  `[F: pa-cfg]`.

**Cursor Bugbot.**

- Comments carry "**Low Severity**", "**Medium Severity**" or "**High Severity**"
  `[F: gh-bb]`. The docs name severity only in API output `[F: bb-docs]`. Rules can "Add a
  non-blocking Bug" or "Add a blocking Bug" `[F: bb-docs]`.
- Gating: "`neutral`: Bugbot found issues ... This is the default conclusion when Bugbot
  reports findings". It reports `failure` only when "configured to fail on unresolved
  issues", and `success` needs "no unresolved Bugbot comments from earlier runs"
  `[F: bb-docs]`.
- Rounds: "By default, Bugbot reviews only the changes since the previous Bugbot review",
  and it reads PR comments "to avoid duplicate suggestions" `[F: bb-docs]`. It resolved
  its own thread on `ZeAlenu/zan.org.il#3` `[S: helper]`.
- Fixes: "Bugbot Autofix only runs when findings are substantial enough to warrant a fix"
  (2026-04-08) `[F: bb-log]`. Commits to the branch are capped at "max 3 attempts per PR
  to prevent loops" `[F: bb-docs]`.
- Claim: "Bugbot optimizes for bugs that get fixed. 70%+ of flags get resolved before
  merge" `[F: bb-page]`.

## For /review-pr

Everything here is `[I]`, drawn from the sections above.

- **(a) Fix minors before merge?** No tool holds a merge on polish by default. Qodo calls
  Medium "Non-blocking", Greptile calls an open P2 "non-blocking", and Bugbot's check stays
  `neutral`. The one hard gate, CodeRabbit's opt-in workflow, blocks a minor *defect*
  posted inline but never a folded nitpick. So: split minor into small defect and polish.
  A confirmed small defect with a quick-win fix can be a task; polish never blocks.
- **(b) Keep minors from costing a round.** No tool spends a round on minors alone. Each
  hands them to the fixer with the fix prompt, and CodeRabbit's prompt opens "Verify each
  finding against current code. Fix only still-valid issues, skip the rest". The fix rides
  in the same push as the blocker fixes, and the next round checks only the delta and
  resolves what was fixed. Qodo and Bugbot auto-fix skip minors by default. Greptile's
  "fix everything until 5/5" loop shows the cost of the other choice: up to five
  iterations, and one PR reached 74 reviews.
- **(c) Keep minors from piling up.** CodeRabbit files whatever is unresolved at merge as
  tracker issues. Greptile and Qodo learn which classes a team ignores and stop raising
  them, though Greptile never drops security or input-validation classes. So: at merge,
  move unfixed deferred minors into one tracker issue or debt file, deduplicated by
  location and root cause. Record each dismissed class so the next review stops raising
  it.

## Not found

- CodeRabbit: the rule that places a minor inline or folds it under `chill`; whether
  `@coderabbitai autofix` in the PR conversation includes folded nitpicks; whether
  nitpicks feed the merge-readiness score.
- Greptile: whether an open P2 under a 5/5 score blocks auto-approve; how the score weighs
  P2; which badges each `strictness` level keeps; any failure condition for the
  `Greptile Review` check.
- Copilot: any severity threshold, and whether open Low findings allow an approval.
  Graphite: any severity scale, re-review on push, or merge gate. Qodo: the true default
  inline threshold, where its docs disagree. Bugbot: whether fail-on-unresolved or
  Autofix can be limited by severity.
- Precision, acceptance or address rate broken down by severity, from any vendor. The
  nearest is Copilot's addressed-comment gain per severity, 47% / 31% / 11%.

## Sources

`CD/` is `https://docs.coderabbit.ai/`, `CB/` is `https://www.coderabbit.ai/blog/`, `GD/`
is `https://www.greptile.com/docs/`, `GB/` is `https://www.greptile.com/blog/`, `H` is
`https://news.ycombinator.com/item?id=`, `GH/` is
`https://raw.githubusercontent.com/github/docs/main/content/copilot/`, `QD/` is
`https://docs.qodo.ai/code-review/`, `PA/` is
`https://github.com/The-PR-Agent/pr-agent/blob/main/pr_agent/settings/`. Dates on docs
pages are the fetch date.

| Key | Source | Date | Read |
| --- | --- | --- | --- |
| cr-overview, cr-findings | `CD/guides/code-review-overview`, `CD/change-stack/findings` | 2026-10-03 | F |
| cr-config | `CD/reference/configuration`, `https://coderabbit.ai/integrations/schema.v2.json` | 2026-10-03 | F |
| cr-glossary, cr-reports, cr-metrics | `CD/reference/glossary`, `CD/guides/custom-reports`, `CD/guides/dashboard-metrics` | 2026-10-03 | F |
| cr-rcw, cr-sec | `CD/pr-reviews/request-changes-workflow`, `CD/security/pull-request-check` | 2026-10-03 | F |
| cr-cmd, cr-autofix, cr-reviewing | `CD/guides/commands`, `CD/finishing-touches/autofix`, `CD/change-stack/reviewing` | 2026-10-03 | F |
| cr-learn, cr-pma | `CD/knowledge-base/learnings`, `CD/pr-reviews/post-merge-actions` | 2026-10-03 | F |
| cr-log | `CD/changelog` (entries 2026-07-02, 2026-07-10, 2026-10-01) | 2026-10-03 | F |
| codex | `CB/gpt-5-codex-how-it-solves-for-gpt-5s-drawbacks` | 2025-09-30 | F |
| gemini31, opus48 | `CB/gemini-3-1-pro-for-code-related-tasks-more-focus-higher-signal-to-noise`, `CB/opus-4-8-release` | 2026-03-12, 2026-05-28 | F |
| opus5, sonnet55 | `CB/opus-5-model-review`, `CB/sonnet-5-5-model-review` | 2026-07-24, 2026-09-28 | F |
| gh-bf | GitHub API: reviews, comments and threads on `betaflight/betaflight-configurator#5575`, `#5624`, and its `.coderabbit.yaml` | 2026-09-24, 2026-10-03 | F |
| gh-tsd | GitHub API: reviews, comments and threads on `TanStack/devtools#290` | 2026-03-13 | F |
| gh-ph | GitHub API: reviews `5399095202`, `5399145436` and inline comments on `PostHog/posthog#111226` | 2026-10-03 | F |
| gr-anatomy, gr-nit, gr-reduce | `GD/code-review/first-pr-review`, `GD/code-review/controlling-nitpickiness`, `GD/how-greptile-works/nitpicks` | 2026-10-03 | F |
| gr-json, gr-cfg, gr-approve | `GD/code-review/greptile-json-reference`, `GD/code-review/greptile-config-reference`, `GD/code-review/auto-approve-prs` | 2026-10-03 | F |
| gr-agent, gr-autofix | `GD/integrations/fix-with-your-agent`, `GD/mcp-v2/auto-fix` | 2026-10-03 | F |
| gr-log, gr-analytics, gr-org | `GD/changelog` (entries 2026-03-06, 2026-03-28), `GD/analytics`, `GD/account/organization-settings` | 2026-10-03 | F |
| gr-greploop | `https://github.com/greptileai/skills` (`greploop/SKILL.md`, v1.3, at `646e2df`) | 2026-07-22 | F |
| shutup | `GB/make-llms-shut-up` | 2024-12-18 | F |
| hn-label, hn-nit | `H42483721`, `H46776408` (Greptile co-founder) | 2024-12-22, 2026-01-27 | F |
| gh-rakazo, gh-litellm | GitHub API: summary comment and threads on `elie222/rakazo#1145`; summary on `BerriAI/litellm#44310` | 2026-10-03 | F |
| gh-omarchy, gh-tri, gh-respire | GitHub API: check run on `omacom/omarchy#13426`; threads on `TriliumNext/Trilium#11829`, `thomhurst/Respire#678` | 2026-10-03 | F |
| gh-gr | GitHub API: latest `<!-- greptile_summary -->` comment, inline comments and reviews on 44 PRs from a search for `commenter:app/greptile-apps`, sorted by update | 2026-10-03 | F |
| cp-use, cp-con, cp-cust | `GH/how-tos/use-copilot-agents/use-code-review.md`, `GH/concepts/agents/code-review.md`, `GH/tutorials/customize-code-review.md` | 2026-10-03 | F |
| cp-may, cp-sep11, cp-sep18 | `https://github.blog/changelog/2026-05-12-copilot-code-review-comment-experience-improvements/`, `.../2026-09-11-auto-resolution-and-analysis-updates-in-copilot-code-review/`, `.../2026-09-18-copilot-code-review-an-improved-review-experience/` | 2026-05-12, 2026-09-11, 2026-09-18 | F |
| gh-vsc | GitHub API: Copilot reviews and threads on `microsoft/vscode#339437` | 2026-10-03 | F |
| gt-feat, gt-cust | `https://graphite.com/features/ai-reviews`, `https://graphite.com/docs/ai-review-customization` | 2026-10-03 | F |
| gt-launch | `https://graphite.com/blog/graphite-reviewer-launch` | 2024-09-30 | F |
| qd-anatomy, qd-thresh, qd-noise | `QD/comment-anatomy`, `QD/severity-thresholds`, `QD/reduce-review-noise` | 2026-10-03 | F |
| qd-track, qd-fix, qd-home | `QD/track-resolved-findings`, `QD/remediate-findings-in-prs`, `https://docs.qodo.ai/code-review` | 2026-10-03 | F, qd-home S |
| qd-blog | `https://www.qodo.ai/blog/effective-code-suggestions-llms-less-is-more/` | 2025-01-29 | F |
| pa-reflect, pa-cfg | `PA/code_suggestions/pr_code_suggestions_reflect_prompts.toml`, `PA/configuration.toml` | `main`, 2026-10-03 | F |
| bb-docs, bb-page, bb-log | `https://cursor.com/docs/bugbot`, `https://cursor.com/bugbot`, `https://cursor.com/changelog/04-08-26` | 2026-10-03, 2026-04-08 | F |
| gh-bb | GitHub API: Bugbot comments on `danthony504-svg/stadium-edge#588`, `ZeAlenu/zan.org.il#3` | 2026-10-03 | F |
| helper | Helper-agent sampling of public Graphite, Bugbot and Copilot PRs; Qodo portal and TOML defaults | 2026-10-03 | S |
