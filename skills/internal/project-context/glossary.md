# Glossary

cl-factory starts an agent on a GitHub work item when a teammate applies a trigger label.
It is one Node server on the owner's machine, running Claude Code in local clones of the
served repos.

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

**Delivery**:
One webhook request GitHub sends the factory.
_Avoid_: event, request

## Work items

**Work item**:
The issue or pull request a trigger label is applied to.

**Spec**:
The issue an agent is asked to implement: a standalone issue, or a parent whose sub-issues
split the work.
_Avoid_: ticket, epic, PRD

**Sub-issue**:
A spec's native GitHub child: one step in the spec's ordered series.
_Avoid_: slice, child issue, ticket

**AFK issue**:
A sub-issue an agent does unattended.

**HITL issue**:
A sub-issue a human does.
