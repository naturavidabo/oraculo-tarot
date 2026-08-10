import fs from 'node:fs';
const cards=JSON.parse(fs.readFileSync('src/data/cards.content.json','utf8'));
const images=JSON.parse(fs.readFileSync('src/data/card-images.json','utf8'));
let failed=false;const fail=m=>{failed=true;console.error(`✗ ${m}`)};
if(images.length!==78) fail(`manifest de imágenes tiene ${images.length}, esperado 78`);
const ids=new Set(images.map(x=>x.cardId));
const files=new Set(images.map(x=>x.assetFile));
if(ids.size!==78) fail('IDs de imágenes duplicados');
if(files.size!==78) fail('assetFile duplicados');
for(const card of cards){if(!ids.has(card.id)) fail(`falta imagen para ${card.id}`)}
for(const row of images){if(!row.sourceFile.endsWith('(Rider-Waite Smith tarot deck).png')) fail(`fuente inesperada ${row.sourceFile}`)}
const known=new Map(images.map(x=>[x.cardId,x.sourceFile]));
if(known.get('RWS_P_07')!=='Seven of Pentacles (Rider-Waite Smith tarot deck).png') fail('7 de Oros mal mapeado');
if(known.get('RWS_S_01')!=='One of Swords (Rider-Waite Smith tarot deck).png') fail('As de Espadas mal mapeado');
if(known.get('RWS_S_10')!=='Ten of Swords (Rider-Waite Smith tarot deck).png') fail('10 de Espadas mal mapeado');
if(!failed) console.log('✓ Manifest visual 78/78 válido');
if(failed) process.exit(1);
