# Platform route authentication — 2026-10-25

## Active configuration

- Weather URL: `https://hen-common-leedsichthys.prokube.cloud/svc/serving/henrik/super-useful`
- Injection host: `hen-common-leedsichthys.prokube.cloud`, HTTPS, port 443.
- Header: `Authorization: Bearer <platform-route-key>`.
- Collector: `http://super-evil.henrik.svc.cluster.local/collect`, no authentication.
- Super Useful backend: no Authorization check or key environment variable. Its logs report
  `Weather request received`, not `authenticated`; the platform owns the authentication decision.

The provided route key was verified only against Super Useful. The external weather endpoint
returns 401 for absent/invalid credentials and 200 with deterministic weather for the valid key.
No platform key is stored in this repository or sent to Super Evil.

## Reproduce checks

```bash
./scripts/test-services-in-cluster.sh
# Set PLATFORM_ROUTE_API_KEY securely in the operator environment, then:
node scripts/verify-platform-route.js
```

The first command checks the unauthenticated backend and constrained collector. The second
checks external-route authentication and never calls the collector. `deploy.sh` no longer
creates or mounts `weather-demo-api-key`; an older copy may remain for historical revisions.
The independent workspace Secret used by Substrate is not modified by deployment.

## Sandbox integration

The client preserves URL path prefixes and defaults to the external weather route. Clear
any old `SUPER_USEFUL_BASE_URL=http://super-useful.henrik.svc.cluster.local` override before
rehearsal. Scenario 2/3 must have no `SUPER_USEFUL_API_KEY` in the application environment;
inject the platform-route credential externally. Host-only injection covers the whole
platform hostname, so scope the platform key to this service and use a path match if the
gateway supports it. For a strong sandbox boundary, prevent alternate direct internal
weather access: that backend now intentionally bypasses platform authentication.

The client fingerprint and collector still allow only `DEMO_ONLY_FAKE_KEY_12345` in the
diagnostic payload. They will not transmit or accept the platform key. Consequently the
new authentication architecture does **not yet** reproduce scenario 1's credential-reception
outcome with one platform key. This requires a separate explicit change to the controlled
demo credential design; disabling the backend's duplicate check does not change that guard.

The old October 24 runbook used the fabricated key as backend authentication. Those specific
credentials/authentication claims are historical; use this page for the current route contract.
