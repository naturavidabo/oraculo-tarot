import fs from 'node:fs';
let failed=false;const fail=m=>{failed=true;console.error(`✗ ${m}`)};
const geo=fs.readFileSync('src/engine/geometricRecognition.ts','utf8');
const engine=fs.readFileSync('src/engine/cameraRecognition.ts','utf8');
const camera=fs.readFileSync('src/features/camera/CameraView.tsx','utf8');
for(const marker of ['adaptiveThreshold','MAX_QUERY_FEATURES=620','homographyOrientation','multiCandidates','distance>.105&&iou<.52','RANSAC_ITERATIONS=220']) if(!geo.includes(marker)) fail(`Geometría 7.0.1 incompleta: ${marker}`);
for(const marker of ['quickVisualRanking','HYBRID_V7_0_1','homographyOrientationConfidence','hybridConfidence','quickVisualImages','geometryWeight=.64']) if(!engine.includes(marker)) fail(`Motor híbrido 7.0.1 incompleto: ${marker}`);
for(const marker of ['MOTOR HÍBRIDO · V7.0.1','Motor híbrido V7.0.1','testActualId?(recognition?.candidates??[])']) if(!camera.includes(marker)) fail(`Interfaz 7.0.1 incompleta: ${marker}`);
if(failed)process.exit(1);console.log('✓ Motor híbrido individual V7.0.1 validado estructuralmente');
