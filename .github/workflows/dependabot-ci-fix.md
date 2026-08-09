---
name: Dependabot CI Fix
emoji: "🤖"
description: On request (or automatically when CI fails), push the smallest fix needed to make CI pass on a Dependabot pull request.
on:
  slash_command:
    name: fix-ci
    events: [pull_request_comment, pull_request]
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches:
      - "dependabot/**"
  workflow_dispatch:
permissions:
  contents: read
  actions: read
  issues: read
  pull-requests: read
  copilot-requests: write
engine: copilot
strict: true
timeout-minutes: 30
network:
  allowed: [defaults, github, node]
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
    lockdown: false
    min-integrity: none
  bash:
    - "yarn:*"
    - "corepack:*"
    - "git:*"
checkout:
  fetch: ["*"]
  fetch-depth: 0
safe-outputs:
  mentions: false
  push-to-pull-request-branch:
    target: "*"
    required-labels: [dependencies]
    if-no-changes: warn
    allowed-files:
      - "package.json"
      - "yarn.lock"
      - "src/**"
      - "integration-tests/**"
      - "locales/**"
      - "charts/**"
      - "console-extensions.json"
      - "rspack.config.ts"
      - "playwright.config.ts"
      - "jest.config.ts"
      - "eslint.config.ts"
      - "tsconfig.json"
  noop:
---

# Dependabot CI Fix

Make a red CI run green on an open Dependabot pull request, with the smallest possible change.

## When to run

- Triggered by a maintainer commenting `/fix-ci` on a Dependabot pull request, or by the `CI` workflow completing with a non-success conclusion.
- Only act on pull requests whose author is `dependabot[bot]`. If the triggering pull request (or, for `workflow_run`, the associated pull request) is not authored by `dependabot[bot]`, call `noop` immediately and stop.
- If triggered by `workflow_run`, only proceed when the conclusion is `failure`, `timed_out`, or `cancelled`. Call `noop` for `success` or other conclusions.
- If there is no open Dependabot pull request associated with the triggering event, call `noop`.

## Investigate

1. Identify the target Dependabot pull request and its branch.
2. Read the latest `CI` workflow run for that pull request's head commit; inspect failed jobs and logs to determine the exact failure (lint, i18n drift, `yarn.lock` deduplication, tests, or build).
3. Check out the pull request branch locally.

## Fix

Apply the smallest change that addresses the root cause, for example:

- Run `yarn install --immutable` (or drop `--immutable` only if lockfile updates are required) then `yarn dedupe --strategy highest` if the lockfile is not deduplicated.
- Run `yarn i18n` and include any resulting `locales/**` changes if translation files are out of date.
- Run `yarn lint` and include the auto-fixed changes.
- Update `src/**` code only when the dependency bump requires a source-level API change (e.g. a breaking change in the updated package); keep the diff minimal and directly tied to the failure.
- Do not upgrade, downgrade, or add dependencies beyond what Dependabot already proposed.

Do not modify the Dependabot-authored version bump itself unless it is the direct cause of a failure that cannot be fixed any other way.

## Validate

Before pushing, run the relevant subset of:

- `yarn lint`
- `yarn test --ci --maxWorkers=2`
- `yarn build`

Only run the checks needed to confirm the specific failure is resolved; do not run the full suite if a narrower command suffices.

## Push

Push the fix directly to the Dependabot pull request branch using `push-to-pull-request-branch`. Keep the commit message focused on the CI fix (e.g. `fix: resolve CI failure on Dependabot PR`).

If CI is already green, or no fix is needed or possible without exceeding the allowed file scope, call `noop` with a short explanation.
