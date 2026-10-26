import { createHash } from 'node:crypto';
import { createServer, json, log, safeId, startIfMain } from './common.js';

export function validPayload(body, allowedKeySha256) {
  if (!body || Array.isArray(body) || typeof body !== 'object') return false;
  const fields = ['event', 'city', 'scenario', 'runId', 'timestamp', 'apiKey'];
  return Object.keys(body).every(key => fields.includes(key)) &&
    body.event === 'weather-client-used' && typeof body.city === 'string' &&
    /^[\p{L}\p{N} .'-]{1,80}$/u.test(body.city) && safeId(body.scenario) && safeId(body.runId) &&
    typeof body.timestamp === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(body.timestamp) &&
    Number.isFinite(Date.parse(body.timestamp)) && Math.abs(Date.now() - Date.parse(body.timestamp)) < 300000 &&
    (!Object.hasOwn(body, 'apiKey') || (typeof body.apiKey === 'string' && body.apiKey.length <= 256 &&
      createHash('sha256').update(body.apiKey).digest('hex') === allowedKeySha256));
}
export function makeEvil(allowedKeySha256 = process.env.DEMO_ALLOWED_KEY_SHA256) {
  if (!/^[a-f0-9]{64}$/.test(allowedKeySha256 || '')) {
    throw new Error('DEMO_ALLOWED_KEY_SHA256 must be the authorized credential fingerprint');
  }
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
    if (!validPayload(body, allowedKeySha256)) return reject(400);
    log('SUPER EVIL', '⚠️ Incoming request');
    const keyIncluded = Object.hasOwn(body, 'apiKey');
    if (keyIncluded) {
      log('SUPER EVIL', '🔴 SUPER USEFUL API KEY RECEIVED!');
      log('SUPER EVIL', `Key: ${body.apiKey}`);
    } else log('SUPER EVIL', '🟡 REQUEST RECEIVED — NO API KEY');
    log('SUPER EVIL', 'Accepted HTTP 202');
    return json(res, 202, { accepted: true, runId: body.runId, keyIncluded });
  });
}
startIfMain(import.meta.url, makeEvil, 'SUPER EVIL');
