import { tarotCards } from '../data/cards';
import { cardImagePath } from '../data/cardImages';

export type GeometricPoint={x:number;y:number};
export type GeometricPolygon=[GeometricPoint,GeometricPoint,GeometricPoint,GeometricPoint];
export type GeometricCardMatch={
  cardId:string;
  cardName:string;
  score:number;
  goodMatches:number;
  inliers:number;
  inlierRatio:number;
  coverage:number;
  reprojectionError:number;
  homography:number[]|null;
  polygon:GeometricPolygon|null;
  center:GeometricPoint|null;
};
export type GeometricRecognitionResult={
  matches:GeometricCardMatch[];
  queryFeatureCount:number;
  strongMatches:number;
  multipleSuspected:boolean;
  multipleEvidence:number;
};

type Feature={x:number;y:number;angle:number;response:number;bits:Uint32Array};
type FeatureSet={width:number;height:number;features:Feature[]};
type TentativeMatch={q:Feature;r:Feature;distance:number};

type GrayImage={width:number;height:number;gray:Float32Array};

const QUERY_MAX_SIDE=680;
const REFERENCE_MAX_SIDE=480;
const MAX_QUERY_FEATURES=620;
const MAX_REFERENCE_FEATURES=390;
const BRIEF_BITS=256;
const BRIEF_WORDS=BRIEF_BITS/32;
const PATCH_RADIUS=15;
const RANSAC_ITERATIONS=220;
const RANSAC_THRESHOLD=.040;
const referenceFeatureCache=new Map<string,Promise<FeatureSet>>();

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}
function nextFrame(){return new Promise<void>(resolve=>setTimeout(resolve,0));}

function loadImage(src:string|Blob){
  return new Promise<HTMLImageElement>((resolve,reject)=>{
    const img=new Image();
    const objectUrl=src instanceof Blob?URL.createObjectURL(src):'';
    img.onload=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);resolve(img)};
    img.onerror=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);reject(new Error('IMAGE_LOAD_FAILED'))};
    img.src=typeof src==='string'?src:objectUrl;
  });
}

function imageToGray(img:HTMLImageElement,maxSide:number):GrayImage{
  const scale=Math.min(1,maxSide/Math.max(img.width,img.height));
  const width=Math.max(80,Math.round(img.width*scale));
  const height=Math.max(80,Math.round(img.height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('CANVAS_UNAVAILABLE');
  ctx.drawImage(img,0,0,width,height);
  const data=ctx.getImageData(0,0,width,height).data;
  const gray=new Float32Array(width*height);
  for(let i=0,p=0;i<data.length;i+=4,p++)gray[p]=data[i]*.299+data[i+1]*.587+data[i+2]*.114;
  return {width,height,gray};
}

function resizeGray(src:GrayImage,scale:number):GrayImage{
  if(scale===1)return src;
  const width=Math.max(48,Math.round(src.width*scale)),height=Math.max(48,Math.round(src.height*scale));
  const gray=new Float32Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sx=(x+.5)/scale-.5,sy=(y+.5)/scale-.5;
    const x0=clamp(Math.floor(sx),0,src.width-1),y0=clamp(Math.floor(sy),0,src.height-1);
    const x1=Math.min(src.width-1,x0+1),y1=Math.min(src.height-1,y0+1);
    const tx=clamp(sx-x0,0,1),ty=clamp(sy-y0,0,1);
    const a=src.gray[y0*src.width+x0]*(1-tx)+src.gray[y0*src.width+x1]*tx;
    const b=src.gray[y1*src.width+x0]*(1-tx)+src.gray[y1*src.width+x1]*tx;
    gray[y*width+x]=a*(1-ty)+b*ty;
  }
  return {width,height,gray};
}

function integral(values:Float32Array,w:number,h:number){
  const out=new Float64Array((w+1)*(h+1));
  for(let y=0;y<h;y++){
    let row=0;for(let x=0;x<w;x++){row+=values[y*w+x];out[(y+1)*(w+1)+x+1]=out[y*(w+1)+x+1]+row}
  }
  return out;
}
function boxSum(ii:Float64Array,w:number,x0:number,y0:number,x1:number,y1:number){
  const stride=w+1;
  return ii[y1*stride+x1]-ii[y0*stride+x1]-ii[y1*stride+x0]+ii[y0*stride+x0];
}

function deterministicBriefPairs(){
  const pairs:number[]=[];let seed=0x6d2b79f5;
  const rand=()=>{seed=(Math.imul(seed^seed>>>15,1|seed)+0x6d2b79f5)|0;let t=seed;t=Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296};
  const point=()=>{
    for(let tries=0;tries<20;tries++){
      const x=Math.round((rand()*2-1)*PATCH_RADIUS),y=Math.round((rand()*2-1)*PATCH_RADIUS);
      if(x*x+y*y<=PATCH_RADIUS*PATCH_RADIUS)return [x,y] as const;
    }
    return [0,0] as const;
  };
  for(let i=0;i<BRIEF_BITS;i++){const a=point(),b=point();pairs.push(a[0],a[1],b[0],b[1])}
  return new Int8Array(pairs);
}
const BRIEF_PAIRS=deterministicBriefPairs();

function sampleGray(gray:Float32Array,w:number,h:number,x:number,y:number){
  const xx=clamp(Math.round(x),0,w-1),yy=clamp(Math.round(y),0,h-1);return gray[yy*w+xx];
}

function intensityOrientation(gray:Float32Array,w:number,h:number,x:number,y:number){
  let m10=0,m01=0;
  const radius=9;
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
    if(dx*dx+dy*dy>radius*radius)continue;
    const v=sampleGray(gray,w,h,x+dx,y+dy);m10+=dx*v;m01+=dy*v;
  }
  return Math.atan2(m01,m10);
}

