const fs=require('fs');const path=require('path');const os=require('os');const {spawnSync}=require('node:child_process');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'oraculo-selector-'));
const npx=process.platform==='win32'?'npx.cmd':'npx';
const compile=spawnSync(npx,['--no-install','tsc','src/data/spreads.ts','src/engine/questionClassifier.ts','--outDir',out,'--module','commonjs','--target','es2022','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--pretty','false'],{stdio:'inherit'});
if(compile.error||compile.status!==0){fs.rmSync(out,{recursive:true,force:true});process.exit(compile.status??1);}
const {recommendSpreads}=require(path.join(out,'engine/questionClassifier.js'));
const cases=[
  ['¿Qué siente por mí y qué intención tiene?','SPREAD_RELATION_07'],
  ['¿Me escribirá esta semana?','SPREAD_COMM_06'],
  ['¿Cómo evolucionará esta relación?','SPREAD_EVOLUTION_07'],
  ['¿Qué no estoy viendo?','SPREAD_HIDDEN_06'],
];
let failed=false;
for(const [question,expected] of cases){const got=recommendSpreads(question,1)[0]?.spread.id;if(got!==expected){failed=true;console.error(`✗ ${question} => ${got}; esperado ${expected}`)}else console.log(`✓ ${question} => ${got}`)}
fs.rmSync(out,{recursive:true,force:true});if(failed)process.exit(1);
