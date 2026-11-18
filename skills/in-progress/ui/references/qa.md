# QA

Render the screen on every device in every data state, and review every screenshot for
what **breaks**. Speed is part of the job: a run lands in about ten minutes.

## Steps

### 1. Capture

Run `SKILL.md`'s capture script on every device in every data state:

```sh
node <skill-dir>/scripts/qa.mjs --url <page-url> --out <dir>
```

Its device table is in `--help`. Add any screen the project's own users stand at that
the table lacks, with `--extra <name>:<width>x<height>:<pixel-ratio>[:touch]`.

**Done when** the run ends with a full-page and a first-screen screenshot for every pair,
and its leads are saved.

### 2. Review

Give each data state its own reviewer, in parallel when subagents are available: that
state's screenshots, ordered by width, its leads, and the list below. Neighbouring widths
share a layout, so a reviewer spends its time where the layout changes, and still opens
every image.

A lead is a place to look. The reviewer opens the full screenshot it points at, and keeps
it as a finding only when it breaks in context.

Each finding names the state, the device, the element, what breaks, and one fix.

**Done when** every screenshot has been opened and every lead judged.

### 3. Fix

Fix each finding at its root: a responsive rule, never a patch for one device. Recapture
only the pairs a fix touches, with `--only <state>-<device>`, and look at them.

**Done when** every finding is fixed, or reported to the user as a decision with its
options, and every recaptured screenshot is clean.

## What breaks

- **Wrap**: a button, badge, tab or short label on two lines; one word alone on a line; a
  footer whose text and actions crowd each other.
- **Overflow**: sideways scroll, or a page zoomed out to fit; clipped text; an id, number
  or date cut off; content under a fixed bar or overlay.
- **Shift**: the loading layout differs from typical's at the same device, so content jumps
  as it arrives.
- **Stretch**: text lines past about 80 characters, a column stretched thin, or content lost
  in empty space, from 1920 up.
- **Cramp**: controls touching, or an action only reachable by hover on a touch device.
- **Rhythm**: misaligned edges, uneven gaps between like items, a heading closer to the
  section above than to its own content.
- **State**: an empty or error state without its next step; worst-case names, RTL and emoji
  breaking `/ux`'s `references/states.md` or this skill's data rules.
