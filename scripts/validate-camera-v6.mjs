import fs from 'node:fs';
let failed=false;const fail=m=>{failed=true;console.error(`✗ ${m}`)};
const engine=fs.readFileSync('src/engine/cameraRecognition.ts','utf8');
for(const marker of [
  'FINE_W=32','FINE_H=54','CHROMA_X=8','CHROMA_Y=12','fineGray','chroma',
  'quickRegionCardLikelihood','multipleCardEvidence','MULTIPLE_CARDS_SUSPECTED',
  'confidenceScoreFor','recognitionStability','robust=(scores:number[])=>'
]) if(!engine.includes(marker)) fail(`Clasificación robusta Beta 6 incompleta: ${marker}`);
const camera=fs.readFileSync('src/features/camera/CameraView.tsx','utf8');
for(const marker of [
  'CLASIFICACIÓN ROBUSTA 4.0','BETA 6','confianza {recognition.confidenceScore}/99',
  'estabilidad {recognition.recognitionStability}/100','evidencia multicarta',
  'Se detectó más de una zona con forma de carta'
]) if(!camera.includes(marker)) fail(`Interfaz Beta 6 incompleta: ${marker}`);
const more=fs.readFileSync('src/features/more/MoreView.tsx','utf8');
for(const marker of ['Funciones Beta 6','clasificación robusta 4.0','Clasificación robusta 4.0']) if(!more.includes(marker)) fail(`Más Beta 6 incompleto: ${marker}`);
if(!failed)console.log('✓ Clasificación robusta 4.0 Beta 6 validada');
if(failed)process.exit(1);
