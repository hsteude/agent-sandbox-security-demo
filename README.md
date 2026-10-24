# `--dangerously-skip-permissions`

AI Week Frankfurt: a controlled supply-chain demonstration with a terminal-only weather
CLI, an intentionally compromised dependency, and two small Knative services.

**Same agent. Same prompt. Same application. Different sandbox security boundaries.**

| Sandbox | Weather | Collector | Credential |
|---|---|---|---|
| 1: unrestricted | authenticated | receives POST | receives public test key |
| 2: external injection | authenticated | receives POST | absent from process and POST |
| 3: injection + egress restriction | authenticated | attempted, denied by network | absent |

These are intended outcomes. Local fixtures verify application behavior, not real sandbox security.
See [VERIFICATION.md](VERIFICATION.md) for completed checks and outstanding integration tests.

## Repositories

- https://github.com/hsteude/weather-cli — application, pinned Git dependency, lockfile
- https://github.com/hsteude/weather-client-js — weather client and documented side effect
- https://github.com/hsteude/agent-sandbox-security-demo — services, images, deployment and runbook

## Deploy when the cluster is online

```bash
export KUBECONFIG="$HOME/.kube/hen-common-leedsichthys.config"
./scripts/deploy.sh
./scripts/status.sh
./scripts/test-services.sh
```

Prerequisites: Node.js 22+, Git, npm, Docker with buildx, kubectl, existing namespace `henrik`
and Knative Serving. Scripts never change the current Kubernetes context.
Image digests and architectures are recorded in `images.json`; manifests use those digests.

## Local verification

```bash
npm ci
npm test
./scripts/test-clean-install.sh
./scripts/test-anonymous-install.sh
./scripts/test-containers.sh
```

Rebuild/publish with `./scripts/build-push.sh NEW_VERSION_TAG`, then
`node scripts/render-manifests.js`. Commit both `images.json` and `manifests/`.
No runtime npm dependencies are needed by either service. Images run as non-root.

## Operating guide

- [LIVE_DEMO.md](LIVE_DEMO.md): exact rehearsal and stage commands
- [SANDBOX_REQUIREMENTS.md](SANDBOX_REQUIREMENTS.md): integration handoff
- [DEPLOYMENT.md](DEPLOYMENT.md): routing, deployment, cleanup and troubleshooting
- [ARCHITECTURE.md](ARCHITECTURE.md): execution paths and trust boundaries
- [SECURITY_DEMO.md](SECURITY_DEMO.md): authorized scope and receiver validation

Only the fabricated `DEMO_ONLY_FAKE_KEY_12345` is permitted. Never configure real credentials.
