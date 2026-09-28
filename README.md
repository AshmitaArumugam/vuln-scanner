# vuln-scanner

A CLI tool that scans folders and Git history for leaked secrets like API keys and passwords.

## Install

Global install:

```bash
npm install -g ashmita-vuln-scanner
```

Or run directly with npx:

```bash
npx ashmita-vuln-scanner init
```

## Quick start

After installation, run the initialization command once in your repository:

```bash
vuln-scanner init
```

This will install Git hooks in the repository (no project-local dependency is required):

- create or update the active `pre-commit` hook
- create or update the active `pre-push` hook
- configure the commit hook to run `vuln-scanner scan-commit`
- configure a hook to run `vuln-scanner scan-push`

## Usage

Scan the current folder for secrets:

```bash
vuln-scanner scan .
```

Scan current files only and skip Git history:

```bash
vuln-scanner scan . --no-git
```

Scan only staged git changes:

```bash
vuln-scanner scan-staged
```

Scan every Git-tracked and non-ignored file (the command used before a commit):

```bash
vuln-scanner scan-commit
```

Scan files before push, excluding files ignored by `.gitignore`:

```bash
vuln-scanner scan-push
```

## Commit protection

Once `vuln-scanner init` has run successfully, a pre-commit hook scans the entire repository: tracked files plus non-ignored untracked files. Anything matched outside `.gitignore` blocks the commit, even if it is not staged. A clean scan lets the commit continue.

If secrets are found, the hook shows:

```text
Commit blocked: secrets detected by vuln-scanner.
```

## Push protection

The same `init` command also creates a pre-push hook. Before code is pushed to GitHub or another remote, it scans Git-tracked and non-ignored files. Files listed in `.gitignore` are skipped.

Git hooks can be bypassed with `git commit --no-verify`; do not use that option when this protection is required.

If secrets are found, the hook shows:

```text
Push blocked: secrets detected by vuln-scanner.
```

# Secret Scan GitHub Action

To enable automatic secret scanning on every push, add the following workflow to your repository:

```yaml
name: Secret Scan
on:
  push:
    branches: ["**"]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run secret scanner
        id: scanner
        run: npm run scan
      - name: Comment on PR / Commit
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const findings = `${{ steps.scanner.outputs.stdout || '' }}`;
            if (findings.trim().length > 0) {
              const comment = `🔐 **Secret Scan Findings**\n\n${findings}`;
              if (context.payload.pull_request) {
                github.rest.issues.createComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: context.payload.pull_request.number,
                  body: comment
                });
              } else {
                github.rest.repos.createCommitComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  commit_sha: context.sha,
                  body: comment
                });
              }
            }
```

The workflow will fail the CI run if any secret is detected, and it will post a comment with the findings on the PR or commit.

---


- The CLI executable is `vuln-scanner`.
- If installed globally, use `vuln-scanner init` and `vuln-scanner scan .`.
- If using `npx`, run `npx ashmita-vuln-scanner init`.
