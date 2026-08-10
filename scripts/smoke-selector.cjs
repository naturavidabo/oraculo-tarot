const fs=require('fs');const path=require('path');const os=require('os');const ts=require('typescript');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'oraculo-selector-'));fs.mkdirSync(path.join(out,'data'));fs.mkdirSync(path.join(out,'engine'));
for(const [src,dst] of [['src/data/spreads.ts','data/spreads.js'],['src/engine/questionClassifier.ts','engine/questionClassifier.js']]){
  const js=ts.transpileModule(fs.readFileSync(src,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  fs.writeFileSync(path.join(out,dst),js);
}
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
