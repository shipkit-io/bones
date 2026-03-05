# Syncing with Upstream

This repository was created from the template: [lacymorrow/shipkit](https://github.com/lacymorrow/shipkit)

## Quick Sync (Recommended)

Use this button to sync with the latest changes from the upstream repository:

[![Sync with Upstream](https://img.shields.io/badge/Sync%20with-Upstream-blue?style=for-the-badge&logo=github)](https://github.com/{owner}/{repo}/compare/main...lacymorrow:shipkit:main)

## Manual Sync Instructions

### Option 1: Using Git Commands

1. Add the upstream remote (one time setup):
```bash
git remote add upstream https://github.com/lacymorrow/shipkit.git
```

2. Fetch upstream changes:
```bash
git fetch upstream
```

3. Merge upstream changes into your main branch:
```bash
git checkout main
git merge upstream/main
```

4. Resolve any conflicts and push:
```bash
git push origin main
```

### Option 2: Using GitHub CLI

```bash
gh repo sync {owner}/{repo} --source lacymorrow/shipkit
```

### Option 3: Create a Pull Request

You can also create a pull request from the upstream repository to your repo:

1. Go to your repository on GitHub
2. Click "Compare" or go to: https://github.com/{owner}/{repo}/compare/main...lacymorrow:shipkit:main
3. Review the changes and create a pull request
4. Merge the pull request

## Automated Sync

To automatically keep your repository in sync, you can set up a GitHub Action. Create `.github/workflows/sync-upstream.yml`:

```yaml
name: Sync with Upstream

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Sync upstream changes
        run: |
          git remote add upstream https://github.com/lacymorrow/shipkit.git
          git fetch upstream
          git checkout main
          git merge upstream/main --no-edit
          git push origin main
```

For more information, see the [GitHub documentation on syncing a fork](https://docs.github.com/en/github/collaborating-with-pull-requests/working-with-forks/syncing-a-fork).
