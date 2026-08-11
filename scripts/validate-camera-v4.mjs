import fs from 'node:fs';
let failed=false;const fail=m=>{failed=true;console.error(`✗ ${m}`)};
const engine=fs.readFileSync('src/engine/cameraRecognition.ts','utf8');
for(const marker of [
  'CameraOrientationConfidence',
  'rotateImageData180',
  'referenceDescriptor',
  'queries.original',
  'queries.rotated',
  'orientationConfidenceFor',
  'orientationMargin',
  'framingWarning',
  "orientationCorrect:actualOrientation&&actual?actual.orientation===actualOrientation:undefined"
]) if(!engine.includes(marker)) fail(`Orientación 3.0 incompleta: ${marker}`);
if(engine.includes('reverseDescriptor(')) fail('La Beta 4 conserva el viejo descriptor invertido acoplado a la identidad');
if(engine.includes('referenceDescriptors(')) fail('La Beta 4 todavía usa referencias derecha/invertida acopladas');
const camera=fs.readFileSync('src/features/camera/CameraView.tsx','utf8');
for(const marker of [
  'RECONOCIMIENTO VISUAL 3.0',
  'BETA 4',
  'orientationConfidenceLabel',
  'testActualOrientation',
  'camera-framing-warning',
  'setPointerCapture',
  'onContextMenu',
  'Confirmar candidato seleccionado'
]) if(!camera.includes(marker)) fail(`Interfaz Beta 4 incompleta: ${marker}`);
const css=fs.readFileSync('src/styles/global.css','utf8');
for(const marker of [
  '-webkit-touch-callout:none!important',
  'camera-corner-editor>img{pointer-events:none!important}',
  'camera-orientation-note',
  'camera-framing-warning'
]) if(!css.includes(marker)) fail(`Protección táctil Beta 4 incompleta: ${marker}`);
const more=fs.readFileSync('src/features/more/MoreView.tsx','utf8');
for(const marker of [
  'Diagnóstico de cámara',
  'pruebas con orientación',
  'orientación correcta',
  'Funciones Beta 4',
  'orientación 3.0'
]) if(!more.includes(marker)) fail(`Diagnóstico Beta 4 incompleto: ${marker}`);
if(!failed) console.log('✓ Orientación 3.0 + protección táctil Beta 4 validadas');
if(failed) process.exit(1);
