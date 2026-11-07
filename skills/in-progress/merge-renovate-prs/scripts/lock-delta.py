#!/usr/bin/env python3
"""Summarise what a pnpm lockfile change moves, for lock file maintenance's plan row.

usage: lock-delta.py <base-ref> <head-ref>      (run inside a clone that has both refs)

Prints the direct dependencies it moves (catalog or workspace entries), the transitive packages it
moves to a new major, the packages left with fewer copies, and counts. A direct move whose version
no reviewed pull request carries reaches the base unreviewed: flag it in the plan.
"""
import re, subprocess, sys
from collections import defaultdict

def lockfile(ref):
    return subprocess.run(['git', 'show', f'{ref}:pnpm-lock.yaml'],
                          check=True, capture_output=True, text=True).stdout.splitlines()

def parse(lines):
    direct, installed = defaultdict(set), defaultdict(set)
    section, names = None, {}
    for line in lines:
        if line and not line[0].isspace():
            section = line.rstrip(':')
            continue
        indent = len(line) - len(line.lstrip())
        text = line.strip()
        if section == 'packages' and indent == 2 and text.endswith(':'):
            key = text[:-1].strip("'")
            name, _, version = key.rpartition('@')
            installed[name].add(version)
        elif section in ('catalogs', 'importers'):
            if text.startswith('version:'):
                version = text.split(':', 1)[1].strip().strip("'").split('(')[0]
                name = names.get(indent - 2)
                if name and not version.startswith(('link:', 'file:')):
                    direct[name].add(version)
            elif text.endswith(':'):
                names[indent] = text[:-1].strip("'")
    return direct, installed

def major(version):
    return re.split(r'[.+-]', version)[0]

(base_direct, base), (head_direct, head) = parse(lockfile(sys.argv[1])), parse(lockfile(sys.argv[2]))
moved = sorted(n for n in base.keys() | head.keys() if base.get(n) != head.get(n))
direct = sorted(n for n in base_direct.keys() | head_direct.keys() if base_direct.get(n) != head_direct.get(n))
show = lambda vs: ', '.join(sorted(vs)) or 'none'

print(f'packages moved: {len(moved)}  (added {sum(n not in base for n in moved)}, '
      f'removed {sum(n not in head for n in moved)})')
print('direct dependencies moved:')
for n in direct:
    print(f'  {n}: {show(base_direct.get(n, set()))} → {show(head_direct.get(n, set()))}')
print('  none' if not direct else '', end='')
majors = [n for n in moved if n in base and n in head and n not in direct
          and {major(v) for v in head[n]} - {major(v) for v in base[n]}]
print('transitive new majors:')
for n in majors:
    print(f'  {n}: {show(base[n])} → {show(head[n])}')
print('  none' if not majors else '', end='')
fewer = [n for n in moved if n in head and len(head[n]) < len(base.get(n, ()))]
print(f'fewer copies: {", ".join(fewer) or "none"}')
