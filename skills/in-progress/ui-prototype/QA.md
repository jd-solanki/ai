# QA

Render the final variant on every device below, in every data state, and review every
screenshot for what **breaks**. Speed is part of the job: a run lands in about ten minutes.

## Devices

Emulate each one as Chrome DevTools' device mode does: viewport, device pixel ratio, and
touch with a mobile user agent where the table says so.

| Device | Viewport | Pixel ratio | Touch |
| --- | --- | --- | --- |
| Galaxy S | 360×780 | 3 | yes |
| iPhone SE | 375×667 | 2 | yes |
| iPhone 15 | 393×852 | 3 | yes |
| iPhone 15 Pro Max | 430×932 | 3 | yes |
| iPad Mini | 768×1024 | 2 | yes |
| iPad Air, landscape | 1180×820 | 2 | yes |
| Laptop | 1366×768 | 1 | no |
| Full HD | 1920×1080 | 1 | no |
| 5K, or 4K at 150% | 2560×1440 | 2 | no |
| 4K at 100% | 3840×2160 | 1 | no |

Add any screen the project's own users stand at that the table lacks.

## Steps

### 1. Capture

One run, every device in every data state: full-page screenshots, each taken once the page
settles (data pushed after load has landed), named `<state>-<device>.png`.

**Done when** a file exists for every pair.

### 2. Review

Give each data state its own reviewer, in parallel when subagents are available: that
state's screenshots, ordered by width, and the list below. Neighbouring widths share a
layout, so a reviewer spends its time where the layout changes, and still opens every image.

Each finding names the state, the device, the element, what breaks, and one fix.

**Done when** every screenshot has been opened by a reviewer.

### 3. Fix

Fix each finding at its root: a responsive rule, never a patch for one device. Recapture
only the pairs a fix touches, and look at them.

**Done when** every finding is fixed, or reported to the user as a decision with its
options, and every recaptured screenshot is clean.

## What breaks

- **Wrap**: a button, badge, tab or short label on two lines; one word alone on a line; a
  footer whose text and actions crowd each other.
- **Overflow**: sideways scroll; clipped text; an id, number or date cut off; content under
  a fixed bar or overlay.
- **Shift**: the loading layout differs from typical's at the same device, so content jumps
  as it arrives.
- **Stretch**: text lines past about 80 characters, a column stretched thin, or content lost
  in empty space, from 1920 up.
- **Cramp**: controls touching, or an action only reachable by hover on a touch device.
- **Rhythm**: misaligned edges, uneven gaps between like items, a heading closer to the
  section above than to its own content.
- **State**: an empty or error state without its next step; worst-case names, RTL and emoji
  breaking the rules of `/ui-ux`'s `references/states.md`.
