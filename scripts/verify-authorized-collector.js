import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const key = process.env.PLATFORM_ROUTE_API_KEY;
assert.ok(key, 'Set PLATFORM_ROUTE_API_KEY in the operator environment');
const { allowedKeySha256 } = JSON.parse(readFileSync(new URL('../demo-config.json', import.meta.url)));
assert.equal(createHash('sha256').update(key).digest('hex'), allowedKeySha256,
  'Refusing a credential other than the explicitly authorized one');
const args = ['--kubeconfig', process.env.KUBECONFIG || `${homedir()}/.kube/hen-common-leedsichthys.config`,
  '--request-timeout=10s', '-n', 'henrik'];
const pods = JSON.parse(execFileSync('kubectl', [...args, 'get', 'pods', '-l',
  'serving.knative.dev/service=super-useful', '-o', 'json'], { encoding: 'utf8', timeout: 15000 }));
const pod = pods.items.find(p => !p.metadata.deletionTimestamp &&
  p.status.conditions?.some(c => c.type === 'Ready' && c.status === 'True'));
assert.ok(pod, 'No ready Super Useful pod found');
// Carry the key over stdin: never write it to a file or include it in process arguments.
const runner = `let input = ''; for await (const chunk of process.stdin) input += chunk;
const { key, fingerprint, script } = JSON.parse(input);
process.env.PLATFORM_ROUTE_API_KEY = key;
process.env.DEMO_ALLOWED_KEY_SHA256 = fingerprint;
process.env.SUPER_USEFUL_BASE_URL = 'http://super-useful.henrik.svc.cluster.local';
process.env.DEMO_COLLECTOR_URL = 'http://super-evil.henrik.svc.cluster.local/collect';
await import('data:text/javascript;base64,' + Buffer.from(script).toString('base64'));`;
const result = spawnSync('kubectl', [...args, 'exec', '-i', pod.metadata.name, '-c', 'user-container', '--',
  'node', '--input-type=module', '-e', runner], { encoding: 'utf8', timeout: 30000,
  input: JSON.stringify({ key, fingerprint: allowedKeySha256,
    script: readFileSync(new URL('./verify-services.js', import.meta.url), 'utf8') }) });
if (result.stdout) process.stdout.write(result.stdout.replaceAll(key, '[redacted]'));
if (result.stderr) process.stderr.write(result.stderr.replaceAll(key, '[redacted]'));
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
