---
name: call-report
description: Turn a call transcript into an HTML call report — a task list on top, then the call as a timeline of topics.
argument-hint: "<transcript path>"
disable-model-invocation: true
---

# Call Report

A call drifts through updates, topics, decisions and side talk in any order. The
**call report** lays it out as a timeline the reader can act on: one section per
topic, in the order it was spoken, and one task list on top gathering every task
the call produced.

Transcripts are machine-made and wrong in places. Read past the words to what was
meant, and say how sure you are.

## Process

### 1. Read the transcript

Ask for the transcript path when the user has not given one. Read all of it.

Look in the transcript's folder for the recording it came from (a video or audio
file). With one, every topic's start time becomes a link into it.

Learn who is speaking. Speaker labels in a recorded call are often unreliable: one
speaker's audio bleeds into another's track, so a line can appear twice under
two labels. Attribute lines from context when the labels disagree with it.

**Done when:** you have read every line, and you know each speaker's name or role
and whether the labels can be trusted.

### 2. Learn the call's context

A transcript mishears domain words: product names, codenames, people, services.
Learn the context the speakers share so you read those words right. The codebase
you are invoked from is the call's project:

- Invoke `/project-context` when the project has it, and load the references for
  every domain the call touches. Otherwise read its `AGENTS.md` or `CLAUDE.md` and
  its glossary or domain docs.
- Read its recent commits, on every branch, from shortly before the call to now:
  what was built, what was in flight, and what the speakers were reacting to.
- Do the same for each other repo the call names, when it is on this machine.

Ask the user which projects the call covers when the call strays past the one you
are in and you cannot find the others. Context sharpens your reading; the report
states what was said, and leaves the state of the code out.

**Done when:** every proper noun and domain term in the transcript either maps to
something you found or is marked unknown.

### 3. Cut the call into topics

Walk the transcript from start to end and cut it wherever the subject changes. A
subject that returns later is a new topic at its new time, with a link back to the
first one. Side talk, small talk and stretches the transcription garbled are topics
too: keep them, short.

Give each topic:

- **from–to**: the timestamps it spans.
- **title**: what it is about, in a few words.
- **confidence**: a percentage, how sure you are of what was said in this stretch.
  Low for crosstalk, garbled audio and guessed speakers; high where speakers
  repeat and agree.
- **summary**: what was said and meant, attributed to speakers.
- **decisions**: what was settled, where anything was.
- **tasks**: the concrete work the topic created, each one a separate checkable
  item.
- **urgency**: for topics with tasks, from what the speakers said about priority.
- **notes**: anything else worth a label: an outcome, an interruption, where the
  topic continues.

Refer to people by the names the transcript gives, and as "they" where the
transcript does not say otherwise.

**Done when:** every minute of the call sits in exactly one topic.

### 4. Gather the task list

Collect the topic tasks into one list, one task per piece of work, ordered by
urgency (most urgent first). When one piece of work spans several topic tasks,
make them its `steps`, each keeping the topic it came from. Give each task an
owner and the topic it came from. Parked and unclear items get tasks too, so
nothing said in the call goes missing.

Write each task as a **brief**: an agent told "finish task #3 from the report"
starts from it. State the work as an instruction in the project's domain
terms, and carry every bound the call set on it: constraints, examples, and what
is left for the agent to propose. "Let operators add a note to a DDI Order, and
propose where to show it" is a brief; "Propose note options; Muli picks" is a
minute.

**Done when:** every topic task is a task or a step of one, every task links to a
topic, and every task reads as a brief.

### 5. Write the report

Copy [`template.html`](template.html) to `call-report.html` beside the transcript.
Fill in the marked constants: the title, the intro, the recording and transcript
paths, `tasks` and `topics`. Replace the sample entries; keep the app code as it is.

The intro is one or two sentences on how far to trust the transcript: label
reliability, speakers talking to people off the call, garbled stretches.

Check the script parses, then open the report in the default browser.

**Done when:** the report opens, and it shows every task and topic from steps 3
and 4.

Tell the user the report's path and what lowered your confidence most.
