import fs from 'node:fs';
const workflow='.github/workflows/deploy-pages.yml';
const fail=(m)=>{console.error(`✗ ${m}`);process.exit(1)};
if(!fs.existsSync(workflow)) fail('Falta .github/workflows/deploy-pages.yml');
const text=fs.readFileSync(workflow,'utf8');
for(const marker of ['actions/checkout@v4','actions/setup-node@v4','npm run validate:content','npm run validate:combinations','npm run validate:images','npm run fetch:cards','npm run validate:card-assets','npx vite build','actions/configure-pages@v5','actions/upload-pages-artifact@v3','actions/deploy-pages@v4']){
  if(!text.includes(marker)) fail(`Workflow incompleto: falta ${marker}`);
}
console.log('✓ Workflow GitHub Pages 0.7 presente y estructuralmente válido');
