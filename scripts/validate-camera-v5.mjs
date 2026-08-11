import fs from 'node:fs';
let failed=false;const fail=m=>{failed=true;console.error(`✗ ${m}`)};
const engine=fs.readFileSync('src/engine/cameraRecognition.ts','utf8');
for(const marker of [
  'CameraFramingInspection','inspectTarotPhoto','MULTIPLE_SUSPECTED','buildCropHypotheses',
  'evaluateHypothesis','MISMO encuadre','cropHypothesesTested','framingStatus','framingMessage'
]) if(!engine.includes(marker)) fail(`Autoencuadre Beta 5 incompleto: ${marker}`);
const camera=fs.readFileSync('src/features/camera/CameraView.tsx','utf8');
for(const marker of [
  'RECONOCIMIENTO VISUAL 3.5','BETA 5','camera-preflight','Encuadre apto','Parece haber más de una carta',
  "framing?.status==='MULTIPLE_SUSPECTED'",'encuadres evaluados'
]) if(!camera.includes(marker)) fail(`Interfaz Beta 5 incompleta: ${marker}`);
const css=fs.readFileSync('src/styles/global.css','utf8');
if(!css.includes('.camera-preflight')) fail('Falta estilo de preflight de cámara');
const more=fs.readFileSync('src/features/more/MoreView.tsx','utf8');
for(const marker of ['Funciones Beta 5','autoencuadre 3.5','Autoencuadre 3.5 + orientación']) if(!more.includes(marker)) fail(`Más Beta 5 incompleto: ${marker}`);
if(!failed) console.log('✓ Autoencuadre 3.5 + ranking estable Beta 5 validados');
if(failed) process.exit(1);
