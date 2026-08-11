import fs from 'node:fs/promises';
import path from 'node:path';

const manifest=JSON.parse(await fs.readFile('src/data/card-images.json','utf8'));
const outDir='public/cards';
const RAW_BASE='https://raw.githubusercontent.com/seven102161/elaine-tarot-cards/main/cards';
const UA='ORACULO-TAROT/1.0-BETA GitHub-Pages-build';
await fs.mkdir(outDir,{recursive:true});

function externalCode(cardId){
  const major=cardId.match(/^RWS_M_(\d{2})$/);
  if(major) return `ar${major[1]}`;
  const minor=cardId.match(/^RWS_([WCSP])_(\d{2})$/);
  if(!minor) throw new Error(`ID no reconocido: ${cardId}`);
  const suit={W:'wa',C:'cu',S:'sw',P:'pe'}[minor[1]];
  const rank=Number(minor[2]);
  const suffix=rank===1?'ac':rank>=2&&rank<=10?String(rank).padStart(2,'0'):rank===11?'pa':rank===12?'kn':rank===13?'qu':rank===14?'ki':'';
  if(!suffix) throw new Error(`Rango no reconocido: ${cardId}`);
  return `${suit}${suffix}`;
}

function isJpeg(buf){return buf.length>10000 && buf[0]===0xff && buf[1]===0xd8 && buf[buf.length-2]===0xff && buf[buf.length-1]===0xd9;}
async function validExisting(dest){
  try{const b=await fs.readFile(dest);return isJpeg(b);}catch{return false;}
}
async function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function fetchOne(row){
  const dest=path.join(outDir,row.assetFile);
  if(await validExisting(dest)) return {cardId:row.cardId,size:(await fs.stat(dest)).size,skipped:true};
  const code=externalCode(row.cardId);
  const url=`${RAW_BASE}/${code}.jpg`;
  let last;
  for(let attempt=1;attempt<=4;attempt++){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),15000);
      const res=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':UA,'Accept':'image/jpeg,image/*;q=0.9,*/*;q=0.8'}});
      clearTimeout(timer);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf=Buffer.from(await res.arrayBuffer());
      if(!isJpeg(buf)) throw new Error(`respuesta JPEG inválida (${buf.length} bytes)`);
      await fs.writeFile(dest,buf);
      return {cardId:row.cardId,size:buf.length,skipped:false,url};
    }catch(err){last=err;if(attempt<4) await sleep(700*attempt);}
  }
  throw new Error(`${row.cardId} (${code}): ${last?.message||last}`);
}

const queue=[...manifest];
const results=[];
const failures=[];
async function worker(){
  while(queue.length){
    const row=queue.shift();
    try{results.push(await fetchOne(row));}
    catch(err){failures.push(String(err?.message||err));}
  }
}
await Promise.all(Array.from({length:6},()=>worker()));
if(failures.length){
  console.error(`✗ No se pudieron preparar ${failures.length}/78 cartas:`);
  failures.forEach(x=>console.error(`  - ${x}`));
  process.exit(1);
}
const total=results.reduce((s,r)=>s+r.size,0);
console.log(`✓ 78/78 imágenes Rider–Waite descargadas localmente · ${(total/1024/1024).toFixed(1)} MiB`);
