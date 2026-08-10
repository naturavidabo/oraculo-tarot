import fs from 'node:fs';
import path from 'node:path';
const images=JSON.parse(fs.readFileSync('src/data/card-images.json','utf8'));
let failed=false;let total=0;
for(const row of images){const p=path.join('public/cards',row.assetFile);if(!fs.existsSync(p)){console.error(`✗ falta ${p}`);failed=true;continue;}const size=fs.statSync(p).size;total+=size;if(size<5000){console.error(`✗ ${p} parece inválido (${size} bytes)`);failed=true;}}
if(!failed) console.log(`✓ 78/78 imágenes físicas listas · ${(total/1024/1024).toFixed(1)} MiB`);
if(failed) process.exit(1);
