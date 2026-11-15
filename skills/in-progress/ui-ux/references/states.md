# States

Every list, table, panel and async action reaches more states than the happy path.
Name each one, give it copy and a next action, and build it before the happy path.

## The states

| State | Build it as |
| --- | --- |
| Loading | See `feedback-and-async.md` for timing and placement. |
| Empty | Pick the kind below; each kind has its own copy and action. |
| Error | What failed, in plain words, and a way forward: Retry, a fix, or help. Keep the user's input. |
| Partial | Show what loaded. Put a retryable error on the failing tile or row only. |
| Degraded | Data exists but a service failed. See [Degraded](#degraded). |
| Success | Often the result itself. See `feedback-and-async.md`. |
| Offline | Say the connection is gone; keep the screen and the user's input; retry on reconnect. |
| Conflict | Someone else changed it. Show both versions or the newer one, and let the user choose. |

Tell failures apart; each gets its own words and next step:

- offline;
- no permission (403): name who can grant access;
- not found (404): kept separate from no permission;
- our fault (500): a copyable support ID and Retry.

## Empty kinds

| Kind | Title | Action |
| --- | --- | --- |
| First use | What this place is for, in a welcoming way | Start creating; a template or smart default beats a blank slate |
| Filtered or searched, no match | No results for these filters | Clear filters, or widen the search; offer spelling fixes or popular queries |
| Cleared (inbox zero) | Done | Often none |
| No permission | Who can grant access | Request access |
| Failed to load | What could not load | Retry or get help; a muted alert icon, no playful art |

A filtered empty state that says "create your first record" to a user with 4,000
records reads as broken. Match the kind to the cause.

Build empty states with `UEmpty` (`title`, `description`, `icon`, `actions`). `UTable`'s
default empty text is "No data": replace it through its empty slot with the right kind.

## Degraded

When a service fails but the user's data exists:

- Say the content is unavailable, or remove the whole section and its heading. A
  generic empty state makes users think their data was deleted.
- Split the page into primary content (the page is useless without it: show an error
  page) and secondary content (counts, badges, side panels: render without it, or with
  a small inline error).
- Hide a count or badge whose data is missing; a "0" would be false.
- Keep the global navigation; hide only the single link that failed.
- Keep critical controls such as Submit and the comment box. Remove non-critical ones,
  and remove the trigger of a hovercard or dialog whose content failed.
- Keep a page to about five outage messages; more makes it feel broken.
- Say plainly that something is wrong.

## Worst-case data

Use it in step 4, and whenever a component renders data.

- Put a dev-only "Demo data / Worst case" toggle on the screen, and feed the worst case
  through the same fixture or prop as the demo data. Change the data, not the component.
- Take each value from a real naming pattern or the validation schema's limit. A field
  with no limit is a finding.
- Cover:
  - 0 items, exactly 1 item (pluralisation: "1 members"), and 1,000+ items;
  - long names (`Aleksandra Wiśniewska-Kowalczyk`), short ones (`Jo`), RTL text and
    emoji-first names;
  - unbreakable emails, URLs and hashes, and translated labels;
  - numbers such as `0`, `-42.5` and `NaN`;
  - missing optional fields and broken avatars;
  - every status at once, and the current user in the list;
  - touch: every hover-only action needs a tap or keyboard path.
- Choose per field:
  - wrap names and titles the user needs to identify something;
  - end-truncate secondary metadata, with a way to see the full value;
  - middle-truncate file names, emails, paths and hashes, whose ends tell them apart;
  - clamp card previews;
  - show numbers, amounts and dates in full, always.
- Relative times switch to an absolute date after about seven days.
- When a break has more than one right fix, report it as a decision for the user
  instead of picking one.
