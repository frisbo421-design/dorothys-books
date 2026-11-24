/** A provenance-first year-end tax working paper, NOT a calculated tax bill or filed return.
 * All amounts are posted-Books integer cents. Snout history, 1099-K, payroll,
 * settlement evidence, entity classification and tax basis must be reconciled separately.
 * This module issues SELECT queries only and never posts or locks entries.
 */
import * as L from './ledger.mjs';

export function taxYear(raw){
  const value=String(raw||'');
  if(!/^20\d{2}$/.test(value))throw new L.BookError('Select a valid tax year from 2000 through 2099.');
  const y=Number(value);
  if(y>new Date().getUTCFullYear()+1)throw new L.BookError('Future tax years are not supported.');
  return y;
}

export async function taxWorkingPaper(c,companyId,rawYear){
  const year=taxYear(rawYear);
  const start=year+'-01-01',end=year+'-12-31';
  const [operations,position,history,bank,reconciled,unpaid] = await Promise.all([
    L.pnl(c,companyId,start,end),
    L.balanceSheet(c,companyId,end),
    L.one(c,`SELECT COUNT(*)::int AS count, MIN(date) AS first_date, MAX(date) AS last_date
      FROM journal_entries WHERE company_id=$1 AND date BETWEEN $2 AND $3`,[companyId,start,end]),
    L.one(c,`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE entry_id IS NULL)::int AS unmatched,
      COUNT(*) FILTER (WHERE entry_id IS NOT NULL AND reconciliation_id IS NULL)::int AS uncleared
      FROM bank_lines WHERE company_id=$1 AND date BETWEEN $2 AND $3`,[companyId,start,end]),
    L.one(c,`SELECT COUNT(*)::int AS count FROM reconciliations WHERE company_id=$1 AND end_date BETWEEN $2 AND $3`,[companyId,start,end]),
    L.one(c,`SELECT
       (SELECT COUNT(*)::int FROM invoices i WHERE i.company_id=$1 AND i.date<=$2
        AND i.total>(SELECT COALESCE(SUM(p.amount),0) FROM invoice_payments p WHERE p.invoice_id=i.id)) AS outstanding_invoices,
       (SELECT COUNT(*)::int FROM bills b WHERE b.company_id=$1 AND b.date<=$2
        AND b.total>(SELECT COALESCE(SUM(p.amount),0) FROM bill_payments p WHERE p.bill_id=b.id)) AS outstanding_bills`,[companyId,end]),
  ]);
  const flags=[];
  if(Number(bank?.unmatched||0)>0)flags.push('Imported bank transactions remain unmatched; verify whether they are income, transfers, refunds, or expenses.');
  if(Number(bank?.uncleared||0)>0)flags.push('Categorized bank activity remains unreconciled.');
  if(Number(reconciled?.count||0)===0)flags.push('No bank reconciliation recorded for this tax year.');
  if(Number(bank?.total||0)===0)flags.push('No bank statement lines imported for this tax year; missing imports are not evidence of zero activity.');
  if(Number(history?.count||0)===0)flags.push('No posted journal entries found for this tax year.');
  return {
    ok:true,kind:'tax_working_paper',year,period:{start,end},
    source_system:'dorothys-books',basis:'posted_journals_not_yet_tax_adjusted',
    currency:'USD',money_unit:'integer_cents',company_id:companyId,
    profit_and_loss:operations,balance_sheet:position,
    coverage:{
      journal_entries:Number(history?.count||0),first_posted_date:history?.first_date||null,last_posted_date:history?.last_date||null,
      imported_bank_lines:Number(bank?.total||0),unmatched_bank_lines:Number(bank?.unmatched||0),
      unreconciled_bank_lines:Number(bank?.uncleared||0),reconciliation_records:Number(reconciled?.count||0),
      open_invoices_as_of_end:Number(unpaid?.outstanding_invoices||0),open_bills_as_of_end:Number(unpaid?.outstanding_bills||0),
      snout_payment_history:'not_verified',processor_settlements:'not_verified',
      processor_1099k:'not_verified',payroll:'not_verified',
      receipts_and_vendor_docs:'not_verified',entity_tax_classification:'not_configured',
      accounting_method:'not_configured',ny_sales_tax_configuration:'not_verified',
    },
    warnings:flags,
    ready_for_filing:false,
    tax_due:null,tax_form:null,estimated_tax:null,
    next_actions:[
      'Verify legal taxpayer/entity and tax elections and choose cash or accrual basis with the preparer.',
      'Reconcile all Snout invoice, payment, refund, credit and gift/prepaid records with book entries.',
      'Reconcile card processor gross payments, refunds, fees, 1099-K statements and bank deposits.',
      'Verify payroll, vendor receipts, business expenses and applicable New York service/product sales taxes.',
      'Have the responsible tax preparer review adjustments, tax forms and the filing package.'
    ],
    notice:'This is a bookkeeping working paper, not a tax return, tax estimate, or confirmation of complete records.'
  };
}
