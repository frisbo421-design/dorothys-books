import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('Existing owner may join exactly the invited company without merging ledgers',()=>{
 const api=get('../netlify/functions/api.mjs');
 assert.match(api,/async function joinExistingInvite\(c,me,d\)/);
 assert.match(api,/invite\.email!==me\.email/);
 assert.match(api,/token_hash=\$1 AND accepted_at IS NULL AND expires_at>now\(\) FOR UPDATE/);
 assert.match(api,/INSERT INTO company_memberships\(company_id,user_id,role\)/);
 assert.match(api,/\/auth\/invite\/join/);
 assert.match(api,/if\(!me\)err\('Sign in with your existing Books account/);
 assert.match(api,/team\.join-existing/);
 assert.doesNotMatch(api,/UPDATE (journal_entries|journal_lines|invoice_payments|bank_lines) SET/i);
});
test('Invitation supports existing account and new account separately',()=>{
 const api=get('../netlify/functions/api.mjs');
 assert.match(api,/if\(existing\)\{/);
 assert.match(api,/This account already has access to the company/);
 assert.match(api,/\/auth\/invite\/accept/);
 assert.match(api,/\/auth\/invite\/join/);
 const js=get('../public/team.js');
 assert.match(js,/joinExistingInviteForm/);
 assert.match(js,/auth\/login/);
 assert.match(js,/auth\/invite\/join/);
 assert.match(js,/rebootstrap\(joined\.company_id\)/);
 assert.match(js,/No financial records are copied or moved/);
});
