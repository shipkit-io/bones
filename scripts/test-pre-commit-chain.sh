#!/usr/bin/env bash
# Regression test for the chaining half of .githooks/pre-commit (LAC-7263).
#
# What it guards, and why it needs a file of its own: `core.hooksPath` holds
# ONE value, so the repo-local `.githooks` that `postinstall` sets REPLACES a
# developer's global hooks path instead of stacking with it. Every global
# pre-commit hook -- including the fleet's git identity guard, fleet rule 18 --
# is therefore dead inside this repo. git >= 2.54 can reach a global hook a
# second way, through `hook.<name>.command` config, but older git cannot, and
# nothing installed globally can recover it either way: once a repo sets its
# own core.hooksPath, git never looks at the outer one again. So the hook runs
# the displaced hook itself, and that is what this file tests.
#
# The specific bug that motivated case 1, because a green suite is not the same
# as a discriminating one: the first version of this code asked
# `git config --global --get core.hooksPath`. That read exits 1 on this fleet's
# actual machine, because the value lives in ~/.gitconfig.local which is pulled
# in by an `[include]` from ~/.gitconfig, and `--global` does not follow
# includes (measured on git 2.54.0, Apple Git-157). The chain was dead code on
# the only machine it was written for, and a test that wrote core.hooksPath
# straight into ~/.gitconfig would have passed against it. Case 1 uses the
# include shape on purpose; case 2 uses the direct shape, and the two together
# are what make the fix visible.
#
# Shape-agnostic: point it at any copy of the hook.
#
#   bash scripts/test-pre-commit-chain.sh                       # this repo
#   bash scripts/test-pre-commit-chain.sh ../shipkit/.githooks/pre-commit
#
# What it does NOT cover: the gitleaks scan itself. `gitleaks` is stubbed to a
# clean exit here so that only the chaining is under test. The scanner's
# exit-code contract is scripts/test-pre-commit-hook.sh (LAC-7261/LAC-7269).
#
# Run: bash scripts/test-pre-commit-chain.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SUT="${1:-$HERE/../.githooks/pre-commit}"

if [ ! -f "$SUT" ]; then
  echo "no such hook: $SUT" >&2
  exit 1
fi
SUT="$(cd "$(dirname "$SUT")" && pwd)/$(basename "$SUT")"

SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT

pass=0
fail=0
ok() {
  pass=$((pass + 1))
  printf '  ok    %s\n' "$1"
}
bad() {
  fail=$((fail + 1))
  printf '  FAIL  %s\n' "$1"
  [ $# -lt 2 ] || printf '        %s\n' "$2"
}

# A stub gitleaks that always reports clean, so the scan arm of the hook is a
# no-op and every observation below is about the chain. Also keeps the test
# honest on a machine with no gitleaks installed, where the real hook would
# take its "not installed" branch instead.
STUB_BIN="$SANDBOX/bin"
mkdir -p "$STUB_BIN"
cat > "$STUB_BIN/gitleaks" <<'STUB'
#!/bin/sh
exit 0
STUB
chmod +x "$STUB_BIN/gitleaks"

# A displaced global pre-commit hook. Records that it ran, and vetoes only when
# told to, so one fixture serves both the "it runs" and the "its veto is
# honoured" cases.
make_outer() {
  outer_dir=$1
  outer_rc=$2
  mkdir -p "$outer_dir"
  cat > "$outer_dir/pre-commit" <<STUB
#!/bin/sh
echo ran > "$SANDBOX/outer-ran"
exit $outer_rc
STUB
  chmod +x "$outer_dir/pre-commit"
}

# A throwaway repo shaped like the real thing: its own core.hooksPath at local
# scope, which is the override whose shadowing this whole file is about.
make_repo() {
  repo=$1
  rm -rf "$repo"
  mkdir -p "$repo"
  git -C "$repo" init -q
  git -C "$repo" config core.hooksPath .githooks
  git -C "$repo" config user.email me@lacymorrow.com
  git -C "$repo" config user.name "Lacy Morrow"
}

# macOS ships no `timeout`, and the recursion case has to be bounded or a
# regression there hangs the suite instead of failing it.
run_bounded() {
  limit=$1
  shift
  # Job control so the hook becomes a process-group leader: a recursing hook
  # spawns a chain of children that each wait on the next, and killing only
  # the top of that chain would leave the rest running.
  set -m
  "$@" > "$SANDBOX/out" 2>&1 &
  job=$!
  set +m
  (
    sleep "$limit"
    kill -9 -"$job" 2> /dev/null || kill -9 "$job" 2> /dev/null
  ) &
  watchdog=$!
  wait "$job"
  rc=$?
  kill "$watchdog" 2> /dev/null
  wait "$watchdog" 2> /dev/null
  return $rc
}

# Run the hook with an isolated git config. `shape` picks how the outer
# core.hooksPath is written, which is the whole point of cases 1 and 2.
#   include  -> ~/.gitconfig has [include] path=~/.gitconfig.local, value there
#   direct   -> value written straight into ~/.gitconfig
#   none     -> no outer value at all
run_hook() {
  shape=$1
  outer_dir=$2
  limit=${3:-10}
  hook=${4:-$SUT}

  home="$SANDBOX/home"
  rm -rf "$home" "$SANDBOX/outer-ran"
  mkdir -p "$home"

  : > "$home/.gitconfig"
  case "$shape" in
    include)
      printf '[include]\n\tpath = %s/.gitconfig.local\n' "$home" > "$home/.gitconfig"
      printf '[core]\n\thooksPath = %s\n' "$outer_dir" > "$home/.gitconfig.local"
      ;;
    direct)
      printf '[core]\n\thooksPath = %s\n' "$outer_dir" > "$home/.gitconfig"
      ;;
    none) ;;
    *)
      echo "bad shape: $shape" >&2
      exit 1
      ;;
  esac

  repo="$SANDBOX/repo"
  make_repo "$repo" > /dev/null 2>&1

  (
    cd "$repo" || exit 1
    PATH="$STUB_BIN:$PATH"
    HOME="$home"
    GIT_CONFIG_GLOBAL="$home/.gitconfig"
    GIT_CONFIG_NOSYSTEM=1
    export PATH HOME GIT_CONFIG_GLOBAL GIT_CONFIG_NOSYSTEM
    run_bounded "$limit" "$hook"
  )
}

