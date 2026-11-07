#!/usr/bin/env bash
# usage: wait-ci.sh <owner/repo> <head-sha> <since: ISO 8601 UTC> [minutes=45]
# Waits for the GitHub Actions workflow runs on <head-sha> created at or after <since>, and only
# those: an older head's runs and commit statuses count for nothing. A run still queued is pending,
# and the result must hold across two polls, since a workflow can register late.
# exit 0: green, every job success, skipped or neutral.   1: red; prints the failed jobs and steps.
#      4: no workflow run started within 5 minutes.   5: timed out.
#      9: a job never started (billing, spending limit); prints GitHub's reason.
set -uo pipefail
repo=$1 sha=$2 since=$3 start=$(date +%s) deadline=$(( $(date +%s) + ${4:-45} * 60 )) settled=0
runs() { gh api "repos/$repo/actions/runs?head_sha=$sha&per_page=100" \
  --jq "[.workflow_runs[] | select(.created_at >= \"$since\")]"; }
while [ "$(date +%s)" -lt "$deadline" ]; do
  # A failed API call says nothing about CI: poll again.
  r=$(runs) || { settled=0; sleep 20; continue; }
  if [ "$(jq length <<< "$r")" = 0 ]; then
    [ $(( $(date +%s) - start )) -ge 300 ] && { echo "no workflow run on $sha since $since"; exit 4; }
    settled=0; sleep 20; continue
  fi
  if [ "$(jq '[.[] | select(.status != "completed")] | length' <<< "$r")" != 0 ]; then
    settled=0; sleep 20; continue
  fi
  settled=$(( settled + 1 )); [ "$settled" -lt 2 ] && { sleep 20; continue; }
  status=0
  for id in $(jq -r '.[].id' <<< "$r"); do
    jobs=$(gh api "repos/$repo/actions/runs/$id/jobs?per_page=100" --jq .jobs) || { settled=0; sleep 20; continue 2; }
    unstarted=$(jq -r '.[] | select(.conclusion == "failure" and (.steps | length) == 0) | .name' <<< "$jobs")
    if [ -n "$unstarted" ]; then
      echo "never started: $unstarted"
      gh api "repos/$repo/check-runs/$(jq -r '[.[] | select((.steps | length) == 0)][0].id' <<< "$jobs")/annotations" \
        --jq '.[].message' 2>/dev/null
      exit 9
    fi
    jq -r '.[] | select(.conclusion | IN("success", "skipped", "neutral") | not)
      | "failed: \(.name) → \([.steps[] | select(.conclusion == "failure") | .name] | join(", "))"' <<< "$jobs" \
      | grep . && status=1
  done
  exit "$status"
done
echo "CI on $sha not finished within ${4:-45} minutes"; exit 5
