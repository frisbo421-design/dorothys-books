import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('FIK motion scripts load locally from pinned npm assets, no third party runtime scripts',()=>{
 const html=load('../public/index.html');
 for(const v of ['gsap.min.js','ScrollTrigger.min.js','lenis.min.js','echarts.min.js'])
   assert.ok(html.includes('/vendor/'+v));
 assert.ok(html.includes('/fik-books-motion.js?v=4'));
 assert.ok(html.includes('/fik-books.css?v=4'));
 assert.doesNotMatch(html,/<script src="https?:\/\//);
});
test('Visual refresh uses source data and never writes accounting transactions',()=>{
 const js=load('../public/fik-books-motion.js');
 assert.match(js,/books\.dashboard\.trend/);
 assert.match(js,/numeric\(p\[key\]\)\/100/);
 assert.match(js,/prefers-reduced-motion/);
 assert.match(js,/window\.gsap\.ticker\.add/);
 assert.match(js,/scroll\.destroy\(\)/);
 assert.match(js,/data-nav|dataset\.nav/);
 assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage|POST|/);
});
test('No breaking changes to multi-user company membership',()=>{
 const api=load('../netlify/functions/api.mjs');
 assert.match(api,/company_memberships/);
 assert.match(api,/WHERE c.owner_id=\$1 OR m.user_id=\$1/);
 assert.match(api,/\/auth\/invite\/accept/);
 assert.match(api,/\/team\/invite/);
});
test('Vendor preparation is a build step after tests and syntax checks',()=>{
 const pkg=JSON.parse(load('../package.json'));
 const netlify=load('../netlify.toml');
 for(const name of ['gsap','lenis','echarts'])assert.ok(pkg.dependencies[name]);
 assert.match(pkg.scripts['vendor:prepare'],/prepare-fik-vendor/);
 assert.match(netlify,/npm run check && npm test && npm run vendor:prepare/);
 const source=load('../scripts/prepare-fik-vendor.mjs');
 assert.match(source,/node_modules/);assert.match(source,/public/);
});
