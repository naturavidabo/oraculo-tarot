import { useEffect, useMemo, useRef, useState } from 'react';
import { tarotCards, tarotCardById } from '../../data/cards';
import { TarotCardImage } from '../../components/TarotCardImage';
import {
  confirmedCameraCard, recognizeTarotCard, recordCameraFeedback,
  type CameraCandidate, type CameraRecognitionResult, type CameraConfidence,
} from '../../engine/cameraRecognition';
import type { Orientation } from '../../types/tarot';

type Confirmed={cardId:string;cardName:string;orientation:Orientation};
const SESSION_KEY='oraculo_camera_cards_v1';
const confidenceLabel:Record<CameraConfidence,string>={HIGH:'Coincidencia alta',MEDIUM:'Coincidencia media',LOW:'Coincidencia baja',INCONCLUSIVE:'Reconocimiento no concluyente'};

export function CameraView({back,startManual}:{back:()=>void;startManual:()=>void}){
  const inputRef=useRef<HTMLInputElement>(null);
  const [preview,setPreview]=useState('');
  const [file,setFile]=useState<File|null>(null);
  const [name,setName]=useState('');
  const [recognition,setRecognition]=useState<CameraRecognitionResult|null>(null);
  const [progress,setProgress]=useState('');
  const [error,setError]=useState('');
  const [confirmed,setConfirmed]=useState<Confirmed[]>([]);
  const [manualId,setManualId]=useState('');
  const [manualOrientation,setManualOrientation]=useState<Orientation>('UPRIGHT');
  const [testActualId,setTestActualId]=useState('');
  const [testMessage,setTestMessage]=useState('');
  const used=useMemo(()=>new Set(confirmed.map(x=>x.cardId)),[confirmed]);
  const supportedCounts=new Set([1,3,5,6,7,9,10,12]);
  const countReady=supportedCounts.has(confirmed.length);
  const candidates=(recognition?.candidates??[]).filter(x=>!used.has(x.cardId));

  useEffect(()=>()=>{if(preview) URL.revokeObjectURL(preview)},[preview]);

  function choose(next?:File){
    if(!next)return;
    if(preview)URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(next));setFile(next);setName(next.name||'Foto de la carta');
    setRecognition(null);setError('');setProgress('');setTestMessage('');
  }

  async function analyze(){
    if(!file)return;
    setError('');setRecognition(null);setProgress('Preparando imagen y buscando bordes…');setTestMessage('');
    try{
      const result=await recognizeTarotCard(file,(done,total)=>setProgress(`Comparación visual multicriterio ${done}/${total}…`));
      setRecognition(result);
      if(testActualId){
        const actual=result.all.find(x=>x.cardId===testActualId);
        const row=recordCameraFeedback(result,testActualId);
        const real=tarotCardById.get(testActualId)?.name??'Carta real';
        setTestMessage(actual?`${real} quedó en el puesto ${actual.rank} de 78 · similitud ${actual.score}%. Prueba registrada localmente.`:`${real} no pudo evaluarse. Prueba registrada como no identificada.`);
        if(row.actualRank>5)setError('La carta real quedó fuera del Top 5. Esta prueba sirve para seguir afinando el reconocedor; usa selección manual para la lectura.');
      }
      if(!result.candidates.length)setError('No se pudieron generar candidatos. Comprueba el diagnóstico 78/78 de imágenes locales.');
    }catch{
      setError('No se pudo analizar la fotografía. Intenta que la carta ocupe la mayor parte del encuadre, con buena luz y sin reflejos.');
    }finally{setProgress('');}
  }

  function registerFeedback(actualCardId:string){
    if(!recognition||testActualId)return;
    const row=recordCameraFeedback(recognition,actualCardId);
    const actual=recognition.all.find(x=>x.cardId===actualCardId);
    setTestMessage(actual?`Corrección registrada: la carta real estaba en el puesto ${actual.rank} de 78.`:`Corrección registrada: la carta real no apareció en el ranking.`);
    return row;
  }

  function confirm(cardId:string,orientation:Orientation){
    if(used.has(cardId)){setError('Esa carta ya fue confirmada en esta tirada.');return;}
    registerFeedback(cardId);
    setConfirmed(prev=>[...prev,confirmedCameraCard(cardId,orientation)]);
    setRecognition(null);setFile(null);if(preview)URL.revokeObjectURL(preview);setPreview('');setName('');setError('');
    setManualId('');setManualOrientation('UPRIGHT');setTestActualId('');
  }

  function addManual(){if(manualId)confirm(manualId,manualOrientation)}
  function remove(index:number){setConfirmed(prev=>prev.filter((_,i)=>i!==index))}
  function continueReading(){
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(confirmed.map(({cardId,orientation})=>({cardId,orientation}))));
    startManual();
  }

  const manualRank=manualId&&recognition?recognition.all.find(x=>x.cardId===manualId):undefined;

  return <section className="page camera-page">
    <button className="text-button" onClick={back}>← Tarot</button>
    <span className="eyebrow">CÁMARA · RECONOCIMIENTO VISUAL 2.0 · BETA 2</span>
    <h1>Reconocer cartas físicas</h1>
    <p className="lead">Fotografía <b>una carta por vez</b>. ORÁCULO TAROT intenta localizarla dentro de la foto y compara <b>estructura, bordes y color</b> contra las 78 Rider–Waite. La confirmación humana sigue siendo obligatoria.</p>

    <div className="camera-guide">
      <b>Para mejorar el reconocimiento</b>
      <span>Haz que la carta ocupe aproximadamente 60–85% de la foto.</span>
      <span>Incluye los cuatro bordes; evita sombras fuertes, dedos y reflejos.</span>
      <span>Puede tolerar una inclinación pequeña, pero intenta fotografiar casi de frente.</span>
    </div>

    <div className="camera-frame">
      {preview?<img src={preview} alt="Vista previa de la carta"/>:<div className="camera-frame-empty"><span>▯</span><b>Una carta dentro de esta guía</b></div>}
      <div className="camera-guide-box" aria-hidden="true" />
    </div>
    {name&&<small className="muted camera-file-name">{name}</small>}

    <button className="primary-cta" onClick={()=>inputRef.current?.click()}>📷 Tomar foto / elegir imagen</button>
    <input ref={inputRef} hidden type="file" accept="image/*" capture="environment" onChange={e=>choose(e.target.files?.[0])}/>

    {file&&<details className="explanation-details camera-calibration">
      <summary>Modo de prueba: sé cuál es la carta y quiero medir el reconocimiento</summary>
      <p className="muted">Opcional. Selecciona la carta real antes de analizar. La app te dirá en qué puesto quedó y guardará solo esa estadística; no almacena la foto.</p>
      <select value={testActualId} onChange={e=>setTestActualId(e.target.value)}><option value="">No usar modo de prueba</option>{tarotCards.map(card=><option value={card.id} key={card.id}>{card.name}</option>)}</select>
    </details>}

    {file&&<button className="secondary-cta" disabled={!!progress} onClick={()=>void analyze()}>{progress||'✦ Reconocer esta carta'}</button>}
    {error&&<div className="notice-card warning">{error}</div>}
    {testMessage&&<div className="notice-card info">{testMessage}</div>}

    {recognition&&<div className={`camera-recognition-status ${recognition.confidence.toLowerCase()}`}>
      <b>{confidenceLabel[recognition.confidence]}</b>
      <span>{recognition.cropMethod==='AUTO_EDGES'?'Carta localizada por bordes':'Se utilizó el encuadre central'} · calidad de encuadre {recognition.cropQuality}/100 · separación entre 1.º y 2.º {recognition.margin.toFixed(1)} puntos.</span>
      {recognition.confidence==='INCONCLUSIVE'&&<small>La aplicación no considera seguro ningún candidato. Confirma manualmente o vuelve a fotografiar.</small>}
    </div>}

    {!!candidates.length&&<>
      <div className="section-title"><h2>Candidatos</h2><span>Top {candidates.length}</span></div>
      <p className="muted">La similitud es un puntaje visual comparativo, no una probabilidad. Si la carta correcta no aparece, usa la selección manual y esa corrección ayudará a medir el sistema.</p>
      <div className="camera-candidate-grid">{candidates.map((candidate:CameraCandidate)=>{
        const card=tarotCardById.get(candidate.cardId)!;
        return <button key={candidate.cardId} onClick={()=>confirm(candidate.cardId,candidate.orientation)}>
          <TarotCardImage card={card} orientation={candidate.orientation} className="camera-candidate-image" eager/>
          <b>{candidate.rank}. {candidate.cardName}</b><span>{candidate.orientation==='UPRIGHT'?'Derecha':'Invertida'} · similitud {candidate.score}%</span>
        </button>;
      })}</div>
    </>}

    <details className="explanation-details camera-manual" open={recognition?.confidence==='INCONCLUSIVE'}><summary>Elegir manualmente / corregir reconocimiento</summary>
      <div className="clarifier-form">
        <select value={manualId} onChange={e=>setManualId(e.target.value)}><option value="">Seleccionar carta real…</option>{tarotCards.map(card=><option key={card.id} value={card.id} disabled={used.has(card.id)}>{card.name}</option>)}</select>
        <select value={manualOrientation} onChange={e=>setManualOrientation(e.target.value as Orientation)}><option value="UPRIGHT">Derecha</option><option value="REVERSED">Invertida</option></select>
        {manualRank&&<div className="camera-rank-note">En esta foto, <b>{manualRank.cardName}</b> quedó en el puesto <b>{manualRank.rank}/78</b> con similitud {manualRank.score}%.</div>}
        <button className="secondary-cta" disabled={!manualId} onClick={addManual}>Confirmar carta real</button>
      </div>
    </details>

    <div className="section-title"><h2>Cartas confirmadas</h2><span>{confirmed.length}</span></div>
    {!confirmed.length?<div className="notice-card info">Todavía no has confirmado ninguna carta.</div>:<div className="camera-confirmed-grid">{confirmed.map((item,index)=>{
      const card=tarotCardById.get(item.cardId)!;
      return <div key={`${item.cardId}-${index}`}><TarotCardImage card={card} orientation={item.orientation} className="camera-confirmed-image"/><b>{index+1}. {item.cardName}</b><small>{item.orientation==='UPRIGHT'?'Derecha':'Invertida'}</small><button onClick={()=>remove(index)}>Quitar</button></div>;
    })}</div>}

    <div className="notice-card info"><b>Beta 2</b><span>Reconocimiento una carta por vez. Si no hay coincidencia clara, ORÁCULO TAROT lo indica en vez de fingir certeza. La selección manual permanece disponible de forma permanente.</span></div>
    {!!confirmed.length&&!countReady&&<div className="notice-card warning">Para pasar directamente a una tirada, confirma 1, 3, 5, 6, 7, 9, 10 o 12 cartas. Ahora tienes {confirmed.length}.</div>}
    <button className="primary-cta" disabled={!countReady} onClick={continueReading}>Usar {confirmed.length||''} carta{confirmed.length===1?'':'s'} en una lectura</button>
  </section>;
}
