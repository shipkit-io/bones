#!/usr/bin/env bash
# Vercel "Ignored Build Step". Exit 0 = skip the build, exit 1 = build.
#
# THIS FILE IS THE AUTHORITY FOR THIS PROJECT'S BUILD-SKIP POLICY.
# vercel.json sets "ignoreCommand" to run it, and ignoreCommand OVERRIDES the
# dashboard "Ignored Build Step" field. While vercel.json names this script,
# editing that dashboard field has no effect on this project at all.
#
# Measured 2026-11-03 (LAC-6823): a fleet dependabot skip was written to the
# dashboard field of 73/73 projects, read back as present, and fired on none of
# the projects carrying this override. Build log of photo-pods
# dpl_ChbMqhYMXgy9mWtexGB9t5boY7qY, on branch
# dependabot/npm_and_yarn/docs-site/qs-6.17.1:
#
#     Running "bash scripts/vercel-ignore-step.sh"
#     preview: building
#
# Change the policy HERE. Nowhere else governs.
#
# POLICY (CEO ruling, LAC-6903 decision 2, 2026-11-04): preview builds are
# OPT-IN across all 8 projects that carry this override.
#
#   production                      -> build, always
#   preview, "[preview]" in message -> build
#   anything else                   -> skip
#
# Production always builds: a skipped production build would leave the live
# site on an older deployment after a merge.
#
# Why previews are off by default: preview builds on these projects measured
# 192 min/wk of Vercel build time, against a $50/mo budget running at a $134
# projection. A skipped build still creates a deployment and still clones, but
# costs about 3 seconds instead of minutes.
#
# ---------------------------------------------------------------------------
# TO GET A PREVIEW BUILD: put [preview] anywhere in the commit message.
# No ticket, no approval. You can also redeploy from the Vercel dashboard,
# which bypasses this step entirely.
# ---------------------------------------------------------------------------
set -eu

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "production: building"
  exit 1
fi

# Vercel exports the commit message; fall back to git for a local run.
MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"
if [ -z "$MSG" ]; then
  MSG="$(git log -1 --pretty=%B 2>/dev/null || true)"
fi

case "$MSG" in
  *"[preview]"*)
    echo "preview + [preview] marker: building"
    exit 1
    ;;
esac

echo "preview without [preview] marker: skipping build"
exit 0
