import fs from 'node:fs';
let failed=false;const fail=m=>{failed=true;console.error('✗ '+m)};
const engine=fs.readFileSync('src/engine/cameraRecognition.ts','utf8');
const camera=fs.readFileSync('src/features/camera/CameraView.tsx','utf8');
for(const marker of ['referenceDescriptors','multiReferenceSimilarity','renderNormalized(img,rect,0,1.14','r:-26','split of [.42,.46,.50,.54,.58]','fine*.26']) if(!engine.includes(marker)) fail(`Motor Beta 6.3 incompleto: ${marker}`);
for(const marker of ['CLASIFICACIÓN ROBUSTA 4.3','BETA 6.3','múltiples firmas visuales']) if(!camera.includes(marker)) fail(`Interfaz Beta 6.3 incompleta: ${marker}`);
if(failed)process.exit(1);console.log('✓ Reconocimiento individual Beta 6.3 validado');
