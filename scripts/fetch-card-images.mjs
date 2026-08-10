import fs from 'node:fs/promises';
import path from 'node:path';

const manifest=JSON.parse(await fs.readFile('src/data/card-images.json','utf8'));
const outDir='public/cards';
await fs.mkdir(outDir,{recursive:true});
const WIDTH=360;
const UA='ORACULO-TAROT/0.8.0 (GitHub Pages build; source: Wikimedia Commons)';

async function fetchOne(row){
  const dest=path.join(outDir,row.assetFile);
  try{
    const stat=await fs.stat(dest);
    if(stat.size>5000) return {cardId:row.cardId,size:stat.size,skipped:true};
  }catch{}
  const url=new URL('https://commons.wikimedia.org/w/index.php');
  url.searchParams.set('title',`Special:Redirect/file/${row.sourceFile}`);
  url.searchParams.set('width',String(WIDTH));
  let last;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const res=await fetch(url,{redirect:'follow',headers:{'User-Agent':UA,'Accept':'image/png,image/*;q=0.9,*/*;q=0.8'}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const type=res.headers.get('content-type')||'';
      if(!type.startsWith('image/')) throw new Error(`content-type ${type||'desconocido'}`);
      const buf=Buffer.from(await res.arrayBuffer());
      if(buf.length<5000) throw new Error(`archivo demasiado pequeño (${buf.length})`);
      await fs.writeFile(dest,buf);
      return {cardId:row.cardId,size:buf.length,skipped:false};
    }catch(err){last=err;if(attempt<3) await new Promise(r=>setTimeout(r,600*attempt));}
  }
  throw new Error(`${row.cardId}: ${last?.message||last}`);
}

const queue=[...manifest];
const results=[];
async function worker(){while(queue.length){const row=queue.shift();results.push(await fetchOne(row));}}
await Promise.all(Array.from({length:4},worker));
const total=results.reduce((s,r)=>s+r.size,0);
console.log(`✓ ${results.length} imágenes Rider–Waite listas · ${(total/1024/1024).toFixed(1)} MiB`);
