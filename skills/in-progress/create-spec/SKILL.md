---
name: create-spec
description: Turn a settled shared understanding into a spec an agent implements unattended, with ordered AFK and HITL sub-issues when the work needs them.
argument-hint: "[what the spec is about]"
disable-model-invocation: true
---

# Create Spec

The sister of `/create-ticket`. A ticket asks a human; a spec briefs an agent that runs
**AFK**. It cannot ask a question, so the spec carries every answer the conversation
reached. The software factory picks it up once a teammate applies `agent:implement`.

## Words

- **Spec**: the issue an agent implements, delivered as one pull request. Standalone,
  or the parent of sub-issues.
- **Sub-issue**: a native GitHub child of the spec, one step in its ordered series:
  `issue:AFK` when an agent does it, `issue:HITL` when a human does.
- **Spec branch**: `spec/<n>`, where `<n>` is the spec's issue number. It carries the
  conversation's project-context records, and later the code.
- **Owner step**: a human step that blocks merge or production, never an AFK issue.

## What a spec carries

The bar is the **cold read**: an agent holding only the repository and the spec opens
the pull request without a question. Carry everything the conversation settled:

- **The product.** The problem, the solution, and user stories covering every behaviour.
- **Every decision.** What was chosen, what was rejected, and why, assumed two-way doors
  included. A decision recorded in project context gets one line and a pointer to its
  record; the record is the source.
- **Findings.** Facts the conversation established, each with its source, and the traps
  it found, so the agent skips the research.
- **The technical shape.** Modules, seams, contracts, data shapes.
- **Verification.** What the agent checks before opening the pull request, at the
  highest seam available, and what the owner checks after merge.
- **Owner steps and out of scope.**

Leave to the agent every choice the conversation left open: names, parameters, internal
layout. Describe behaviour and modules; a spec can wait months while paths and line
numbers go stale. Name a path only when the decision is the path. A snippet goes in
only when it pins a decision more precisely than prose: a schema, a state machine, a
config shape.

Everyone with access to the repository reads the spec. Name secrets; their values stay
out.

### Spec template

```markdown
## Problem

## Solution

## User stories

1. As a <actor>, I want <behaviour>, so that <benefit>.

## Decisions

- <chosen>, not <rejected>: <why>. Record: `<path>` on the spec branch.

## Findings

- <fact or trap>. Source: <url or path>.

## Technical shape

## Verification

**Agent, before the pull request**

- [ ] <check>

**Owner, after merge**

- [ ] <check>

## Owner steps

- [ ] Before merge: <step>
- [ ] After merge: <step>

## Out of scope
```

### Sub-issue template

The title is a Conventional Commit subject, because it becomes the commit subject.

```markdown
## What to build

<The end-to-end behaviour this step makes work.>

## Acceptance criteria

- [ ] <check>
```

A HITL issue replaces **What to build** with **What the human does**, and ends: "Apply
`issue:HITL-done` when finished."

## Process

### 1. Confirm the understanding is settled

Write from the conversation. Every one-way door the spec will state needs the user's
answer; an open one stops this skill. Name it and suggest `/grill-with-docs`.

**Done when:** every decision you will write down has an answer in the conversation.

### 2. Gather the records

Invoke `/project-context` and write in its vocabulary. The records are the conversation's
uncommitted changes to the project-context folder and `docs/adr/`: `git status` lists
them. They travel on the spec branch; any other uncommitted change stays behind.

**Done when:** you hold the list of record paths, and each traces to a decision.

### 3. Size the work

One agent context holds it: a standalone spec. Larger: split it into **tracer bullets**,
sub-issues in series, each a thin vertical slice that leaves the branch green and is
verifiable on its own, with any prefactoring first. Work too big for one pull request
is two specs.

Place each human step. It blocks a later AFK issue: a HITL issue at that point in the
series. It blocks only merge or production: an Owner step. An agent does everything it
can; a step is HITL only for what needs a human's hands or judgement: credentials,
billing, a browser-only console, a call the user kept for themselves.

**Done when:** the spec is standalone, or every sub-issue has its title, exactly one of
`issue:AFK` or `issue:HITL`, and its final place in the series.

### 4. Draft

Write the spec, then its sub-issues in series order, to one markdown file in the OS temp
directory. Print it as a `file://` URL on its own line. Then do the cold read: read the
draft as the implementing agent, holding nothing but the repository and the draft.

**Done when:** a cold read raises no question the draft leaves unanswered or unassigned.

### 5. Wait for approval

Filing waits for the user's go-ahead. They may edit the draft first, so read the file
again and file what it says now.

### 6. File

```bash
gh issue create --title "<title>" --body-file <spec.md>
```

The printed URL ends in the spec's number, `<n>`. When there are records:

```bash
git switch -c spec/<n> origin/<default-branch>
git add <record paths>
git commit -m "<the repo's commit convention>: record decisions for #<n>"
git push -u origin spec/<n>
git switch -
```

Sub-issues follow in series order; GitHub keeps them in the order they are added:

```bash
gh issue create --parent <n> --label issue:AFK --title "<subject>" --body-file <sub.md>
```

The `issue:AFK` and `issue:HITL` labels must already exist. When they are missing, stop
and tell the user; creating labels is their call.

**Done when:** the spec, every sub-issue in order, and the spec branch when there are
records, are on GitHub.

### 7. Hand off

Return the spec's link and name the next stage: a teammate reads the spec, then applies
`agent:implement`. The trigger is theirs to apply.
