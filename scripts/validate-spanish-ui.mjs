import fs from 'node:fs';
const fail=(m)=>{console.error(`✗ ${m}`);process.exitCode=1};
const view=fs.readFileSync('src/features/tarot/TarotView.tsx','utf8');
const history=fs.readFileSync('src/features/tarot/HistoryView.tsx','utf8');
const library=fs.readFileSync('src/features/library/LibraryView.tsx','utf8');
const more=fs.readFileSync('src/features/more/MoreView.tsx','utf8');
const labels=fs.readFileSync('src/engine/presentationLabels.ts','utf8');
for(const marker of ['globalInterpretation','connectionSummary','conclusion','confidenceLabel','claimLabel','motifLabel','tensionLabel']){
  if(!view.includes(marker)&&!labels.includes(marker)) fail(`Falta capa española: ${marker}`);
}
const visibleSources=[view,history,library,more].join('\n');
if(view.includes("result.confidence.replace")||view.includes("m.replaceAll('_',' ')")||view.includes("t.replaceAll('_',' ')")) fail('La UI todavía expone códigos internos sin traducir');
for(const banned of ['>LOW<','>MEDIUM<','>HIGH<','HIGH_EMOTION','DESIRE_BLOCKED','COMMUNICATION_OPENING','OFFLINE FIRST','>Content ','>Engine ','offline-first']){
  if(visibleSources.includes(banned)) fail(`Texto visible no traducido: ${banned}`);
}
if(!process.exitCode) console.log('✓ Presentación de lectura preparada para español integral');
