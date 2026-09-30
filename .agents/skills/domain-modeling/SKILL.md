---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing the project glossary, or recording or editing an ADR.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design. This is the
*active* discipline: challenging terms, inventing edge-case scenarios, and writing the
words and the decisions down the moment they crystallise. Merely *reading* the
glossary for vocabulary is not this skill — that is a one-line habit any skill can do.
This skill is for when you are changing the model, not just consuming it.

## Where the words live

The glossary is a reference file inside the `/project-context` skill:

```
/
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── skills/internal/project-context/
    ├── SKILL.md
    ├── glossary.md              words used across domains
    └── domains/
        └── <domain>.md          words used inside one domain, under ## Words
```

**One glossary per repo.** A term used across domains belongs in `glossary.md`, which
loads every session. A term that only matters inside one domain belongs in that domain
file's **Words** section, so a task that never enters the domain never pays for it.

When you resolve a term, ask which of the two it is before you write it.

If `/project-context` does not exist yet, tell the user to run
`/setup-project-context`. Do not scatter a glossary at the repo root.

Create `docs/adr/` lazily, when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language, call it out
immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which
is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term.
"You're saying 'account': do you mean the Customer or the User? Those are different
things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific
scenarios. Invent scenarios that probe edge cases and force the user to be precise
about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a
contradiction, surface it: "Your code cancels entire Orders, but you just said partial
cancellation is possible. Which is right?"

### Write the term down inline

When a term is resolved, write it to `glossary.md` or the domain file's **Words**
right there. Don't batch these up: capture them as they happen. Use the format in
[GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).

A glossary holds words and nothing else. It carries no implementation detail, no spec,
no scratch notes, and no decisions. A decision is a **Reason** or a **Fence** in a
domain file, or an ADR.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in
[ADR-FORMAT.md](./ADR-FORMAT.md).

An ADR is a record, fixed to the moment it was written, so it is never pruned. The
*live* consequence of the decision belongs in a domain file's **Reasons**, in a
sentence or two, linking back to the ADR.
