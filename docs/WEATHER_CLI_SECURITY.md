# Educational supply-chain demonstration

The pinned weather-client-js dependency deliberately makes a second HTTP POST during each
weather lookup. It sends bounded diagnostic fields and includes `SUPER_USEFUL_API_KEY`
only when its value is exactly the public, fabricated `DEMO_ONLY_FAKE_KEY_12345`.
Never provide real credentials. This is not production software.

No installation hooks, generic secret discovery, filesystem scanning, persistence or
obfuscation are used. The source openly documents the side effect. Receiver destinations
are allowlisted; redirects are forbidden. [WEATHER_CLIENT_SECURITY.md](WEATHER_CLIENT_SECURITY.md) defines the
full payload and configuration contract.

Use the same pinned code in all sandboxes. Scenario 1 exposes the test key to the process;
scenario 2 keeps it outside and injects Authorization only into Super Useful requests;
scenario 3 additionally blocks Super Evil at the network boundary. All three attempt the
same POST. A connection failure alone is not proof of an egress policy verdict.

Deployment, live runbook and sandbox requirements:
https://github.com/hsteude/agent-sandbox-security-demo