function briefDescriptor(gray:Float32Array,w:number,h:number,x:number,y:number,angle:number){
  const bits=new Uint32Array(BRIEF_WORDS);const c=Math.cos(angle),s=Math.sin(angle);
  for(let i=0;i<BRIEF_BITS;i++){
    const j=i*4,ax=BRIEF_PAIRS[j],ay=BRIEF_PAIRS[j+1],bx=BRIEF_PAIRS[j+2],by=BRIEF_PAIRS[j+3];
    const arx=ax*c-ay*s,ary=ax*s+ay*c,brx=bx*c-by*s,bry=bx*s+by*c;
    if(sampleGray(gray,w,h,x+arx,y+ary)<sampleGray(gray,w,h,x+brx,y+bry))bits[i>>>5]|=(1<<(i&31))>>>0;
  }
  return bits;
}

function detectFeaturesAtScale(img:GrayImage,scaleToBase:number,maxFeatures:number){
  const {width:w,height:h,gray}=img;
  const gx=new Float32Array(w*h),gy=new Float32Array(w*h),xx=new Float32Array(w*h),yy=new Float32Array(w*h),xy=new Float32Array(w*h);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const p=y*w+x;
    const sx=(gray[p-w+1]+2*gray[p+1]+gray[p+w+1])-(gray[p-w-1]+2*gray[p-1]+gray[p+w-1]);
    const sy=(gray[p+w-1]+2*gray[p+w]+gray[p+w+1])-(gray[p-w-1]+2*gray[p-w]+gray[p-w+1]);
    gx[p]=sx;gy[p]=sy;xx[p]=sx*sx;yy[p]=sy*sy;xy[p]=sx*sy;
  }
  const ixx=integral(xx,w,h),iyy=integral(yy,w,h),ixy=integral(xy,w,h);
  // V7.0.1: umbral Harris adaptativo. Las cartas con áreas limpias (Ases) o
  // fotografiadas más pequeñas ya no quedan sin puntos solo por usar un umbral fijo.
  const rawCandidates:{x:number;y:number;response:number}[]=[];
  let maxResponse=0;
  const window=3,border=PATCH_RADIUS+3;
  for(let y=border;y<h-border;y+=2)for(let x=border;x<w-border;x+=2){
    const x0=x-window,y0=y-window,x1=x+window+1,y1=y+window+1;
    const a=boxSum(ixx,w,x0,y0,x1,y1),b=boxSum(ixy,w,x0,y0,x1,y1),c=boxSum(iyy,w,x0,y0,x1,y1);
    const det=a*c-b*b,trace=a+c,response=det-.045*trace*trace;
    if(response>0){rawCandidates.push({x,y,response});if(response>maxResponse)maxResponse=response}
  }
  const adaptiveThreshold=Math.max(7.5e5,maxResponse*.0045);
  const candidates=rawCandidates.filter(row=>row.response>=adaptiveThreshold).sort((a,b)=>b.response-a.response);
  const selected:{x:number;y:number;response:number}[]=[];
  const minDist=7,minDist2=minDist*minDist;
  for(const c of candidates){
    let close=false;
    for(let i=Math.max(0,selected.length-120);i<selected.length;i++){const p=selected[i];const dx=p.x-c.x,dy=p.y-c.y;if(dx*dx+dy*dy<minDist2){close=true;break}}
    if(close)continue;selected.push(c);if(selected.length>=maxFeatures)break;
  }
  return selected.map(p=>{
    const angle=intensityOrientation(gray,w,h,p.x,p.y);
    return {x:p.x/scaleToBase,y:p.y/scaleToBase,angle,response:p.response,bits:briefDescriptor(gray,w,h,p.x,p.y,angle)} satisfies Feature;
  });
}

