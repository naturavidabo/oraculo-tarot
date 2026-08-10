import { useEffect, useMemo, useState } from 'react';
import { db, type EvaluationRow, type InterpretationRow, type ReadingCardRow, type ReadingRow, type ReadingRevisionRow } from '../../db/schema';
import { spreads } from '../../data/spreads';
import { tarotCards, tarotCardById } from '../../data/cards';
import { addClarifierRevision, saveEvaluation } from '../../db/readings';
import type { Orientation } from '../../types/tarot';
import { TarotCardImage } from '../../components/TarotCardImage';
import { claimLabel, confidenceLabel, humanCode, motifLabel } from '../../engine/presentationLabels';

type HistoryItem = {
  reading:ReadingRow; cards:ReadingCardRow[]; interpretation?:InterpretationRow; favorite:boolean;
  evaluation?:EvaluationRow; revisions:ReadingRevisionRow[];
};

async function loadHistory():Promise<HistoryItem[]> {
  const rows=await db.readings.orderBy('createdAt').reverse().toArray();
  const favorites=await db.favorites.where('type').equals('READING').toArray();
  const favoriteIds=new Set(favorites.map(f=>f.targetId));
  return Promise.all(rows.map(async reading=>{
    const revisionId=reading.currentRevisionId;
    const cards=revisionId?await db.readingCards.where('revisionId').equals(revisionId).sortBy('positionOrder'):[];
    const interpretation=revisionId?await db.interpretations.where('revisionId').equals(revisionId).last():undefined;
    const evaluation=await db.evaluations.where('readingId').equals(reading.id).first();
    const revisions=await db.readingRevisions.where('readingId').equals(reading.id).sortBy('revisionNumber');
    return {reading,cards,interpretation,favorite:favoriteIds.has(reading.id),evaluation,revisions};
  }));
}

const evaluationLabels:Record<string,string>={MATCHED:'Coincidió',PARTIAL:'Parcialmente',NOT_MATCHED:'No coincidió',INDETERMINATE:'Indeterminado'};

