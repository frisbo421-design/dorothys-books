import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Standalone Books homepage remains accessible, with no forced redirect to Snout', () => {
 const toml = read('../netlify.toml');
 assert.doesNotMatch(toml, /from = "\/"\s+to = "https:\/\/neon-souffle/);
 assert.doesNotMatch(toml, /status = 302/);
 const html = read('../public/index.html');
 assert.match(html, /<div id="app">/);
 assert.match(html, /\/app\.js\?v=2/);
});

test('Legacy editor stays accessible for controlled write migration, and accounting API paths remain independent', () => {
 const toml = read('../netlify.toml');
 assert.match(toml, /from = "\/legacy-editor"\s+to = "\/index\.html"\s+status = 200/);
 assert.doesNotMatch(toml, /from = "\/\*"/);
 const api=read('../netlify/functions/api.mjs');
 assert.match(api, /\/auth\/login/);
 assert.match(api, /\/bank\/import/);
 const bridge=read('../netlify/functions/snout-read.mjs');
 assert.match(bridge, /verifyIdToken/);
 assert.match(bridge, /company_memberships/);
});
