// Local transport fixtures only. This is NOT a sandbox isolation or egress-policy test.
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { makeUseful } from '../services/super-useful.js';
import { makeEvil } from '../services/super-evil.js';
import { DEMO_KEY } from '../services/common.js';

const servers = [];
async function serve(server) {
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
try {
  const useful = await serve(makeUseful(DEMO_KEY));
  const evil = await serve(makeEvil());
  let payload;
  let inject = false;
  let simulateFailure = false;
  const gateway = await serve(http.createServer(async (req, res) => {
    try {
      if (req.url === '/collect' && simulateFailure) { req.socket.destroy(); return; }
      let body = '';
      for await (const chunk of req) body += chunk;
      const isWeather = req.url.startsWith('/weather?');
      const headers = { 'Content-Type': 'application/json' };
      for (const name of ['x-demo-run-id', 'x-demo-scenario']) {
        if (req.headers[name]) headers[name] = req.headers[name];
      }
      if (req.headers.authorization) headers.Authorization = req.headers.authorization;
      if (isWeather && inject) {
        assert.equal(req.headers.authorization, undefined);
        headers.Authorization = `Bearer ${DEMO_KEY}`;
      }
      if (!isWeather) payload = JSON.parse(body);
      const response = await fetch(new URL(req.url, isWeather ? useful : evil), {
        method: req.method, headers, body: body || undefined, signal: AbortSignal.timeout(1000)
      });
      res.writeHead(response.status); res.end(await response.text());
    } catch { res.writeHead(500); res.end(); }
  }));
  for (const scenario of [1, 2, 3]) {
    payload = undefined;
    inject = scenario !== 1;
    simulateFailure = scenario === 3;
    const env = { ...process.env, SUPER_USEFUL_BASE_URL: gateway, DEMO_COLLECTOR_URL: `${gateway}/collect`,
      DEMO_SCENARIO: `local-fixture-${scenario}`, DEMO_RUN_ID: randomUUID(), HTTP_TIMEOUT_MS: '500' };
    delete env.SUPER_USEFUL_API_KEY;
    if (scenario === 1) env.SUPER_USEFUL_API_KEY = DEMO_KEY;
    const child = spawn(process.execPath, [process.argv[2]], { env });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    assert.equal(await new Promise(resolve => child.on('close', resolve)), 0, output);
    assert.match(output, /Weather information retrieved successfully/);
    assert.match(output, /Attempting request to Super Evil/);
    if (scenario === 1) assert.equal(payload.apiKey, DEMO_KEY);
    if (scenario === 2) { assert.ok(payload); assert.equal(payload.apiKey, undefined); }
    if (scenario === 3) { assert.equal(payload, undefined); assert.match(output, /cause unconfirmed/); }
    console.log(output);
    console.log(`PASS local transport fixture ${scenario} — no real sandbox guarantee asserted`);
  }
} finally {
  for (const server of servers) { server.closeAllConnections(); server.close(); }
}
