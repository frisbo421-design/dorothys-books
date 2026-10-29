import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as M from '../backend/close-and-match.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
function bankDb(options={}){
 const writes=[];
 const c={query:async(sql,params=[])=>{
  if(sql.includes('SELECT b.*,a.type AS bank_type'))return {rows:[{id:11,company_id:7,bank_account_id:100,date:'2026-09-15',amount:6500,description:'DAYCARE PAID',bank_type:'asset',entry_id:null,reconciliation_id:null}]};
  if(sql.includes('SELECT locked_through FROM companies'))return {rows:[{locked_through:options.locked||null}]};
  if(sql.includes('SELECT id FROM journal_entries WHERE'))return {rows:[{id:44}]};
  if(sql.includes('SELECT j.id,j.date,j.memo'))return {rows:options.noCandidate?[]:[{id:44,date:'2026-09-15',memo:'Payment of invoice INV-1',source_type:'invoice_payment',amount:'6500'}]};
  if(sql.includes('SELECT id FROM bank_lines WHERE company_id'))return {rows:options.linked?[{id:27}]:[]};
  if(sql.startsWith('UPDATE bank_lines SET entry_id=')){writes.push({sql,params});return {rowCount:1,rows:[{id:11}]}};
  if(sql.startsWith('INSERT INTO audit(')){writes.push({sql,params});return {rowCount:1,rows:[]}};
  throw Error('Unexpected SQL: '+sql.slice(0,70));
 }};
 return {c,writes};
}
test('Candidates read-only and exact bank-account, amount, date, reversal rules',async()=>{
 const {c,writes}=bankDb();
 const r=await M.matchCandidates(c,7,11);
 assert.equal(r.line.amount,6500);
 assert.equal(r.candidates[0].id,44);
 assert.equal(writes.length,0);
 const code=read('../backend/close-and-match.mjs');
 assert.match(code,/l.account_id=\$3/);
 assert.match(code,/j.date BETWEEN \$4 AND \$5/);
 assert.match(code,/SUM\(CASE WHEN l.account_id=\$3 THEN l.debit-l.credit ELSE 0 END\)=\$6/);
 assert.match(code,/rev.reversed_entry_id=j.id/);
 assert.match(code,/linked.entry_id=j.id/);
});
test('Confirmed match links to existing journal, never posts a second journal',async()=>{
 const {c,writes}=bankDb();
 const r=await M.matchExisting(c,7,2,{line_id:11,entry_id:44});
 assert.equal(r.posted_new_journal,false);
 assert.equal(r.entry_id,44);
 assert.equal(writes.filter(x=>x.sql.startsWith('UPDATE bank_lines')).length,1);
 assert.equal(writes.filter(x=>x.sql.startsWith('INSERT INTO audit')).length,1);
 assert.ok(!writes.some(x=>/INSERT INTO journal_entries|INSERT INTO journal_lines/.test(x.sql)));
});
test('Reject matching after close, duplicate link, or stale selection',async()=>{
 for(const option of [{locked:'2026-09-30'},{linked:true},{noCandidate:true}]){
  const {c,writes}=bankDb(option);
  await assert.rejects(M.matchExisting(c,7,2,{line_id:11,entry_id:44}));
  assert.equal(writes.length,0);
 }
});
test('Month close readiness blocks all unresolved historical statements through cutoff',async()=>{
 const c={query:async(sql)=>{
  if(sql.includes('FROM companies'))return {rows:[{id:7,locked_through:null}]};
  if(sql.includes('FROM bank_lines'))return {rows:[{unmatched:2,uncleared:1,imported:3}]};
  if(sql.includes('FROM reconciliations'))return {rows:[{reconciliations:0}]};
  if(sql.includes('FROM invoices'))return {rows:[{overdue_invoices:2,overdue_bills:1}]};
  throw Error('Unexpected SQL '+sql.slice(0,100));
 }};
 const r=await M.closeReadiness(c,7,'2026-09-30');
 assert.equal(r.ready,false);assert.equal(r.bank.unmatched,2);
 assert.equal(r.bank.uncleared,1);assert.equal(r.requires_manual_bank_ack,true);
 assert.equal(r.receivables.overdue_invoices,2);
 assert.ok(r.blockers.length>=2);assert.ok(r.warnings.length>=2);
 await assert.rejects(M.closeReadiness(c,7,'2026-09-29'),/last day of the month/);
 const october=await M.closeReadiness(c,7,'2026-10-31');
 assert.equal(october.through,'2026-10-31');
});
test('Close and match routes are authenticated and transactional',()=>{
 const api=read('../netlify/functions/api.mjs');
 assert.match(api,/const co=await getCompany\(c,req,me\)/);
 assert.match(api,/\/bank\/match\/candidates/);
 assert.match(api,/\/bank\/match':M.matchExisting/);
 assert.match(api,/\/close\/readiness/);
 assert.match(api,/if\(method==='POST'\)checkPost\(req\)/);
 assert.match(api,/await c.query\('BEGIN'\)/);
 assert.match(api,/ack_manual_bank_review!==true/);
 assert.match(api,/await M.closeReadiness\(c,id,newDate\)/);
 const ui=read('../public/close-match.js');
 assert.match(ui,/Match before categorizing/);
 assert.match(ui,/data-mm-confirm/);
 assert.match(ui,/close\/readiness/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage/);
});
