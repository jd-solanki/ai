# UI and UX research for the ux and ui skills

A living research document. It is the single home for everything we know about UI
structure and UX behaviour for apps built on a component library (Nuxt UI, shadcn/ui),
and the source the `ux` and `ui` skills are written from. Add to it as research grows,
as the owner adds input, and as a library changes. Every list here is open: add a rule, a source or a topic when evidence earns
it. No list is meant to be complete.

First researched 2026-11-15. Each claim is true as of the date its source was read.

**Evidence tags.** **(F)** full text, or an official excerpt, read first-hand. **(S)**
a summary, review or search snippet only. **(I)** inferred by the author. A tag covers
the claims before it, back to the previous tag. Keys in brackets, such as [ui-craft],
point to [Sources](#sources).

**Nuxt UI status** on each rule:

- **Handled**: Nuxt UI does it by default. Don't break it.
- **Part**: Nuxt UI ships the part; the agent must choose it or configure it.
- **Agent**: Nuxt UI has nothing for it.

**How to extend this document:**

1. Add the source to [Resources reviewed](#resources-reviewed), with its type, how much
   of it was read, and the verdict.
2. Put each new rule under its topic in [Rules by topic](#rules-by-topic), with its key
   and evidence tag. If it repeats an existing rule, add the key to that rule instead.
3. When sources disagree, add a row to [Conflicts](#conflicts-and-how-the-skill-settles-them).
4. When Nuxt UI changes, update [The boundary with Nuxt UI](#the-boundary-with-nuxt-ui)
   and the status on the rules it touches.

## Contents

- [Summary](#summary)
- [Resources reviewed](#resources-reviewed)
- [The boundary with Nuxt UI](#the-boundary-with-nuxt-ui)
- [The boundary with shadcn/ui](#the-boundary-with-shadcnui)
- [Core principles](#core-principles)
- [How people use interfaces](#how-people-use-interfaces)
- [Rules by topic](#rules-by-topic)
- [Notes per source](#notes-per-source)
- [Conflicts and how the skill settles them](#conflicts-and-how-the-skill-settles-them)
- [Rejected](#rejected)
- [The skills built from this](#the-skills-built-from-this)
- [Not covered yet](#not-covered-yet)
- [Sources](#sources)

## Summary

- **The owner's rule is the centre, and the evidence backs it.** Feedback for a user's
  own action belongs on or beside the control they used. The pressed button shows the
  wait and then the result. The evidence:
  - NN/g: microinteraction feedback is "usually placed in close proximity to that
    trigger" [NNg-micro].
  - Carbon: task-generated notifications "should be placed in the region of the page
    the user is working in" [Carbon-notif].
  - Primer's success flowchart ends in "Display inline message in close proximity to
    the save button" [Primer-notif].
  - Wroblewski: "Provide feedback in context of data submitted" [Wroblewski-deck].
  - Saffer names the principle "Use What Is Often Overlooked": feed back through
    elements already on screen [Saffer].
  - Weinschenk: "People can miss changes in their visual fields" [Weinschenk].
  - Apple: spinners suit "a small area ... next to a specific control, such as a
    button" [Apple-progress].
  - NN/g calls toasts "a bad way to implement an error message" [NNg-indicators].

  No agent skill states the rule as one principle ("feedback lives where attention
  already is"). It shows up only as scattered instances:
  - spinner inside the pressed button [Vercel][ui-craft];
  - a check replacing the icon in the same slot [ui-craft];
  - uniqueness checks in the field [ui-craft];
  - field errors "Inline, at the field. Not a toast, not a global banner" [ui-craft];
  - "MUST show errors next to where the action happens" [ibelick].

  Our skill can be the first to state it as a principle. (F, except Saffer's meaning,
  which is S)(I)

- **Often the best success feedback is no message.**
  - Primer: "Use success messaging sparingly and rely more on interaction context"
    [Primer-notif].
  - Apple: people "only need to know when it doesn't" succeed [Apple-feedback].
  - Cooper: "Don't use dialogs to report normalcy" [AboutFace].
  - Failure is always reported.

  (F/S)

- **One split decides toast or inline.** Task-generated feedback (the user just did it,
  here) goes in place. System-generated feedback (background work, somewhere else,
  after navigation) may go in a toast [Carbon-notif]. This settles the conflict with
  Nuxt UI's official skill, which says "Use `useToast()` for action feedback"
  [NuxtUI-skill]. (F)(I)
- **Time sets the feedback type.** Under about 1 s, show only the result. Up to about
  3 s, show an indeterminate indicator in place. Longer, show progress. Past about
  10 s, show progress with Cancel, as background work [NNg-response][Primer-loading]. (F)
- **Prefer undo to "Are you sure?"** People habituate to confirmations
  [Raskin][AboutFace][NNg-confirm]. Match friction to the blast radius
  [ui-craft][Carbon-actions]. (F/S)
- **Design the unhappy states first,** including "degraded": never show "empty" for
  data that exists but failed to load [ui-craft][Primer-degraded]. (F)
- **Explain, don't disable.** Keep submit enabled. Disabled, read-only and hidden are
  three different states [Primer-saving][Carbon-disabled][Carbon-readonly][AdamSilver].
  (F)
- **Hierarchy before decoration.** One job per screen, one primary action, frequent
  things first, the rest deferred [RefactoringUI][interface-design][NNg-disclosure].
  (F/S)
- **Delight comes last.** Walter's hierarchy runs functional, reliable, usable, then
  pleasurable [NNg-delight]. Frequent messages carry less delight [Atlassian-success].
  (F)
- **Nuxt UI gives most of the parts.** It does not decide placement, copy, timing,
  which states exist, the save model, or the success state. That is what the skill
  teaches. (I)

## Resources reviewed

Access: **Full** = full text or official excerpt read; **Excerpt** = publisher or
author sample, table of contents, or the author's own articles; **Summary** = reviews
and summaries only; **Not read** = seen and judged out of scope, or not reachable.
Verdict: **Kept** = rules taken; **Part** = some rules taken; **Rejected** = nothing
taken (reason in [Rejected](#rejected) or [Notes per source](#notes-per-source)).

### Agent skills

| Key                     | Resource                                                                                                                                                                                | Access   | Verdict                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------- |
| [Vercel]                | Vercel Web Interface Guidelines and `web-design-guidelines` skill (864K installs, S)                                                                                                    | Full     | Kept                             |
| [ui-craft]              | educlopez/ui-craft (owner's list)                                                                                                                                                       | Full     | Kept, richest source             |
| [impeccable]            | pbakaus/impeccable (409K installs, S)                                                                                                                                                   | Full     | Part                             |
| [break-ui]              | Emil Kowalski `break-ui` (owner's list)                                                                                                                                                 | Full     | Kept                             |
| [emil-design-eng]       | Emil Kowalski `emil-design-eng` (450K installs, S)                                                                                                                                      | Full     | Part                             |
| —                       | Emil Kowalski `review-animations`, `ask-sonner`                                                                                                                                         | Full     | Rejected                         |
| [frontend-design]       | Anthropic `frontend-design` (1.1M installs, S)                                                                                                                                          | Full     | Part                             |
| [interface-design]      | Dammyjay93 `interface-design` (owner's list)                                                                                                                                            | Full     | Part                             |
| [ux-discovery]          | JacobLinCool `ux-discovery-interviewer` (owner's list)                                                                                                                                  | Full     | Part                             |
| [cognitive-walkthrough] | mastepanoski `cognitive-walkthrough`                                                                                                                                                    | Full     | Part                             |
| [ibelick]               | ibelick/ui-skills: `improve-ui`, `baseline-ui`, `fixing-accessibility`                                                                                                                  | Full     | Part                             |
| [NuxtUI-skill]          | Nuxt UI official `nuxt-ui` skill                                                                                                                                                        | Full     | Boundary; one line overridden    |
| [shadcn-skill]          | shadcn/ui official `shadcn` skill and `migrate-radix-to-base` skill                                                                                                                     | Full     | Boundary; toast lines overridden |
| [ui-ux-pro-max]         | nextlevelbuilder `ui-ux-pro-max` (owner's list)                                                                                                                                         | Full     | Rejected, three lines harvested  |
| —                       | uxuiprinciples/agent-skills, 5 skills (owner's list)                                                                                                                                    | Full     | Rejected                         |
| —                       | sergekostenchuk/ui-ux-agent-skill-system, 3 skills (owner's list)                                                                                                                       | Full     | Rejected                         |
| —                       | leonxlnx `design-taste-frontend`, `high-end-visual-design`                                                                                                                              | Full     | Rejected                         |
| —                       | addyosmani `accessibility`                                                                                                                                                              | Full     | Rejected                         |
| —                       | Vercel `writing-guidelines`, `vercel-composition-patterns`                                                                                                                              | Full     | Rejected                         |
| —                       | skills.sh "Design & UI" topic list (16 skills); all assessed above or visual-only (`canvas-design`, impeccable `bolder`/`quieter`, `extract-design-system`, `sleek-design-mobile-apps`) | Full     | Directory                        |
| —                       | `design-mobile-apps`, `ui-taste`, `ios-design`, `uizze-ui`, `apple-design`, motion-graphics skills                                                                                      | Not read | Out of scope by name (S)         |

### Design systems (component-library teams writing about behaviour)

| Key           | Resource                                                                                                                                                  | Access   | Verdict                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| [Primer-*]    | GitHub Primer UI patterns: saving, loading, notification messaging, degraded experiences, empty states, progressive disclosure, feature onboarding, forms | Full     | Kept                           |
| [Carbon-*]    | IBM Carbon patterns: notifications, dialogs, common actions, disabled states, read-only states, filtering                                                 | Full     | Kept                           |
| [Atlassian-*] | Atlassian Design: designing messages, error messages, success messages                                                                                    | Full     | Part                           |
| [GOVUK-*]     | GOV.UK Design System: validation, error message, button                                                                                                   | Full     | Kept                           |
| [Apple-*]     | Apple HIG: feedback, loading, progress indicators, alerts                                                                                                 | Full     | Kept                           |
| [Material]    | Material Design 2 snackbars, Angular Material snackbar                                                                                                    | Summary  | Part                           |
| —             | Carbon status indicators, search, overflow content, global header                                                                                         | Not read | Mostly visual, or future scope |

### Books

| Key               | Book                                                                                                                                                                                             | Access                                                             | Verdict                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [RefactoringUI]   | Adam Wathan and Steve Schoger, _Refactoring UI_                                                                                                                                                  | Excerpt (official table of contents) and Summary                   | Part: the hierarchy chapters only                                  |
| [Krug]            | Steve Krug, _Don't Make Me Think, Revisited_ (2014)                                                                                                                                              | Excerpt (Chapter 4, official sample) and Summary                   | Kept                                                               |
| [Norman]          | Don Norman, _The Design of Everyday Things_ (revised)                                                                                                                                            | Summary (book notes quoting the text), plus Norman's own essay     | Kept                                                               |
| [AboutFace]       | Alan Cooper et al., _About Face_                                                                                                                                                                 | Summary                                                            | Kept                                                               |
| [Tidwell]         | Jenifer Tidwell, _Designing Interfaces_                                                                                                                                                          | Excerpt (O'Reilly preview with Chapter 1, "What Users Do")         | Kept                                                               |
| [Saffer]          | Dan Saffer, _Microinteractions_ (2013)                                                                                                                                                           | Excerpt (O'Reilly preview: table of contents, preface) and Summary | Part                                                               |
| [AdamSilver]      | Adam Silver, _Form Design Patterns_ (2018)                                                                                                                                                       | Excerpt (the author's own articles) and Summary                    | Kept                                                               |
| [Wroblewski-deck] | Luke Wroblewski, _Web Form Design_ (2008)                                                                                                                                                        | Excerpt (the author's best-practice deck)                          | Kept                                                               |
| [PracticalUI]     | Adham Dannaway, _Practical UI_ (2nd ed., 2024)                                                                                                                                                   | Excerpt (official free preview)                                    | Part                                                               |
| [Weinschenk]      | Susan Weinschenk, _100 Things Every Designer Needs to Know About People_ (2nd ed.)                                                                                                               | Excerpt (Pearson sample: contents) and Summary                     | Part                                                               |
| [Johnson]         | Jeff Johnson, _Designing with the Mind in Mind_                                                                                                                                                  | Summary (chapter list)                                             | Part                                                               |
| [Walter]          | Aarron Walter, _Designing for Emotion_                                                                                                                                                           | Summary (via [NNg-delight])                                        | Part                                                               |
| [Garrett]         | Jesse James Garrett, _The Elements of User Experience_                                                                                                                                           | Excerpt (the author's own diagram)                                 | Part: framing                                                      |
| [Raskin]          | Jef Raskin, _The Humane Interface_ (2000)                                                                                                                                                        | Summary, plus Aza Raskin's article on the same argument            | Part                                                               |
| [Podmajersky]     | Torrey Podmajersky, _Strategic Writing for UX_                                                                                                                                                   | Summary (table of contents, reviews)                               | Part                                                               |
| [Yifrah]          | Kinneret Yifrah, _Microcopy: The Complete Guide_                                                                                                                                                 | Summary, plus the author's article                                 | Part                                                               |
| [LawsOfUX]        | Jon Yablonski, _Laws of UX_ (the book of lawsofux.com)                                                                                                                                           | Full (the site)                                                    | Part                                                               |
| —                 | Nir Eyal, _Hooked_                                                                                                                                                                               | Not read                                                           | Rejected: habit-forming engagement design                          |
| —                 | _Just Enough Research_, _Interviewing Users_, _Lean UX_, _Continuous Discovery Habits_, _Sprint_, _Rocket Surgery Made Easy_, _The User Experience Team of One_, _Articulating Design Decisions_ | Not read                                                           | Out of scope: research process and career, not interface behaviour |
| —                 | _Universal Principles of Design_, _UI is Communication_, _Inclusive Design Patterns_, _UX for AI_, _Atomic Design_, typography books                                                             | Not read                                                           | Future scope or visual; see [Not covered yet](#not-covered-yet)    |

Book lists consulted: Untitled UI's UX and UI book lists [UntitledUI-books]; Goodreads
UI/UX shelves (S).

### Research articles and guidelines

| Key                                                             | Resource                                                                        | Access                          | Verdict  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------- | -------- |
| [NNg-*]                                                         | Nielsen Norman Group articles (listed in Sources) and the UX Basics study guide | Full                            | Kept     |
| [Wroblewski-inline], [Wroblewski-actions], [Wroblewski-obvious] | Luke Wroblewski articles                                                        | Full                            | Kept     |
| [Kowalski-*]                                                    | Emil Kowalski articles on animation                                             | Full                            | Part     |
| [Rauno]                                                         | Rauno Freiberg, "Invisible Details of Interaction Design"                       | Full                            | Part     |
| [Linear-menus], [Linear-triage]                                 | Linear engineering posts                                                        | Full / Summary                  | Part     |
| [AzaRaskin]                                                     | Aza Raskin, "Never Use a Warning When You Mean Undo" (A List Apart)             | Full                            | Kept     |
| [Viget]                                                         | Viget, "A Bone to Pick with Skeleton Screens"                                   | Summary (the page returned 429) | Disputed |

### Standards

| Key          | Resource                                                          | Access                             | Verdict  |
| ------------ | ----------------------------------------------------------------- | ---------------------------------- | -------- |
| [WCAG-*]     | WCAG 2.2: 2.2.1, 3.3.7, 4.1.3 Understanding docs                  | Full                               | Kept     |
| [APG-*]      | WAI-ARIA APG: dialog pattern, keyboard interface                  | Full                               | Kept     |
| [Reka]       | Reka UI Dialog and Toast docs (Nuxt UI's primitives)              | Full                               | Boundary |
| [shadcn-src] | shadcn/ui registry source (three bases) and docs                  | Full (the files listed in Sources) | Boundary |
| [Radix-src]  | Radix UI Dialog and AlertDialog source (shadcn `radix` base)      | Full (two files)                   | Boundary |
| [BaseUI-src] | Base UI Dialog, AlertDialog and Toast source (shadcn `base` base) | Full                               | Boundary |
| [RAC-src]    | React Aria Components Button source (shadcn `aria` base)          | Full (one file)                    | Boundary |
| [Sonner-src] | Sonner source and CSS (shadcn toast on `radix` and `aria`)        | Full                               | Boundary |
| [tw-animate] | tw-animate-css stylesheet (shadcn overlay animations)             | Full                               | Boundary |

### Videos

| Resource                                                                                    | Access                                                                                         | Verdict             |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------- |
| NN/g videos (UX slogans, "Users Are Not Lazy", "Tabs Used Right"), linked from [NNg-basics] | Summary (the pages give a written summary and no transcript; the YouTube player needs cookies) | Part                |
| Dan Saffer, "Designing with Details" talks (Webstock, UX Lx)                                | Not read (video only)                                                                          | Covered by [Saffer] |
| Designer talks searched by topic (loading, empty states)                                    | Not read (no transcripts found; results were secondary blog posts)                             | Gap                 |

## The boundary with Nuxt UI

**Who owns what.** Garrett's planes help here [Garrett] (F):

- Surface (visual design): Nuxt UI and the app theme own it.
- Skeleton (interface, navigation and information design): shared. Nuxt UI owns the
  components; the skill owns which ones, where, and in what order.
- Structure (interaction design, information architecture): the skill.
- Scope (functional and content requirements): the skill.
- Strategy (user needs): the skill's discovery questions.

**Leave out** anything about type, colour, spacing, radius, shadow, dark mode, icon
sets and component styling, and component API details. The official `nuxt-ui` skill and
the Nuxt UI MCP server own props and component choice; point there [NuxtUI-skill].
(F)(I)

**What Nuxt UI already does.** Verified at nuxt/ui `3879d26`, v4.12.0, still the head
of `v4` on 2026-11-15 [NuxtUI-src][Reka] (F):

- Button `loading` / `loading-auto`: keeps the label, swaps the leading icon for a
  spinner, disables the button. `loading-auto` follows the `@click` promise and works
  with Form submit. **Handled.**
- Form: validates on input only after a field's first blur (unless
  `eager-validation`), with `validate-on-input-delay` 300 ms; always validates on
  submit; `loading-auto` (default `true`) disables every input during submit and drops
  focus. **Handled.**
- FormField: renders the error, wires `aria-invalid` and `aria-describedby`; has
  `label`, `description`, `hint`, `help`, `required`. **Handled / Part.**
- Modal (Reka Dialog): focus trap, Escape, overlay click, close button, return focus to
  the trigger. `close` and `dismissible` default to `true`. **Handled.**
- Toast: announced through `aria-live`, foreground or background `type`, pauses on
  hover, focus and window blur, F8 jumps to it, `actions`. A `toast.promise()` (loading
  toast that becomes success) is marked "Soon". **Handled / Part.**
- `useOverlay().open()` returns a promise, which suits a confirm dialog. **Part.**
- Overlays honour reduced motion: `keyframes.css` turns scale and slide keyframes into
  fades under `prefers-reduced-motion`. Accordion height and swipe are left as they
  are. **Handled.**
- `defineShortcuts`: `meta` maps to `ctrl` off macOS; shortcuts don't fire inside
  inputs by default. **Part.**
- Link and NavigationMenu apply active styles from the route. **Handled.**
- Empty (`title`, `description`, `icon`, `actions`, `loading`), Skeleton, Progress
  (determinate and indeterminate), Stepper, Tabs, Accordion, Collapsible,
  DropdownMenu, Slideover, CommandPalette, Kbd, SelectMenu, InputMenu, RadioGroup,
  Switch, Checkbox. **Part.**

**What Nuxt UI does not do** (the skill's job) (F):

- No success state on Button.
- No undo pattern.
- No focus on the first error after a failed submit. The docs show it only as an
  example with `@error`.
- No show-delay or minimum visible time on loading indicators.
- Table's default empty text is "No data".
- Nothing decides placement, copy, timing, the save model, or which states exist.

**Override to state in the skill.** The official skill says "Use `useToast()` for
action feedback: 'Item saved', 'Email sent', 'Error occurred'" [NuxtUI-skill]. Our
in-place rule wins over that line. Its other lines agree with us and stand:

- "Never use a toast for information the user needs to act on — use an alert or modal
  instead"
- "Don't overuse `UCard` — plain content with spacing is often better"
- "Use `UTabs` when switching views that don't need their own URL"
- "Use `USlideover` for detail views in dashboards"
- "Use `UModal` for destructive confirmations"

Its component-selection tables (Modal, Slideover, Drawer or Popover; Select,
SelectMenu or InputMenu; Toast, Alert or Banner) are where our skill should point, not
repeat. (F)(I)

## The boundary with shadcn/ui

The status words above (**Handled**, **Part**, **Agent**) apply here with shadcn/ui in
place of Nuxt UI.

**Who owns what.** Garrett's planes split the same way as for Nuxt UI [Garrett] (F),
with one change: the surface is the project's own copy of each component, not a
package.

- Surface (visual design): the project's copied component files, its style preset and
  its theme variables own it.
- Skeleton (interface, navigation and information design): shared. shadcn/ui owns the
  components; the skill owns which ones, where, and in what order.
- Structure, scope and strategy: the skill, as for Nuxt UI.

**Leave out** anything about type, colour, spacing, radius, shadow, dark mode, icon
sets, component styling and component API details. The official `shadcn` skill and
`npx shadcn@latest docs <component>` own props and composition; point there
[shadcn-skill]. (F)(I)

**Bases and copied source.** The registry at `apps/v4/registry/bases/` ships three
bases, not two: `radix` (Radix UI), `base` (Base UI) and `aria` (React Aria
Components). The skill's `base` field lists only "`radix` or `base`", but its toast
rule names "Radix and React Aria projects", so the third base is live [shadcn-skill]
[shadcn-src] (F). Each fact below holds for all three bases unless a base is named.
"Components are added as source code to the user's project via the CLI"
[shadcn-skill], so a project's `components/ui` copy may differ from upstream: read
the project's file before relying on any line here, and expect upstream changes only
through `npx shadcn@latest add <component> --diff` (F)(I).

**What shadcn/ui already does.** Verified at shadcn-ui/ui `968d8cb`, the head of
`main` on 2026-11-18 [shadcn-src][shadcn-skill], with primitive behaviour read from
the libraries `apps/v4/package.json` pins [Radix-src][BaseUI-src][RAC-src][Sonner-src]
[tw-animate] (F):

- Button: no `loading` prop on any base. The skill: "Button has no
  `isPending`/`isLoading`. Compose with `Spinner` + `data-icon` + `disabled`." Its
  example keeps the spinner inside the button and changes the text to "Saving...".
  Nothing blocks a second click unless the app sets `disabled`. The `aria` base is the
  exception: its Button passes props to React Aria's Button, whose `isPending`
  "disables press and hover events while retaining focusability, and announces the
  pending state to screen readers". The shadcn skill does not mention it. **Part.**
  (F)(I)
- Spinner: an `animate-spin` icon with `role="status"` and `aria-label="Loading"`.
  **Part.** (F)
- Field (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`,
  `FieldLegend`, `FieldGroup`), the same on all three bases: `FieldError` renders only
  when given `errors` or children, as `role="alert"`, and drops duplicate messages.
  Field wires nothing: no `id`, no `aria-describedby`, no `aria-invalid`. The app sets
  `data-invalid` on `Field` and `aria-invalid` on the control by hand, and the form
  guides never set `aria-describedby`. No `required`, optional or hint prop;
  `FieldDescription` is the only helper text. The error renders wherever the app puts
  `FieldError`; the docs put it after the control inside `Field`. **Part.** (F)
- Form library: shadcn/ui ships no form state. The docs pair Field with React Hook
  Form, TanStack Form or Formisch, and timing is the library's: the React Hook Form
  guide lists `"onSubmit"` as the default mode, with `"onChange"` and `"onBlur"`; the
  TanStack guide uses `validators: { onSubmit: formSchema }` (F). Focus on the first
  error comes from React Hook Form's own `shouldFocusError` (default `true`) when the
  control receives `field.ref`, which the docs' `{...field}` spread passes (S)(I). The
  TanStack guide was not checked for focus. The older
  `Form` component (a React Hook Form wrapper whose `FormControl` sets `aria-invalid`
  and `aria-describedby`) survives only in the `new-york-v4` registry; the bases do
  not ship it. **Part.** (F)
- Dialog and Sheet: focus trap, Escape, overlay click, an X close button
  (`showCloseButton` defaults to `true` on the content, `false` on `DialogFooter`), and
  focus back to the trigger. Radix focuses the trigger in `onCloseAutoFocus`; Base UI's
  `finalFocus` defaults to "trigger or previously focused element"; the `aria` wrapper
  sets `isDismissable` on Dialog and Sheet. The skill requires a `DialogTitle` /
  `SheetTitle`. **Handled.** (F)
- AlertDialog: no X; `AlertDialogCancel` and `AlertDialogAction`. Overlay click does
  not close it on any base. Bases differ on first focus: Radix focuses Cancel; Base UI
  "focuses the first tabbable element. To preserve Radix behavior pass
  `initialFocus={cancelRef}`" [shadcn-skill] (`migrate-radix-to-base/overlays.md`).
  **Handled** on `radix`; **Part** on `base`. (F)
- Drawer: `radix` wraps vaul; `base` and `aria` wrap Base UI's Drawer (`modal`
  defaults to `true`, swipe to dismiss). No close button. **Part.** (F)
- Popover: not modal by default (`modal` defaults to `false` on Radix and Base UI), so
  focus is not trapped; Escape and an outside press close it. No close button.
  **Handled / Part.** (F)
- Toast follows the base. `radix` and `aria` use Sonner (`toast()` from `sonner`,
  through the `Toaster` wrapper); `base` uses Base UI's toast at `components/ui/toast`
  (`toast.add()`), and `add --all` installs both there. The Radix docs page for `toast`
  says "The toast component has been deprecated. Use the sonner component instead."
  (F)
  - Sonner: an `aria-live="polite"` region; 4000 ms default, 3 visible; pauses on
    hover, pointer down, a hidden tab, and while Alt+T has the list open. The list is
    out of the tab order ("only available via hotkey"), so tabbing never reaches a
    toast. `action` (the skill's Undo example), `toast.loading`, `toast.promise`.
    **Handled / Part.** (F)
  - Base UI toast: `aria-live="polite"`, high-priority toasts as `role="alert"`;
    5000 ms default, limit 3; F6 focuses the viewport and pauses; pauses on hover,
    focus and window blur; `actionProps`; `toast.promise`. **Handled / Part.** (F)
- Reduced motion: none in the overlays. Their enter and exit come from tw-animate-css
  classes (`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`) in the style
  CSS, and tw-animate-css has no `prefers-reduced-motion` rule. The `shimmer` utility
  in `shadcn/tailwind.css` and Sonner's own CSS stop under reduced motion; the
  accordion keyframes and Base UI toast transforms do not (F). A GitHub code search
  finds `motion-reduce` in no overlay component or style file; in the registry only
  the chat `Trace` component uses it (S). **Agent.**
- Shortcuts: no helper. `Kbd` and `KbdGroup` are styled `<kbd>` elements;
  `DropdownMenuShortcut` is display text. Sidebar binds Cmd/Ctrl+B on `window` with no
  input check, so it fires inside text fields. Command (cmdk) handles arrow keys and
  filtering. **Agent / Part.** (F)
- Navigation: nothing reads the route. `SidebarMenuButton` takes `isActive` (default
  `false`) and sets `data-active`, with no `aria-current`; `NavigationMenuLink` styles
  `data-active` from the primitive's `active` prop; `BreadcrumbPage` renders
  `aria-current="page"`. **Part.** (F)
- Empty is composition, not props: `Empty`, `EmptyHeader`, `EmptyMedia` (`variant`
  `default` or `icon`), `EmptyTitle`, `EmptyDescription`, `EmptyContent`; no loading
  state. Skeleton is an `animate-pulse` div with no `aria-hidden` or `aria-busy`.
  Progress is determinate only on `radix` and `base` (no value draws an empty bar);
  the `aria` Progress fills the track when indeterminate. **Part.** (F)
- Tabs, Accordion, Collapsible, DropdownMenu, RadioGroup, Switch, Checkbox: thin
  wrappers over each base's primitive; trigger props differ (`asChild` on `radix`,
  `render` on `base`, plus Accordion, Select and ToggleGroup differences in
  `rules/base-vs-radix.md`). Select wraps each base's own Select. Combobox wraps Base
  UI's Combobox on both `radix` and `base`, and React Aria on `aria`; the skill picks
  "Dropdown with predefined options → `Select`", "Searchable dropdown → `Combobox`".
  Command wraps cmdk on `radix` and `base`. **Part.** (F)

**What shadcn/ui does not do** (the skill's job) (F):

- No loading or success state on Button, except React Aria's `isPending` on `aria`.
- No undo pattern beyond a toast action.
- No ARIA wiring in Field: the app sets `aria-invalid` and `aria-describedby` itself.
- No focus on the first error after a failed submit; that is the form library's.
- No show-delay or minimum visible time on Spinner or Skeleton.
- No reduced motion in Dialog, Sheet, Drawer, Popover or Accordion.
- No route-aware active state in Sidebar or NavigationMenu.
- No empty text anywhere: Table has no empty state, `CommandEmpty` and `ComboboxEmpty`
  take children, and only the data-table guide's example writes "No results.".
- Nothing decides placement, copy, timing, the save model, or which states exist.

**Override to state in the skill.** The shadcn skill has no line like Nuxt UI's "Use
`useToast()` for action feedback", but every save it shows ends in a toast, so our
in-place rule wins over these [shadcn-skill][shadcn-src]:

- `rules/composition.md`, "Toast notifications follow the project base":
  `toast.add({ title: "Changes saved." })` and `toast.success("Changes saved.")`.
- Its Component Selection row: "Feedback | `toast` (Base UI), `sonner` (Radix/Aria),
  `Alert`, `Progress`, `Skeleton`, `Spinner`".
- The TanStack Form guide's `onSubmit` handler:
  `toast.success("Form submitted successfully")`. The React Hook Form demo's:
  `toast("You submitted the following values:", ...)`.

Its other lines agree with us and stand:

- "Button has no `isPending`/`isLoading`. Compose with `Spinner` + `data-icon` +
  `disabled`." (spinner inside, button disabled, "Saving...")
- `toast("File deleted.", { action: { label: "Undo", onClick: () => undoDelete() } })`
  (undo over a warning; the toast is still the place)
- "Empty states use `Empty`. Don't build custom empty state markup."
- "Callouts use `Alert`."
- "Use `Skeleton` for loading placeholders."
- "Dialog, Sheet, and Drawer always need a Title."
- "Destructive action confirmation | `AlertDialog`"

Its styling lines keep the library's default look, which our UI skill also keeps;
quote them, don't restate them:

- "**Use built-in variants before custom styles.** `variant="outline"`, `size="sm"`,
  etc."
- "**Use semantic colors.** `bg-primary`, `text-muted-foreground` — never raw values
  like `bg-blue-500`."
- "**`className` for layout, not styling.** Never override component colors or
  typography."
- "**No manual `dark:` color overrides.** Use semantic tokens (`bg-background`,
  `text-muted-foreground`)."
- "For positive, negative, or status indicators, use Badge variants, semantic tokens
  like `text-destructive`, or define custom CSS variables — don't reach for raw
  Tailwind colors."
- "To customize a component's appearance, prefer these approaches in order: 1.
  **Built-in variants** … 2. **Semantic color tokens** … 3. **CSS variables**"

Its component-selection table, its overlay table ("Choosing between overlay
components") and its form-control list in `rules/forms.md` are where our skill should
point, not repeat. (F)(I)

## Core principles

`SKILL.md` material. An open list: add a principle when several sources agree on a
behaviour that applies across topics.

- **Feedback goes where the user's attention already is.** Spinner inside the pressed
  button, keeping its label; success in that same element; a field's error under that
  field; a dialog's error inside the dialog. [NNg-micro][NNg-buttons][Carbon-notif]
  [Primer-notif][Wroblewski-deck][Saffer][Vercel][ui-craft] **Part**
- **Toast only for what happened elsewhere.** System-generated news, results of
  background work, or a carrier for Undo. Never the only place for something the user
  must act on. [Carbon-notif][NNg-indicators][NuxtUI-skill][WCAG-2.2.1][ibelick] **Part**
- **Let the result speak.** Add a message only when the result is not visible. Always
  report failure. [Primer-notif][Apple-feedback][AboutFace] **Agent**
- **Design every state before the happy path:** loading, each kind of empty, error,
  partial, degraded, success, conflict, offline. [ui-craft][impeccable][Primer-degraded]
  [Vercel][Norman] **Agent**
- **One job per screen.** Name the task and its focal element before building. One
  primary action per view; demote the rest. [interface-design][ui-craft][RefactoringUI]
  [Carbon-dialog][Primer-saving] **Agent**
- **Make every choice mindless.** Labels say plainly where they go. Ask nothing up front
  that can wait. Give guidance that is brief, timely and unavoidable. [Krug][Tidwell]
  [NNg-interaction-cost] **Agent**
- **Friction matches blast radius.** Undo for recoverable actions; a dialog with verb
  buttons for costly ones; type-the-name for irreversible or bulk ones.
  [ui-craft][Carbon-actions][NNg-confirm][Apple-alerts][Raskin][AzaRaskin] **Part**
- **No dead ends, no lost work.** Every error offers a next step. The user's input
  survives every failure. Never make people start over. [Vercel][NNg-errors]
  [GOVUK-error][Primer-saving][Norman] **Agent**
- **Status is honest.** Feedback matches the wait. Loading text names the real
  operation. Never fake progress or hide an outage. [NNg-response][Primer-loading]
  [Apple-progress][impeccable][Primer-degraded] **Agent**
- **The control type is the save promise.** A switch, segmented control or single menu
  applies at once. Inputs, checkboxes, radios and selects apply on Save. Never mix both
  in one form. [Primer-saving][ui-craft] **Part**
- **Explain, don't disable.** Keep submit enabled and show what is missing. Disable only
  while the request runs. Use read-only for data to look at, and hide only for no
  permission. [Primer-saving][Primer-forms][GOVUK-button][Carbon-disabled]
  [Carbon-readonly][AdamSilver] **Agent**
- **Forgive input.** Accept any format that keeps the meaning, and never block typing.
  Assume what the user did is partly right. [Postel][Vercel][Norman][AboutFace]
  [Wroblewski-deck] **Agent**
- **Words do the work.** Labels are a verb plus an object. An action keeps its name
  through the flow. One term per concept. [ui-craft][frontend-design][Vercel]
  [NNg-uicopy][Primer-saving] **Agent**
- **Follow conventions; respect habits.** Users expect your app to work like the others
  they use. A gesture that works elsewhere must work here, and must never destroy.
  [LawsOfUX][Tidwell][Raskin] **Agent**
- **Use what exists.** Use the app's own component or Nuxt UI's before hand-rolling one.
  [interface-design][NuxtUI-skill][Primer-loading] **Part**
- **Save delight for last.** Add surface delight only when the screen is functional,
  reliable and usable, and less of it where users see it often. [NNg-delight][Walter]
  [Atlassian-success][ui-craft] **Agent**

## How people use interfaces

Behaviour the rules are built on, mostly from the books. An open list. Each item ends
with what it means for the design.

- **People scan, satisfice and muddle through.** They don't read pages; they pick the
  first option that might work and back out if it was wrong [Krug][Tidwell] (F/S). 79%
  of users scan [NNg-read] (F). _Write labels so the first guess is right; make backing
  out cheap._
- **Clicks are cheap; thinking is expensive.** "It doesn't matter how many times I have
  to click, as long as each click is a mindless, unambiguous choice" (Krug's second
  law). Rule of thumb: "three mindless, unambiguous clicks equal one click that requires
  thought" [Krug] (F). _Count the decisions, not the clicks._
- **Guidance is "brief, timely, unavoidable".** The smallest helpful information, placed
  where it is needed, formatted so it is noticed [Krug] (F). _Put the hint next to the
  field at the moment it's needed._
- **Safe exploration.** "Let me explore without getting lost or getting into trouble."
  People who can try, back out and try again learn more and feel more positive
  [Tidwell] (F). _Undo, a working Back button, no surprise costs._
- **Instant gratification.** "I want to accomplish something now, not later." Make the
  first likely task "stunningly easy"; don't hide it behind registration, instructions
  or slow screens [Tidwell] (F).
- **Changes in midstream.** People change goals mid-task or get interrupted. Support
  "reentrance": remember what was typed, let them stop and resume [Tidwell] (F).
- **Deferred choices.** "I don't want to answer that now; just let me finish!" Ask few
  questions up front, keep required fields few, use good defaults, let users return
  later; prefilled answers still cost a look [Tidwell] (F).
- **Incremental construction.** People build in small steps and need to see the whole
  result as they work, with no delay between a change and its result [Tidwell] (F).
- **Habituation.** Repeated actions become reflexes. A habit that does something
  different, or destructive, in one place catches users out [Tidwell] (F).
  Confirmations get dismissed by habit, so they protect no one [Raskin][AzaRaskin]
  (S/F). Weinschenk: "People habituate to information" [Weinschenk] (F, contents).
- **Spatial memory, prospective memory, streamlined repetition, keyboard only,
  microbreaks.** Keep things where they were; let people leave reminders; reduce a
  repeated operation to one action; support keyboard-only use; make quick tasks fast to
  reach [Tidwell] (S).
- **Attention is narrow; change blindness is real.** People miss changes outside the
  spot they look at, and remember only about four items at once
  [Weinschenk][Johnson][LawsOfUX] (F, contents / S). _Show the result where they look;
  never make them carry a value between steps._
- **Recognition is easy; recall is hard.** Show options instead of asking people to
  remember them [Johnson][NNg-heuristics] (S/F).
- **Users are not lazy.** They spend effort on their goals, not on learning your design
  [NNg-basics] (S). People take shortcuts only if they are easy [Weinschenk] (F,
  contents).
- **People make predictable errors, more under stress.** Slips (right goal, wrong
  action) and mistakes (wrong goal or plan) need different defences [Norman]
  [Weinschenk] (S/F). "If the system lets you make the error, it is badly designed"
  [Norman] (S).
- **Interaction cost** is the sum of physical and mental effort: looking, scrolling,
  reading, clicking, waiting, typing, thinking, remembering [NNg-interaction-cost]
  [PracticalUI] (F). _Compare designs by it._
- **Goodwill is a reservoir.** It drains when you hide information users need, punish
  them for not doing things your way, ask for unnecessary information, make them feel
  stupid or repeat themselves. It refills when you make the main tasks easy, answer
  likely questions, save steps and make errors easy to recover from [Krug] (S).
- **Perpetual intermediates.** Most users stay intermediates; optimize for them, not
  for beginners or experts, and don't weld on training wheels [AboutFace] (S).
- **People want the familiar when they are sad or scared.** Keep error and failure
  states plain and steady [Weinschenk] (F, contents)(I).
- **Delight needs a base.** "A product can be delightful only if it is usable"
  [NNg-delight] (F). Surface delight (animation, microcopy) on a broken base gives no
  lasting benefit.

## Rules by topic

One heading per future reference file. Each topic list is open.

### Feedback and async

**Where feedback goes.** This decision list merges Primer's flowcharts, Carbon's
notification types and the owner's rule [Primer-notif][Carbon-notif][Carbon-dialog]
(F):

| Situation                                                                                                      | Feedback                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| The result is visible where the user looks (an edit returns to the updated text; the item appears in the list) | No message. Make sure screen readers still hear it.                                                                                        |
| An action from a button, and the user stays on the page                                                        | In the button: spinner, then a brief success mark. Or an inline message next to the button.                                                |
| A save or submit that navigates away                                                                           | The new page is the feedback. Show a banner only if the URL change doesn't make success clear.                                             |
| A field is wrong                                                                                               | Under the field. Add a summary at the top only when there are 3 or more errors [Primer-forms].                                             |
| An action from inside a dialog                                                                                 | Keep the dialog open until the action finishes. On failure, show a banner at the top of the dialog. Don't close it and report on the page. |
| A long task the user may leave                                                                                 | Progress in place, then a notification or toast when done.                                                                                 |
| A background or system event, not caused by the user here                                                      | Toast, or a banner if it affects the whole page.                                                                                           |
| An error that blocks the main task and has no place on screen                                                  | A small dialog with guidance. Rarely.                                                                                                      |

Supporting evidence:

- Apple: "When status feedback is available near the items it describes, people get
  important information without having to take action or leave their current context"
  [Apple-feedback] (F).
- NN/g: indicators belong "in close proximity to that element" [NNg-indicators] (F).
- NN/g eyetracking: a user who got no feedback after a click kept looking back and
  forth [NNg-status] (F).
- Norman: "Feedback must be immediate: even a delay of a tenth of a second can be
  disconcerting." Poor or excessive feedback can be worse than none [Norman] (S).
- Cooper: show status inside the main interface, not in dialogs ("rich modeless
  feedback") [AboutFace] (S).

**The pressed control shows the wait.** NN/g's loading state "adds a loading spinner ...
to the left of the button label" [NNg-buttons]. Vercel: "Show a loading indicator &
keep the original label" [Vercel]. It answers "did my click register?" where the eye
already is, and blocks a double submit (I). (F)

**Every press responds within about 100 ms.** The pressed state "should appear within
100–150ms", or users press again [NNg-buttons]. 0.1 s "creates the illusion of
instantaneous response" [Nielsen-timescales] (F). **Handled** by active styles.

**Lifecycle of every async action** [Primer-loading] (F):

1. Initiated.
2. In progress.
3. Succeeded: show success unless the user moved on.
4. Failed: say what went wrong and offer Retry where it applies.

**How long, what to show** [NNg-response][NNg-progress][Primer-loading][Apple-progress]
(F):

- Under about 1 s: no loading indicator. A flash makes "the product feel slower than it
  is" [Primer-loading].
- About 1 to 3 s: indeterminate. Use a spinner in the control, or a skeleton for a
  region.
- About 3 to 10 s: determinate if progress is known.
- Over 10 s: determinate and cancellable, and treated as a background task so the rest
  of the UI stays usable.
- NN/g puts the spinner at 2 to 10 s and percent-done past 10 s.
- A looping indicator made people wait "on average 3 times longer" than none
  [NNg-progress].
- Apple: "When possible, use a determinate progress indicator". Switch from
  indeterminate to determinate once you know the progress, and keep it moving
  [Apple-progress].

**Spinner timing.** Vercel adds a show-delay of about 150 to 300 ms and a minimum
visible time of about 300 to 500 ms, so fast responses don't flicker [Vercel] (F).
`loading-auto` shows the spinner at once [NuxtUI-src] (F). To square the two, block a
second click at once and delay only the spinner (I).

**Button success.** NN/g: the spinner may "animate to a check icon to visually show that
the action was successful" [NNg-buttons] (F). In Nuxt UI, swap the button's `icon` to a
check for about 1 to 2 s, then return to rest (duration is I). Use it when the result is
not otherwise visible: Copy, Send invite, Save settings. Carbon: copy shows a "copied"
tooltip after the click [Carbon-actions] (F).

**Loading buttons** [Vercel][ui-craft][Wroblewski-deck] (F). **Handled** by
`loading-auto`:

- "Keep the label; don't swap to just a spinner."
- "Disable but don't hide — users click it trying to cancel."
- "Spinner goes _inside_ the button, not next to it."
- Disable submit after the click to avoid duplicate submissions.

**Loading indicators:**

- Put the indicator nearest to the content it stands in for, and don't shift layout
  when content replaces it [Primer-loading] (F).
- Replace a row of small adjacent loaders with one [Primer-loading] (F).
- Make skeletons "mirror final content exactly to avoid layout shift" [Vercel][ui-craft]
  (F). Use skeletons for full-page or region loads; a spinner for one module or control
  [NNg-skeleton] (F). **Part**: Skeleton is a bare shape; matching the layout is the
  agent's job.
- Show skeletons "after **200ms**, not immediately". Past about **5 s**, "escalate to a
  progress indicator or a timeout message with a retry" [ui-craft] (F).
- Load incrementally. Show each item as it arrives, and load the most important data
  first [Primer-loading] (F).
- Show something at once. A blank screen can be read "as a problem with your app";
  "Let people do other things ... while they wait" [Apple-loading] (F).
- Name the operation: "loading status checks", "Updating address 3 of 50", not
  "Loading" [Primer-loading][NNg-progress][Apple-progress] (F). Apple: "Avoid vague
  terms like loading or authenticating because they seldom add value."
- Let people cancel long work, and warn if cancelling loses progress
  [Vercel][Apple-progress] (F).
- A process that ends on a new page may use an interstitial wait page, sparingly, only
  for waits of about 3 s or more with a big result. Make the user confident their
  details won't be lost [Primer-loading][Primer-saving] (F).

**Speed targets.**

- Aim for responses under 400 ms (Doherty and Thadani, IBM, 1982) [LawsOfUX] (F).
- Mutations ("POST/PATCH/DELETE") under 500 ms [Vercel] (F).
- Linear treats anything over "a few hundred milliseconds" as something to make faster
  [Linear-triage] (S).
- Cooper: "Optimize for responsiveness; accommodate latency" [AboutFace] (S).

**Optimistic updates and autosave** [Vercel][ui-craft] (F):

- "Update the UI immediately when success is likely; reconcile on server response."
  On failure, roll back visibly and offer Undo or Retry. "Never silently revert."
- Payments and destructive actions "always wait for server confirmation before showing
  success."
- Autosave: "Never show a spinner for autosave. The whole point is invisibility. A
  check mark or timestamp is enough." Primer goes further: an auto-saved control should
  make its saved state obvious without an indicator, which "could be mistaken as a
  validation status" [Primer-saving].
- Don't use Form `loading-auto` for autosave. It disables every input and drops focus
  [NuxtUI-src].

**Async field checks** (username taken): "a tiny spinner in the field during the check,
then a green check or red error on resolve" [ui-craft] (F). Put success ticks only on
hard fields. Ticks on obvious ones (name, postcode) confused people about "correct"
versus "valid" [Wroblewski-inline] (F).

**Edge cases handled invisibly.** "Pause toast timers when the tab is hidden"
[emil-design-eng] (F). **Handled** by Toast (pauses on window blur).

**When a command can't run, say why.** Apple: "Show people when a command can't be
carried out and help them understand why" [Apple-feedback] (F).

### States

**State lattice** [ui-craft] (F): idle, loading, empty, error, partial, success,
conflict, offline. "Design every state before writing any JSX." "Teams that design
happy-first ship demos that crumble on real data." Common mistake in Success: "Toast
that vanishes in 1s; user misses it." Norman: "focus ... attention on the cases where
things go wrong, not just on when things work as planned" [Norman] (S). Every
interactive component has default, hover, focus, active, disabled, loading and error
states [impeccable] (F).

**Empty kinds.** Each kind gets its own copy and one next action
[ui-craft][impeccable][Primer-empty][Atlassian-messages][NNg-empty] (F):

| Kind                           | Title says                                                                                   | Action                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| First use                      | What this place is for, welcoming                                                            | Start creating. Optionally "Learn more". A template or smart default beats a blank slate [AboutFace]               |
| Filtered or searched, no match | No results for these filters                                                                 | Clear filters, or widen the search. Never "create your first": "when they have 4,000 — reads as broken" [ui-craft] |
| Search no-results              | Offer "a fork, not a wall": spelling alternatives, popular queries, a wider scope [ui-craft] | —                                                                                                                  |
| Cleared (inbox zero)           | Done                                                                                         | Often none                                                                                                         |
| No permission                  | Who can grant access                                                                         | Request access                                                                                                     |
| Failed to load                 | What could not load                                                                          | Retry or get help. Muted alert icon, no playful art [Primer-empty]                                                 |

- NN/g: "Totally empty states cause confusion about how and whether the system is
  working"; "Provide direct pathways ... to getting started" [NNg-empty] (F). Give each
  empty state a status line, a learning cue, and the action that fills it.
- "Empty states that teach the interface." "An empty state distinguishes first use, no
  results, filters, permissions, and failure" [impeccable] (F).
- Filtered empty copy: "No results — try removing filters", with a clear-filters
  button [ui-craft] (F).
- "MUST give empty states one clear next action" [ibelick]. "Design
  empty/sparse/dense/error states" [Vercel] (F).
- "No dead ends; always offer next step/recovery" [Vercel] (F).
- **Part**: `UEmpty`. Override Table's "No data".

**Degraded, not empty.** From GitHub's availability guidance [Primer-degraded] (F):

- "Don't try to conceal or downplay that something is wrong."
- "If we know a user created something, don't show a generic 'empty state'". Say it is
  unavailable, or remove the whole section and its heading, or users think their data
  was deleted.
- Split each page into **primary** experiences (the page is useless without them; if
  they fail, render an error page) and **secondary** ones (counts, badges, side panels;
  if they fail, render the page without them or with a small inline error).
- Hide a count or badge whose data is missing; don't show "0".
- Keep a page to about 5 outage messages or fewer. More makes it feel broken, not
  degraded.
- Never hide the global navigation. Hide the single failed link.
- Don't remove critical buttons (Submit, the comment box). Remove only non-critical
  ones.
- Don't open a non-critical dialog or hovercard whose content failed; remove its
  trigger.
- A global banner for a system outage, plus in-context messages.
- On startup failure, show cached data and a quiet label [Apple-alerts] (F).

**Partial failure.** "Mark what failed with a per-tile error state, not a page-level
one" [ui-craft] (F).

**Tell failures apart.** "Distinguish offline from 500 from 403." Server errors carry a
copyable support ID and one-click retry. "Keep the in-flight state — don't throw away
the form the user just filled" [ui-craft] (F). Separate "not found" from "no permission"
[ui-craft] (F).

**Worst-case data** [break-ui] (F):

- "Plausible or schema-backed, never random." Worst-case values come from real naming
  patterns or the validation schema's limit; "If you find no limit, that's a finding."
- "Change the data, not the component": worst cases enter through the same fixture or
  prop as demo data.
- Cover empty, exactly one (pluralisation: "1 members"), and huge (1,000+ rows).
- The catalogue includes:
  - names (`Aleksandra Wiśniewska-Kowalczyk`, `Jo`, RTL, emoji-first);
  - unbreakable emails and URLs, and translated labels;
  - `0`, `1`, `-42.5`, `NaN`;
  - relative times ("switch to an absolute date after 7 days");
  - broken avatars, "every status at once", "The current user in the list";
  - touch: "Hover-only actions ... are unreachable".
- Truncation, chosen per field:
  - Wrap names and titles the user needs to identify something.
  - End-truncate secondary metadata, always with a way to see the full value.
  - Middle-truncate file names, emails, paths and hashes ("End-truncation makes them
    identical").
  - Clamp card previews.
  - "Never truncate numbers, amounts, dates, or anything the user compares."
- "Report before fixing", with "Decisions for you" for breaks that have more than one
  right answer.
- Layouts must survive "short, average, & very long content" [Vercel] (F).

### Forms and saving

**Save model** [Primer-saving][ui-craft] (F):

- Start with explicit saving. "Never mix save patterns in a single form", and avoid
  mixing them on one page.
- Declarative controls save explicitly: text inputs, checkbox groups, radio groups,
  native selects, multi-selects. Autosaving them sends half-typed or sensitive values,
  and applies a radio the moment a screen-reader user arrows through it.
- Imperative controls save automatically: switches, segmented controls, single-select
  menus outside a form. Give them no Save button.
- "checkbox = applies on submit; toggle = applies immediately" [ui-craft]. Declare the
  save model on every settings page. **Part**: `USwitch`, `UCheckbox`.
- One Save button per page. Allow one inline edit mode at a time.
- The Save button is primary when it saves the whole page, secondary when it saves one
  section.
- A menu with search, filters or tabs inside is a dialog. Give it Apply and Cancel.
- On a save error, keep the user's data in the form.
- Cooper: "Differentiate between command and configuration" [AboutFace] (S).

**What to ask** [AdamSilver][NNg-forms][Tidwell][Krug][WCAG-3.3.7][Wroblewski-deck]
(F/S):

- Run a question protocol: know why you ask every question. Remove what can be derived
  or collected later.
- Postpone questions you could ask later.
- Avoid optional fields. Otherwise mark the optional ones, because unmarked "many
  people feel obligated to answer optional questions" [NNg-cognitive-load] (F).
  **Part**: FormField `required` or `hint="Optional"`.
- Never ask again for what the user already gave in this flow. Re-asked information
  must be "auto-populated, or available for the user to select" [WCAG-3.3.7].
- "Don't start from zero": use what you know for smart defaults [Saffer][Wroblewski-deck]
  (S/F). Prefilled answers still cost a look [Tidwell] (F).
- Tell users before the form if they will need hard-to-find information ("you'll need
  your ID") [Wroblewski-deck][ui-craft] (F).

**Validation timing.** Disputed; see [Conflicts](#conflicts-and-how-the-skill-settles-them).

- Never validate on mount [ui-craft] (F).
- Wroblewski's study (22 participants) tested validating after the user leaves a field.
  Success went up 22%, errors down 22%, satisfaction up 31%, completion time down 42%,
  and fixations down 47%. Validating "before and while" typing had the most errors
  [Wroblewski-inline] (F).
- NN/g: "avoid showing an error until the user has finished with the field"
  [NNg-forms-errors] (F).
- **Handled**: Nuxt UI's default is first blur, then live with a 300 ms debounce.
- Use inline validation for "inputs that have potentially high error rates"
  [Wroblewski-deck] (F).
- On submit, "surface ALL errors at once" [ui-craft]. With 3 or more errors, show a
  summary that links to each field. Otherwise focus the first invalid field and scroll
  it into view [Primer-forms][Vercel] (F). **Part**: use `@error` to focus.
- After a failed submit, switching to inline validation is fine [Primer-forms] (F).
- "Never remove an error until the user changes the field" [ui-craft] (F).

**Errors and hints** [NNg-forms-errors][GOVUK-error][Primer-forms][ui-craft]
[Wroblewski-deck] (F):

- Put the error next to its field, never only in a banner or toast: "Inline, at the
  field. Not a toast, not a global banner" [ui-craft]. "Keeping error messages next to
  the fields in error minimizes working-memory load." A top summary must not be the only
  indicator. Vercel: "Errors inline next to fields; on submit, focus first error."
- Labels sit close to their own field: "Labels should be close to the fields"
  [NNg-forms]. "Elements in close proximity are perceived to share similar
  functionality" [LawsOfUX]. **Handled** inside FormField; page-level grouping is the
  agent's.
- State format rules up front: "Explain any input or formatting requirements", such as
  password rules [NNg-forms].
- **Handled** for client validation (state stays in `reactive`). **Agent** after a server
  error or a reload: restore what the user typed.
- Mark errors with text and an icon, not colour alone.
- Put format rules before typing, as a hint or description. "Hints are needed _while_
  typing — below the field they get covered by autofill menus and the mobile
  keyboard" [ui-craft]. **Part**: FormField `description`, `hint`, `help`.
- When an error shows, replace the hint instead of repeating it [Primer-forms].
- "Keep both passing and failing answers" [GOVUK-error]. "Preserve the user's input"
  [NNg-errors].
- "Avoid changing inputs provided by users", including after an error
  [Wroblewski-deck].
- Inline help first; "use tooltips as a last resort" [Vercel]. Help visible and next to
  the question is most useful [Wroblewski-deck].

**Never pre-disable submit** [Vercel][Primer-saving][GOVUK-button][ui-craft][AdamSilver]
(F):

- "Don't pre-disable submit. Allow submitting incomplete forms to surface validation
  feedback." "Keep submit enabled until request starts; then disable with spinner"
  [Vercel].
- GOV.UK: disabled buttons "can confuse some users, so avoid them if possible"
  [GOVUK-button]. NN/g: disabled buttons "confuse users by appearing clickable but
  providing no response"; if one is unavoidable, keep it focusable and explain why
  [NNg-disabled].
- "A disabled button can't say why it's disabled, gives no feedback when pressed, and
  is invisible to some assistive tech."
- Disable only in flight (**Handled** by `loading-auto`).

**Input** [Vercel][Postel][NNg-forms][AdamSilver][Wroblewski-deck] (F):

- Accept any format that keeps the meaning, and normalise it yourself: spaces in card
  numbers, phone formats, trailing spaces from text expansion. Postel: "Be liberal in
  what you accept". Krug: don't punish users for spaces in a card number or parentheses
  in a phone number [Krug] (S). "Trim values to handle text expansion trailing spaces"
  [Vercel].
- Ask only for what you need: "Remove fields which collect information that can be"
  derived or collected later [NNg-forms]. Krug lists "Asking me for information you
  don't really need" as a goodwill drain [Krug] (S).
- "Accept free text, validate after—don't block typing": "Blocking keystrokes entirely
  is confusing because the user gets no explanation."
- Don't use `maxlength` to cut input. "If the user enters too much information, tell
  them so they can fix it", or show the characters remaining [AdamSilver].
- Visible labels outside the field; never the placeholder as the label (seven failures,
  including memory strain) [NNg-placeholders] (S). Label about 3 words, sentence case
  [Primer-forms] (F).
- One column, ordered by importance, related fields together, typing fields together:
  "Present fields in a single column layout" [NNg-forms][Primer-forms] (F).
- Size a field to its expected value [Primer-forms][AdamSilver] (F).
- Enter submits; "in `<textarea>`, ⌘/Ctrl+Enter submits"; set `autocomplete` and input
  types [Vercel] (F). **Part**.

**Choice controls** [ui-craft][NuxtUI-skill][AdamSilver][Carbon-dialog] (F):

- "≤5 options: don't use a dropdown." Use `URadioGroup` or a segmented control.
- More options: `USelect`. Past about 10, or searchable: `USelectMenu` or `UInputMenu`.
- Select boxes are "a last resort" [AdamSilver].
- Bounded controls (radios, date pickers) prevent invalid data [Carbon-dialog][AboutFace].

**Conditional fields** [ui-craft][Wroblewski-deck] (F):

- "Don't hide a field the user has filled, even if the condition changes. Instead,
  disable it with a note."
- Keep the dependent input clearly tied to its trigger, without "jumping".

**Long forms and wizards** [ui-craft][AdamSilver][Carbon-dialog][Wroblewski-deck] (F):

- "State the cost upfront. '3 steps, about 2 minutes, you'll need your ID'".
- Start with one thing per page, then test whether grouping helps [AdamSilver].
- "Order steps easy → hard."
- Back keeps all state; resume at the last completed step.
- End with a review step with an Edit link per section ("Let users check their
  answers").
- The last Next button is named after the final action.
- Show progress and save on long forms.
- Past about 3 steps, use a page, not a modal.
- **Part**: `UStepper`.

**Actions** [Wroblewski-actions][Wroblewski-deck][Primer-saving][Carbon-dialog]
[NNg-forms] (F):

- Avoid secondary actions (Reset, Cancel, Go Back) on forms; avoid Reset and Clear.
- A Cancel styled as a link "helped prevent accidental (and catastrophic)
  cancellations".
- Page forms: submit at the bottom left, aligned with the inputs; Cancel to its right.
- Dialogs: bottom right, Cancel to the left of the primary.
- Comments: right-aligned under the textarea.
- Inline edit: Save right beside the input.

**Unsaved changes.** "Warn on unsaved changes before navigation" [Vercel][Primer-saving]
(F). Apple: warn on data loss that is "unexpected and irreversible" [Apple-feedback]
(F). **Part**: Modal `dismissible: false` plus `@close:prevent`. Primer notes the
browser's `beforeunload` message can't be customised.

### Destructive actions and dialogs

**Friction tiers.** Carbon's tiers match `ui-craft`'s [Carbon-actions][ui-craft] (F):

| Tier     | When                                                       | Pattern                                                                                       |
| -------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Low      | Trivial to undo or recreate                                | Act at once, offer Undo. "Friction here is rude."                                             |
| Moderate | Can't undo, or deletes several things                      | A dialog with verb buttons that names and counts the affected items and says what will happen |
| High     | Expensive to recreate, large amounts of data, or cascading | A dialog plus typing the resource name, or ticking a checkbox                                 |

- "A confirm on an undoable action trains the user to click through" [ui-craft] (F).
- "Never use a warning when you mean undo." "The more in-your-face the warning is, the
  faster we'll want to get away from it." Keep deleted items recoverable (a trash)
  [AzaRaskin] (F).
- Cooper: "Ask for forgiveness, not permission"; "Hide the ejector seat levers", so a
  user can never fire a destructive action while making a minor adjustment
  [AboutFace] (S).
- NN/g: "go to great lengths to provide undo"; "Do not use confirmation dialogs for
  routine actions"; "if you warn people too much, they stop paying attention"
  [NNg-confirm]. Make undo visible, not only a shortcut [NNg-control] (F).
- Apple: "Avoid displaying alerts for common, undoable actions, even when they're
  destructive" [Apple-alerts] (F).
- Norman: a better check is "a prominent display of both the action to be taken and
  the object" [Norman] (S).
- After a delete, return to the list, show the item leaving, and confirm. If the delete
  fails, say so and put the item back [Carbon-actions] (F).
- State whether, and for how long, an action can be undone [ui-craft] (F).
- Save confirmation for the last destructive moment; no confirm after every step
  [ui-craft] (F).
- Slow where the user is deciding, fast where the system responds: hold-to-delete about
  2 s, release about 200 ms [emil-design-eng] (F).

**Words** [NNg-confirm][Apple-alerts][Carbon-dialog][Atlassian-errors][ui-craft] (F):

- Confirm buttons say the outcome ("Delete file" / "Keep file"), never Yes/No or OK,
  and no default Yes [NNg-confirm]. "Confirmation buttons are verbs, never Yes/No"
  [ui-craft]. Apple: avoid OK unless the alert is purely informational
  [Apple-alerts].
- Name and count the affected items in a destructive confirmation: a "dialog with verb
  buttons + the affected items named" [ui-craft].
- The dialog title and the button name the same action.
- Cancel is always the safe exit and never the default.

**Prominence.** Destructive does not mean "big, red, and bold". Use a secondary or
tertiary style and save the red for the confirm step, where delete is the primary
action [RefactoringUI][ui-craft] (S/F). **Part**: `color="error"` variants.

**Remove vs Delete.** Remove takes an item out of a list without destroying it. Delete
destroys it. Don't swap the words [Carbon-actions] (F).

**Undo in a toast.** A toast with an action persists until dismissed [Carbon-notif]
(F). A vanishing message is fine only if "there is an alternative" without a timer
[WCAG-2.2.1] (F). Angular Material: avoid a duration on snackbars with an action
[Material] (S). In Nuxt UI, set `duration: 0` for undo toasts, or offer undo somewhere
else as well.

**When to use a dialog** [Carbon-dialog][NNg-modal][impeccable][AboutFace]
[Apple-alerts] (F/S):

- Vercel: "Confirm destructive actions or provide Undo window"; "Destructive actions
  need confirmation modal or undo window—never immediate" [Vercel]. "Prefer undo over
  confirmation when recovery is safe" [impeccable]. Undo costs more to build (deferred
  delete or restore) (I).
- "A modal is for decisions that interrupt for good reason" [ui-craft].
- Only for short tasks, decisions that block the work, or urgent information about the
  current work. Apple: no alert that is "informative, but not actionable"
  [Apple-alerts]. "Modal as first thought. Modals are usually laziness. Exhaust inline /
  progressive alternatives first" [impeccable].
- "Primary interactions belong in the primary window" [AboutFace].
- Only when the user started it. A background event is a toast, not a dialog. No
  unsolicited popups (NPS surveys), and no alert at app start.
- Not for "nonessential information", not inside checkout, not for multistep tasks
  [NNg-modal]. Past about 3 steps, use a page [ui-craft].
- Never one modal from another. If step one needs a confirm modal, step one should not
  be a modal.
- Never as a full page. If it needs more room than the large size, make it a page.
- Not when the user must consult page content to decide; use a non-modal panel
  (`USlideover`) or a page.
- Inside a dialog, avoid tabs, accordions, data tables and links that lead away.
- One primary action per dialog.
- Repeated inspect or edit work goes in a slideover or inline, not a modal
  [ui-craft][NuxtUI-skill].
- Give every dialog a visible close, an explicit Cancel, overlay click and Escape
  [ui-craft] (F). The first three are **Handled**; the Cancel button is the agent's.
- Validate before closing. An invalid field keeps the dialog open with an inline error
  [Carbon-dialog].
- Disable interactions on exiting elements [ui-craft] (F).

### Layout, hierarchy and navigation

**Hierarchy:**

- Design the feature first, the shell last. "Start with a feature, not a layout":
  "start with a piece of actual functionality". Don't design every feature before
  building; "Work in cycles" [RefactoringUI] (S). Agents tend to scaffold a dashboard
  shell before knowing what the page does (I).
- Name the one task, its verb ("Grade these submissions. Find the broken deployment"),
  and the focal element before building. "One focal point per view"
  [interface-design] (F). Squint test: "One thing should dominate" [ui-craft] (F).
- "Most pages only have one true primary action, a couple of less important secondary
  actions, and a few seldom used tertiary actions" [RefactoringUI] (S). Emphasis works
  only when it is rare: "too many highlighted elements compete" (Von Restorff)
  [LawsOfUX] (F). "If the 'save' button looks different in two
  places, one is wrong" [impeccable] (F).
- "De-emphasize to emphasize": quiet the competitors instead of shouting louder
  [RefactoringUI] (S).
- Group with spacing first. Add a card or divider only when spacing doesn't read as a
  group. "Use spacing before structure" [ui-craft]; "Don't overuse `UCard`"
  [NuxtUI-skill]; containers are the strongest cue, so use them sparingly
  [PracticalUI] (F).
- Elements that look alike must work alike, and things that work differently must look
  different [PracticalUI] (F).
- Keep related actions close to the element they act on [PracticalUI][LawsOfUX] (F).
- Visual structure is information: outlines, numbering, dividers and labels "encode
  useful information about the content rather than decorate it" [frontend-design] (F).
- Put the critical item first or last, never in the middle (serial position)
  [ui-craft] (F).
- Put key content top and left; front-load every heading and label. Without strong
  cues users "may skip important content simply because it appears on the right side"
  [NNg-F] (F). Readers attend to the first few words of headings and list items
  ("Headings Are Pick-Up Lines") [NNg-read] (S).
- Group related content into distinct chunks so users can spot what matches their goal
  (chunking) [LawsOfUX] (F).
- "Labels are a last resort": let a value carry its own label where the format is
  obvious ("12 left in stock" over "In stock: 12"), except on spec sheets
  [RefactoringUI] (S).
- "Separate visual hierarchy from document hierarchy": a section title often works as a
  label, not a headline [RefactoringUI] (S).
- Keep everything a decision needs on one screen. Named violations: "The Memory Bridge:
  user must remember info from step 1 to complete step 3"; "The Context Switch: user
  must jump between screens/tabs/modals to gather info for a single decision"
  [impeccable] (F).
- "Contextualize information" [AboutFace] (S). "A number on screen is not design. What
  does it _mean_ to the person looking?" [interface-design] (F).
- Product screens load into the task: "No orchestrated page-load sequences. Product
  loads into a task" [impeccable] (F).
- Reduce distractions: no animated banners or popups pulling attention from the task
  [PracticalUI] (F).

**Progressive disclosure** [NNg-disclosure][Primer-disclosure][LawsOfUX][Krug]
[Wroblewski-deck] (F):

- Show frequent options up front and defer the rest. It "improves 3 of usability's 5
  components"; "designs that go beyond 2 disclosure levels typically have low
  usability".
- Hick's law: decision time grows with the number and complexity of choices. Highlight
  a small set of recommended items [PracticalUI].
- Use disclosure sparingly; keep the user's place when something expands; pair the
  expand icon with text.
- It works best when the user starts it, mapped to prioritised needs.
- Show only the relevant follow-up questions after a first choice (Krug's New York
  Times example).
- Tabs fail when "users must compare information across tabs". Put the most used tab
  first and selected [NNg-tabs] (F). **Part**: Tabs handles selection and keyboard.
- "Design for the probable; provide for the possible" [AboutFace] (S).

**Navigation** [NNg-hamburger][NNg-mobile-nav][NNg-youarehere][Vercel][ui-craft]
[interface-design][Wroblewski-obvious] (F):

- "Navigation _is_ the product — where you are, where you can go, what matters. A page
  floating in space is a component demo, not software" [interface-design].
- Keep primary navigation visible on desktop. Hidden navigation cut discoverability by
  more than 20% and made tasks at least 39% slower: "Do not use hidden navigation ...
  in desktop user interfaces." On mobile, visible or combined navigation was used more
  (89% vs 44% in one pair). Moving to a tab bar raised engagement at Facebook and
  Redbooth.
- Show where the user is: "Navigation should not only show where you can go but also
  where you are now" (**Handled** by route styles). Use breadcrumbs and step counts
  (**Part**).
- Put filters, tabs, pagination and open panels in the URL "so share, refresh,
  Back/Forward navigation work". "Back/Forward restores scroll position."
- A detail view has "A way back that preserves the list", with filters, sort and page
  intact.
- Use links for navigation and buttons for actions (`UButton` with `to` renders a
  link). Never break Back: "Never stop users from leaving your site by disabling the
  browser Back button" [NNg-control][Tidwell].
- Don't lock users into a screen with no way to the rest of the app; people change
  goals midway [Tidwell] (F).
- Name categories so they make sense alone and next to their siblings
  [NNg-top10] (F).
- Explain an unavailable destination instead of hiding it silently [ui-ux-pro-max]
  (F). Hide only what the user has no permission for [Carbon-disabled] (F).
- Jakob's law: users expect your app to work like the ones they already know
  [LawsOfUX] (F).

**Filters, search and bulk actions** [Carbon-filter][ui-craft][Vercel][NNg-top10] (F):

- Put high-frequency filters next to the data they scope.
- Show active filters outside the filter panel, each removable.
- When filters live in a drawer or menu, its closed trigger shows how many are applied
  and lets the user clear them without opening it.
- Give each category a clear, plus one "clear all".
- Use instant updates for a single category. Use batch with "Apply filters" for many
  categories or slow data.
- Never put multiple filter categories inside one dropdown.
- "Simply adding facets and filters does not ensure better usability."
- Exports and bulk actions state their scope ("Export 24 filtered rows").
- "Masked values are still identifiable" (the last 4 characters of an API key)
  [ui-craft].

**Power users** [Linear-menus][NNg-uicopy][ui-craft][impeccable][Tidwell] (F):

- A keyboard path to every frequent action: "almost every action ... without lifting
  your fingers off of the keyboard".
- Show shortcuts next to the command; never reassign standard ones.
- Reduce a repeated operation to one action (streamlined repetition).
- **Part**: `defineShortcuts`, CommandPalette, Kbd.

**Feature onboarding** [Primer-onboarding][AboutFace] (F/S):

- Put the onboarding element where the feature will live for good, sized to its weight
  on the page. Never derail the main task.
- At most 2 alerts at once, one teaching popover at a time, about 160 characters.
- Make dismissal obvious and respect it; cap impressions and campaign length.
- Don't point at hidden elements. Open "Learn more" links in a new tab so work isn't
  lost.
- Prefer empty states as the onboarding surface.
- "Don't weld on training wheels" [AboutFace].

**Completeness checklists per archetype** [ui-craft] (F). Each archetype gets a checklist
in `ui-craft`'s `coverage.md`: data table, settings, search, detail view, first-run,
billing, checkout, onboarding, destructive confirm, invite. Examples:

- "Export that states its own scope".
- "A declared save model".
- "Not-found separated from no-permission".

Add archetypes as the app grows.

### Copy

**Labels and actions** [NNg-uicopy][Vercel][Primer-saving][Atlassian-errors]
[frontend-design][Podmajersky][Tidwell] (F/S):

- "Lead with verbs ... that clearly outline what will happen", in 2 to 4 words,
  sentence case: "Save API key", "Add SSH key". Not Submit, OK, Continue or Done.
- Add the object when it is unclear what changes.
- "Specific button labels: 'Save API Key' not 'Continue'" [Vercel]. "A CTA says
  exactly what happens when it is used: 'Save changes,' not 'Submit'"
  [frontend-design].
- Name things in the user's words: "A user manages notifications, not webhook config."
- Write labels so the user's first guess is correct [Tidwell].
- End labels that open more input with an ellipsis ("Rename…"), and in-progress labels
  too ("Saving…") [Vercel][NNg-uicopy].
- More descriptive than "Read more" [Yifrah] (S).

**Same name through the flow** [ui-craft][frontend-design] (F). "An action keeps its
name through the whole flow. The button that says 'Publish' produces a toast that says
'Published'"; "An action keeps the same name through the whole flow."
"Keep nouns consistent" [Vercel]. One word per concept: "Introduce as
few unique terms as possible" [Vercel]. Users "should not have to wonder whether
different words ... mean the same thing" [NNg-heuristics]. "grep the codebase for every
verb on every button" [ui-craft]. Add, Remove, Delete, Clear, Reset and Cancel each have
one meaning [Carbon-actions].

**Errors** [NNg-errors][GOVUK-error][Atlassian-errors][Primer-empty][ui-craft][Vercel]
(F):

- Say what happened, why, and what to do: "what happened + why + what to do"
  [ui-craft]; "human-readable", "precisely describe", "constructive advice"
  [NNg-errors]; "Error messages include fix/next step, not just problem" [Vercel].
- First sentence: the most likely cause or simplest fix. Second: a backup.
- "If you don't know the reason for an error, don't make one up – just say that
  something's gone wrong."
- No "please", "sorry", "oops", "invalid", "illegal", "valid" or blame. "Enter your
  first name", not "First name must have an entry"; tested in live services, users
  "knew how to fix the problem".
- Example: "Your API key is incorrect or expired. Generate a new key in your account
  settings."
- No obscure codes in the message, and no literal infrastructure ("The US East-2
  database cluster…" makes users feel dumb).
- One or two sentences; two lines on form fields.
- "Errors don't apologize, and they are never vague about what happened"
  [frontend-design].

**Success** [Atlassian-success][ui-craft] (F):

- Say what happened and link to the created thing ("View your new space").
- No "Success!", no "successfully", no exclamation marks.
- Tone "Restrained". The more often it appears, the shorter and plainer it is.

**Message hierarchy per state** [impeccable] (F):

- Decide "the one fact the user needs now; the action available next; supporting
  context that changes the decision; the appropriate tone".
- "If the heading already explains the state, the introduction should add new
  information or disappear."
- "Let each written element do exactly one job" [frontend-design].
- "Loading text names the real operation ... never invent progress" [impeccable].

**Loading and waits** [Apple-progress][impeccable][ui-craft][Podmajersky] (F/S):

- Name the real operation; never invent progress.
- Give an honest duration for long waits ("Usually 20-40 seconds").
- Transitional text uses the present continuous ("Saving…").

**Empty states** [Primer-empty][NNg-empty][Yifrah] (F/S):

- A title that states the purpose or the problem.
- A line on what to do next, not repeating the title.
- One primary action.
- Don't rely on an image or a clever phrase alone.

**Cut words** [NNg-read][Krug][NNg-basics] (F/S):

- Concise text tested 58% better, scannable 47%, and both plus objective 124%.
- "Get rid of half the words on each page, then get rid of half of what's left."
- Happy talk and instructions "must die".

**Tone table** [ui-craft] (F):

- Success: "Restrained".
- Destructive: "Explicit about consequences".
- Waiting: "Honest about duration".

**No dark patterns** [ui-craft] (F): no confirmshaming, no roach motel, no pre-checked
opt-ins.

**Don't put copy under a confirm button**, where a screen reader may never reach it
[Yifrah] (S).

**Text patterns to cover** [Podmajersky] (S): titles, buttons and menus, descriptions,
empty states, labels, controls, text inputs, transitional text, confirmations,
notifications, errors. Use patterns as a place to start.

### Motion

Short, because Nuxt UI owns component motion [Kowalski-anim][Vercel][NNg-anim][ui-craft]
[emil-design-eng][Rauno][NNg-micro] (F):

- Animate only to explain a change: "Only animate when it clarifies cause & effect";
  ask "what's the purpose of this animation?" For a functional banking graph, "no
  animation would be better" [Kowalski-good-great].
- Valid purposes: spatial consistency, state indication, explanation, feedback,
  "Preventing jarring changes" [emil-design-eng].
- "Motion that answers a person's action (opening, expanding, confirming) is welcome
  when it shows what changed" [frontend-design].
- Microinteraction motion stays subtle and brief, and never "brutally yank[s] the
  user's attention away from the primary task" [NNg-micro].
- Never animate keyboard-initiated actions. For frequent actions, "100+ times/day ...
  **None. Ever.**"; repeated animation becomes "cognitive burden after seeing the same
  animation for the hundredth time" [ui-craft][Kowalski-anim].
- Keep UI motion "under `300ms`" [Kowalski-anim]. NN/g: about 100 ms for small feedback,
  200 to 300 ms for a modal; "At 500ms, animations start to feel like a real drag"
  [NNg-anim]. **Handled** for built-in components (Tooltip animates in 100 ms).
- Make motion interruptible and start it from its trigger [Vercel][Kowalski-great]
  [Rauno]. **Handled** for Nuxt UI overlays.
- "Never block interaction while a stagger plays." No page-load choreography on app
  screens [ui-craft][impeccable].
- Add no animation unless it is asked for [ibelick].
- Reduced motion means "fewer and gentler animations, not zero. Keep opacity and color
  transitions that aid comprehension" [emil-design-eng]. Loading spinners keep turning,
  subtly [Primer-loading]. **Handled** for overlays and Progress; **Agent** for custom
  motion.

### Accessibility behaviour

Behaviour only. Nuxt UI's Reka primitives handle ARIA and keyboard for their own
components [NuxtUI-src][Reka] (F):

- Every flow works by keyboard, with visible focus that nothing covers [Vercel][APG-kbd]
  (F). **Handled** for Nuxt UI components; **Agent** for custom ones.
- Don't rebuild keyboard or focus behaviour by hand unless asked [ibelick] (F).
- Don't add ARIA when native semantics already solve the problem [ibelick] (F).
- Dialog focus: inside on open (the first input); for irreversible actions, the least
  destructive button; back to the trigger on close [APG-dialog][Carbon-dialog] (F).
  **Part** (the initial focus is the agent's).
- When the focused element disappears, move focus deliberately; otherwise "Browsers
  move focus to the body element" [APG-kbd] (F). After deleting a row, focus the next
  row or the list (I).
- When new content loads on request, focus its first focusable element
  [Primer-loading] (F).
- After a route change, move focus to the main region [ui-ux-pro-max] (F).
- Announce async results without moving focus. WCAG 4.1.3 status messages ("5 results
  returned", "Saved") use `role="status"` or `aria-live`. The status element must exist
  before the message goes in. Announce filter results as counts [WCAG-4.1.3]
  [Primer-loading] (F). **Handled** for toasts; **Agent** for inline status.
- Set `aria-busy` on a live region while it fills [Primer-loading] (F).
- Don't over-announce: a cluster of loaders should not produce a burst of announcements
  [Primer-loading] (F).
- Don't use live regions for form validation; use focus management on submit
  [Primer-forms] (F). This conflicts with Vercel; see
  [Conflicts](#conflicts-and-how-the-skill-settles-them).
- Disabled, read-only and hidden are different [Carbon-disabled][Carbon-readonly] (F):
  - Disabled means "not yet". It can't be focused or read, so never use it for data the
    user must read.
  - Read-only stays focusable and readable, with no interactive cues.
  - Hidden is for no permission only.
  - A disabled item that blocks the main flow gets an inline note on how to enable it.
  - Distinguish read-only from disabled [ui-ux-pro-max].
- Never disable a control because of an outage [Primer-degraded] (F).
- Keep disabled menu items discoverable; `aria-disabled` keeps a button focusable
  [APG-kbd][NNg-buttons] (F).
- Disabled submit actions must explain why [ibelick] (F).
- Tooltips only on focusable elements, so never on a disabled button [Primer-degraded]
  (F). "Delay first tooltip; subsequent peers instant" [Vercel] (F).
- Icon-only buttons get an accessible name (`aria-label`); prefer a visible label
  [Vercel][ibelick][ui-craft] (F).
- Every hover-only action has a keyboard and touch path [break-ui][ibelick][Vercel] (F).
- Hit targets at least 24 px, 44 px on touch [Vercel][LawsOfUX] (F). **Handled** at
  default sizes (I).
- Timed toasts never carry critical information. "toasts must not be the only way to
  convey critical information" [ibelick][Carbon-notif][WCAG-2.2.1] (F).
- Let users limit non-critical notifications [Carbon-notif] (F).

### Process and review

**Before building** [impeccable][interface-design][ux-discovery][frontend-design] (F):

- Write a 3 to 5 line brief:
  - who arrives and in what state of mind ("What did they do 5 minutes ago, what will
    they do 5 minutes after?");
  - the one task (the verb);
  - which states matter;
  - realistic content ranges ("realistic minimum, typical, and maximum");
  - "What must remain untouched?"
- Ask 2 or 3 related questions per round, then wait, only when the answer changes the
  build. "Do not dump a questionnaire ... Assert the likely reading and invite
  correction." "If context allows a responsible assumption, state it briefly and
  proceed."
- "If the prompt is too vague ... ask one concise question. If context allows a
  responsible assumption, state it briefly and proceed" [interface-design]. A
  discovery interview asks "3 to 5 high-leverage questions" at once [ux-discovery];
  impeccable asks two or three per round. Fewer is better when the build is small (I).
- Ask about users, context, goals and current behaviour before features
  [ux-discovery].
- Restate the idea in 1 to 3 sentences. Label each point Known, Inferred or Unknown. On
  new input, say "What changed" and "What stays the same" [ux-discovery].
- Map the journey: "trigger → discover options → start task → complete key actions →
  confirm result → handle failure or follow-up" [ux-discovery].
- Choose the mode from the surface. Operate (app UI) means "Scanability, consistency,
  native expectations, and the real usage scene outrank expression"; "The tool should
  disappear into the task" [impeccable].
- Plan, then review the plan against the brief. Revise any part that reads like "the
  generic default you would produce for any similar page" [frontend-design].

**While building:**

- Use what exists. "The most common way AI degrades a codebase: it hand-rolls what
  already exists." Ladder: native element, then an accessible primitive (here, Nuxt
  UI), then hand-roll only as a last resort, with the full keyboard and focus contract
  [interface-design] (F).
- Rely on the component's built-in loading and error patterns before designing your own
  [Primer-loading] (F).
- States first, then the happy path [ui-craft] (F).
- Check against the archetype's completeness list [ui-craft] (F).
- Use worst-case fixtures behind a dev-only "Demo data / Worst case" toggle [break-ui]
  (F).
- Critique your own work with screenshots while building [frontend-design] (F).

**Review** [cognitive-walkthrough][ui-craft][ibelick][interface-design][impeccable] (F):

- Walk the main task step by step and ask four questions at each step:
  - "Will users try to achieve the right effect?"
  - "Will users notice that the correct action is available?"
  - "Will users associate the correct action with the effect they're trying to
    achieve?"
  - "If the correct action is performed, will users see that progress is being made?"

  The fourth is the owner's feedback rule seen from the review side.

- Persona walk-throughs: power user, first-timer, screen-reader user, stress tester.
  Red flags include "Redundant confirmation steps for low-risk actions" and "No
  confirmation that an action succeeded" [impeccable].
- Judge Value, then Ease of Use, then Delight. "Do not include Delight findings in a
  report where Value is failing — it dilutes the signal" [ui-craft].
- A finding needs three proofs: a binding contract (the rule), proof it reaches the
  rendered surface at runtime, and exactly one correction. "Shared names, similar
  tokens, repository proximity, and conceptual relationships do not establish a
  connection" [ibelick][ui-craft].
- Try to disprove each finding, and report "roughly the top 3-5" [ui-craft].
- "If you can't say _why a finding costs the user or makes the UI read as generated_,
  it's taste — cut it" [interface-design].
- Compare alternatives by interaction cost [NNg-interaction-cost].
- Run deterministic checks and design judgment in isolated contexts, so tool output
  doesn't anchor judgment. A degraded single-context run says so in its first line
  [impeccable].
- Verify in the browser at real widths with worst-case data before calling it done
  [break-ui][impeccable][interface-design].

## Notes per source

What each source does well, what we took, and what we dropped. Its rules are already
under [Rules by topic](#rules-by-topic).

### Agent skills

- **Vercel Web Interface Guidelines** [Vercel]. The skill is a thin fetcher that
  reviews against `command.md` and reports terse `file:line` findings. The guidelines
  come as `README.md` (with reasons), `AGENTS.md` (MUST/SHOULD/NEVER) and `command.md`
  (a checklist).
  - _Good:_ dense, testable interaction rules, each checkable in code.
  - _Lines taken, verbatim_ (the topics above quote some in context):
    - "Loading buttons show spinner and keep original label".
    - "Keep submit enabled until submission starts".
    - "If you show a spinner/skeleton, add a short show-delay (~150–300 ms) & a minimum
      visible time (~300–500 ms) to avoid flicker on fast responses."
    - "Optimistic UI; reconcile on response; on failure rollback or offer Undo."
    - "Require confirmation or provide Undo with a safe window".
    - "URL reflects state (deep-link filters/tabs/pagination/expanded panels)"; "Persist
      state in the URL so share, refresh, Back/Forward navigation work"; "Back/Forward
      restores prior scroll"; "Links are links".
    - "No dead ends. Every screen offers a next step or recovery path." "All states
      designed."
    - "Inline help first; tooltips last resort."
    - "Enter submits focused input; in `<textarea>`, ⌘/Ctrl+Enter submits."
    - "Ellipsis (`…`) for options opening follow-ups ('Rename…') and loading states
      ('Loading…')."
    - "Mutations (`POST`/`PATCH`/`DELETE`) target <500ms."
    - "Keep nouns consistent. Introduce as few unique terms as possible."
  - _Dropped:_ typography (curly quotes, `text-wrap`, tabular numbers), images, fonts,
    dark mode, shadows, hydration and performance tuning. Also dropped: copy rules the
    README flags as brand choices ("These preferences reflect Vercel's brand & product
    choices. They aren't universal guidelines"), such as Title Case and `&`. Most
    focus-ring, ARIA and keyboard rules are covered by Reka.
- **ui-craft** [ui-craft]. The interaction and content rules live in the reference
  files (`forms`, `state-design`, `components`, `copy`, `coverage`, `layout`, `motion`,
  `review`), not in `SKILL.md`.
  - _Good:_ every rule carries a "Why" or a "Cost if absent". It has the best review
    method of any source.
  - _Dropped:_ the accent budget, colour, typography, themes, tokens, hero and landing
    recipes, sound, MCP and CLI tooling, the 0-100 score, and "signature detail". Nuxt
    UI apps want familiarity, not visual distinctiveness.
  - _Lines taken, verbatim:_ friction tiers "act immediately + undo toast. Friction here
    is rude", a "dialog with verb buttons + the affected items named", and "type the
    resource name or tick a checkbox". "A filtered-empty screen telling the user to
    create their first record, when they have 4,000 — reads as broken." "Honest about
    duration: 'Usually 20-40 seconds.'"
  - _Not yet read in depth:_ `dashboard.md`, `ai-chat.md`.
- **impeccable** [impeccable]. A command suite around a project `PRODUCT.md` and
  `DESIGN.md`, with a detector binary and live browser mode.
  - _Good:_ modes by surface (Persuade, Operate, Read, Experience), the shape interview
    cadence, message hierarchy, and named cognitive-load violations.
  - _Lines taken, verbatim:_ "Choose the mode from the requested surface, not the
    product." "The bar is earned familiarity. The tool should disappear into the task."
    "Ask two or three related questions per round, then wait." The shape interview's
    rounds:
    - Round 1: purpose, who arrives and in what state of mind, the primary thing to do.
    - Round 2: real content ranges, which states matter, what must remain untouched.
    - Then a brief of three to five bullets.
  - _Dropped:_ visual worlds, comps, the craft floor's typography and shadow checks, the
    detector, `harden.md` (a generic checklist), and native iOS and Android. It cites
    Cowan's limit of about 4 items in working memory.
- **break-ui** [break-ui]. Renders the component with worst-case data and reports what
  breaks. The only source that makes the agent test the content it renders.
  - _Dropped:_ the CSS fix table. Nuxt UI and Tailwind utilities cover it, though the
    agent still applies `truncate` or `line-clamp` to its own text.
- **emil-design-eng** [emil-design-eng]. Almost all CSS animation craft, which Nuxt UI
  ships. _Lines taken, verbatim:_ "Never animate keyboard-initiated actions"; "Handle
  edge cases invisibly. Pause toast timers when the tab is hidden." Kowalski on
  frequent actions: "You should _never_ animate them" [Kowalski-anim].
  - _Dropped:_ easing curves, springs, clip-path, transforms, performance notes.
- **frontend-design** [frontend-design]. Mostly visual direction; its Writing,
  Structure, Motion and Process sections survive. _Lines taken, verbatim:_ "Name things
  by what users will understand ... A user manages notifications, not webhook config."
  Plan, then "review that plan against the brief before building: if any part of it
  reads like the generic default you would produce for any similar page ... revise
  that part, say what you changed and why."
  - _Dropped:_ palette, typefaces, the list of AI-default looks, CSS specificity.
- **interface-design** [interface-design]. Scoped to dashboards, admin panels and SaaS
  tools, which fits Nuxt UI apps.
  - _Good:_ intent first, navigation as product, use-what-exists, the taste filter.
  - _Lines taken, verbatim:_ "Who is this human? ... What did they do 5 minutes ago,
    what will they do 5 minutes after?" "What must they accomplish? The verb. Grade
    these submissions. Find the broken deployment. ... The answer determines what leads,
    what follows, what hides." "One focal point per view ... Before building, name the
    focal element out loud." "Data feels like presentation. But a number on screen is
    not design. What does it _mean_ to the person looking?"
  - _Dropped:_ domain exploration for palettes, token naming, depth, type scales, and
    the swap and token tests.
- **ux-discovery-interviewer** [ux-discovery]. A discovery interview that stops before
  solutions. _Lines taken, verbatim:_ "Ask 3 to 5 high-leverage questions"; "prioritize
  questions about users, context, goals, and current behavior before asking about
  features".
  - _Dropped:_ the summary document and the refusal to spec. Our skill builds UI, so it
    needs the questions, not the deliverable.
- **cognitive-walkthrough** [cognitive-walkthrough].
  - _Kept:_ the four questions.
  - _Dropped:_ the time-boxed procedure, report templates, and the rest of the repo.
- **ibelick ui-skills** [ibelick]. _Kept:_ the three-proof gate and the behaviour lines.
  _Lines taken, verbatim:_ "NEVER add animation unless it is explicitly requested";
  "NEVER rebuild keyboard or focus behavior by hand unless explicitly requested"; "do
  not add aria when native semantics already solve the problem"; "restore focus to the
  trigger on close". `improve-ui` stops at three findings.
  - _Dropped:_ Tailwind, `motion/react`, Base UI and z-index rules.
  - _Not taken as written:_ `baseline-ui`'s "MUST use an `AlertDialog` for destructive
    or irreversible actions", which conflicts with undo-first.
- **Nuxt UI official skill** [NuxtUI-skill]. Not a UX skill, but the one ours loads
  beside. See [The boundary with Nuxt UI](#the-boundary-with-nuxt-ui).
- **ui-ux-pro-max** [ui-ux-pro-max]. A search tool over CSV data, mostly styles,
  palettes and fonts. Its 120 UX guidelines are one-liners ("Use skeleton screens or
  spinners"), and some contradict stronger sources ("Auto-dismiss toasts in 3-5s").
  - Its `stacks/nuxt-ui.csv` is a fair API cheat sheet but adds no UX.
  - Three lines harvested: "Read-only state should be visually and semantically
    different from disabled"; "After page transition, move focus to main content region
    for screen reader users"; "When a nav destination is unavailable, explain why
    instead of silently hiding it."

### Design systems

- **Primer** [Primer-*]. GitHub's patterns are behaviour-first and assume a component
  library. They are the best direct fit.
  - _Good:_ the saving model, the success and error flowcharts, degraded experiences,
    and the loading lifecycle.
  - _Dropped:_ Octocat illustrations, release-stage labels, and icon and colour tokens.
  - Primer warns that github.com toasts have accessibility issues, so it avoids them.
- **Carbon** [Carbon-*].
  - _Good:_ the task-generated vs system-generated split, the dialog rules, friction
    tiers for delete, and disabled vs read-only vs hidden.
  - _Dropped:_ opacity values, button widths, and visual specs.
- **Atlassian** [Atlassian-*].
  - _Good:_ error and success writing rules, and delight scaled to frequency.
  - _Counterpoint:_ it uses flags (toasts) to confirm completed tasks.
- **GOV.UK** [GOVUK-*].
  - _Good:_ error wording tested in live services, and the case against disabled
    buttons and early validation.
- **Apple HIG** [Apple-*].
  - _Good:_ status near the item, determinate progress, no alerts for undoable actions,
    and "show something as soon as possible".

### Books

- **Refactoring UI** [RefactoringUI]. Mostly visual. Only "Starting from Scratch" and
  "Hierarchy is Everything" apply to us. Chapter titles read from the official site
  (F); content from reader summaries (S).
- **Don't Make Me Think** [Krug]. Krug's own free chapter (Chapter 4, "Animal,
  Vegetable, or Mineral?") gives the second law and "brief, timely, unavoidable" (F).
  Scanning, satisficing, muddling through, "omit needless words" and the reservoir of
  goodwill come from summaries (S).
- **The Design of Everyday Things** [Norman]. Norman's own essay supplies signifiers:
  "Forget affordances: what people need, and what design must provide, are signifiers"
  (F). Feedback, slips vs mistakes, design for error, forcing functions and "Never make
  people start over" come from book notes that quote the text (S).
- **About Face** [AboutFace]. Principles from Chapter 10, "Orchestration and Flow" (S):
  - "Avoid unnecessary reporting".
  - "Don't use dialogs to report normalcy".
  - "Avoid blank slates".
  - "Ask for forgiveness, not permission".
  - "Provide choices; don't ask questions".
  - "Hide the ejector seat levers".
  - "Eliminate excise wherever possible".
  - "Don't make the user feel stupid".
  - "No matter how cool your interface is, less of it would be better".
  - Undo lets users explore without fear.
  - Remember user choices.
  - Consider modeless side panels instead of dialogs.
- **Designing Interfaces** [Tidwell]. The O'Reilly preview has the full "What Users Do"
  text for the first behaviour patterns (F). The rest are summaries (S). The pattern
  chapters (Forgiving Format, Good Defaults, Multi-Level Undo, Cancelability and
  others) were not reachable; a future pass should read them.
- **Microinteractions** [Saffer]. The O'Reilly preview gives the model and the
  principle names (F):
  - Model: trigger, rules, feedback, loops and modes.
  - Bring the Data Forward; Don't Start from Zero; Absorb Complexity; Limited Options
    and Smart Defaults; Preventing Errors.
  - Feedback Illuminates the Rules; Feedback Is for Humans; Less Is More; Think Human;
    Use What Is Often Overlooked.
  - Spring-loaded and one-off modes; long loops.

  Meanings come from summaries (S). "Bring the Data Forward" means showing key data on
  the trigger itself. "Use What Is Often Overlooked" means feeding back through elements
  already on screen.

- **Form Design Patterns** [AdamSilver]. From the author's articles (F):
  - question protocol;
  - one thing per page;
  - validate on submit; "the problem with live validation" lists nine harms;
  - don't disable the submit button;
  - mark optional fields, or avoid them;
  - select boxes as a last resort;
  - no `maxlength`;
  - let users check their answers.

  He also says "Don't show errors below the input"; we didn't read his reasons (see
  Conflicts).

- **Web Form Design** [Wroblewski-deck]. The author's deck (F):
  - remove unnecessary inputs; flexible input; smart defaults;
  - a clear path to completion; show progress and save on long forms;
  - avoid secondary actions;
  - help visible and adjacent;
  - inline validation for high-error inputs;
  - errors at the top plus at the field, "Double" the visual language;
  - disable submit after click;
  - success "in context of data submitted";
  - never change what the user typed;
  - warn about hard-to-find information beforehand.
- **Practical UI** [PracticalUI]. The free preview (F): minimise interaction cost (keep
  related actions close, reduce distractions, minimise choice), group related elements
  (containers are the strongest and noisiest cue), and similar-looking elements must
  work alike. The other 100+ guidelines are behind the paywall.
- **100 Things** [Weinschenk]. Only the contents of Pearson's sample were usable (F).
  Item titles we lean on:
  - "People can miss changes in their visual fields".
  - "People habituate to information".
  - "People remember only four items at once".
  - "It's easier to recognize information than recall it".
  - "People will look for shortcuts only if the shortcuts are easy".
  - "People make errors when they are under stress".
  - "People want what is familiar when they're sad or scared".
  - "People use 'look and feel' as their first indicator of trust".

  Rejected items: "Variable rewards are powerful" and "Unpredictability keeps people
  searching", which are engagement manipulation.

- **Designing with the Mind in Mind** [Johnson]. Chapter titles (S): perception biased
  by expectation; seeking visual structure; limited attention and imperfect memory;
  "Recognition is Easy; Recall is Hard"; "We Have Time Requirements". The time chapter
  is worth a future read for its response deadlines.
- **Designing for Emotion** [Walter]. The hierarchy (functional, reliable, usable,
  pleasurable) through NN/g's article (F). "Designers creating interfaces that are just
  usable is like a chef creating food that's just edible" (S).
- **The Elements of User Experience** [Garrett]. The author's diagram (F). Used for the
  boundary framing.
- **The Humane Interface** [Raskin]. Habituation, modes and monotony (S). Its
  confirmation argument is carried by Aza Raskin's article (F).
- **Strategic Writing for UX** [Podmajersky]. Voice chart (concepts, vocabulary,
  verbosity, syntax, punctuation, capitalisation) and the text-pattern list (S).
- **Microcopy: The Complete Guide** [Yifrah]. Structure and the author's accessibility
  article (S).

## Conflicts and how the skill settles them

| Conflict                       | Sources                                                                                                                                                                                                                                                                                             | Settle as                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toast for action feedback      | For: Nuxt UI skill, Atlassian flags for completed tasks, Material snackbars with Undo, Nuxt UI's coming `toast.promise()`. Against: NN/g ("a bad way to implement an error message"; a user waited 5 minutes after missing a toast that faded in 5 s), Carbon, Primer, Wroblewski, Saffer           | In place for task-generated feedback; toast for system-generated feedback and for carrying Undo. (I)                                               |
| When to validate               | On blur: Wroblewski (data), NN/g, Carbon, Nuxt UI's default. On submit only: GOV.UK ("Do not validate when the user moves away from a field", because early validation hurts "users who type more slowly"), Adam Silver (nine harms of live validation), Primer (inline only after a failed submit) | Keep Nuxt UI's default for short app forms. For long or high-stakes forms, validate on submit only, then inline after the first failed submit. (I) |
| Error above or below the field | Below: Nuxt UI FormField, NN/g, most systems. Above: Adam Silver (reasons not read). Hints above: `ui-craft`                                                                                                                                                                                        | Hints above (or as description), errors where FormField puts them. Revisit if Silver's reasons apply. (I)                                          |
| Live region for field errors   | For: Vercel. Against: Primer ("Live regions should not be used for form validation")                                                                                                                                                                                                                | Focus management on submit plus `aria-describedby` (FormField). No live region. (I)                                                                |
| Confirm or undo                | Either: Vercel. Undo first: NN/g, Apple, Cooper, Raskin, `ui-craft`. Always a dialog: `baseline-ui`. Confirm destructive: Primer                                                                                                                                                                    | Tiered by blast radius. (I)                                                                                                                        |
| Disabled submit                | Never: Vercel, GOV.UK, Primer, Adam Silver. Allowed if focusable and explained: NN/g                                                                                                                                                                                                                | Never pre-disable. Disable only in flight. (I)                                                                                                     |
| Skeleton vs spinner            | Skeleton for full-page loads: NN/g, Primer. Skeleton felt slowest (2.82 s vs 2.41 s for a spinner and 2.29 s for blank, 136 people): Viget (S). Mejtoft et al. 2018 reported the opposite (S)                                                                                                       | Skeleton only where it matches the real layout and the region is large. (I)                                                                        |
| Spinner timing                 | None under 1 s: NN/g, Primer. 150–300 ms show-delay: Vercel. Instant: `loading-auto`                                                                                                                                                                                                                | Block the second click at once; delay the spinner itself. (I)                                                                                      |
| "Loading…" text                | Vercel uses "Loading…" as a pattern. Apple calls "loading" vague. NN/g rejects static "Loading…"                                                                                                                                                                                                    | Name what is loading. (I)                                                                                                                          |
| Animation length               | Kowalski: under 300 ms. NN/g: 100 to 500 ms by size                                                                                                                                                                                                                                                 | Shorter for frequent motion; Nuxt UI's defaults otherwise. (I)                                                                                     |
| Button order                   | Primary on the right in dialogs: Carbon, Primer, Apple. Left-aligned Submit then Cancel fastest on web forms: Wroblewski                                                                                                                                                                            | Dialogs: primary on the right. Page forms: submit first, at the left. Consistent across the app. (I)                                               |
| Hide vs explain unavailable    | Explain: `ui-ux-pro-max`, Apple. Hide for no permission: Carbon                                                                                                                                                                                                                                     | Explain when the user can fix it; hide when only a permission change could. (I)                                                                    |
| Success ticks on fields        | Wroblewski: confusing on obvious fields                                                                                                                                                                                                                                                             | Only on hard fields (username availability). (I)                                                                                                   |

## Rejected

- **7±2 as a cap on menu or nav items.** Laws of UX: "Don't use the 'magical number
  seven' to justify unnecessary design limitations." Miller's paper is about memory
  span, not menus that stay visible [LawsOfUX] (F).
- **Added delay to raise perceived value** (a Doherty takeaway), **pacing progress bars
  to feel faster** (Harrison et al., 2007), and **artificial progress to motivate**
  (goal gradient). Each trades honesty for feeling. Apple calls uneven progress
  potentially "deceptive" [LawsOfUX][Apple-progress] (F).
- **Variable rewards, unpredictability and habit loops** (Weinschenk items; _Hooked_).
  Engagement manipulation.
- **Peak-end rule.** True, but it gives an agent nothing beyond "design the end and
  error states", which other rules require [LawsOfUX] (F).
- **Label alignment numbers** (top vs left). Figures differ between Wroblewski's decks
  (S), and FormField stacks the label above already.
- **All visual advice** in every source: Vercel's shadows, radii, APCA contrast, curly
  quotes and tabular numbers; Refactoring UI's and Practical UI's colour, type and
  spacing chapters; palettes, signatures and "taste". Nuxt UI owns that layer.
- **Vercel's Title Case for buttons.** Vercel marks it as brand preference, "not
  universal". GOV.UK and Primer use sentence case.
- **Generic heuristics** restated without a behaviour ("be consistent", "keep it
  simple"). Kept only where a source gives a concrete rule.
- **uxuiprinciples skills.** Wrappers around a paid API; the content lives behind
  `uxuiprinciples.com/api`. One example even suggests "Submit button disabled until
  valid".
- **sergekostenchuk skills.** Thin: a state list, short layout bullets, report
  templates; the journey skill targets one SEO site.
- **taste-skill.** Marketing websites only: photography, effects, landing-page copy.
- **addyosmani `accessibility`.** A WCAG catalogue with markup; Reka covers most of it,
  and its behaviour items appear in stronger sources.
- **Emil Kowalski `review-animations` and `ask-sonner`.** Animation code review, and an
  API guide for the React Sonner library.
- **Vercel `writing-guidelines`.** Documentation prose, not interface copy.

## The skills built from this

Two skills, split so each can audit alone:

- [`skills/in-progress/ux/`](../skills/in-progress/ux/SKILL.md) holds structure and
  behaviour, and names no component library: the build steps (brief, states, build,
  check), the core principles, the data menu, and one reference per topic under
  [Rules by topic](#rules-by-topic) except motion. Reviewing an existing screen is
  `references/review.md`.
- [`skills/in-progress/ui/`](../skills/in-progress/ui/SKILL.md) holds what the screen
  looks like with the project's library: visual hierarchy, Grey first, motion, how data
  renders, the QA run and its capture script. Each boundary above becomes one file in
  `component-libraries/`, loaded by a routing row, which maps `/ux`'s generic names to
  the library's components and lists what it does and lacks.

How the documents stay in step:

- This document holds the evidence and the reasons; the skills carry only the
  resulting rules, with no citations.
- A rule changes here first, then in the skill.
- A new component library gets its boundary section here first, then its file and row
  in `/ui`.
- When a topic here grows enough for its own file (data tables, AI chat), add a
  reference and a row in the skill's table.
- Edit the skills with `/writing-for-agents`.

## Not covered yet

Future scope. Move an item up into [Rules by topic](#rules-by-topic) once researched.

- **Data tables and dashboards** in depth: bulk selection, column choice, density,
  inline edit. `ui-craft`'s `dashboard.md` and Carbon's data-table pages are not read.
- **AI chat and AI output UX.** `ui-craft`'s `ai-chat.md` and _UX for AI_ are not read.
  Nuxt UI has chat components.
- **Search results pages.** Carbon's `search-pattern` is not read.
- **Mobile and touch** beyond hit targets; i18n and RTL beyond worst-case data.
- **Book chapters behind paywalls.** Reading these in full would firm up claims now
  marked (S):
  - the _Designing Interfaces_ pattern chapters;
  - _Microinteractions_ chapters 2 to 5;
  - _Designing with the Mind in Mind_'s time-requirements chapter;
  - _Practical UI_'s forms and copywriting chapters;
  - _Refactoring UI_'s hierarchy chapter.
- **Video talks.** No transcripts were reachable. The same designers publish the ideas
  as articles, which are read.
- **Interviewing Users**, for a deeper discovery interview in the process reference.

## Sources

### Agent skills (cloned at the commit shown; read 2026-11-15)

- [Vercel] vercel-labs/web-interface-guidelines @434b7f9 (`README.md`, `AGENTS.md`,
  `command.md`) and vercel-labs/agent-skills @1a2c79d `skills/web-design-guidelines`
  and `skills/writing-guidelines` (source:
  https://raw.githubusercontent.com/vercel-labs/writing-guidelines/main/command.md).
  https://github.com/vercel-labs/web-interface-guidelines,
  https://github.com/vercel-labs/agent-skills
- [ui-craft] educlopez/ui-craft @9dd5f45: `skills/ui-craft/SKILL.md` and
  `references/{forms,state-design,components,copy,coverage,layout,motion,review,dashboard,ai-chat}.md`.
  https://github.com/educlopez/ui-craft
- [impeccable] pbakaus/impeccable @2b86d9c: `skill/SKILL.src.md`,
  `skill/reference/{mode-operate,operate,shape,craft-floor,clarify,distill,harden,critique,critique-rubric,onboard}.md`.
  https://github.com/pbakaus/impeccable
- [interface-design] dammyjay93/interface-design @2f9be32:
  `.claude/skills/interface-design/SKILL.md`, `.claude/commands/design-review.md`.
  https://www.ui-skills.com/skills/dammyjay93/interface-design
- [ux-discovery] JacobLinCool/ux-discovery-interviewer-skill @305a4b9.
  https://github.com/JacobLinCool/ux-discovery-interviewer-skill
- uxuiprinciples/agent-skills @8f14fb5. https://github.com/uxuiprinciples/agent-skills
- [ui-ux-pro-max] nextlevelbuilder/ui-ux-pro-max-skill @d643997 (`SKILL.md`,
  `quick-reference.md`, `data/ux-guidelines.csv`, `data/stacks/nuxt-ui.csv`).
  https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- sergekostenchuk/ui-ux-agent-skill-system @ddaedd7.
  https://github.com/sergekostenchuk/ui-ux-agent-skill-system
- [frontend-design] anthropics/skills @1780c5e `skills/frontend-design/SKILL.md`.
  https://github.com/anthropics/skills
- [emil-design-eng], [break-ui] emilkowalski/skills @0f2e23b (`emil-design-eng`,
  `break-ui` with `CATALOG.md`, `review-animations`, `ask-sonner`).
  https://github.com/emilkowalski/skills
- [ibelick] ibelick/ui-skills @65cc0ed (`improve-ui`, `baseline-ui`,
  `fixing-accessibility`). https://github.com/ibelick/ui-skills
- [cognitive-walkthrough] mastepanoski/claude-skills @ac30238.
  https://github.com/mastepanoski/claude-skills
- addyosmani/web-quality-skills @afa8da9 `skills/accessibility`.
  https://github.com/addyosmani/web-quality-skills
- leonxlnx/taste-skill @f6b7657. https://github.com/leonxlnx/taste-skill
- [NuxtUI-skill] nuxt/ui @3879d26 (v4.12.0) `skills/nuxt-ui/SKILL.md` and
  `references/guidelines/{component-selection,forms}.md`.
  https://github.com/nuxt/ui/tree/v4/skills/nuxt-ui
- [NuxtUI-src] nuxt/ui @3879d26 docs (`button`, `form`, `form-field`, `modal`, `empty`,
  `skeleton`, `table`, `tooltip`, `toast`, `progress`, `link`, `command-palette`,
  `use-overlay`, `use-toast`, `define-shortcuts`) and source (`Button.vue`, `Form.vue`,
  `FormField.vue`, `Modal.vue`, `Toast.vue`, `Toaster.vue`, `Empty.vue`, `Table.vue`,
  `useComponentIcons.ts`, `useFormField.ts`, `keyframes.css`). Published pages:
  https://ui.nuxt.com/docs/components/button, `/form`, `/form-field`, `/modal`,
  `/empty`, `/skeleton`, `/toast`, `/tooltip`, `/progress`, `/link`,
  `/command-palette` (all under https://ui.nuxt.com/docs/components/), and
  https://ui.nuxt.com/docs/composables/use-toast,
  https://ui.nuxt.com/docs/composables/define-shortcuts
- [shadcn-skill] shadcn-ui/ui @968d8cb (head of `main`, read 2026-11-18)
  `skills/shadcn/SKILL.md`, `rules/{composition,forms,styling,base-vs-radix,chat,icons}.md`,
  `customization.md`, `design-system.md`, and `skills/migrate-radix-to-base/{SKILL,overlays,form-controls,universal-patterns}.md`.
  https://github.com/shadcn-ui/ui/tree/main/skills/shadcn
- [shadcn-src] shadcn-ui/ui @968d8cb (read 2026-11-18): `apps/v4/registry/bases/{radix,base,aria}/ui/`
  `{button,spinner,field,dialog,alert-dialog,sheet,drawer,popover,sonner,kbd,sidebar,navigation-menu,breadcrumb,empty,skeleton,progress,tabs,accordion,collapsible,dropdown-menu,command,select,combobox,radio-group,switch,checkbox,table,native-select,label,input}.tsx`
  (no `navigation-menu` on `aria`), `bases/base/ui/toast.tsx`,
  `new-york-v4/ui/{form,sonner}.tsx`, `new-york-v4/examples/form-rhf-demo.tsx`,
  `registry/styles/style-nova.css`, `packages/shadcn/src/tailwind.css`,
  `apps/v4/package.json`, and docs `content/docs/forms/{index,react-hook-form,tanstack-form}.mdx`,
  `content/docs/components/radix/{button,field,empty,data-table,sonner,toast,kbd,spinner,sidebar,drawer,dialog,combobox}.mdx`,
  `content/docs/components/base/{button,toast,data-table,drawer,dialog}.mdx`.
  https://github.com/shadcn-ui/ui, https://ui.shadcn.com/docs
- [Radix-src] radix-ui/primitives @eb3a2b7 (head of `main`, read 2026-11-18; shadcn pins
  `radix-ui` ^1.4.3) `packages/react/{dialog,alert-dialog}/src/*.tsx`.
  https://github.com/radix-ui/primitives
- [BaseUI-src] mui/base-ui tag `v1.6.0` (the version shadcn pins, read 2026-11-18)
  `packages/react/src/toast/{provider,root,viewport}/*.tsx`,
  `dialog/{root,popup}/*`, `alert-dialog/root/AlertDialogRoot.tsx`.
  https://github.com/mui/base-ui
- [RAC-src] adobe/react-spectrum @2ac28d3 (head of `main`, read 2026-11-18; shadcn pins
  `react-aria-components` 1.20.0) `packages/react-aria-components/src/Button.tsx`.
  https://github.com/adobe/react-spectrum
- [Sonner-src] emilkowalski/sonner @8e4662b (v2.0.8, read 2026-11-18; shadcn pins
  ^2.0.0) `src/index.tsx`, `src/state.ts`, `src/styles.css`.
  https://github.com/emilkowalski/sonner
- [tw-animate] Wombosvideo/tw-animate-css @1fc30d2 (head of `main`, read 2026-11-18;
  shadcn pins ^1.4.0) `src/tw-animate.css`, `README.md`.
  https://github.com/Wombosvideo/tw-animate-css
- skills.sh leaderboard and "Design & UI" topic. https://skills.sh/,
  https://skills.sh/topic/design

### Design systems

- [Primer-saving], [Primer-loading], [Primer-notif], [Primer-degraded], [Primer-empty],
  [Primer-disclosure], [Primer-onboarding], [Primer-forms] GitHub Primer, primer/design
  @87f799f (2025-07-01), `content/ui-patterns/{saving,loading,notification-messaging,degraded-experiences,empty-states,progressive-disclosure,feature-onboarding,forms/overview}.mdx`.
  https://primer.style/ui-patterns
- [Carbon-notif], [Carbon-dialog], [Carbon-actions], [Carbon-disabled],
  [Carbon-readonly], [Carbon-filter] IBM Carbon, carbon-design-system/carbon-website
  @5e9cd1d (2026-09-30), `src/pages/patterns/{notification-pattern,dialog-pattern,common-actions,disabled-states,read-only-states-pattern,filtering}/index.mdx`.
  https://carbondesignsystem.com/patterns/overview/
- [Atlassian-messages], [Atlassian-errors], [Atlassian-success] Atlassian Design.
  https://atlassian.design/foundations/content/designing-messages (and `/error-messages`,
  `/success-messages`)
- [GOVUK-validation] https://design-system.service.gov.uk/patterns/validation/
- [GOVUK-error] https://design-system.service.gov.uk/components/error-message/
- [GOVUK-button] https://design-system.service.gov.uk/components/button/
- [Apple-feedback] https://developer.apple.com/design/human-interface-guidelines/feedback
- [Apple-loading] https://developer.apple.com/design/human-interface-guidelines/loading
- [Apple-progress] https://developer.apple.com/design/human-interface-guidelines/progress-indicators
- [Apple-alerts] https://developer.apple.com/design/human-interface-guidelines/alerts
- [Material] Material Design 2 "Snackbars" and Angular Material "Snackbar" (search
  summary). https://m2.material.io/components/snackbars

### Books

- [RefactoringUI] Adam Wathan and Steve Schoger, _Refactoring UI_. Table of contents:
  https://www.refactoringui.com/ (F). Chapter summaries: Saad Hasan, "Refactoring UI —
  Starting from scratch" (Medium); sglavoie.com book summary; Jacob Shannon's notes (S).
- [Krug] Steve Krug, _Don't Make Me Think, Revisited_ (New Riders, 2014). Chapter 4
  sample from the author, https://sensible.com/downloads/DMMT-Revisited-sample-chapter.pdf,
  and Pearson's sample, https://www.pearson.com/en-au/media/zollwzef/9780321965516.pdf
  (F). Book page: https://sensible.com/dont-make-me-think/. Reservoir of goodwill and
  other chapters: grin.com, gurkhatech.com summaries; quotes via excerpts (S).
- [Norman] Don Norman, _The Design of Everyday Things_ (revised, 2013). Norman,
  "Signifiers, not affordances", https://jnd.org/signifiers-not-affordances/ (F). Book
  notes quoting the text: https://www.joekotlan.com/the-design-of-everyday-things/ (S).
- [AboutFace] Alan Cooper, Robert Reimann, David Cronin, Christopher Noessel, _About
  Face_. Summary: https://howtoes.blog/2025/06/11/about-face-complete-book-summary-all-key-ideas/
  and the About Face 3 principle list as shown in search results (S).
- [Tidwell] Jenifer Tidwell, _Designing Interfaces_ (O'Reilly). Official preview, 1st
  ed.: https://api.pageplace.de/preview/DT0400.9780596519087_A23629407/preview-9780596519087_A23629407.pdf
  (F). Pattern list for the 2nd and 3rd editions: designinginterfaces.com/patterns
  (via search, S).
- [Saffer] Dan Saffer, _Microinteractions_ (O'Reilly, 2013). Official preview:
  https://api.pageplace.de/preview/DT0400.9781491945988_A24113070/preview-9781491945988_A24113070.pdf
  (F). Interview: https://archive.uie.com/brainsparks/2014/08/01/dan-saffer-big-considerations-from-microinteractions/
  (F). Principle meanings from talk summaries (S).
- [AdamSilver] Adam Silver, _Form Design Patterns_ (Smashing, 2018).
  https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/,
  https://adamsilver.io/blog/the-problem-with-live-validation-and-what-to-do-instead/,
  https://adamsilver.io/blog/dont-use-the-maxlength-attribute-to-stop-users-from-exceeding-the-limit/
  (F). Book principles via noti.st talk summary (S).
- [Wroblewski-deck] Luke Wroblewski, _Web Form Design: Filling in the Blanks_
  (Rosenfeld, 2008). Author's deck: http://static.lukew.com/ui12_lukew_webforms.pdf (F).
- [PracticalUI] Adham Dannaway, _Practical UI_ (2nd ed., 2024). Free preview:
  https://www.practical-ui.com/practical-ui-preview.pdf (F).
- [Weinschenk] Susan Weinschenk, _100 Things Every Designer Needs to Know About People_
  (2nd ed.). Pearson sample: https://www.pearson.com/en-au/media/xefbriuu/9780136746911.pdf
  (F, contents). Summaries: briansnotes.io, bookey (S).
- [Johnson] Jeff Johnson, _Designing with the Mind in Mind_ (3rd ed., 2020). Chapter
  list via Elsevier and library catalogues (S).
- [Walter] Aarron Walter, _Designing for Emotion_ (A Book Apart). Via [NNg-delight] (F)
  and reviews (S).
- [Garrett] Jesse James Garrett, "The Elements of User Experience" diagram (2000).
  http://www.jjg.net/elements/pdf/elements.pdf (F)
- [Raskin] Jef Raskin, _The Humane Interface_ (2000). Brown CS092 chapter notes, Chris
  McLay's review, Wikipedia (S).
- [Podmajersky] Torrey Podmajersky, _Strategic Writing for UX_ (O'Reilly). Table of
  contents and reviews: UXmatters review; O'Reilly chapter 4 listing (S).
- [Yifrah] Kinneret Yifrah, _Microcopy: The Complete Guide_. River.me review; Yifrah,
  "7 guidelines for writing accessible microcopy" (Prototypr) (S).
- [LawsOfUX] Jon Yablonski, _Laws of UX_ / https://lawsofux.com (F):
  - Doherty threshold (Doherty and Thadani, IBM Systems Journal, 1982): https://lawsofux.com/doherty-threshold/
  - Hick's law (Hick and Hyman, 1952): https://lawsofux.com/hicks-law/
  - Miller's law (Miller, 1956): https://lawsofux.com/millers-law/
  - Jakob's law: https://lawsofux.com/jakobs-law/
  - Fitts's law (Fitts, 1954): https://lawsofux.com/fittss-law/
  - Law of Proximity (Gestalt): https://lawsofux.com/law-of-proximity/
  - Peak-end rule (Kahneman et al., 1993): https://lawsofux.com/peak-end-rule/
  - Tesler's law: https://lawsofux.com/teslers-law/
  - Von Restorff effect (1933): https://lawsofux.com/von-restorff-effect/
  - Goal-gradient effect (Hull, 1932): https://lawsofux.com/goal-gradient-effect/
  - Chunking (Miller, 1956): https://lawsofux.com/chunking/
- [Postel] https://lawsofux.com/postels-law/ (F)
- [UntitledUI-books] https://www.untitledui.com/blog/ux-design-books,
  https://www.untitledui.com/blog/ui-design-books (F)

### Research articles and guidelines

- [NNg-basics] NN/g, "UX Basics: Study Guide" (and the slogan videos it links).
  https://www.nngroup.com/articles/ux-basics-study-guide/
- [NNg-micro] "Microinteractions in User Experience". https://www.nngroup.com/articles/microinteractions/
- [NNg-delight] "A Theory of User Delight". https://www.nngroup.com/articles/theory-user-delight/
- [NNg-interaction-cost] "Interaction Cost". https://www.nngroup.com/articles/interaction-cost-definition/
- [NNg-top10] "Top 10 Enduring Web-Design Mistakes". https://www.nngroup.com/articles/top-10-enduring/
- [NNg-response] "Response Times: The 3 Important Limits". https://www.nngroup.com/articles/response-times-3-important-limits/
- [Nielsen-timescales] Jakob Nielsen, "Time Scales of UX". https://jakobnielsenphd.substack.com/p/time-scale-ux
- [NNg-progress] "Progress Indicators Make a Slow System Less Insufferable". https://www.nngroup.com/articles/progress-indicators/
- [NNg-skeleton] "Skeleton Screens 101". https://www.nngroup.com/articles/skeleton-screens/
- [NNg-buttons] "Button States: Communicate Interaction". https://www.nngroup.com/articles/button-states-communicate-interaction/
- [NNg-disabled] NN/g, "Why Disabled Buttons Hurt UX (and How to Fix Them)" (video summary, 2025). https://www.nngroup.com/videos/why-disabled-buttons-hurt-ux-and-how-to-fix-them/
- [NNg-status] "Visibility of System Status". https://www.nngroup.com/articles/visibility-system-status/
- [NNg-indicators] "Indicators, Validations, and Notifications". https://www.nngroup.com/articles/indicators-validations-notifications/
- [NNg-confirm] "Confirmation Dialogs Can Prevent User Errors (If Not Overused)". https://www.nngroup.com/articles/confirmation-dialog/
- [NNg-control] "User Control and Freedom". https://www.nngroup.com/articles/user-control-and-freedom/
- [NNg-errors] "Error-Message Guidelines". https://www.nngroup.com/articles/error-message-guidelines/
- [NNg-forms-errors] "10 Design Guidelines for Reporting Errors in Forms". https://www.nngroup.com/articles/errors-forms-design-guidelines/
- [NNg-forms] "Website Forms Usability: Top 10 Recommendations". https://www.nngroup.com/articles/web-form-design/
- [NNg-placeholders] "Placeholders in Form Fields Are Harmful" (search summary). https://www.nngroup.com/articles/form-design-placeholders/
- [NNg-cognitive-load] "4 Principles to Reduce Cognitive Load in Forms". https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/
- [NNg-empty] "Designing Empty States in Complex Applications". https://www.nngroup.com/articles/empty-state-interface-design/
- [NNg-disclosure] "Progressive Disclosure". https://www.nngroup.com/articles/progressive-disclosure/
- [NNg-F] "F-Shaped Pattern of Reading on the Web". https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- [NNg-read] "How Users Read on the Web". https://www.nngroup.com/articles/how-users-read-on-the-web/
  Also "Inverted Pyramid" and "Headings Are Pick-Up Lines" (search summary). https://www.nngroup.com/articles/inverted-pyramid/
- [NNg-uicopy] "UI Copy: UX Guidelines for Command Names and Keyboard Shortcuts". https://www.nngroup.com/articles/ui-copy/
- [NNg-hamburger] "Hamburger Menus and Hidden Navigation Hurt UX Metrics". https://www.nngroup.com/articles/hamburger-menus/
- [NNg-mobile-nav] "Findability of Navigation on Mobile". https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/
- [NNg-youarehere] "Navigation: You Are Here". https://www.nngroup.com/articles/navigation-you-are-here/
- [NNg-tabs] "Tabs, Used Right". https://www.nngroup.com/articles/tabs-used-right/
- [NNg-modal] "Modal & Nonmodal Dialogs". https://www.nngroup.com/articles/modal-nonmodal-dialog/
- [NNg-anim] "Executing UX Animations: Duration and Motion Characteristics". https://www.nngroup.com/articles/animation-duration/
- [NNg-heuristics] "10 Usability Heuristics for User Interface Design". https://www.nngroup.com/articles/ten-usability-heuristics/
- [Vercel] see Agent skills.
- [Wroblewski-inline] Luke Wroblewski, "Inline Validation in Web Forms", A List Apart, 2009. https://alistapart.com/article/inline-validation-in-web-forms/
- [Wroblewski-actions] "Primary & Secondary Actions in Web Forms". https://www.lukew.com/ff/entry.asp?571
- [Wroblewski-obvious] "Obvious Always Wins". https://www.lukew.com/ff/entry.asp?1945
- [Kowalski-anim] Emil Kowalski, "You Don't Need Animations". https://emilkowal.ski/ui/you-dont-need-animations
- [Kowalski-great] "Great Animations". https://emilkowal.ski/ui/great-animations
- [Kowalski-good-great] "Good vs Great Animations". https://emilkowal.ski/ui/good-vs-great-animations
- [Rauno] Rauno Freiberg, "Invisible Details of Interaction Design". https://rauno.me/craft/interaction-design
- [Linear-menus] Linear, "Invisible details: Building contextual menus". https://linear.app/now/invisible-details
- [Linear-triage] Linear, "How we built Triage Intelligence" (summary). https://linear.app/now/how-we-built-triage-intelligence
- [AzaRaskin] Aza Raskin, "Never Use a Warning When You Mean Undo", A List Apart. https://alistapart.com/article/neveruseawarning/
- [Viget] Viget, "A Bone to Pick with Skeleton Screens" (2017; via search and a secondary
  reproduction). https://www.viget.com/articles/a-bone-to-pick-with-skeleton-screens

### Standards

- [WCAG-2.2.1] https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- [WCAG-3.3.7] https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- [WCAG-4.1.3] https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- [APG-dialog] https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- [APG-kbd] https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- [Reka] Reka UI Dialog and Toast. https://reka-ui.com/docs/components/dialog,
  https://reka-ui.com/docs/components/toast
