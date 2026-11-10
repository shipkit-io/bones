<!--
Thanks for the contribution! A few things that make review faster:
- Keep the PR focused on one logical change
- Use Conventional Commits in the title (feat: / fix: / chore: / docs: / refactor: / perf: / test:)
- Fill in the test plan — that's the part reviewers actually depend on
- If your change ripples to downstream Shipkit consumers, flag it in Reviewer notes
-->

## Summary

<!-- One or two sentences: what changes and why. -->

## Changes

## <!-- Bullet list of notable changes. Skip if Summary already covers it. -->

## Test plan

<!-- How a reviewer can verify this. Be specific. -->

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun test` passes (if relevant)
- [ ] Manually verified the affected route / flow at `/...`
- [ ] DB schema changes ran cleanly via `bun run db:migrate` (delete if N/A)

## Screenshots / recordings

<!-- For UI changes. Before/after when possible. Delete if not applicable. -->

## Related issues

<!-- Closes #123 / Refs #456 -->

## Downstream impact

<!-- Does this break the upstream API consumed by `shipkit` or downstream sites?
     If yes, list migration notes. Delete this section if N/A. -->

## Reviewer notes

<!-- Anything reviewers should focus on, risks worth flagging, follow-ups intentionally deferred. -->

---

**Vercel preview builds are opt-in.** Put `[preview]` anywhere in a commit message to get a preview
deployment for this PR; without it the build is skipped in about 3 seconds. You can also redeploy
from the Vercel dashboard, which bypasses the check. Policy and rationale live in
`scripts/vercel-ignore-step.sh`.
