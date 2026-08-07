import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const workflowPath = path.join(ROOT, '.github/workflows/daily-upstream-parity.md');
const workflow = fs.readFileSync(workflowPath, 'utf-8');

describe('daily upstream parity workflow', () => {
  it('uses a daily gh-aw workflow with copilot and pull request safe output', () => {
    expect(workflow).toContain('schedule: daily');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('engine: copilot');
    expect(workflow).toContain('copilot-requests: write');
    expect(workflow).toContain('create-pull-request:');
    expect(workflow).toContain('allowed-files:');
    expect(workflow).toContain('allowed-github-references: []');
    expect(workflow).toContain('mentions: false');
  });

  it('tracks the requested upstream sources and scope constraints', () => {
    expect(workflow).toContain('kubernetes-sigs/headlamp');
    expect(workflow).toContain('issue `5198`');
    expect(workflow).toContain('otwld/velero-ui');
    expect(workflow).toContain('seriohub/vui-ui');
    expect(workflow).toContain('openshift/oadp-operator');
    expect(workflow).toContain('oadp-rebasebot/oadp-rebase');
    expect(workflow).toContain('openshift/console-plugin-template');
    expect(workflow).toContain('single-cluster OADP management only');
    expect(workflow).toContain(
      'Do **not** propose, implement, or describe multi-cluster management changes.',
    );
  });

  it('forbids upstream urls and cross-repo references in pull request text', () => {
    expect(workflow).toContain('do **not** include upstream URLs');
    expect(workflow).toContain('do **not** use cross-repository GitHub references');
    expect(workflow).toContain('Full upstream URLs are allowed only inside source-code comments');
    expect(workflow).toContain('headlamp PR 1234');
    expect(workflow).toContain('velero-ui PR 56');
    expect(workflow).toContain('vui-ui PR 78');
  });

  it('keeps the README features catalog agentically updated', () => {
    expect(workflow).toContain('Keep the `Features` section of `README.md` up to date');
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
    expect(readme).toContain('## Features');
    expect(readme).toContain('| Feature | Status | Description |');
  });
});
