# Glossary

This repository publishes skills and runs the software factory they are written for.

## Skills

The repository also installs other people's skills to use while working on them, so almost every
word in this section exists to keep those two apart.

**Skill**:
A folder holding a `SKILL.md` and the reference files beside it. The folder is the
unit: the skills CLI installs the whole of it, so a reference file only travels if it
sits inside.
_Avoid_: command, prompt, plugin

**Published skill**:
A skill this repository owns and ships, under `skills/`. The only kind that is edited
here.
_Avoid_: local skill, our skill

**Installed skill**:
A skill written elsewhere and installed into this repository under `.agents/skills/`
so it can be used while working. Someone else owns it.
_Avoid_: vendored, third-party copy

**Fork**:
An installed skill that has been copied into `skills/` and changed. It stops being
someone else's the moment it is edited, because upstream can no longer be re-pulled
cleanly.
_Avoid_: vendored, patched

**Category**:
The folder between `skills/` and a skill's own folder — `coding`, `engineering`,
`scaffolding`, and the rest. It is part of the path the tooling depends on, not a
label.
_Avoid_: group, section, namespace

**Incubator**:
`skills/in-progress/`, where a skill lives while it is still changing. A skill leaves
once it has been used on real work and stopped moving.
_Avoid_: draft, wip, staging

**The block**:
The instruction text this repository writes into other people's `CLAUDE.md` or
`AGENTS.md`. It has exactly one home, named in `domains/authoring.md`.
_Avoid_: the template, the preamble

## Software factory

The software factory, `apps/software-factory`, starts an agent on a GitHub work item when a
teammate applies a trigger label. It is one Node server on the owner's machine, running
Claude Code in local clones of the served repos.

**Agent**:
Software that does one kind of work on a work item, requested through its own trigger
label.
_Avoid_: bot, worker

**Trigger label**:
An `agent:<verb>` GitHub label that requests an agent's work on a work item.
_Avoid_: tag, command

**Working label**:
The `agent:<verb>ing` label a work item carries while a run holds it.
_Avoid_: status label, in-progress label

**Run**:
One agent's work on one request, from claim to exit.
_Avoid_: job, execution

**Session**:
One fresh Claude Code conversation inside a run.
_Avoid_: agent (for the model's part), conversation

**Static code**:
The factory's own deterministic code, as opposed to a session.
_Avoid_: orchestrator, harness

**Served repo**:
A repository the factory runs agents on.
_Avoid_: target repo

**Pipeline**:
The stages a change travels through from an idea to a merged pull request.

### Work items

**Work item**:
The issue or pull request a trigger label is applied to.

**Spec**:
The issue an agent is asked to implement: a standalone issue, or a parent whose sub-issues
split the work.
_Avoid_: ticket, epic, PRD

**Sub-issue**:
A spec's native GitHub child: one piece of the spec's work, blocked by the siblings it
waits on.
_Avoid_: slice, child issue, ticket

**Done set**:
The sub-issues of a spec that count as done.

**AFK issue**:
A sub-issue an agent does unattended.

**HITL issue**:
A sub-issue a human does.
