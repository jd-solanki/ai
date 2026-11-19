# Unhappy paths

The kinds of run where a behaviour goes other than planned. Check each kind against the change:
keep the ones the change can break.

| Kind | Paths |
| --- | --- |
| Input | invalid data; boundaries: 0, 1, the max, one past the max; very long text; emoji and right-to-left text; a pasted huge value |
| Double actions | a double-click on submit; the same request sent twice; a retry after a half-done write |
| Access | a session that expires mid-flow; no permission (403); not found (404), kept apart from 403; another user's record opened by its ID |
| Network | a slow reply; a timeout; a 5xx; a 429 rate limit; a reply in the wrong shape; offline; a third-party service that is down |
| Concurrency | two tabs edit one record; stale data; webhooks that arrive twice or out of order |
| Navigation | the back button; a refresh mid-flow; a deep link opened directly |
| Data | first use with no data; each empty state; a huge list; old data after a migration |
| Environment | a missing env var; another timezone or locale; a daylight-saving change |
| Cancel mid-action | the tab closed during an upload; Stop or Cancel pressed while it runs |
| Limits | a file that is too big; a quota that is used up; a full disk |
