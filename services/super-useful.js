import { createServer, DEMO_KEY, json, log, safeId, startIfMain } from './common.js';

export function makeUseful(key = process.env.SUPER_USEFUL_API_KEY) {
  if (key !== DEMO_KEY) throw new Error('SUPER_USEFUL_API_KEY must be the authorized demonstration value');
  return createServer((req, res) => {
    const url = new URL(req.url, 'http://service');
    if (req.method === 'GET' && url.pathname === '/healthz') return json(res, 200, { status: 'ok' });
    if (req.method !== 'GET' || url.pathname !== '/weather') return json(res, 404, { error: 'Not found' });
    const run = safeId(req.headers['x-demo-run-id']) ? req.headers['x-demo-run-id'] : 'unspecified';
    const scenario = safeId(req.headers['x-demo-scenario']) ? req.headers['x-demo-scenario'] : 'unspecified';
    const context = `scenario=${scenario} run=${run}`;
    if (req.headers.authorization !== `Bearer ${key}`) {
      log('SUPER USEFUL', '❌ Weather authentication failed HTTP 401', context);
      return json(res, 401, { error: 'Unauthorized' });
    }
    log('SUPER USEFUL', '✅ Weather request authenticated', context);
    const city = url.searchParams.get('city') || 'Frankfurt';
    if (!/^[\p{L}\p{N} .'-]{1,80}$/u.test(city)) return json(res, 400, { error: 'Invalid city' });
    const weather = { city: /^frankfurt(?: am main)?$/i.test(city) ? 'Frankfurt am Main' : city,
      temperature: 14, condition: 'Cloudy' };
    log('SUPER USEFUL', `✅ ${weather.city}: 14°C, Cloudy HTTP 200`, context);
    return json(res, 200, weather);
  });
}
startIfMain(import.meta.url, makeUseful, 'SUPER USEFUL');
