import fs from 'node:fs';
const required=[
  'package.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json',
  '.github/workflows/deploy-pages.yml','src/main.tsx','src/db/schema.ts','src/db/backup.ts','src/db/readings.ts',
  'src/data/cards.content.json','src/data/card-images.json','src/data/cardImages.ts','src/data/spreads.ts','src/components/TarotCardImage.tsx',
  'src/engine/presentationLabels.ts','src/engine/imageDiagnostics.ts','src/engine/selfTest.ts','src/engine/cameraRecognition.ts',
  'src/features/camera/CameraView.tsx','src/features/tarot/TarotView.tsx',
  'scripts/fetch-card-images.mjs','scripts/validate-card-assets.mjs','scripts/validate-pages.mjs','scripts/validate-spanish-ui.mjs',
  'scripts/validate-beta-features.mjs','scripts/validate-camera-v2.mjs','scripts/smoke-selector.cjs','scripts/smoke-engine.cjs','scripts/validate-image-manifest.mjs','docs/VALIDATION-1.0-BETA2.md'
];
let failed=false;
for(const file of required){if(!fs.existsSync(file)){failed=true;console.error(`✗ Falta archivo esencial: ${file}`)}}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
if(pkg.version!=='1.0.0-beta.2'){failed=true;console.error(`✗ package.json no es 1.0.0-beta.2: ${pkg.version}`)}
for(const marker of ['fetch-card-images.mjs','validate-card-assets.mjs']){if(!pkg.scripts.postinstall?.includes(marker)){failed=true;console.error(`✗ postinstall no contiene ${marker}`)}}
const home=fs.readFileSync('src/features/home/HomeView.tsx','utf8');if(!home.includes('1.0 Beta')){failed=true;console.error('✗ HomeView no muestra 1.0 Beta')}
const images=fs.readFileSync('src/data/cardImages.ts','utf8');if(!images.includes('cardImagePath(cardId),cardImageRemotePath')){failed=true;console.error('✗ La ruta local no es la primera fuente visual')}
const diagnostic=fs.readFileSync('src/engine/imageDiagnostics.ts','utf8');if(diagnostic.includes('cardImageCandidates')){failed=true;console.error('✗ Diagnóstico visual todavía acepta fuentes externas')}
const selftest=fs.readFileSync('src/engine/selfTest.ts','utf8');if(/cardImage|imagen de respaldo/.test(selftest)){failed=true;console.error('✗ Diagnóstico del motor todavía mezcla imágenes')}
const workflow=fs.readFileSync('.github/workflows/deploy-pages.yml','utf8');
for(const marker of ['node-version: 22','npm install --no-audit --no-fund','npm run fetch:cards','npm run validate:card-assets','npx vite build','actions/deploy-pages@v4']){if(!workflow.includes(marker)){failed=true;console.error(`✗ Workflow no contiene ${marker}`)}}
const vite=fs.readFileSync('vite.config.ts','utf8');if(!vite.includes('jpg,jpeg')){failed=true;console.error('✗ Workbox no precachea JPG locales')}
if(!failed) console.log('✓ Auditoría de release ORÁCULO TAROT 1.0 Beta superada');
if(failed)process.exit(1);
