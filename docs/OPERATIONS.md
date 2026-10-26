# Current deployment and verification

Stage commands are in [README.md](../README.md). Workspace/namespace: `henrik`.
Use `$HOME/.kube/hen-common-leedsichthys.config`; do not change the current context.

## Runtime

- Super Useful provides deterministic Frankfurt weather. The external platform route
  authenticates requests; the backend itself has no key or Secret dependency.
- Every `weather-client-js.getWeather()` attempts a weather GET and a collector POST.
  There are no install hooks, file reads or generic credential discovery.
- The collector payload contains `event`, `city`, `scenario`, `runId`, `timestamp`
  and optionally the single operator-authorized weather key. Client and collector
  verify its SHA-256 fingerprint. Other key values, including injection placeholders,
  are not forwarded by the client. Collector redirects are forbidden and destinations
  are restricted to the controlled internal receiver and local test endpoints.
- Super Evil is unauthenticated, validates bounded payloads and deliberately displays
  the authorized key on reception. Both services log Berlin time, service and message;
  scenario, run ID and the payload timestamp are omitted from visible service logs.
- Injection replaces an existing header: clients must send placeholder credentials.
  The platform supplies the trusted CA bundle for intercepted HTTPS automatically.
- Sandbox 3 allows only HTTPS to Anthropic, the platform host, GitHub, codeload and npm.
  The shared platform host is not a path-level restriction. Super Evil is excluded.

## Credentials

| Secret | Field | Use |
|---|---|---|
| `anthropic-api-key` | `ANTHROPIC_API_KEY` | `x-api-key` injection for `api.anthropic.com` in all sandboxes |
| `weather-demo-platform-key` | `SUPER_USEFUL_API_KEY` | Process credential in scenario 1; Bearer injection in 2/3 |

Both Secrets have `prokube.ai/user-secret=true` and
`prokube.ai/sandbox-credential=true`. The receiver uses only the fingerprint from
`demo-config.json`. Images contain no platform-key value. The local stage README
uses `pk_live_xxxx` as a placeholder for the temporary weather key in scenario 1.

## Build and deploy

Requires Node.js 22+, Docker/buildx, kubectl and access to the existing Knative setup.

```bash
./scripts/build-push.sh NEW_VERSION_TAG
node scripts/render-manifests.js
./scripts/deploy.sh
./scripts/status.sh
```

`images.json` and `manifests/` record immutable image digests. Current service release:
`v1.2.2-20261025`, revisions `super-useful-00005` and `super-evil-00005`.
The gateway NetworkPolicy in `networking/allow-substrate-egress-to-knative.yaml`
is the existing shared-infrastructure exception; normal sandbox setup does not apply it.

## Checks

```bash
npm ci
npm test
./scripts/test-services-in-cluster.sh
./scripts/test-containers.sh
./scripts/test-clean-install.sh
./scripts/test-anonymous-install.sh
```

For positive-key integration checks, supply `PLATFORM_ROUTE_API_KEY` in the local
operator environment, then run:

```bash
node scripts/verify-platform-route.js
node scripts/verify-authorized-collector.js
./scripts/test-clean-install.sh
```

## Observed results (2026-10-25)

- Actual Haiku runs: weather succeeds in all three sandboxes. Collector logs confirm
  authorized-key reception in 1 and a request without the key in 2. In 3 the client
  reports a collector connection failure; no correlated gateway denial was captured.
- These runs used the same prompt with `sh -c` selecting the installed project directory.
  The current README delegates cloning from main, installation and execution
  to Claude on fresh sandboxes. That exact prompt variant has not yet been rerun end to end.
- After adding GitHub/codeload/npm to sandbox 3, a fresh clone and installation with
  an empty npm cache passed under its final allowlist.
- Service unit tests and internal cluster verification passed for `v1.2.2`.
- Local three-scenario fixtures passed earlier with the authorized key. They exercise
  application behavior, not actual network-policy enforcement.

## Logs

```bash
./scripts/logs.sh useful
./scripts/logs.sh evil
```

Use the platform route for sandbox weather requests. Knative's advertised
`*.henrik.example.com` URLs do not resolve in this environment. Internal checks use
`super-useful.henrik.svc.cluster.local` and `super-evil.henrik.svc.cluster.local`.