outer_ran() { [ -f "$SANDBOX/outer-ran" ]; }

echo "hook under test: $SUT"

# Guard against the suite silently testing nothing: if this git cannot report
# config scopes, case 1 can only ever exercise the fallback path.
if ! git config --show-scope --list > /dev/null 2>&1; then
  echo "  WARN  this git has no --show-scope; case 1 exercises the fallback only" >&2
fi

make_outer "$SANDBOX/outer" 0

# 1. THE REGRESSION. Outer hooksPath reached through an [include], which is the
#    shape on the fleet's own machine. `--global --get` cannot see this.
run_hook include "$SANDBOX/outer" 10
rc=$?
if outer_ran && [ "$rc" -eq 0 ]; then
  ok "an included global core.hooksPath is still chained"
else
  bad "an included global core.hooksPath is still chained" \
    "outer ran=$(outer_ran && echo yes || echo NO), rc=$rc. The displaced hook was dropped."
fi

# 2. The same thing written straight into ~/.gitconfig. Passed even before the
#    fix, so on its own it proves nothing; it is here to localise a failure to
#    the scope-reading change rather than to chaining as a whole.
run_hook direct "$SANDBOX/outer" 10
rc=$?
if outer_ran && [ "$rc" -eq 0 ]; then
  ok "a directly-set global core.hooksPath is chained"
else
  bad "a directly-set global core.hooksPath is chained" \
    "outer ran=$(outer_ran && echo yes || echo NO), rc=$rc"
fi

# 3. The displaced hook's veto has to reach git, or chaining is theatre.
make_outer "$SANDBOX/outer" 1
run_hook include "$SANDBOX/outer" 10
rc=$?
if [ "$rc" -ne 0 ]; then
  ok "a veto from the displaced hook refuses the commit"
else
  bad "a veto from the displaced hook refuses the commit" \
    "want rc!=0, got rc=0. The outer hook objected and the commit was allowed."
fi
make_outer "$SANDBOX/outer" 0

# 4. An outer path pointing at the hook's own directory must not recurse.
#    The hook has to be run from a copy NAMED `pre-commit` for this to bite:
#    the chain probes `$outer/pre-commit`, so pointing it at a directory whose
#    copy of the hook is called anything else misses and the guard is never
#    reached. Measured: with the SUT run as /tmp/<mutant>, a build with the
#    recursion guard deleted passed this case 6/6.
rm -rf "$SANDBOX/self"
mkdir -p "$SANDBOX/self"
cp "$SUT" "$SANDBOX/self/pre-commit"
chmod +x "$SANDBOX/self/pre-commit"
run_hook include "$SANDBOX/self" 8 "$SANDBOX/self/pre-commit"
rc=$?
if [ "$rc" -eq 0 ]; then
  ok "an outer path equal to our own directory does not recurse"
else
  bad "an outer path equal to our own directory does not recurse" \
    "rc=$rc (137 = killed by the watchdog, i.e. it recursed)"
fi

# 5. No outer hooksPath at all: the hook must carry on and scan, not bail.
run_hook none "" 10
rc=$?
if [ "$rc" -eq 0 ] && ! outer_ran; then
  ok "no outer hooksPath leaves the hook working normally"
else
  bad "no outer hooksPath leaves the hook working normally" \
    "rc=$rc, outer ran=$(outer_ran && echo yes || echo NO)"
fi

# 6. Outer directory present but holding no pre-commit: nothing to chain, and
#    nothing to complain about either.
rm -rf "$SANDBOX/empty"
mkdir -p "$SANDBOX/empty"
run_hook include "$SANDBOX/empty" 10
rc=$?
if [ "$rc" -eq 0 ] && ! outer_ran; then
  ok "an outer hooks directory with no pre-commit is skipped"
else
  bad "an outer hooks directory with no pre-commit is skipped" \
    "rc=$rc, outer ran=$(outer_ran && echo yes || echo NO)"
fi

printf '  -- %d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
