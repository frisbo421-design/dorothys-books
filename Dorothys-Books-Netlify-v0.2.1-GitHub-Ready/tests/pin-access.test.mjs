import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validPin,verifyPin,state,nextFailure,ipScope,IP_MAX_FAILURES,GLOBAL_MAX_FAILURES} from '../backend/pin-access.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('PIN accepts four digits only and is keyed with a function-only secret',()=>{
 const secret='a-secret-pepper-for-testing-not-production-123456';
 assert.equal(validPin('2468'),true);
 for(const p of ['','246','24680','aaaa',null,2468,'24 8'])assert.equal(validPin(p),false);
 assert.equal(verifyPin('2468','2468',secret),true);
 assert.equal(verifyPin('2467','2468',secret),false);
 assert.equal(verifyPin('2468','2468','short'),false);
 assert.notEqual(ipScope('1.2.3.4',secret),ipScope('1.2.3.5',secret));
 assert.ok(IP_MAX_FAILURES<=5 && GLOBAL_MAX_FAILURES<=30);
});

test('attempt limits reset after the window and lock repeated guesses',()=>{
 const now=Date.parse('2026-11-24T15:00:00Z');
 const row={failure_count:4,window_start:new Date(now-60_000),locked_until:null};
 assert.deepEqual(state(row,now),{locked:false,count:4});
 const result=nextFailure(row,5,now);
 assert.equal(result.locked,true);assert.equal(result.count,5);
 assert.equal(state({...row,locked_until:new Date(result.until)},now).locked,true);
 assert.equal(state({...row,window_start:new Date(now-16*60_000)},now).count,0);
});

test('Books standalone PIN login is POST only, always server verified and cookie-bound',()=>{
 const api=read('../netlify/functions/api.mjs'),app=read('../public/app.js');
 assert.match(api,/path==='\/auth\/pin'/);
 assert.match(api,/if\(method==='POST'\)checkPost\(req\)/);
 assert.match(api,/BOOKS_ACCESS_PIN/);
 assert.match(api,/BOOKS_PIN_PEPPER/);
 assert.match(api,/PIN\.verifyPin\(d\.pin,expected,pepper\)/);
 assert.match(api,/SELECT failure_count,window_start,locked_until FROM books_pin_attempts WHERE scope=\$1 FOR UPDATE/);
 assert.match(api,/PIN\.GLOBAL_MAX_FAILURES/);
 assert.match(api,/PIN\.IP_MAX_FAILURES/);
 assert.match(api,/PIN\.PIN_SESSION_SECONDS/);
 assert.match(api,/Shared owner PIN session opened/);
 assert.match(api,/return send\(\{ok:true\},200,\{'Set-Cookie':result\.session\}\)/);
 assert.match(app,/Your books\. One PIN\./);
 assert.match(app,/name="pin"/);
 assert.match(app,/auth\/pin/);
 assert.doesNotMatch(app,/boot\.setup\?'auth\/register':'auth\/login'/);
 assert.match(api,/SELECT c\.\*, CASE WHEN c\.owner_id=\$2/);
 assert.match(api,/httpOnly|HttpOnly/);
});

test('Migration preserves every historical journal and refuses shared PIN when live tenancy ambiguous',()=>{
 const migration=read('../netlify/database/migrations/20261124161000_books_pin_rate_limit.sql');
 const api=read('../netlify/functions/api.mjs');
 assert.match(migration,/CREATE TABLE IF NOT EXISTS books_pin_attempts/);
 assert.doesNotMatch(migration,/(?:DROP TABLE|ALTER TABLE journal_entries|DELETE FROM)/);
 assert.match(api,/companies\.length!==1/);
 assert.match(api,/memberships\?\.n\|\|0\)>1/);
 assert.match(api,/if\(!me\)err\('Please sign in\.',401\)/);
 assert.match(api,/INSERT INTO sessions/);
 assert.match(api,/getCompany\(c,req,me\)/);
});
