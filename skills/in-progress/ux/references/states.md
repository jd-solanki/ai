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

A table's or list's default empty text, such as "No data", is never the right kind:
replace it.

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

## Data menu

Every screen that renders data gets a dev-only data menu, which holds the screen in one
data state at a time. `/ux` walks the task through it in step 4; `/ui` captures every
option on every device.

| Option | Data |
| --- | --- |
| `live` | The screen's real data. The default. |
| `typical` | A fixture with normal content. |
| `worst` | A fixture with the worst-case data below. |
| `empty` | A fixture for the screen's likeliest empty kind. |
| `loading` | Held in loading, never resolving. |
| `error` | A request that fails. |

- Feed each option through the same fetch or prop as the real data: change the data,
  not the component.
- Keep the option in the URL, `?data=<option>`, so a reload or a shared link holds it.
- Render the menu only in the dev build, and mark it `data-dev-tool`, so screenshots
  leave it out.
- The menu and its fixtures stay with the screen for good, for every later check.

## Worst-case data

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
- Relative times switch to an absolute date after about seven days.

How each value wraps or truncates is `/ui`'s.
