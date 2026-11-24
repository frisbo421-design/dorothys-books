import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = p => readFileSync(new URL(p,import.meta.url),'utf8');
const html = source('../public/index.html');
const script = source('../public/fik-books-v06.js');
const motion = source('../public/fik-books-motion.js');
const css = source('../public/fik-books-v06.css');

function renderSnapshot(dashboard){
 const state={company:{name:"Dorothy's Petcare",demo:false},dashboard,insights:[]};
 const stub={
  addEventListener:()=>{},body:{append:()=>{}},getElementById:()=>null,
  querySelector:()=>null
 };
 const factory=new Function('overviewView','render','books','btn','svg','money','esc','trendChart','recentTable','document','boot','notify','doAction',
  script+';return {overviewView,render};');
 const built=factory(
  ()=>'<p>fallback</p>',()=>{},state,
  (label,nav)=>'<button data-action="'+nav+'">'+label+'</button>',()=>'+',
  c=>(Number(c)/100).toLocaleString('en-US',{style:'currency',currency:'USD'}),
  s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  ()=>'<div class="bars">fallback chart</div>',()=>'<table><tbody><tr><td>journal</td></tr></tbody></table>',
  stub,{user:{id:1}},()=>{},()=>Promise.resolve()
 );
 return built.overviewView();
}
const common={month:'2026-11',cash:820000,ar:180000,ap:230000,unreviewed:3,overdue_invoices:2,overdue_bills:1,trend:[],recent:[{id:1}]};

test('New FIK dashboard uses existing accounting data and accessible navigation',()=>{
 const s=renderSnapshot({...common,pnl:{revenue:2300000,expenses:1590000,profit:710000}});
 assert.match(s,/Financial position/);
 assert.match(s,/Operating expenses/);
 assert.match(s,/\$23,000\.00/);
 assert.match(s,/\$15,900\.00/);
 assert.match(s,/\$7,100\.00/);
 assert.match(s,/30\.9%/);
 assert.match(s,/data-nav='banking'/);
 assert.match(s,/data-nav='reports'/);
 assert.match(s,/POSTED JOURNALS/);
 assert.match(s,/Manual bank imports/);
 assert.doesNotMatch(s,/NaN|undefined|Infinity/);
});
test('Loss and empty states never invent growth or live bank balance',()=>{
 const deficit=renderSnapshot({...common,pnl:{revenue:50000,expenses:70000,profit:-20000}});
 assert.match(deficit,/OPERATING DEFICIT/);
 assert.match(deficit,/OPERATING RESULT|OPERATING DEFICIT/);
 assert.match(deficit,/-\$200\.00/);
 const zero=renderSnapshot({...common,ar:0,ap:0,recent:[],pnl:{revenue:0,expenses:0,profit:0}});
 assert.match(zero,/No revenue posted for this period/);
 assert.match(zero,/No activity posted yet/);
 assert.match(zero,/No automatic bank or Snout payment synchronization/);
 assert.doesNotMatch(zero,/NaN|undefined|Infinity/);
});
test('Motion lifecycle and responsive behavior remain safe and source-driven',()=>{
 assert.match(motion,/prefers-reduced-motion/);
 assert.match(motion,/if\(section!=='overview'\|\|mq\.matches\|\|coarse\.matches/);
 assert.match(motion,/animationScope\.revert\(\)/);
 assert.match(motion,/scroll\.destroy\(\)/);
 assert.match(motion,/window\.echarts\.init/);
 assert.match(motion,/numeric\(p\[key\]\)\/100/);
 assert.match(css,/@media\(max-width:470px\)/);
 assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
test('App remains ledger-authoritative and preserves banking, login and team actions',()=>{
 const core=source('../public/app.js');
 assert.match(core,/function bankingView/);
 assert.match(core,/function reportsView/);
 assert.match(core,/function handleSubmit/);
 assert.match(core,/async function api/);
 assert.match(core,/private Netlify PostgreSQL database/);
 assert.match(html,/fik-books-v06\.css\?v=6/);
 assert.match(html,/fik-books-v06\.js\?v=6/);
 assert.doesNotMatch(script,/fetch\(|localStorage|sessionStorage|UPDATE bank_lines|POST .*\/api/);
});
