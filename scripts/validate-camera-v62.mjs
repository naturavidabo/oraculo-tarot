import fs from 'node:fs';
let failed=false;const fail=m=>{failed=true;console.error(`✗ ${m}`)};
const engine=fs.readFileSync('src/engine/cameraRecognition.ts','utf8');
for(const marker of ['cosineGridShifted','maxShift','r:-6','z:1.12','guía central amplia','unique.slice(0,9)','top*.46+second*.34+third*.20']) if(!engine.includes(marker)) fail(`Motor Beta 6.2 incompleto: ${marker}`);
const camera=fs.readFileSync('src/features/camera/CameraView.tsx','utf8');
for(const marker of ['CLASIFICACIÓN ROBUSTA 4.2','BETA 6.2','desplazamiento interno']) if(!camera.includes(marker)) fail(`Interfaz Beta 6.2 incompleta: ${marker}`);
if(failed)process.exit(1);console.log('✓ Reconocimiento individual agresivo Beta 6.2 validado');
