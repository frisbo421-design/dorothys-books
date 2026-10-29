/* FIK Books motion direction: motion conveys hierarchy, time, and accounting causality.
 * No animations change data, suppress errors, or intercept entry forms.
 * Source examples: greensock/gsap-skills, darkroomengineering/lenis, apache/echarts-examples. */
(function(){
  'use strict';
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=window.matchMedia('(pointer: coarse)');
  let chart=null, animationScope=null, scroll=null, tick=null, observed=null;
  const priorRender=render;
  const formatter=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  const numeric=n=>Number.isFinite(Number(n))?Number(n):0;

  function cleanupVisual(){
    if(chart){try{chart.dispose()}catch{}chart=null}
    if(animationScope){try{animationScope.revert()}catch{}animationScope=null}
    if(observed){observed.disconnect();observed=null}
  }
  function cleanupScroll(){
    if(tick&&window.gsap)window.gsap.ticker.remove(tick);
    tick=null;
    if(scroll){scroll.destroy();scroll=null}
  }
  function setupScroll(){
    if(mq.matches||coarse.matches||!window.Lenis||!window.gsap){cleanupScroll();return}
    if(scroll)return;
    scroll=new window.Lenis({
      autoRaf:false,
      lerp:.13,
      smoothWheel:true,
      syncTouch:false,
      anchors:true,
      prevent:(el)=>Boolean(el.closest('.table-wrap,.modal,[role="dialog"],textarea,.sidebar'))
    });
    const onScroll=()=>window.ScrollTrigger?.update();
    scroll.on('scroll',onScroll);
    tick=(time)=>scroll?.raf(time*1000);
    window.gsap.ticker.add(tick);
  }
  function reviewLane(){
    if(section!=='overview'||!books?.dashboard)return;
    const cards=document.querySelector('.shell .cards');
    if(!cards||!cards.parentElement)return;
    const d=books.dashboard;
    const records=[
      {label:'Bank lines to review',count:Math.max(0,numeric(d.unreviewed)),nav:'banking'},
      {label:'Overdue invoices',count:Math.max(0,numeric(d.overdue_invoices)),nav:'sales'},
      {label:'Overdue bills',count:Math.max(0,numeric(d.overdue_bills)),nav:'expenses'}
    ];
    const lane=document.createElement('section');lane.className='fik-review-lane';lane.setAttribute('aria-label','Accounting review queue');
    const title=document.createElement('div');title.className='fik-review-title';
    title.textContent='Needs your attention';
    lane.append(title);
    const list=document.createElement('div');list.className='fik-review-items';
    for(const item of records){
      const b=document.createElement('button');b.type='button';b.className='fik-review-item';
      b.dataset.nav=item.nav;
      const n=document.createElement('strong');n.textContent=String(item.count);
      const label=document.createElement('span');label.textContent=item.label;
      b.append(n,label);list.append(b);
    }
    lane.append(list);cards.after(lane);
  }
  function tellStory(){
    const main=document.querySelector('.shell .content');
    if(!main||!books||!books.dashboard)return;
    const label=document.createElement('div');
    label.className='fik-story-head';
    const month=String(books.dashboard.month||'Current period');
    const left=document.createElement('span');
    left.className='fik-story-note';
    const pip=document.createElement('i');pip.className='fik-story-pip';pip.setAttribute('aria-hidden','true');
    left.append(pip,document.createTextNode('Posted ledger · '+month));
    const right=document.createElement('span');
    right.className='fik-story-detail';
    right.textContent=books.company?.demo?'Sample company · Fictional data':'Bank feeds not connected · Imported/manual data only';
    label.append(left,right);
    main.prepend(label);
  }
  function mountChart(){
    if(section!=='overview'||!books?.dashboard||!window.echarts)return;
    const series=books.dashboard.trend;
    if(!Array.isArray(series)||!series.length)return;
    const fallback=document.querySelector('.bars');
    if(!fallback||!fallback.parentElement)return;
    const node=document.createElement('div');
    node.className='fik-chart';
    node.setAttribute('role','img');
    node.setAttribute('aria-label','Six-month revenue, expenses and operating result from posted journal entries');
    node.setAttribute('tabindex','0');
    const parent=fallback.parentElement;
    parent.insertBefore(node,fallback);
    try{
      chart=window.echarts.init(node,null,{renderer:'svg'});
      const x=series.map(p=>String(p.month||''));
      const amounts=(key)=>series.map(p=>numeric(p[key])/100);
      chart.setOption({
        animation:!mq.matches,animationDuration:mq.matches?0:900,animationEasing:'cubicOut',
        grid:{top:28,left:9,right:9,bottom:25,containLabel:true},
        tooltip:{trigger:'axis',axisPointer:{type:'shadow'},confine:true,
          valueFormatter:(v)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(numeric(v))},
        legend:{show:false},
        xAxis:{type:'category',data:x,axisLine:{show:false},axisTick:{show:false},
          axisLabel:{fontSize:11,color:'#64786b',fontFamily:'IBM Plex Mono'}},
        yAxis:{type:'value',axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:'#e9eeea'}},
          axisLabel:{color:'#78897d',fontSize:10,formatter:v=>new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(v)}},
        series:[
          {name:'Revenue',type:'bar',data:amounts('revenue'),barMaxWidth:19,barGap:'15%',itemStyle:{color:'#e8621a',borderRadius:[2,2,0,0]}},
          {name:'Expenses',type:'bar',data:amounts('expenses'),barMaxWidth:19,itemStyle:{color:'#94bdc4',borderRadius:[2,2,0,0]}},
          {name:'Operating result',type:'line',data:amounts('profit'),smooth:.2,symbol:'circle',symbolSize:6,
            lineStyle:{color:'#1b5d47',width:2},itemStyle:{color:'#1b5d47'},z:5}
        ],
        aria:{enabled:true,description:'Revenue, expenses and operating profit are drawn from posted accounting entries, not connected bank feeds.'}
      });
      fallback.hidden=true;
      const legend=document.createElement('div');legend.className='fik-chart-caption';
      const group=document.createElement('span');group.className='fik-chart-legend';
      [['#e8621a','Revenue'],['#94bdc4','Expenses'],['#1b5d47','Operating result']].forEach(([color,name])=>{
        const i=document.createElement('i');i.className='fik-chart-swatch';i.style.backgroundColor=color;
        const label=document.createElement('span');label.append(i,document.createTextNode(name+'  '));group.append(label);
      });
      const note=document.createElement('span');note.textContent='Amounts from posted entries';
      legend.append(group,note);node.after(legend);
      if('ResizeObserver' in window){observed=new ResizeObserver(()=>chart?.resize());observed.observe(node)}
    }catch(e){if(chart)chart.dispose();chart=null;node.remove();fallback.hidden=false}
  }
  function motion(){
    if(mq.matches||!window.gsap)return;
    if(window.ScrollTrigger)window.gsap.registerPlugin(window.ScrollTrigger);
    const scope=document.querySelector('.shell .workspace');if(!scope)return;
    animationScope=window.gsap.context(()=>{
      window.gsap.from('.page-title h1',{y:14,opacity:0,duration:.48,ease:'power2.out',clearProps:'all'});
      window.gsap.from('.cards .metric',{y:11,opacity:0,duration:.42,stagger:.07,ease:'power2.out',clearProps:'all'});
      const panels=scope.querySelectorAll('.panel');
      if(window.ScrollTrigger){
        panels.forEach(panel=>window.gsap.from(panel,{y:12,opacity:0,duration:.5,
          scrollTrigger:{trigger:panel,start:'top 97%',once:true},clearProps:'all'}));
      }
    },scope);
  }
  function decorate(){
    if(!boot?.user||!books){cleanupScroll();return}
    const workspace=document.querySelector('.shell');if(!workspace)return;
    workspace.classList.add('fik-books-ui');
    tellStory();
    reviewLane();
    mountChart();
    setupScroll();
    if(scroll){if(modal||mobileMenu)scroll.stop();else scroll.start()}
    motion();
  }
  render=function(){
    cleanupVisual();
    priorRender();
    decorate();
  };
  mq.addEventListener?.('change',()=>{cleanupVisual();cleanupScroll();if(boot?.user&&books)decorate()});
})();
