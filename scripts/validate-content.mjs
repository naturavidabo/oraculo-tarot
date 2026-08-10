import fs from 'node:fs';
const path = new URL('../src/data/cards.content.json', import.meta.url);
const cards = JSON.parse(fs.readFileSync(path, 'utf8'));
const fail = (message) => { console.error(`✗ ${message}`); process.exitCode = 1; };
const ids = new Set();
if (cards.length !== 78) fail(`Se esperaban 78 cartas; hay ${cards.length}`);
for (const card of cards) {
  if (ids.has(card.id)) fail(`ID duplicado: ${card.id}`);
  ids.add(card.id);
  for (const field of ['name','essence','quick','mechanism','teacherNote','contentVersion']) if (typeof card[field] !== 'string' || !card[field].trim()) fail(`${card.id}: falta o es inválido ${field}`);
  if (!Array.isArray(card.keywords) || !card.keywords.length) fail(`${card.id}: keywords inválidas`);
  if (!Array.isArray(card.tags) || !card.tags.length) fail(`${card.id}: tags inválidas`);
  if (!Array.isArray(card.light) || !card.light.length) fail(`${card.id}: luz vacía`);
  if (!Array.isArray(card.shadow) || !card.shadow.length) fail(`${card.id}: sombra vacía`);
  if (!card.vectors || Object.keys(card.vectors).length < 5) fail(`${card.id}: pocos vectores`);
  for (const [dimension,value] of Object.entries(card.vectors ?? {})) {
    if (typeof value !== 'number' || value < -5 || value > 5) fail(`${card.id}: vector ${dimension} fuera de rango (${value})`);
  }
}
const majors = cards.filter(c=>c.arcana==='major').length;
const minors = cards.filter(c=>c.arcana==='minor').length;
const suits = Object.fromEntries(['wands','cups','swords','pentacles'].map(s=>[s,cards.filter(c=>c.suit===s).length]));
if (majors !== 22) fail(`Mayores: ${majors}`);
if (minors !== 56) fail(`Menores: ${minors}`);
for (const [suit,count] of Object.entries(suits)) if (count !== 14) fail(`${suit}: ${count}`);
if (!process.exitCode) {
  console.log('✓ Content Pack Tarot 1.0 válido');
  console.log(`  78 cartas · ${majors} mayores · ${minors} menores`);
  console.log(`  Bastos ${suits.wands} · Copas ${suits.cups} · Espadas ${suits.swords} · Oros ${suits.pentacles}`);
}
