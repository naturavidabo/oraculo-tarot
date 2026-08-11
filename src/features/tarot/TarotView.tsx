import { useEffect, useMemo, useState } from 'react';
import { tarotCards, tarotCardById } from '../../data/cards';
import { spreads } from '../../data/spreads';
import { interpretTarot } from '../../engine/tarotEngine';
import type { Orientation, TarotDimension } from '../../types/tarot';
import type { InterpretationResult } from '../../engine/contracts';
import { addClarifierRevision, saveInterpretedReading } from '../../db/readings';
import { dimensionLabels } from '../../engine/contextProfile';
import { classifyQuestion, recommendSpreads } from '../../engine/questionClassifier';
import { cutVirtualDeck, prepareVirtualDeck, type PreparedCard } from '../../engine/drawEngine';
import { TarotCardBack, TarotCardImage } from '../../components/TarotCardImage';
import { categoryLabel, claimLabel, confidenceLabel, humanCode, mechanismLabel, motifLabel, tensionLabel } from '../../engine/presentationLabels';

type Pick = { cardId:string; orientation:Orientation };
type DrawMethod = 'PHYSICAL'|'VIRTUAL';
type Presentation = 'QUICK'|'NORMAL'|'DEEP'|'TEACHER';

function errorMessage(error:unknown){
  const message=error instanceof Error?error.message:String(error);
  const map:Record<string,string>={
    SPREAD_UNKNOWN:'La tirada seleccionada no está disponible.',
    POSITION_COUNT_MISMATCH:'La cantidad de cartas no coincide con esta tirada.',
    POSITION_UNKNOWN:'Una posición de la tirada no es válida.',
    POSITION_DUPLICATE:'Hay una posición repetida.',
    POSITION_MISSING:'Falta una posición de la tirada.',
    CARD_UNKNOWN:'Una de las cartas no existe en el mazo local.',
    CARD_DUPLICATE:'Una carta está repetida en la tirada.',
  };
  return map[message]??'No se pudo interpretar la tirada. Revisa las cartas seleccionadas y vuelve a intentarlo.';
}

