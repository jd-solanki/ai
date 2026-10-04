# Glossary format

Two places take a term. Pick before you write.

| Term | Goes to |
| --- | --- |
| used across domains | `glossary.md` |
| used inside one domain | that domain file's `## Words` |

## Structure

```md
# Glossary

{One or two sentences: what this project is, in its own vocabulary.}

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

A domain file's `## Words` takes the same entries, with no preamble.

## Rules

- **Be opinionated.** When multiple words exist for the same concept, pick the best one
  and list the others under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it
  does.
- **Only project terms.** General programming concepts — timeouts, error types, utility
  patterns — don't belong even if the project uses them extensively. Before adding a
  term, ask: is this unique to this project, or is it general programming? Only the
  former belongs.
- **Group terms under subheadings** when natural clusters emerge. If all terms belong
  to a single cohesive area, a flat list is fine.
- **Words only.** No implementation detail, no decisions. A decision is a **Reason** or
  a **Fence** in a domain file.

## When a term outgrows the glossary

A term whose entry keeps attracting rules, traps, or rationale is not a word problem.
It is a domain. Move it to a domain file and let its **Words** hold the definition
while **Rules**, **Reasons** and **Fences** hold the rest.