function extractFeatureSet(img:HTMLImageElement,maxSide:number,maxFeatures:number,pyramid:number[]){
  const base=imageToGray(img,maxSide);const features:Feature[]=[];
  const perLevel=Math.max(70,Math.ceil(maxFeatures/pyramid.length));
  for(const scale of pyramid){const level=resizeGray(base,scale);features.push(...detectFeaturesAtScale(level,scale,perLevel))}
  features.sort((a,b)=>b.response-a.response);
  return {width:base.width,height:base.height,features:features.slice(0,maxFeatures)} satisfies FeatureSet;
}

function referenceFeatures(cardId:string){
  const cached=referenceFeatureCache.get(cardId);if(cached)return cached;
  const promise=(async()=>{const img=await loadImage(cardImagePath(cardId));return extractFeatureSet(img,REFERENCE_MAX_SIDE,MAX_REFERENCE_FEATURES,[1.12,1,.80,.64])})();
  referenceFeatureCache.set(cardId,promise);return promise;
}

function popcnt32(v:number){v=v-((v>>>1)&0x55555555);v=(v&0x33333333)+((v>>>2)&0x33333333);return (((v+(v>>>4))&0x0F0F0F0F)*0x01010101)>>>24}
function hamming(a:Uint32Array,b:Uint32Array){let d=0;for(let i=0;i<BRIEF_WORDS;i++)d+=popcnt32((a[i]^b[i])>>>0);return d}

function tentativeMatches(query:FeatureSet,ref:FeatureSet){
  const provisional:TentativeMatch[]=[];
  for(const q of query.features){
    let best=999,second=999,bestRef:Feature|null=null;
    for(const r of ref.features){const d=hamming(q.bits,r.bits);if(d<best){second=best;best=d;bestRef=r}else if(d<second)second=d}
    if(bestRef&&best<=104&&best<second*.86)provisional.push({q,r:bestRef,distance:best});
  }
  provisional.sort((a,b)=>a.distance-b.distance);
  const unique:TentativeMatch[]=[];const usedRef=new Set<Feature>();const usedQuery=new Set<Feature>();
  for(const row of provisional){if(usedRef.has(row.r)||usedQuery.has(row.q))continue;usedRef.add(row.r);usedQuery.add(row.q);unique.push(row);if(unique.length>=120)break}
  return unique;
}

function solveLinear(a:number[][],b:number[]){
  const n=b.length;const m=a.map((row,i)=>[...row,b[i]]);
  for(let col=0;col<n;col++){
    let pivot=col;for(let r=col+1;r<n;r++)if(Math.abs(m[r][col])>Math.abs(m[pivot][col]))pivot=r;
    if(Math.abs(m[pivot][col])<1e-9)return null;
    [m[col],m[pivot]]=[m[pivot],m[col]];
    const div=m[col][col];for(let c=col;c<=n;c++)m[col][c]/=div;
    for(let r=0;r<n;r++){if(r===col)continue;const f=m[r][col];if(Math.abs(f)<1e-12)continue;for(let c=col;c<=n;c++)m[r][c]-=f*m[col][c]}
  }
  return m.map(row=>row[n]);
}

