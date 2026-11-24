import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {taxYear} from '../backend/tax-readiness.mjs';
const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('tax year must be a strictly validated bounded four-digit year',()=>{
 assert.equal(taxYear('2026'),2026);
 for(const v of ['',null,'2O26','2026-01-01','2026;DROP TABLE','1999','2100'])assert.throws(()=>taxYear(v));
});

test('tax working paper is scoped to authenticated company and posted journals, never estimates tax due',()=>{
 const api=source('../netlify/functions/api.mjs');
 const src=source('../backend/tax-readiness.mjs');
 assert.match(api,/\/tax\/working-paper/);
 assert.match(api,/TAX\.taxWorkingPaper\(c,co\.id,/);
 assert.match(api,/const co=await getCompany\(c,req,me\)/);
 assert.match(src,/L\.pnl\(c,companyId,start,end\)/);
 assert.match(src,/L\.balanceSheet\(c,companyId,end\)/);
 assert.match(src,/journal_entries WHERE company_id=\$1/);
 assert.match(src,/bank_lines WHERE company_id=\$1/);
 assert.match(src,/ready_for_filing:false/);
 assert.match(src,/tax_due:null,tax_form:null,estimated_tax:null/);
 assert.match(src,/snout_payment_history:'not_verified'/);
 assert.match(src,/processor_1099k:'not_verified'/);
 assert.match(src,/entity_tax_classification:'not_configured'/);
 assert.doesNotMatch(src,/\b(?:INSERT INTO|UPDATE [A-Za-z_]+ SET|DELETE FROM|TRUNCATE)\b/i);
});
