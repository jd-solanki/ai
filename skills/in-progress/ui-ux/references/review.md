# Review

For reviewing an existing screen, or someone else's change, for UX.

## Steps

1. **Walk the task.** Find the screen's main task and walk it one action at a time
   with the four questions from step 4 of `SKILL.md`. Walk it again as each persona:
   - a first-timer, who knows none of the app's words;
   - a power user, who wants the keyboard and the fewest steps;
   - a screen-reader user, who hears the page in order;
   - a stress tester, who enters worst-case data, double-clicks, and loses the
     network.
2. **Render the states.** Load the worst-case data and force each state from
   `states.md`: loading, each empty kind, error, partial, offline.
3. **Collect candidates.** Hold each against the principles in `SKILL.md` and the
   references the screen touches.
4. **Prove each candidate.** A candidate becomes a finding only with all three:
   - the rule it breaks, named;
   - proof that the problem reaches the rendered screen, seen at runtime;
   - exactly one fix.

   Then try to disprove it. If you cannot say what it costs the user, it is taste: drop
   it.
5. **Order and cut.** Rank findings as Value (can users do the task at all?), then Ease
   (how hard is it?), then Delight. Leave out Delight findings while any Value finding
   is open. Report the top three to five.

Done when every reported finding carries its rule, its runtime proof and its one fix,
and the report is ranked and cut.

## Red flags to look for

- Feedback far from the action: a toast or banner for something the user just did on
  this screen.
- No sign that an action succeeded, or a success message for a change already visible.
- A confirmation on a low-risk or undoable action.
- A submit button disabled before the user tries.
- A generic empty state where data exists but failed to load, or a "create your first"
  message on a filtered list.
- A field error only in a summary or toast.
- Two names for one action, or a button label that does not say what happens.
- A modal for a repeated task, or a modal opening another modal.
- A value the user must remember from an earlier step.
- Filters, tabs or pagination lost on refresh or Back.
- Text that truncates a number, amount or date.
