---
name: ui-prototype
description: Build throwaway monochrome variants of a page, let the user pick one, then QA the pick across devices and data states. Use when the user wants to prototype, redesign or explore what a page or screen should look like.
metadata:
  credits:
    skill: prototype
    author: Matt Pocock
    url: "https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md"
    ref: 321658273cb1d20b76026717d027d505790106d4
---

# UI prototype

A UI prototype is **throwaway code that answers "what should this look like?"**: variants of
one page on its real route, flipped from a floating bar until the user picks one. The pick,
QA'd on every device and data state, is what the implementation rebuilds. The prototype code
itself never ships.

Invoke `/ui-ux` before step 1. It owns the brief, the states and the principles; hold every
variant to it.

## Every round

- **Monochrome.** Black, white and the theme's greys. Hierarchy comes from size, weight,
  spacing, position and words; a state is a shape and a word. Where colour enters is the
  implementation's call, under `/ui-ux`.
- **Crafted, not engineered.** The look is what the user judges, so finish it: alignment,
  spacing, type scale, wrapping. Skip the engineering: no tests, no abstractions, error
  handling only to keep it running.
- **Real host.** Mount the variants on the route where the page lives, behind its data
  fetching, auth and shell, gated by `?variant=`. With no such page, add a throwaway route
  with `prototype` in its path, in the project's routing convention.
- **Fake data, stub actions.** Variants read one fixture and call stubs that change
  in-memory state after a short delay, so every pending state shows and nothing reaches a
  server.
- **Marked throwaway.** One folder beside the page, named with `prototype`, outside any
  auto-registered directory; every file opens with `PROTOTYPE — throwaway`. Every entry
  point is gated on the dev build.

## Steps

### 1. Brief

Write `/ui-ux`'s brief, and the question this round answers. Name each planned variant and
the well-known product whose pattern it borrows: a Linear list, Vercel's settings rows. A
variant with no reference ships the component library's defaults.

**Done when** the brief, the question and every variant's reference are written in your
reply.

### 2. Build the variants

- First round: three variants that disagree on structure (layout, hierarchy, primary
  affordance), never only on colour or copy. Five at most.
- Later rounds: when the user locks a base, every new variant keeps it and explores one
  idea, named in its label.

Each variant is its own file and free to throw out the layout. Variants share the fixture,
the stubs and small leaf parts, never a layout.

**Done when** every variant renders every data state of step 3 with no blank region.

### 3. Wire the switcher

A pill fixed at the bottom centre, inverted and shadowed so it reads as tooling, clear of
any dev-tool overlay:

- arrows and a `<key> (<name>)` label cycle the variants, wrapping; `←` and `→` do the same
  unless focus is in a field;
- a data menu holds the five data states of `/ui-ux`'s `references/states.md`;
- both live in the URL (`?variant=`, `?data=`) through the router's replace, so reload and
  sharing keep them;
- a `current` entry shows today's page beside the variants, when one exists.

**Done when** every variant and data state loads from its URL.

### 4. Look

Screenshot each variant in typical and worst data, at a phone width and a desktop width,
and look at every image. Fix what breaks, then look again.

**Done when** no screenshot shows anything you would fix.

### 5. Hand over

Give the URL, each variant's key and name, the data states, and one line per variant on the
idea it tests. Answers often mix variants ("B's header with C's list"): build the mix as the
next round, from step 2.

**Done when** the user names one variant as final.

### 6. QA

Read [QA.md](QA.md) and run it on the final variant.

**Done when** QA.md's criterion holds.

### 7. Verify

Report what QA found and fixed, then wait. The user's corrections run through step 6 again.

**Done when** the user says the prototype is verified.

### 8. Capture

- Commit the prototype, every variant and the switcher, to a throwaway branch
  `prototype/<page>`: it is the primary source.
- Write the verdict where the implementation will read it (its issue, or the commit): the
  question, the pick and why, what it takes from the other variants, the QA fixes.
- Remove the prototype from the work branch. The implementation rebuilds the pick under
  `/ui-ux`.

**Done when** the throwaway branch and the verdict exist, and the work branch holds no
prototype code.
