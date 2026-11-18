# Accessibility behaviour

A component library's components carry their own ARIA, keyboard support and focus
trapping; `/ui`'s file for the library says which. Use them as they are, and own the
behaviour around them.

## Focus

- Every flow works by keyboard, with visible focus that nothing covers. For a custom
  interactive element, implement its full keyboard pattern; use native semantics where
  they exist, and add ARIA only where they do not.
- Modal and side panel: focus moves inside on open and back to the trigger on close.
  Set the initial focus yourself: the first input, or the least destructive
  button for an irreversible action.
- When the focused element disappears (a deleted row, a closed panel), move focus to
  the next row, the list, or the trigger. Otherwise focus falls to the page body.
- When content loads because the user asked for it ("Load more", an expanded node),
  focus its first new item.
- After a client-side route change, move focus to the main region.
- After a failed submit, focus as `forms-and-saving.md` describes.

## Announcing status

- Announce async results that do not move focus ("Saved", "5 results") with
  `role="status"` or `aria-live="polite"`. Render the live element before its message
  goes in, or nothing is announced.
- Announce filter and search results as counts: "5 items match", "No items match".
- Set `aria-busy="true"` on a live region while it fills, and remove it when done.
- One announcement per cluster: a page of skeletons should not produce a burst.
- Form field errors use focus management and `aria-describedby`, not a live region.
- Toasts announce themselves. Keep anything critical somewhere that stays, because a
  toast can vanish before it is read.
- Let users turn off non-critical notifications.

## Disabled, read-only, hidden

| State | Means | Behaviour |
| --- | --- | --- |
| Disabled | Not yet: waiting on a user action or a prerequisite | Visible, not focusable, not read. Use it only while a request runs, or for a short wait with a note on how to enable it. |
| Read-only | The user may see but not change it (permission, lock, running process) | Focusable and readable, with no interactive cues. Use it for any data the user must read. |
| Hidden | The user has no permission for it | Removed. It appears once the permission is granted. |

- A control that cannot act now, including during an outage, explains why: keep it
  focusable (`aria-disabled` instead of `disabled`) and answer the press with the
  reason, or show a note beside it.
- Tooltips attach only to focusable elements, so a tooltip on a disabled button never
  shows for keyboard users.
- Delay the first tooltip; once one is open, neighbouring tooltips open at once.

## Names and targets

- Icon-only buttons get an `aria-label`; a visible label is better still.
- Every hover-only action also has a keyboard and a tap path.
- Hit targets are at least 24 px, custom ones included.
