#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
lock="$tmp/cua.lock"
CUA_DRIVER_LOCK_FILE="$lock" CUA_DRIVER_LOCK_TIMEOUT_SEC=1 "$ROOT/bin/cua-singleton.sh" sh -c 'sleep 2' &
pid=$!
sleep 0.2
set +e
CUA_DRIVER_LOCK_FILE="$lock" CUA_DRIVER_LOCK_TIMEOUT_SEC=1 "$ROOT/bin/cua-singleton.sh" true >/dev/null 2>&1
status=$?
set -e
[ "$status" -eq 75 ]
wait "$pid"
CUA_DRIVER_LOCK_FILE="$lock" CUA_DRIVER_LOCK_TIMEOUT_SEC=1 "$ROOT/bin/cua-singleton.sh" true
printf 'cua-singleton tests passed\n'
