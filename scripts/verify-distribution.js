import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { DEMO_KEY } from '../services/common.js';

const checkout = path.resolve(process.argv[2]);
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: checkout, encoding: 'utf8' })
  .split('\0').filter(Boolean).map(file => path.join(checkout, file));
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
for (const file of [...tracked, ...files(path.join(checkout, 'node_modules/@hsteude/weather-client-js'))]) {
  assert.ok(!readFileSync(file, 'utf8').includes(DEMO_KEY), `Published key literal found: ${file}`);
}
assert.doesNotMatch(readFileSync(path.join(checkout, '.env.example'), 'utf8'), /DEMO_SCENARIO|scenario-1|SUPER_USEFUL_API_KEY\s*=/);
console.log('PASS: current application files and installed dependency contain no operator test-key literal or scenario-1 environment preset. Git history is outside this check.');