export function HistoryView({back}:{back:()=>void}){
  const [items,setItems]=useState<HistoryItem[]>([]);
  const [selected,setSelected]=useState<HistoryItem|null>(null);
  const [query,setQuery]=useState('');
  const [clarifierPosition,setClarifierPosition]=useState('');
  const [clarifierCard,setClarifierCard]=useState('');
  const [clarifierOrientation,setClarifierOrientation]=useState<Orientation>('UPRIGHT');
  const [busy,setBusy]=useState(false);
  const [evalValue,setEvalValue]=useState<'MATCHED'|'PARTIAL'|'NOT_MATCHED'|'INDETERMINATE'>('INDETERMINATE');
  const [evalDate,setEvalDate]=useState('');
  const [evalNotes,setEvalNotes]=useState('');

  async function reload(selectId?:string){
    const next=await loadHistory(); setItems(next);
    if(selectId) {
      const item=next.find(x=>x.reading.id===selectId)??null; setSelected(item);
      if(item?.evaluation){setEvalValue(item.evaluation.evaluation);setEvalDate(item.evaluation.observedDate??'');setEvalNotes(item.evaluation.notes??'');}
    }
  }
  useEffect(()=>{ void reload(); },[]);

  const filtered=useMemo(()=>{
    const q=query.trim().toLocaleLowerCase('es');
    if(!q) return items;
    return items.filter(item=>item.reading.question.toLocaleLowerCase('es').includes(q) || (spreads.find(s=>s.id===item.reading.spreadId)?.name.toLocaleLowerCase('es').includes(q)??false));
  },[items,query]);

  async function toggleFavorite(item:HistoryItem){
    const existing=await db.favorites.where('targetId').equals(item.reading.id).filter(f=>f.type==='READING').first();
    if(existing) await db.favorites.delete(existing.id);
    else await db.favorites.add({id:crypto.randomUUID(),type:'READING',targetId:item.reading.id,createdAt:new Date().toISOString()});
    await reload(item.reading.id);
  }

  async function addClarifier(){
    if(!selected||!clarifierPosition||!clarifierCard) return;
    setBusy(true);
    try{
      await addClarifierRevision(selected.reading.id,clarifierPosition,clarifierCard,clarifierOrientation);
      setClarifierCard(''); setClarifierPosition(''); setClarifierOrientation('UPRIGHT');
      await reload(selected.reading.id);
    } finally {setBusy(false)}
  }

  async function evaluate(){
    if(!selected?.reading.currentRevisionId) return;
    setBusy(true);
    try{await saveEvaluation(selected.reading.id,selected.reading.currentRevisionId,evalValue,evalNotes,evalDate);await reload(selected.reading.id);}
    finally{setBusy(false)}
  }

  if(selected){
    const spread=spreads.find(s=>s.id===selected.reading.spreadId);
    const result=selected.interpretation?.structuredResult;
    const used=new Set(selected.cards.map(c=>c.cardId));
    const primaryCards=selected.cards.filter(c=>!c.isClarifier);
    const clarifiers=selected.cards.filter(c=>c.isClarifier);
    return <section className="page">
      <button className="text-button" onClick={()=>setSelected(null)}>← Historial</button>
      <span className="eyebrow">LECTURA GUARDADA · REVISIÓN {selected.revisions.length}</span>
      <h1>{result?.headline??spread?.name??'Lectura'}</h1>
      <p className="lead">{selected.reading.question}</p>
      <div className="history-meta"><span>{spread?.name??selected.reading.spreadId}</span><span>{selected.reading.drawMethod==='VIRTUAL'?'Tirada virtual':'Cartas físicas'}</span><span>{new Date(selected.reading.createdAt).toLocaleString('es-BO')}</span></div>
      <button className="secondary-cta" onClick={()=>void toggleFavorite(selected)}>{selected.favorite?'★ Quitar de favoritas':'☆ Marcar favorita'}</button>

      <div className="reading-strip adaptive result-cards">{primaryCards.map(entry=>{const card=tarotCardById.get(entry.cardId);return <div key={entry.id}>{card?<TarotCardImage card={card} orientation={entry.orientation} className="history-card-image"/>:<div className="tarot-image-fallback"><span>✦</span></div>}<b>{card?.name??entry.cardId}</b><small>{entry.orientation==='UPRIGHT'?'↑ Derecha':'↓ Invertida'}</small></div>})}</div>
      {!!clarifiers.length&&<div className="clarifier-list"><b>Aclaratorias activas</b>{clarifiers.map(c=><span key={c.id}>{spreads.find(s=>s.id===selected.reading.spreadId)?.positions.find(p=>p.id===c.parentPositionId)?.label??c.parentPositionId}: {tarotCardById.get(c.cardId)?.name} {c.orientation==='UPRIGHT'?'↑':'↓'}</span>)}</div>}

      {result && <>
        <div className="section-title"><h2>Interpretación actual</h2><span>{confidenceLabel[result.confidence]??result.confidence}</span></div>
        <p className="lead compact-lead">{result.directAnswer}</p>
        {result.globalInterpretation&&<div className="interpretation-main history-interpretation"><span className="eyebrow">INTERPRETACIÓN GENERAL</span><p>{result.globalInterpretation}</p></div>}
        <div className="why-list">{result.sections.map(section=><div key={section.positionId}><b>{section.label} · {section.cardName}</b><p>{section.text}</p></div>)}</div>
        {!!result.specialCombinations?.length&&<><div className="section-title"><h2>Combinaciones especiales</h2><span>{result.specialCombinations.length}</span></div><div className="why-list">{result.specialCombinations.map(combo=><div key={combo.id}><b>{combo.label}</b><p>{combo.explanation}</p></div>)}</div></>}
        {!!result.sequencePatterns?.length&&<><div className="section-title"><h2>Secuencias</h2></div><div className="chips">{result.sequencePatterns.map(p=><span key={p}>{humanCode(p,motifLabel)}</span>)}</div></>}
        {result.conclusion&&<><div className="section-title"><h2>Conclusión</h2><span>tendencia</span></div><div className="conclusion-card"><p>{result.conclusion}</p></div></>}
        <details className="explanation-details"><summary>¿Por qué esta interpretación?</summary><div className="why-list">{result.why.map((item,index)=><div key={`${item.claim}-${index}`}><b>{humanCode(item.claim,claimLabel)}</b><p>{item.explanation}</p></div>)}</div></details>
      </>}

      <div className="section-title"><h2>Añadir aclaratoria</h2><span>crea nueva revisión</span></div>
      <div className="clarifier-form">
        <select value={clarifierPosition} onChange={e=>setClarifierPosition(e.target.value)}><option value="">Posición a aclarar…</option>{spread?.positions.map(p=><option value={p.id} key={p.id}>{p.label}</option>)}</select>
        <select value={clarifierCard} onChange={e=>setClarifierCard(e.target.value)}><option value="">Carta aclaratoria…</option>{tarotCards.map(card=><option key={card.id} value={card.id} disabled={used.has(card.id)}>{card.name}</option>)}</select>
        <div className="orientation-switch"><button className={clarifierOrientation==='UPRIGHT'?'selected':''} onClick={()=>setClarifierOrientation('UPRIGHT')}>↑ Derecha</button><button className={clarifierOrientation==='REVERSED'?'selected':''} onClick={()=>setClarifierOrientation('REVERSED')}>↓ Invertida</button></div>
        <button className="secondary-cta" disabled={busy||!clarifierPosition||!clarifierCard} onClick={()=>void addClarifier()}>+ Añadir y reinterpretar</button>
      </div>
      <p className="muted">La aclaratoria no borra la lectura original: ORÁCULO TAROT conserva cada revisión.</p>

      <div className="section-title"><h2>Resultado observado</h2><span>registro personal</span></div>
      <div className="evaluation-form">
        <select value={evalValue} onChange={e=>setEvalValue(e.target.value as typeof evalValue)}>{Object.entries(evaluationLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <input type="date" value={evalDate} onChange={e=>setEvalDate(e.target.value)}/>
        <textarea placeholder="¿Qué ocurrió realmente?" value={evalNotes} onChange={e=>setEvalNotes(e.target.value)}/>
        <button className="secondary-cta" disabled={busy} onClick={()=>void evaluate()}>Guardar evaluación</button>
      </div>
      {selected.evaluation&&<div className="notice-card"><b>{evaluationLabels[selected.evaluation.evaluation]}</b>{selected.evaluation.notes&&<span>{selected.evaluation.notes}</span>}</div>}

      <div className="section-title"><h2>Historial de revisiones</h2><span>{selected.revisions.length}</span></div>
      <div className="revision-list">{selected.revisions.map(r=><div key={r.id}><b>Revisión {r.revisionNumber}</b><span>{r.reason}</span><small>{new Date(r.createdAt).toLocaleString('es-BO')}</small></div>)}</div>
      <p className="muted">Contenido {selected.interpretation?.contentVersion??'—'} · Motor {selected.interpretation?.engineVersion??'—'}.</p>
    </section>;
  }

  return <section className="page">
    <button className="text-button" onClick={back}>← Tarot</button>
    <span className="eyebrow">HISTORIAL · LOCAL</span><h1>Mis lecturas</h1>
    <input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar pregunta o tirada…" />
    {filtered.length===0?<div className="empty">Todavía no existen lecturas que coincidan.</div>:<div className="history-list">{filtered.map(item=>{
      const spread=spreads.find(s=>s.id===item.reading.spreadId);
      return <article key={item.reading.id} className="history-card" onClick={()=>{setSelected(item);if(item.evaluation){setEvalValue(item.evaluation.evaluation);setEvalDate(item.evaluation.observedDate??'');setEvalNotes(item.evaluation.notes??'')}}}>
        <div className="history-title"><b>{item.favorite?'★ ':''}{spread?.name??item.reading.spreadId}</b><span>{item.reading.drawMethod==='VIRTUAL'?'Virtual':'Física'}</span></div>
        <p>{item.reading.question}</p>
        <div className="mini-cards">{item.cards.filter(c=>!c.isClarifier).slice(0,5).map(c=><span key={c.id}>{tarotCardById.get(c.cardId)?.name??c.cardId}</span>)}</div>
        <small>{new Date(item.reading.createdAt).toLocaleString('es-BO')} · Rev. {item.revisions.length} · {item.evaluation?evaluationLabels[item.evaluation.evaluation]:'sin evaluar'}</small>
      </article>;
    })}</div>}
  </section>;
}
