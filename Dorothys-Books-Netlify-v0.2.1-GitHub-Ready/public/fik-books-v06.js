/* FIK Books 0.6: Financial Position.
 * A task-first visual interface, backed exclusively by existing posted books.
 * Presentation-only enhancement: never changes accounts, auth, ledger or payment workflows.
 */
(function () {
  'use strict';
  const originalOverview = overviewView;
  const clamp = value => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));
  const amount = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const pos = value => amount(value) > 0;
  const pct = (a,b) => b > 0 ? (amount(a)/b*100).toFixed(1)+'%' : '—';
  const asText = x => esc(x ?? '');
  const statusLine = (count, singular) => {
    const c = Math.max(0, amount(count));
    return c === 1 ? '1 '+singular : c.toLocaleString('en-US')+' '+singular+'s';
  };

  overviewView = function () {
    if (!books || !books.dashboard || !books.dashboard.pnl) return originalOverview();
    const d = books.dashboard;
    const p = d.pnl;
    const revenue = amount(p.revenue), expenses = amount(p.expenses), profit = amount(p.profit);
    const widthScale = Math.max(1, Math.abs(revenue), Math.abs(expenses));
    const revenueWidth = clamp(Math.max(0,revenue) / widthScale * 100);
    const ratio = clamp(Math.max(0,expenses) / widthScale * 100);
    const margin = pct(profit, revenue);
    const negative = profit < 0;
    const hasEntries = Array.isArray(d.recent) && d.recent.length > 0;
    const graph = Array.isArray(d.trend) && d.trend.length ? trendChart(d.trend) : "<div class='ob-chart-empty'>No monthly trend yet. Post real transactions to build a financial history.</div>";
    const incomeLabel = revenue > 0 ? 'From posted income' : 'No revenue posted for this period';
    const profitLabel = negative ? 'OPERATING DEFICIT' : 'OPERATING RESULT';
    const reviewItems = [
      {count:amount(d.unreviewed),label:'Bank entries awaiting review',route:'banking',note:'Match or categorize'},
      {count:amount(d.overdue_invoices),label:'Overdue customer invoices',route:'sales',note:'Review receivables'},
      {count:amount(d.overdue_bills),label:'Overdue vendor bills',route:'expenses',note:'Review obligations'}
    ];
    return [
      "<div class='ob-header'>",
        "<div class='ob-heading'><div class='ob-kicker'><span class='ob-kicker-dash'></span> DOROTHY’S PETCARE <span class='ob-separator'>/</span> ",asText(d.month),
          "</div><h1>Financial position<span class='ob-title-stop'>.</span></h1>",
          "<p>One ledger. A clear view of what was earned, spent, and needs your attention.</p></div>",
        "<div class='ob-header-actions'>",btn('Review banking','nav:banking'),btn(svg('plus')+' Record transaction','open:quick','primary'),"</div>",
      "</div>",
      "<section class='ob-stage' aria-label='Operating results and money flow'>",
        "<div class='ob-stage-left'><div class='ob-stage-top'><span class='ob-chip'><i aria-hidden='true'></i> POSTED ACCOUNTING DATA</span><span class='ob-stage-period'>",asText(d.month),"</span></div>",
          "<div class='ob-stage-label'>",profitLabel,"</div>",
          "<div class='ob-stage-value ",negative?"ob-negative":"", "'>",money(profit),"</div>",
          "<div class='ob-stage-description'>", negative?"Expenses exceed recognized revenue for this period.":"Revenue after recognized operating expenses for this period.","</div>",
          "<div class='ob-stage-bottom'><span>Net operating margin</span><strong>",margin,"</strong></div>",
        "</div>",
        "<div class='ob-stage-flow'><div class='ob-flow-head'><span>HOW THE MONTH ADDS UP</span><span>USD · POSTED JOURNALS</span></div>",
          "<div class='ob-flow-step'><div class='ob-flow-label'><span>Recognized revenue</span><strong>",money(revenue),"</strong></div>",
            "<div class='ob-flow-track'><span class='ob-flow-fill ob-fill-revenue' style='--ob-target:",revenueWidth,"%'></span></div><small>",incomeLabel,"</small></div>",
          "<div class='ob-flow-join' aria-hidden='true'><span></span><span></span><span></span></div>",
          "<div class='ob-flow-step'><div class='ob-flow-label'><span>Operating expenses</span><strong>",money(expenses),"</strong></div>",
            "<div class='ob-flow-track'><span class='ob-flow-fill ob-fill-expenses' style='--ob-target:",ratio,"%'></span></div>",
            "<small>",revenue>0?'Expenses represent '+pct(expenses,revenue)+' of recognized revenue':'Expense comparison requires recognized revenue',"</small></div>",
          "<div class='ob-flow-bottom'><div class='ob-flow-bottom-caption'>Net result</div><strong class='",negative?"ob-negative":"","'>",money(profit),"</strong></div>",
        "</div>",
      "</section>",
      "<div class='ob-dataline'><div><span class='ob-dataline-dot'></span>",hasEntries?"Posted entries in your ledger":"No activity posted yet","</div>",
        "<span>Not a bank feed. Balances update when you post records.</span></div>",
      "<section class='ob-measures' aria-label='Financial position summary'>",
        "<button class='ob-measure' data-nav='banking' type='button'><span>BOOK CASH</span><strong>",money(d.cash),"</strong><small>Ledger balance, not live bank</small><em aria-hidden='true'>↗</em></button>",
        "<button class='ob-measure' data-nav='sales' type='button'><span>RECEIVABLES</span><strong>",money(d.ar),"</strong><small>Unpaid customer invoices</small><em aria-hidden='true'>↗</em></button>",
        "<button class='ob-measure' data-nav='expenses' type='button'><span>PAYABLES</span><strong>",money(d.ap),"</strong><small>Open vendor obligations</small><em aria-hidden='true'>↗</em></button>",
        "<button class='ob-measure' data-nav='reports' type='button'><span>MONTHLY REVENUE</span><strong>",money(revenue),"</strong><small>Income recognized this period</small><em aria-hidden='true'>↗</em></button>",
      "</section>",
      "<section class='ob-analysis'>",
        "<div class='ob-analysis-main'><div class='ob-section-heading'><div><div class='ob-section-index'>THE TREND</div>",
          "<h2>Six months, one picture.</h2><p>Every bar is calculated from posted journal activity.</p></div>",
          "<button class='ob-text-action' data-nav='reports' type='button'>Open full reports <span aria-hidden='true'>↗</span></button></div>",
          "<div class='ob-chart-frame'>",graph,"</div>",
          "<div class='ob-chart-source'>REVENUE / EXPENSES / OPERATING RESULT <span>MONTHLY POSTED ENTRIES</span></div></div>",
        "<div class='ob-analysis-side'><div class='ob-section-index'>OPEN OBLIGATIONS</div><h2>What is still owed?</h2>",
          "<p>Open customer and vendor balances. These are obligations, not money already received or paid.</p>",
          "<div class='ob-due-row'><span>Customers owe</span><strong>",money(d.ar),"</strong></div>",
          "<div class='ob-due-line'><span style='width:",clamp(d.ar > 0 ? (d.ar/(d.ar+d.ap||1))*100 : 0),"%'></span></div>",
          "<div class='ob-due-row'><span>Vendors are owed</span><strong>",money(d.ap),"</strong></div>",
          "<div class='ob-due-line ob-payables'><span style='width:",clamp(d.ap > 0 ? (d.ap/(d.ar+d.ap||1))*100 : 0),"%'></span></div>",
          "<div class='ob-due-actions'><button data-nav='sales' type='button'>Invoices <span aria-hidden='true'>↗</span></button>",
          "<button data-nav='expenses' type='button'>Bills <span aria-hidden='true'>↗</span></button></div>",
        "</div>",
      "</section>",
      "<section class='ob-review' aria-label='Review queue'><div class='ob-review-title'><div class='ob-section-index'>REVIEW QUEUE</div>",
        "<h2>Attention, not noise.</h2><p>Work through the exceptions before closing your books.</p>",
        "<div class='ob-review-total'>",statusLine(reviewItems.reduce((n,r)=>n+r.count,0),'item')," flagged from existing records</div></div>",
        "<div class='ob-review-list'>",reviewItems.map((item,i)=>
         "<button class='ob-review-row' type='button' data-nav='"+item.route+"'><span class='ob-review-n'>0"+(i+1)+"</span>"+
         "<strong>"+item.count.toLocaleString('en-US')+"</strong><span class='ob-review-description'>"+item.label+
         "<small>"+item.note+"</small></span><span class='ob-review-arrow' aria-hidden='true'>↗</span></button>").join(""),
        "</div></section>",
      "<section class='ob-ledger'><div class='ob-section-heading'><div><div class='ob-section-index'>POSTED HISTORY</div>",
        "<h2>Every number has a trail.</h2><p>Recent posted transactions; original journal records remain unchanged.</p></div>",
        "<button class='ob-text-action' data-nav='transactions' type='button'>Open general ledger <span aria-hidden='true'>↗</span></button></div>",
        "<div class='ob-ledger-table'>",recentTable(d.recent||[],9),"</div></section>",
      "<footer class='ob-proof'>SOURCE: DOROTHY'S BOOKS · POSTGRES LEDGER <span>Manual bank imports · No automatic bank or Snout payment synchronization</span></footer>"
    ].join('');
  };

  const commands = [
    ['Overview','overview','nav'],['Review bank activity','banking','nav'],
    ['Transactions and journal','transactions','nav'],['Customer invoices','sales','nav'],
    ['Vendor bills','expenses','nav'],['Chart of accounts','accounting','nav'],
    ['Financial reports','reports','nav'],['Financial insights','insights','nav'],
    ['People and settings','settings','nav'],['Record income','income','action'],
    ['Record expense','expense','action'],['Add journal entry','journal','action']
  ];

  let commandTrigger = null;
  function closeCommand(restoreFocus=true) {
    const existed = document.getElementById('obCommand');
    existed?.remove();
    if (existed && restoreFocus && commandTrigger?.isConnected) commandTrigger.focus();
    commandTrigger=null;
  }
  function renderCommands(filter) {
    const list = document.getElementById('obCommandResults');
    if(!list)return;
    const result=commands.filter(v=>v[0].toLowerCase().includes(filter.toLowerCase())).slice(0,10);
    list.innerHTML=result.length?result.map(([name,target,mode],i)=>
      "<button type='button' class='ob-command-result' data-ob-command='"+mode+":"+target+"'><span>"+esc(name)+"</span><small>"+(mode==='action'?'CREATE':'GO TO')+"</small><i aria-hidden='true'>↗</i></button>"
    ).join(''):"<p class='ob-command-empty'>No matching command.</p>";
  }
  function openCommand() {
    if(!boot?.user||!books)return;
    closeCommand(false);
    commandTrigger=document.activeElement;
    const layer=document.createElement('div');
    layer.id='obCommand';layer.className='ob-command-layer';
    layer.innerHTML="<div class='ob-command-backdrop' data-ob-close></div><div class='ob-command' role='dialog' aria-modal='true' aria-label='Search workspace'>"+
      "<label><span>SEARCH YOUR WORKSPACE</span><input id='obCommandInput' type='search' placeholder='Jump to banking, reports, a task…' autocomplete='off' aria-label='Search workspace actions'></label>"+
      "<div id='obCommandResults' class='ob-command-results'></div><footer><span>↑ ↓ Explore</span><span>ESC Close</span></footer></div>";
    document.body.append(layer);
    renderCommands('');
    document.getElementById('obCommandInput')?.focus();
  }
  const originalRender=render;
  render=function(){
    closeCommand(false);
    originalRender();
    if(!boot?.user||!books)return;
    const bar=document.querySelector('.shell .top-actions');
    if(bar && !bar.querySelector('#obCommandLauncher')){
      const button=document.createElement('button');
      button.type='button';button.id='obCommandLauncher';
      button.className='ob-command-launcher';
      button.setAttribute('aria-label','Search navigation and actions');
      button.innerHTML="<span aria-hidden='true'>⌕</span> Search <kbd>⌘ K</kbd>";
      bar.prepend(button);
    }
  };
  document.addEventListener('click',event=>{
    if(event.target.closest('#obCommandLauncher')){event.preventDefault();event.stopImmediatePropagation();openCommand();return}
    if(event.target.closest('[data-ob-close]')){event.preventDefault();event.stopImmediatePropagation();closeCommand();return}
    const c=event.target.closest('[data-ob-command]');
    if(!c)return;
    event.preventDefault();event.stopImmediatePropagation();
    const [mode,target]=c.dataset.obCommand.split(':');
    closeCommand();
    if(mode==='nav'){section=target;modal='';mobileMenu=false;reportData=null;render()}
    if(mode==='action')doAction('open:'+target).catch(e=>notify(e.message,true));
  },true);
  document.addEventListener('input',event=>{
    if(event.target.id==='obCommandInput')renderCommands(event.target.value);
  });
  document.addEventListener('keydown',event=>{
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){
      event.preventDefault();event.stopImmediatePropagation();openCommand();return;
    }
    const dialog=document.getElementById('obCommand');
    if(dialog && event.key==='Tab'){
      const controls=[...dialog.querySelectorAll('input,button')].filter(x=>!x.disabled);
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus()}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus()}
      return;
    }
    if(event.key==='Escape'&&dialog){event.preventDefault();event.stopImmediatePropagation();closeCommand()}
  },true);
})();
