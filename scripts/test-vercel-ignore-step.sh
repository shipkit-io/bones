#!/usr/bin/env bash
# Regression test for scripts/vercel-ignore-step.sh.
#
# Convention under test: exit 0 = SKIP the build, exit 1 = BUILD.
# Policy under test (CEO ruling LAC-7127 decision 2a): preview builds are
# OPT-IN via a [preview] marker in the commit message; production ALWAYS
# builds, on every project, with no exception.
#
# Three bugs this guards against, in order of cost:
#
#   1. Production stops building. The only outcome here that can leave a live
#      client site on a stale deployment after a merge. The Vercel row reads
#      CANCELED, which is indistinguishable from a deliberately parked project,
#      so this failure is silent. Ten cases below.
#   2. An unrecognised environment skips. LAC-7080: the guard used to decide
#      production by one exact string match and then fall through to skip, so
#      an unset or renamed VERCEL_ENV froze production. Unknown now BUILDS.
#      Seven cases below.
#   3. The inverse of the policy: building every preview. The fleet dependabot
#      skip lived in the Vercel dashboard field, which vercel.json's
#      ignoreCommand overrides, so it fired on none of these projects.
#
# THIS FILE IS BYTE-IDENTICAL ON EVERY REPO THAT CARRIES THE GUARD (LAC-7080).
# Three variants of it had drifted apart by 2026-11-05, so a case added in one
# repo did not exist in the others. Diff by blob sha before editing:
#   gh api repos/lacymorrow/<repo>/contents/scripts/test-vercel-ignore-step.sh?ref=main --jq .sha
# photo-pods is deliberately excluded: it is parked and carries its own always-
# skip test (CEO ruling LAC-6903 decision 1a).
#
# Run: bash scripts/test-vercel-ignore-step.sh
# Pin: bash scripts/test-vercel-ignore-step.sh /path/to/another/copy.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SUT="${1:-$HERE/vercel-ignore-step.sh}"
SANDBOX="$(mktemp -d)"   # not a git repo, so the git fallback cannot leak HEAD
trap 'rm -rf "$SANDBOX"' EXIT

pass=0; fail=0

# check <desc> <want_rc> <VERCEL_ENV> <VERCEL_GIT_COMMIT_REF> <VERCEL_GIT_COMMIT_MESSAGE> [VERCEL_GIT_PULL_REQUEST_ID]
check() {
  desc="$1"; want="$2"; venv="$3"; ref="$4"; msg="$5"; pr="${6:-}"
  ( cd "$SANDBOX" && env -i PATH="$PATH" HOME="$SANDBOX" \
      VERCEL_ENV="$venv" VERCEL_GIT_COMMIT_REF="$ref" \
      VERCEL_GIT_COMMIT_MESSAGE="$msg" VERCEL_GIT_PULL_REQUEST_ID="$pr" \
      bash "$SUT" ) >/dev/null 2>&1
  got=$?
  if [ "$got" -eq "$want" ]; then
    pass=$((pass+1)); printf '  ok    %s (rc=%s)\n' "$desc" "$got"
  else
    fail=$((fail+1)); printf '  FAIL  %s (want rc=%s, got rc=%s)\n' "$desc" "$want" "$got"
  fi
}

# check_git_fallback <desc> <want_rc> <HEAD message> <VERCEL_GIT_COMMIT_MESSAGE>
#
# Positively exercises the `git log -1 --pretty=%B` fallback, which the sandbox
# above can never reach: it is not a git repo, so MSG is always empty on that
# path and a typo in the git invocation passed every case (LAC-7080).
#
# A stub `git` on PATH is used rather than a real repo, because it asserts the
# EXACT argument list: the stub refuses anything other than
# `log -1 --pretty=%B`, so changing the flag reds the case instead of silently
# falling back to an empty message. A real fixture repo would also need a
# committer identity, which fleet rule 18 forbids setting.
check_git_fallback() {
  desc="$1"; want="$2"; head_msg="$3"; env_msg="$4"
  stub="$SANDBOX/gitstub"
  rm -rf "$stub"; mkdir -p "$stub"
  { printf '#!/usr/bin/env bash\n'
    printf 'if [ "$*" = "log -1 --pretty=%%B" ]; then\n'
    printf '  cat <<'\''MSGEOF'\''\n%s\nMSGEOF\n' "$head_msg"
    printf '  exit 0\n'
    printf 'fi\n'
    printf 'echo "stub git: refusing unexpected invocation: $*" >&2\n'
    printf 'exit 1\n'
  } > "$stub/git"
  chmod +x "$stub/git"
  ( cd "$SANDBOX" && env -i PATH="$stub:$PATH" HOME="$SANDBOX" \
      VERCEL_ENV=preview VERCEL_GIT_COMMIT_REF=LAC-1/feature \
      VERCEL_GIT_COMMIT_MESSAGE="$env_msg" \
      bash "$SUT" ) >/dev/null 2>&1
  got=$?
  if [ "$got" -eq "$want" ]; then
    pass=$((pass+1)); printf '  ok    %s (rc=%s)\n' "$desc" "$got"
  else
    fail=$((fail+1)); printf '  FAIL  %s (want rc=%s, got rc=%s)\n' "$desc" "$want" "$got"
  fi
}

