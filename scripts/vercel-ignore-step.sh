#!/usr/bin/env bash
# Vercel "Ignored Build Step". Exit 0 = skip the build, exit 1 = build.
#
# Production always builds: a skipped production build would leave the live
# site on an older deployment after a merge.
#
# Preview builds are skipped when the commit says [skip ci] or [skip vercel].
# Those commits come from automated upstream syncs and agent PRs that already
# ran `verify` locally (typecheck, lint, tests, production build, route smoke).
# Preview builds on this project are cold (VERCEL_FORCE_NO_BUILD_CACHE) and
# take 11 to 14 minutes each, so skipping them is real quota saved.
#
# To force a preview build on such a PR, redeploy it from the Vercel dashboard
# or push a commit without the marker.
set -eu

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "production: building"
  exit 1
fi

MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
case "$MSG" in
  *"[skip ci]"*|*"[skip vercel]"*|*"[ci skip]"*)
    echo "preview + skip marker: skipping build"
    exit 0
    ;;
esac

echo "preview: building"
exit 1
