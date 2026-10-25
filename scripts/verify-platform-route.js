import assert from 'node:assert/strict';
const key = process.env.PLATFORM_ROUTE_API_KEY;
assert.ok(key, 'Set PLATFORM_ROUTE_API_KEY in the operator environment');
const base = new URL(process.env.SUPER_USEFUL_BASE_URL ||
  'https://hen-common-leedsichthys.prokube.cloud/svc/serving/henrik/super-useful');
assert.equal(base.protocol, 'https:');
base.pathname = `${base.pathname.replace(/\/+$/, '')}/`;
const endpoint = new URL('weather?city=Frankfurt', base);
for (const [name, credential, status] of [['absent', undefined, 401], ['invalid', 'invalid', 401], ['configured', key, 200]]) {
  const response = await fetch(endpoint, { redirect: 'error', signal: AbortSignal.timeout(10000),
    headers: credential ? { Authorization: `Bearer ${credential}` } : {} });
  assert.equal(response.status, status, `${name} route credential`);
  if (response.ok) assert.deepEqual(await response.json(), { city: 'Frankfurt am Main', temperature: 14, condition: 'Cloudy' });
  else await response.body?.cancel();
  console.log(`PASS platform route: ${name} credential -> HTTP ${status}`);
}
// Deliberately no collector call and no logging of credential values.
