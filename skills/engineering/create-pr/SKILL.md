---
name: create-pr
description: Open one pull request as a draft, with a body the reviewer can act on.
metadata:
  credits:
    - skill: show-me
      author: Dex Horthy
      organisation: Humanlayer
      url: "https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md"
    - skill: pr
      author: Matt Pocock
      url: "https://github.com/mattpocock/skills/blob/main/skills/engineering/pr/SKILL.md"
    - skill: pr-screenshots
      author: Josh Goldberg
      organisation: Sentry
      url: "https://github.com/getsentry/skills/blob/main/skills/pr-screenshots/SKILL.md"
---

# Create PR

Read `/writing-for-humans` skill first. It carries the title, the shape, the evidence
rules, and the de-slopping pass. This skill adds only what a pull request needs on
top.

The work is already written and committed. This turns it into a pull request a
reviewer can act on. It opens as a **draft**. Marking it ready for review is the
author's call, never yours.

## The body carries what the diff can't

The diff is already open in the reviewer's tab. Anything they can read there is not
your job to restate: bullets that say "adds X", "moves Y", "renames Z" pad the body
without giving the reviewer something new. The body is these sections, in this order:

1. `## What problem this solves` — the issue that already exists, or the feature
   that is missing. What was true before, and what forced the change: the trigger,
   the report, the deadline, the security note.
2. `## How this PR solves it` — the idea holding the lines together, and the
   alternative you rejected. The reviewer reads the diff for the lines; they read
   this for the shape, so show it: see **Show the shape**.
3. `## Screenshots` — only when the diff changes what a user sees; a pull request
   with no UI change has no such section. See **Screenshots**.
4. `## What happens when this merges` — the effect downstream. Behaviour that
   changes for users, a migration that has to run, a follow-up this unblocks. Name
   the **door**: one-way when the merge is hard to walk back (a destructive
   migration, a published contract, deleted data), two-way when a revert undoes it.
   Then the **blast radius**: what breaks if the change is wrong (consumers, layout,
   mobile, a scheduled job).
5. `## QA steps` — how a person tries the change by hand before it merges, as a list
   of scenarios. Each scenario is an unticked checkbox naming one behaviour, with its
   steps numbered beneath it from a checkout of the branch: the command to run or the
   thing to click, then the result they should see. Scenarios for the changed
   behaviour come first, then its blast radius. CI already reports the tests, so every
   step is something a person does by hand. A change with no visible behaviour, such
   as a refactor, gets the scenario that shows nothing moved. Whoever tries a scenario
   and sees it pass ticks its box.

   ```markdown
   - [ ] **Saving settings shows a toast**
     1. `pnpm dev`, open `/settings` → the form loads with your current values.
     2. Change the name, click Save → a "Saved" toast appears.
   ```
6. `## Notes` — what a careful reader still cannot infer from the diff after
   reading it. Invariants that hold across the change, a decision that looks
   arbitrary but was deliberate, a gotcha that will trip the next person, a
   constraint from outside the repo.

Anything belonging to none of them gets its own section after them, named the way a
colleague would name it.

Every section survives on the test "could the reviewer figure this out from the diff
alone?" A section that fails comes out rather than getting padded. What problem this
solves and QA steps stay regardless — the reason for a change and how to try it are
never in the diff — so a body carrying only those two is a fine pull request.

## Show the shape

Pick the smallest visual that makes the approach clear, and place it beside the
sentence it supports. Usually one, sometimes two:

- Logic or an algorithm: pseudocode.
- Runtime control flow: a call tree.
- UI structure: a component tree, with the state and module boundaries that matter.
- File responsibilities or a broad refactor: a shallow file tree, one comment per
  folder.
- Interaction or data flow between parts: a Mermaid diagram.
- A change to a shape that already exists: a `diff` block of that tree or flow.

```diff
 submitForm
   createSession
     persistPrompt
+    expandSkillMention
     launchAgent
```

Keep only the calls, files and boundaries the reviewer needs to see the idea. A
visual that copies the code diff fails the diff-alone test like any bullet.

