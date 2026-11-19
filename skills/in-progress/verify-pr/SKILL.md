---
name: verify-pr
description: >
  QA a pull request by its QA steps: run each scenario on a checkout through /run-qa-scenarios,
  and report every scenario pass, fail or blocked, with its proof media, in one QA comment. Use
  when asked to verify, QA or try a pull request.
disable-model-invocation: true
---

# Verify PR

The pull request body's `## QA steps` is the script: a list of scenarios, each a checkbox with
numbered steps and the result each should show. `/run-qa-scenarios` tries every scenario on a
checkout of the pull request; you post what it saw. You commit no code: a failure goes to whoever
fixes it, as a review thread.

Write every thread and the QA comment with `/writing-for-humans`: a person reads them.

## 1. Read the script

Take the time, `date -u +%FT%TZ`. Check out the head detached, `gh pr checkout <n> --detach`:
the branch may be checked out in another worktree. Read the body and head with
`gh pr view <n> --json body,headRefOid,files`.

A body with no checkbox under `## QA steps` has nothing to verify: say so and stop, writing
nothing to the pull request.

Find the QA comment: the issue comment on the pull request whose body starts with
`<!-- verify-pr:report -->`, posted by `gh api user --jq .login`. This run's number is one more
than its `QA runs` count, or 1 with none.

**Done when:** you hold every scenario, the head commit and this run's number.

## 2. Try every scenario

Make a run folder, `${TMPDIR:-/tmp}/qa-<repo>-pr<n>-<run>/`. Run `/run-qa-scenarios` with every
scenario, this checkout, the run folder and the mode **unattended**: nobody answers here.

**Done when** every scenario has a state, with the observed text behind each fail, the missing
thing behind each blocked, and its media. A scenario missing from the results is a bug in the run.

## 3. Report

Write in this order: the comment goes last, because its verdict is what the software factory
acts on, and it must point at threads that already exist.

1. **Threads.** With any scenario failed, post one review, event `COMMENT`, with one inline
   comment per failed scenario, written so the Fixer can make the failure happen again: the
   scenario and its role, its steps, the failing step with expected and seen, and its fault patch
   in a `diff` block when it has one. Anchor it on the
   changed line most likely responsible, or the first changed line of that file when you
   cannot tell; GitHub takes only lines in the diff. A blocked scenario gets no thread: no
   code change unblocks it.
2. **Checkboxes.** On a `fail` verdict, untick every box: the Fixer pushes next, so no pass
   would hold on the code a human sees. Otherwise tick each scenario that passed this run and
   untick every other, then `gh pr edit <n> --body-file <file>`. A tick means it passed on this
   commit. Change nothing else in the body.
3. **The QA comment.** Write it whole from the template below, as `<run folder>/comment.md`,
   referencing each media file by its path relative to the run folder. Delete the last QA comment
   with `gh api -X DELETE repos/<owner>/<repo>/issues/comments/<id>` when one exists, then post
   the new one from the run folder:
   `gh pr comment <n> --body-file comment.md --attach <file>`, one `--attach` per media file. `gh`
   attaches files only to a comment it creates, so an edit in place would drop the media. Post no
   other comment.

The second line is the run's verdict:

- `fail` when any scenario failed, and this is run 1 or 2.
- `ended` when any scenario failed on run 3 or later: the failures go to a human.
- `pass` otherwise, blocked scenarios included.

```markdown
<!-- verify-pr:report -->
<!-- verify-pr:verdict <pass, fail or ended> -->
## 🧪 QA: <passed>/<all> scenarios passed — <action>

- ✅ **<scenario>**

  ![<scenario>](./<media file>)
- ❌ **<scenario>** · step <n>: expected <x>, saw <y> · <link to its thread>

  ![<scenario>, step <n>](./<media file>)
- 🚧 **<scenario>** · blocked at step <n>: needs <what> · needs you

<sub>QA runs (<n>/3) · Last verified commit: <short sha> · Took <minutes>m</sub>
```

The action is `Ready to merge` on a pass with nothing blocked, `<count> need you` on a pass
with blocked scenarios, `Fix the failing scenarios` on a fail, and `QA ended: a human decides`
on an ended run. List scenarios in the body's order. A scenario that ran with a fault patch ends
its line with `· 🩹 fault patch`. A video split into parts lists every part.

**Done when:** the comment carries this run's verdict, and every link in it opens a thread.

## 4. Clean up

`/run-qa-scenarios` cleans up its sessions and servers. Leave the checkout as it started:
`git reset --hard` and `git clean -fd`.
