#!/usr/bin/env bash
# Serialize access to a real desktop. One writer per desktop is the safe default.
set -euo pipefail
[ "$#" -gt 0 ] || { printf 'usage: cua-singleton.sh <command> [args...]\n' >&2; exit 64; }
lock="${CUA_DRIVER_LOCK_FILE:-/tmp/emdash-cua-driver.lock}"
timeout="${CUA_DRIVER_LOCK_TIMEOUT_SEC:-900}"
if command -v flock >/dev/null 2>&1; then
  exec 9>"$lock"
  flock -w "$timeout" 9 || { printf 'cua-singleton: desktop lane busy\n' >&2; exit 75; }
  exec "$@"
fi

# macOS/dev fallback: atomic mkdir lock. Ubuntu runners use flock above.
lockdir="${lock}.d"
deadline=$(( $(date +%s) + timeout ))
while ! mkdir "$lockdir" 2>/dev/null; do
  [ "$(date +%s)" -lt "$deadline" ] || { printf 'cua-singleton: desktop lane busy\n' >&2; exit 75; }
  sleep 1
done
trap 'rmdir "$lockdir" 2>/dev/null || true' EXIT INT TERM
"$@"
