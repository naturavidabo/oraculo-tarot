import { useEffect, useMemo, useRef, useState } from 'react';
import { tarotCards, tarotCardById } from '../../data/cards';
import { TarotCardImage } from '../../components/TarotCardImage';
import {
  confirmedCameraCard, recognizeTarotCard, recordCameraFeedback,
  type CameraCandidate, type CameraRecognitionResult, type CameraConfidence, type CameraCorners,
  type CameraOrientationConfidence,
} from '../../engine/cameraRecognition';
import type { Orientation } from '../../types/tarot';

type Confirmed={cardId:string;cardName:string;orientation:Orientation};
const SESSION_KEY='oraculo_camera_cards_v1';
const confidenceLabel:Record<CameraConfidence,string>={HIGH:'Coincidencia alta',MEDIUM:'Coincidencia media',LOW:'Coincidencia baja',INCONCLUSIVE:'Reconocimiento no concluyente'};
const orientationConfidenceLabel:Record<CameraOrientationConfidence,string>={HIGH:'orientación alta',MEDIUM:'orientación media',LOW:'orientación baja',AMBIGUOUS:'orientación dudosa'};
const defaultCorners:CameraCorners=[{x:.18,y:.12},{x:.82,y:.12},{x:.82,y:.88},{x:.18,y:.88}];

