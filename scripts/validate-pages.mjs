import fs from 'node:fs';
const workflow='.github/workflows/deploy-pages.yml';
const fail=(m)=>{console.error(`✗ ${m}`);process.exit(1)};
if(!fs.existsSync(workflow)) fail('Falta .github/workflows/deploy-pages.yml');
const text=fs.readFileSync(workflow,'utf8');
for(const marker of ['actions/checkout@v4','actions/setup-node@v4','npm run validate:content','npm run validate:combinations','npx vite build','actions/configure-pages@v5','actions/upload-pages-artifact@v3','actions/deploy-pages@v4']){
  if(!text.includes(marker)) fail(`Workflow incompleto: falta ${marker}`);
}
console.log('✓ Workflow GitHub Pages presente y estructuralmente válido');