function ReadingResult({
  result, spreadName, savedId, presentation, setPresentation, restart, onClarifier, clarifierBusy, clarifierMessage,
}:{
  result:InterpretationResult;
  spreadName:string;
  savedId:string|null;
  presentation:Presentation;
  setPresentation:(mode:Presentation)=>void;
  restart:()=>void;
  onClarifier:(positionId:string,cardId:string,orientation:Orientation)=>Promise<void>;
  clarifierBusy:boolean;
  clarifierMessage:string;
}){
  const topDimensions=(Object.entries(result.dimensions) as [string,number][])
    .sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))
    .slice(0,presentation==='DEEP'||presentation==='TEACHER'?10:6);
  const primarySections=result.sections.filter(x=>x.role==='PRIMARY');
  const showNormal=presentation!=='QUICK';
  const showDeep=presentation==='DEEP'||presentation==='TEACHER';
  const showTeacher=presentation==='TEACHER';
  const [clarifierPosition,setClarifierPosition]=useState(primarySections[0]?.positionId??'');
  const [clarifierCard,setClarifierCard]=useState('');
  const [clarifierOrientation,setClarifierOrientation]=useState<Orientation>('UPRIGHT');
  const usedCards=new Set(result.sections.map(x=>x.cardId));

  return <section className="page reading-result-page">
    <button className="text-button" onClick={restart}>← Nueva lectura</button>
    <span className="eyebrow">ORÁCULO TAROT · BETA 6</span>
    <h1>{result.headline}</h1>
    <p className="lead">{result.directAnswer}</p>

    <div className="interpretation-main">
      <span className="eyebrow">INTERPRETACIÓN GENERAL</span>
      <p>{result.globalInterpretation}</p>
    </div>

    <div className="mode-switch">
      {(['QUICK','NORMAL','DEEP','TEACHER'] as Presentation[]).map(mode=><button key={mode} className={presentation===mode?'selected':''} onClick={()=>setPresentation(mode)}>{mode==='QUICK'?'Rápida':mode==='NORMAL'?'Normal':mode==='DEEP'?'Profunda':'Profesor'}</button>)}
    </div>

    <div className="status-card reading-status">
      <div><strong>{confidenceLabel[result.confidence]??result.confidence}</strong><span>confianza interpretativa</span></div>
      <div><strong>{primarySections.length}</strong><span>cartas principales</span></div>
      <div><strong>{spreadName}</strong><span>tirada</span></div>
    </div>

    <div className="reading-strip adaptive result-cards">{primarySections.map(section=>{
      const card=tarotCardById.get(section.cardId)!;
      return <div key={section.positionId}>
        <TarotCardImage card={card} orientation={section.orientation} className="result-card-image" eager />
        <b>{card.name}</b>
        <small>{section.label} · {section.orientation==='UPRIGHT'?'Derecha':'Invertida'}</small>
      </div>;
    })}</div>

    {showNormal && <>
      <div className="section-title"><h2>Lectura por posición</h2><span>{spreadName}</span></div>
      <div className="why-list position-reading">{result.sections.map(section=><div key={section.positionId}><b>{section.label} · {section.cardName}</b><p>{section.text}</p></div>)}</div>

      <div className="section-title"><h2>Cómo se conectan las cartas</h2><span>síntesis</span></div>
      <div className="interpretation-secondary"><p>{result.connectionSummary}</p></div>

      {!!result.specialCombinations.length && <div className="connection-list">{result.specialCombinations.map(combo=><article key={combo.id}><b>{combo.label}</b><p>{combo.explanation}</p></article>)}</div>}

      <div className="section-title"><h2>Conclusión</h2><span>tendencia</span></div>
      <div className="conclusion-card"><p>{result.conclusion}</p></div>

      <details className="explanation-details">
        <summary>¿Por qué la aplicación llega a esta interpretación?</summary>
        <div className="why-list">{result.why.map((item,index)=><div key={`${item.claim}-${index}`}><b>{humanCode(item.claim,claimLabel)}</b><p>{item.explanation}</p></div>)}</div>
      </details>
    </>}

    {showDeep && <>
      {(result.motifs.length>0||result.tensions.length>0)&&<>
        <div className="section-title"><h2>Claves de la lectura</h2><span>motor simbólico</span></div>
        <div className="chips">{result.motifs.map(m=><span key={m}>{humanCode(m,motifLabel)}</span>)}{result.tensions.map(t=><span key={t}>{humanCode(t,tensionLabel)}</span>)}</div>
      </>}
      <div className="section-title"><h2>Perfil simbólico</h2><span>escala interna</span></div>
      <div className="vector-list">{topDimensions.map(([key,value])=><div key={key}><span>{dimensionLabels[key as TarotDimension]??key}</span><b>{value.toFixed(1)}</b></div>)}</div>
      {!!result.transitions.length && <><div className="section-title"><h2>Secuencia</h2><span>cómo evoluciona</span></div><div className="transition-line">{result.transitions.map((t,i)=><span key={`${t}-${i}`}>{humanCode(t,mechanismLabel)}</span>)}</div></>}
      {!!result.sequencePatterns.length && <><div className="section-title"><h2>Patrones de secuencia</h2><span>lectura avanzada</span></div><div className="chips">{result.sequencePatterns.map(p=><span key={p}>{humanCode(p,motifLabel)}</span>)}</div></>}
      {!!result.safeguards.length && <><div className="section-title"><h2>Lectura responsable</h2></div><div className="why-list safeguards">{result.safeguards.map(text=><div key={text}><p>{text}</p></div>)}</div></>}
    </>}

    {showTeacher && <>
      <div className="section-title"><h2>Modo Profesor</h2><span>carta por carta</span></div>
      <div className="teacher-grid">{result.sections.map(section=>{
        const card=tarotCardById.get(section.cardId)!;
        return <article key={section.positionId}><b>{section.label} · {card.name}</b><p>{card.teacherNote}</p><small>Mecanismo: {humanCode(card.mechanism,mechanismLabel)}</small></article>;
      })}</div>
    </>}


    {showNormal && savedId && <>
      <div className="section-title"><h2>Carta aclaratoria</h2><span>revisión sin borrar la lectura original</span></div>
      <div className="clarifier-panel">
        <p className="muted">Úsala solo cuando una posición necesite matiz. La aclaratoria pesa menos que la carta principal y crea una nueva revisión de la lectura.</p>
        <div className="clarifier-form">
          <select value={clarifierPosition} onChange={e=>setClarifierPosition(e.target.value)}>{primarySections.map(section=><option key={section.positionId} value={section.positionId}>{section.label}</option>)}</select>
          <select value={clarifierCard} onChange={e=>setClarifierCard(e.target.value)}><option value="">Elegir carta física…</option>{tarotCards.map(card=><option key={card.id} value={card.id} disabled={usedCards.has(card.id)}>{card.name}</option>)}</select>
          <select value={clarifierOrientation} onChange={e=>setClarifierOrientation(e.target.value as Orientation)}><option value="UPRIGHT">Derecha</option><option value="REVERSED">Invertida</option></select>
          <button className="secondary-cta" disabled={!clarifierCard||clarifierBusy} onClick={()=>void onClarifier(clarifierPosition,clarifierCard,clarifierOrientation).then(()=>setClarifierCard(''))}>{clarifierBusy?'Añadiendo…':'Añadir aclaratoria física'}</button>
          <button className="secondary-cta" disabled={clarifierBusy} onClick={()=>{
            const available=tarotCards.filter(card=>!usedCards.has(card.id));
            if(!available.length)return;
            const buffer=new Uint32Array(1);crypto.getRandomValues(buffer);
            const card=available[buffer[0]%available.length];crypto.getRandomValues(buffer);
            const orientation:Orientation=buffer[0]%2===0?'UPRIGHT':'REVERSED';
            void onClarifier(clarifierPosition,card.id,orientation);
          }}>✦ Sacar aclaratoria virtual</button>
        </div>
        {clarifierMessage&&<div className="notice-card info">{clarifierMessage}</div>}
      </div>
    </>}

    <div className={`notice-card ${savedId?'success':'warning'}`}>{savedId?`✓ Lectura guardada localmente · ${savedId.slice(0,8)}`:'La interpretación se mostró, pero el navegador no confirmó el guardado local.'}</div>
  </section>;
}

