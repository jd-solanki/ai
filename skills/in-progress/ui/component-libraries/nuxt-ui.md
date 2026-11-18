# Nuxt UI

Checked against nuxt/ui v4.12.0. Its components are built on Reka UI.

## Its skill

Invoke `/nuxt-ui` before writing or changing a component. Install it with
`npx skills add nuxt/ui`. Its tables choose between similar components (Modal,
Slideover, Drawer or Popover; Select, SelectMenu or InputMenu; Toast, Alert or Banner).

**Override.** `/nuxt-ui` says "Use `useToast()` for action feedback". `/ux`'s in-place
rule wins: feedback for the user's own action goes on or beside the control. A toast
carries only what happens away from the user's focus, or an Undo.

## Components for `/ux`'s names

| `/ux` says | Nuxt UI |
| --- | --- |
| button with a spinner while its action runs | `UButton` with `loading-auto`, or `loading-auto` on `UForm` for submit. It follows the click's promise, keeps the label, swaps the leading icon for a spinner at once, and disables the button. |
| success in the button | None built in. Set the button's `icon` to a check for about 1.5 s, held in a ref. |
| field, label, hint, description, error | `UFormField`: `label`, `description`, `hint`, `help`, `required`. It renders the error and wires `aria-invalid` and `aria-describedby`. Optional fields: `hint="Optional"`. |
| form validation | `UForm` validates a field after its first blur, then as the user types (300 ms delay), and always on submit. Submit only: `:validate-on="[]"`. |
| focus the first invalid field | Not built in. Handle `@error` on `UForm` and focus `event.errors[0].id`. |
| autosave | Not through `UForm` submit: `loading-auto` (on by default) disables every input and drops focus while it runs. |
| modal | `UModal`. A confirm: `useOverlay().open()` returns a promise. |
| side panel | `USlideover` |
| stop a modal or side panel closing | `:dismissible="false"` and handle `@close:prevent` |
| alert | `UAlert` |
| toast | `useToast()`. One that stays: `duration: 0`. Buttons: `actions`. |
| progress bar | `UProgress` |
| skeleton | `USkeleton` |
| stepper | `UStepper` |
| empty state | `UEmpty`: `title`, `description`, `icon`, `actions`. `UTable`'s default empty text is "No data": replace it through its `empty` slot. |
| switch, checkbox, radio group | `USwitch`, `UCheckbox`, `URadioGroup` |
| select, searchable select, combobox | `USelect`, `USelectMenu`, `UInputMenu` |
| collapsible, accordion, dropdown menu, tabs | `UCollapsible`, `UAccordion`, `UDropdownMenu`, `UTabs` |
| navigation menu, breadcrumb | `UNavigationMenu` or a dashboard sidebar, `UBreadcrumb` |
| link styled as a button | `UButton` with `to` renders a link. |
| keyboard shortcut, key hint | `defineShortcuts` (`meta` maps to `ctrl` off macOS; shortcuts do not fire inside inputs), `UKbd` |
| command palette | `UCommandPalette` |
| card | `UCard`, sparingly: plain content with spacing is often better. |

## Built in: keep it

- Pressed and active styles, and the active route style on links and `UNavigationMenu`.
- Modal and slideover: focus trap, Escape, overlay click and close button (`close` and
  `dismissible` default to `true`), and focus returns to the trigger on close.
- Toasts announce themselves through `aria-live`, and pause on hover, focus and window
  blur.
- Default sizes meet the 24 px hit target.
- Overlays turn their scale and slide animations into fades under
  `prefers-reduced-motion`. Accordion height and swipe do not; handle them in your own
  motion.

## Missing: build it

- A success state on a button.
- An undo pattern.
- Focus on the first error after a failed submit.
- A show-delay and a minimum visible time on a region loader.

## Look

- Colour comes through the `color` prop's semantic names: `primary`, `secondary`,
  `success`, `info`, `warning`, `error`, `neutral`. Grey first means `neutral` by
  default.
- Danger styling, `color="error"`, belongs inside the confirmation, where the destructive
  action is the primary one.
- The theme lives in `app.config.ts` (`ui.colors`) and its CSS variables. A page never
  changes it.
