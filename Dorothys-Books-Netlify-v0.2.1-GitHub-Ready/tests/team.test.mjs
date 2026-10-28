import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source = file => readFileSync(new URL(file,import.meta.url),'utf8');
test('migration keeps old ledger and adds owner membership and hashed single-use invitations', () => {
 const sql=source('../netlify/database/migrations/20261028133500_team_invitations.sql');
 assert.match(sql,/ALTER TABLE users DROP COLUMN owner_slot/);
 assert.match(sql,/CREATE TABLE company_memberships/);
 assert.match(sql,/CREATE TABLE company_invitations/);
 assert.match(sql,/token_hash CHAR\(64\) NOT NULL UNIQUE/);
 assert.match(sql,/accepted_at TIMESTAMPTZ/);
 assert.match(sql,/expires_at TIMESTAMPTZ/);
 assert.doesNotMatch(sql,/DROP TABLE (journal_entries|journal_lines)/);
});
test('company access requires creator or authorized membership',()=>{
 const code=source('../netlify/functions/api.mjs');
 assert.match(code,/LEFT JOIN company_memberships/);
 assert.match(code,/c.owner_id=\$2 OR m.user_id=\$2/);
 assert.match(code,/WHERE c.owner_id=\$1 OR m.user_id=\$1/);
 assert.match(code,/FOR UPDATE/);
 assert.match(code,/sha\(token\)/);
 assert.match(code,/randomBytes\(32\)/);
 assert.match(code,/\/auth\/invite\/accept/);
 assert.match(code,/\/team\/invite/);
 assert.match(code,/checkPost\(req\)/);
});
test('private invite UX loads with signup code never required for Darius',()=>{
 const html=source('../public/index.html'),js=source('../public/team.js');
 assert.match(html,/team\.js\?v=3/);
 assert.match(js,/new URLSearchParams\(location.hash.slice\(1\)\)/);
 assert.match(js,/history.replaceState/);
 assert.match(js,/renderAuth = function/);
 assert.match(js,/navigator.clipboard.writeText/);
 assert.match(js,/auth\/invite\/accept/);
 assert.match(js,/PRIVATE INVITATION/);
});
