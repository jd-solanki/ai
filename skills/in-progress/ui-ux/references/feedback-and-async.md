# Feedback and async

## Where feedback goes

| Situation | Feedback |
| --- | --- |
| The result is visible where the user looks (an edit returns to the updated text; the new row appears) | No message. Announce it to screen readers (see `accessibility-behaviour.md`). |
| A button action, and the user stays on the page | In the button: spinner, then a brief success mark. Or an inline message beside the button. |
| A save that navigates away | The new page is the feedback. Add a banner only when the new URL does not make success clear. |
| A field is wrong | Under the field (`UFormField` shows it). With three or more errors, also a summary at the top that links to each field. |
| An action from inside a modal or slideover | Keep it open until the action finishes. On failure, show a `UAlert` at the top of its body. |
| A long task the user may leave | Progress in place, then a toast or notification when it finishes. |
| A background or system event the user did not just cause | Toast; a banner if it affects the whole page. |
| An error that blocks the task and has no place on screen | A small modal with guidance. Rarely. |

## The pressed button

- Use `loading-auto` on `UButton` (or on `UForm` for submit). It follows the click's
  promise, keeps the label, swaps the leading icon for a spinner, and disables the
  button so a second click cannot double-submit.
- Show success when the result is not otherwise visible (Copy, Send invite, Save
  settings): set the button's `icon` to a check for about 1.5 seconds, then return to
  rest. Nuxt UI has no success state, so hold it in a ref.
- On failure, return the button to rest and show the error in place: under the field,
  beside the button, or at the top of the dialog.
- Every press shows its pressed state within about 100 ms; Nuxt UI's active styles do
  this.

## Timing

| Wait | Show |
| --- | --- |
| Under about 1 s | Only the result. A flashing spinner makes the app feel slower. |
| About 1 to 3 s | An indeterminate spinner in the control, or a skeleton for a region. |
| About 3 to 10 s | `UProgress` with a value, when progress is known. |
| Over 10 s | `UProgress` with a value, a Cancel action, and the rest of the UI usable while it runs. |

- `loading-auto` shows its spinner at once and also blocks the second click, which is
  what matters on fast actions. For a region loader you control, wait about 200 ms
  before showing it, and once shown keep it for at least about 400 ms, so fast
  responses do not flicker.
- Past about 5 s of skeleton, switch to progress or to a timeout message with Retry.
- Cancelling long work warns first if progress would be lost.

## Loading indicators

- Place each indicator where its content will appear, sized like that content, so
  nothing shifts when the content arrives.
- Make `USkeleton` blocks mirror the final layout. Use a skeleton for a page or region;
  use a spinner for one control or module.
- Replace a row of small adjacent loaders with one.
- Load incrementally: show each item as it arrives, the most important data first.
- Name the operation: "Loading status checks", "Updating address 3 of 50".
- An action that ends on a new page may show an interstitial wait page, only for waits
  of about 3 s or more with a big result, such as creating a project. Tell the user
  their details are safe.
- Respond within about 400 ms where you can; writes (POST, PATCH, DELETE) aim for under
  500 ms.

## Optimistic updates

- For low-risk writes that are likely to succeed (toggle, rename, reorder), update the
  UI at once and reconcile with the server response.
- On failure, roll back visibly, say what failed, and offer Retry or Undo.
- Payments, destructive actions and anything hard to reverse wait for the server before
  showing success.

## Autosave

- Show autosave quietly: a "Saved" note or a "Saved 2 min ago" timestamp near the
  content. Imperative controls (a switch, a segmented control) need no indicator at
  all; their new state is the feedback.
- Keep `UForm`'s `loading-auto` for real submits. It disables every input and drops
  focus while it runs, which breaks typing during autosave.

## Field-level checks

- For an async check such as "username taken", show a small spinner in the field while
  it runs, then a check or the error in the same field.
- Show success ticks only on fields that are hard to get right, such as username
  availability. On name or postcode fields a tick confuses "correct" with "valid".

## Toasts

- A toast with an action stays until dismissed: set `duration: 0`, or offer the same
  action somewhere that stays.
- Name the toast's message after the action: "Publish", then "Published".

## When an action cannot run

Say why, at the control; `accessibility-behaviour.md` covers how.
