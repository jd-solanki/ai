# Setting up project context and landscapes

Every repo gets its own **project context**. Repos connected to each other also share a
**landscape**: one skill, published from a repo outside them and installed into each. The
reasons behind both are in [`context-engineering.md`](./context-engineering.md).

| The repo                                                                  | Follow                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| stands alone                                                              | [Path A](#path-a-project-context)                                     |
| calls, consumes or installs another repo, or another repo does that to it | [Path A](#path-a-project-context), then [Path B](#path-b-a-landscape) |
| already has project context, and a landscape it belongs to exists         | [Path B, step 3](#3-run-setup-landscape), naming only this repo       |

Sharing an organisation is not a connection. A repo that uses nothing from another repo,
and that no other repo uses, stays on Path A.

## Before you start

- Git access to every repo, and `gh` signed in.
- Claude Code or Codex.
- Every command runs from the root of the repo it names.
- The skills CLI runs as `npx skills@latest`. In a repo whose `package.json` has
  `devEngines` naming pnpm, npx refuses to run: use `pnpm dlx skills@latest` instead.
- Always pass `-a universal claude-code`. The copy lands in `.agents/skills/`, which Codex
  reads, and `.claude/skills/` links to it. Left to detect agents, the CLI can take the
  repo's own `skills/` folder for OpenClaw's and link every installed skill into it.
- Commit `.agents/skills/`, `.claude/skills/` and `skills-lock.json`. Teammates, CI and the
  software factory read the committed copy, so only whoever runs `add` needs access to
  the source repo.

## Path A: project context

Once per repo. The example is `~/Projects/acme/orders-api`.

1. Install the context skills:

   ```sh
   cd ~/Projects/acme/orders-api
   npx skills@latest add jd-solanki/ai \
     -s context-engineering setup-project-context audit-project-context domain-modeling link-skills \
     -a universal claude-code -y
   ```

2. Start your agent in the repo root and run `/setup-project-context`. Approve the domains
   it proposes and answer its interview. It writes:
   - `CONTRIBUTING.md`
   - `skills/internal/project-context/SKILL.md`, the router
   - `skills/internal/project-context/glossary.md`
   - `skills/internal/project-context/domains/<domain>.md`
   - the `## Project context` gate in `CLAUDE.md`, or in `AGENTS.md`

   Its report ends with every connection to another repo it found. Keep that list for
   Path B.

3. Run `/link-skills project-context`. It links `skills/internal/project-context/` into
   `.agents/skills/` and `.claude/skills/`.

4. Commit, and open a pull request.

From then on, `/context-engineering <decision>` records a decision, and
`/audit-project-context` runs at the end of every pull request.

## Path B: a landscape

`/setup-landscape` does the work from the landscape's repo: it maps the connections,
publishes the landscape, and opens one draft pull request per member.

### 1. Decide, once

- **Name**: what the repos make together, never who owns them: `acme`, `booking`. The
  skill is `<name>-landscape`.
- **Members**: every repo that is one end of at least one connection, under any owner.
- **Home**: a new repo, `<owner>/<name>-landscape`, owned by whoever keeps the landscape.
  Any repo that is not a member works too. Everyone who installs or refreshes it needs
  read access.

### 2. Create it beside the members

Run Path A in every member that has no project context yet. Then, in the folder that
holds the members:

```sh
cd ~/Projects/acme                  # holds storefront/, orders-api/, billing/
gh repo create acme/acme-landscape --private --clone
cd acme-landscape
npx skills@latest add jd-solanki/ai -s setup-landscape context-engineering domain-modeling -a universal claude-code -y
```

The skills CLI publishes only the landscape from this repo, never the three skills
installed here: `skills-lock.json` lists those as installed.

### 3. Run `/setup-landscape`

From `~/Projects/acme/acme-landscape`:

```sh
claude   # or: codex
```

```text
/setup-landscape acme ../storefront ../orders-api ../billing
```

A member can be `owner/repo` instead of a path. One with no clone beside the landscape
repo gets cloned there.

It stops if a member has no project context, has uncommitted changes, or is off its
default branch. Otherwise it maps the connections, asks you what the code cannot say, and
shows you the landscape. Once you approve, it pushes the landscape and opens a draft pull
request in each member: the landscape installed, its router row, and a fence at that
member's end of each connection. Review and merge those.

In auto mode, Claude Code asks once before it first reads outside this folder, and the
auto-mode classifier reviews its edits in the members. In Manual mode, start it as
`claude --add-dir ..`. Codex asks before each write into a member, unless it is started
with `--add-dir` for each member.

## Keeping it current

Run `/setup-landscape` again from the landscape repo. Every run is the same run: it
catches the landscape up with merged code, and opens a pull request only in a member
whose side changed.

| When                             | Do                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| A connection changes             | The repo that changes it updates its fence in the same pull request. Once that merges, run `/setup-landscape`.                      |
| A repo joins                     | Path A if it has no context, then `/setup-landscape <the repo>`.                                                                    |
| A repo leaves                    | Remove it from the landscape's **Repos**. In the repo, `npx skills@latest remove acme-landscape -y`, then `/audit-project-context`. |
| A repo belongs to two landscapes | Run `/setup-landscape` from each landscape's repo. Each gives the repo its own row.                                                 |

## Example: an organisation landscape

Acme sells online. Four repos sit under the `acme` GitHub organisation:

| Repo                  | Connection                                      | Path      |
| --------------------- | ----------------------------------------------- | --------- |
| `acme/storefront`     | calls the Orders API                            | A, then B |
| `acme/orders-api`     | serves the Orders API, publishes `order.placed` | A, then B |
| `acme/billing`        | consumes `order.placed`                         | A, then B |
| `acme/marketing-site` | none                                            | A only    |

On disk, once both paths are done:

```text
~/Projects/acme/
├── acme-landscape/
│   ├── skills/acme-landscape/SKILL.md          the landscape, edited here only
│   ├── skills-lock.json                         lists the three skills below
│   └── .agents/skills/                          setup-landscape and the two it calls, not published
├── orders-api/
│   ├── CLAUDE.md                                the gate
│   ├── CONTRIBUTING.md
│   ├── skills-lock.json                         lists acme-landscape
│   ├── .agents/skills/acme-landscape/SKILL.md   installed copy, never edited
│   ├── .claude/skills/acme-landscape            → ../../.agents/skills/acme-landscape
│   └── skills/internal/project-context/
│       ├── SKILL.md                             the router, with the acme-landscape row
│       ├── glossary.md
│       └── domains/orders.md                    a fence naming acme-landscape
├── storefront/                                  the same shape as orders-api
├── billing/                                     the same shape as orders-api
└── marketing-site/                              project context only, no landscape
```

`acme-landscape/skills/acme-landscape/SKILL.md`:

```markdown
---
name: acme-landscape
description: The acme landscape — the repos behind the Acme shop, how they connect, and the words they share.
disable-model-invocation: true
---

# Acme landscape

A customer places an Order on the storefront, orders-api keeps it, and billing invoices it.

## Repos

| Repo              | Owns                                          |
| ----------------- | --------------------------------------------- |
| `acme/storefront` | the shop a customer browses and checks out in |
| `acme/orders-api` | Orders, from placement until fulfilment       |
| `acme/billing`    | Invoices, and collecting their payment        |

## Connections

- **Orders API**: `acme/orders-api` → `acme/storefront`, over an API. `acme/orders-api`
  owns its shape. A removed or renamed field breaks checkout; add fields, and remove one
  only after storefront stops reading it.
- **`order.placed`**: `acme/orders-api` → `acme/billing`, over an event.
  `acme/orders-api` owns its shape. billing invoices from it, so a breaking change ships
  as `order.placed.v2` beside the old event until billing moves.

## Words

**Order**:
A customer's request to buy, from placement until it is fulfilled or cancelled.
_Avoid_: purchase, cart

**Invoice**:
A request for payment for one Order, raised by billing.
_Avoid_: bill, receipt
```

The row in each member's router:

```markdown
| `.agents/skills/acme-landscape/SKILL.md` | changing or using a connection to another repo |
```

The fence at orders-api's end, in `domains/orders.md`:

```markdown
- **`order.placed` is read outside this repo.** A breaking change stops invoicing. Who
  reads it, and how a change ships: `acme-landscape`.
  `src/events/order-placed.ts:publishOrderPlaced`
```

The fence at billing's end, in `domains/invoicing.md`:

```markdown
- **`order.placed` is not ours.** orders-api owns its shape; reading a field it does not
  promise breaks on their next release. `acme-landscape` lists what it promises.
  `src/consumers/order-placed.ts:handleOrderPlaced`
```

## Example: a landscape across owners

A booking product built by two owners: the web app sits on your personal account, the API
in a client's organisation.

| Repo                     | Owner      | Connection             |
| ------------------------ | ---------- | ---------------------- |
| `jd-solanki/booking-web` | you        | calls the Booking API  |
| `clientco/booking-api`   | the client | serves the Booking API |

The steps are the organisation example's. What differs:

- **Name** it after the product, `booking`, never an owner: the landscape outlives
  whoever hosts it.
- **Home** it under whoever keeps it, and give everyone who installs it read access. Make
  it public instead when nothing in it is private:

  ```sh
  mkdir -p ~/Projects/booking && cd ~/Projects/booking
  gh repo create jd-solanki/booking-landscape --private --clone
  gh api -X PUT repos/jd-solanki/booking-landscape/collaborators/<their-github-user> -f permission=pull
  ```

- **Run** it with both members as `owner/repo`. It clones each beside the landscape repo,
  though GitHub keeps them under different owners:

  ```text
  /setup-landscape booking jd-solanki/booking-web clientco/booking-api
  ```

- **Push**: with no write access to `clientco/booking-api`, its branch stays local and
  the report names it. Push it from a fork, or hand it to the client.
- **Keep**: once a change to the Booking API merges in `clientco/booking-api`, the
  landscape's keeper runs `/setup-landscape` again.
