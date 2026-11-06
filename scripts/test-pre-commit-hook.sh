#!/usr/bin/env bash
# Regression test for .githooks/pre-commit (the gitleaks secret scan).
#
# Contract under test, established by LAC-7261 and measured on gitleaks 8.30.1:
#
#   exit 0 from the scanner = clean         -> the hook allows the commit
#   exit 2 from the scanner = secret found  -> the hook REFUSES the commit
#   anything else           = did not run   -> the hook REFUSES the commit
#
# The bug this guards against, and why it is worth a file of its own: before
# LAC-7261 the hook ran `gitleaks protect --staged` on the default exit code,
# where a finding and a broken invocation are BOTH exit 1. `gitleaks protect`
# is deprecated upstream in favour of `gitleaks git --staged`, so the day it is
# removed every commit in this repo would have been refused with a false secret
# accusation, and `--no-verify` would have looked like the fix. `--exit-code 2`
# moves a real finding off 1 so the two cases can be told apart.
#
# The failure mode in the OTHER direction is worse and is case 3 below: a
# scanner that could not run must not fall through to a successful commit. A
# warning that scrolls past on a `git commit` is not a gate, and the staged
# diff reaches the remote unscanned. Assert the exit code, not the wording.
#
# Shape-agnostic on purpose. Two variants of this hook exist across the
# shipkit family and they differ in ONE respect, the gitleaks-not-installed
# path: bones and lash-www warn and fall through (exit 0), while shipkit,
# shipkit-www and townofharmony.org refuse the commit (exit 1). The suite
# detects which it is reading and asserts accordingly, so the same file can be
# pointed at any copy:
#
#   bash scripts/test-pre-commit-hook.sh                      # this repo
#   bash scripts/test-pre-commit-hook.sh ../shipkit/.githooks/pre-commit
#
# What it does NOT cover, so that a green run is not read as more than it is:
# the shipkit variant rejects a staged git directory before it scans at all
# (LAC-4689, the renamed `.gittt/` leak), and this suite only ever stages one
# ordinary file. Point it at the shipkit copy and that branch passes through
# untested while the run still reads 16/16.
#
# Run: bash scripts/test-pre-commit-hook.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SUT="${1:-$HERE/../.githooks/pre-commit}"

if [ ! -f "$SUT" ]; then
  echo "no such hook: $SUT" >&2
  exit 1
fi

SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT

pass=0; fail=0

