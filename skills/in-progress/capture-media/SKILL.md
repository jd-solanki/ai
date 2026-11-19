---
name: capture-media
description: >
  Capture browser screenshots and videos of a running app as files: a showcase of a change for a
  pull request body, or proof of a QA scenario run. Picks the media, records it with
  playwright-cli, hides personal data, and fits each video under GitHub's 10 MB limit with ffmpeg.
  Use when another skill or the user needs media of what the browser shows.
---

# Capture media

You capture what the browser shows and save it as files in a folder the caller names. You upload
nothing: posting the files is the caller's job.

The caller gives you a **purpose**:

- **showcase**: show a reviewer what a change looks like and how it behaves.
- **proof**: show that a QA scenario ran, step by step, and what each step showed.

## 1. Pick the media

Pick the media that lets this reader see this change, or this run, fastest. The table is the
starting point, not the limit: a change it does not cover gets what its reader needs.

| Purpose | What it shows | Media |
| --- | --- | --- |
| showcase | the main change | one or more highlights, placed first |
| showcase | the look of an existing screen | before / after screenshots |
| showcase | an existing flow that changed | before / after videos |
| showcase | a new screen or a new flow | an after screenshot or an after video |
| showcase | a state the change touches: loading, empty, error, dark theme, a mobile viewport | one screenshot each |
| proof | a scenario with actions | one video, one chapter per step |
| proof | a scenario that checks one state on load | one screenshot |
| proof | a failed step | a screenshot of the moment it failed, beside the video |

A flow is two or more steps or pages. Proof is about the current code, so it has no before.

Capture **before** on the base branch and **after** on the change, framed identically: same
viewport, same data, same scroll position.

**Done when** every item you will capture has a name, a purpose and a kind.

## 2. Check ffmpeg

Run `ffmpeg -hide_banner -encoders | grep libx264` before the first video.

- **Found**: go on.
- **Missing, and a person is in the chat**: ask them for permission, then install it:
  `brew install ffmpeg` on macOS, `sudo apt-get install -y ffmpeg` on Debian and Ubuntu, the
  system's package manager elsewhere.
- **Missing, and nobody answers** (an unattended run): capture no video, and tell the caller
  `needs ffmpeg`. Screenshots still work.

**Done when** ffmpeg with `libx264` runs, or the caller knows video is missing.

## 3. Capture

Read `playwright-cli --help` for the commands, and the skill it points to before the first one.

- **Data**: record the accounts and records the run created. Anything else that shows a person
  (emails, names, IDs, avatars) gets a blur first:
  `playwright-cli eval "document.querySelectorAll('<selector>').forEach(e => e.style.filter = 'blur(6px)')"`.
- **Screenshot**: `playwright-cli screenshot --filename <folder>/<name>.png`. Crop to the region
  around the change with an element target; add `--full-page` when the whole page is the point.
- **Video**:
  1. `playwright-cli video-show-actions`, so each click and keystroke is labelled on screen.
  2. `playwright-cli video-start <folder>/<name>.webm`, and note the time with `date +%s.%N`.
  3. Before each step: `playwright-cli video-chapter "<step n: what it does>"`, and log the
     seconds since the start beside the step in `<folder>/<name>.chapters`.
  4. After the last step: `playwright-cli video-stop`.

Check every file for tokens, cookies and keys in view before it leaves the machine. A file that
shows one is captured again with it hidden.

**Done when** every item from step 1 is a file in the folder, and none shows a secret.

## 4. Fit each video under 10 MB

GitHub plays `.mp4`, `.mov` and `.webm`, up to 10 MB on a free plan. H.264 plays everywhere.
Every video goes through these steps, in order, and stops at the first that fits:

1. Convert to H.264:
   ```shell
   ffmpeg -y -i <name>.webm -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
     -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -movflags +faststart <name>.mp4
   ```
2. Over 10 MB: run it again with `-crf 26`, then `-crf 28`, then `-crf 30`. Text stays readable
   at 30.
3. Still over: split it at the chapter times in `<name>.chapters` into parts under 10 MB each,
   `<name>-1.mp4`, `<name>-2.mp4` and so on, re-encoding each part at the last CRF:
   `ffmpeg -y -ss <start> -to <end> -i <name>.webm <the encode flags> <name>-<n>.mp4`.

Every step stays in a video: a part boundary falls on a chapter, never inside a step.

**Done when** every video is one or more `.mp4` files, each under 10 MB, covering every step.

## 5. Return

Give the caller one line per file: its path, what it shows, and, for a video, the steps each part
covers.
