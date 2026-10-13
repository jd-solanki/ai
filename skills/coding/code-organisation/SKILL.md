---
name: code-organisation
description: Decide where code lives and what each module hides — the directory tree, module and package boundaries, a module's entry point, and when to split or merge a file. Use when starting a project or directory tree, placing a new file, class or function, grouping code into modules or packages, splitting or merging a module or file, naming directories or files, or auditing a codebase's structure.
---

# Code organisation

## The rule

**Information hiding** (Parnas, 1972): every module owns one **secret**, a design decision
likely to change, and hides it behind an interface smaller than the secret.

A **module** is anything with an interface and an implementation, at any size: an app
slice such as a Nuxt layer or a workspace package, a directory, a file, a class, a
function. The rule is the same at every size; only the zoom changes. Its payoff is
**locality**: a change, a bug, a test, and the context an agent must load all stay inside
one module.

To shape one module's interface (depth, seams, adapters), use `/codebase-design`.

## The four checks

Run them on every module you create, move or audit. A module is done when it passes all
four.

1. **One secret.** Finish "this changes when ___" in domain words, without naming a
   technology. Two answers mean two modules. One answer spread across several modules
   means they are one module.
2. **Deep.** The interface is smaller than what it hides. Deletion test: delete the
   module; if its complexity vanishes instead of reappearing in its callers, it was a
   pass-through, so inline it.
3. **Encapsulated.** Callers and tests reach the secret only through the interface. They
   import the module's entry point, not a file behind it. Interfaces carry domain types,
   so ORM rows, SDK objects and HTTP responses stay inside. No caller needs to know the
   order of internal steps. A test that must reach past the interface means the seam is
   in the wrong place.
4. **Directed.** Dependencies between modules form an acyclic graph and point toward the
   more stable module. Coupling is balanced: the closer two modules sit, the more they may
   know of each other. Files in one module may share internals; separate slices share
   only narrow interfaces.

## Zoom levels

### App: slices

- Slice the app by business capability, one **bounded context** per slice: `auth`,
  `billing`, `email`. Each slice owns its UI, logic, data access and tests. A Nuxt layer,
  a workspace package and a top-level directory are the same move at different tooling
  cost.
- A slice publishes one entry point (layer exports, `index.ts`, a package `exports` map)
  and other slices use only that. A slice owns its tables; other slices ask through its
  interface.
- Inside a slice, keep decisions pure and push I/O to the edge: **functional core,
  imperative shell**. The core is tested without mocks. I/O sits behind **ports and
  adapters** only where two adapters exist; production plus a test double counts.
- One word can mean different things in two slices (`Account` in auth and in billing).
  Give each slice its own model and translate at the interface.
- A **shared kernel** holds only concepts every slice agrees on and that rarely change,
  such as money and ids. Keep it tiny.

### Directory: modules

- Group by feature first, by technical role only inside a feature: the tree should
  scream the domain, not the framework. A slice with its own `components/` and
  `composables/`, as a Nuxt layer has, is this rule; one top-level `components/` holding
  every feature's components breaks it.
- A directory module's entry file is its interface. Every other file in it is private.
- Split by knowledge, not by execution order. `fetch.ts`, `parse.ts` and `save.ts` that
  all know the file format are one secret in three files (**temporal decomposition**).
- When two slices grow similar code, duplicate until a third use shows the real concept
  (**rule of three**). A wrong shared abstraction couples slices; duplication costs only
  typing.

### File, class, function

- Split a file when it holds two secrets; merge files that share one. Size is a reason to
  look, not to split: a long file with one secret behind a small interface is a deep
  module.
- A class exports the least it can. A getter and setter per field publishes its
  representation; give callers the behaviour they need instead (**tell, don't ask**).
- A function's parameters are its interface. A boolean flag that switches behaviour means
  two functions. A parameter that only passes through to a callee leaks the callee's
  secret upward.
- Layout inside a file (newspaper order, stepdown) belongs to `/clean-code`.

## Naming

Name a module for its secret, in the domain's language: `billing/`, `invoice-pdf/`. A
name that needs "and" marks two secrets.

## Placing new code

1. **Name its secret.** Finish "this changes when ___". Done when the answer names a
   domain concept, not a technology.
2. **Find the module that owns that secret.** Check siblings at the slice, directory and
   file zoom, not only the file you are in. Done when you have a home, or have shown none
   exists.
3. **Place it, or create a sibling module** named for the secret, with its entry point.
   Done when its neighbours change on the same trigger as it.
4. **Run the four checks** on every module you touched. Done when all four pass.

## Enforcing boundaries

A boundary held only by discipline erodes. When a boundary matters, propose a **fitness
function** that fails CI on a violation: an import-boundary lint rule
(`eslint-plugin-boundaries`, `dependency-cruiser`, `import/no-cycle`), TypeScript project
references, or a package `exports` map.

## Smells

Each smell is a failed check. Name the secret at stake before moving anything.

| Smell | Failed check | Fix |
| --- | --- | --- |
| **Divergent change**: one module edited for unrelated reasons | One secret | Split by reason |
| **Shotgun surgery**: one change edits many modules | One secret | Gather into one module |
| Layer-first top level: `controllers/`, `services/`, `models/` | One secret | Repackage by feature |
| Generic bucket: `utils/`, `common/`, `helpers/`, `manager` | One secret | Move each item to the module it serves |
| **Feature envy**: code mostly uses another module's data | One secret | Move it to that module |
| **Temporal decomposition** | One secret | Merge by shared knowledge |
| One model shared by slices that mean different things by it | One secret | A model per slice, translated at the interface |
| Pass-through module or wrapper | Deep | Inline it |
| **Classitis**: many tiny modules, each with a wide interface | Deep | Merge into one deep module |
| Deep import: `billing/internal/stripe` | Encapsulated | Import the entry point; widen it if it lacks something |
| Infrastructure type in an interface | Encapsulated | Map to a domain type at the seam |
| Domain code importing the framework, database or UI | Directed | The domain defines a port; infrastructure adapts to it |
| Import cycle | Directed | Move the shared concept into one module or the kernel, or merge |
