import { tarotCardById } from '../data/cards';
import { spreads } from '../data/spreads';
import type { Orientation, TarotCard, TarotDimension } from '../types/tarot';
import { contextProfiles, dimensionLabels } from './contextProfile';
import { interpretationRequestSchema, interpretationResultSchema, type InterpretationRequest, type InterpretationResult } from './contracts';
import { detectSequencePatterns, detectSpecialCombinations, motifList, tensionList } from './semanticRules';
import { claimLabel, humanCode, mechanismLabel, motifLabel, tensionLabel } from './presentationLabels';

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

function contextualNuance(context:string, vectors:Partial<Record<TarotDimension,number>>, card:TarotCard) {
  const has=(key:TarotDimension)=>vectors[key]!==undefined;
  const v=(key:TarotDimension)=>vectors[key]??0;
  const pieces:string[]=[];
  if(context==='sentimientos'||context==='emocional'||context==='amor'){
    if(has('emotion')&&v('emotion')>=4) pieces.push('la carga afectiva es importante');
    else if(has('mentalIntensity')&&v('mentalIntensity')>=4) pieces.push('la vivencia se procesa más desde la mente, la observación o la evaluación que desde una expresión afectiva espontánea');
    else if((has('materiality')&&v('materiality')>=4)||(has('practicalCommitment')&&v('practicalCommitment')>=4)) pieces.push('la posición habla de valorar lo invertido, la seguridad o la conveniencia de continuar más que de una emoción expansiva');
    if((has('openness')&&v('openness')<=-2)||(has('retention')&&v('retention')>=4)) pieces.push('hay reserva para exteriorizar lo que ocurre internamente');
    if(has('reciprocity')&&v('reciprocity')>=4) pieces.push('también existe una señal fuerte de reciprocidad emocional');
    if(has('bondAvailability')&&v('bondAvailability')<=1) pieces.push('la disponibilidad para vincularse aparece limitada');
  } else if(context==='pensamientos'||context==='mental'){
    if(has('clarity')&&v('clarity')>=4) pieces.push('la mente busca definir, comprender o tomar una posición clara');
    if(has('uncertainty')&&v('uncertainty')>=4) pieces.push('persisten dudas o falta de información suficiente');
    if((has('conflict')&&v('conflict')>=4)||(has('hostility')&&v('hostility')>=4)) pieces.push('el pensamiento está atravesado por tensión, defensa o confrontación');
    if(has('secrecy')&&v('secrecy')>=4) pieces.push('una parte del proceso mental se mantiene reservada');
  } else if(context==='accion'||context==='resultado'){
    if(has('movement')&&has('manifestation')&&v('movement')>=4&&v('manifestation')>=4) pieces.push('hay capacidad simbólica de pasar del estado interno a un movimiento visible');
    else if((has('movement')&&v('movement')<=0)||(has('manifestation')&&v('manifestation')<=2)) pieces.push('la acción aparece frenada, lenta o todavía poco visible');
    if(has('rupture')&&v('rupture')>=4) pieces.push('el movimiento puede implicar cortar con una forma anterior');
    if((has('stability')&&v('stability')>=4)||(has('longTermStability')&&v('longTermStability')>=4)) pieces.push('la tendencia busca sostener o estabilizar lo construido');
    if(card.mechanism==='DEFIENDE'||(has('resilience')&&v('resilience')>=4)) pieces.push('predomina defender una posición antes que abrir una nueva');
  } else if(context==='intenciones'){
    if(has('initiative')&&v('initiative')>=4) pieces.push('existe iniciativa o voluntad de hacer algo con la situación');
    if(has('practicalCommitment')&&v('practicalCommitment')>=4) pieces.push('la intención se acompaña de inversión práctica o constancia');
    if(has('practicalCommitment')&&v('practicalCommitment')<=2&&has('emotion')&&v('emotion')>=3) pieces.push('el interés no está igualmente respaldado por compromiso práctico');
  } else if(context==='deseo'||context==='sexualidad'){
    const desireValues=[has('desire')?v('desire'):undefined,has('sexuality')?v('sexuality'):undefined,has('attraction')?v('attraction'):undefined].filter((x):x is number=>x!==undefined);
    if(desireValues.length&&Math.max(...desireValues)>=4) pieces.push('el deseo o la atracción son intensos');
    if((has('actionImpulse')&&v('actionImpulse')<=2)||(has('manifestation')&&v('manifestation')<=2)) pieces.push('esa intensidad no se convierte automáticamente en acción');
    if(has('fantasy')&&v('fantasy')>=4) pieces.push('parte del impulso puede permanecer en el plano de la fantasía');
  } else if(context==='comunicacion'){
    if(has('communication')&&v('communication')>=4&&(!has('movement')||v('movement')>=2)) pieces.push('la comunicación tiene posibilidades de exteriorizarse');
    if(has('communication')&&v('communication')>=3&&has('movement')&&v('movement')<=0) pieces.push('hay contenido para comunicar, pero el movimiento está frenado');
    if(has('secrecy')&&v('secrecy')>=4) pieces.push('se mantiene una cuota relevante de reserva');
  } else if(context==='obstaculo'){
    if(has('fear')&&v('fear')>=4) pieces.push('el miedo funciona como freno');
    if(has('conflict')&&v('conflict')>=4) pieces.push('el conflicto absorbe energía de la situación');
    if(has('retention')&&v('retention')>=4) pieces.push('la retención o necesidad de control dificulta abrir el proceso');
    if(has('burden')&&v('burden')>=4) pieces.push('la sobrecarga reduce la energía disponible');
  }
  if(!pieces.length) return '';
  return pieces.join('; ').replace(/^./,c=>c.toLocaleUpperCase('es'));
}