function homographyFrom(matches:TentativeMatch[],indices:number[],query:FeatureSet,ref:FeatureSet){
  const a:number[][]=[],b:number[]=[];
  for(const idx of indices){
    const m=matches[idx];const x=m.r.x/ref.width,y=m.r.y/ref.height,u=m.q.x/query.width,v=m.q.y/query.height;
    a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);
    a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);
  }
  if(indices.length===4){const sol=solveLinear(a,b);return sol?[...sol,1]:null}
  const ata=Array.from({length:8},()=>Array(8).fill(0) as number[]),atb=Array(8).fill(0) as number[];
  for(let r=0;r<a.length;r++)for(let i=0;i<8;i++){atb[i]+=a[r][i]*b[r];for(let j=0;j<8;j++)ata[i][j]+=a[r][i]*a[r][j]}
  const sol=solveLinear(ata,atb);return sol?[...sol,1]:null;
}
function project(h:number[],x:number,y:number){const d=h[6]*x+h[7]*y+h[8];if(Math.abs(d)<1e-9)return null;return {x:(h[0]*x+h[1]*y+h[2])/d,y:(h[3]*x+h[4]*y+h[5])/d}}
function triangleArea(a:Feature,b:Feature,c:Feature,ref:FeatureSet){const ax=a.x/ref.width,ay=a.y/ref.height,bx=b.x/ref.width,by=b.y/ref.height,cx=c.x/ref.width,cy=c.y/ref.height;return Math.abs((bx-ax)*(cy-ay)-(by-ay)*(cx-ax))*.5}

function seeded(seedText:string){let s=2166136261;for(let i=0;i<seedText.length;i++){s^=seedText.charCodeAt(i);s=Math.imul(s,16777619)}return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296}}
function ransacHomography(matches:TentativeMatch[],query:FeatureSet,ref:FeatureSet,seedText:string){
  if(matches.length<5)return {h:null as number[]|null,inliers:[] as number[],error:1,coverage:0};
  const rand=seeded(seedText);let best:number[]=[],bestH:number[]|null=null,bestError=Infinity;
  const n=matches.length;
  for(let iter=0;iter<RANSAC_ITERATIONS;iter++){
    const pick:number[]=[];let guard=0;
    while(pick.length<4&&guard++<40){const idx=Math.floor(rand()*n);if(!pick.includes(idx))pick.push(idx)}
    if(pick.length<4)continue;
    const ra=matches[pick[0]].r,rb=matches[pick[1]].r,rc=matches[pick[2]].r,rd=matches[pick[3]].r;
    if(Math.max(triangleArea(ra,rb,rc,ref),triangleArea(ra,rb,rd,ref),triangleArea(ra,rc,rd,ref))<.018)continue;
    const h=homographyFrom(matches,pick,query,ref);if(!h)continue;
    const inliers:number[]=[];let error=0;
    for(let i=0;i<n;i++){
      const m=matches[i],p=project(h,m.r.x/ref.width,m.r.y/ref.height);if(!p)continue;
      const qx=m.q.x/query.width,qy=m.q.y/query.height,e=Math.hypot(p.x-qx,p.y-qy);
      if(e<RANSAC_THRESHOLD){inliers.push(i);error+=e}
    }
    const avg=inliers.length?error/inliers.length:1;
    if(inliers.length>best.length||(inliers.length===best.length&&avg<bestError)){best=inliers;bestH=h;bestError=avg}
  }
  if(best.length>=5){const refined=homographyFrom(matches,best,query,ref);if(refined){bestH=refined;let e=0;const kept:number[]=[];for(const idx of best){const m=matches[idx],p=project(refined,m.r.x/ref.width,m.r.y/ref.height);if(!p)continue;const err=Math.hypot(p.x-m.q.x/query.width,p.y-m.q.y/query.height);if(err<RANSAC_THRESHOLD*1.15){kept.push(idx);e+=err}}best=kept;bestError=kept.length?e/kept.length:1}}
  let coverage=0;
  if(best.length){let minX=1,minY=1,maxX=0,maxY=0;for(const idx of best){const r=matches[idx].r;const x=r.x/ref.width,y=r.y/ref.height;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}coverage=clamp((maxX-minX)*(maxY-minY),0,1)}
  return {h:bestH,inliers:best,error:bestError,coverage};
}

function polygonFromHomography(h:number[]|null):GeometricPolygon|null{
  if(!h)return null;const points=[[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>project(h,x,y));if(points.some(x=>!x))return null;
  return points as GeometricPolygon;
}
function centerOfPolygon(p:GeometricPolygon|null){if(!p)return null;return {x:p.reduce((s,a)=>s+a.x,0)/4,y:p.reduce((s,a)=>s+a.y,0)/4}}
function polygonQuality(p:GeometricPolygon|null){
  if(!p)return 0;
  let area2=0;for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4];area2+=a.x*b.y-b.x*a.y}
  const area=Math.abs(area2)*.5;if(area<.020||area>1.15)return 0;
  const edges=p.map((a,i)=>{const b=p[(i+1)%4];return Math.hypot(a.x-b.x,a.y-b.y)});
  if(Math.min(...edges)<.075||Math.max(...edges)>1.65)return 0;
  let sign=0,convex=true;for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4],c=p[(i+2)%4];const cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);const s=Math.sign(cross);if(!s)continue;if(sign&&s!==sign){convex=false;break}sign=s}
  if(!convex)return 0;
  const inside=p.filter(a=>a.x>-.12&&a.x<1.12&&a.y>-.12&&a.y<1.12).length/4;
  const oppositeBalance=Math.min(edges[0],edges[2])/Math.max(edges[0],edges[2],1e-6)*.5+Math.min(edges[1],edges[3])/Math.max(edges[1],edges[3],1e-6)*.5;
  const areaStrength=clamp((area-.020)/.28,0,1);
  return clamp(inside*.42+oppositeBalance*.28+areaStrength*.30,0,1);
}

