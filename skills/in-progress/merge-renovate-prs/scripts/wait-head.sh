#!/usr/bin/env bash
# usage: wait-head.sh <owner/repo> <number> <old-head-sha> [minutes=20]
# Waits for Renovate to rebuild a pull request after its rebase checkbox was ticked.
# exit 0: the head changed.   3: the pull request is no longer open (merged or closed).
#      4: Renovate cleared the checkbox and pushed nothing.   5: timed out.
set -uo pipefail
repo=$1 number=$2 old=$3 deadline=$(( $(date +%s) + ${4:-20} * 60 )) cleared_at=0
while [ "$(date +%s)" -lt "$deadline" ]; do
  read -r state head < <(gh pr view "$number" -R "$repo" --json state,headRefOid -q '"\(.state) \(.headRefOid)"')
  [ "$state" != OPEN ] && { echo "#$number is $state"; exit 3; }
  [ "$head" != "$old" ] && { echo "#$number rebuilt: $head"; exit 0; }
  if gh pr view "$number" -R "$repo" --json body -q .body | grep -qF -- '- [ ] <!-- rebase-check -->'; then
    # Renovate may untick a moment before it pushes, so a cleared box counts after a minute.
    [ "$cleared_at" = 0 ] && cleared_at=$(date +%s)
    [ $(( $(date +%s) - cleared_at )) -ge 60 ] && { echo "#$number: checkbox cleared, head unchanged"; exit 4; }
  fi
  sleep 15
done
echo "#$number: no rebuild within ${4:-20} minutes"; exit 5
