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
#   production                        -> build, always
#   preview/development + "[preview]" -> build
#   preview/development, no marker    -> skip
#   anything else, including unset    -> build  <- LAC-7080
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
#
# --- BEGIN CANONICAL POLICY (LAC-7080) -------------------------------------
# Everything below this line is BYTE-IDENTICAL on every repo that carries this
# guard, and scripts/test-vercel-ignore-step.sh pins its hash. Everything above
# is repo-specific context. Four whole-file variants of this script had drifted
# apart on main by 2026-11-05 and the test suite existed in three versions, so
# a case added in one repo did not exist in the others. The pin is what makes
# the next policy change have to land everywhere or go red.
#
# The 12 repos, measured 2026-11-05 by executing every live copy (LAC-7080):
#   ai-logical-fallacy-detector  aura-web   buildandserve   carolinasgps
#   cloud0.dev   hitchhikersgalaxy.guide   kinfolk   lash-www   linger
#   shipkit   shipkit-www   shipkit-io/bones
#
# Five repos set vercel.json ignoreCommand and are deliberately NOT in that
# list. Do not copy this block into them and do not copy theirs here:
#   photo-pods          parked, skips EVERY build including production, CEO
#                       ruling LAC-6903 decision 1(a). Removing its skip is
#                       step 1 of reviving the project.
#   townofharmony.org   same defect as this one, but its marker must be in the
#                       commit SUBJECT, not anywhere in the message. A
#                       deliberately stricter policy on a repo with a live
#                       client preview domain. Fixed separately.
#   shipkit-sink        a mirror of shipkit-www: identical commit history, no
#                       Vercel project linked, so this guard governs no build
#                       there. An independent commit would diverge from the
#                       mirror and be clobbered by the next sync.
#   coderev             opt-OUT policy (previews build unless [skip ci]). It
#   crocs-merch-chat    never had this defect: its fall-through already builds.
#                       Not yet on the LAC-7127 opt-in default; separate issue.
#
# UNKNOWN BUILDS, IT DOES NOT SKIP (LAC-7080).
# This guard used to decide production by one exact string comparison against
# VERCEL_ENV and then fall through to skip, so an unset, renamed or
# differently-cased VERCEL_ENV silently froze the production build. The live
# site then serves the previous deployment and the Vercel row reads CANCELED,
# which is indistinguishable from a deliberately parked project. The two costs
# are not symmetric: a needless preview build is about a minute of build CPU,
# a skipped production build is a stale client site that nothing reports.
#
# So an environment this script does not recognise BUILDS. To stop that from
# re-spending every preview minute if VERCEL_ENV ever stops being exported,
# the unknown path consults a second, independent signal first:
# VERCEL_GIT_PULL_REQUEST_ID. A production deploy never carries one, and 155
# of 155 preview deploys on these projects did (LAC-6380), so a PR id is safe
# positive evidence of a preview. VERCEL_GIT_COMMIT_REF was the other
# candidate and was rejected: using it means hardcoding this project's
# production branch into this file, and getting that one string wrong
# reintroduces exactly the production freeze this change exists to remove.
#
# There is exactly ONE `exit 0` below and it is the last statement. Every
# other path exits 1. The test asserts that structurally, because a second
# `exit 0` anywhere is a new silent-skip path.
set -eu

# Classify the deployment environment. Anything not positively recognised as
# non-production is production-class and must build.
case "${VERCEL_ENV:-}" in
  production)
    echo "VERCEL_ENV=production: building"
    exit 1
    ;;
  preview | development)
    # Known non-production. Fall through to the marker policy below.
    ;;
  *)
    # Unrecognised or unset. Only a second independent signal may downgrade
    # this to a preview; with no such signal, build (LAC-7080).
    if [ -n "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]; then
      echo "VERCEL_ENV='${VERCEL_ENV:-}' unrecognised, but PR id '${VERCEL_GIT_PULL_REQUEST_ID}' is positive evidence of a preview: applying the preview policy"
    else
      echo "VERCEL_ENV='${VERCEL_ENV:-}' unrecognised and no PR id to prove this is a preview: building rather than risk a skipped production deploy (LAC-7080)"
      exit 1
    fi
    ;;
esac

# Vercel exports the commit message; fall back to git for a local run.
MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"
if [ -z "$MSG" ]; then
  MSG="$(git log -1 --pretty=%B 2>/dev/null || true)"
fi

case "$MSG" in
  *"[preview]"*)
    echo "non-production + [preview] marker: building"
    exit 1
    ;;
esac

echo "non-production without the [preview] marker: skipping build"
exit 0
