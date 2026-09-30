---
name: create-pr
description: Open one pull request as a draft, with a body the reviewer can act on.
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
without giving the reviewer something new. The body is four sections, in this order:

1. `## What problem this solves` — the issue that already exists, or the feature
   that is missing. What was true before, and what forced the change: the trigger,
   the report, the deadline, the security note.
2. `## How this PR solves it` — the idea holding the lines together, and the
   alternative you rejected. The reviewer reads the diff for the lines; they read
   this for the shape.
3. `## What happens when this merges` — the effect downstream. Behaviour that
   changes for users, a migration that has to run, a follow-up this unblocks.
4. `## Notes` — what a careful reader still cannot infer from the diff after
   reading it. Invariants that hold across the change, a decision that looks
   arbitrary but was deliberate, a gotcha that will trip the next person, a
   constraint from outside the repo.

Anything belonging to none of the four gets its own section after them, named the
way a colleague would name it.

Every section survives on the test "could the reviewer figure this out from the diff
alone?" A section that fails comes out rather than getting padded. Section 1 stays
regardless — the reason a change happened is never in the diff — so a one-line body
carrying only the problem is a fine pull request.

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

`Closes #123` at the bottom of the body, so merging closes the ticket. Reference
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
stop. Committing is `/git-commit`.

**Done when:** you know the base branch, the current branch, and that nothing is
uncommitted.

### 2. Read the change

The diff, the log, and the ticket it closes.

**Done when:** from what you read, you can state the problem, the approach, the
downstream effect, and every Note you plan to include.

### 3. Draft the body

Title, then the four sections in order, then any section that fits none of them,
then the ticket line. Drop a section that fails the diff-alone test rather than
filling it.

### 4. Clean it up

Run the draft through `/writing-for-humans`: the title, the evidence, the secrets
check, and the humanizer pass. Two extra tells in a pull request:

- A bullet per file that only restates the filename.
- An extra section named for the check the reviewer is being asked to do rather
  than the thing they are being told (`How you know`, `Verification`). Name it for
  the thing, or cut it if it only restated the diff.

### 5. Open it

Push the branch and open the pull request **as a draft**:

```shell
gh pr create --draft --base <base> --title "<title>" --body "<body>"
```

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
come out rather than getting padded.

## Boundaries

Opens the pull request. Reviewing it, merging it, and marking it ready for review
belong to a person.
