# Verification record

## Current release — 2026-10-25

- Removed Super Useful's duplicate backend credential check and Secret environment reference.
  Its logs now say `Weather request received`; only the platform route authenticates.
- Built/published both image tags `v1.1.0-20261025` for AMD64/ARM64. Current image digests
  are in `images.json`. Deployed revisions `super-useful-00002` and `super-evil-00002` are Ready.
- Current CLI: `22f48278ef0272fe2f90b1ec2cfd574f778f111f`; client:
  `8093f8652990296ad00f7461f1cbadeb0b71607b`. The default weather URL is the external HTTPS
  platform route; tests cover preserving a non-root base path with and without a trailing slash.
- External `/svc/serving/henrik/super-useful/weather?city=Frankfurt` verified: absent key 401,
  invalid key 401, operator-provided platform key 200 with exact deterministic weather JSON.
  That key was used only against the weather route; it was not committed or sent to the collector.
- Passed service/client/CLI tests, local container checks with no backend key, real internal
  route checks, fresh GitHub installation, anonymous-container installation, distribution
  key-literal guard, and the three local synthetic transport fixtures. Local fixture authentication
  now occurs at its gateway, mirroring the changed boundary rather than in the weather backend.
- Scenario 1 using the platform key remains pending: client and collector still authorize only
  the original fabricated value for diagnostic transmission. Real sandbox injection/egress
  rehearsal with the external route remains pending. See PLATFORM_ROUTE.md and LIVE_DEMO.md.

## Historical October 24 verification

The following record describes the previous backend-authenticated architecture; its original
credential checks, revisions and image tags are superseded by the current release above.

## Completed and verified

- All three independent public GitHub repositories implemented and published.
- Dependency pinned to `7b0a450798501d2656887c6d71f705c30e9f3b97`.
- CLI tested at `bb034373ef0e1d495c962b4c4fd033c3bdd04c17`, including a committed lockfile.
- Operator disclosures moved into this repository's `docs/` directory before the subsequent
  credential-fingerprint update.
- Removed the operator key literal from current application source and tests and removed
  scenario presets from the CLI environment example. The client now validates an externally
  supplied value against a SHA-256 fingerprint. Positive authorized-key behavior is checked
  by this repository's local integration suite; client tests retain absent/incorrect-key checks.
  The clean-install distribution check also rejects a key literal in current CLI files or the
  installed dependency. Historical Git commits and earlier agent sessions still contain it.
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

## Deployed and verified in the live cluster

On 2026-10-24 at approximately 21:08 Europe/Berlin, deployed `super-useful` and `super-evil`
in namespace `henrik`. Both report Ready, with revisions `super-useful-00001` and
`super-evil-00001`, one running pod each, and the published digest-pinned images.
The API Secret was created and Knative accepted the manifests and health probes.

Verified from the running Super Useful container through the actual internal Knative routes:

- `http://super-useful.henrik.svc.cluster.local`
- `http://super-evil.henrik.svc.cluster.local/collect`

Both health endpoints, missing/invalid/valid authentication, deterministic weather JSON,
collector requests with/without the test key, and invalid-key rejection passed. Logs were
read from both live services and correlated with run `verify-dca83bc8-c1a1-4a7c-aa72-1681be7fe1c0`.
Reproduce with `./scripts/test-services-in-cluster.sh` (requires pods/exec access).

The cluster publishes `http://super-useful.henrik.example.com` and
`http://super-evil.henrik.example.com` as status URLs. These do not resolve from the Mac.
Consequently `deploy.sh` created Ready services but its external endpoint check exited
unsuccessfully. Internal checks passed separately; no cluster-wide DNS/ingress settings
were changed. Public access is not verified or configured.

## Pending real-cluster testing

- DNS/network reachability from every actual sandbox and any desired public/Mac access.
- Long-running min-scale behavior and log following across future replica changes.
- If public collector routing is needed: verify ownership, add its exact hostname to the
  dependency allowlist, publish and repin once, then rerun installation tests before the talk.

## Pending actual sandbox integration

### Substrate networking correction (2026-10-24)

Live Substrate egress logs showed both requests from actor
`henrik/sbx-demo-1-full-internet-access`, including the 21:22 Europe/Berlin attempt.
The internal Knative gateway's ingress policies did not allow the `ate-system` source.
With explicit owner approval, applied `allow-substrate-egress-to-knative` in `istio-system`,
allowing only `app=atenet-egress` pods in `ate-system` to the gateway on TCP 8081.
Server-side dry-run and apply succeeded. Existing policies were preserved.
Direct gateway-container HTTP verification was unavailable because its image has no shell.
The next actual sandbox `npm start` must establish end-to-end success; policy application
alone is not recorded as a successful sandbox run.

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