# check_failsafe <desc> <want_rc>
#
# Fail-safe direction (LAC-7123 question 4). Inverting the guard changed which
# exit code is the default, so it has to be re-derived rather than inherited:
# any path that can exit 0 on an UNEXPECTED failure is a silent production
# skip, which is the whole defect this file guards. Closing stdout makes the
# final echo fail, which is the cheapest reachable unexpected failure in a
# script whose only other external command is `git log ... || true`. Under
# `set -eu` that aborts with a non-zero status, i.e. BUILD. Without it, the
# failure is ignored and the script skips.
check_failsafe() {
  desc="$1"; want="$2"
  ( cd "$SANDBOX" && env -i PATH="$PATH" HOME="$SANDBOX" \
      VERCEL_ENV=preview VERCEL_GIT_COMMIT_REF=LAC-1/feature \
      VERCEL_GIT_COMMIT_MESSAGE="feat: no marker here" \
      bash "$SUT" >&- 2>&- )
  got=$?
  if [ "$got" -eq "$want" ]; then
    pass=$((pass+1)); printf '  ok    %s (rc=%s)\n' "$desc" "$got"
  else
    fail=$((fail+1)); printf '  FAIL  %s (want rc=%s, got rc=%s)\n' "$desc" "$want" "$got"
  fi
}

# check_one_skip_path
#
# Structural: exactly one `exit 0` in the file, and it is the last statement.
# Every other path must exit 1. A second `exit 0` anywhere is a new silent
# skip, and the costs are not symmetric -- a needless build is a minute, a
# skipped production build is a stale client site that nothing reports.
check_one_skip_path() {
  n=$(grep -cE '^[[:space:]]*exit 0([[:space:]]|$)' "$SUT")
  last=$(grep -vE '^[[:space:]]*(#|$)' "$SUT" | tail -1 | sed 's/^[[:space:]]*//')
  if [ "$n" -eq 1 ] && [ "$last" = "exit 0" ]; then
    pass=$((pass+1)); printf '  ok    exactly one exit 0, and it is the last statement\n'
  else
    fail=$((fail+1)); printf '  FAIL  exactly one exit 0, and it is the last statement (found %s, last stmt %s)\n' "$n" "$last"
  fi
}

# check_canonical_pin
#
# Cross-repo invariant (LAC-7080). The region of the guard from the
# "BEGIN CANONICAL POLICY" marker to the end of the file is byte-identical on
# every repo that carries it; only the comment header above the marker is
# repo-specific. Four whole-file variants had drifted apart on main by
# 2026-11-05 and this test suite itself existed in three versions, so a case
# added in one repo did not exist in the others.
#
# This assert is what makes the NEXT policy change have to land everywhere.
# When you change the policy on purpose: edit the canonical region, run this
# suite to get the new hash, update CANONICAL_SHA256 here, and ship the same
# two files to every repo in the list. A repo you forget goes red.
CANONICAL_SHA256="6e60a8ebdb0e579abfb545f3b93eabcaa59d7bba0584a3e5b820db66057f11fa"
check_canonical_pin() {
  if [ -x "$(command -v shasum 2>/dev/null)" ]; then
    got=$(sed -n '/^# --- BEGIN CANONICAL POLICY/,$p' "$SUT" | shasum -a 256 | cut -d' ' -f1)
  elif [ -x "$(command -v sha256sum 2>/dev/null)" ]; then
    got=$(sed -n '/^# --- BEGIN CANONICAL POLICY/,$p' "$SUT" | sha256sum | cut -d' ' -f1)
  else
    fail=$((fail+1)); printf '  FAIL  canonical policy region matches the pin (no shasum or sha256sum on PATH)\n'
    return
  fi
  if ! grep -q '^# --- BEGIN CANONICAL POLICY' "$SUT"; then
    fail=$((fail+1)); printf '  FAIL  canonical policy region matches the pin (marker missing from %s)\n' "$SUT"
  elif [ "$got" = "$CANONICAL_SHA256" ]; then
    pass=$((pass+1)); printf '  ok    canonical policy region matches the pin\n'
  else
    fail=$((fail+1))
    printf '  FAIL  canonical policy region matches the pin\n'
    printf '        want %s\n        got  %s\n' "$CANONICAL_SHA256" "$got"
    printf '        Either this repo has drifted, or you changed the policy on\n'
    printf '        purpose and have to update CANONICAL_SHA256 in every repo.\n'
  fi
}

