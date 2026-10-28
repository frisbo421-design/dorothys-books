import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../backend/ledger.mjs';
import fs from 'node:fs';
import path from 'node:path';

const co=1,user=1;
class FakePg {
 constructor({locked=null,accountCompany=1}={}){this.locked=locked;this.accountCompany=accountCompany;this.calls=[];this.lines=[];this.entry=0;}
 async query(query,params=[]){this.calls.push({query,params});
  if(query.includes('SELECT locked_through FROM companies'))return {rows:[{locked_through:this.locked}]};
  if(query.includes('SELECT * FROM accounts WHERE id=')){const accountId=Number(params[0]);const type=({1:'asset',2:'income',3:'expense',4:'equity',5:'liability'})[accountId];return {rows:!type||params[1]!==this.accountCompany?[]:[{id:accountId,company_id:this.accountCompany,type,active:true}]};}
  if(query.includes('SELECT id FROM accounts WHERE company_id='))return {rows:[{id:4}]};
  if(query.includes('INSERT INTO journal_entries'))return {rows:[{id:++this.entry}]};
  if(query.includes('INSERT INTO journal_lines')){this.lines.push({account_id:params[1],debit:params[2],credit:params[3]});return {rows:[]};}
  if(query.includes('INSERT INTO audit'))return {rows:[]};
  return {rows:[]};
 }
}

test('cents uses exact integer arithmetic',()=>{
 assert.equal(L.cents('$1,200.35'),120035);
 assert.equal(L.cents('0.29'),29);
 assert.equal(L.cents('0.01')+L.cents('0.02'),3);
 assert.equal(L.cents('-10.05'),-1005);
 for(const bad of ['1.001','NaN','Infinity','not money','1e4','','1000000001'])assert.throws(()=>L.cents(bad),L.BookError);
});
test('date parsing rejects impossible dates',()=>{
 assert.equal(L.iso('2026-10-16'),'2026-10-16');
 for(const bad of ['2026-02-30','2026-02-29','2026-13-01','bad date','2026-10-16T00:00:00'])assert.throws(()=>L.iso(bad),L.BookError);
});
test('posting creates two equal and opposite immutable journal lines',async()=>{
 const db=new FakePg();const result=await L.addIncome(db,co,user,{amount:'65.00',date:'2026-10-16',bank_account_id:1,category_account_id:2,memo:'Daycare'});
 assert.equal(result,1);
 assert.deepEqual(db.lines,[{account_id:1,debit:6500,credit:0},{account_id:2,debit:0,credit:6500}]);
 assert.equal(db.lines.reduce((n,x)=>n+x.debit-x.credit,0),0);
});
test('expense posts an expense debit and cash credit',async()=>{
 const db=new FakePg();await L.addExpense(db,co,user,{amount:'38.40',date:'2026-10-16',bank_account_id:1,category_account_id:3,memo:'Pet supplies'});
 assert.deepEqual(db.lines,[{account_id:3,debit:3840,credit:0},{account_id:1,debit:0,credit:3840}]);
});
test('unbalanced entries are rejected without journal INSERT',async()=>{
 const db=new FakePg();await assert.rejects(L.posting(db,co,user,'2026-10-16','Bad',[{account_id:1,debit:100},{account_id:2,credit:99}]),/not balanced/);
 assert.equal(db.calls.filter(x=>x.query.includes('INSERT INTO journal_entries')).length,0);
});
test('company isolation rejects foreign account',async()=>{
 const db=new FakePg({accountCompany:2});await assert.rejects(L.addIncome(db,co,user,{amount:'65',date:'2026-10-16',bank_account_id:1,category_account_id:2}),/eligible account/);
 assert.equal(db.lines.length,0);
});
test('locked period rejects backdated posting',async()=>{
 const db=new FakePg({locked:'2026-10-16'});await assert.rejects(L.addExpense(db,co,user,{amount:'1',date:'2026-10-16',bank_account_id:1,category_account_id:3}),/locked/);
 assert.equal(db.lines.length,0);
});
test('schema prevents updates to posted entries and lines',()=>{
 const schema=fs.readFileSync(new URL('../netlify/database/migrations/20261016190000_initial_books.sql',import.meta.url),'utf8');
 assert.match(schema,/immutable_entries_update BEFORE UPDATE OR DELETE ON journal_entries/);
 assert.match(schema,/immutable_lines_update BEFORE UPDATE OR DELETE ON journal_lines/);
 assert.match(schema,/CHECK \(\(debit>0 AND credit=0\) OR \(credit>0 AND debit=0\)\)/);
 assert.match(schema,/owner_slot SMALLINT NOT NULL DEFAULT 1 UNIQUE/);
});
test('Netlify route and help walkthrough exist',()=>{
 const src=fs.readFileSync(new URL('../netlify/functions/api.mjs',import.meta.url),'utf8');
 assert.match(src,/path: '\/api\/\*'/);
 assert.match(src,/BOOKS_SETUP_KEY/);
 assert.match(src,/SameSite=Strict/);
 assert.match(fs.readFileSync(new URL('../public/guide.js',import.meta.url),'utf8'),/function startTour\(/);
 assert.match(fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),/OWNER SETUP CODE/);
});
