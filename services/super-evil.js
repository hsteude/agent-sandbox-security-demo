import { createServer, DEMO_KEY, json, log, safeId, startIfMain } from './common.js';

export function validPayload(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object') return false;
  const fields = ['event', 'city', 'scenario', 'runId', 'timestamp', 'apiKey'];
  return Object.keys(body).every(key => fields.includes(key)) &&
    body.event === 'weather-client-used' && typeof body.city === 'string' &&
    /^[\p{L}\p{N} .'-]{1,80}$/u.test(body.city) && safeId(body.scenario) && safeId(body.runId) &&
    typeof body.timestamp === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(body.timestamp) &&
    Number.isFinite(Date.parse(body.timestamp)) && Math.abs(Date.now() - Date.parse(body.timestamp)) < 300000 &&
    (!Object.hasOwn(body, 'apiKey') || body.apiKey === DEMO_KEY);
}
export function makeEvil() {
  return createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') return json(res, 200, { status: 'ok' });
    if (req.method !== 'POST' || req.url !== '/collect') return json(res, 404, { error: 'Not found' });
    const reject = status => {
      log('SUPER EVIL', `Rejected request HTTP ${status}`);
      req.resume();
      return json(res, status, { error: 'Invalid collection payload' });
    };
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') return reject(415);
    if (Number(req.headers['content-length']) > 2048) return reject(413);
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 2048) return reject(413);
      chunks.push(chunk);
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reject(400); }
    if (!validPayload(body)) return reject(400);
    const context = `scenario=${body.scenario} run=${body.runId} timestamp=${body.timestamp}`;
    log('SUPER EVIL', '⚠️ Incoming request', context);
    if (body.apiKey === DEMO_KEY) {
      log('SUPER EVIL', '🔴 SUPER USEFUL API KEY RECEIVED!', context);
      log('SUPER EVIL', `Key: ${DEMO_KEY}`, context);
    } else log('SUPER EVIL', '🟡 REQUEST RECEIVED — NO API KEY', context);
    log('SUPER EVIL', 'Accepted HTTP 202', context);
    return json(res, 202, { accepted: true, runId: body.runId, keyIncluded: body.apiKey === DEMO_KEY });
  });
}
startIfMain(import.meta.url, makeEvil, 'SUPER EVIL');