## Screenshots

Pixels are the one thing a UI diff cannot show. Show every place the change lands as
a before/after pair:

```markdown
| Location | Before | After |
| --- | --- | --- |
| Explore › Logs | ![Explore › Logs before](./shots/logs-before.png) | ![Explore › Logs after](./shots/logs-after.png) |
| Explore › Logs, loading | ![Explore › Logs, loading before](./shots/logs-loading-before.png) | ![Explore › Logs, loading after](./shots/logs-loading-after.png) |
```

- **Location** is a `›` breadcrumb to the surface, then the state after a comma. One
  row per surface and state: trace the changed components to every page, drawer or
  modal that renders them, and every state the change touches (loading, empty,
  error, dark theme).
- Capture Before on the base branch and After on this branch, from the running app,
  framed identically: same viewport, same data, cropped to the region around the
  change. A surface that is new gets `—` for Before.
- Blur personal data (emails, names, IDs) and check every image for tokens and
  cookies before it leaves your machine.
- Save the images to `shots/` in a temp directory, beside the body file. Step 5
  uploads them.

## Read the diff, don't imagine it

`git diff <base>...HEAD` and `git log <base>..HEAD` before you write a word.

Every claim in the body traces back to a line you read. A body that describes a
change the diff does not contain costs the reviewer more than an empty body:
they have to find the lie before they can start reviewing.

Reading the diff also settles which sections are real. If a bullet you drafted
turns out to sit in plain view of the diff, it fails the test and comes out.

## The title becomes history

Your title is the line the squashed merge commit carries, so write it for
`git log`.

## Link the ticket

`Closes owner/repo#123` at the bottom of the body, so merging closes the ticket. Reference
the ticket by ID rather than pasting a link: some trackers put private detail in
the URL.

No ticket exists? Write the body anyway and leave the line off. Do not open a
ticket just to link it.

## Length

One change per PR. A refactor and a fix in the same diff make the reviewer grade
two things at once, and they will do both worse.

## Process

### 1. Check where you are

You need a branch that is not the default one, and a clean tree with your work
committed. On the default branch, or holding uncommitted changes? Say so and
stop.

**Done when:** you know the base branch, the current branch, and that nothing is
uncommitted.

### 2. Read the change

The diff, the log, and the ticket it closes.

**Done when:** from what you read, you can state the problem, the approach, the
downstream effect with its door and blast radius, the QA scenarios a reviewer will try,
every Note you plan to include, and, for a UI change, every row of the screenshots
table.

### 3. Draft the body

Title, then the sections in order, then any section that fits none of them,
then the ticket line. Drop a section that fails the diff-alone test rather than
filling it.

### 4. Clean it up

Run the draft through `/writing-for-humans`: the title, the evidence, the secrets
check, and the humanizer pass. Extra tells in a pull request:

- A bullet per file that only restates the filename.
- A second section of checks beside `## QA steps` (`How you know`, `Verification`).
  Fold it into QA steps, or cut it if it only restated the diff.

### 5. Open it

Push the branch and open the pull request **as a draft**:

```shell
gh pr create --draft --base <base> --title "<title>" --body "<body>"
```

With screenshots, pass the body as `--body-file <dir>/body.md` and add
`--attach ./shots/<image>.png` per image, run from `<dir>`: `gh` uploads each one
and rewrites its reference in the body to the hosted asset.

Return the link, and say plainly that it is a draft waiting for them to mark it
ready for review.

Labels go on after it exists (`gh pr edit <n> --add-label ...`), and only labels
the repo already has.

## Where it goes

GitHub through the `gh` CLI is the fallback. Before you settle for it, check
`git remote -v`: GitLab takes `glab`, where the draft flag is `--draft` on
`glab mr create`.

A repo pull request template at `.github/pull_request_template.md` is the house
style, and it wins. Fill its sections; sections that do not apply to this change
come out rather than getting padded. A template with no QA section still gets
`## QA steps`, after its own sections.

## Boundaries

Opens the pull request. Reviewing it, merging it, and marking it ready for review
belong to a person.
