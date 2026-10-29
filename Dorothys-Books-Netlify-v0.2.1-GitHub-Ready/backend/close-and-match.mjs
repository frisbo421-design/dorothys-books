/** Dorothy's Books v0.5 — match imported bank rows to ALREADY posted journals.
 * A match never posts a journal, charges a card, or changes recognized revenue.
 * All writes use the API's existing BEGIN/COMMIT transaction and audit history.
 */
import * as L from './ledger.mjs';

const deny=(s)=>{throw new L.BookError(s)};
const idOf=v=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<1)deny('Choose a valid record.');return n};
const shift=(date,days)=>{const dt=new Date(L.iso(date)+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+days);return dt.toISOString().slice(0,10)};

async function bankLine(c,co,lineId,locked=false){
 const line=await L.one(c,`SELECT b.*,a.type AS bank_type FROM bank_lines b
 JOIN accounts a ON a.id=b.bank_account_id AND a.company_id=b.company_id
 WHERE b.company_id=$1 AND b.id=$2 ${locked?'FOR UPDATE OF b':''}`,[co,idOf(lineId)]);
 if(!line||line.bank_type!=='asset')deny('Bank transaction is not available for matching.');
 if(line.entry_id!==null||line.reconciliation_id!==null)deny('This bank transaction was already posted, matched or reconciled.');
 return line;
}
const sql=`SELECT j.id,j.date,j.memo,j.source_type,
 SUM(CASE WHEN l.account_id=$3 THEN l.debit-l.credit ELSE 0 END) AS amount
 FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id
 WHERE j.company_id=$1
 AND j.date BETWEEN $4 AND $5
 AND j.source_type IN ('income','expense','manual','invoice_payment','bill_payment')
 AND j.reversed_entry_id IS NULL
 AND NOT EXISTS(SELECT 1 FROM journal_entries rev WHERE rev.reversed_entry_id=j.id)
 AND NOT EXISTS(SELECT 1 FROM bank_lines linked WHERE linked.company_id=$1 AND linked.entry_id=j.id)
 GROUP BY j.id
 HAVING SUM(CASE WHEN l.account_id=$3 THEN l.debit-l.credit ELSE 0 END)=$6
 AND COUNT(*) FILTER (WHERE l.account_id=$3)=1
 ORDER BY ABS(j.date::date-$2::date),j.id DESC LIMIT 15`;

