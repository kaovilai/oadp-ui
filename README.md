# OADP UI

An [OpenShift Console dynamic plugin](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk)
that provides a web UI for [OADP (OpenShift API for Data Protection)](https://github.com/openshift/oadp-operator),
enabling single-cluster backup and restore management with [Velero](https://velero.io) directly from the
OpenShift web console.

The plugin is registered with the console using the `ConsolePlugin` custom
resource and enabled in the console operator config by a cluster administrator.

## Scope

This project targets **single-cluster OADP management only**. Multi-cluster
management features are out of scope.

The repository is kept in parity with relevant upstream work (such as the
OADP operator, Velero-related UIs, and the OpenShift console plugin template)
via an automated daily workflow defined in
[.github/workflows/daily-upstream-parity.md](.github/workflows/daily-upstream-parity.md)
(a [gh-aw](https://github.com/githubnext/gh-aw) agentic workflow definition).

## Features

The table below catalogs the features currently implemented by this plugin.
It is kept up to date agentically: the daily upstream parity workflow updates
this catalog whenever it adds or changes a feature.

| Feature | Status | Description |
| --- | --- | --- |
| Example page | Implemented | Example console page at `/example` demonstrating PatternFly components and i18n ([src/components/ExamplePage.tsx](src/components/ExamplePage.tsx)) |
| Admin navigation item | Implemented | Navigation item in the admin perspective **Home** section linking to the example page ([console-extensions.json](console-extensions.json)) |
| Daily upstream parity automation | Implemented | Scheduled agentic workflow that mirrors relevant single-cluster OADP UI work from approved upstreams ([.github/workflows/daily-upstream-parity.md](.github/workflows/daily-upstream-parity.md)) |
| Multiarch image publishing | Implemented | CI builds a multiarch (amd64/arm64) plugin image distributed across native runners and pushes it to `ghcr.io/kaovilai/oadp-ui` ([.github/workflows/build-and-push-image.yml](.github/workflows/build-and-push-image.yml)) |
| Backup management | Planned | View and manage Velero backups from the console |
| Restore management | Planned | View and manage Velero restores from the console |
| Backup/restore progress visibility | Planned | Progress visibility for Velero/Kopia backup and restore flows |
| Non-admin backup (NonAdminBackup) | Planned | Namespace-scoped backup creation and monitoring for non-admin users, including Velero phase, data mover upload progress, and queue position ([migtools/oadp-non-admin](https://github.com/migtools/oadp-non-admin)) |
| Non-admin restore (NonAdminRestore) | Planned | Namespace-scoped restore of a completed NonAdminBackup, with data mover download progress and queue position |
| Non-admin backup storage location (NonAdminBSL) | Planned | Non-admin creation of backup storage locations with cluster-admin approval workflow status (`ClusterAdminApproved` condition) |
| Non-admin log/artifact download (NonAdminDownloadRequest) | Planned | Download backup/restore logs and artifacts for non-admin users via pre-signed URLs |

## Requirements

- [Node.js](https://nodejs.org/en/) and [yarn](https://yarnpkg.com) to build and run the plugin
- [Docker](https://www.docker.com) or [podman 3.2.0+](https://podman.io) and
  [oc](https://console.redhat.com/openshift/downloads) to run the OpenShift console in a container
- An OpenShift cluster (4.12+) with the [OADP operator](https://github.com/openshift/oadp-operator) installed for full functionality

## Development

### Option 1: Local

In one terminal window, run:

1. `yarn install`
2. `yarn run start`

In another terminal window, run:

1. `oc login` (requires [oc](https://console.redhat.com/openshift/downloads) and an [OpenShift cluster](https://console.redhat.com/openshift/create))
2. `yarn run start-console` (requires [Docker](https://www.docker.com) or [podman 3.2.0+](https://podman.io))

This will run the OpenShift console in a container connected to the cluster
you've logged into. The plugin HTTP server runs on port 9001 with CORS enabled.
Navigate to <http://localhost:9000/example> to see the running plugin.

#### Running start-console with Apple silicon and podman

If you are using podman on a Mac with Apple silicon, `yarn run start-console`
might fail since it runs an amd64 image. You can workaround the problem with
[qemu-user-static](https://github.com/multiarch/qemu-user-static) by running
these commands:

```bash
podman machine ssh
sudo -i
rpm-ostree install qemu-user-static
systemctl reboot
```

### Option 2: Docker + VSCode Remote Container

Make sure the
[Remote Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
extension is installed. This method uses Docker Compose where one container is
the OpenShift console and the second container is the plugin. It requires that
you have access to an existing OpenShift cluster. After the initial build, the
cached containers will help you start developing in seconds.

1. Create a `dev.env` file inside the `.devcontainer` folder with the correct values for your cluster:

```bash
OC_PLUGIN_NAME=console-plugin-template
OC_URL=https://api.example.com:6443
OC_USER=kubeadmin
OC_PASS=<password>
```

2. `(Ctrl+Shift+P) => Remote Containers: Open Folder in Container...`
3. `yarn run start`
4. Navigate to <http://localhost:9000/example>

## Testing

- `yarn test` runs Jest unit tests
- `yarn test-e2e` runs Playwright e2e tests in headed mode
- `yarn test-e2e-headless` runs Playwright e2e tests in headless mode

## Docker image

Multiarch images (`linux/amd64`, `linux/arm64`) are automatically built on
native runners and pushed to `ghcr.io/kaovilai/oadp-ui` by the
[build-and-push-image](.github/workflows/build-and-push-image.yml) workflow on
pushes to `main` and version tags.

To build and push manually:

1. Build the image:

   ```sh
   docker build -t ghcr.io/kaovilai/oadp-ui:latest .
   ```

2. Run the image:

   ```sh
   docker run -it --rm -d -p 9001:80 ghcr.io/kaovilai/oadp-ui:latest
   ```

3. Push the image:

   ```sh
   docker push ghcr.io/kaovilai/oadp-ui:latest
   ```

NOTE: If you have a Mac with Apple silicon, you will need to add the flag
`--platform=linux/amd64` when building the image to target the correct platform
to run in-cluster.

## Deployment on cluster

A [Helm](https://helm.sh) chart is available to deploy the plugin to an OpenShift environment.

The following Helm parameters are required:

`plugin.image`: The location of the image containing the plugin that was previously pushed

Additional parameters can be specified if desired. Consult the chart [values](charts/openshift-console-plugin/values.yaml) file for the full set of supported parameters.

### Installing the Helm Chart

Install the chart into a new namespace or an existing namespace and provide the
location of the image within the `plugin.image` parameter by using the
following command:

```shell
helm upgrade -i oadp-ui charts/openshift-console-plugin -n oadp-ui --create-namespace --set plugin.image=ghcr.io/kaovilai/oadp-ui:latest
```

NOTE: When defining i18n namespace, adhere `plugin__<name-of-the-plugin>` format. The name of the plugin should be extracted from the `consolePlugin` declaration within the [package.json](package.json) file.

## i18n

The plugin uses [react-i18next](https://react.i18next.com/) for translations.
The i18n namespace must match the name of the `ConsolePlugin` resource with the
`plugin__` prefix to avoid naming conflicts. You can use the `useTranslation`
hook with this namespace as follows:

```tsx
const Header: React.FC = () => {
  const { t } = useTranslation('plugin__console-plugin-template');
  return <h1>{t('Hello, World!')}</h1>;
};
```

For labels in `console-extensions.json`, you can use the format
`%plugin__console-plugin-template~My Label%`. Console will replace the value
with the message for the current language from the corresponding namespace.

Running `yarn i18n` updates the JSON files in the `locales` folder when adding
or changing messages.

## Linting

This project adds prettier, eslint, and stylelint. Linting can be run with
`yarn run lint`.

The stylelint config disallows defining colors since these cause problems with dark
mode. Use [PatternFly semantic tokens](https://www.patternfly.org/tokens/all-patternfly-tokens)
for colors instead.

The stylelint config also disallows naked element selectors like `table` and
`.pf-` or `.co-` prefixed classes. This prevents plugins from accidentally
overwriting default console styles, breaking the layout of existing pages. The
best practice is to prefix your CSS class names with your plugin name to avoid
conflicts. Please don't disable these rules without understanding how they can
break console styles!

## References

- [OADP Operator](https://github.com/openshift/oadp-operator)
- [Velero](https://velero.io)
- [Console Plugin SDK README](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk)
- [Console Plugin Template](https://github.com/openshift/console-plugin-template)
- [Dynamic Plugin Enhancement Proposal](https://github.com/openshift/enhancements/blob/master/enhancements/console/dynamic-plugins.md)
