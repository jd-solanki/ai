# Copy

Interface text is part of the interface. Write it while building, not after.

## Labels and buttons

- A verb plus an object, two to four words, in sentence case: "Save API key", "Add
  member", "Delete project". Submit, OK, Continue and Done say nothing about the result.
- Add the object whenever it is unclear what changes.
- Use the user's words: "notifications", not "webhook config".
- Write each label so the user's first guess about it is right.
- End a label with an ellipsis when it opens more input ("Rename…"), and in progress
  states ("Saving…").
- Links say where they go; "Read more" alone says nothing.

## One name per thing

- An action keeps its name through the flow: the "Publish" button leads to a
  "Published" message.
- One term per concept across the app. Before adding a label, search the codebase for
  the verbs and nouns already in use, and reuse them.
- Add, Remove, Delete, Clear, Reset and Cancel each mean one thing:
  - Add puts an existing item into a list.
  - Remove takes it out without destroying it.
  - Delete destroys it.
  - Clear empties a field or selection.
  - Reset returns to the last saved state.
  - Cancel stops the current action and closes it.

## Errors

- Say what happened, why, and what to do: "Your API key is incorrect or expired.
  Generate a new key in your account settings."
- Put the most likely cause or simplest fix first; add a backup in the next sentence if
  needed.
- When the cause is unknown, say that something went wrong and what the user can do.
- Write instructions: "Enter your first name", not "First name must have an entry".
- Neutral and direct: leave out "please", "sorry", "oops", "invalid", "illegal" and
  anything that blames the user.
- Keep error codes for support, not the message; keep infrastructure details out.
- One or two sentences; two lines at most under a field.

## Success

- Say what happened, and link to the result: "Project created. View project".
- Past tense of the button's verb, without "Success!", "successfully" or exclamation
  marks.
- The more often a message appears, the shorter and plainer it is.

## Each message

- Decide the one fact the user needs now, the action available next, any context that
  changes the decision, and the tone.
- If the heading already explains the state, the body adds new information or goes.
- Each piece of text does one job.

## Waits

- Name the real operation: "Importing 1,240 contacts", not "Loading".
- For long waits, give an honest duration: "Usually 20–40 seconds".
- Use the present continuous for in-progress text: "Saving…".

## Empty states

- A title that states the purpose ("Invite your team") or the problem ("No results for
  these filters").
- A line on what to do next, adding to the title, not repeating it.
- One primary action. An image alone does not explain the state.

## Tone

| Context | Tone |
| --- | --- |
| Success | Restrained |
| Error | Calm, specific, helpful |
| Destructive | Explicit about consequences |
| Waiting | Honest about duration |
| First use | Welcoming, brief |

## Length

Cut the words, then cut again. Users scan, and concise, scannable text measured far
more usable. Drop welcome text and instructions that restate the obvious.

## Honest choices

Offer choices plainly. "No thanks" is a neutral phrase, cancelling is as easy as
signing up, and every opt-in starts unticked.

## Placement

Put text the user needs before acting above the action. Text placed after a confirm
button may never be reached by a screen-reader user.
