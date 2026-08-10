import { tarotCardById } from '../data/cards';
import { spreads } from '../data/spreads';
import type { Orientation, TarotCard, TarotDimension } from '../types/tarot';
import { contextProfiles, dimensionLabels } from './contextProfile';
import { interpretationRequestSchema, interpretationResultSchema, type InterpretationRequest, type InterpretationResult } from './contracts';
import { detectSequencePatterns, detectSpecialCombinations, motifList, tensionList } from './semanticRules';

const clamp = (value:number, min=-5, max=5) => Math.max(min, Math.min(max, value));
const round = (n:number) => Number(n.toFixed(2));

const expressionSensitive = new Set<TarotDimension>([
  'movement','openness','communication','manifestation','initiative','actionImpulse','visibility',
  'reciprocity','practicalReciprocity','practicalCommitment','bondAvailability','longTermStability','stability'
]);
const shadowAmplified = new Set<TarotDimension>([
  'conflict','uncertainty','secrecy','attachment','retention','fear','fantasy','burden','hostility'
]);

function orientedVectors(card:TarotCard, orientation:Orientation): Partial<Record<TarotDimension,number>> {
  if (orientation === 'UPRIGHT') return card.vectors;
  const result:Partial<Record<TarotDimension,number>> = {};
  for (const [key, rawValue] of Object.entries(card.vectors) as [TarotDimension,number][]) {
    let value = rawValue;
    if (expressionSensitive.has(key)) value = value >= 0 ? value * .55 : value * 1.08;
    else if (shadowAmplified.has(key)) value = value >= 0 ? value * 1.08 : value;
    else value = value * .85;
    const adjustment = card.reversal.adjustments?.[key] ?? 0;
    result[key] = clamp(value + adjustment);
  }
  return result;
}

function level(value:number, positive=true) {
  const v = positive ? value : -value;
  if (v >= 4.25) return 'muy alto';
  if (v >= 3.25) return 'alto';
  if (v >= 2.25) return 'medio';
  if (v >= 1) return 'bajo';
  return 'muy bajo';
}

function cardPositionText(card:TarotCard, orientation:Orientation, context:string, vectors:Partial<Record<TarotDimension,number>>, clarifier=false) {
  const profile = contextProfiles[context as keyof typeof contextProfiles] ?? contextProfiles.general;
  const relevant = Object.entries(vectors)
    .map(([dimension,value]) => ({
      dimension:dimension as TarotDimension,
      value:value as number,
      relevance:Math.abs(profile[dimension as TarotDimension] ?? .15),
    }))
    .filter(item => item.relevance > .15)
    .sort((a,b)=> (Math.abs(b.value)*b.relevance) - (Math.abs(a.value)*a.relevance))
    .slice(0,2);

  const orientationText = orientation === 'REVERSED' ? ` En invertida, ${card.reversal.summary.charAt(0).toLowerCase()}${card.reversal.summary.slice(1)}` : '';
  const emphasis = relevant.length
    ? ` Aquí pesan especialmente ${relevant.map(r => `${dimensionLabels[r.dimension] ?? r.dimension} (${level(Math.abs(r.value))})`).join(' y ')}.`
    : '';
  const prefix=clarifier?'Como aclaratoria, matiza la posición principal: ':'';
  return `${prefix}${card.quick}${orientationText}${emphasis}`;
}

function claimsFor(motifs:string[], tensions:string[], evidence:Record<string,string[]>): InterpretationResult['claims'] {
  const claims:InterpretationResult['claims']=[];
  let n=1;
  const push=(concept:string,strength:InterpretationResult['claims'][number]['strength'],confidence:InterpretationResult['confidence'])=>{
    claims.push({id:`CLAIM_${String(n++).padStart(2,'0')}`,concept,strength,confidence,evidence:evidence[concept] ?? []});
  };
  if (motifs.includes('DEEP_FEELING')) push('HIGH_EMOTION','SUPPORTED','HIGH');
  if (motifs.includes('HIGH_DESIRE')) push('HIGH_DESIRE','SUPPORTED','HIGH');
  if (motifs.includes('DESIRE_WITH_ACTION')) push('DESIRE_CAN_MOVE','PROBABLE_SYMBOLIC','MEDIUM_HIGH');
  if (motifs.includes('DESIRE_BLOCKED')) push('DESIRE_MANIFESTATION_LIMITED','SUPPORTED','MEDIUM_HIGH');
  if (motifs.includes('FEELING_RESTRAINED')) push('EMOTION_RESTRAINED','SUPPORTED','MEDIUM_HIGH');
  if (motifs.includes('COMMUNICATION_OPENING')) push('COMMUNICATION_FAVORED','PROBABLE_SYMBOLIC','MEDIUM_HIGH');
  if (motifs.includes('LONG_TERM_BUILD') || motifs.includes('COMMITMENT_PATTERN')) push('PRACTICAL_STABILITY','SUPPORTED','HIGH');
  if (motifs.includes('HIGH_UNCERTAINTY') || motifs.includes('HIDDEN_INFORMATION')) push('FACTUAL_CERTAINTY_LIMITED','SUPPORTED','HIGH');
  if (motifs.includes('CLOSURE_TRANSFORMATION')) push('CURRENT_FORM_CLOSING','PROBABLE_SYMBOLIC','MEDIUM_HIGH');
  if (motifs.includes('PAST_REACTIVATION')) push('PAST_REEVALUATED','PROBABLE_SYMBOLIC','MEDIUM');
  if (tensions.includes('DESIRE_VS_MANIFESTATION')) push('IMMEDIATE_ACTION','CONTRADICTED','MEDIUM_HIGH');
  return claims;
}

