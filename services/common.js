import http from 'node:http';
import { pathToFileURL } from 'node:url';

export const DEMO_KEY = 'DEMO_ONLY_FAKE_KEY_12345';
export const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_.-]{1,80}$/.test(value);
export function log(component, message, context = '') {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(now);
  console.log(`${time} [${component}] ${message}${context ? ` ${context}` : ''}`);
}
export function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
export function createServer(handler) {
  const server = http.createServer({ maxHeaderSize: 8192 }, (req, res) => {
    Promise.resolve(handler(req, res)).catch(() => {
      if (!res.headersSent) json(res, 400, { error: 'Invalid request' });
      else res.end();
    });
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.setTimeout(5000, socket => socket.destroy());
  return server;
}
export function startIfMain(meta, factory, component) {
  if (!process.argv[1] || meta !== pathToFileURL(process.argv[1]).href) return;
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const server = factory();
  server.listen(port, '0.0.0.0', () => log(component, `Ready on port ${port} (Europe/Berlin)`));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 6000).unref();
  });
}
