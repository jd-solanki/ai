---
name: writing-for-humans
description: How to write a short document a person has to read and act on - a ticket, a pull request body, a commit message, a handover note. Covers the title, a shape people skim, evidence that survives a refactor, and stripping the AI phrasing out. Call it before drafting any of those.
---

# Writing for Humans

You are writing for a **stranger**. The stranger may be you, three months from now,
at 3am. They have the repo and none of your context.

Write in the words you would type to a teammate in chat.

## Make it skimmable

Give the body headings. A reader scans the headings first and reads only the one
they need.

One idea per line. Three sentences stacked into one paragraph is the part a reader
skips.

A section with nothing to put in it gets left out. No empty heading, no "N/A". An
optional field is an invitation, not a quota.

The whole thing reads in 30 seconds. Longer means padding, or it means you are
writing two documents.

## The title

One line, read in a list of two hundred. `scope: what happened`, under 70
characters, no full stop at the end.

Where the repo writes conventional commits, the title takes that shape:
`type(scope): what happened`. `git log --oneline -20` settles whether it does, and
the types already in that log are the ones to pick from.

- `fix(upload): photo upload fails on iOS Safari` - the shape a conventional repo reads
- `upload: photo upload fails on iOS Safari` - the reader knows what this is
- `Fix upload bug` - tells the reader nothing
- `Upload issues` - a topic, not a title

Where the system already types the thing, `[Bug]` in the title is a second copy.

## Evidence

**Point at things that survive.** Name the thing, not the coordinate: `the upload
handler`, `the /orders route`, `pnpm build`. Line numbers rot on the next commit; a
symbol survives a refactor. A permalink is fine, it pins the commit.

**Paste the real text.** The error, the failing command with its output, the log
line, the commit SHA. Never a picture of text: a screenshot cannot be searched,
copied, or run.

**Cite, don't assert.** "Three drivers reported it in #support on Tuesday" is
evidence. "Users are confused" is an opinion.

**Nothing to paste?** Say so. "Not reproduced yet" is a fact the reader needs.

## Redact before you publish

Everyone the tracker or the repo lets in can read this. Pasted logs and command
output carry API keys, tokens, customer data, and remote URLs with credentials
inside them. Read the body for secrets, redact, then publish.

## Strip the AI out

Call the `/humanizer` skill on the draft. Missing? Install it, it is one command:

```shell
npx skills@latest add jd-solanki/skills --skill humanizer
```

Two tells humanizer will not catch, because they only show up in documents like
these:

- A sign-off offering more work: "Happy to open a PR", "let me know if you'd like
  changes". End on the last real point instead.
- A heading with a single line under it. Fold it into the line above.