echo "testing: $SUT"

# ---- BUILD (rc=1): production, unconditionally -----------------------------
check "production builds"                            1 production main "chore: routine"
check "production builds with no message"            1 production main ""
check "production builds on a dependabot branch"     1 production dependabot/npm_and_yarn/qs-6.17.1 "chore(deps): bump qs"
check "production builds without the marker"         1 production main "feat: ship it"
check "production builds with the marker"            1 production main "feat: ship it [preview]"
check "production builds even with a PR id"          1 production main "feat: ship it" 42

# ---- BUILD (rc=1): an environment we do not recognise (LAC-7080) -----------
# The old guard matched the literal string `production` and fell through to
# skip, so every one of these froze the production build.
check "unset VERCEL_ENV builds"                      1 "" "" "feat: x"
check "unset VERCEL_ENV builds on the prod branch"   1 "" main "feat: x"
check "mixed-case Production builds"                 1 Production main "feat: x"
check "upper-case PRODUCTION builds"                 1 PRODUCTION main "feat: x"
check "an unknown environment builds"                1 staging main "feat: x"
check "a future production-class env builds"         1 production-eu main "feat: x"
check "unset VERCEL_ENV with no second signal builds" 1 "" "LAC-1/feature" "feat: x"

# ---- SKIP (rc=0): unrecognised env, but a PR id proves it is not production -
# Second independent signal. 155 of 155 preview deploys on these projects
# carried a PR id (LAC-6380), and a production deploy never carries one, so a
# PR id is safe positive evidence of a preview when VERCEL_ENV is unreadable.
check "unknown env + PR id skips"                    0 "" LAC-1/feature "feat: x" 17
check "unknown env + PR id + marker builds"          1 "" LAC-1/feature "feat: x [preview]" 17
check "staging + PR id skips"                        0 staging LAC-1/feature "feat: x" 17

# ---- BUILD (rc=1): preview, opted in ---------------------------------------
check "preview + [preview] builds"                   1 preview LAC-1/feature "feat: x [preview]"
check "preview + [preview] mid-message builds"       1 preview LAC-1/feature "fix: a [preview] trailing words"
check "preview + [preview] on its own line builds"   1 preview LAC-1/feature "fix: a

[preview]"
check "preview + [preview] on a dependabot branch builds" 1 preview dependabot/npm_and_yarn/qs-6.17.1 "chore(deps): bump qs [preview]"
check "development + [preview] builds"               1 development LAC-1/feature "feat: x [preview]"

# ---- SKIP (rc=0): a known non-production env without the marker ------------
check "plain preview skips"                          0 preview LAC-1/feature "feat: add a thing"
check "preview with an empty message skips"          0 preview LAC-1/feature ""
check "preview on the production branch skips"       0 preview main "feat: x"
check "development skips"                            0 development LAC-1/feature "feat: x"
check "dependabot preview skips"                     0 preview dependabot/npm_and_yarn/qs-6.17.1 "chore(deps): bump qs"
check "deep dependabot path skips"                   0 preview dependabot/npm_and_yarn/docs-site/hono/node-server "chore(deps)"
check "legacy skip-marker preview still skips"       0 preview main "chore: sync [skip-ci]"
check "legacy [skip ci] preview still skips"         0 preview main "chore: sync [skip ci]"
check "near-miss 'preview of' does not build"        0 preview LAC-1/feature "feat: preview of the new page"
check "bracketless 'preview' does not build"         0 preview LAC-1/feature "feat: add preview mode"
check "uppercase [PREVIEW] does not build"           0 preview LAC-1/feature "feat: x [PREVIEW]"

# ---- the git log -1 fallback, positively exercised (LAC-7080) --------------
check_git_fallback "git HEAD marker builds when Vercel sends no message" 1 "feat: x [preview]" ""
check_git_fallback "git HEAD without the marker skips"                   0 "feat: x"            ""
check_git_fallback "git HEAD marker on its own line builds"              1 "fix: a

[preview]" ""
check_git_fallback "a set Vercel message wins over git HEAD"             0 "feat: x [preview]"  "feat: no marker here"

# ---- fail-safe direction, and only one way out (LAC-7080 / LAC-7123 Q4) ----
check_failsafe "an unexpected write failure builds, it does not skip" 1
check_one_skip_path
check_canonical_pin

echo "  -- $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
