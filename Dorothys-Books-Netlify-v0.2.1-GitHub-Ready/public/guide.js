/* Dorothy's Books — built-in, read-only learning center and guided tour. */
const lessons = [
  {id:'start',group:'START HERE',mins:3,title:'Your first 10 minutes',summary:'Learn the safe order for setting up your company and understanding what the numbers mean.',page:'overview',steps:[
    ['Sign in to your private workspace','Use the owner email and password you created. The application runs on Netlify and stores records in its managed private Postgres database.'],
    ['Try the sample company first','Go to Settings → Create demo workspace. The orange banner identifies fictional entries. Switch back to Dorothy’s Petcare using the company selector at the top.'],
    ['Check your starting information','In your live company, the reports begin at zero. Do not enter invented revenue or expenses. Decide on a start date and get your actual bank balance and documents.'],
    ['Record an opening balance','Go to Accounting → Opening balance. Enter the bank balance as of your chosen start date, once. This is money you already had, not income.'],
    ['Begin with one genuine business transaction','Use Transactions → Add income or Add expense only for money received or paid that is not already represented by an invoice or vendor bill.'],
    ['Confirm in the reports','Go to Reports → Profit & loss and Balance sheet. Use the correct period. Numbers are created by saved journal entries, not estimates.']
  ],warning:'For a business already in operation, a bank opening balance alone is not a complete migration. Existing loans, unpaid invoices, bills, taxes, equity, and prior-year balances may also need an accountant’s opening journal.'},
  {id:'demo',group:'START HERE',mins:2,title:'Explore safely with sample data',summary:'Practice without changing Dorothy’s real accounts.',page:'settings',steps:[
    ['Open Settings','Click Settings in the navigation, then “Create demo workspace.” Confirm the dialog.'],
    ['Identify sample mode','The top banner must say SAMPLE WORKSPACE. Its numbers are fictional.'],
    ['Explore sales, expenses and reports','Open Overview, Transactions, and Reports. Try different report tabs and dates.'],
    ['Switch back to the real company','Use the company selector at the upper right to select Dorothy’s Petcare (not the sample workspace). Check the sample banner disappears.']
  ],warning:'An exercise entered into the demo company remains a posted demo entry. You do not need to enter dummy transactions in the live books.'},
  {id:'opening',group:'DAILY BOOKKEEPING',mins:3,title:'Enter your opening bank balance',summary:'Tell the books how much cash existed before you began recording transactions.',page:'accounting',steps:[
    ['Find the starting statement','Choose a clear cutover date and obtain a verified opening bank balance.'],
    ['Navigate to Accounting','Click Accounting → Opening balance.'],
    ['Fill the form','Select date, amount, and the appropriate bank account. Use a memo like “Opening checking balance 10/1/2026.”'],
    ['Post once','Select Save & post. The system debits the bank and credits owner’s equity, without treating it as sales.'],
    ['Verify the balance sheet','Open Reports → Balance sheet using an as-of date on or after the opening entry. It should remain balanced.']
  ],warning:'Do not repeat the opening balance every month. If this company has prior transactions, loans, payables, or receivables, reconcile opening entries with an accountant.'},
  {id:'income',group:'DAILY BOOKKEEPING',mins:3,title:'Record income and paid expenses',summary:'Post money that actually came in or went out, with the correct category.',page:'transactions',steps:[
    ['Open Transactions','Choose Add income for a deposit or Add expense for a purchase that has already been paid.'],
    ['Enter the real date and dollars','Choose the date the payment occurred, exact amount, and a specific description.'],
    ['Choose the bank and category','Select the bank/cash account and a matching income or expense category; never choose one just to make the total look right.'],
    ['Save & post','The journal posts immediately and appears in Transactions and Reports.'],
    ['Check the Profit & loss','Select the relevant month on Reports to verify the category.']
  ],warning:'Do not record income here if you already issued an invoice for the same sale; use Record payment on the invoice. Do not record a bill payment as a second expense.'},
  {id:'invoice',group:'DAILY BOOKKEEPING',mins:4,title:'Create an invoice and record payment',summary:'Track what a customer owes, then record the payment without recognizing revenue twice.',page:'sales',steps:[
    ['Add a customer','Open Sales & invoices → Add customer. Enter a recognizable name and optional email.'],
    ['Start a new invoice','Select New invoice. Choose the customer, date, due date, and an optional memo.'],
    ['Enter invoice items','Describe the service, choose a whole-number quantity and price, then the revenue account. Add another line if needed.'],
    ['Issue invoice','Save to recognize revenue and Accounts Receivable on an accrual basis. The app records the invoice in the cloud database; it does not send email or process a charge.'],
    ['Record money received later','On the invoice row, select Record payment, choose date, amount (partial payments are allowed), and bank account.'],
    ['Review totals','Accounts Receivable decreases when payment posts. Revenue must not increase a second time.']
  ],warning:'Invoice email, printable invoice PDF, tax calculation, card charging and voiding are not implemented in this version.'},
  {id:'bill',group:'DAILY BOOKKEEPING',mins:4,title:'Enter a vendor bill and pay it',summary:'Distinguish bills you owe from expenses that you already paid.',page:'expenses',steps:[
    ['Create the vendor','Go to Bills & expenses → Add vendor. Use the actual supplier name.'],
    ['Enter a bill','Choose New bill, the vendor, bill date, due date, reference number, amount and expense category.'],
    ['Save the bill','The expense and Accounts Payable are recognized on the bill date, even if no cash has left the bank.'],
    ['Record payment','When you actually pay it, select Record payment on its row and choose bank/date/amount.'],
    ['Verify Accounts Payable','Outstanding balance falls as payments are recorded, without double-counting expenses.']
  ],warning:'If you have paid a vendor immediately and no bill has been entered, use Record expense instead. Do not post both methods for the same expense.'},
  {id:'bank',group:'DAILY BOOKKEEPING',mins:5,title:'Import a bank CSV',summary:'Bring a bank statement into an unposted review queue, then categorize carefully.',page:'banking',steps:[
    ['Export a CSV from your bank','On your bank website, download a statement as CSV. No bank account connects automatically.'],
    ['Open Banking → Import CSV','Select the correct account, then the statement file. The app accepts up to 2,000 rows / 2 MB per import.'],
    ['Map columns','Pick Date, Description and either Signed Amount or Debit/Credit columns; optionally map Reference. Bank dates must be YYYY-MM-DD.'],
    ['Confirm signs','Deposits must be positive and withdrawals negative. Check your bank format before importing.'],
    ['Review staged rows','New rows appear as Unreviewed. They are not posted into your accounting totals yet. Reimported duplicate rows are flagged.'],
    ['Categorize only unmatched transactions','Select Categorize for a row, choose an account, and post. First confirm the transaction was not already recorded via income, expense, invoice payment or bill payment.']
  ],warning:'Automatic matching to previously recorded transactions is not available. Categorizing those rows again can double-count transactions. Importing a CSV does not itself affect the ledger.'},
  {id:'reconcile',group:'DAILY BOOKKEEPING',mins:4,title:'Reconcile a statement',summary:'Compare a bank statement’s opening and closing balances against categorized imported rows.',page:'banking',steps:[
    ['Prepare a single statement period','Make sure its imported rows are categorized correctly. Confirm there are no duplicate entries in the general ledger.'],
    ['Open Banking → Reconcile','Choose the bank account and statement end date.'],
    ['Enter bank amounts','Use the exact opening and closing statement balances, not estimated totals.'],
    ['Save only if it balances','A reconciliation is saved only when the categorized, unreconciled imported lines explain the change.'],
    ['Look at history','Successful reconciliations appear in Reconciliation history.']
  ],warning:'This is simplified reconciliation: it does not automatically match existing manual entries, account for uncleared checks, or replace year-end accountant reconciliation.'},
  {id:'reports',group:'UNDERSTAND THE NUMBERS',mins:4,title:'Read the financial reports',summary:'Understand the Profit & loss, Balance sheet, Trial balance and General ledger.',page:'reports',steps:[
    ['Open Reports','Choose Profit & loss to see income minus expenses across the selected date range.'],
    ['Set the period','Choose FROM and TO, then Run report. The dashboard monthly totals cover the current month only.'],
    ['Review Balance sheet','Use the TO date as the as-of date to see assets, liabilities, equity and accumulated profit; the sheet should balance.'],
    ['Investigate detail','Use Trial balance to compare debit/credit totals, and General ledger to inspect journal lines by account.'],
    ['Export a file','Click Export CSV to download the selected report. The file is for review and sharing with a professional—not a tax return.']
  ],warning:'These reports use accrual accounting. Issued invoices count as revenue before payment, and entered bills count as expenses before payment. A cash-flow report is not included.'},
  {id:'corrections',group:'UNDERSTAND THE NUMBERS',mins:4,title:'Correct entries safely',summary:'Understand journal entries, reversals, account types and period locks.',page:'accounting',steps:[
    ['Understand the journal','Every posted transaction has equal debits and credits, and cannot be edited in place.'],
    ['Find the mistaken posting','Open Transactions or Reports → General ledger to locate its date and identifier.'],
    ['For an eligible manual journal use a reversal','In Accounting, select Reverse posted journal, identify the entry and reversal date, then post the offset.'],
    ['Post the corrected transaction','Enter the replacement information through the normal workflow.'],
    ['Close periods with care','Settings → Close an accounting period prevents future backdated postings; only use after review.']
  ],warning:'Not all source transactions can be fixed by a manual reversal: invoices and bills have associated payment/state records. Consult a bookkeeper before correcting these. Period locks are deliberately hard to undo.'},
  {id:'insights',group:'UNDERSTAND THE NUMBERS',mins:2,title:'Use Darius insights',summary:'See rule-based owner observations and trace every figure back to reports.',page:'insights',steps:[
    ['Open Darius insights','Select the item in the sidebar.'],
    ['Review the questions and answers','It summarizes posted monthly revenue, expenses, net result, receivables and payables.'],
    ['Open source reports','Select See source reports to verify the numbers and date range.'],
    ['Look for missing data','Insights are only as complete as the entered books; the app does not yet have AI forecasting or outside data feeds.']
  ],warning:'Insights are deterministic, not a replacement for a CFO, accountant, CPA or tax adviser.'},
  {id:'security',group:'KEEP YOUR BOOKS SAFE',mins:4,title:'Back up and protect company records',summary:'Keep your database safe and understand what the app does not do.',page:'settings',steps:[
    ['Know what is saved','Records live in dorothys.sqlite3 inside the Dorothy’s Books folder.'],
    ['Use a safe backup','Stop the terminal with Control+C, then copy dorothys.sqlite3 to an encrypted external location; or run python3 backup.py from the project folder to use the backup utility.'],
    ['Do not share your database publicly','Financial records may contain sensitive business and contact information. Keep FileVault enabled on your Mac.'],
    ['Check the integration list','Settings shows bank feeds, Snout/Walker, payroll, email and payments as disconnected.'],
    ['Keep an accountant involved','Do not cancel LedgerFi or replace a professional accounting process until real records and workflow gaps are verified.']
  ],warning:'This Netlify version is cloud-hosted and owner-only; it does not provide tax filing or replace professional review.'},
];

