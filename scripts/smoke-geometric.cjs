const fs=require('node:fs');const vm=require('node:vm');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js')}
let source=fs.readFileSync('src/engine/geometricRecognition.ts','utf8');
source=source.replace(/import \{ tarotCards \} from '\.\.\/data\/cards';/,"const tarotCards:any[]=[];")
  .replace(/import \{ cardImagePath \} from '\.\.\/data\/cardImages';/,"const cardImagePath=(id:string)=>id;");
source+='\nexport const __geoTest={ransacHomography,project,homographyOrientation};\n';
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const testModule={exports:{}};const sandbox={module:testModule,exports:testModule.exports,require,console,setTimeout,clearTimeout,URL,Map,Set,Float32Array,Float64Array,Uint32Array,Uint8ClampedArray,Int8Array,Math,Promise};
vm.runInNewContext(js,sandbox,{filename:'geometricRecognition.test.js'});
const {ransacHomography,project,homographyOrientation}=testModule.exports.__geoTest;
const ref={width:100,height:160,features:[]},query={width:260,height:420,features:[]};
const H=[.72,.05,.10,-.04,.75,.08,.03,.02,1];
function p(x,y){const d=H[6]*x+H[7]*y+1;return {x:(H[0]*x+H[1]*y+H[2])/d,y:(H[3]*x+H[4]*y+H[5])/d}}
const coords=[[.08,.08],[.5,.06],[.9,.1],[.12,.35],[.48,.32],[.86,.38],[.1,.68],[.52,.64],[.9,.7],[.1,.92],[.5,.9],[.88,.94]];
const matches=coords.map(([x,y],i)=>{const q=p(x,y);return {r:{x:x*ref.width,y:y*ref.height,angle:0,response:1,bits:new Uint32Array(8)},q:{x:q.x*query.width,y:q.y*query.height,angle:0,response:1,bits:new Uint32Array(8)},distance:20+i%3}});
// Outliers deliberately inconsistent.
for(let i=0;i<4;i++)matches.push({r:{x:(.2+i*.17)*ref.width,y:(.18+i*.11)*ref.height,angle:0,response:1,bits:new Uint32Array(8)},q:{x:(.85-i*.16)*query.width,y:(.12+i*.18)*query.height,angle:0,response:1,bits:new Uint32Array(8)},distance:40});
const result=ransacHomography(matches,query,ref,'smoke');
if(!result.h||result.inliers.length<10)throw new Error(`RANSAC insuficiente: ${result.inliers.length} inliers`);
let maxError=0;for(const [x,y] of [[0,0],[1,0],[1,1],[0,1],[.5,.5]]){const a=p(x,y),b=project(result.h,x,y);maxError=Math.max(maxError,Math.hypot(a.x-b.x,a.y-b.y))}
if(maxError>.015)throw new Error(`Homografía imprecisa: error ${maxError}`);
if(result.coverage<.45)throw new Error(`Cobertura geométrica insuficiente: ${result.coverage}`);
console.log(`✓ Smoke geométrico V7 · ${result.inliers.length} inliers · cobertura ${(result.coverage*100).toFixed(0)}% · error máximo ${maxError.toFixed(4)}`);

const upright=homographyOrientation([.72,.05,.10,-.04,.75,.08,.03,.02,1]);
const reversed=homographyOrientation([-.72,-.05,.82,.04,-.75,.92,-.03,-.02,1]);
if(!upright||upright.orientation!=='UPRIGHT')throw new Error('Orientación geométrica derecha no recuperada');
if(!reversed||reversed.orientation!=='REVERSED')throw new Error('Orientación geométrica invertida no recuperada');
console.log(`✓ Orientación por homografía · derecha ${upright.confidence.toFixed(2)} · invertida ${reversed.confidence.toFixed(2)}`);
