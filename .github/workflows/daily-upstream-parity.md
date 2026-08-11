---
name: Daily Upstream Parity
emoji: "🔁"
description: Mirror relevant single-cluster OADP UI work from approved upstreams into this repository with a daily agentic workflow.
on:
  schedule: daily
  workflow_dispatch:
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
engine: copilot
strict: true
timeout-minutes: 60
network:
  allowed: [defaults, github, node]
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
    lockdown: false
    min-integrity: none
safe-outputs:
  mentions: false
  allowed-github-references: []
  create-pull-request:
    title-prefix: "[upstream-parity] "
    draft: true
    expires: 7d
    if-no-changes: warn
    protected-files:
      policy: fallback-to-issue
      exclude: [README.md]
    allowed-files:
      - "src/**"
      - "integration-tests/**"
      - "locales/**"
      - "charts/**"
      - "__mocks__/**"
      - "console-extensions.json"
      - "package.json"
      - "rspack.config.ts"
      - "playwright.config.ts"
      - "jest.config.ts"
      - "eslint.config.ts"
      - "tsconfig.json"
      - "README.md"
  noop:
---

# Daily Upstream Parity

Keep this repository aligned with approved upstream UI work for **single-cluster OADP management only**.
Do **not** propose, implement, or describe multi-cluster management changes.

## Upstream sources to watch

Prioritize these public upstreams in this order:

1. `kubernetes-sigs/headlamp` issue `5198`
2. Any superseding, linked, or implementation pull requests in `kubernetes-sigs/headlamp` related to Velero and issue `5198`
3. `otwld/velero-ui`
4. `seriohub/vui-ui`
5. `openshift/oadp-operator`
6. `migtools/oadp-non-admin` for namespace-scoped (non-admin) backup and restore capabilities, such as `NonAdminBackup`, `NonAdminRestore`, and related CRs, that should be surfaced in this plugin's single-cluster UI
7. The integration graph documented in `oadp-rebasebot/oadp-rebase` `repos.yaml`, but only when it directly affects this plugin's single-cluster OADP UI behavior
8. `openshift/console-plugin-template` updates that should be rebased into this repository without broad churn

## Run goals

On each run, do the following in order:

1. Survey this repository first:
   - read existing code, tests, and current feature coverage
   - inspect open pull requests, recent closed pull requests, and relevant issues
   - avoid duplicating in-flight or already-merged work
2. Review the upstream sources for newly implemented or newly clarified behavior relevant to this repository.
3. Prefer the smallest concrete parity slice that can be implemented safely in one pull request.
4. If an upstream change is already mirrored here, skip it.
5. If there is no new upstream parity pull request to mirror this cycle, look for one small missing single-cluster OADP UI capability that is clearly justified by upstream behavior or operator capabilities, such as backup or restore progress visibility for Velero/Kopia flows.
6. If no safe, concrete, non-duplicate change is warranted, call `noop` with a short explanation.

## Implementation rules

- Keep all changes surgical and repository-local.
- Stay within the allowed files for `create-pull-request`.
- Prefer adapting existing patterns in this repository over introducing new architecture.
- Keep feature work scoped to single-cluster management.
- Do not add multi-cluster dashboards, APIs, navigation, labels, or wording.
- Keep parity work aligned with `openshift/oadp-operator` capabilities and the Velero-related repositories it integrates with.
- When rebasing template updates from `openshift/console-plugin-template`, keep only the minimal relevant changes needed here.
- Keep the `Features` section of `README.md` up to date: whenever you add, change, or remove a user-facing feature, update the features table in `README.md` in the same pull request so it accurately catalogs implemented and planned features. Do not rewrite unrelated parts of the README.

## License attribution rules

- Comply with the license of every upstream source you mirror. Before adapting code, check the upstream repository's license (for example `LICENSE`, `LICENSE.md`, or `NOTICE` files).
- When code is copied or closely adapted from an upstream source, retain any copyright, patent, trademark, and attribution notices from the copied portions, and add a source-code comment in the affected file identifying the upstream repository, the license (for example Apache-2.0 or MIT), and the upstream URL of the adapted code.
- If an upstream project ships a `NOTICE` file with attribution notices that pertain to the adapted code, reproduce the relevant notices in the source-code comment.
- Do not mirror code from an upstream whose license is missing, unclear, or incompatible with this repository's Apache-2.0 license; call `noop` with a short explanation instead.
- Independently reimplementing behavior from scratch (without copying upstream code) does not require attribution, but noting the upstream inspiration in a source-code comment is still encouraged.

## Validation rules

Before opening a pull request, run the smallest existing validation commands that cover your edits. Prefer targeted commands first, then expand only if needed. Use the repository's existing tools only.

For code changes, usually run the relevant subset of:

- `yarn lint`
- `yarn test -- --runInBand <targeted spec if possible>`
- `yarn build`

If a command cannot run, explain why in the pull request body.

## Pull request content rules

- Open at most one pull request per run.
- In pull request titles and bodies, do **not** include upstream URLs.
- In pull request titles and bodies, do **not** use cross-repository GitHub references.
- Refer to upstream work only as plain text such as `headlamp PR 1234`, `velero-ui PR 56`, `vui-ui PR 78`, or `headlamp issue 5198`.
- Full upstream URLs are allowed only inside source-code comments when attribution is genuinely useful.
- Summarize what was mirrored, why it applies here, what validation you ran, and why the change remains single-cluster scoped.

## Suggested workflow for each run

1. Identify one candidate change.
2. Confirm it is not already implemented or already under review here.
3. Implement the smallest complete solution.
4. Add or update focused tests when existing test infrastructure covers the touched area.
5. Run targeted validation.
6. Create one draft pull request if changes are ready; otherwise call `noop`.