const walkthrough = [
  {page:'overview',anchor:'.page-title',eyebrow:'WELCOME',title:'Meet Dorothy’s Books',body:'This is your private finance workspace. We’ll show where everything lives in the actual app. The tour changes screens but does not save, post or change any financial records.'},
  {page:'overview',anchor:'.cards',eyebrow:'OVERVIEW',title:'Know where the business stands',body:'Revenue, expenses, profit and cash here come only from posted transactions. A fresh company correctly begins at zero, not fictional sales.'},
  {page:'accounting',anchor:'[data-action="open:opening"]',eyebrow:'FIRST SETUP',title:'Enter an opening balance',body:'Use Accounting → Opening balance once for the verified amount already in your bank on the starting date. This is not new revenue.'},
  {page:'transactions',anchor:'[data-action="open:expense"]',eyebrow:'DAILY TASK',title:'Record income or paid expenses',body:'Use Add income or Add expense for transactions that happened immediately. Never record the same payment again if an invoice or bill is already in the books.'},
  {page:'sales',anchor:'[data-action="open:invoice"]',eyebrow:'CUSTOMERS',title:'Track invoices and payments',body:'Add a customer first, then create an invoice. When the customer pays, use Record payment in the invoice row, not Add income.'},
  {page:'expenses',anchor:'[data-action="open:bill"]',eyebrow:'VENDORS',title:'Track bills before they’re paid',body:'Add a vendor, enter the bill, and record payment later. A bill creates an expense when entered; paying it does not create a second expense.'},
  {page:'banking',anchor:'[data-action="open:import"]',eyebrow:'BANK STATEMENTS',title:'Import, review, reconcile',body:'Import a CSV, map the columns, and categorize unmatched items only. No automatic bank sync or duplicate matching to existing manual entries is included.'},
  {page:'reports',anchor:'.tabs',eyebrow:'REPORTS',title:'Verify every number',body:'Choose a period and inspect Profit & loss, Balance sheet, Trial balance, or General ledger. Export CSV to share with your accountant.'},
  {page:'settings',anchor:'[data-action="demo"]',eyebrow:'SAFE PRACTICE',title:'Use the sample workspace',body:'Settings can create a separate demo company containing fictional entries. The orange sample banner prevents mistaking it for Dorothy’s actual books.'},
  {page:'help',anchor:'.learning-grid',eyebrow:'HELP CENTER',title:'Come back whenever you need help',body:'Help & tutorials has written instructions for each task, a glossary, safety notes, and a way to restart this tour at any time.'},
];

