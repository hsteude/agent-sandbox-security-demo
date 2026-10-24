# Verification record — 2026-10-24

## Completed and verified

- All three independent public GitHub repositories implemented and published.
- Dependency pinned to `0b65fe9835970d4a71fd1598660a74258c6969a0`.
- CLI tested at `2f6ab5e0ad24634950d9c7d07b149c67e252cb24`, including a committed lockfile.
- Client tests: correct weather request/auth header, missing-key request without Authorization,
  exact-key-only collector transmission, unexpected-key omission, additional POST on weather
  failure, response validation, forbidden destination, rejected redirects, bounded timeout,
  weather success despite collector failure, and restricted application environment reads.
- CLI tests: correct Frankfurt output, unauthorized response, missing-key fixture, malformed
  JSON, network failure and collector attempt for every exercised weather operation.
- Service tests: required startup configuration, valid/missing/invalid authentication, weather
  JSON, health endpoints, collector with/without key, unexpected fields and credentials,
  malformed/oversized bodies, media type, stale timestamps, log injection and readable safe logs.
- Clean GitHub checkout with `npm ci` and tests; local injection proxy fixture verified the
  actual authenticated API with no credential in the CLI environment. The connection-reset
  fixture verified collector failure isolation. These are application tests, not policy guarantees.
- Separate fresh Node 24 Alpine container, no host auth/config/cache mounted: anonymous GitHub
  clone, `npm ci`, tests, `npm install`, and unchanged lockfile all passed.
  npm canonicalizes the GitHub lock entry as `git+ssh` but uses the public HTTPS archive;
  codeload access is required. The usual skipped Git integrity-check warning is expected.
- Both images built for linux/amd64 and linux/arm64, pushed to Docker Hub with tag
  `v1.0.0-20261024`. Anonymous registry pull authorization verified for the recorded digests.
- Local image tests passed on native ARM64 and emulated AMD64: both services start read-only/non-root, custom PORT values work,
  healthcheck commands pass, authentication is enforced, collector behavior/logging works.
- Manifests parse and pass deployment invariant tests. Both passed offline JSON Schema
  validation against the upstream Knative v1.20.0 Service CRD. Actual cluster admission
  webhooks/features are not covered by offline schema validation.
- Bash scripts pass syntax checks. The real `deploy.sh` offline path exits clearly and
  performs no resource mutations when connectivity is unavailable.

Primary reproduction commands:

```bash
# In weather-client-js and weather-cli:
npm ci && npm test
# In this infrastructure repository:
npm ci && npm test
./scripts/test-clean-install.sh
./scripts/test-anonymous-install.sh
./scripts/test-containers.sh
```

Local test checkout artifacts are ignored under `.verification/`; essential implementation
and reproducible scripts are committed. No essential files are stored in temporary directories.

## Implemented, not deployed

`super-useful` and `super-evil` Knative services in namespace `henrik`, min-scale 1,
digest-pinned images, Secret creation, deployment/status/test/log scripts, live runbook
and sandbox handoff. The initial cluster check and final deployment attempt found the
cluster unavailable. No service URL was discovered and no running-cluster claim is made.

## Pending real-cluster testing

- Knative admission, readiness, image pulls, probes, min-scale and service routing.
- Actual service URLs and DNS/network reachability from the Mac and every sandbox.
- `./scripts/test-services.sh` against live routes; actual log following across replicas.
- If public collector routing is needed: verify ownership, add its exact hostname to the
  dependency allowlist, publish and repin once, then rerun installation tests before the talk.

## Pending actual sandbox integration

- Operator provisions three sandboxes; none were created by this implementation.
- Real credential injection must preserve API authentication while keeping the key inaccessible
  to the agent and dependency. Validate the actual Node fetch/proxy/TLS transport.
- Real egress enforcement must block only the collector path while allowing weather, DNS,
  GitHub and installation traffic. Shared Knative gateway IPs may require host-aware enforcement.
- Collect real policy-deny evidence and correlate it with client/run logs. If no verdict
  telemetry exists, describe the observed failure as unconfirmed rather than a proven block.
- Rehearse the exact same prompt and code with your actual coding agent. Its willingness
  to execute the transparently disclosed dependency is not guaranteed by software tests.

No end-to-end Kubernetes sandbox security demonstration has yet been verified.