function buildDirectAnswer(motifs:string[], d:Record<string,number>, specialCount:number) {
  const parts:string[]=[];
  if (motifs.includes('DEEP_FEELING')) parts.push('La tirada presenta una carga emocional importante');
  if (motifs.includes('HIGH_DESIRE')) parts.push(parts.length ? 'junto con deseo o atracción intensos' : 'El deseo o la atracción aparecen con mucha intensidad');
  if (motifs.includes('FEELING_RESTRAINED')) parts.push('pero su expresión está contenida');
  if (motifs.includes('DESIRE_BLOCKED')) parts.push('y no existe la misma facilidad para convertir ese impulso en conducta visible');
  if (motifs.includes('COMMUNICATION_OPENING')) parts.push('Aun así, aparecen indicadores simbólicos de movimiento o comunicación');
  if (motifs.includes('LONG_TERM_BUILD') || motifs.includes('COMMITMENT_PATTERN')) parts.push('También existe una base práctica fuerte para sostener o construir a largo plazo');
  if (motifs.includes('HIGH_UNCERTAINTY') || motifs.includes('HIDDEN_INFORMATION')) parts.push('La incertidumbre o reserva es relevante, por lo que conviene evitar conclusiones fácticas tajantes');
  if (motifs.includes('CLOSURE_TRANSFORMATION')) parts.push('La forma actual de la situación atraviesa un cierre o transformación importante');
  if (motifs.includes('PAST_REACTIVATION')) parts.push('Un asunto del pasado aparece simbólicamente reevaluado, sin que ello garantice un regreso efectivo');
  if (specialCount) parts.push(`El motor detectó ${specialCount} combinación${specialCount===1?' curada':'es curadas'} que refuerza la síntesis`);
  if (!parts.length) {
    const ranked=Object.entries(d).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,2);
    if (ranked.length) parts.push(`El patrón dominante se concentra en ${ranked.map(([k])=>dimensionLabels[k as TarotDimension]??k).join(' y ')}`);
    else parts.push('La tirada no reúne todavía una convergencia dominante');
  }
  const raw=parts.join('. ').replace(/\.\s+([a-záéíóúñ])/g, (_,c)=>`. ${c.toUpperCase()}`);
  return `${raw}. Se trata de una lectura simbólica contextual, no de una afirmación factual sobre otra persona.`;
}

function confidenceFor(motifs:string[], tensions:string[], d:Record<string,number>, specialCount:number):InterpretationResult['confidence'] {
  const uncertainty=d.uncertainty??0;
  if (uncertainty>=4.2 && motifs.length<=2 && !specialCount) return 'LOW';
  const score=motifs.length*1.2 + specialCount*.7 - tensions.length*.8 - Math.max(0,uncertainty-3)*.5;
  if (score>=5) return 'HIGH';
  if (score>=3) return 'MEDIUM_HIGH';
  if (score>=1) return 'MEDIUM';
  return 'LOW';
}

