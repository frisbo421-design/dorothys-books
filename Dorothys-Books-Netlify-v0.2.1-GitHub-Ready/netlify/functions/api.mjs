/** Private finance API for Dorothy's Books — Netlify Functions + managed Postgres.
 * No database write ever runs on a GET; every POST write is transactional. */
import { getDatabase } from '@netlify/database';
import { pbkdf2Sync, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import * as L from '../../backend/ledger.mjs';
const TTL=14*24*60*60;
const err=(message,status=400)=>{const e=new Error(message);e.status=status;throw e};
const sha=s=>createHash('sha256').update(s).digest('hex');
const passhash=s=>{const salt=randomBytes(16);return salt.toString('hex')+':'+pbkdf2Sync(s,salt,400000,32,'sha256').toString('hex')};
const passwordOk=(password,hash)=>{try{const [salt,digest]=hash.split(':');return timingSafeEqual(Buffer.from(digest,'hex'),pbkdf2Sync(password,Buffer.from(salt,'hex'),400000,32,'sha256'))}catch{return false}};
const cookieValue=(req,name)=>{const item=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return item?.slice(name.length+1)||''};
const cookie=(token='',maxAge=TTL)=>`db_session=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict`;
const send=(data,status=200,more={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...more}});
const isoToday=()=>L.today();
async function getMe(c,req,required=true){const t=cookieValue(req,'db_session');if(!t){if(required)err('Please sign in.',401);return null}const u=await L.one(c,'SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2',[sha(t),Math.floor(Date.now()/1000)]);if(!u&&required)err('Session expired. Please sign in again.',401);return u}
async function getCompany(c,req,me){const id=Number(req.headers.get('x-company-id')||'0');if(!Number.isSafeInteger(id)||id<=0)err('Select your company.',403);const co=await L.one(c,'SELECT * FROM companies WHERE id=$1 AND owner_id=$2',[id,me.id]);if(!co)err('Select your company.',403);return co}
function checkPost(req){if(req.headers.get('x-requested-with')!=='DorothysBooks')err('Request verification missing.',403);const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)err('Request origin rejected.',403);const type=req.headers.get('content-type')||'';if(!type.toLowerCase().includes('application/json'))err('Expected JSON data.',415);}
const setupKey=()=>Netlify.env.get('BOOKS_SETUP_KEY')||process.env.BOOKS_SETUP_KEY||'';
const eqHash=(a,b)=>timingSafeEqual(Buffer.from(sha(a),'hex'),Buffer.from(sha(b),'hex'));
async function register(c,d){const requiredKey=setupKey();if(!requiredKey||requiredKey.length<16)err('Setup is disabled until the site owner sets BOOKS_SETUP_KEY in Netlify site environment variables (at least 16 characters).',503);if(!eqHash(String(d.setup_key||''),requiredKey))err('Invalid owner setup code.',403);const email=String(d.email||'').trim().toLowerCase(),pwd=String(d.password||'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pwd.length<10)err('Enter a valid email and a password of at least 10 characters.');
 // Single-owner invariant is also enforced by users.owner_slot UNIQUE.
 const already=await L.one(c,'SELECT id FROM users LIMIT 1');if(already)err('An owner account already exists. Please sign in.',403);
 const u=await L.one(c,'INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id',[email,passhash(pwd)]);const cid=await L.createCompany(c,u.id,"Dorothy's Petcare");await L.audit(c,cid,u.id,'company.create',"Dorothy's Petcare");return u.id;}
async function createSession(c,user){const token=randomBytes(36).toString('base64url');await c.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',[sha(token),user,Math.floor(Date.now()/1000)+TTL]);return cookie(token)}
async function report(c,co,url){const kind=url.searchParams.get('kind')||'pnl',end=url.searchParams.get('end')||isoToday(),start=url.searchParams.get('start')||end.slice(0,7)+'-01';if(kind==='pnl')return L.pnl(c,co.id,start,end);if(kind==='balance')return L.balanceSheet(c,co.id,end);if(kind==='trial')return {entries:await L.trial(c,co.id,end),as_of:L.iso(end)};if(kind==='general')return {entries:await L.rows(c,`SELECT j.id,j.date,j.memo,j.source_type,a.code,a.name AS account,a.type,l.debit,l.credit FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.company_id=$1 AND j.date BETWEEN $2 AND $3 ORDER BY j.date DESC,j.id DESC,l.id`,[co.id,L.iso(start),L.iso(end)]),start,end};err('Unknown report type.')}
function csvValue(x){let s=String(x??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function csvReport(kind,result){let data=[];if(kind==='pnl')data=[...result.income.map(x=>({section:'Income',account:x.name,amount_usd:(x.amount/100).toFixed(2)})),...result.expense.map(x=>({section:'Expenses',account:x.name,amount_usd:(x.amount/100).toFixed(2)}))];else if(kind==='balance')data=[...result.assets.map(x=>({section:'Assets',account:x.name,amount_usd:(x.balance/100).toFixed(2)})),...result.liabilities.map(x=>({section:'Liabilities',account:x.name,amount_usd:(x.balance/100).toFixed(2)})),...result.equity.map(x=>({section:'Equity',account:x.name,amount_usd:(x.balance/100).toFixed(2)}))];else data=result.entries;const keys=data.length?Object.keys(data[0]):['account','amount_usd'];const csv=[keys.map(csvValue).join(','),...data.map(row=>keys.map(k=>csvValue(row[k])).join(','))].join('\r\n')+'\r\n';return new Response(csv,{status:200,headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="dorothys-${kind}.csv"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
async function execute(c,path,d,me,co){const id=co.id,u=me.id;
 const handlers={
  '/expense':L.addExpense,'/income':L.addIncome,'/opening':L.addOpening,'/journal':L.addManual,'/contact':L.addContact,
  '/invoice':L.addInvoice,'/invoice/payment':L.payInvoice,'/bill':L.addBill,'/bill/payment':L.payBill,
  '/bank/import':L.importBank,'/bank/classify':L.classifyBank,'/bank/reconcile':L.reconcile
 };
 if(handlers[path])return {ok:true,id:await handlers[path](c,id,u,d)};
 if(path==='/journal/reverse')return {ok:true,id:await L.reverse(c,id,u,d.id,d.date)};
 if(path==='/account'){
  if(!['asset','liability','equity','income','expense'].includes(d.type))err('Invalid account type.');const code=String(d.code||'').trim(),name=String(d.name||'').trim();if(code.length<2||code.length>12||!name)err('Enter an account code and name.');const a=await L.one(c,'INSERT INTO accounts(company_id,code,name,type) VALUES($1,$2,$3,$4) RETURNING id',[id,code,name,d.type]);await L.audit(c,id,u,'account.create',code+' '+name);return {id:a.id};
 }
 if(path==='/lock'){if(d.confirm!=='LOCK')err('Type LOCK to confirm the accounting period close.');const newDate=L.iso(d.locked_through);const current=await L.one(c,'SELECT locked_through FROM companies WHERE id=$1 FOR UPDATE',[id]);if(current.locked_through&&newDate<current.locked_through)err('Cannot silently reopen locked history.');await c.query('UPDATE companies SET locked_through=$1 WHERE id=$2',[newDate,id]);await L.audit(c,id,u,'period.lock',newDate);return {ok:true};}
 err('Unknown action.',404);
}
async function handle(req){const url=new URL(req.url);const path=url.pathname.replace(/^\/(?:\.netlify\/functions\/api|api)/,'')||'/';const method=req.method.toUpperCase();if(!['GET','POST'].includes(method))err('Method not allowed.',405);if(method==='POST')checkPost(req);
 let database;try{database=getDatabase()}catch{err('Cloud database is not connected. Configure Netlify Database and deploy this project.',503)}
 let c;try{c=await database.pool.connect()}catch{err('Cloud database unavailable. Verify Netlify Database has finished provisioning.',503)}
 let inTx=false;
 try{
  const me=await getMe(c,req,false);
  if(method==='GET'&&path==='/bootstrap'){
   const count=await L.one(c,'SELECT count(*) AS n FROM users');const companies=me?await L.rows(c,'SELECT id,name,demo,locked_through FROM companies WHERE owner_id=$1 ORDER BY demo,id',[me.id]):[];return send({setup:Number(count.n)===0,user:me,companies});
  }
  if(method==='POST'&&path==='/auth/register'){
   await c.query('BEGIN');inTx=true;const d=(await req.json()).data||{};const user=await register(c,d);const token=await createSession(c,user);await c.query('COMMIT');inTx=false;return send({ok:true},200,{'Set-Cookie':token});
  }
  if(method==='POST'&&path==='/auth/login'){
   const d=(await req.json()).data||{};const user=await L.one(c,'SELECT * FROM users WHERE email=$1',[String(d.email||'').trim().toLowerCase()]);if(!user||!passwordOk(String(d.password||''),user.password_hash))err('Incorrect email or password.',401);
   const token=await createSession(c,user.id);return send({ok:true},200,{'Set-Cookie':token});
  }
  if(method==='POST'&&path==='/auth/logout'){
   const t=cookieValue(req,'db_session');if(t)await c.query('DELETE FROM sessions WHERE token_hash=$1',[sha(t)]);return send({ok:true},200,{'Set-Cookie':cookie('',0)});
  }
  if(!me)err('Please sign in.',401);
  if(method==='POST'&&path==='/company'){
   await c.query('BEGIN');inTx=true;const d=(await req.json()).data||{};const co=await L.createCompany(c,me.id,d.name);await L.audit(c,co,me.id,'company.create','New company');await c.query('COMMIT');inTx=false;return send({id:co});
  }
  if(method==='POST'&&path==='/demo'){
   await c.query('BEGIN');inTx=true;const co=await L.createCompany(c,me.id,"Dorothy's — Sample Workspace",true),dt=L.today();const acc=code=>L.byCode(c,co,code);
   await L.posting(c,co,me.id,dt,'Demo opening balance',[{account_id:await acc('1000'),debit:450000},{account_id:await acc('3000'),credit:450000}],'demo_opening');
   await L.posting(c,co,me.id,dt,'Sample full-day daycare sales',[{account_id:await acc('1000'),debit:97500},{account_id:await acc('4000'),credit:97500}],'demo_sale');
   await L.posting(c,co,me.id,dt,'Sample staff payroll',[{account_id:await acc('5000'),debit:55000},{account_id:await acc('1000'),credit:55000}],'demo_payroll');
   await L.audit(c,co,me.id,'demo.create','FAKE SAMPLE RECORDS — DO NOT USE FOR LIVE BOOKS');await c.query('COMMIT');inTx=false;return send({id:co});
  }
  const co=await getCompany(c,req,me);
  if(method==='GET'&&path==='/state'){
   const dashboard=await L.dashboard(c,co.id);return send({company:co,accounts:await L.rows(c,'SELECT * FROM accounts WHERE company_id=$1 ORDER BY code',[co.id]),contacts:await L.rows(c,'SELECT * FROM contacts WHERE company_id=$1 ORDER BY name',[co.id]),dashboard,journals:await L.journals(c,co.id,250),invoices:await L.allInvoices(c,co.id),bills:await L.allBills(c,co.id),bank_lines:await L.bankLines(c,co.id),reconciliations:await L.rows(c,'SELECT r.*,a.name AS account_name FROM reconciliations r JOIN accounts a ON a.id=r.bank_account_id WHERE r.company_id=$1 ORDER BY r.id DESC',[co.id]),insights:await L.insights(c,co.id,dashboard)});
  }
  if(method==='GET'&&path==='/report')return send(await report(c,co,url));
  if(method==='GET'&&path==='/export'){const kind=url.searchParams.get('kind')||'general';return csvReport(kind,await report(c,co,url));}
  if(method==='GET'&&path==='/audit')return send({events:await L.rows(c,'SELECT action,detail,created_at FROM audit WHERE company_id=$1 ORDER BY id DESC LIMIT 200',[co.id])});
  if(method==='POST'){
   const d=(await req.json()).data||{};await c.query('BEGIN');inTx=true;const result=await execute(c,path,d,me,co);await c.query('COMMIT');inTx=false;return send(result);
  }
  err('Route not found.',404);
 }catch(e){if(inTx){try{await c.query('ROLLBACK')}catch{}}throw e}finally{c.release()}
}
export default async function(req){try{return await handle(req)}catch(e){if(e instanceof L.BookError||e.status)return send({error:e.message},e.status||400);if(e.code==='23505')return send({error:'This record already exists. Check its identifier or invoice number.'},409);if(e.code==='23503')return send({error:'This record references an item that does not exist.'},400);if(e.code==='42P01')return send({error:'Database tables are not installed. Deploy the Netlify migration before using the app.'},503);console.error('Dorothys Books server error',e?.code||e?.name||'unknown');return send({error:'Something went wrong while saving or loading. Your changes were not confirmed; please check the records before retrying.'},500)}}

// Netlify-native API routing; works for /api/bootstrap, /api/invoice/payment, etc.
export const config = { path: '/api/*' };
