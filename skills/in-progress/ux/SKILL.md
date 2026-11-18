---
name: ux
description: Structure and behaviour of app screens, whatever the component library — task, hierarchy, states, feedback, forms, dialogs, navigation and interface copy. Use when building or changing a page, form, dialog, table or list, adding an async action or loading state, writing labels, errors or empty states, or auditing a screen's UX.
metadata:
  credits:
    - skill: ui-craft
      author: Edu Calvo
      url: "https://github.com/educlopez/ui-craft"
    - skill: web-design-guidelines
      author: Vercel
      organisation: Vercel
      url: "https://github.com/vercel-labs/web-interface-guidelines"
    - skill: impeccable
      author: Paul Bakaus
      url: "https://github.com/pbakaus/impeccable"
    - skill: break-ui
      author: Emil Kowalski
      url: "https://github.com/emilkowalski/skills"
---

# UX

This skill owns what each screen shows, in what order, and how it behaves while the user
acts. It names no component library: its rules hold in any app. How the screen looks, and
which component the project's library gives for each part, belong to `/ui`.

Building a screen invokes both `/ux` and `/ui`. Use `/ux` alone to plan a screen or audit
its UX.

## Steps

### 1. Brief

Before building, write a brief of three to five lines in your reply:

- who arrives, from where, and in what state of mind;
- the one task, as a verb ("grade these submissions", "find the broken deployment"),
  and the **focal element** that serves it;
- realistic content: minimum, typical and maximum;
- what must stay untouched.

Ask only the questions whose answers change the build, two or three at a time. For the
rest, state the assumption in the brief and carry on.

Done when the brief names the task's verb and the focal element.

### 2. States

For every list, table, panel and async action on the screen, name the states it can
reach: loading, each kind of empty, error, partial, degraded, success, offline,
conflict. Design them before the **happy path**. Follow `references/states.md`.

Done when every surface has its states named, and each state has its copy and its next
action.

### 3. Build

Apply the principles below, and load each reference whose condition the work meets
(see [References](#references)). Reach for the app's own component first, then the
component library's; hand-roll only when neither exists, and then own its keyboard and
focus behaviour.

Done when every principle that applies holds, and every rule in each loaded reference
is applied.

### 4. Check

Open the screen in the browser, switch its data menu through every state of
`references/states.md`, and walk the main task one action at a time. At each action, ask:

1. Will users try to achieve the right effect?
2. Will users notice that the correct action is available?
3. Will users link the correct action with the effect they want?
4. After the action, will users see that progress is being made, and where?

Fix every no, then walk again.

Done when every action of the main task gets four yeses in every data state.

## Principles

- **In place.** Feedback for the user's own action appears on the control they used or
  right beside it. The pressed button shows a spinner and keeps its label, then shows
  success in that same button. A field's error sits under that field; a dialog's error
  sits inside the dialog. People miss changes outside the spot they are looking at.
- **Toast for elsewhere.** A toast carries what happened away from the user's focus:
  background work finishing, a system event, an Undo. Anything the user must act on
  also lives somewhere that stays.
- **The result is the message.** When the change is visible where the user looks (the
  edited title, the new row), add no success message. Always report failure.
- **One job per screen.** One primary action per view or section; the rest quieter.
  Frequent things up front, the rest behind disclosure, at most two levels deep.
- **Few things stand out.** Name what must catch the eye: the primary action, a status
  that needs attention, a destructive action. Everything else stays quiet. How it stands
  out is `/ui`'s call, and never by colour alone.
- **Mindless choices.** Write labels so the user's first guess is right. Ask up front
  only what the task needs now, and defer the rest. Give guidance that is brief, timely
  and next to where it is needed.
- **Friction matches blast radius.** Recoverable actions act at once and offer Undo.
  Costly ones confirm with verb buttons and name what is affected. Irreversible or bulk
  ones also ask the user to type the name.
- **No dead ends, no lost work.** Every error and empty state offers a next step. The
  user's input survives every failure.
- **Honest status.** Feedback matches the wait. Loading text names the real operation.
  Progress is real progress, and an outage is said plainly.
- **The control type is the save promise.** A switch, segmented control or single menu
  applies at once. Inputs, checkboxes, radios and selects apply on Save. One form uses
  one model.
- **Explain instead of disabling.** Submit stays enabled and shows what is missing; it
  disables only while the request runs. Read-only shows data the user cannot change;
  hidden is for actions the user has no permission for.
- **Forgive input.** Accept every format that keeps the meaning, normalise it yourself,
  and let the user type freely.
- **Words do the work.** Labels are a verb plus an object ("Save API key"). An action
  keeps its name through the flow ("Publish", then "Published"). One term per concept.
- **Conventions and habits.** The app behaves like the apps users already know. A
  gesture or shortcut that works elsewhere does the same here.
- **Delight last.** Add flourish only once the screen is functional, reliable and
  usable, and less of it where users see it often.

## References

| Reference | Load when |
| --- | --- |
| `references/states.md` | step 2 and step 4 of every build |
| `references/feedback-and-async.md` | an action waits on the network, or the screen shows loading, success or failure |
| `references/forms-and-saving.md` | building or changing a form, a settings page, an inline edit, or anything that saves |
| `references/destructive-and-dialogs.md` | adding a delete, remove or irreversible action, or any modal or side panel |
| `references/layout-and-navigation.md` | building a new page, navigation, filters, bulk actions, shortcuts or onboarding |
| `references/copy.md` | writing or changing any label, button, message or empty state |
| `references/accessibility-behaviour.md` | moving focus, announcing status, disabling or hiding a control, or building a custom interactive element |
| `references/review.md` | reviewing an existing screen or someone else's change for UX |
