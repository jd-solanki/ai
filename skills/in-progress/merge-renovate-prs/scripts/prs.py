#!/usr/bin/env python3
"""List a repository's open Renovate pull requests and the updates each carries.

usage: prs.py <owner/repo> [<number>...]

One block per pull request: number, draft or ready, head SHA, branch, title, then one line per
update row of its body: package, the range change, and the installed versions Renovate measured
from and to (from its diff link). Compare these lines with the approved plan.
"""
import json, re, subprocess, sys

repo, wanted = sys.argv[1], set(sys.argv[2:])
prs = json.loads(subprocess.run(
    ['gh', 'pr', 'list', '-R', repo, '--author', 'app/renovate', '--state', 'open', '--limit', '100',
     '--json', 'number,isDraft,headRefOid,headRefName,title,body'],
    check=True, capture_output=True, text=True).stdout)

link_text = re.compile(r'\[([^\]]+)\]\([^)]*\)')
diff = re.compile(r'renovatebot\.com/diffs/npm/([^/]+)/([^/]+)/([^/)\s]+)')
for pr in sorted(prs, key=lambda p: p['number']):
    if wanted and str(pr['number']) not in wanted:
        continue
    state = 'draft' if pr['isDraft'] else 'READY'
    print(f"#{pr['number']} {state} {pr['headRefOid'][:12]} {pr['headRefName']}  {pr['title']}")
    for line in pr['body'].splitlines():
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) < 2 or '→' not in cells[1]:
            continue
        package = link_text.sub(r'\1', cells[0]).split(' (')[0]
        change = link_text.sub(r'\1', cells[1]).replace('`', '')
        installed = diff.search(line)
        moved = f"  installed {installed.group(2)} → {installed.group(3)}" if installed else ''
        print(f"    {package}: {change}{moved}")
