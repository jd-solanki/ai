# Layout and navigation

## Hierarchy

- Build the feature first and the shell (sidebar, header, nav) last. The shell's needs
  only show once the features exist.
- Name the focal element before building, and let it dominate: squint at the screen
  and one thing should stand out.
- One primary action per view or section, a few secondary ones, the rare ones tertiary
  or in a menu. When something must stand out, quiet its competitors rather than
  making it louder. A button that does the same thing looks the same everywhere.
- Group with spacing first. Add a `UCard`, border or divider only where spacing does
  not read as a group; plain content with spacing is often better.
- Things that look alike behave alike; things that behave differently look different.
- Keep each action next to the thing it acts on.
- Structure carries meaning: numbering, dividers, labels and outlines say something
  about the content.
- Put key content top and left, and the most important item first or last in a list,
  never buried in the middle.
- Front-load headings, labels and list items: the first words carry the meaning.
- Let a value carry its own label where the format is obvious ("12 left in stock", not
  "In stock: 12"). Spec sheets, where users scan for the label, keep label and value.
- Keep everything one decision needs on one screen. Users carry nothing in memory from
  step 1 to step 3, and never jump between tabs or modals to gather what one choice
  needs.
- Give each number its meaning: a trend, a comparison, or a threshold.
- App screens load straight into the task, with no intro animation or splash.

## Progressive disclosure

- Show the frequent options; put the advanced ones behind a `UCollapsible`,
  `UAccordion`, "More options" or a `UDropdownMenu`. Stop at two levels.
- Offer fewer choices, and highlight the recommended one when several remain.
- After a first choice, show only the follow-up questions that choice needs.
- Keep the user's place when something expands, and pair the expand icon with text.
- Use `UTabs` only when users will not compare content across tabs. Put the most used
  tab first and selected. Tabs that need their own URL are navigation.

## Navigation

- Navigation is part of the product: it shows where the user is, where they can go and
  what matters. Every page sits in the app's navigation.
- Keep primary navigation visible on desktop (a `UNavigationMenu` or dashboard sidebar);
  hidden navigation makes tasks slower. On mobile, prefer visible or combined
  navigation.
- Show where the user is: active route styles (built in), a `UBreadcrumb`, and a step
  count in flows.
- Keep filters, tabs, pagination, sort and open panels in the URL, so refresh, share
  and Back work.
- Back from a detail view returns to the list with its filters, sort, page and scroll
  position intact.
- Links navigate and buttons act. A `UButton` with `to` renders a link. Back always
  works.
- Every screen offers a way to the rest of the app; people change goals midway.
- Name categories so each makes sense alone and next to its siblings.
- When a destination is unavailable but the user could unlock it, show it and say why.
  Hide it only when the user lacks permission.

## Filters, search and bulk actions

- Put frequent filters next to the data they scope.
- Show active filters outside the filter panel, each removable on its own.
- When filters live in a drawer or menu, its trigger shows how many are active and
  offers to clear them without opening it.
- Give each filter category its own clear, plus one "Clear all".
- One category: apply on change. Many categories, or slow data: apply in a batch with
  an "Apply filters" button.
- Give each filter category its own control; keep categories out of a shared dropdown.
- Bulk actions and exports state their scope: "Export 24 filtered rows", "Delete 3
  projects".
- Masked values stay identifiable: show the last four characters of a key.
- A search with no results offers a way on: spelling fixes, popular queries, or a wider
  scope.

## Power users

- Give frequent actions a keyboard shortcut with `defineShortcuts`, and show it next to
  the command with `UKbd`. Keep standard shortcuts (Cmd+S, Cmd+K, Escape) meaning what
  users expect.
- Offer a `UCommandPalette` once the app has many destinations or actions.
- Reduce a repeated operation to one action per repetition.

## Feature onboarding

- Teach in place: the hint sits where the feature lives for good, sized to the
  feature's weight on the page.
- Prefer an empty state as the onboarding surface.
- At most two alerts at a time and one popover tour step at a time, each short (about
  160 characters).
- Make dismissal obvious and remember it; show a campaign for a limited time.
- Point only at visible elements. "Learn more" opens in a new tab so work is not lost.
- Skip extra steps for returning users; most users stay intermediates.
