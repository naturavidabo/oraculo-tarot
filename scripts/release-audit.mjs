import fs from 'node:fs';
const required=[
  'package.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json',
  '.github/workflows/deploy-pages.yml','src/main.tsx','src/db/schema.ts','src/db/backup.ts',
  'src/data/cards.content.json','src/data/card-images.json','src/data/cardImages.ts','src/components/TarotCardImage.tsx',
  'src/engine/presentationLabels.ts','src/engine/imageDiagnostics.ts','src/features/camera/CameraView.tsx',
  'scripts/validate-pages.mjs','scripts/validate-spanish-ui.mjs','scripts/smoke-selector.cjs','scripts/smoke-engine.cjs',
  'scripts/validate-image-manifest.mjs','docs/VALIDATION-0.9.0.md'
];
let failed=false;
for(const file of required){if(!fs.existsSync(file)){failed=true;console.error(`✗ Falta archivo esencial: ${file}`)}}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
if(pkg.version!=='0.9.0'){failed=true;console.error(`✗ package.json no es 0.9.0: ${pkg.version}`)}
const home=fs.readFileSync('src/features/home/HomeView.tsx','utf8');
if(!home.includes('0.9.0')){failed=true;console.error('✗ HomeView no muestra 0.9.0')}
const workflow=fs.readFileSync('.github/workflows/deploy-pages.yml','utf8');
for(const marker of ['node-version: 22','npm install --no-audit --no-fund','npm run validate:content','npm run validate:combinations','npm run validate:images','npm run validate:spanish-ui','npx vite build','actions/configure-pages@v5','actions/deploy-pages@v4']){
  if(!workflow.includes(marker)){failed=true;console.error(`✗ Workflow no contiene: ${marker}`)}
}
if(/cache:\s*npm|npm ci/.test(workflow)){failed=true;console.error('✗ Workflow conserva cache npm o npm ci de versiones antiguas')}
const images=fs.readFileSync('src/data/cardImages.ts','utf8');
for(const marker of ['raw.githubusercontent.com/seven102161/elaine-tarot-cards','Special:Redirect/file','cardImageCandidates','cardExternalCode']){
  if(!images.includes(marker)){failed=true;console.error(`✗ Enrutamiento visual no contiene: ${marker}`)}
}
const component=fs.readFileSync('src/components/TarotCardImage.tsx','utf8');
if(!component.includes('LOAD_TIMEOUT_MS')||!component.includes('resolveImage')){failed=true;console.error('✗ TarotCardImage no tiene fallback temporizado')}
const vite=fs.readFileSync('vite.config.ts','utf8');
for(const marker of ['rws-card-images-v2','raw\\.githubusercontent','wikimedia']){
  if(!vite.includes(marker)){failed=true;console.error(`✗ Caché runtime visual incompleto: ${marker}`)}
}
const more=fs.readFileSync('src/features/more/MoreView.tsx','utf8');
if(!more.includes('Comprobar las 78 imágenes')||!more.includes('runImageDiagnostic')){failed=true;console.error('✗ Falta diagnóstico visual 78/78 en la app')}
if(!failed) console.log('✓ Auditoría de release 0.9.0 superada');
if(failed) process.exit(1);
