---
name: ui
description: How an app screen looks and holds up, built with the project's component library — visual hierarchy, colour, motion, how data renders, and QA across devices and data states. Use when building or changing a page or component, choosing components from Nuxt UI or shadcn/ui, or reviewing or QA-ing how a screen looks.
metadata:
  credits:
    - skill: ui-craft
      author: Edu Calvo
      url: "https://github.com/educlopez/ui-craft"
    - skill: impeccable
      author: Paul Bakaus
      url: "https://github.com/pbakaus/impeccable"
    - skill: break-ui
      author: Emil Kowalski
      url: "https://github.com/emilkowalski/skills"
---

# UI

The project's component library and its theme own the look: type, colour values,
spacing scale, radius, shadow, dark mode and component styling. This skill uses that look
as it is, and makes the screen read and hold: what stands out, where colour goes, how
data renders, and whether the screen survives every device and data state.

What the screen does, and in what order, is `/ux`'s. When `/ux` has run, its brief's
focal element and primary action are given.

## Component library

Load the row of [Component libraries](#component-libraries) that matches the project.
When building, invoke the library's own skill that the file names, before writing a
component; an audit skips it. With no matching row, say so in your reply and take
components from the library's docs.

## Steps

### 1. Arrange

Build with the library's components, variants and theme tokens, and apply every
principle below. Load `references/motion.md` before adding or changing an animation or
transition.

Done when every principle that applies holds.

### 2. Render check

Run `scripts/qa.mjs` (see [Capture](#capture)) on a phone and a laptop, in typical and
worst data:

```sh
node <skill-dir>/scripts/qa.mjs --url <page-url> --devices iphone-15,laptop --states typical,worst
```

Open every screenshot, and judge every lead it reports on the full screenshot. Fix each
break at its root, then recapture what the fix touched.

Done when every screenshot is opened, every lead is judged, and none shows anything you
would fix.

### 3. QA

Only for a prototype's final variant, a UI audit, or when the user asks: read
[references/qa.md](references/qa.md) and run it.

Done when its criterion holds.

## Principles

- **The library's look.** Use its components, variants and semantic colour tokens as
  they are. Classes you add place things (flex, grid, gap, width); they never set a
  colour, font size, radius or shadow of their own.
- **Squint test.** The focal element dominates: squint, and one thing stands out. When
  something must stand out, quiet its competitors rather than making it louder.
- **Grey first.** Build in the theme's neutrals, and add colour only where `/ux` says
  something must stand out: a status that needs attention, a destructive action, the
  primary action. A colour on every state is noise, and colour is never the only
  signal.
- **Spacing before structure.** Group with spacing first. Add a card, border or divider
  only where spacing does not read as a group.
- **Like looks like.** Things that behave alike look alike, and things that behave
  differently look different. A button that does the same thing looks the same
  everywhere.
- **Structure carries meaning.** Numbering, dividers, labels and outlines say something
  about the content, or they go.
- **Data renders whole.** Per field:
  - wrap names and titles the user needs to identify something;
  - end-truncate secondary metadata, with a way to see the full value;
  - middle-truncate file names, emails, paths and hashes, whose ends tell them apart;
  - clamp card previews;
  - show numbers, amounts and dates in full, always.

When a break has more than one right fix, report it to the user as a decision instead of
picking one.

## Capture

`scripts/qa.mjs` sits in this skill's folder, `<skill-dir>` in the commands. It drives
`playwright-cli`, opening a fresh browser per device with its viewport, pixel ratio,
touch and user agent. For each device and data state it saves a full-page screenshot and
a first-screen screenshot, hiding every `data-dev-tool` element, and reports **leads**:
breaks a screenshot hides. A lead is a place to look, never a finding.

- `--help` lists the flags and the devices.
- `--only <state>-<device>` recaptures one pair after a fix.
- `--self-test` checks the script on a page with planted breaks. Run it once when a
  lead looks wrong.

The data states are `/ux`'s data menu (`?data=<option>`); a screen without one shows
only `live`.

## Component libraries

| Reference | Load when |
| --- | --- |
| `component-libraries/nuxt-ui.md` | `@nuxt/ui` is in `package.json` |
| `component-libraries/shadcn.md` | `components.json` is at the project root |
