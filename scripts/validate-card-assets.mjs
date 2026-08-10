import fs from 'node:fs';
import path from 'node:path';
const images=JSON.parse(fs.readFileSync('src/data/card-images.json','utf8'));
let failed=false;let total=0;
if(images.length!==78){console.error(`✗ manifest visual tiene ${images.length}, se esperaban 78`);failed=true;}
function isJpeg(p){const b=fs.readFileSync(p);return b.length>10000&&b[0]===0xff&&b[1]===0xd8&&b[b.length-2]===0xff&&b[b.length-1]===0xd9;}
for(const row of images){
  const p=path.join('public/cards',row.assetFile);
  if(!fs.existsSync(p)){console.error(`✗ falta ${p}`);failed=true;continue;}
  const size=fs.statSync(p).size;total+=size;
  if(!isJpeg(p)){console.error(`✗ ${p} no es un JPEG válido (${size} bytes)`);failed=true;}
}
if(!failed) console.log(`✓ 78/78 imágenes físicas locales válidas · ${(total/1024/1024).toFixed(1)} MiB`);
if(failed) process.exit(1);
