# The software factory splits into layers, each with one adapter per factory

The factory was built around herdr as the app a session runs in, and the owner now moves
between session hosts: herdr, then Orca for a while. So the factory names two layers, the
intake and the session host. Each factory runs one adapter per layer, chosen by its owner in
that factory's configuration, so two machines can run different ones. GitHub, as tracker and
state store, and Claude Code, as the harness, stay fixed: nobody wants a second one, and
swapping either rewrites the labels, the pipeline and how a run ends.

Decided 2026-10-29. The research is `research/software-factory-layers.md` and
`research/herdr-orca-t3code.md`.

## Considered options

- **Several adapters of one layer at once.** Rejected. Two intakes deliver one label event
  twice, and a claim is a label swap, not a lock, so both deliveries start a run. Two session
  hosts split the one place the owner watches runs.
- **The session host taking a launch request instead of the `claude` command**, so that T3
  Code fits. Rejected for now. T3 Code starts Claude only through its own SDK integration,
  creates the worktrees itself, and takes no per-run settings to carry the run's hooks and
  token. A run's end would then have to come from each host. Herdr and Orca both type the
  command as static code builds it.
- **The words.** Layer and adapter, as Symphony uses them. Rejected: slot and plugin (herdr
  and Claude Code plugins already exist here), port (the server's port), and provider (T3
  Code's word for an agent CLI, and Gas City gives it three meanings). "Session host", not
  "agent runner": Claude Code runs the session, and the host only holds it where the owner
  can watch.
