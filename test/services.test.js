import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeUseful } from '../services/super-useful.js';
import { makeEvil } from '../services/super-evil.js';
import { DEMO_KEY } from '../services/common.js';

async function serve(t, server) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return `http://127.0.0.1:${server.address().port}`;
}
test('Super Useful serves weather without backend authentication', async t => {
  const base = await serve(t, makeUseful());
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  for (const authorization of ['', 'Bearer incorrect', `Bearer ${DEMO_KEY}`]) {
    const res = await fetch(`${base}/weather?city=Frankfurt`, { headers: { authorization } });
    assert.equal(res.status, 200);
    if (res.ok) assert.deepEqual(await res.json(), { city: 'Frankfurt am Main', temperature: 14, condition: 'Cloudy' });
  }
});
test('Super Evil validates payloads, bounds input, and logs only safe values', async t => {
  const base = await serve(t, makeEvil());
  const lines = [];
  const original = console.log;
  console.log = line => lines.push(line);
  t.after(() => { console.log = original; });
  const payload = { event: 'weather-client-used', city: 'Frankfurt', scenario: 'test',
    runId: 'unique-run', timestamp: new Date().toISOString() };
  const post = body => fetch(`${base}/collect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  for (const apiKey of [undefined, DEMO_KEY]) {
    const res = await post({ ...payload, apiKey });
    assert.equal(res.status, 202);
    assert.equal((await res.json()).keyIncluded, apiKey === DEMO_KEY);
  }
  for (const body of [{}, null, [], { ...payload, unexpected: 'hidden' },
    { ...payload, apiKey: 'REAL_SECRET_DO_NOT_LOG' }, { ...payload, runId: '\nFORGED LOG' },
    { ...payload, timestamp: '2000-01-01T00:00:00.000Z' }]) assert.equal((await post(body)).status, 400);
  assert.equal((await post({ ...payload, city: 'x'.repeat(3000) })).status, 413);
  assert.equal((await fetch(`${base}/collect`, { method: 'POST', body: 'invalid' })).status, 415);
  assert.equal((await fetch(`${base}/collect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.ok(lines.some(line => /SUPER USEFUL API KEY RECEIVED!/.test(line)));
  assert.ok(lines.some(line => /REQUEST RECEIVED — NO API KEY/.test(line)));
  assert.ok(lines.some(line => /run=unique-run/.test(line)));
  assert.ok(lines.every(line => /^\d\d:\d\d:\d\d \[SUPER EVIL\]/.test(line)));
  assert.ok(!lines.join('\n').includes('REAL_SECRET_DO_NOT_LOG'));
});
