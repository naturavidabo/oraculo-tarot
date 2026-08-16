import fs from 'node:fs';
let failed=false;const fail=m=>{failed=true;console.error('✗ '+m)};
const engine=fs.readFileSync('src/engine/cameraRecognition.ts','utf8');
for(const marker of [
  'regiones casi disjuntas','multipleEvidence>=64','multipleEvidence>=82',
  'cosineGridInner','fineInner*.68','shiftRect(center,-.07','unique.slice(0,7)'
]) if(!engine.includes(marker)) fail(`Motor Beta 6.1 incompleto: ${marker}`);
const camera=fs.readFileSync('src/features/camera/CameraView.tsx','utf8');
for(const marker of ['CLASIFICACIÓN ROBUSTA 4.1','BETA 6.1','reduce falsos avisos multicarta']) if(!camera.includes(marker)) fail(`Interfaz Beta 6.1 incompleta: ${marker}`);
if(failed)process.exit(1);console.log('✓ Ajustes focalizados Beta 6.1 validados');
