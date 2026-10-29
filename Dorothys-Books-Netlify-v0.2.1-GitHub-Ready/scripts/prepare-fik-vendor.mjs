/* Copy pinned browser distributions from installed npm packages into the static Netlify publish folder.
 * Source licenses remain attached to their packages. No external CDN or arbitrary remote JS at runtime. */
import {copyFile,mkdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=process.cwd();
const dir=join(root,'public','vendor');
await mkdir(dir,{recursive:true});
const assets=[
 ['gsap','dist/gsap.min.js','gsap.min.js'],
 ['gsap','dist/ScrollTrigger.min.js','ScrollTrigger.min.js'],
 ['lenis','dist/lenis.min.js','lenis.min.js'],
 ['echarts','dist/echarts.min.js','echarts.min.js']
];
for(const [pkg,src,dest] of assets){
 const source=join(root,'node_modules',pkg,src);
 await copyFile(source,join(dir,dest));
 process.stdout.write('FIK motion vendor: '+pkg+' -> '+dest+'\n');
}
