---
name: ui-prototype
description: Prototype a page with Matt Pocock's /prototype, held to /ux and /ui, with a data menu, a QA pass and your verification before capture. A plain "prototype this" runs /prototype alone; type /ui-prototype for this.
argument-hint: "[page or question]"
disable-model-invocation: true
metadata:
  credits:
    skill: prototype
    author: Matt Pocock
    url: "https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md"
---

# UI prototype

`/prototype` answers "what should this page be?" with throwaway variants on the real
route. This skill runs it as written and adds three things: `/ux` and `/ui` hold every
variant, `/ux`'s data menu sits on the switcher, and the capture waits for QA and the
user's verification.

## Steps

### 1. Check the parts

Each must be present before anything is built. A skill is present when it is in your
available skills.

| Part | Install |
| --- | --- |
| `/prototype` | `npx skills add mattpocock/skills --skill prototype` |
| `/ux`, `/ui` | `npx skills add jd-solanki/ai --skill ux --skill ui` |
| The library skill `/ui` names | its `component-libraries/` file says how |
| `playwright-cli` | `npm install -g @playwright/cli` |

**Done when** every part is present, or you stopped and gave the user the install command
for each missing one.

### 2. Prototype

Invoke `/ux`, `/ui` and `/prototype`. Take `/prototype`'s UI branch, and run its steps
up to and including the hand-over, holding every variant to `/ux` and `/ui`. Add:

- `/ux`'s data menu (its `references/states.md`) on the switcher, beside the variant
  arrows. Mark the switcher `data-dev-tool`.
- Before each hand-over, `/ui`'s render check on every variant, with `?variant=<key>` in
  the URL.

The user's mixes ("B's header with C's list") are the next round.

**Done when** the user names one variant as final.

### 3. QA

Run `/ui`'s QA, its `references/qa.md`, on the final variant.

**Done when** its criterion holds.

### 4. Verify

Report what QA found and fixed, then wait. The user's corrections run through step 3
again.

**Done when** the user says the prototype is verified.

### 5. Capture and clean up

Run `/prototype`'s capture and clean-up step as written. Two additions:

- the verdict lists the QA fixes beside the question, the pick and why;
- the data menu and its fixtures stay with the real page, dev-only. Only the switcher
  and the other variants leave the work branch.

**Done when** `/prototype`'s capture is done, and the real page keeps its data menu.
