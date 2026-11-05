#!/usr/bin/env bash
# Regression test for scripts/vercel-ignore-step.sh (LAC-6823 / LAC-6903).
#
# Convention under test: exit 0 = SKIP the build, exit 1 = BUILD.
# Policy under test: preview builds are OPT-IN via a [preview] marker;
# production always builds.
#
# Two bugs this guards against, in order of cost:
#   1. Production stops building. That is the only outcome here that can leave
#      a live site on a stale deployment after a merge. Five cases below.
#   2. The inverse of the policy: building every preview. The fleet dependabot
#      skip lived in the Vercel dashboard field, which vercel.json's
#      ignoreCommand overrides, so it fired on none of these projects and
#      previews cost 192 min/wk.
#
# Run: bash scripts/test-vercel-ignore-step.sh
# Pin: bash scripts/test-vercel-ignore-step.sh /path/to/another/copy.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SUT="${1:-$HERE/vercel-ignore-step.sh}"
SANDBOX="$(mktemp -d)"   # not a git repo, so the git fallback cannot leak HEAD
trap 'rm -rf "$SANDBOX"' EXIT

pass=0; fail=0

# check <desc> <want_rc> <VERCEL_ENV> <VERCEL_GIT_COMMIT_REF> <VERCEL_GIT_COMMIT_MESSAGE>
check() {
  desc="$1"; want="$2"; venv="$3"; ref="$4"; msg="$5"
  ( cd "$SANDBOX" && env -i PATH="$PATH" HOME="$SANDBOX" \
      VERCEL_ENV="$venv" VERCEL_GIT_COMMIT_REF="$ref" VERCEL_GIT_COMMIT_MESSAGE="$msg" \
      bash "$SUT" ) >/dev/null 2>&1
  got=$?
  if [ "$got" -eq "$want" ]; then
    pass=$((pass+1)); printf '  ok    %s (rc=%s)\n' "$desc" "$got"
  else
    fail=$((fail+1)); printf '  FAIL  %s (want rc=%s, got rc=%s)\n' "$desc" "$want" "$got"
  fi
}

echo "testing: $SUT"

# ---- BUILD (rc=1): production, unconditionally -----------------------------
check "production builds"                            1 production main "chore: routine"
check "production builds with no message"            1 production main ""
check "production builds on a dependabot branch"     1 production dependabot/npm_and_yarn/qs-6.17.1 "chore(deps): bump qs"
check "production builds without the marker"         1 production main "feat: ship it"
check "production builds with the marker"            1 production main "feat: ship it [preview]"

# ---- BUILD (rc=1): preview, opted in ---------------------------------------
check "preview + [preview] builds"                   1 preview LAC-1/feature "feat: x [preview]"
check "preview + [preview] mid-message builds"       1 preview LAC-1/feature "fix: a [preview] trailing words"
check "preview + [preview] on its own line builds"   1 preview LAC-1/feature "fix: a

[preview]"
check "preview + [preview] on a dependabot branch builds" 1 preview dependabot/npm_and_yarn/qs-6.17.1 "chore(deps): bump qs [preview]"

# ---- SKIP (rc=0): everything else ------------------------------------------
check "plain preview skips"                          0 preview LAC-1/feature "feat: add a thing"
check "preview with an empty message skips"          0 preview LAC-1/feature ""
check "dependabot preview skips"                     0 preview dependabot/npm_and_yarn/qs-6.17.1 "chore(deps): bump qs"
check "deep dependabot path skips"                   0 preview dependabot/npm_and_yarn/docs-site/hono/node-server "chore(deps)"
check "legacy skip-marker preview still skips"       0 preview main "chore: sync [skip-ci]"
check "near-miss 'preview of' does not build"        0 preview LAC-1/feature "feat: preview of the new page"
check "bracketless 'preview' does not build"         0 preview LAC-1/feature "feat: add preview mode"
check "uppercase [PREVIEW] does not build"           0 preview LAC-1/feature "feat: x [PREVIEW]"
check "unset VERCEL_ENV is not production"           0 "" LAC-1/feature "feat: x"

echo "  -- $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
