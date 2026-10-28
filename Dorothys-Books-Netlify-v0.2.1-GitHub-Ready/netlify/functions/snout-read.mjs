/** Read-only, user-scoped Dorothy's Books data bridge for Snout Main.
 * Only verified Firebase users with a pre-existing Books account + company access.
 * This NEVER accepts a company ID, never creates an account, and never modifies the ledger.
 */
import { getDatabase } from '@netlify/database';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as L from '../../backend/ledger.mjs';

const FIREBASE_PROJECT_ID = 'daycare-tracker-df21d';
const JSON_HEADERS = {
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, private',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
};
const respond = (data, status=200) => new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const friendlyError = (status, code, message) => respond({ok:false,code,error:message},status);
const firebase = () => getApps().find(app=>app.name==='snout-books-readonly') ||
    initializeApp({projectId:FIREBASE_PROJECT_ID},'snout-books-readonly');

export default async function handler(req) {
  if(req.method!=='GET') return friendlyError(405,'METHOD_NOT_ALLOWED','Read-only access. GET required.');
  const url = new URL(req.url);
  const isState = url.pathname==='/snout-books/state';
  const isReport = url.pathname==='/snout-books/report';
  if(!isState&&!isReport) return friendlyError(404,'NOT_FOUND','Unknown read-only endpoint.');
  const authorization = req.headers.get('authorization')||'';
  if(!authorization.startsWith('Bearer ')) return friendlyError(401,'AUTH_REQUIRED','Sign in to Snout with an authorized account.');
  let decoded;
  try {
    decoded=await getAuth(firebase()).verifyIdToken(authorization.slice(7),true);
  } catch {
    return friendlyError(401,'AUTH_INVALID','Snout sign-in expired or could not be verified.');
  }
  const email = String(decoded.email||'').trim().toLowerCase();
  if(decoded.aud!==FIREBASE_PROJECT_ID||decoded.email_verified!==true||!email||email.length>254) {
    return friendlyError(403,'EMAIL_NOT_VERIFIED','Use a verified Snout email address.');
  }
  let c;
  try {
    c=await getDatabase().pool.connect();
    // Membership is the only entitlement: an existing Books user and live company.
    // Never trust a company ID or email supplied by a browser or intermediary.
    const user=await L.one(c,'SELECT id FROM users WHERE lower(email)=$1',[email]);
    if(!user) return friendlyError(403,'ACCOUNT_NOT_LINKED','This Snout email is not yet a Dorothy’s Books owner account. Ask the administrator to invite this exact email.');
    const company=await L.one(c,`SELECT co.id,co.name,co.demo,co.locked_through,
      CASE WHEN co.owner_id=$1 THEN 'admin' ELSE cm.role END AS access_role
      FROM companies co LEFT JOIN company_memberships cm ON cm.company_id=co.id AND cm.user_id=$1
      WHERE co.demo=FALSE AND (co.owner_id=$1 OR cm.user_id=$1)
      ORDER BY co.id LIMIT 1`,[user.id]);
    if(!company) return friendlyError(403,'COMPANY_NOT_LINKED','No accessible live Books company is linked to this email.');
    if(isReport) {
      const kind=url.searchParams.get('kind')||'pnl';
      const end=url.searchParams.get('end')||L.today();
      const start=url.searchParams.get('start')||end.slice(0,7)+'-01';
      if(kind==='pnl') return respond({ok:true,company,report:await L.pnl(c,company.id,start,end)});
      if(kind==='balance') return respond({ok:true,company,report:await L.balanceSheet(c,company.id,end)});
      return friendlyError(400,'UNSUPPORTED_REPORT','Choose the profit and loss or balance sheet report.');
    }
    const dashboard=await L.dashboard(c,company.id);
    const [journals,invoices,bills,accounts,bankLines] = await Promise.all([
      L.journals(c,company.id,100),L.allInvoices(c,company.id),L.allBills(c,company.id),
      L.rows(c,'SELECT id,code,name,type,active FROM accounts WHERE company_id=$1 ORDER BY code',[company.id]),
      L.bankLines(c,company.id),
    ]);
    const insights=await L.insights(c,company.id,dashboard);
    return respond({ok:true,source:'dorothys-books',mode:'read-only',company,dashboard,journals,invoices,bills,accounts,bank_lines:bankLines.slice(0,150),insights});
  } catch(e) {
    console.error('[books-snout-readonly] failed',e?.code||e?.name||'unknown');
    return friendlyError(503,'BOOKS_UNAVAILABLE','Dorothy’s Books data could not be loaded. Your records have not been changed.');
  } finally {if(c)c.release()}
}

export const config={path:['/snout-books/state','/snout-books/report']};
