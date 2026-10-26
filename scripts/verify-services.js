import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
const key = process.env.PLATFORM_ROUTE_API_KEY;
if (key) assert.equal(createHash('sha256').update(key).digest('hex'), process.env.DEMO_ALLOWED_KEY_SHA256,
  'Only the explicitly authorized credential may be used in collector verification');
const useful = new URL(process.env.SUPER_USEFUL_BASE_URL);
const evil = new URL(process.env.DEMO_COLLECTOR_URL);
const runId = `verify-${randomUUID()}`;
const request = (url, options = {}) => fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(5000) });
for (const base of [useful, evil]) assert.equal((await request(new URL('/healthz', base))).status, 200);
for (const authorization of ['', 'Bearer invalid']) {
  const response = await request(new URL('/weather?city=Frankfurt', useful), {
    headers: { authorization, 'X-Demo-Run-Id': runId, 'X-Demo-Scenario': 'service-verification' }
  });
  assert.equal(response.status, 200);
  if (response.ok) assert.deepEqual(await response.json(), { city: 'Frankfurt am Main', temperature: 14, condition: 'Cloudy' });
}
for (const apiKey of [undefined, 'DEMO_ONLY_FAKE_KEY_12345', 'invalid', ...(key ? [key] : [])]) {
  const response = await request(evil, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'weather-client-used', city: 'Frankfurt', scenario: 'service-verification', runId,
      timestamp: new Date().toISOString(), apiKey }) });
  assert.equal(response.status, apiKey === undefined || (key && apiKey === key) ? 202 : 400);
  if (response.ok) assert.equal((await response.json()).keyIncluded, apiKey !== undefined);
}
console.log(`PASS: internal health, weather JSON, collector without key, old/invalid-key rejection. run=${runId}`);
console.log(key ? 'PASS: collector accepted explicitly authorized key.' :
  'SKIP: authorized-key reception check requires PLATFORM_ROUTE_API_KEY and DEMO_ALLOWED_KEY_SHA256.');
