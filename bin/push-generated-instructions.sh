#!/usr/bin/env bash
set -euo pipefail

ref=${1:?Pass the target Git ref}
expected=${2:?Pass the validated source SHA}

case "$ref" in
  refs/heads/main | refs/heads/master) ;;
  *)
    printf 'Unsupported generated-instruction target: %s\n' "$ref" >&2
    exit 1
    ;;
esac

source=$(git rev-parse HEAD)
if [[ $source != "$expected" ]]; then
  printf 'Generated instructions checkout does not match validated source %s\n' "$expected" >&2
  exit 1
fi

if git diff --cached --quiet; then
  printf 'Generated instructions unchanged at %s\n' "$source"
  exit 0
else
  diff_status=$?
  if ((diff_status != 1)); then
    exit "$diff_status"
  fi
fi

git -c user.name='github-actions[bot]' -c user.email='github-actions[bot]@users.noreply.github.com' \
  commit -m 'chore: sync cross-platform rule files [skip ci]'
git push origin "HEAD:$ref"
printf 'Published generated instructions %s from %s\n' "$(git rev-parse HEAD)" "$source"
