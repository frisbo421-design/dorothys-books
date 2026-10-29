/* Dorothy's Books v0.5 — explicit bank matching and month-end review.
 * The server is authoritative. This UI never creates a journal when matching. */
(function(){
 'use strict';
 const previousRender=render;
 let currentRequest=0;
 const lastCompleteMonth=()=>{
  const now=new Date();
  return new Date(now.getFullYear(),now.getMonth(),0).toLocaleDateString('en-CA');
 };
 function drawBankQueue(){
   if(section!=='banking'||!books?.bank_lines)return;
   const container=document.querySelector('main.content');
   const activity=container?.querySelector('.cards');
   if(!activity)return;
   const open=books.bank_lines.filter(row=>row.entry_id==null&&row.reconciliation_id==null);
   const sectionEl=document.createElement('section');
   sectionEl.className='panel mm-queue';
   sectionEl.setAttribute('aria-label','Bank matching review');
   sectionEl.innerHTML='<div class="panel-head"><div><div class="panel-title">Match before categorizing</div><div class="panel-sub">First check whether a payment was already posted. Matching uses an existing journal; categorizing creates a new one.</div></div><span class="status neutral">'+open.length+' to review</span></div>'+
   (open.length?'<div class="table-wrap"><table><thead><tr><th>Date</th><th>Bank description</th><th>Amount</th><th>Next action</th></tr></thead><tbody>'+
    open.slice(0,25).map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.description)+'</td><td class="money">'+money(x.amount)+'</td><td><button class="btn mini" type="button" data-mm-open="'+attr(x.id)+'">Find existing posting</button></td></tr>').join('')+
   '</tbody></table></div>':'<div class="panel-body"><p class="prose">No unmatched bank statement rows. Import a CSV to begin reviewing.</p></div>')+
   '<div class="panel-body"><small class="smallprint">Suggestions require the same bank account, an exact amount and a date within seven days. Verify the underlying transaction before approving.</small></div>';
   activity.after(sectionEl);
   // Show which statements were matched to an existing journal (vs newly categorized).
   const known=new Map((books.journals||[]).map(j=>[String(j.id),j]));
   const imported=Array.from(container.querySelectorAll('.panel')).find(p=>p.textContent.includes('Imported bank activity'));
   const body=imported?.querySelector('tbody');
   if(body){Array.from(body.querySelectorAll('tr')).forEach((tr,i)=>{
     const line=books.bank_lines[i],journal=known.get(String(line?.entry_id));
     if(line?.entry_id&&journal&&journal.source_type!=='bank_line'){
       const badge=tr.querySelector('.status');if(badge)badge.textContent='Matched';
     }
   })}
 }
 function drawClosePreview(){
  if(section!=='settings'||!books?.company)return;
  const container=document.querySelector('main.content');
  if(!container)return;
  const el=document.createElement('section');el.className='panel mm-close';
  el.innerHTML='<div class="panel-head"><div><div class="panel-title">Month-end close review</div><div class="panel-sub">Review unresolved bank lines and outstanding receivables before locking a month.</div></div></div>'+
  '<div class="panel-body"><label class="form-label">MONTH END<input class="field" type="date" id="mmCloseEnd" value="'+lastCompleteMonth()+'" required></label>'+
  '<button class="btn dark" data-mm-preview type="button" style="margin-top:12px">Review close readiness</button><div id="mmCloseResult" class="mm-close-result" role="status" aria-live="polite"></div>'+
  '<p class="smallprint">A checklist is informational until you explicitly close a period. Future dates cannot be locked.</p></div>';
  const first=container.querySelector('.two-col')||container.firstElementChild;
  first?.before(el);
 }
 function decorate(){
  if(!boot?.user||!books)return;
  drawBankQueue();drawClosePreview();
  if(modal==='lock'){
   const inner=document.querySelector('#modalForm .modal-inner');
   if(inner){
    const input=inner.querySelector('input[name="locked_through"]');
    if(input)input.value=lastCompleteMonth();
    inner.insertAdjacentHTML('beforeend','<label class="mm-ack"><input type="checkbox" name="ack_manual_bank_review"> I have independently reviewed the bank statements when none were imported/reconciled. This does not certify a reconciliation.</label><p class="smallprint">Closing is blocked if any imported rows through the selected month remain unmatched or unreconciled.</p>');
   }
  }
 }
 render=function(){previousRender();decorate()};
 function dialog(html){
   document.getElementById('mmDialog')?.remove();
   const backdrop=document.createElement('div');backdrop.id='mmDialog';backdrop.className='modal-bg mm-dialog';
   backdrop.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="Bank matching review"><header><div><h2>Match existing transaction</h2><p>Review before linking. No new entry will be posted.</p></div><button class="x" type="button" data-mm-cancel aria-label="Close">×</button></header><div class="modal-inner" id="mmDialogBody">'+html+'</div><footer><button class="btn" data-mm-cancel type="button">Cancel</button></footer></div>';
   document.body.append(backdrop);backdrop.querySelector('[data-mm-cancel]')?.focus();
 }
 async function openMatching(id){
   const nonce=++currentRequest;
   dialog('<p class="prose">Searching existing posted journals…</p>');
   try{
    const result=await api('bank/match/candidates?line_id='+encodeURIComponent(id));
    if(nonce!==currentRequest||!document.getElementById('mmDialogBody'))return;
    const x=result.line,rows=result.candidates||[];
    const html='<p class="prose"><strong>Bank statement:</strong> '+esc(x.date)+' · '+esc(x.description)+' · '+money(x.amount)+'</p>'+
      '<p class="smallprint">Match only if this is the same underlying payment. Same amount alone does not prove a match.</p>'+
      (rows.length?'<div class="table-wrap"><table><thead><tr><th>Journal</th><th>Posting</th><th>Amount</th><th>Action</th></tr></thead><tbody>'+
      rows.map(j=>'<tr><td>#'+esc(j.id)+' · '+esc(j.date)+'</td><td>'+esc(j.memo)+' <small>'+esc(j.source_type)+'</small></td><td class="money">'+money(j.amount)+'</td><td><button class="btn mini" type="button" data-mm-confirm="'+attr(j.id)+'" data-mm-line="'+attr(x.id)+'">Confirm match</button></td></tr>').join('')+
      '</tbody></table></div>':'<p class="note orange">No eligible existing posting was found. If this is new financial activity, close this window and use Categorize instead.</p>');
    document.getElementById('mmDialogBody').innerHTML=html;
   }catch(e){const b=document.getElementById('mmDialogBody');if(b)b.innerHTML='<p class="note orange">'+esc(e.message)+'</p>'}
 }
 async function confirmMatch(line,entry){
  if(!window.confirm('Link this bank row to the already-posted journal #'+entry+'? This does not create another journal entry.'))return;
  const btn=document.querySelector('[data-mm-confirm="'+CSS.escape(String(entry))+'"]');if(btn)btn.disabled=true;
  try{
   await api('bank/match',{line_id:Number(line),entry_id:Number(entry)});
   currentRequest++;document.getElementById('mmDialog')?.remove();
   await refresh();notify('Bank line matched to an existing posted journal. No duplicate posting created.');
  }catch(e){notify(e.message,true);if(btn)btn.disabled=false}
 }
 async function checkClose(){
  const input=document.getElementById('mmCloseEnd'),target=document.getElementById('mmCloseResult');
  if(!input||!target)return;
  target.textContent='Checking the posting ledger and imported statement rows…';
  try{
   const d=await api('close/readiness?end='+encodeURIComponent(input.value));
   const items=[...d.blockers.map(s=>'<li class="mm-block">'+esc(s)+'</li>'),...d.warnings.map(s=>'<li>'+esc(s)+'</li>')];
   target.innerHTML='<p><strong>'+(d.ready?'No bank-posting blockers':'Not ready to close')+'</strong> · '+esc(d.period_start)+' through '+esc(d.through)+'</p>'+
    '<p>'+d.bank.imported+' imported in month · '+d.bank.unmatched+' unmatched through period · '+d.bank.uncleared+' uncleared through period</p>'+
    '<ul>'+items.join('')+'</ul><p class="smallprint">An empty checklist does not guarantee accounting completeness. Review actual statements and payroll/payables before a final lock.</p>';
  }catch(e){target.textContent=e.message}
 }
 document.addEventListener('click',e=>{
   const b=e.target.closest('[data-mm-open],[data-mm-confirm],[data-mm-cancel],[data-mm-preview]');
   if(!b)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(b.hasAttribute('data-mm-open'))openMatching(b.dataset.mmOpen);
   else if(b.hasAttribute('data-mm-confirm'))confirmMatch(b.dataset.mmLine,b.dataset.mmConfirm);
   else if(b.hasAttribute('data-mm-preview'))checkClose();
   else {currentRequest++;document.getElementById('mmDialog')?.remove()}
 },true);
 document.addEventListener('submit',e=>{
  if(e.target.id!=='modalForm'||e.target.dataset.kind!=='lock')return;
  e.preventDefault();e.stopImmediatePropagation();
  if(busy)return;
  busy=true;
  const form=e.target,button=form.querySelector('[type="submit"]');
  if(button)button.disabled=true;
  const data=Object.fromEntries(new FormData(form).entries());
  data.ack_manual_bank_review=form.querySelector('[name="ack_manual_bank_review"]')?.checked===true;
  api('lock',data).then(()=>refresh()).then(()=>{modal='';render();notify('Accounting period locked and audited.');}).catch(err=>notify(err.message,true))
   .finally(()=>{busy=false;if(button)button.disabled=false});
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('mmDialog')){currentRequest++;document.getElementById('mmDialog').remove()}},true);
})();