let activeLesson = null;
let tourIndex = null;
let tourSeenInThisSession = false;
const tourKey = () => `db_walkthrough_v02_${boot?.user?.id||'owner'}_${companyId}`;
const readKey = () => `db_lessons_read_v02_${boot?.user?.id||'owner'}_${companyId}`;
function readLessons(){try {return JSON.parse(localStorage.getItem(readKey())||'[]')}catch{return []}}
function viewedLesson(id){return readLessons().includes(id)}
function markLesson(id){const set=new Set(readLessons());set.add(id);localStorage.setItem(readKey(),JSON.stringify([...set]));}
function isTourOpen(){return tourIndex!==null}
function endTour(completed){localStorage.setItem(tourKey(),completed?'completed':'dismissed');tourIndex=null;document.getElementById('walkthroughOverlay')?.remove();render();}
function startTour(){tourIndex=0;tourSeenInThisSession=true;activeLesson=null;section='overview';modal='';mobileMenu=false;reportData=null;render();}
function moveTour(dir){let next=tourIndex+dir;if(next>=walkthrough.length){endTour(true);return}tourIndex=Math.max(0,next);section=walkthrough[tourIndex].page;mobileMenu=false;modal='';reportData=null;render();}
function syncGuidance(){
  if(!boot?.user||!books)return;
  if(tourIndex===null && !tourSeenInThisSession && !localStorage.getItem(tourKey())){startTour();return}
  if(tourIndex!==null)requestAnimationFrame(renderTourOverlay);
}
function renderTourOverlay(){
  if(tourIndex===null)return;
  document.getElementById('walkthroughOverlay')?.remove();
  const item=walkthrough[tourIndex];const last=tourIndex===walkthrough.length-1;
  const overlay=`<div id="walkthroughOverlay" role="dialog" aria-modal="true" aria-labelledby="tourTitle"><div class="tour-shade"></div><div class="tour-target" aria-hidden="true"></div><div class="tour-panel"><div class="tour-topline"><span>${esc(item.eyebrow)} · ${tourIndex+1} OF ${walkthrough.length}</span><button class="tour-skip" type="button" data-action="tour:skip" aria-label="Skip guided tour">Skip tour ×</button></div><div class="tour-progress" aria-hidden="true"><span style="width:${(tourIndex+1)/walkthrough.length*100}%"></span></div><h2 id="tourTitle">${esc(item.title)}</h2><p>${esc(item.body)}</p><div class="tour-safe">${svg('lock')} Tour only — no records will be changed.</div><div class="tour-footer"><button class="btn" data-action="tour:back" ${tourIndex===0?'disabled':''}>Back</button><button class="btn primary" data-action="tour:next">${last?'Finish & open help':'Next step'} ${svg('arrow')}</button></div></div></div>`;
  root.insertAdjacentHTML('beforeend',overlay);
  const possible=document.querySelector(item.anchor);
  const visible=possible&&possible.getBoundingClientRect().width>0&&possible.getBoundingClientRect().height>0?possible:document.querySelector('.page-title')||document.querySelector('.topbar');
  if(visible){const r=visible.getBoundingClientRect(),ring=document.querySelector('.tour-target');if(ring){ring.style.left=Math.max(5,r.left-7)+'px';ring.style.top=Math.max(5,r.top-7)+'px';ring.style.width=Math.min(innerWidth-10,r.width+14)+'px';ring.style.height=Math.max(45,r.height+14)+'px';}}
  document.querySelector('.tour-panel [data-action="tour:next"]')?.focus({preventScroll:true});
}
function helpView(){
  const read=readLessons();
  if(activeLesson){
    const l=lessons.find(x=>x.id===activeLesson);if(!l){activeLesson=null;return helpView()}
    return `${headline(l.title,l.summary,btn('Back to all tutorials','help:back'))}<div class="learning-layout"><section class="panel learning-article"><div class="article-meta">${esc(l.group)} <span>·</span> ${l.mins} MIN READ ${viewedLesson(l.id)?'<span class="read-flag">✓ READ</span>':''}</div><div class="article-intro">Follow these steps inside Dorothy’s Books. No instruction here automatically posts a transaction.</div><ol class="lesson-steps">${l.steps.map(([h,p])=>`<li><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('')}</ol>${l.warning?`<div class="learning-warning"><strong>BEFORE YOU POST</strong><p>${esc(l.warning)}</p></div>`:''}<div class="lesson-actions">${btn('Go to '+esc(navItems.find(x=>x[0]===l.page)?.[1]||'screen'),`helpnav:${l.page}`,'primary')}${btn(viewedLesson(l.id)?'Read ✓':'Mark lesson as read',`help:read:${l.id}`)}</div></section><aside class="learn-aside"><div class="panel"><div class="panel-body"><div class="overline">A SIMPLE RULE</div><h3>Check twice. Post once.</h3><p>Payments and bank-imported transactions can refer to the same real-world money movement. Double-entry journals help books balance, but they cannot tell you if you entered the same transaction twice.</p></div></div>${btn('Restart guided tour','starttour')}</aside></div>`;
  }
  const count=read.length;
  const allDone=lessons.length;
  const tasks=[
    {title:'Create the private company',done:!!books.company,page:'settings'},
    {title:'Review sample workspace',done:!!books.company.demo,page:'settings',note:'Optional: create the separate demo company'},
    {title:'Enter an opening balance',done:books.journals.some(j=>j.source_type==='opening'),page:'accounting'},
    {title:'Record a genuine income or expense',done:books.journals.some(j=>j.source_type==='income'||j.source_type==='expense'),page:'transactions'},
    {title:'Add a customer or vendor',done:books.contacts.length>0,page:'sales'},
    {title:'Create an invoice or bill',done:books.invoices.length>0||books.bills.length>0,page:'sales'},
    {title:'Import a bank statement',done:books.bank_lines.length>0,page:'banking',note:'Optional: only when you have a bank CSV'}
  ];
  return `${headline('Help, when you need it.','Practical guides for Darius and anyone keeping Dorothy’s books organized.',btn(`${svg('arrow')} Start guided tour`,'starttour','primary'),'DOROTHY’S BOOKS / LEARNING CENTER')}<section class="learning-hero"><div><div class="overline" style="color:#c2d8cf">START HERE · 3 MINUTES</div><h2>Learn the books as you use them.</h2><p>Follow a guided walkthrough across the real screens. Nothing is posted while you learn.</p><button class="btn primary" data-action="starttour">Walk me through the app ${svg('arrow')}</button></div><div class="hero-steps"><span>01 &nbsp; Get oriented</span><span>02 &nbsp; Enter real transactions</span><span>03 &nbsp; Read your reports</span></div></section><div class="learning-layout"><div><section class="panel"><div class="panel-head"><div><div class="panel-title">Your setup checklist</div><div class="panel-sub">Checked using records currently in this company; these are not accounting approval indicators.</div></div></div><div class="checklist">${tasks.map(t=>`<button type="button" class="check-task" data-action="helpnav:${t.page}"><span class="task-check ${t.done?'done':''}">${t.done?'✓':'○'}</span><span><strong>${esc(t.title)}</strong>${t.note?`<small>${esc(t.note)}</small>`:''}</span>${svg('arrow')}</button>`).join('')}</div></section><section class="panel"><div class="panel-head"><div><div class="panel-title">Step-by-step tutorials</div><div class="panel-sub">${count} of ${allDone} lessons marked read · searchable, on demand</div></div></div><div class="learning-search"><label for="helpSearch" class="sr-only">Search tutorials</label><input class="field" id="helpSearch" type="search" placeholder="Search: invoices, bills, importing a CSV…" autocomplete="off"/></div><div class="learning-grid" id="helpLessonList">${lessons.map((l,i)=>`<button class="lesson-card" type="button" data-action="lesson:${l.id}" data-search="${attr((l.title+' '+l.summary+' '+l.group+' '+l.steps.map(s=>s.join(' ')).join(' ')).toLowerCase())}"><span class="lesson-category">${esc(l.group)} <span>· ${l.mins} MIN</span></span><strong>${esc(l.title)}</strong><p>${esc(l.summary)}</p><span class="lesson-foot">${viewedLesson(l.id)?'✓ READ':'READ GUIDE'} ${svg('arrow')}</span></button>`).join('')}</div><p id="noGuideResults" class="no-lessons" hidden>No matching guides. Try “invoice”, “bank”, or “report”.</p></section></div><aside class="learn-aside"><div class="panel"><div class="panel-head"><div class="panel-title">A few terms, explained</div></div><div class="panel-body"><dl class="glossary"><dt>Income / revenue</dt><dd>Money the business earns by providing services.</dd><dt>Expense</dt><dd>The cost of running the business, such as rent or supplies.</dd><dt>Accounts Receivable (A/R)</dt><dd>Money customers owe on issued invoices.</dd><dt>Accounts Payable (A/P)</dt><dd>Money the business owes on vendor bills.</dd><dt>Profit & loss</dt><dd>Revenue minus expenses for a chosen period.</dd><dt>Opening balance</dt><dd>The amount in an account before you start tracking it here.</dd><dt>Reconciliation</dt><dd>Checking your recorded transactions against your bank statement.</dd></dl></div></div><div class="note orange"><strong>What this first version does not replace</strong><p>LedgerFi’s professional bookkeeping or tax coaching, an accountant, automatic bank feeds, payroll, taxes, payment charging, or Snout integration. Keep those workflows separate until verified.</p></div><div class="panel"><div class="panel-body"><strong>Need help later?</strong><p>Click Help in the top bar or Help & tutorials in the left sidebar to return here at any time.</p></div></div></aside></div>`;
}
function filterLessonCards(term){const q=String(term||'').trim().toLowerCase();let shown=0;document.querySelectorAll('#helpLessonList .lesson-card').forEach(el=>{const matches=(el.dataset.search||'').includes(q);el.hidden=!matches;if(matches)shown++});const el=document.getElementById('noGuideResults');if(el)el.hidden=shown>0;}
function handleGuideAction(action){
  if(action==='help'){tourIndex=null;activeLesson=null;modal='';mobileMenu=false;section='help';render();return true}
  if(action==='starttour'){startTour();return true}
  if(action==='tour:skip'){endTour(false);return true}
  if(action==='tour:next'){moveTour(1);return true}
  if(action==='tour:back'){moveTour(-1);return true}
  if(action==='help:back'){activeLesson=null;render();return true}
  if(action.startsWith('lesson:')){const id=action.slice(7);if(lessons.some(l=>l.id===id)){activeLesson=id;section='help';render();window.scrollTo({top:0,behavior:'smooth'})}return true}
  if(action.startsWith('help:read:')){const id=action.slice(10);if(lessons.some(l=>l.id===id)){markLesson(id);render()}return true}
  if(action.startsWith('helpnav:')){const dest=action.slice(8);if(navItems.some(a=>a[0]===dest)){section=dest;activeLesson=null;mobileMenu=false;reportData=null;render();window.scrollTo({top:0,behavior:'smooth'})}return true}
  return false;
}
