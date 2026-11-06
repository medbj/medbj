#!/usr/bin/env bash
# Build and copy static files to an already-provisioned SSH host.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: TARGET_HOST=host TARGET_USER=user TARGET_PATH=/var/www/site ./deploy/deploy.sh [--dry-run]
Requires npm, ssh, rsync, a configured SSH key, and an existing writable destination.
Files are never deleted by default. Set DEPLOY_DELETE=1 only for a dedicated site directory.
Build, site, and public launch checks run before transfer. ALLOW_PREVIEW_DEPLOY=1
is an explicit operator confirmation of a private preview target; it skips only
the public launch gate. Never use that override for a public destination.
USAGE
}

if [[ ${1:-} == --help ]]; then usage; exit 0; fi
if [[ $# -gt 1 || ( $# -eq 1 && $1 != --dry-run ) ]]; then usage >&2; exit 2; fi
: "${TARGET_HOST:?Set TARGET_HOST to the SSH host}"
: "${TARGET_USER:?Set TARGET_USER to the SSH user}"
: "${TARGET_PATH:?Set TARGET_PATH to an existing absolute site directory}"

[[ $TARGET_HOST =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]] || { echo 'TARGET_HOST must be a hostname or IPv4 address.' >&2; exit 2; }
[[ $TARGET_USER =~ ^[a-zA-Z_][a-zA-Z0-9_-]*$ ]] || { echo 'Invalid TARGET_USER.' >&2; exit 2; }
[[ $TARGET_PATH =~ ^/[a-zA-Z0-9_./-]+$ ]] || { echo 'TARGET_PATH must be an absolute path without spaces or shell characters.' >&2; exit 2; }
TARGET_PATH=${TARGET_PATH%/}
[[ /$TARGET_PATH/ != */../* && /$TARGET_PATH/ != */./* && $TARGET_PATH != *//* ]] || { echo 'TARGET_PATH must not contain dot segments or repeated slashes.' >&2; exit 2; }
case "$TARGET_PATH" in
  ''|/|/var|/var/www|/srv|/home|/opt|/tmp|/root|/etc|/etc/*|/usr|/usr/*|/bin|/bin/*|/sbin|/sbin/*|/boot|/boot/*|/dev|/dev/*|/proc|/proc/*|/sys|/sys/*|/lib|/lib/*|/lib64|/lib64/*)
    echo 'Refusing an unsafe or shared top-level destination. Choose a dedicated site directory.' >&2; exit 2 ;;
esac
[[ ${DEPLOY_DELETE:-0} == 0 || ${DEPLOY_DELETE:-0} == 1 ]] || { echo 'DEPLOY_DELETE must be 0 or 1.' >&2; exit 2; }
[[ ${ALLOW_PREVIEW_DEPLOY:-0} == 0 || ${ALLOW_PREVIEW_DEPLOY:-0} == 1 ]] || { echo 'ALLOW_PREVIEW_DEPLOY must be 0 or 1.' >&2; exit 2; }

for dependency in npm ssh rsync; do
  command -v "$dependency" >/dev/null || { echo "Missing required command: $dependency" >&2; exit 1; }
done
project_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd -- "$project_root"
npm run build
[[ -f dist/index.html && -d dist/pagefind ]] || { echo 'Build output or Pagefind index is missing.' >&2; exit 1; }
npm run check:site
if [[ ${ALLOW_PREVIEW_DEPLOY:-0} == 1 ]]; then
  echo 'Operator confirmed a private preview destination; skipping only the public launch gate.'
else
  npm run check:launch
fi

remote="${TARGET_USER}@${TARGET_HOST}"
ssh -o BatchMode=yes -- "$remote" "test -d '$TARGET_PATH' && test -w '$TARGET_PATH'" || {
  echo 'The destination must already exist and be writable by the SSH user.' >&2
  exit 1
}
options=(-az --human-readable --itemize-changes --protect-args)
[[ ${1:-} != --dry-run ]] || options+=(--dry-run)
[[ ${DEPLOY_DELETE:-0} != 1 ]] || options+=(--delete-delay)
rsync "${options[@]}" -e 'ssh -o BatchMode=yes' -- dist/ "${remote}:${TARGET_PATH}/"
if [[ ${1:-} == --dry-run ]]; then
  echo 'Dry run complete; no remote files were changed.'
else
  echo 'Static files copied. Verify HTTPS, search, and the main reader flows on the production domain.'
fi
