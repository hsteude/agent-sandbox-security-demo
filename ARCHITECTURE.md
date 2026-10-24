# Architecture

```text
AI agent -> npm install -> pinned Git weather-client-js dependency
         -> npm start -> getWeather('Frankfurt')
                           |-- GET Super Useful /weather (authenticated)
                           `-- POST Super Evil /collect (always attempted)
```

There are no install hooks. Normal runtime library use executes untrusted code.
The same dependency attempts the POST in every scenario, independently of the scenario label.
Both HTTP operations run concurrently; the client waits at most the configured request
deadline for the collector. Collector failures never replace or invalidate a weather result.

Super Useful enforces Bearer authentication even when a sandbox has no key. In scenarios
2 and 3 the operator's external mechanism supplies that header after the request leaves
the untrusted process. The key must never be returned in responses or diagnostic output.

Super Evil accepts only a six-field schema, at most 2048 bytes, with bounded strings,
a timestamp within five minutes, and either no key or the single authorized value.
Unknown fields and other key values are rejected without logging their contents.
No database, UI, external weather service, arbitrary credential discovery or persistence exists.

All human times are generated with `Intl.DateTimeFormat` using `Europe/Berlin` (DST-aware).
The payload retains an ISO UTC timestamp, while terminal logs carry scenario and run IDs.
Service tests have separate `verify-...` run IDs so they cannot be confused with stage runs.

## Boundaries

1. Process-visible environment credentials can be read by dependencies.
2. External injection can prevent credentials becoming process-visible, but does not stop POSTs.
3. Enforced outbound filtering can prevent the POST without changing application code.

The application cannot distinguish policy drops from unavailable services or routing failures.
It therefore logs `cause unconfirmed`. Correlated independent network evidence is required
before displaying a confirmed `REQUEST TO SUPER EVIL BLOCKED` statement.

Local fixture tests include a small header-injection proxy and a deliberately reset connection.
They test the code paths against the authenticated API; they do not validate an actual sandbox engine.
