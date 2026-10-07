---
name: adopt-upstream
description: Adopt an upstream release. Merge it into each fork without undoing our decisions, then weigh the installed, new and removed skills it brings.
argument-hint: "[upstream source, e.g. mattpocock/skills] [release tag, or nothing for the latest]"
disable-model-invocation: true
---

# Adopt Upstream

An upstream repo shipped a release. Carry what **upstream changed** into this repo, and
keep what **we changed**.

A fork holds our decisions. Adopt the upstream change, never the upstream file: a hunk
only upstream touched comes over, and a line only we wrote stays ours, wording and style
included.

## Process

### 1. Gather both sides

Clone the source into a new, empty temp directory. It is untrusted: read it with `git`,
run nothing from it.

The release is the tag the user named, or the latest from `gh release view -R <source>`.
Read its notes, and resolve it to a commit SHA.

Then find what this repo takes from the source:

- **Forks**: every `skills/**/SKILL.md` whose `metadata.credits` carries a `url` in the
  source and a `ref`, the upstream commit the fork was last merged with.
- **Borrowers**: a credit in the source with no `ref`. That skill took ideas from an
  upstream skill without forking it.
- **Installs**: every `skills-lock.json` entry whose `source` is the source.

A fork with no `ref` has no base to merge from. Propose the upstream commit just before
the fork's first commit here (`git log --follow --diff-filter=A`), and wait for the user.

**Done when:** the release is a SHA, and every fork has a `ref`.

### 2. Sort what the release touched

`git diff --stat -M <oldest ref> <release> -- skills/` in the clone, read beside the
notes. Put each upstream skill that moved into one class: **fork**, **borrowed from**,
**installed**, **new**, **removed**, or **untouched by us**. A rename or move keeps its
class; follow it with `git log --follow`.

**Done when:** every changed upstream skill has exactly one class.

### 3. Merge each fork

For every file in the fork's folder, `SKILL.md` and the references beside it:

```bash
git -C <clone> show <ref>:<upstream path> > <tmp>/base
git -C <clone> show <release>:<upstream path> > <tmp>/theirs
git merge-file -p --diff3 <our file> <tmp>/base <tmp>/theirs
```

Read the merge hunk by hunk:

Our decisions are our side of the diff (`git diff --no-index <tmp>/base <our file>`),
the fork's commit messages, and the `/project-context` domain files.

- **Only upstream changed it**: adopt it, unless it contradicts one of our decisions.
  Then skip it and name the decision.
- **Both changed it**: when our side replaced what upstream edited, and a decision
  above says why, skip it and name the decision. Otherwise show base, ours and theirs,
  every such hunk in one question, and wait.
- **Only we changed it**: ours stands. Upstream's conventions reach a line only through
  an upstream hunk.

Then move the fork's `ref` to the release SHA, adopted or not: the release is now merged.

**Done when:** every upstream hunk is adopted, skipped with its reason, or answered by
the user, and every fork's `ref` is the release SHA.

### 4. Weigh the rest

- **Installed**: tell the user to run `/manage-project-skills update <names>`.
- **Removed**: an installed one goes through `/manage-project-skills`. A fork stays ours;
  say upstream dropped it.
- **Borrowed from**: what changed in the upstream skill, and what of it the borrower
  could take.
- **New**: one line on what it does, then one recommendation: install it, fork it,
  borrow from it into a named skill of ours, or skip it.

Nothing is installed, forked or borrowed without the user's approval. An approved fork
starts in `skills/in-progress/` with a credit and a `ref`, and joins **Forked skills**
in `README.md`. An approved borrow adds a credit without a `ref`.

**Done when:** every class from step 2 has an action or a recommendation.

### 5. Commit and report

One commit per skill: `feat(<skill>): adopt <source> <tag>`. Its body lists each hunk
adopted and each one skipped, with the reason. Push is a separate ask.

Report per fork: adopted, skipped and why, asked. Per other class: the action or the
recommendation.