ok()   { pass=$((pass+1)); printf '  ok    %s\n' "$1"; }
bad()  { fail=$((fail+1)); printf '  FAIL  %s\n' "$1"; [ $# -lt 2 ] || printf '        %s\n' "$2"; }

# The hook is a pre-commit hook: it runs with cwd at the top of a work tree and
# reads the index. A real throwaway repo is used rather than a bare directory
# because the shipkit variant inspects `git diff --cached` before it scans, and
# that has to succeed for the scan to be reached at all. Nothing is ever
# committed here, so no committer identity is set (fleet rule 18).
REPO="$SANDBOX/repo"
mkdir -p "$REPO"
git -C "$REPO" init -q
printf 'export const greeting = "hello";\n' > "$REPO/app.ts"
git -C "$REPO" add app.ts

# A stub `gitleaks` whose exit codes are driven by the environment, so every
# branch of the hook's dispatch is reachable without owning a real secret.
#
#  STUB_PROBE_RC  what `gitleaks git --help` returns. 0 = a modern gitleaks
#                 that has the `git` subcommand, 1 = an old one that does not.
#  STUB_SCAN_RC   what the scan itself returns.
#
# The stub also records the exact argument list it was scanned with, which is
# how the suite asserts the subcommand choice and the presence of
# `--exit-code 2` rather than trusting that the hook's comments describe it.
STUB="$SANDBOX/bin"
mkdir -p "$STUB"
cat > "$STUB/gitleaks" <<'STUBEOF'
#!/usr/bin/env bash
# The probe is matched EXACTLY, not by looking for --help anywhere in the
# arguments. A loose match means any future invocation that happened to carry
# --help would be answered as a probe and never logged, and the argv asserts
# would then grep an empty log and blame the hook for a missing flag. Anything
# that is not the probe is a scan, gets logged, and returns the scan code.
if [ "$*" = "git --help" ]; then
  exit "${STUB_PROBE_RC:-0}"
fi
printf '%s\n' "$*" >> "$STUB_LOG"
exit "${STUB_SCAN_RC:-0}"
STUBEOF
chmod +x "$STUB/gitleaks"
chmod +x "$SUT" 2>/dev/null || true

# run <probe_rc> <scan_rc> [--no-gitleaks]
#
# Executes the hook directly rather than via `sh` or `bash`, so each copy gets
# the interpreter on its own shebang line: the bones variant is `sh` and the
# shipkit variant is `bash` and uses process substitution, which `sh` cannot
# parse. Sets RC and OUT (stdout and stderr merged, because the two variants
# disagree about which stream the refusal goes to and that is not the contract).
RC=0
OUT=""
run() {
  probe="$1"; scan="$2"; mode="${3:-with-gitleaks}"
  : > "$SANDBOX/scan.log"
  if [ "$mode" = "--no-gitleaks" ]; then
    # A PATH with no gitleaks on it, but still a real git and coreutils.
    bin_path="$(dirname "$(command -v git)"):/usr/bin:/bin:/usr/sbin:/sbin"
  else
    bin_path="$STUB:$(dirname "$(command -v git)"):/usr/bin:/bin:/usr/sbin:/sbin"
  fi
  OUT="$(cd "$REPO" && env -i \
      PATH="$bin_path" HOME="$SANDBOX" \
      STUB_PROBE_RC="$probe" STUB_SCAN_RC="$scan" STUB_LOG="$SANDBOX/scan.log" \
      "$SUT" 2>&1)"
  RC=$?
}

scan_argv() { cat "$SANDBOX/scan.log" 2>/dev/null; }

# argv_has <extended-regex> <description>
#
# Asserts the scanner was invoked with something matching <regex>. Checks the
# log is non-empty FIRST: a grep against nothing fails the same way a grep
# against the wrong flags does, so without this guard a stub that never logged
# would read as a missing flag and send the next reader after the hook instead
# of the harness.
argv_has() {
  pattern="$1"; desc="$2"
  argv="$(scan_argv)"
  if [ -z "$argv" ]; then
    bad "$desc" "the stub was never invoked for a scan, so there is no argv to assert on. The probe discriminator or the hook's dispatch changed."
  elif printf '%s' "$argv" | grep -qE -- "$pattern"; then
    ok "$desc"
  else
    bad "$desc" "scanned with: $argv"
  fi
}

# The two refusal messages must stay mutually exclusive, and these are the
# sentences that separate them. Asserting on them in BOTH directions is the
# whole point: a reviewer's mutants (LAC-7273) swapped the two branches' text
# and the suite stayed green, because one assert grepped the bare word "secret"
# (which "the secret scan did NOT run" also contains) and the other grepped
# only the exact phrase "found a potential secret" (which an accusation worded
# any other way slips past). A hook that tells you the scanner broke when it
# found a credential sends you to fix your config instead of rotating it; a
# hook that accuses your diff when the tool merely failed is the LAC-7261 bug.
FINDING_SIG='found a potential secret|rotate the credential'
FAILURE_SIG='did NOT run|NOT scanned|could not run'
# Any wording that tells the developer the diff itself is at fault. The real
# failure text must match none of it, including paraphrases, which is what the
# literal-phrase grep missed.
ACCUSATION_SIG='potential secret|leaked credential|contains a .*credential|rotate the credential|secret in (your|the) diff'

echo "testing: $SUT"

# ---- 1. a clean scan allows the commit -------------------------------------
# The guard against a hook that refuses everything: if this case ever fails,
# nobody can commit and the hook will simply be deleted.
run 0 0
[ "$RC" -eq 0 ] && ok "clean scan allows the commit" \
  || bad "clean scan allows the commit" "want rc=0, got rc=$RC: $OUT"

# ---- 2. a finding refuses the commit ---------------------------------------
run 0 2
[ "$RC" -ne 0 ] && ok "a finding (exit 2) refuses the commit" \
  || bad "a finding (exit 2) refuses the commit" "want rc!=0, got rc=$RC"
printf '%s' "$OUT" | grep -qE "$FINDING_SIG" \
  && ok "a finding says a secret was found" \
  || bad "a finding says a secret was found" "nothing in the output tells the developer to rotate a credential. Output: $OUT"
printf '%s' "$OUT" | grep -qE "$FAILURE_SIG" \
  && bad "a finding is not reported as a broken scanner" \
         "a real finding told the developer the scan did not run, so they will chase config instead of rotating the credential. Output: $OUT" \
  || ok "a finding is not reported as a broken scanner"

# ---- 3. a scan that did not run refuses the commit -------------------------
# THE case. `gitleaks` exits 1 for an unknown subcommand and for an unreadable
# .gitleaks.toml: the scanner never looked at the diff. Allowing the commit
# here is a fail-open secret scanner, and the only signal is a warning on a
# stream nobody reads. Refuse, and say it is the tool and not the diff.
for broken_rc in 1 126; do
  run 0 "$broken_rc"
  [ "$RC" -ne 0 ] && ok "a failed scan (exit $broken_rc) refuses the commit" \
    || bad "a failed scan (exit $broken_rc) refuses the commit" \
           "want rc!=0, got rc=$RC. The scanner never read the diff and the commit was ALLOWED: this is a fail-open secret scan. Output: $OUT"
  printf '%s' "$OUT" | grep -qE "$FAILURE_SIG" \
    && ok "a failed scan (exit $broken_rc) blames the tool, not the diff" \
    || bad "a failed scan (exit $broken_rc) blames the tool, not the diff" "output was: $OUT"
  printf '%s' "$OUT" | grep -qE "$ACCUSATION_SIG" \
    && bad "a failed scan (exit $broken_rc) does not accuse the diff of a secret" \
           "a tool failure was reported as a secret in the diff, which is the LAC-7261 bug in any wording. Output: $OUT" \
    || ok "a failed scan (exit $broken_rc) does not accuse the diff of a secret"
done

# ---- 4. the subcommand probe -----------------------------------------------
# `gitleaks protect` is deprecated and `gitleaks git` replaces it (v8.19.0+).
# The hook must pick by probing, not by a version string, and must still work
# on a gitleaks old enough to lack `git`.
run 0 0
argv_has '^git --staged' "a modern gitleaks is scanned with 'git --staged'"

run 1 0
argv_has '^protect --staged' "a gitleaks without 'git' falls back to 'protect --staged'"

[ "$RC" -eq 0 ] && ok "the fallback path still allows a clean commit" \
  || bad "the fallback path still allows a clean commit" "want rc=0, got rc=$RC: $OUT"

# ---- 5. --exit-code 2 is actually passed -----------------------------------
# Everything in case 3 rests on this flag. Without it a finding and a broken
# invocation are both exit 1 and no amount of dispatch logic can separate them,
# so assert the flag reaches the scanner rather than trusting the comment that
# says it does. It is a root persistent flag present since v8.0.0, so the
# fallback path above honours it too.
run 0 0
argv_has '--exit-code 2' "the scan is invoked with --exit-code 2"
argv_has '--redact' "the scan is invoked with --redact"

# ---- 6. gitleaks not installed ---------------------------------------------
# The one place the two variants of this hook legitimately disagree. bones and
# lash-www warn and continue; shipkit, shipkit-www and townofharmony.org refuse
# the commit. Both are defensible: this repo has an ungated CI job that scans
# the PR delta (.github/workflows/gitleaks.yml), so a missing local binary is
# not the last line of defence here, and it is in the repos whose Actions are
# gated off.
#
# THIS REPO'S policy is pinned as a constant rather than sniffed out of the
# hook's own text. An earlier draft of this suite read it off the
# "skipping local secret scan" message, which meant rewording that message
# silently changed what the suite expected and the assert passed either way --
# a vacuous test. Changing the policy now reds this case on purpose: edit the
# constant in the same commit and say why.
OWN_NO_GITLEAKS_RC=0

run 0 0 --no-gitleaks
if [ "$#" -eq 0 ]; then
  [ "$RC" -eq "$OWN_NO_GITLEAKS_RC" ] \
    && ok "no gitleaks on PATH: this repo's pinned policy (rc=$OWN_NO_GITLEAKS_RC)" \
    || bad "no gitleaks on PATH: this repo's pinned policy (rc=$OWN_NO_GITLEAKS_RC)" \
           "got rc=$RC. If the policy changed on purpose, update OWN_NO_GITLEAKS_RC. Output: $OUT"
else
  # A foreign copy, so the policy is whatever that repo chose. Assert only that
  # it made a decision and reported it: 0 or 1, never a crash, and never silent.
  case "$RC" in
    0) printf '  --    foreign copy policy: warn and continue (rc=0)\n'; ok "no gitleaks on PATH: did not crash (rc=0)" ;;
    1) printf '  --    foreign copy policy: refuse the commit (rc=1)\n'; ok "no gitleaks on PATH: did not crash (rc=1)" ;;
    *) bad "no gitleaks on PATH: did not crash" "rc=$RC is neither allow (0) nor refuse (1), so the hook crashed: $OUT" ;;
  esac
fi
printf '%s' "$OUT" | grep -qi 'gitleaks' \
  && ok "no gitleaks on PATH: says so" \
  || bad "no gitleaks on PATH: says so" "a missing scanner was silent, so nobody learns the diff went unscanned. Output: $OUT"

echo "  -- $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
