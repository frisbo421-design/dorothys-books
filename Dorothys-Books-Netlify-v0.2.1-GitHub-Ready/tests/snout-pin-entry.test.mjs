import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Standalone home enters existing Snout Finance PIN workspace, no secondary Books login', () => {
 const toml = read('../netlify.toml');
 const redirects = toml.slice(toml.indexOf('[[redirects]]'));
 assert.match(redirects, /from = "\/"/);
 assert.match(redirects, /to = "https:\/\/neon-souffle-0f1969\.netlify\.app\/snout\/finance"/);
 assert.match(redirects, /status = 302/);
 assert.match(redirects, /force = true/);
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
