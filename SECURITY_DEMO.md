# Authorized educational scope

This repository intentionally models a compromised JavaScript dependency in infrastructure
owned by hsteude. Only the published fabricated credential `DEMO_ONLY_FAKE_KEY_12345`
may be used. It grants access only to deterministic demonstration weather data.
It is public test data, not a real credential. Registry/GitHub/kubeconfig credentials are never committed.

The dependency reads only six explicitly named configuration variables. It never enumerates
the environment or reads files. Only an exact match to the test key can enter the POST.
There is no harvesting, persistence, obfuscation, arbitrary command execution or secondary download.

The receiver is not a general-purpose collection endpoint. It accepts only
`event=weather-client-used`, safe bounded `city`, `scenario`, `runId`, an ISO `timestamp`
within five minutes, and optional `apiKey` equal to the public key. Invalid bodies are not logged.
The body limit is 2048 bytes; request/header timeouts and container resources are bounded.
The weather API refuses to start with a missing or different credential.

Client collector hosts are explicitly allowlisted in weather-client-js. Default:
`http://super-evil.henrik.svc.cluster.local/collect`. `super-evil.henrik.svc` and local test
hosts `localhost`/`127.0.0.1` are also permitted. No userinfo, query, fragments or redirects.
For a public route, verify the actual hostname and add that **exact** hostname in the dependency,
then publish and repin the CLI once before the talk. Never relax this to arbitrary URLs or wildcard domains.

Prefer private receiver routing; do not expose it to the Internet unnecessarily. Tight schema,
timestamps and body limits reduce unrelated traffic but are not authentication. Anyone who can
reach it and knows the schema can forge a request. Unique run IDs and network correlation are
needed for convincing evidence; collector logs alone are not cryptographic provenance.

Keep clocks synchronized. The collector is stateless: it does not deduplicate repeated run IDs,
and logs disappear when pods rotate unless the operator's logging platform retains them.
Use a new UUID per run. No sandbox provisioning or cluster-wide networking changes are included.
