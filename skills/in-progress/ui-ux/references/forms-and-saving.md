# Forms and saving

## Save model

Pick one model per form and keep it visible.

- **Explicit save** is the default. Text inputs, textareas, checkbox groups, radio
  groups, selects and multi-selects apply on Save. Autosaving them would send
  half-typed or sensitive values, and would apply a radio the moment a screen-reader
  user arrows through it.
- **Immediate apply** suits imperative controls: `USwitch`, a segmented control, a
  single-select menu outside a form. They apply on change and get no Save button.
- One form uses one model. A page with several forms keeps one model across them where
  it can.
- One Save button per page, and one inline edit open at a time. A Save button is
  primary when it saves the whole page, secondary when it saves one section.
- On a settings page, use `USwitch` for "applies now" and `UCheckbox` for "applies on
  Save", and say which model the page uses.
- A dropdown that holds search, filters or tabs is a dialog: give it Apply and Cancel.
- On a save error, keep everything in the form and show the error in place.

## What to ask

- Know why you ask every question. Remove fields you can derive, look up, or collect
  later.
- Ask now only what the task needs now; let the rest wait for a later screen or for
  settings.
- Keep required fields few, and avoid optional ones. Where optional fields remain, mark
  them with `hint="Optional"` on `UFormField`.
- Prefill from what you already know (smart defaults). A prefilled answer still costs a
  look, so prefill only likely values.
- Ask for each piece of information once per flow; reuse what the user already gave.
- Before the form, say so if the user will need something hard to find ("you'll need
  your tax ID").

## Validation

- Nuxt UI's `UForm` waits for a field's first blur, then validates as the user types,
  300 ms after they stop. Keep that default for short app forms. For long or
  high-stakes forms, validate on submit only (`:validate-on="[]"`), then live once a
  submit has failed.
- Show no error on a field the user has not touched yet.
- Use live validation for inputs with high error rates: passwords, usernames, limits.
- On submit, show every error at once. Then focus the first invalid field: handle
  `@error` on `UForm` and focus `event.errors[0].id`. With three or more errors, also
  show a summary at the top whose items link to their fields.
- Keep an error until the user changes that field.

## Errors and hints

- Show each error under its field through `UFormField`; it wires `aria-invalid` and
  `aria-describedby` for you. A summary at the top supports the field errors and never
  replaces them.
- State format rules before typing, in `description` or `hint`: password rules, the
  date format, limits.
- When the error shows, it replaces the hint rather than repeating it.
- Keep both the passing and the failing answers after an error, from the client or the
  server. After a server error or a reload, restore what the user typed.
- Leave the user's input as they wrote it; normalise a copy for the server.
- Put help inline, next to the field; save tooltips for the rare case nothing else
  fits.
- Pair each error with an icon or text change, so colour is never the only signal.

## Submit

- Keep submit enabled. Pressing it on an incomplete form shows what is missing.
- Disable only while the request runs; `loading-auto` does this.

## Input

- Accept every format that keeps the meaning: spaces in card numbers, phone numbers with
  dashes or brackets, trailing spaces from text expansion. Normalise it yourself.
- Let the user type and paste freely, then explain what is wrong. For a length limit,
  let them exceed it and show the count or an error, rather than using `maxlength` to
  cut their text.
- Give every field a visible `label` on `UFormField`. A placeholder is an example
  value, never the label.
- Labels are about three words, in sentence case.
- One column, ordered by importance, with related fields grouped and typing fields
  together.
- Size each field to its expected value.
- Set the input `type` and `autocomplete`. Enter submits a form; in a textarea,
  Cmd/Ctrl+Enter submits.

## Choice controls

| Options | Control |
| --- | --- |
| Two to five | `URadioGroup` or a segmented control |
| More than five | `USelect` |
| About ten or more, or searchable | `USelectMenu`, or `UInputMenu` for free text with suggestions |

Prefer bounded controls (radios, date pickers, number steppers) where they prevent
invalid input.

## Conditional fields

- Reveal follow-up fields right under the choice that triggers them, without moving
  that choice.
- Once the user fills a field, keep it visible even if the condition changes; disable
  it with a short note instead.

## Long forms and wizards

- Say the cost up front: "3 steps, about 2 minutes, you'll need your ID".
- Start with one thing per page; group fields only where the grouping helps.
- Order steps from easy to hard.
- Back keeps every answer; a return visit resumes at the last completed step.
- End with a review step that has an Edit link per section.
- The last button is named after the final action ("Create project"), not "Next".
- Show progress (`UStepper`) and save as the user goes.
- Past about three steps, use pages, not a modal.

## Actions

- Keep secondary actions on a form few: no Reset or Clear. Style Cancel as a link or
  ghost button, so it is hard to hit by mistake.
- Page forms: the primary button at the bottom left, aligned with the inputs, Cancel to
  its right.
- Dialogs: actions at the bottom right, Cancel to the left of the primary.
- Comment boxes: the submit button right-aligned under the textarea.
- Inline edit: Save and Cancel right beside the input.

## Unsaved changes

Warn before navigation or closing would lose input. In a `UModal` or `USlideover`, set
`:dismissible="false"` and handle `@close:prevent` to ask first. For route changes, use
a route-leave guard. The browser's own `beforeunload` message cannot be customised.
