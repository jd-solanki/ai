"""Timeline of one review-pr run: python3 timeline.py <session.jsonl>"""
import glob, json, os, sys
from datetime import datetime

def ts(s): return datetime.fromisoformat(s.replace('Z', '+00:00'))

main = sys.argv[1]
t0 = None; rows = []
for line in open(main):
    try: e = json.loads(line)
    except ValueError: continue
    if not e.get('timestamp'): continue
    t = ts(e['timestamp']); t0 = t0 or t
    m = e.get('message') or {}; c = m.get('content')
    if e.get('type') == 'assistant' and isinstance(c, list):
        for b in c:
            if b.get('type') == 'tool_use' and b['name'] in ('Workflow', 'Write', 'Agent'):
                rows.append((t, 'carrier ' + b['name'] + ' ' + str(b['input'].get('file_path') or b['input'].get('scriptPath') or '')[-60:]))
    if e.get('type') == 'user' and isinstance(c, str) and '<task-notification>' in c:
        rows.append((t, 'carrier notified: ' + ('workflow done' if 'workflow' in c.lower() else 'task done')))
end = t
print(f'start {t0:%H:%M:%S}  end {end:%H:%M:%S}  total {(end - t0).total_seconds() / 60:.1f} min')
for t, what in rows: print(f'  +{(t - t0).total_seconds() / 60:5.1f}  {what}')
print('agents:')
agents = []
for meta in glob.glob(os.path.splitext(main)[0] + '/subagents/**/*.meta.json', recursive=True):
    d = json.load(open(meta)); p = meta.replace('.meta.json', '.jsonl')
    first = last = None; calls = 0; models = set(); efforts = set()
    for line in open(p):
        try: e = json.loads(line)
        except ValueError: continue
        if e.get('timestamp'): first = first or ts(e['timestamp']); last = ts(e['timestamp'])
        m = e.get('message') or {}
        if e.get('type') == 'assistant':
            if m.get('model'): models.add(m['model'].replace('claude-', ''))
            calls += sum(1 for b in (m.get('content') or []) if isinstance(b, dict) and b.get('type') == 'tool_use')
        if e.get('effort'): efforts.add(e['effort'])
    agents.append((first, last, d.get('description'), calls, '/'.join(sorted(models)), '/'.join(sorted(efforts))))
for first, last, label, calls, model, effort in sorted(agents):
    print(f'  +{(first - t0).total_seconds() / 60:5.1f} → +{(last - t0).total_seconds() / 60:5.1f}  {(last - first).total_seconds() / 60:5.1f} min  {calls:3d} calls  {model:12s} {effort:7s} {label}')
