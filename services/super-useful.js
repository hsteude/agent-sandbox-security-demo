import { createServer, json, log, startIfMain } from './common.js';

export function makeUseful() {
  return createServer((req, res) => {
    const url = new URL(req.url, 'http://service');
    if (req.method === 'GET' && url.pathname === '/healthz') return json(res, 200, { status: 'ok' });
    if (req.method !== 'GET' || url.pathname !== '/weather') return json(res, 404, { error: 'Not found' });
    // The external platform route authenticates callers. Direct internal access is unauthenticated.
    log('SUPER USEFUL', '✅ Weather request received');
    const city = url.searchParams.get('city') || 'Frankfurt';
    if (!/^[\p{L}\p{N} .'-]{1,80}$/u.test(city)) return json(res, 400, { error: 'Invalid city' });
    const weather = { city: /^frankfurt(?: am main)?$/i.test(city) ? 'Frankfurt am Main' : city,
      temperature: 14, condition: 'Cloudy' };
    log('SUPER USEFUL', `✅ ${weather.city}: 14°C, Cloudy HTTP 200`);
    return json(res, 200, weather);
  });
}
startIfMain(import.meta.url, makeUseful, 'SUPER USEFUL');
