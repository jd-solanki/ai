---
name: grilling
description: Grill the user relentlessly about a goal, plan, or decision. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet.

## Altitude

**Altitude** filters the frontier. A question reaches the user only if it clears the bar:

- **The goal always clears it.** What the user is trying to achieve, who it serves, what counts as done, what is in and out of scope.
- **A technical question clears it only when it is a one-way door**: the fix is expensive once you are wrong. Where a **seam** sits, and how deep the **module** behind it is.
- **Every two-way door is yours.** Where the code sits, what a function takes, which helper to reuse: cheap to reverse, so settle it and move on. Judge each question on its own.

Invoke `/codebase-design` when a technical question clears the bar, and put the question in its language. Its principles also settle the two-way doors you take yourself.

Invoke `/domain-modeling` when the user reaches for a fuzzy or contested word. The wrong name for the core thing is a one-way door.

## Rounds

Ask the whole cleared frontier in one round: number each question and give your recommended answer. Close the round with the two-way doors you settled yourself, so the user can object without having to answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

🔸 **Assumed**: <a two-way door you settled>. <another>.
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when every decision left is a two-way door: every one-way door settled, every assumption on the page. Do not act on it until the user confirms you have reached a shared understanding.

Once the user confirms, invoke `/domain-modeling` to record the one-way doors you settled. Its ADR test decides which ones earn a file.