export function CameraView({back,startManual}:{back:()=>void;startManual:()=>void}){
  const inputRef=useRef<HTMLInputElement>(null);
  const editorRef=useRef<HTMLDivElement>(null);
  const [preview,setPreview]=useState('');
  const [file,setFile]=useState<File|null>(null);
  const [name,setName]=useState('');
  const [recognition,setRecognition]=useState<CameraRecognitionResult|null>(null);
  const [progress,setProgress]=useState('');
  const [error,setError]=useState('');
  const [actionMessage,setActionMessage]=useState('');
  const [confirmed,setConfirmed]=useState<Confirmed[]>([]);
  const [manualId,setManualId]=useState('');
  const [manualOrientation,setManualOrientation]=useState<Orientation>('UPRIGHT');
  const [manualSearch,setManualSearch]=useState('');
  const [testActualId,setTestActualId]=useState('');
  const [testActualOrientation,setTestActualOrientation]=useState<Orientation>('UPRIGHT');
  const [testMessage,setTestMessage]=useState('');
  const [selectedCandidateId,setSelectedCandidateId]=useState('');
  const [selectedOrientation,setSelectedOrientation]=useState<Orientation>('UPRIGHT');
  const [precisionMode,setPrecisionMode]=useState(false);
  const [corners,setCorners]=useState<CameraCorners>(defaultCorners);
  const [dragging,setDragging]=useState<number|null>(null);
  const used=useMemo(()=>new Set(confirmed.map(x=>x.cardId)),[confirmed]);
  const supportedCounts=useMemo(()=>new Set([1,3,5,6,7,9,10,12]),[]);
  const countReady=supportedCounts.has(confirmed.length);
  const candidates=(recognition?.candidates??[]).filter(x=>!used.has(x.cardId));
  const selectedCandidate=recognition?.all.find(x=>x.cardId===selectedCandidateId);
  const manualOptions=useMemo(()=>{
    const q=manualSearch.trim().toLocaleLowerCase('es');
    const rows=tarotCards.filter(card=>!used.has(card.id)&&(!q||card.name.toLocaleLowerCase('es').includes(q)));
    return q?rows.slice(0,30):rows;
  },[manualSearch,used]);

  useEffect(()=>()=>{if(preview) URL.revokeObjectURL(preview)},[preview]);

  useEffect(()=>{
    if(dragging===null)return;
    const move=(event:PointerEvent)=>{
      const rect=editorRef.current?.getBoundingClientRect();if(!rect)return;
      event.preventDefault();
      const x=Math.max(.01,Math.min(.99,(event.clientX-rect.left)/rect.width));
      const y=Math.max(.01,Math.min(.99,(event.clientY-rect.top)/rect.height));
      setCorners(prev=>prev.map((point,index)=>index===dragging?{x,y}:point) as CameraCorners);
    };
    const stop=()=>setDragging(null);
    window.addEventListener('pointermove',move,{passive:false});
    window.addEventListener('pointerup',stop);
    window.addEventListener('pointercancel',stop);
    return ()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',stop)};
  },[dragging]);

  function choose(next?:File){
    if(!next)return;
    if(preview)URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(next));setFile(next);setName(next.name||'Foto de la carta');
    setRecognition(null);setError('');setProgress('');setTestMessage('');setActionMessage('');
    setSelectedCandidateId('');setPrecisionMode(false);setCorners(defaultCorners);
  }

  async function analyze(){
    if(!file)return;
    setError('');setRecognition(null);setSelectedCandidateId('');setProgress(precisionMode?'Rectificando por cuatro esquinas…':'Preparando imagen y buscando bordes…');setTestMessage('');setActionMessage('');
    try{
      const result=await recognizeTarotCard(file,(done,total)=>setProgress(`Comparación visual 3.0 ${done}/${total}…`),precisionMode?{corners}:{});
      setRecognition(result);
      const first=result.candidates[0];if(first){setSelectedCandidateId(first.cardId);setSelectedOrientation(first.orientation)}
      if(testActualId){
        const actual=result.all.find(x=>x.cardId===testActualId);
        recordCameraFeedback(result,testActualId,testActualOrientation);
        const real=tarotCardById.get(testActualId)?.name??'Carta real';
        setTestMessage(actual?`${real} quedó en el puesto ${actual.rank} de 78 · similitud ${actual.score}% · orientación detectada ${actual.orientation==='UPRIGHT'?'derecha':'invertida'} (${orientationConfidenceLabel[actual.orientationConfidence]}). Prueba registrada localmente.`:`${real} no pudo evaluarse. Prueba registrada como no identificada.`);
        if((actual?.rank??79)>5)setError('La carta real quedó fuera del Top 5. Activa “Ajuste preciso de 4 esquinas” y vuelve a analizar antes de corregir manualmente.');
      }
      if(!result.candidates.length)setError('No se pudieron generar candidatos. Comprueba el diagnóstico 78/78 de imágenes locales.');
    }catch{
      setError('No se pudo analizar la fotografía. Intenta que la carta ocupe la mayor parte del encuadre o usa el ajuste preciso de cuatro esquinas.');
    }finally{setProgress('');}
  }

  function registerFeedback(actualCardId:string){
    if(!recognition||testActualId)return;
    try{
      const actual=recognition.all.find(x=>x.cardId===actualCardId);
      recordCameraFeedback(recognition,actualCardId);
      setTestMessage(actual?`Corrección registrada: la carta real estaba en el puesto ${actual.rank} de 78.`:'Corrección registrada: la carta real no apareció en el ranking.');
    }catch{/* las estadísticas nunca pueden bloquear el botón Confirmar */}
  }

  function confirm(cardId:string,orientation:Orientation){
    if(!cardId)return;
    if(used.has(cardId)){setError('Esa carta ya fue confirmada en esta tirada.');return;}
    try{
      const item=confirmedCameraCard(cardId,orientation);
      setConfirmed(prev=>[...prev,item]);
      setActionMessage(`✓ ${item.cardName} confirmada ${orientation==='UPRIGHT'?'derecha':'invertida'}.`);
      setError('');
      registerFeedback(cardId);
      setRecognition(null);setFile(null);if(preview)URL.revokeObjectURL(preview);setPreview('');setName('');
      setManualId('');setManualSearch('');setManualOrientation('UPRIGHT');setTestActualId('');setTestActualOrientation('UPRIGHT');setSelectedCandidateId('');setPrecisionMode(false);setCorners(defaultCorners);
    }catch{
      setError('No se pudo confirmar la carta. Vuelve a tocar “Confirmar” o selecciónala manualmente.');
    }
  }

  function selectCandidate(candidate:CameraCandidate){
    setSelectedCandidateId(candidate.cardId);setSelectedOrientation(candidate.orientation);setActionMessage('');setError('');
  }
  function confirmSelected(){if(selectedCandidateId)confirm(selectedCandidateId,selectedOrientation)}
  function addManual(){if(manualId)confirm(manualId,manualOrientation)}
  function remove(index:number){setConfirmed(prev=>prev.filter((_,i)=>i!==index))}
  function continueReading(){
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(confirmed.map(({cardId,orientation})=>({cardId,orientation}))));
    startManual();
  }
  function resetCorners(){setCorners(defaultCorners)}

  const manualRank=manualId&&recognition?recognition.all.find(x=>x.cardId===manualId):undefined;
  const polygon=corners.map(point=>`${point.x*100},${point.y*100}`).join(' ');

  return <section className="page camera-page">
    <button type="button" className="text-button" onClick={back}>← Tarot</button>
    <span className="eyebrow">CÁMARA · RECONOCIMIENTO VISUAL 3.0 · BETA 4</span>
    <h1>Reconocer cartas físicas</h1>
    <p className="lead">Fotografía <b>una carta por vez</b>. ORÁCULO TAROT identifica primero qué carta es <b>sin mezclar ese ranking con la orientación</b>; después decide si está derecha o invertida comparando la foto original con una copia rotada físicamente 180°.</p>

    <div className="camera-guide">
      <b>Para mejorar el reconocimiento</b>
      <span>Haz que la carta ocupe aproximadamente 60–85% de la foto.</span>
      <span>Incluye los cuatro bordes; evita sombras fuertes, dedos y reflejos.</span>
      <span>Si la carta correcta queda lejos del Top 5, activa el ajuste preciso de cuatro esquinas.</span>
    </div>

    {!precisionMode&&<div className="camera-frame">
      {preview?<img src={preview} alt="Vista previa de la carta"/>:<div className="camera-frame-empty"><span>▯</span><b>Una carta dentro de esta guía</b></div>}
      <div className="camera-guide-box" aria-hidden="true" />
    </div>}

    {preview&&precisionMode&&<div className="camera-precision-panel">
      <div className="section-title compact"><h2>Ajuste preciso de 4 esquinas</h2><span>táctil</span></div>
      <p className="muted">Arrastra cada punto dorado hasta una esquina real de la carta: superior izquierda, superior derecha, inferior derecha e inferior izquierda. Después vuelve a reconocer.</p>
      <div ref={editorRef} className="camera-corner-editor" onContextMenu={event=>event.preventDefault()} onDragStart={event=>event.preventDefault()}>
        <img src={preview} alt="Ajuste de las cuatro esquinas" draggable={false} onContextMenu={event=>event.preventDefault()}/>
        <svg className="camera-corner-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points={polygon}/></svg>
        {corners.map((point,index)=><button
          type="button" key={index} className="camera-corner-handle" aria-label={`Esquina ${index+1}`}
          style={{left:`${point.x*100}%`,top:`${point.y*100}%`}}
          onPointerDown={event=>{event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture?.(event.pointerId);setDragging(index)}} onContextMenu={event=>event.preventDefault()}>{index+1}</button>)}
      </div>
      <button type="button" className="secondary-cta" onClick={resetCorners}>Restablecer esquinas</button>
    </div>}
    {name&&<small className="muted camera-file-name">{name}</small>}

    <button type="button" className="primary-cta" onClick={()=>inputRef.current?.click()}>📷 Tomar foto / elegir imagen</button>
    <input ref={inputRef} hidden type="file" accept="image/*" capture="environment" onChange={e=>choose(e.target.files?.[0])}/>

    {file&&<div className="camera-precision-toggle">
      <button type="button" className={precisionMode?'secondary-cta selected':'secondary-cta'} onClick={()=>{setPrecisionMode(v=>!v);setRecognition(null);setSelectedCandidateId('')}}>{precisionMode?'✓ Ajuste preciso activado':'◫ Ajustar 4 esquinas'}</button>
    </div>}

    {file&&<details className="explanation-details camera-calibration">
      <summary>Modo de prueba: sé cuál es la carta y quiero medir el reconocimiento</summary>
      <p className="muted">Opcional. Selecciona la carta real y su orientación antes de analizar. La app medirá por separado <b>identidad</b> y <b>orientación</b>; no almacena la foto.</p>
      <select value={testActualId} onChange={e=>setTestActualId(e.target.value)}><option value="">No usar modo de prueba</option>{tarotCards.map(card=><option value={card.id} key={card.id}>{card.name}</option>)}</select>
      {testActualId&&<select value={testActualOrientation} onChange={e=>setTestActualOrientation(e.target.value as Orientation)}><option value="UPRIGHT">La carta real está derecha</option><option value="REVERSED">La carta real está invertida</option></select>}
    </details>}

    {file&&<button type="button" className="secondary-cta camera-recognize-button" disabled={!!progress} onClick={()=>void analyze()}>{progress||`✦ Reconocer esta carta${precisionMode?' con 4 esquinas':''}`}</button>}
    {error&&<div className="notice-card warning">{error}</div>}
    {actionMessage&&<div className="notice-card success">{actionMessage}</div>}
    {testMessage&&<div className="notice-card info">{testMessage}</div>}

    {recognition&&<div className={`camera-recognition-status ${recognition.confidence.toLowerCase()}`}>
      <b>{confidenceLabel[recognition.confidence]}</b>
      <span>{recognition.cropMethod==='MANUAL_CORNERS'?'Rectificación manual por cuatro esquinas':recognition.cropMethod==='AUTO_EDGES'?'Carta localizada por bordes':'Se utilizó el encuadre central'} · calidad {recognition.cropQuality}/100 · separación 1.º/2.º {recognition.margin.toFixed(1)} puntos.</span>
      {recognition.confidence==='INCONCLUSIVE'&&<small>No hay una coincidencia suficientemente clara. Puedes ajustar las cuatro esquinas, seleccionar uno de los candidatos o corregir manualmente.</small>}
      {recognition.framingWarning&&<small className="camera-framing-warning">El encuadre no parece aislar con claridad una sola carta. Si fotografiaste dos o más cartas juntas, usa una sola carta para este modo.</small>}
    </div>}

    {!!candidates.length&&<>
      <div className="section-title"><h2>Candidatos</h2><span>Top {candidates.length}</span></div>
      <p className="muted">Toca una carta para <b>seleccionarla</b>. La selección se ilumina; recién después usa el botón “Confirmar candidato seleccionado”.</p>
      <div className="camera-candidate-grid">{candidates.map((candidate:CameraCandidate)=>{
        const card=tarotCardById.get(candidate.cardId)!;
        const selected=selectedCandidateId===candidate.cardId;
        return <button type="button" aria-pressed={selected} className={selected?'selected':''} key={candidate.cardId} onClick={()=>selectCandidate(candidate)}>
          <TarotCardImage card={card} orientation={candidate.orientation} className="camera-candidate-image" eager/>
          <b>{candidate.rank}. {candidate.cardName}</b><span>similitud {candidate.score}% · {candidate.orientation==='UPRIGHT'?'Derecha':'Invertida'}</span>
          <small>{orientationConfidenceLabel[candidate.orientationConfidence]} · margen {candidate.orientationMargin.toFixed(1)} pts{selected?' · ✓ Seleccionada':' · Tocar para seleccionar'}</small>
        </button>;
      })}</div>
      {selectedCandidate&&<div className="camera-selected-confirm">
        <b>Seleccionada: {selectedCandidate.cardName}</b>
        <small className={`camera-orientation-note ${selectedCandidate.orientationConfidence.toLowerCase()}`}>Orientación automática: {selectedCandidate.orientation==='UPRIGHT'?'derecha':'invertida'} · {orientationConfidenceLabel[selectedCandidate.orientationConfidence]} · margen {selectedCandidate.orientationMargin.toFixed(1)} pts.</small>
        <div className="orientation-switch"><button type="button" className={selectedOrientation==='UPRIGHT'?'selected':''} onClick={()=>setSelectedOrientation('UPRIGHT')}>↑ Derecha</button><button type="button" className={selectedOrientation==='REVERSED'?'selected':''} onClick={()=>setSelectedOrientation('REVERSED')}>↓ Invertida</button></div>
        <button type="button" className="primary-cta camera-confirm-button" onClick={confirmSelected}>✓ Confirmar candidato seleccionado</button>
      </div>}
    </>}

    <details className="explanation-details camera-manual" open={recognition?.confidence==='INCONCLUSIVE'}><summary>Elegir manualmente / corregir reconocimiento</summary>
      <div className="clarifier-form camera-manual-form">
        <input className="search" value={manualSearch} onChange={e=>setManualSearch(e.target.value)} placeholder="Buscar carta: Mago, As de Copas…" />
        <select value={manualId} onChange={e=>setManualId(e.target.value)}><option value="">Seleccionar carta real…</option>{manualOptions.map(card=><option key={card.id} value={card.id}>{card.name}</option>)}</select>
        <select value={manualOrientation} onChange={e=>setManualOrientation(e.target.value as Orientation)}><option value="UPRIGHT">Derecha</option><option value="REVERSED">Invertida</option></select>
        {manualRank&&<div className="camera-rank-note">En esta foto, <b>{manualRank.cardName}</b> quedó en el puesto <b>{manualRank.rank}/78</b> con similitud {manualRank.score}%.</div>}
        <button type="button" className="primary-cta camera-confirm-button" disabled={!manualId} onClick={addManual}>{manualId?'✓ Confirmar carta real':'Selecciona una carta para confirmar'}</button>
      </div>
    </details>

    <div className="section-title"><h2>Cartas confirmadas</h2><span>{confirmed.length}</span></div>
    {!confirmed.length?<div className="notice-card info">Todavía no has confirmado ninguna carta.</div>:<div className="camera-confirmed-grid">{confirmed.map((item,index)=>{
      const card=tarotCardById.get(item.cardId)!;
      return <div key={`${item.cardId}-${index}`}><TarotCardImage card={card} orientation={item.orientation} className="camera-confirmed-image"/><b>{index+1}. {item.cardName}</b><small>{item.orientation==='UPRIGHT'?'Derecha':'Invertida'}</small><button type="button" onClick={()=>remove(index)}>Quitar</button></div>;
    })}</div>}

    <div className="notice-card info"><b>Beta 4</b><span>Reconocimiento una carta por vez con orientación 3.0: la identidad se calcula sin depender de derecha/invertida y la orientación se decide después. El editor de cuatro esquinas bloquea selección/copiar del navegador.</span></div>
    {!!confirmed.length&&!countReady&&<div className="notice-card warning">Para pasar directamente a una tirada, confirma 1, 3, 5, 6, 7, 9, 10 o 12 cartas. Ahora tienes {confirmed.length}.</div>}
    <button type="button" className="primary-cta" disabled={!countReady} onClick={continueReading}>Usar {confirmed.length||''} carta{confirmed.length===1?'':'s'} en una lectura</button>
  </section>;
}