export function TarotView() {
  const [question,setQuestion]=useState('');
  const [spreadId,setSpreadId]=useState('SPREAD_FTA_03');
  const [method,setMethod]=useState<DrawMethod>('PHYSICAL');
  const [picks,setPicks]=useState<Record<string,Pick>>({});
  const [result,setResult]=useState<InterpretationResult|null>(null);
  const [savedId,setSavedId]=useState<string|null>(null);
  const [deck,setDeck]=useState<PreparedCard[]>([]);
  const [cutDone,setCutDone]=useState(false);
  const [reversals,setReversals]=useState(true);
  const [presentation,setPresentation]=useState<Presentation>('NORMAL');
  const [busy,setBusy]=useState(false);
  const [interpretError,setInterpretError]=useState('');
  const [clarifierBusy,setClarifierBusy]=useState(false);
  const [clarifierMessage,setClarifierMessage]=useState('');

  const spread=spreads.find(item=>item.id===spreadId)!;
  const positions=spread.positions;
  const used=useMemo(()=>new Set(Object.values(picks).map(p=>p.cardId)),[picks]);
  const effectiveQuestion=question.trim()||'Lectura general de la tirada';
  const analysis=useMemo(()=>classifyQuestion(effectiveQuestion),[effectiveQuestion]);
  const recommendations=useMemo(()=>question.trim().length>=3?recommendSpreads(question):[],[question]);
  const cardsReady=positions.every(p=>picks[p.id]);
  const drawnCount=positions.filter(p=>picks[p.id]).length;
  const nextPosition=positions[drawnCount];

  useEffect(()=>{
    const raw=sessionStorage.getItem('oraculo_camera_cards_v1');
    if(!raw)return;
    sessionStorage.removeItem('oraculo_camera_cards_v1');
    try{
      const entries=JSON.parse(raw) as Pick[];
      if(!Array.isArray(entries)||!entries.length)return;
      const preferredByCount:Record<number,string>={1:'SPREAD_ONE_01',3:'SPREAD_FTA_03',5:'SPREAD_DIAG_05',6:'SPREAD_COMM_06',7:'SPREAD_RELATION_07',9:'SPREAD_RELATION_09',10:'SPREAD_CELTIC_10',12:'SPREAD_YEAR_12'};
      const targetId=preferredByCount[entries.length]??'SPREAD_FTA_03';
      const targetSpread=spreads.find(item=>item.id===targetId)??spreads.find(item=>item.cardCount===entries.length)??spreads.find(item=>item.id==='SPREAD_FTA_03')!;
      const next:Record<string,Pick>={};
      targetSpread.positions.slice(0,entries.length).forEach((position,index)=>{const entry=entries[index];if(entry?.cardId&&entry?.orientation)next[position.id]=entry});
      setSpreadId(targetSpread.id);setPicks(next);setMethod('PHYSICAL');
      setInterpretError('');
    }catch{/* entrada de cámara inválida: se ignora */}
  // solo se consume una vez al abrir la pantalla desde Cámara
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function resetDraw() {
    setPicks({});setDeck([]);setCutDone(false);setResult(null);setSavedId(null);setInterpretError('');setBusy(false);
  }
  function changeSpread(id:string){ setSpreadId(id); resetDraw(); }
  function changeMethod(next:DrawMethod){ setMethod(next); resetDraw(); }
  function shuffle(){ setDeck(prepareVirtualDeck(reversals)); setPicks({}); setCutDone(false); setInterpretError(''); }
  function cut(){ if(deck.length && drawnCount===0){ setDeck(prev=>cutVirtualDeck(prev)); setCutDone(true); } }
  function drawNext(){ if(!nextPosition) return; const prepared=deck[drawnCount]; if(!prepared) return; setPicks(prev=>({...prev,[nextPosition.id]:prepared})); }
  function undoVirtual(){ if(drawnCount===0) return; const position=positions[drawnCount-1]; setPicks(prev=>{ const copy={...prev}; delete copy[position.id]; return copy; }); }

  async function interpret(){
    if(!cardsReady||busy) return;
    setBusy(true);setInterpretError('');setSavedId(null);
    try{
      const questionAnalysis=classifyQuestion(effectiveQuestion);
      const request={
        schemaVersion:'1.0' as const,
        requestId:crypto.randomUUID(),
        question:{text:effectiveQuestion,language:'es' as const,category:questionAnalysis.category,type:questionAnalysis.type,temporalScope:questionAnalysis.temporalScope},
        spread:{id:spread.id,version:spread.version},
        cards:positions.map(position=>({positionId:position.id,cardId:picks[position.id].cardId,orientation:picks[position.id].orientation})),
        options:{depth:'NORMAL' as const,style:'NORMAL' as const,drawMethod:method,reversalsEnabled:reversals},
        versions:{content:'1.0.0',engine:'0.6.0'},
      };
      const interpreted=interpretTarot(request);
      setResult(interpreted);
      try{ setSavedId(await saveInterpretedReading(request,interpreted)); }catch{ setSavedId(null); }
    }catch(error){setInterpretError(errorMessage(error));}
    finally{setBusy(false);}
  }

  async function addClarifier(positionId:string,cardId:string,orientation:Orientation){
    if(!savedId||clarifierBusy)return;
    setClarifierBusy(true);setClarifierMessage('');
    try{
      const revised=await addClarifierRevision(savedId,positionId,cardId,orientation);
      setResult(revised.result);
      setClarifierMessage('Aclaratoria añadida. La lectura original se conserva como revisión anterior.');
    }catch(error){
      const message=error instanceof Error?error.message:String(error);
      setClarifierMessage(message==='CLARIFIER_LIMIT'?'Esta posición ya alcanzó el máximo de 2 aclaratorias.':message==='CARD_DUPLICATE'?'Esa carta ya está presente en la lectura.':'No se pudo añadir la aclaratoria.');
    }finally{setClarifierBusy(false)}
  }

  if(result) return <ReadingResult result={result} spreadName={spread.name} savedId={savedId} presentation={presentation} setPresentation={setPresentation} restart={resetDraw} onClarifier={addClarifier} clarifierBusy={clarifierBusy} clarifierMessage={clarifierMessage}/>;

  return <section className="page">
    <span className="eyebrow">NUEVA LECTURA · ORÁCULO TAROT 1.0 BETA 6</span>
    <h1>{spread.name}</h1>
    <p className="muted">Saca las cartas y ORÁCULO TAROT mostrará la imagen Rider–Waite y la interpretación contextual. La pregunta es recomendable, pero ya no bloquea la lectura.</p>

    <label className="field"><span>Pregunta (recomendada)</span><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="¿Qué siente por mí y qué intención tiene?" /></label>
    {!question.trim()&&<div className="notice-card info">Sin pregunta escrita: al interpretar se usará <b>“Lectura general de la tirada”</b>.</div>}

    {recommendations.length>0 && <div className="recommend-box">
      <div className="section-title compact"><h2>Tirada recomendada</h2><span>{categoryLabel[analysis.category]??'General'}</span></div>
      {recommendations.map((rec,index)=><button key={rec.spread.id} className={`recommend-card ${spreadId===rec.spread.id?'active':''}`} onClick={()=>changeSpread(rec.spread.id)}><div><b>{index===0?'★ ':''}{rec.spread.name}</b><span>{rec.spread.cardCount} cartas · compatibilidad {rec.score}/100</span></div><p>{rec.reason}</p></button>)}
    </div>}

    <label className="field"><span>Tipo de tirada</span><select value={spreadId} onChange={e=>changeSpread(e.target.value)}>{spreads.map(s=><option value={s.id} key={s.id}>{s.name} · {s.cardCount} cartas</option>)}</select></label>

    <div className="section-title"><h2>Método</h2><span>{method==='PHYSICAL'?'mazo propio':'mazo digital'}</span></div>
    <div className="method-grid">
      <button className={method==='PHYSICAL'?'selected':''} onClick={()=>changeMethod('PHYSICAL')}><b>🃏 Cartas físicas</b><span>Introduce las cartas que saques de tu mazo.</span></button>
      <button className={method==='VIRTUAL'?'selected':''} onClick={()=>changeMethod('VIRTUAL')}><b>✦ Tirada virtual</b><span>Barajado seguro, corte opcional e invertidas.</span></button>
    </div>

    {method==='PHYSICAL' ? <div className="physical-entry">
      {positions.map((position,index)=>{const pick=picks[position.id];const selected=pick?tarotCardById.get(pick.cardId):undefined;return <div className="position-picker" key={position.id}>
        <div className="position-label"><span>{index+1}</span><b>{position.label}</b></div>
        {selected&&<div className="picked-card-row"><TarotCardImage card={selected} orientation={pick.orientation} className="picked-card-image"/><div><b>{selected.name}</b><small>{pick.orientation==='UPRIGHT'?'Derecha':'Invertida'}</small></div></div>}
        <select value={pick?.cardId??''} onChange={e=>setPicks(prev=>({...prev,[position.id]:{cardId:e.target.value,orientation:prev[position.id]?.orientation??'UPRIGHT'}}))}>
          <option value="">Seleccionar carta…</option>
          {tarotCards.map(card=><option key={card.id} value={card.id} disabled={used.has(card.id)&&pick?.cardId!==card.id}>{card.name}</option>)}
        </select>
        {pick && <div className="orientation-switch"><button type="button" className={pick.orientation==='UPRIGHT'?'selected':''} onClick={()=>setPicks(prev=>({...prev,[position.id]:{...prev[position.id],orientation:'UPRIGHT'}}))}>↑ Derecha</button><button type="button" className={pick.orientation==='REVERSED'?'selected':''} onClick={()=>setPicks(prev=>({...prev,[position.id]:{...prev[position.id],orientation:'REVERSED'}}))}>↓ Invertida</button></div>}
      </div>})}
    </div> : <div className="virtual-table">
      <div className="virtual-deck-row"><TarotCardBack className="deck-back"/><div><b>Mazo Rider–Waite</b><small>{deck.length?`${78-drawnCount} cartas disponibles${cutDone?' · corte realizado':''}`:'Baraja para iniciar'}</small></div></div>
      <label className="toggle-line"><input type="checkbox" checked={reversals} onChange={e=>{setReversals(e.target.checked);resetDraw()}}/><span>Permitir invertidas</span></label>
      <div className="deck-actions"><button onClick={shuffle}>{deck.length?'Barajar de nuevo':'Barajar mazo'}</button><button disabled={!deck.length||drawnCount>0} onClick={cut}>Cortar</button></div>
      <div className="virtual-spread-preview">{positions.map((position,index)=>{
        const pick=picks[position.id]; const card=pick?tarotCardById.get(pick.cardId):null;
        return <div className={pick?'filled':''} key={position.id}><span>{index+1}</span>{card?<TarotCardImage card={card} orientation={pick!.orientation} className="spread-card-image" eager/>:<TarotCardBack className="spread-card-back"/>}<b>{position.label}</b><small>{card?`${card.name} ${pick!.orientation==='UPRIGHT'?'↑':'↓'}`:'Pendiente'}</small></div>;
      })}</div>
      {deck.length>0 && nextPosition && <button className="primary-cta" onClick={drawNext}>Sacar carta · {nextPosition.label}</button>}
      {drawnCount>0 && <button className="secondary-cta" onClick={undoVirtual}>Deshacer última carta</button>}
    </div>}

    {!cardsReady&&<div className="notice-card info">Faltan {positions.length-drawnCount} carta{positions.length-drawnCount===1?'':'s'} para completar la tirada.</div>}
    {interpretError&&<div className="notice-card error"><b>Error de interpretación</b><span>{interpretError}</span></div>}
    <button className="primary-cta" disabled={!cardsReady||busy} onClick={()=>void interpret()}>{busy?'Interpretando…':cardsReady?'Interpretar tirada':`Faltan ${positions.length-drawnCount} carta${positions.length-drawnCount===1?'':'s'}`}</button>
  </section>;
}