function geometryScore(good:number,inliers:number,ratio:number,coverage:number,error:number){
  const matchStrength=clamp((good-3)/26,0,1),inlierStrength=clamp((inliers-3)/22,0,1);
  const ratioStrength=clamp((ratio-.24)/.60,0,1),coverageStrength=clamp((coverage-.045)/.56,0,1),errorStrength=clamp(1-error/RANSAC_THRESHOLD,0,1);
  return clamp(matchStrength*.15+inlierStrength*.29+ratioStrength*.22+coverageStrength*.20+errorStrength*.14,0,1);
}

function polygonBounds(p:GeometricPolygon|null){
  if(!p)return null;const xs=p.map(x=>x.x),ys=p.map(x=>x.y);
  return {x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};
}
function polygonBoxIoU(a:GeometricPolygon|null,b:GeometricPolygon|null){
  const aa=polygonBounds(a),bb=polygonBounds(b);if(!aa||!bb)return 1;
  const iw=Math.max(0,Math.min(aa.x1,bb.x1)-Math.max(aa.x0,bb.x0));
  const ih=Math.max(0,Math.min(aa.y1,bb.y1)-Math.max(aa.y0,bb.y0));
  const inter=iw*ih,areaA=Math.max(1e-6,(aa.x1-aa.x0)*(aa.y1-aa.y0)),areaB=Math.max(1e-6,(bb.x1-bb.x0)*(bb.y1-bb.y0));
  return inter/Math.max(1e-6,areaA+areaB-inter);
}
function polygonsSeparated(a:GeometricCardMatch,b:GeometricCardMatch){
  if(!a.center||!b.center||!a.polygon||!b.polygon)return false;
  const distance=Math.hypot(a.center.x-b.center.x,a.center.y-b.center.y);
  const iou=polygonBoxIoU(a.polygon,b.polygon);
  // Dos cartas muy juntas siguen teniendo centros distintos y poca superposición.
  // Dos hipótesis falsas sobre la misma carta suelen solaparse mucho.
  return distance>.105&&iou<.52;
}

export function homographyOrientation(h:number[]|null){
  if(!h)return null;
  const top=project(h,.5,.16),bottom=project(h,.5,.84);if(!top||!bottom)return null;
  const dx=bottom.x-top.x,dy=bottom.y-top.y,length=Math.hypot(dx,dy);if(length<.08)return null;
  const verticality=Math.abs(dy)/length;
  const confidence=clamp((verticality-.42)/.50,0,1);
  return {orientation:dy>=0?'UPRIGHT' as const:'REVERSED' as const,confidence,verticality};
}

