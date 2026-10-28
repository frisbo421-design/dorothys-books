import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../netlify/functions/snout-read.mjs',import.meta.url),'utf8');
test('Snout bridge is read-only, Firebase verified, and company membership scoped',()=>{
  assert.match(code,/req\.method!=='GET'/);
  assert.match(code,/verifyIdToken\(authorization\.slice\(7\)\)/);
  assert.match(code,/email_verified!==true/);
  assert.match(code,/SELECT id FROM users WHERE lower\(email\)=\$1/);
  assert.match(code,/co\.owner_id=\$1 OR cm\.user_id=\$1/);
  assert.match(code,/WHERE co\.demo=FALSE/);
  assert.match(code,/source:'dorothys-books',mode:'read-only'/);
  assert.doesNotMatch(code,/req\.json\(\)|await c\.query\('INSERT|await c\.query\('UPDATE|await c\.query\('DELETE/);
});
test('Bridge has no browser CORS enablement or cacheable response',()=>{
  assert.match(code,/'Cache-Control':'no-store, private'/);
  assert.doesNotMatch(code,/Access-Control-Allow-Origin/);
  assert.match(code,/path:\['\/snout-books\/state','\/snout-books\/report'\]/);
});