function safeguardsFor(cards:TarotCard[], motifs:string[]) {
  const safeguards:string[]=[];
  const ids=new Set(cards.map(c=>c.id));
  if (ids.has('RWS_M_13')) safeguards.push('La Muerte se interpreta como cierre o transformación simbólica, nunca como predicción de muerte física.');
  if (ids.has('RWS_M_18') || ids.has('RWS_S_07')) safeguards.push('Incertidumbre, reserva u ocultamiento no demuestran engaño o infidelidad como hecho.');
  if (ids.has('RWS_S_03')) safeguards.push('El 3 de Espadas puede señalar dolor o separación; por sí solo no prueba infidelidad.');
  if (ids.has('RWS_C_03')) safeguards.push('El 3 de Copas no implica automáticamente una tercera persona.');
  if (ids.has('RWS_S_04')) safeguards.push('Silencio o pausa no equivalen automáticamente a ausencia de sentimientos.');
  if (motifs.includes('HIGH_UNCERTAINTY')) safeguards.push('La tirada muestra incertidumbre elevada; las conclusiones deben formularse con cautela.');
  return safeguards;
}

export function interpretTarot(input:InterpretationRequest):InterpretationResult {
  const parsed=interpretationRequestSchema.parse(input);
  const spread=spreads.find(s=>s.id===parsed.spread.id && s.version===parsed.spread.version);
  if (!spread) throw new Error('SPREAD_UNKNOWN');

  const primaryEntries=parsed.cards.filter(entry=>entry.role==='PRIMARY');
  const clarifierEntries=parsed.cards.filter(entry=>entry.role==='CLARIFIER');
  if (primaryEntries.length!==spread.cardCount) throw new Error('POSITION_COUNT_MISMATCH');

  const positionMap=new Map(spread.positions.map(p=>[p.id,p]));
  const seenPositions=new Set<string>();
  const primaryResolved=primaryEntries.map(entry=>{
    const position=positionMap.get(entry.positionId);
    if (!position) throw new Error('POSITION_UNKNOWN');
    if (seenPositions.has(entry.positionId)) throw new Error('POSITION_DUPLICATE');
    seenPositions.add(entry.positionId);
    const card=tarotCardById.get(entry.cardId);
    if (!card) throw new Error('CARD_UNKNOWN');
    return {entry,position,card,vectors:orientedVectors(card,entry.orientation),role:'PRIMARY' as const};
  });
  if (seenPositions.size!==spread.positions.length) throw new Error('POSITION_MISSING');

  const clarifierResolved=clarifierEntries.map(entry=>{
    const parentId=entry.parentPositionId!;
    const position=positionMap.get(parentId);
    if(!position) throw new Error('CLARIFIER_PARENT_UNKNOWN');
    const card=tarotCardById.get(entry.cardId);
    if(!card) throw new Error('CARD_UNKNOWN');
    return {entry,position,card,vectors:orientedVectors(card,entry.orientation),role:'CLARIFIER' as const};
  });
  const resolved=[...primaryResolved,...clarifierResolved];

  const sums=new Map<TarotDimension,{total:number;weight:number;cards:string[]}>();
  const evidence:Record<string,string[]>={};
  for (const item of resolved) {
    const profile=contextProfiles[item.position.context] ?? contextProfiles.general;
    const clarifierFactor=item.role==='CLARIFIER'?.45:1;
    for (const [dimension,value] of Object.entries(item.vectors) as [TarotDimension,number][]) {
      const relevance=.35 + Math.abs(profile[dimension] ?? 0)*.65;
      const weight=item.position.weight*relevance*clarifierFactor;
      const stat=sums.get(dimension) ?? {total:0,weight:0,cards:[]};
      stat.total += value*weight;
      stat.weight += weight;
      stat.cards.push(item.card.id);
      sums.set(dimension,stat);
    }
  }

  const dimensions:Record<string,number>={};
  for (const [dimension,stat] of sums) dimensions[dimension]=round(stat.total/stat.weight);

  const primaryRefs=primaryResolved.map(item=>({cardId:item.card.id,orientation:item.entry.orientation,positionId:item.position.id}));
  const specialCombinations=detectSpecialCombinations(primaryRefs);
  const sequencePatterns=detectSequencePatterns(primaryRefs);
  const motifs=[...new Set([...motifList(dimensions),...specialCombinations.map(x=>x.motif),...sequencePatterns])];
  const tensions=tensionList(dimensions);
  const transitions=primaryResolved.map(item=>item.card.mechanism);

  const motifEvidence:Record<string,string[]> = {
    HIGH_EMOTION: resolved.filter(x=>(x.vectors.emotion??0)>=4).map(x=>x.card.id),
    HIGH_DESIRE: resolved.filter(x=>Math.max(x.vectors.desire??0,x.vectors.sexuality??0,x.vectors.attraction??0)>=4).map(x=>x.card.id),
    DESIRE_CAN_MOVE: resolved.filter(x=>(x.vectors.movement??0)>=3 || (x.vectors.manifestation??0)>=4).map(x=>x.card.id),
    DESIRE_MANIFESTATION_LIMITED: resolved.filter(x=>(x.vectors.movement??0)<=0 || (x.vectors.retention??0)>=4 || (x.vectors.fear??0)>=4).map(x=>x.card.id),
    EMOTION_RESTRAINED: resolved.filter(x=>(x.vectors.openness??1)<=0 || (x.vectors.retention??0)>=4 || (x.vectors.control??0)>=4).map(x=>x.card.id),
    COMMUNICATION_FAVORED: resolved.filter(x=>(x.vectors.communication??0)>=4 || ((x.vectors.movement??0)>=4 && (x.vectors.manifestation??0)>=4)).map(x=>x.card.id),
    PRACTICAL_STABILITY: resolved.filter(x=>(x.vectors.practicalCommitment??0)>=4 || (x.vectors.longTermStability??0)>=4).map(x=>x.card.id),
    FACTUAL_CERTAINTY_LIMITED: resolved.filter(x=>(x.vectors.uncertainty??0)>=4 || (x.vectors.secrecy??0)>=4).map(x=>x.card.id),
    CURRENT_FORM_CLOSING: resolved.filter(x=>(x.vectors.rupture??0)>=4 || (x.vectors.transformation??0)>=4).map(x=>x.card.id),
    PAST_REEVALUATED: resolved.filter(x=>['RWS_C_06','RWS_M_20'].includes(x.card.id)).map(x=>x.card.id),
    IMMEDIATE_ACTION: resolved.filter(x=>(x.vectors.movement??0)<=0 || (x.vectors.manifestation??0)<=2).map(x=>x.card.id),
  };
  Object.assign(evidence,motifEvidence);

  const claims=claimsFor(motifs,tensions,evidence);
  const confidence=confidenceFor(motifs,tensions,dimensions,specialCombinations.length);
  const directAnswer=buildDirectAnswer(motifs,dimensions,specialCombinations.length);
  const sections=resolved.map(item=>({
    positionId:item.role==='CLARIFIER'?`${item.position.id}__CLARIFIER__${item.card.id}`:item.position.id,
    label:item.role==='CLARIFIER'?`Aclaratoria · ${item.position.label}`:item.position.label,
    cardId:item.card.id,
    cardName:item.card.name,
    orientation:item.entry.orientation,
    role:item.role,
    parentPositionId:item.role==='CLARIFIER'?item.position.id:undefined,
    text:cardPositionText(item.card,item.entry.orientation,item.position.context,item.vectors,item.role==='CLARIFIER'),
  }));

  const headline = motifs.includes('DESIRE_BLOCKED') ? 'Intensidad presente, pero manifestación contenida'
    : motifs.includes('COMMITMENT_PATTERN') ? 'Vínculo, estructura y permanencia convergen'
    : motifs.includes('LONG_TERM_BUILD') ? 'Base práctica y estabilidad como temas dominantes'
    : motifs.includes('COMMUNICATION_OPENING') ? 'Movimiento y comunicación ganan peso en la tirada'
    : motifs.includes('CLOSURE_TRANSFORMATION') ? 'La situación atraviesa un cierre o transformación'
    : motifs.includes('DEEP_FEELING') ? 'La dimensión emocional domina la lectura'
    : 'Lectura contextual integrada';

  const why:InterpretationResult['why']=[];
  for (const combo of specialCombinations) {
    why.push({claim:`COMBO_${combo.id}`,explanation:combo.explanation,cards:combo.cards});
  }
  for (const claim of claims) {
    const names=claim.evidence.map(id=>tarotCardById.get(id)?.name ?? id);
    why.push({claim:claim.concept, explanation:`${claim.concept.replaceAll('_',' ').toLowerCase()}: ${names.length ? names.join(', ') : 'patrón global de la tirada'}.`, cards:claim.evidence});
  }
  if (!why.length) {
    const ranked=Object.entries(dimensions).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);
    for (const [key,value] of ranked) why.push({claim:`DIM_${key.toUpperCase()}`,explanation:`${dimensionLabels[key as TarotDimension]??key}: ${value.toFixed(1)} dentro del perfil simbólico contextual.`,cards:sums.get(key as TarotDimension)?.cards ?? []});
  }

  return interpretationResultSchema.parse({
    requestId:parsed.requestId,
    headline,
    directAnswer,
    dimensions,
    motifs,
    tensions,
    transitions,
    sequencePatterns,
    specialCombinations,
    confidence,
    sections,
    claims,
    why,
    safeguards:safeguardsFor(resolved.map(x=>x.card),motifs),
    versions:parsed.versions,
  });
}