export async function recognizeGeometrically(photo:HTMLImageElement,onProgress?:(done:number,total:number)=>void):Promise<GeometricRecognitionResult>{
  const query=extractFeatureSet(photo,QUERY_MAX_SIDE,MAX_QUERY_FEATURES,[1.24,1,.80,.63]);
  const coarse:{cardId:string;cardName:string;good:number;matches:TentativeMatch[];ref:FeatureSet}[]=[];
  let done=0;
  for(const card of tarotCards){
    try{const ref=await referenceFeatures(card.id);const matches=tentativeMatches(query,ref);coarse.push({cardId:card.id,cardName:card.name,good:matches.length,matches,ref})}catch{/* las validaciones de assets informan faltantes */}
    done++;onProgress?.(done,tarotCards.length*2);if(done%2===0)await nextFrame();
  }
  coarse.sort((a,b)=>b.good-a.good);
  const finalists=coarse.filter(x=>x.good>=4).slice(0,Math.min(48,coarse.length));const matches:GeometricCardMatch[]=[];
  for(let i=0;i<finalists.length;i++){
    const row=finalists[i];const r=ransacHomography(row.matches,query,row.ref,row.cardId);
    const ratio=r.inliers.length/Math.max(1,row.matches.length);
    const polygon=polygonFromHomography(r.h),shape=polygonQuality(polygon);
    const baseScore=geometryScore(row.matches.length,r.inliers.length,ratio,r.coverage,r.error);
    const score=shape<.14?baseScore*.35:baseScore*(.66+shape*.34);
    const usableShape=shape>=.14&&r.inliers.length>=5;
    matches.push({cardId:row.cardId,cardName:row.cardName,score,goodMatches:row.matches.length,inliers:r.inliers.length,inlierRatio:ratio,coverage:r.coverage,reprojectionError:r.error,homography:usableShape?r.h:null,polygon:usableShape?polygon:null,center:usableShape?centerOfPolygon(polygon):null});
    onProgress?.(tarotCards.length+i+1,tarotCards.length+finalists.length);if(i%2===1)await nextFrame();
  }
  const finalistIds=new Set(matches.map(x=>x.cardId));
  for(const row of coarse){
    if(finalistIds.has(row.cardId))continue;
    const coarseScore=clamp(row.good/44,0,.29);
    matches.push({cardId:row.cardId,cardName:row.cardName,score:coarseScore,goodMatches:row.good,inliers:0,inlierRatio:0,coverage:0,reprojectionError:1,homography:null,polygon:null,center:null});
  }
  matches.sort((a,b)=>b.score-a.score||b.inliers-a.inliers||b.goodMatches-a.goodMatches);
  const strong=matches.filter(x=>x.score>=.49&&x.inliers>=8&&x.inlierRatio>=.36&&x.coverage>=.12);
  // V7.0.1: para detectar dos cartas no exigimos que la segunda alcance el mismo
  // umbral de clasificación que la primera. Basta una segunda homografía moderada,
  // geométricamente separada y poco solapada. Esto cubre cartas casi pegadas.
  const multiCandidates=matches.filter(x=>!!x.homography&&x.score>=.34&&x.inliers>=6&&x.inlierRatio>=.28&&x.coverage>=.065).slice(0,14);
  let multipleEvidence=0,multipleSuspected=false;
  outer:for(let i=0;i<multiCandidates.length;i++)for(let j=i+1;j<multiCandidates.length;j++){
    if(polygonsSeparated(multiCandidates[i],multiCandidates[j])){
      multipleSuspected=true;
      const weak=Math.min(multiCandidates[i].score,multiCandidates[j].score);
      const support=Math.min(multiCandidates[i].inliers,multiCandidates[j].inliers);
      multipleEvidence=Math.round(clamp(weak*.78+clamp((support-5)/15,0,1)*.22,0,.99)*100);
      break outer;
    }
  }
  return {matches,queryFeatureCount:query.features.length,strongMatches:strong.length,multipleSuspected,multipleEvidence};
}

export function homographyRectifiedImage(photo:HTMLImageElement,h:number[],width=96,height=164){
  const source=imageToGray(photo,QUERY_MAX_SIDE);
  const canvas=document.createElement('canvas');canvas.width=Math.max(48,width);canvas.height=Math.max(82,height);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('CANVAS_UNAVAILABLE');
  const out=ctx.createImageData(canvas.width,canvas.height);
  // Se usa la foto original en color para la verificación secundaria.
  const colorCanvas=document.createElement('canvas');colorCanvas.width=source.width;colorCanvas.height=source.height;
  const colorCtx=colorCanvas.getContext('2d',{willReadFrequently:true});if(!colorCtx)throw new Error('CANVAS_UNAVAILABLE');
  colorCtx.drawImage(photo,0,0,source.width,source.height);const color=colorCtx.getImageData(0,0,source.width,source.height).data;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const u=(x+.5)/canvas.width,v=(y+.5)/canvas.height,p=project(h,u,v);const oi=(y*canvas.width+x)*4;
    if(!p){out.data[oi]=out.data[oi+1]=out.data[oi+2]=255;out.data[oi+3]=255;continue}
    const sx=clamp(Math.round(p.x*source.width),0,source.width-1),sy=clamp(Math.round(p.y*source.height),0,source.height-1),si=(sy*source.width+sx)*4;
    out.data[oi]=color[si];out.data[oi+1]=color[si+1];out.data[oi+2]=color[si+2];out.data[oi+3]=255;
  }
  return out;
}
