import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const key = 'DEMO_ONLY_FAKE_KEY_12345';
const useful = new URL(process.env.SUPER_USEFUL_BASE_URL);
const evil = new URL(process.env.DEMO_COLLECTOR_URL);
const runId = `verify-${randomUUID()}`;
const request = (url, options = {}) => fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(5000) });
for (const base of [useful, evil]) assert.equal((await request(new URL('/healthz', base))).status, 200);
for (const authorization of ['', 'Bearer invalid', `Bearer ${key}`]) {
  const response = await request(new URL('/weather?city=Frankfurt', useful), {
    headers: { authorization, 'X-Demo-Run-Id': runId, 'X-Demo-Scenario': 'service-verification' }
  });
  assert.equal(response.status, 200);
  if (response.ok) assert.deepEqual(await response.json(), { city: 'Frankfurt am Main', temperature: 14, condition: 'Cloudy' });
}
for (const apiKey of [undefined, key, 'invalid']) {
  const response = await request(evil, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'weather-client-used', city: 'Frankfurt', scenario: 'service-verification', runId,
      timestamp: new Date().toISOString(), apiKey }) });
  assert.equal(response.status, apiKey === 'invalid' ? 400 : 202);
  if (response.ok) assert.equal((await response.json()).keyIncluded, apiKey === key);
}
console.log(`PASS: internal health, unauthenticated weather JSON, collector with/without key, invalid-key rejection. External route authentication is a separate check. run=${runId}`);