async function eligible(c,co,line){
 const list=await L.rows(c,sql,[co,line.date,line.bank_account_id,shift(line.date,-7),shift(line.date,7),line.amount]);
 return list.map(x=>({id:x.id,date:x.date,memo:x.memo,source_type:x.source_type,amount:Number(x.amount),day_gap:Math.round(Math.abs((Date.parse(x.date)-Date.parse(line.date))/86400000))}));
}
export async function matchCandidates(c,co,lineId){
 const line=await bankLine(c,co,lineId);
 const candidates=await eligible(c,co,line);
 return {line:{id:line.id,date:line.date,description:line.description,amount:line.amount,bank_account_id:line.bank_account_id},candidates,
  guidance:'Confirm the bank transaction is the SAME payment as the existing journal. Matching never creates revenue or expense.'};
}
export async function matchExisting(c,co,user,payload){
 const line=await bankLine(c,co,payload.line_id,true);
 const lockedCompany=await L.one(c,'SELECT locked_through FROM companies WHERE id=$1 FOR UPDATE',[co]);
 if(lockedCompany?.locked_through&&line.date<=lockedCompany.locked_through)deny('This statement date belongs to a locked accounting period.');
 const entryId=idOf(payload.entry_id);
 // Lock journal to serialize independent match attempts to the same journal.
 const j=await L.one(c,'SELECT id FROM journal_entries WHERE company_id=$1 AND id=$2 FOR UPDATE',[co,entryId]);
 if(!j)deny('Existing journal entry is unavailable.');
 const list=await eligible(c,co,line);
 if(!list.some(x=>Number(x.id)===entryId))deny('The existing journal no longer qualifies. Refresh the suggestions before confirming.');
 const linked=await L.one(c,'SELECT id FROM bank_lines WHERE company_id=$1 AND entry_id=$2 LIMIT 1',[co,entryId]);
 if(linked)deny('This journal is already matched to another bank transaction.');
 const result=await c.query('UPDATE bank_lines SET entry_id=$1 WHERE id=$2 AND company_id=$3 AND entry_id IS NULL AND reconciliation_id IS NULL RETURNING id',[entryId,line.id,co]);
 if(result.rowCount!==1)deny('Bank transaction changed. Refresh before matching.');
 await L.audit(c,co,user,'bank.match',`Bank line #${line.id} matched to pre-existing journal #${entryId}; no new posting.`);
 return {ok:true,line_id:line.id,entry_id:entryId,posted_new_journal:false};
}
export async function closeReadiness(c,co,endDate){
 const end=L.iso(endDate);
 const endDay=new Date(end+'T12:00:00Z');endDay.setUTCMonth(endDay.getUTCMonth()+1);endDay.setUTCDate(0);
 if(end!==endDay.toISOString().slice(0,10))deny('Choose the last day of the month for month-end close.');
 const company=await L.one(c,'SELECT id,locked_through FROM companies WHERE id=$1',[co]);
 if(!company)deny('Company not found.');
 const periodStart=end.slice(0,7)+'-01';
 // This checklist scopes statement activity to the CURRENT requested month.
 const counts=await L.one(c,`SELECT
 COUNT(*) FILTER (WHERE entry_id IS NULL)::int AS unmatched,
 COUNT(*) FILTER (WHERE entry_id IS NOT NULL AND reconciliation_id IS NULL)::int AS uncleared,
 COUNT(*) FILTER (WHERE date BETWEEN $2 AND $3)::int AS imported
 FROM bank_lines WHERE company_id=$1 AND date<=$3`,[co,periodStart,end]);
 const audit=await L.one(c,`SELECT count(*)::int AS reconciliations FROM reconciliations
 WHERE company_id=$1 AND end_date BETWEEN $2 AND $3`,[co,periodStart,end]);
 const outstanding=await L.one(c,`SELECT
 (SELECT COUNT(*) FROM invoices i WHERE i.company_id=$1 AND i.due_date<=$2
 AND i.total>(SELECT COALESCE(SUM(p.amount),0) FROM invoice_payments p WHERE p.invoice_id=i.id))::int AS overdue_invoices,
 (SELECT COUNT(*) FROM bills b WHERE b.company_id=$1 AND b.due_date<=$2
 AND b.total>(SELECT COALESCE(SUM(p.amount),0) FROM bill_payments p WHERE p.bill_id=b.id))::int AS overdue_bills`,[co,end]);
 const imported=Number(counts.imported),unmatched=Number(counts.unmatched),uncleared=Number(counts.uncleared);
 const blockers=[];
 if(unmatched)blockers.push(`${unmatched} imported bank rows remain uncategorized/unmatched for this month.`);
 if(uncleared)blockers.push(`${uncleared} imported bank rows were posted but not reconciled for this month.`);
 const warnings=[];
 if(!imported)warnings.push('No bank statement rows imported for this month. Verify accounts outside the app before closing.');
 if(!Number(audit.reconciliations))warnings.push('No reconciliation was completed for this month.');
 if(Number(outstanding.overdue_invoices))warnings.push(`${outstanding.overdue_invoices} invoices due through this date remain open.`);
 if(Number(outstanding.overdue_bills))warnings.push(`${outstanding.overdue_bills} bills due through this date remain open.`);
 if(company.locked_through&&end<=company.locked_through)blockers.push('This period was already closed.');
 return {period_start:periodStart,through:end,locked_through:company.locked_through,
  bank:{imported,unmatched,uncleared,reconciliations:Number(audit.reconciliations)},
  receivables:{overdue_invoices:Number(outstanding.overdue_invoices),overdue_bills:Number(outstanding.overdue_bills)},
  blockers,warnings,ready:blockers.length===0,requires_manual_bank_ack:imported===0||Number(audit.reconciliations)===0};
}
