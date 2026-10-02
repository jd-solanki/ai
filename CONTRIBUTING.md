# Contributing

## What this is

A library of AI agent skills, published for installation into other repositories
through the skills CLI. Most are written for my own projects first and generalised
once they have survived real work.

[cl-factory](https://github.com/jd-solanki/cl-factory) is the software factory these skills
are written for: it starts its pipeline's skills as background Claude Code sessions, so a
change to how a skill is launched or run lands in both repositories.

## Status

Working and installed in real projects. `skills/in-progress/` is the incubator: a
skill there is still moving and may change shape without notice. Everything outside it
has been used on real work and settled.

## Conventions

Every rule about this repo lives in `/project-context`. Invoke it.

## How to contribute

- Work lands straight on `main`. One commit per skill.
- Write a skill with `/writing-for-agents`.
