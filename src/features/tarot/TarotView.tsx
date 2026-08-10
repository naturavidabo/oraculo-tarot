import { useMemo, useState } from 'react';
import { tarotCards, tarotCardById } from '../../data/cards';
import { spreads } from '../../data/spreads';
import { interpretTarot } from '../../engine/tarotEngine';
import type { Orientation, TarotDimension } from '../../types/tarot';
import type { InterpretationResult } from '../../engine/contracts';
import { saveInterpretedReading } from '../../db/readings';
import { dimensionLabels } from '../../engine/contextProfile';
import { classifyQuestion, recommendSpreads } from '../../engine/questionClassifier';
import { cutVirtualDeck, prepareVirtualDeck, type PreparedCard } from '../../engine/drawEngine';

type Pick = { cardId:string; orientation:Orientation };
type DrawMethod = 'PHYSICAL'|'VIRTUAL';
type Presentation = 'QUICK'|'NORMAL'|'DEEP'|'TEACHER';

function ReadingResult({
  result, spreadName, savedId, presentation, setPresentation, restart,
}:{
  result:InterpretationResult;
  spreadName:string;
  savedId:string|null;
  presentation:Presentation;
  setPresentation:(mode:Presentation)=>void;
  restart:()=>void;
}){
  const topDimensions=Object.entries(result.dimensions)
    .sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))
    .slice(0,presentation==='DEEP'||presentation==='TEACHER'?10:6);
  const showNormal=presentation!=='QUICK';
  const showDeep=presentation==='DEEP'||presentation==='TEACHER';
  const showTeacher=presentation==='TEACHER';

  return <section className="page">
    <button className="text-button" onClick={restart}>← Nueva lectura</button>
    <span className="eyebrow">ORÁCULO TAROT · MOTOR 0.4</span>
    <h1>{result.headline}</h1>
    <p className="lead">{result.directAnswer}</p>

    <div className="mode-switch">
      {(['QUICK','NORMAL','DEEP','TEACHER'] as Presentation[]).map(mode=><button key={mode} className={presentation===mode?'selected':''} onClick={()=>setPresentation(mode)}>{mode==='QUICK'?'Rápida':mode==='NORMAL'?'Normal':mode==='DEEP'?'Profunda':'Profesor'}</button>)}
    </div>

    <div className="status-card">
      <div><strong>{result.confidence.replace('_',' ')}</strong><span>confianza</span></div>
      <div><strong>{result.motifs.length}</strong><span>patrones</span></div>
      <div><strong>{result.tensions.length}</strong><span>tensiones</span></div>
    </div>

    <div className="reading-strip adaptive">{result.sections.map(section=>{
      const card=tarotCardById.get(section.cardId)!;
      return <div key={section.positionId}>
        <div className="tarot-placeholder"><span>{card.number ?? '✦'}</span></div>
        <b>{card.name}</b>
        <small>{section.label} · {section.orientation==='UPRIGHT'?'↑':'↓'}</small>
      </div>;
    })}</div>

    {showNormal && <>
      <div className="section-title"><h2>Lectura por posición</h2><span>{spreadName}</span></div>
      <div className="why-list">{result.sections.map(section=><div key={section.positionId}><b>{section.label} · {section.cardName}</b><p>{section.text}</p></div>)}</div>

      {!!result.motifs.length && <><div className="section-title"><h2>Patrones detectados</h2></div><div className="chips">{result.motifs.map(m=><span key={m}>{m.replaceAll('_',' ')}</span>)}</div></>}
      {!!result.tensions.length && <><div className="section-title"><h2>Tensiones</h2></div><div className="chips">{result.tensions.map(m=><span key={m}>{m.replaceAll('_',' ')}</span>)}</div></>}
      {!!result.specialCombinations.length && <><div className="section-title"><h2>Combinaciones especiales</h2><span>{result.specialCombinations.length}</span></div><div className="why-list">{result.specialCombinations.map(combo=><div key={combo.id}><b>{combo.label}</b><p>{combo.explanation}</p></div>)}</div></>}

      <div className="section-title"><h2>¿Por qué?</h2><span>{result.confidence}</span></div>
      <div className="why-list">{result.why.map(item=><div key={item.claim}><b>{item.claim.replaceAll('_',' ')}</b><p>{item.explanation}</p></div>)}</div>
    </>}

    {showDeep && <>
      <div className="section-title"><h2>Perfil simbólico</h2><span>0–5 / ejes ±5</span></div>
      <div className="vector-list">{topDimensions.map(([key,value])=><div key={key}><span>{dimensionLabels[key as TarotDimension]??key}</span><b>{value.toFixed(1)}</b></div>)}</div>
      {!!result.transitions.length && <><div className="section-title"><h2>Secuencia</h2><span>mecanismos</span></div><div className="transition-line">{result.transitions.map((t,i)=><span key={`${t}-${i}`}>{t.replaceAll('_',' ')}</span>)}</div></>}
      {!!result.sequencePatterns.length && <><div className="section-title"><h2>Patrones de secuencia</h2><span>v0.4</span></div><div className="chips">{result.sequencePatterns.map(p=><span key={p}>{p.replaceAll('_',' ')}</span>)}</div></>}
      {!!result.safeguards.length && <><div className="section-title"><h2>Lectura responsable</h2></div><div className="why-list safeguards">{result.safeguards.map(text=><div key={text}><p>{text}</p></div>)}</div></>}
    </>}

    {showTeacher && <>
      <div className="section-title"><h2>Modo Profesor</h2><span>carta por carta</span></div>
      <div className="teacher-grid">{result.sections.map(section=>{
        const card=tarotCardById.get(section.cardId)!;
        return <article key={section.positionId}><b>{section.label} · {card.name}</b><p>{card.teacherNote}</p><small>Mecanismo: {card.mechanism.replaceAll('_',' ')}</small></article>;
      })}</div>
    </>}

    <p className="muted">{savedId?`Guardada localmente · ${savedId.slice(0,8)} · Content 1.0.0 · Engine 0.4.0`:'La lectura se interpretó; el guardado local requiere IndexedDB disponible.'}</p>
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

  const spread=spreads.find(item=>item.id===spreadId)!;
  const positions=spread.positions;
  const used=useMemo(()=>new Set(Object.values(picks).map(p=>p.cardId)),[picks]);
  const analysis=useMemo(()=>classifyQuestion(question),[question]);
  const recommendations=useMemo(()=>question.trim().length>=3?recommendSpreads(question):[],[question]);
  const ready=question.trim().length>=3 && positions.every(p=>picks[p.id]);
  const drawnCount=positions.filter(p=>picks[p.id]).length;
  const nextPosition=positions[drawnCount];

  function resetDraw() {
    setPicks({});
    setDeck([]);
    setCutDone(false);
    setResult(null);
    setSavedId(null);
  }
  function changeSpread(id:string){ setSpreadId(id); resetDraw(); }
  function changeMethod(next:DrawMethod){ setMethod(next); resetDraw(); }
  function shuffle(){ setDeck(prepareVirtualDeck(reversals)); setPicks({}); setCutDone(false); }
  function cut(){ if(deck.length && drawnCount===0){ setDeck(prev=>cutVirtualDeck(prev)); setCutDone(true); } }
  function drawNext(){
    if(!nextPosition) return;
    const prepared=deck[drawnCount];
    if(!prepared) return;
    setPicks(prev=>({...prev,[nextPosition.id]:prepared}));
  }
  function undoVirtual(){
    if(drawnCount===0) return;
    const position=positions[drawnCount-1];
    setPicks(prev=>{ const copy={...prev}; delete copy[position.id]; return copy; });
  }

  async function interpret(){
    const request={
      schemaVersion:'1.0' as const,
      requestId:crypto.randomUUID(),
      question:{
        text:question,
        language:'es' as const,
        category:analysis.category,
        type:analysis.type,
        temporalScope:analysis.temporalScope,
      },
      spread:{id:spread.id,version:spread.version},
      cards:positions.map(position=>({positionId:position.id,cardId:picks[position.id].cardId,orientation:picks[position.id].orientation})),
      options:{depth:'NORMAL' as const,style:'NORMAL' as const,drawMethod:method,reversalsEnabled:reversals},
      versions:{content:'1.0.0',engine:'0.4.0'},
    };
    const interpreted=interpretTarot(request);
    setResult(interpreted);
    try{ setSavedId(await saveInterpretedReading(request,interpreted)); }catch{ setSavedId(null); }
  }

  if(result) return <ReadingResult result={result} spreadName={spread.name} savedId={savedId} presentation={presentation} setPresentation={setPresentation} restart={resetDraw}/>;

  return <section className="page">
    <span className="eyebrow">NUEVA LECTURA · ORÁCULO TAROT 0.4</span>
    <h1>{spread.name}</h1>
    <p className="muted">Escribe tu pregunta, deja que ORÁCULO TAROT sugiera la tirada y elige entre tus cartas físicas o el mazo virtual.</p>

    <label className="field"><span>Pregunta</span><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="¿Qué siente por mí y qué intención tiene?" /></label>

    {recommendations.length>0 && <div className="recommend-box">
      <div className="section-title compact"><h2>Tirada recomendada</h2><span>{analysis.category}</span></div>
      {recommendations.map((rec,index)=><button key={rec.spread.id} className={`recommend-card ${spreadId===rec.spread.id?'active':''}`} onClick={()=>changeSpread(rec.spread.id)}>
        <div><b>{index===0?'★ ':''}{rec.spread.name}</b><span>{rec.spread.cardCount} cartas · compatibilidad {rec.score}/100</span></div><p>{rec.reason}</p>
      </button>)}
    </div>}

    <label className="field"><span>Tipo de tirada</span><select value={spreadId} onChange={e=>changeSpread(e.target.value)}>{spreads.map(s=><option value={s.id} key={s.id}>{s.name} · {s.cardCount} cartas</option>)}</select></label>

    <div className="section-title"><h2>Método</h2><span>{method==='PHYSICAL'?'mazo propio':'mazo digital'}</span></div>
    <div className="method-grid">
      <button className={method==='PHYSICAL'?'selected':''} onClick={()=>changeMethod('PHYSICAL')}><b>🃏 Cartas físicas</b><span>Introduce las cartas que saques de tu mazo.</span></button>
      <button className={method==='VIRTUAL'?'selected':''} onClick={()=>changeMethod('VIRTUAL')}><b>✦ Tirada virtual</b><span>Barajado seguro, corte opcional e invertidas.</span></button>
    </div>

    {method==='PHYSICAL' ? <div className="physical-entry">
      {positions.map((position,index)=><div className="position-picker" key={position.id}>
        <div className="position-label"><span>{index+1}</span><b>{position.label}</b></div>
        <select value={picks[position.id]?.cardId??''} onChange={e=>setPicks(prev=>({...prev,[position.id]:{cardId:e.target.value,orientation:prev[position.id]?.orientation??'UPRIGHT'}}))}>
          <option value="">Seleccionar carta…</option>
          {tarotCards.map(card=><option key={card.id} value={card.id} disabled={used.has(card.id)&&picks[position.id]?.cardId!==card.id}>{card.name}</option>)}
        </select>
        {picks[position.id] && <div className="orientation-switch"><button type="button" className={picks[position.id].orientation==='UPRIGHT'?'selected':''} onClick={()=>setPicks(prev=>({...prev,[position.id]:{...prev[position.id],orientation:'UPRIGHT'}}))}>↑ Derecha</button><button type="button" className={picks[position.id].orientation==='REVERSED'?'selected':''} onClick={()=>setPicks(prev=>({...prev,[position.id]:{...prev[position.id],orientation:'REVERSED'}}))}>↓ Invertida</button></div>}
      </div>)}
    </div> : <div className="virtual-table">
      <div className="virtual-controls">
        <label className="toggle-line"><input type="checkbox" checked={reversals} onChange={e=>{setReversals(e.target.checked);resetDraw()}}/><span>Permitir invertidas</span></label>
        <div className="deck-actions"><button onClick={shuffle}>{deck.length?'Barajar de nuevo':'Barajar mazo'}</button><button disabled={!deck.length||drawnCount>0} onClick={cut}>Cortar</button></div>
        <p className="muted">{deck.length?`Mazo preparado · ${78-drawnCount} cartas disponibles${cutDone?' · corte realizado':''}`:'Baraja para preparar las 78 cartas.'}</p>
      </div>
      <div className="virtual-spread-preview">{positions.map((position,index)=>{
        const pick=picks[position.id]; const card=pick?tarotCardById.get(pick.cardId):null;
        return <div className={pick?'filled':''} key={position.id}><span>{index+1}</span><b>{position.label}</b><small>{card?`${card.name} ${pick.orientation==='UPRIGHT'?'↑':'↓'}`:'Pendiente'}</small></div>;
      })}</div>
      {deck.length>0 && nextPosition && <button className="primary-cta" onClick={drawNext}>Sacar carta · {nextPosition.label}</button>}
      {drawnCount>0 && <button className="secondary-cta" onClick={undoVirtual}>Deshacer última carta</button>}
    </div>}

    <button className="primary-cta" disabled={!ready} onClick={interpret}>Interpretar tirada</button>
  </section>;
}
