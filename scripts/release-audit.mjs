import fs from 'node:fs';
const required=[
  'package.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json',
  '.github/workflows/deploy-pages.yml','src/main.tsx','src/db/schema.ts','src/db/backup.ts',
  'src/data/cards.content.json','src/data/card-images.json','src/data/cardImages.ts','src/components/TarotCardImage.tsx',
  'scripts/validate-pages.mjs','scripts/smoke-selector.cjs','scripts/smoke-engine.cjs','scripts/fetch-card-images.mjs',
  'scripts/validate-image-manifest.mjs','scripts/validate-card-assets.mjs'
];
let failed=false;
for(const file of required){if(!fs.existsSync(file)){failed=true;console.error(`✗ Falta archivo esencial: ${file}`)}}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
if(pkg.version!=='0.7.0'){failed=true;console.error(`✗ package.json no es 0.7.0: ${pkg.version}`)}
const home=fs.readFileSync('src/features/home/HomeView.tsx','utf8');
if(!home.includes('0.7.0')){failed=true;console.error('✗ HomeView no muestra 0.7.0')}
const workflow=fs.readFileSync('.github/workflows/deploy-pages.yml','utf8');
for(const marker of ['node-version: 22','npm install --no-audit --no-fund','npm run validate:content','npm run validate:combinations','npm run validate:images','npm run fetch:cards','npm run validate:card-assets','npx vite build','actions/configure-pages@v5','actions/deploy-pages@v4']){
  if(!workflow.includes(marker)){failed=true;console.error(`✗ Workflow no contiene: ${marker}`)}
}
if(/cache:\s*npm|npm ci/.test(workflow)){failed=true;console.error('✗ Workflow conserva cache npm o npm ci de versiones antiguas')}
const vite=fs.readFileSync('vite.config.ts','utf8');
if(!vite.includes('globIgnores')||!vite.includes('oraculo-tarot-cover.png')){failed=true;console.error('✗ Vite PWA no excluye el PNG legado pesado del precache')}
if(!failed) console.log('✓ Auditoría de release 0.7.0 superada');
if(failed) process.exit(1);
