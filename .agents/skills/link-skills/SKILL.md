---
name: link-skills
description: Symlink one or more skills in skills/ into every agent skills directory in this repo.
argument-hint: "[skill names]"
disable-model-invocation: true
---

Symlink each named `skills/<category>/<name>` into each agent skills directory found by `find . -maxdepth 2 -mindepth 2 -type d -name skills -not -path './skills*'` — one `ln -s ../../skills/<category>/<name> <agent-skills-dir>/<name>` per skill per directory — then read `SKILL.md` through every new link to confirm it resolves.
