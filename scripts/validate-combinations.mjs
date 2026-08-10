import fs from 'node:fs';
const cards=JSON.parse(fs.readFileSync(new URL('../src/data/cards.content.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../src/data/specialCombinations.ts',import.meta.url),'utf8');
const ids=new Set(cards.map(c=>c.id));
const refs=[...source.matchAll(/cardId:'([^']+)'/g)].map(m=>m[1]);
let failed=false;
for(const id of refs) if(!ids.has(id)){failed=true;console.error(`✗ Regla especial referencia carta inexistente: ${id}`)}
if(!failed) console.log(`✓ ${refs.length} referencias de combinaciones especiales apuntan a cartas válidas`);
if(failed) process.exit(1);
