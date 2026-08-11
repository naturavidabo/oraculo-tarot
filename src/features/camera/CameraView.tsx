import { useEffect, useMemo, useRef, useState } from 'react';
import { tarotCards, tarotCardById } from '../../data/cards';
import { TarotCardImage } from '../../components/TarotCardImage';
import { confirmedCameraCard, recognizeTarotCard, type CameraCandidate } from '../../engine/cameraRecognition';
import type { Orientation } from '../../types/tarot';

type Confirmed={cardId:string;cardName:string;orientation:Orientation};
const SESSION_KEY='oraculo_camera_cards_v1';

export function CameraView({back,startManual}:{back:()=>void;startManual:()=>void}){
  const inputRef=useRef<HTMLInputElement>(null);
  const [preview,setPreview]=useState('');
  const [file,setFile]=useState<File|null>(null);
  const [name,setName]=useState('');
  const [candidates,setCandidates]=useState<CameraCandidate[]>([]);
  const [progress,setProgress]=useState('');
  const [error,setError]=useState('');
  const [confirmed,setConfirmed]=useState<Confirmed[]>([]);
  const [manualId,setManualId]=useState('');
  const [manualOrientation,setManualOrientation]=useState<Orientation>('UPRIGHT');
  const used=useMemo(()=>new Set(confirmed.map(x=>x.cardId)),[confirmed]);
  const supportedCounts=new Set([1,3,5,6,7,9,10,12]);
  const countReady=supportedCounts.has(confirmed.length);

  useEffect(()=>()=>{if(preview) URL.revokeObjectURL(preview)},[preview]);

  function choose(next?:File){
    if(!next)return;
    if(preview)URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(next));setFile(next);setName(next.name||'Foto de la carta');
    setCandidates([]);setError('');setProgress('');
  }

  async function analyze(){
    if(!file)return;
    setError('');setCandidates([]);setProgress('Preparando comparación…');
    try{
      const result=await recognizeTarotCard(file,(done,total)=>setProgress(`Comparando con el mazo local ${done}/${total}…`));
      setCandidates(result.filter(x=>!used.has(x.cardId)));
      if(!result.length)setError('No se pudo generar candidatos. Comprueba que las 78 imágenes locales estén operativas.');
    }catch{
      setError('No se pudo analizar la fotografía. Intenta encuadrar una sola carta, completa y con buena luz.');
    }finally{setProgress('');}
  }

  function confirm(cardId:string,orientation:Orientation){
    if(used.has(cardId)){setError('Esa carta ya fue confirmada en esta tirada.');return;}
    setConfirmed(prev=>[...prev,confirmedCameraCard(cardId,orientation)]);
    setCandidates([]);setFile(null);if(preview)URL.revokeObjectURL(preview);setPreview('');setName('');setError('');
  }

  function addManual(){if(manualId){confirm(manualId,manualOrientation);setManualId('');setManualOrientation('UPRIGHT')}}
  function remove(index:number){setConfirmed(prev=>prev.filter((_,i)=>i!==index))}
  function continueReading(){
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(confirmed.map(({cardId,orientation})=>({cardId,orientation}))));
    startManual();
  }

  return <section className="page camera-page">
    <button className="text-button" onClick={back}>← Tarot</button>
    <span className="eyebrow">CÁMARA · RECONOCIMIENTO ASISTIDO BETA</span>
    <h1>Reconocer cartas físicas</h1>
    <p className="lead">Fotografía <b>una carta por vez</b>. ORÁCULO TAROT la compara localmente con las 78 Rider–Waite y propone candidatos. Tú confirmas la carta antes de incorporarla a la lectura.</p>

    <div className="camera-guide">
      <b>Para obtener mejores candidatos</b>
      <span>Una sola carta completa dentro del encuadre.</span>
      <span>Foto casi perpendicular, con buena luz y sin reflejos.</span>
      <span>No cubras ilustración, bordes ni título de la carta.</span>
    </div>

    <div className="camera-frame">
      {preview?<img src={preview} alt="Vista previa de la carta"/>:<div className="camera-frame-empty"><span>▯</span><b>Una carta dentro de esta guía</b></div>}
      <div className="camera-guide-box" aria-hidden="true" />
    </div>
    {name&&<small className="muted camera-file-name">{name}</small>}

    <button className="primary-cta" onClick={()=>inputRef.current?.click()}>📷 Tomar foto / elegir imagen</button>
    <input ref={inputRef} hidden type="file" accept="image/*" capture="environment" onChange={e=>choose(e.target.files?.[0])}/>
    {file&&<button className="secondary-cta" disabled={!!progress} onClick={()=>void analyze()}>{progress||'✦ Reconocer esta carta'}</button>}
    {error&&<div className="notice-card warning">{error}</div>}

    {!!candidates.length&&<>
      <div className="section-title"><h2>Candidatos</h2><span>confirma antes de usar</span></div>
      <p className="muted">El porcentaje es una similitud visual orientativa, no una certeza. Si no coincide, usa “Elegir manualmente”.</p>
      <div className="camera-candidate-grid">{candidates.map(candidate=>{
        const card=tarotCardById.get(candidate.cardId)!;
        return <button key={candidate.cardId} onClick={()=>confirm(candidate.cardId,candidate.orientation)}>
          <TarotCardImage card={card} orientation={candidate.orientation} className="camera-candidate-image" eager/>
          <b>{candidate.cardName}</b><span>{candidate.orientation==='UPRIGHT'?'Derecha':'Invertida'} · similitud {candidate.score}%</span>
        </button>;
      })}</div>
    </>}

    <details className="explanation-details camera-manual"><summary>Elegir manualmente si el reconocimiento no coincide</summary>
      <div className="clarifier-form">
        <select value={manualId} onChange={e=>setManualId(e.target.value)}><option value="">Seleccionar carta…</option>{tarotCards.map(card=><option key={card.id} value={card.id} disabled={used.has(card.id)}>{card.name}</option>)}</select>
        <select value={manualOrientation} onChange={e=>setManualOrientation(e.target.value as Orientation)}><option value="UPRIGHT">Derecha</option><option value="REVERSED">Invertida</option></select>
        <button className="secondary-cta" disabled={!manualId} onClick={addManual}>Confirmar carta</button>
      </div>
    </details>

    <div className="section-title"><h2>Cartas confirmadas</h2><span>{confirmed.length}</span></div>
    {!confirmed.length?<div className="notice-card info">Todavía no has confirmado ninguna carta.</div>:<div className="camera-confirmed-grid">{confirmed.map((item,index)=>{
      const card=tarotCardById.get(item.cardId)!;
      return <div key={`${item.cardId}-${index}`}><TarotCardImage card={card} orientation={item.orientation} className="camera-confirmed-image"/><b>{index+1}. {item.cardName}</b><small>{item.orientation==='UPRIGHT'?'Derecha':'Invertida'}</small><button onClick={()=>remove(index)}>Quitar</button></div>;
    })}</div>}

    <div className="notice-card info"><b>Fase Beta</b><span>Esta versión reconoce una carta por vez y siempre exige confirmación. El reconocimiento de varias cartas en una sola fotografía vendrá después, cuando esta base tenga suficiente estabilidad.</span></div>
    {!!confirmed.length&&!countReady&&<div className="notice-card warning">Para pasar directamente a una tirada, confirma 1, 3, 5, 6, 7, 9, 10 o 12 cartas. Ahora tienes {confirmed.length}.</div>}
    <button className="primary-cta" disabled={!countReady} onClick={continueReading}>Usar {confirmed.length||''} carta{confirmed.length===1?'':'s'} en una lectura</button>
  </section>;
}
