# shadcn/ui

Checked against shadcn-ui/ui `968d8cb`. Components are copied into the project as
source, so the project's `components/ui` file is the truth: read it before relying on
any line here.

`components.json` names the base, and some facts depend on it: `radix` (Radix UI),
`base` (Base UI) or `aria` (React Aria Components).

## Its skill

Invoke `shadcn` before writing or changing a component. Install it with
`npx skills add shadcn-ui/ui --skill shadcn`. Its component-selection table, its overlay
table and its form-control list choose between similar components, and its styling
rules hold.

**Override.** Every save the `shadcn` skill shows ends in a toast
(`toast.success("Changes saved.")`). `/ux`'s in-place rule wins: feedback for the
user's own action goes on or beside the control. A toast carries only what happens away
from the user's focus, or an Undo.

## Components for `/ux`'s names

| `/ux` says | shadcn/ui |
| --- | --- |
| button with a spinner while its action runs | Not built in. `Spinner` inside the `Button`, the label kept, and `disabled` set while it runs, which is also what blocks the second click. On `aria`, React Aria's `isPending` does it and keeps focus. |
| success in the button | Not built in. Swap the icon for a check for about 1.5 s, held in state. |
| field, label, hint, description, error | `Field`, `FieldLabel`, `FieldDescription`, `FieldError` (`role="alert"`). Field wires nothing: set `data-invalid` on `Field`, `aria-invalid` on the control, and `aria-describedby` to the description and error ids yourself. No hint or optional prop: write "Optional" in `FieldDescription`. |
| form validation | shadcn/ui has no form state; the project's form library decides. React Hook Form defaults to `"onSubmit"`; for short forms set `mode: "onTouched"`. |
| focus the first invalid field | React Hook Form's `shouldFocusError` (on by default) when the control gets `field.ref`. Check other form libraries. |
| modal | `Dialog`, which needs a `DialogTitle`. A confirm: `AlertDialog`. |
| side panel | `Sheet`, which needs a `SheetTitle`. `Drawer` for a bottom panel on touch. |
| stop a modal or side panel closing | Control `open`, and ask before honouring a close in `onOpenChange`. |
| alert | `Alert` |
| toast | Sonner (`toast()` from `sonner`) on `radix` and `aria`; Base UI's toast (`toast.add()`) on `base`. Undo: `action` (Sonner) or `actionProps` (Base UI). One that stays: `duration: Infinity` (Sonner) or `timeout: 0` (Base UI). |
| progress bar | `Progress`, determinate only on `radix` and `base` |
| skeleton | `Skeleton` |
| stepper | Not built in. |
| empty state | `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`. `Table` has no empty state: render an `Empty` row yourself. |
| switch, checkbox, radio group | `Switch`, `Checkbox`, `RadioGroup` |
| select, searchable select, combobox | `Select`; `Combobox` for search or suggestions |
| collapsible, accordion, dropdown menu, tabs | `Collapsible`, `Accordion`, `DropdownMenu`, `Tabs` |
| navigation menu, breadcrumb | `Sidebar` or `NavigationMenu`, `Breadcrumb` |
| keyboard shortcut, key hint | No shortcut helper: bind it yourself and skip it inside inputs. `Kbd` for the hint. |
| command palette | `CommandDialog` |
| card | `Card`, sparingly: plain content with spacing is often better. |

## Built in: keep it

- `Dialog` and `Sheet`: focus trap, Escape, overlay click, an X close button, and focus
  back to the trigger on close.
- `AlertDialog` ignores overlay clicks. On `radix` it focuses Cancel first.
- Toasts sit in an `aria-live="polite"` region and pause on hover.
- `BreadcrumbPage` sets `aria-current="page"`. `FieldError` drops duplicate messages.

## Missing: build it

- A loading and a success state on a button (except `isPending` on `aria`).
- ARIA wiring between a field, its description and its error.
- An undo pattern beyond a toast action.
- A show-delay and a minimum visible time on `Spinner` and `Skeleton`.
- Reduced motion in `Dialog`, `Sheet`, `Drawer`, `Popover` and `Accordion`: add
  `motion-reduce:` classes to their animations.
- The active route in `Sidebar` and `NavigationMenu`: set `isActive` or `active` from
  the router, and `aria-current="page"`.
- Initial focus on Cancel in `AlertDialog` on `base`: pass `initialFocus`.
- Sonner toasts are out of the tab order (Alt+T reaches them), so an Undo also needs a
  path that stays.
- Sidebar's Cmd/Ctrl+B fires inside text fields too; guard it when the screen has text
  input.

## Look

- Colour comes through variants and semantic tokens: `bg-primary`,
  `text-muted-foreground`, `text-destructive`, Badge variants. Grey first means the
  muted and foreground tokens by default.
- Danger styling, `variant="destructive"`, belongs inside the confirmation, where the
  destructive action is the primary one.
- `className` places things; it never overrides a component's colours or type. No
  manual `dark:` colours.
- The theme lives in the CSS variables of the global stylesheet. A page never changes it.
