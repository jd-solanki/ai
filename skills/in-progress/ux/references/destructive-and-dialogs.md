# Destructive actions and dialogs

## Friction matches blast radius

| Tier | When | Pattern |
| --- | --- | --- |
| Low | Easy to undo or recreate (archive, remove from a list, delete a draft) | Act at once. Show the item leaving, then a toast with Undo that stays until dismissed. |
| Moderate | Cannot be undone, or affects several items | A modal that names and counts what is affected, says what happens, and has verb buttons. |
| High | Expensive to recreate, a large amount of data, or cascading effects | The moderate modal, plus typing the resource name or ticking a checkbox to enable the button. |

- People confirm by habit, so a confirmation on an undoable action protects no one and
  trains them to click through. Offer Undo instead, and keep deleted items recoverable
  (a trash) where you can.
- Ask once, at the last destructive moment, not after every step.
- Say whether, and for how long, the action can be undone.
- After a delete, return to the list, show the item leaving, and confirm. If the delete
  fails, say so and put the item back.
- For a press-and-hold delete, make the hold slow (about 2 s) and the release fast
  (about 200 ms).

## Words

- Confirm buttons name the outcome: "Delete project" with "Cancel", "Discard changes"
  with "Keep editing". Never Yes/No or OK.
- The modal's title and its confirm button name the same action.
- Cancel is the safe exit and never the default.
- Remove takes an item out of a list without destroying it; Delete destroys it. Use the
  word that matches.

## Prominence

In normal UI, a destructive action is secondary or tertiary: a ghost button or a menu
item. Danger styling belongs inside the confirmation, where the
destructive action is the primary one. Keep destructive controls away from routine
ones, so a minor adjustment can never trigger them.

## Choosing a modal

Reach for a modal last. First try inline editing, a side panel, a popover, or a page.

Use a modal for:

- a short task the user started;
- a decision that blocks the work;
- urgent information about the current work.

Choose something else when:

- the user did not start it: a background event is a toast, and the app shows no
  popups at load;
- the user needs page content to decide: use a side panel or a page;
- the task runs past about three steps or needs more room than a large modal: use a
  page;
- the task repeats (inspect, edit, next): use a side panel or inline editing;
- the content is purely informative: show it inline.

## Inside a modal

- One primary action.
- One modal at a time. A modal never opens another; if step one needs a confirm modal,
  make step one a page.
- Keep the content to what the decision needs: no tabs, accordions, data tables, or
  links that lead away.
- Focus the first input on open. For an irreversible action, focus the least
  destructive button. Return focus to the trigger on close.
- Give it a visible close button, Escape and overlay click, plus an explicit Cancel
  button.
- Validate before closing: an invalid field keeps the modal open with its error under
  the field.
- While its action runs, the primary button shows the spinner and the modal stays open.
  On failure, show an alert at the top of the body.
- Disable interaction on a modal while it animates out.