function cleanSentence(text:string){
  return text.trim().replace(/[.!?]+$/,'');
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
  const nuance=contextualNuance(context,vectors,card);
  return `${prefix}${cleanSentence(card.quick)}.${orientationText}${emphasis}${nuance?` ${nuance}.`:''}`;
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


function bridgeNarrative(items:Array<{card:TarotCard;vectors:Partial<Record<TarotDimension,number>>;position:{label:string;context:string};entry:{orientation:Orientation}}>) {
  const bridges:string[]=[];
  for(let i=0;i<items.length-1;i++){
    const a=items[i],b=items[i+1];
    const av=(key:TarotDimension)=>a.vectors[key]??0;
    const bv=(key:TarotDimension)=>b.vectors[key]??0;
    let relation='';
    if(av('movement')<=0&&bv('movement')>=3.5) relation=`La secuencia pasa de una energía más detenida en ${a.card.name} a una disposición claramente más móvil con ${b.card.name}`;
    else if(av('openness')<=-2&&bv('communication')>=3.5) relation=`Entre ${a.card.name} y ${b.card.name} aparece un cambio desde la reserva hacia una mayor posibilidad de expresar o comunicar`;
    else if(av('emotion')>=3.5&&bv('mentalIntensity')>=3.5) relation=`Lo que primero aparece como carga emocional con ${a.card.name} pasa a ser procesado mentalmente en ${b.card.name}`;
    else if(av('uncertainty')>=3.5&&bv('clarity')>=3.5) relation=`${b.card.name} introduce claridad en un tramo que ${a.card.name} dejaba más incierto o abierto`;
    else if(av('conflict')>=3.5&&bv('healing')>=3.5) relation=`Después de la tensión de ${a.card.name}, ${b.card.name} introduce una posibilidad de regulación o recuperación`;
    else if(av('stability')>=3.5&&bv('transformation')>=4) relation=`La estabilidad representada por ${a.card.name} entra en revisión cuando ${b.card.name} exige cambio o transformación`;
    else if(av('transformation')>=4&&bv('integration')>=3.5) relation=`${a.card.name} abre un cambio importante y ${b.card.name} muestra cómo ese cambio puede empezar a integrarse`;
    else if(av('desire')>=3.5&&bv('manifestation')<=2) relation=`El impulso presente en ${a.card.name} no encuentra todavía la misma facilidad para materializarse en ${b.card.name}`;
    else relation=`${a.card.name} prepara el contexto de ${b.card.name}: la segunda carta no borra a la primera, sino que muestra cómo continúa o modifica esa energía`;
    bridges.push(`${relation}.`);
  }
  return bridges.join(' ');
}

function clarifierNarrative(items:Array<{card:TarotCard;position:{label:string;context:string};entry:{orientation:Orientation};vectors:Partial<Record<TarotDimension,number>>}>) {
  if(!items.length)return '';
  return `Las cartas aclaratorias añaden matices sin sustituir a las principales. ${items.map(item=>{
    const orientation=item.entry.orientation==='REVERSED'?' invertida':'';
    const nuance=contextualNuance(item.position.context,item.vectors,item.card);
    return `En “${item.position.label}”, ${item.card.name}${orientation} precisa la lectura: ${cleanSentence(item.card.quick).toLocaleLowerCase('es')}${nuance?`; ${cleanSentence(nuance).toLocaleLowerCase('es')}`:''}`;
  }).join('. ')}.`;
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
    why.push({claim:combo.label,explanation:combo.explanation,cards:combo.cards});
  }
  for (const claim of claims) {
    const names=claim.evidence.map(id=>tarotCardById.get(id)?.name ?? id);
    why.push({claim:humanCode(claim.concept,claimLabel), explanation:names.length ? `Se sostiene principalmente en ${names.join(', ')}.` : 'Se sostiene en la convergencia global de la tirada.', cards:claim.evidence});
  }
  if (!why.length) {
    const ranked=Object.entries(dimensions).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);
    for (const [key,value] of ranked) why.push({claim:dimensionLabels[key as TarotDimension]??key,explanation:`${dimensionLabels[key as TarotDimension]??key}: ${value.toFixed(1)} dentro del perfil simbólico contextual.`,cards:sums.get(key as TarotDimension)?.cards ?? []});
  }

  const ftaDirectAnswer=spread.id==='SPREAD_FTA_03'&&primaryResolved.length===3 ? (()=>{
    const [feel,thought,action]=primaryResolved;
    const feelNuance=contextualNuance(feel.position.context,feel.vectors,feel.card);
    const thoughtNuance=contextualNuance(thought.position.context,thought.vectors,thought.card);
    const actionNuance=contextualNuance(action.position.context,action.vectors,action.card);
    const synthesis:string[]=[];
    if((dimensions.mentalIntensity??0)>=4&&(dimensions.emotion??0)<3) synthesis.push('predomina una dinámica mental y de evaluación más que una apertura afectiva directa');
    if((dimensions.conflict??0)>=4||(dimensions.hostility??0)>=4) synthesis.push('la tensión o actitud defensiva tiene un peso importante');
    if((dimensions.openness??0)<=-2) synthesis.push('la apertura es limitada');
    if((dimensions.movement??0)>=4&&(dimensions.manifestation??0)>=3) synthesis.push('aun así existe capacidad de movimiento visible');
    const ending=synthesis.length?` En conjunto, ${synthesis.join('; ')}.`:'';
    return `En sentimientos, ${feel.card.name} indica que ${cleanSentence(feel.card.quick).toLocaleLowerCase('es')}${feelNuance?`; ${feelNuance.toLocaleLowerCase('es')}`:''}. En pensamientos, ${thought.card.name} muestra que ${cleanSentence(thought.card.quick).toLocaleLowerCase('es')}${thoughtNuance?`; ${thoughtNuance.toLocaleLowerCase('es')}`:''}. En acción o tendencia, ${action.card.name} señala que ${cleanSentence(action.card.quick).toLocaleLowerCase('es')}${actionNuance?`; ${actionNuance.toLocaleLowerCase('es')}`:''}.${ending}`;
  })() : '';
  const resolvedDirectAnswer=ftaDirectAnswer||directAnswer;

  const dominantDimensions=Object.entries(dimensions)
    .sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))
    .slice(0,3)
    .map(([key])=>dimensionLabels[key as TarotDimension]??key);

  const positionNarrative=primaryResolved.map((item,index)=>{
    const orientationText=item.entry.orientation==='REVERSED'?' invertida':'';
    const connector=index===0?'En':index===primaryResolved.length-1?'Finalmente, en':'En';
    const nuance=contextualNuance(item.position.context,item.vectors,item.card);
    const quick=cleanSentence(item.card.quick);
    return `${connector} ${item.position.label.toLocaleLowerCase('es')}, ${item.card.name}${orientationText} aporta ${quick.charAt(0).toLocaleLowerCase('es')}${quick.slice(1)}${nuance?`; ${nuance.charAt(0).toLocaleLowerCase('es')}${nuance.slice(1)}`:''}`;
  }).join('. ')+'.';

  const motifNarrative=motifs.slice(0,3).map(code=>{
    const label=humanCode(code,motifLabel);
    const sentences:Record<string,string>={
      DEEP_FEELING:'La dimensión emocional tiene un peso importante y no conviene reducir la lectura únicamente a conducta visible.',
      HIGH_DESIRE:'La atracción o el deseo aparecen con intensidad dentro del conjunto.',
      DESIRE_WITH_ACTION:'El impulso no queda solamente en deseo: también existen señales simbólicas de movimiento o manifestación.',
      DESIRE_BLOCKED:'Hay intensidad, pero una parte de esa energía encuentra frenos antes de convertirse en hechos visibles.',
      FEELING_RESTRAINED:'Lo que se siente y lo que se expresa no aparecen con la misma facilidad.',
      COMMUNICATION_OPENING:'La secuencia favorece que algo se exteriorice, se diga o empiece a moverse.',
      COMMUNICATION_BLOCKED:'La comunicación existe como tema, aunque está sometida a pausa, temor o dificultad para exteriorizarse.',
      LONG_TERM_BUILD:'La lectura contiene elementos de constancia, estructura y construcción práctica.',
      COMMITMENT_PATTERN:'Hay una convergencia simbólica hacia estructura, permanencia o compromiso.',
      HIGH_UNCERTAINTY:'La incertidumbre es elevada, por lo que la lectura debe mantenerse en el terreno simbólico y no convertirse en afirmaciones de hecho.',
      HIDDEN_INFORMATION:'Hay reserva o baja visibilidad; eso indica información no plenamente disponible, no una prueba de engaño.',
      CLOSURE_TRANSFORMATION:'La forma actual de la situación parece estar atravesando un cierre o una transformación importante.',
      RECOVERY_INTEGRATION:'El conjunto favorece recuperación, ajuste o integración gradual.',
      AUTONOMOUS_STABILITY:'La estabilidad aparece ligada a conservar autonomía y espacio propio.',
    };
    return sentences[code]??`${label} aparece como uno de los temas que conectan las cartas.`;
  }).join(' ');

  const tensionNarrative=tensions.slice(0,2).map(code=>{
    const label=humanCode(code,tensionLabel);
    return `La principal tensión se puede resumir como “${label.toLocaleLowerCase('es')}”, por lo que dos impulsos de la tirada no avanzan al mismo ritmo.`;
  }).join(' ');

  const combinationNarrative=specialCombinations.slice(0,2).map(combo=>combo.explanation).join(' ');
  const first=primaryResolved[0];
  const last=primaryResolved[primaryResolved.length-1];
  const sequenceSentence=first&&last&&first.card.id!==last.card.id
    ? `El recorrido va desde ${first.card.name}, que ${humanCode(first.card.mechanism,mechanismLabel).toLocaleLowerCase('es')}, hasta ${last.card.name}, que ${humanCode(last.card.mechanism,mechanismLabel).toLocaleLowerCase('es')}; por eso importa leer el orden y no solo las cartas aisladas.`
    : '';

  const bridgeText=bridgeNarrative(primaryResolved);
  const clarifierText=clarifierNarrative(clarifierResolved);

  const ftaGlobal=spread.id==='SPREAD_FTA_03'&&primaryResolved.length===3 ? (()=>{
    const [feel,thought,action]=primaryResolved;
    const feelNuance=contextualNuance(feel.position.context,feel.vectors,feel.card);
    const thoughtNuance=contextualNuance(thought.position.context,thought.vectors,thought.card);
    const actionNuance=contextualNuance(action.position.context,action.vectors,action.card);
    const firstParagraph=`La lectura empieza en ${feel.card.name}${feel.entry.orientation==='REVERSED'?' invertida':''}, colocada en sentimientos. ${cleanSentence(feel.card.quick)}${feelNuance?`. ${cleanSentence(feelNuance)}`:''}. Esto describe el tono emocional de la consulta, pero no debe confundirse automáticamente con una intención o una acción.`;
    const secondParagraph=`Al pasar a los pensamientos aparece ${thought.card.name}${thought.entry.orientation==='REVERSED'?' invertida':''}. ${cleanSentence(thought.card.quick)}${thoughtNuance?`. ${cleanSentence(thoughtNuance)}`:''}. Esta segunda carta muestra cómo se procesa mentalmente lo anterior y ayuda a distinguir entre lo que puede sentirse y lo que realmente se está evaluando, decidiendo o evitando.`;
    const thirdParagraph=`En la posición de acción o tendencia, ${action.card.name}${action.entry.orientation==='REVERSED'?' invertida':''} cambia el foco hacia lo que podría manifestarse. ${cleanSentence(action.card.quick)}${actionNuance?`. ${cleanSentence(actionNuance)}`:''}. Por eso la última carta no borra las dos anteriores: indica cómo toda esa dinámica encuentra —o no— una vía de expresión.`;
    const synthesisParts:string[]=[];
    if((dimensions.mentalIntensity??0)>=4&&(dimensions.emotion??0)<3) synthesisParts.push('el conjunto es más mental, observador o evaluativo que abiertamente emocional');
    if((dimensions.emotion??0)>=3.7) synthesisParts.push('hay una carga emocional que merece peso propio');
    if((dimensions.conflict??0)>=3.7||(dimensions.hostility??0)>=3.7) synthesisParts.push('la tensión, defensa o confrontación condiciona la manera de actuar');
    if(Object.prototype.hasOwnProperty.call(dimensions,'openness')&&(dimensions.openness??0)<=-2) synthesisParts.push('la apertura aparece limitada');
    if((dimensions.movement??0)>=3.7&&(dimensions.manifestation??0)>=3) synthesisParts.push('sí existe una vía simbólica de movimiento o exteriorización');
    if((dimensions.rupture??0)>=4||(dimensions.transformation??0)>=4) synthesisParts.push('la forma actual de la situación está entrando en un cierre o transformación');
    const synthesis=synthesisParts.length
      ? `Viendo las tres cartas juntas, ${synthesisParts.join('; ')}. La lectura, por tanto, no se reduce al significado aislado de ninguna carta: importa la secuencia entre sentir, pensar y actuar.`
      : `Viendo las tres cartas juntas, ninguna dimensión domina por completo a las demás. La lectura depende sobre todo de cómo se enlazan sentimiento, pensamiento y acción, por lo que conviene conservar los matices de cada posición.`;
    return [firstParagraph,secondParagraph,thirdParagraph,synthesis,bridgeText,clarifierText,motifNarrative,tensionNarrative,combinationNarrative].filter(Boolean).join('\n\n');
  })() : '';

  const globalInterpretation=ftaGlobal || [
    `Respecto a la consulta “${parsed.question.text}”, la tirada se entiende mejor como un conjunto y no como ${primaryResolved.length} definiciones separadas.`,
    dominantDimensions.length?`Los aspectos con mayor peso son ${dominantDimensions.join(', ')}.`:'',
    positionNarrative,
    bridgeText,
    clarifierText,
    motifNarrative,
    tensionNarrative,
    combinationNarrative,
    sequenceSentence,
  ].filter(Boolean).join(' ');

  const connectionSummary=[
    motifs.length?`El hilo común entre las cartas se concentra en ${motifs.slice(0,3).map(code=>humanCode(code,motifLabel).toLocaleLowerCase('es')).join(', ')}.`:'Las cartas no forman un patrón único dominante; la lectura depende especialmente de sus posiciones.',
    tensions.length?`A la vez aparece ${tensions.slice(0,2).map(code=>humanCode(code,tensionLabel).toLocaleLowerCase('es')).join(' y ')}.`:'Las cartas no muestran una contradicción fuerte entre sí.',
  ].join(' ');

  const lastOrientation=last?.entry.orientation==='REVERSED'?' invertida':'';
  const concludingThemes:string[]=[];
  if(motifs.includes('COMMUNICATION_OPENING')) concludingThemes.push('hay una vía para que algo se exprese o se ponga en movimiento');
  if(motifs.includes('DESIRE_BLOCKED')||tensions.includes('DESIRE_VS_MANIFESTATION')) concludingThemes.push('el impulso no se manifiesta con la misma facilidad con la que se siente');
  if(motifs.includes('LONG_TERM_BUILD')||motifs.includes('COMMITMENT_PATTERN')) concludingThemes.push('la estabilidad depende de hechos sostenidos y no solo de intención');
  if(motifs.includes('CLOSURE_TRANSFORMATION')) concludingThemes.push('la forma actual de la situación necesita cerrar o transformarse');
  if(motifs.includes('HIGH_UNCERTAINTY')||motifs.includes('HIDDEN_INFORMATION')) concludingThemes.push('todavía existe información insuficiente para convertir la lectura en una afirmación tajante');
  const conclusion=last
    ? `Como cierre, ${last.card.name}${lastOrientation} ocupa “${last.position.label}”. ${cleanSentence(last.card.quick)}.${last.entry.orientation==='REVERSED'?` ${cleanSentence(last.card.reversal.summary)}.`:''}${concludingThemes.length?` Al integrar el conjunto, ${concludingThemes.join('; ')}.`:''} La tendencia final debe entenderse como la dirección simbólica más coherente con estas cartas, no como un hecho garantizado.`
    : 'La tirada ofrece una orientación simbólica contextual y no una predicción garantizada.';

  return interpretationResultSchema.parse({
    requestId:parsed.requestId,
    headline,
    directAnswer:resolvedDirectAnswer,
    globalInterpretation,
    connectionSummary,
    conclusion,
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
