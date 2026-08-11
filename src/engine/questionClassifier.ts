import { spreads, type SpreadDefinition } from '../data/spreads';

export type QuestionAnalysis = {
  normalized: string;
  category: 'RELATIONSHIP'|'COMMUNICATION'|'DESIRE'|'EVOLUTION'|'HIDDEN'|'WORK'|'MONEY'|'ADVICE'|'GENERAL';
  type: string;
  temporalScope: 'PRESENT'|'PRESENT_NEAR_FUTURE'|'FUTURE'|'OPEN';
  targets: string[];
};

export type SpreadRecommendation = {
  spread: SpreadDefinition;
  score: number;
  reason: string;
};

function normalize(text:string) {
  return text
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'');
}

function hasAny(text:string, words:string[]) {
  return words.some(word => text.includes(word));
}

export function classifyQuestion(text:string): QuestionAnalysis {
  const q=normalize(text);
  const communication=hasAny(q,['escrib','mensaje','hablar','llamar','contact','comunica','responder','respuesta']);
  const desire=hasAny(q,['dese','atraccion','atrae','sexual','sexo','libido','cama','fantasia']);
  const feelings=hasAny(q,['siente','sentimiento','amor','quiere','carino','emocion']);
  const intention=hasAny(q,['intencion','pretende','planea','quiere hacer']);
  const action=hasAny(q,['hara','va a hacer','actuara','acercara','buscara','volver']);
  const evolution=hasAny(q,['evolucion','evolucionara','futuro','meses','semanas','terminara','tendencia','como seguira','que pasara']);
  const hidden=hasAny(q,['ocult','secreto','no veo','no estoy viendo','desconozco','engana','mentira','esconde']);
  const work=hasAny(q,['trabajo','empleo','laboral','carrera','proyecto','negocio']);
  const money=hasAny(q,['dinero','econom','finanza','ingreso','gasto','inversion']);
  const advice=hasAny(q,['debo','deberia','conviene','consejo','que hago','que hacer']);

  const targets:string[]=[];
  if(feelings) targets.push('FEELINGS');
  if(desire) targets.push('DESIRE');
  if(intention) targets.push('INTENTION');
  if(action) targets.push('ACTION');
  if(communication) targets.push('COMMUNICATION');
  if(evolution) targets.push('EVOLUTION');
  if(hidden) targets.push('HIDDEN');
  if(advice) targets.push('ADVICE');

  let category:QuestionAnalysis['category']='GENERAL';
  let type='GENERAL';
  if(communication){ category='COMMUNICATION'; type='COMMUNICATION'; }
  if(desire){ category='DESIRE'; type='DESIRE_ATTRACTION'; }
  if(feelings){ category='RELATIONSHIP'; type=action||intention?'FEELINGS_ACTION':'FEELINGS'; }
  if(hidden){ category='HIDDEN'; type='HIDDEN_FACTORS'; }
  if(evolution){ category='EVOLUTION'; type='EVOLUTION'; }
  if(work){ category='WORK'; type=advice?'WORK_ADVICE':'WORK'; }
  if(money){ category='MONEY'; type=advice?'MONEY_ADVICE':'MONEY'; }
  if(advice && category==='GENERAL'){ category='ADVICE'; type='ADVICE'; }

  let temporalScope:QuestionAnalysis['temporalScope']='OPEN';
  if(hasAny(q,['hoy','ahora','actual','presente'])) temporalScope='PRESENT';
  else if(hasAny(q,['esta semana','proxim','pronto','dias'])) temporalScope='PRESENT_NEAR_FUTURE';
  else if(evolution||hasAny(q,['futuro','meses','ano'])) temporalScope='FUTURE';

  return { normalized:q, category, type, temporalScope, targets };
}

function scoreSpread(spread:SpreadDefinition, analysis:QuestionAnalysis) {
  let score=30;
  const id=spread.id;
  const targets=new Set(analysis.targets);

  if(analysis.category==='COMMUNICATION') {
    if(id==='SPREAD_COMM_06') score=98;
    else if(id==='SPREAD_FTA_03') score=73;
    else if(id==='SPREAD_QUICK_03') score=58;
  } else if(analysis.category==='DESIRE') {
    if(id==='SPREAD_DESIRE_07') score=98;
    else if(id==='SPREAD_RELATION_07') score=84;
    else if(id==='SPREAD_FTA_03') score=62;
  } else if(analysis.category==='RELATIONSHIP') {
    if(hasAny(analysis.normalized,['relacion completa','panorama completo','todo el vinculo','vinculo completo'])) {
      if(id==='SPREAD_RELATION_09') score=99;
      else if(id==='SPREAD_RELATION_07') score=88;
      else if(id==='SPREAD_FTA_03') score=68;
    } else if(targets.has('ACTION')||targets.has('INTENTION')) {
      if(id==='SPREAD_RELATION_07') score=97;
      else if(id==='SPREAD_FTA_03') score=82;
      else if(id==='SPREAD_DIAG_05') score=66;
    } else {
      if(id==='SPREAD_FTA_03') score=94;
      else if(id==='SPREAD_RELATION_07') score=80;
      else if(id==='SPREAD_QUICK_03') score=58;
    }
  } else if(analysis.category==='EVOLUTION') {
    if(hasAny(analysis.normalized,['ano','12 meses','proximo ano','año'])) {
      if(id==='SPREAD_YEAR_12') score=99;
      else if(id==='SPREAD_EVOLUTION_07') score=86;
      else if(id==='SPREAD_PPT_03') score=72;
    } else {
      if(id==='SPREAD_EVOLUTION_07') score=97;
      else if(id==='SPREAD_PPT_03') score=88;
      else if(id==='SPREAD_DIAG_05') score=64;
    }
  } else if(analysis.category==='HIDDEN') {
    if(id==='SPREAD_HIDDEN_06') score=97;
    else if(id==='SPREAD_DIAG_05') score=72;
    else if(id==='SPREAD_QUICK_03') score=55;
  } else if(analysis.category==='WORK') {
    if(id==='SPREAD_WORK_07') score=98;
    else if(id==='SPREAD_DIAG_05') score=88;
    else if(id==='SPREAD_CELTIC_10') score=72;
  } else if(analysis.category==='MONEY') {
    if(id==='SPREAD_MONEY_07') score=98;
    else if(id==='SPREAD_DIAG_05') score=87;
    else if(id==='SPREAD_DECISION_07') score=70;
  } else if(analysis.category==='ADVICE') {
    if(id==='SPREAD_DECISION_07' && hasAny(analysis.normalized,['opcion','elegir','entre','camino','decidir'])) score=98;
    else if(id==='SPREAD_DIAG_05') score=91;
    else if(id==='SPREAD_YESNO_03') score=82;
    else if(id==='SPREAD_ONE_01') score=68;
  } else {
    if(id==='SPREAD_QUICK_03') score=90;
    else if(id==='SPREAD_DIAG_05') score=78;
    else if(id==='SPREAD_ONE_01') score=68;
  }

  // Prefer the smallest spread that still fits when scores are close.
  score -= Math.max(0, spread.cardCount-7)*2;
  return score;
}

function reasonFor(spread:SpreadDefinition, analysis:QuestionAnalysis) {
  switch(spread.id){
    case 'SPREAD_RELATION_07': return 'Separa sentimientos, pensamientos, deseo, intención, bloqueo, acción y tendencia.';
    case 'SPREAD_FTA_03': return 'Responde de forma breve separando sentir, pensar y actuar.';
    case 'SPREAD_COMM_06': return 'Distingue deseo de contactar, bloqueo, impulso y próximo movimiento.';
    case 'SPREAD_DESIRE_07': return 'Separa atracción, deseo, emoción, fantasía, bloqueo y disposición a actuar.';
    case 'SPREAD_EVOLUTION_07': return 'Sigue la secuencia desde el estado actual hasta la tendencia final.';
    case 'SPREAD_PPT_03': return 'Resume la evolución en pasado, presente y tendencia.';
    case 'SPREAD_HIDDEN_06': return 'Distingue lo visible de lo desconocido sin convertir hipótesis en hechos.';
    case 'SPREAD_WORK_07': return 'Separa situación laboral, recursos, obstáculo, entorno, acción, oportunidad y tendencia.';
    case 'SPREAD_MONEY_07': return 'Distingue estabilidad, fugas, recursos, decisiones y oportunidad material.';
    case 'SPREAD_DECISION_07': return 'Compara dos caminos y añade un criterio de decisión en lugar de forzar una respuesta binaria.';
    case 'SPREAD_YESNO_03': return 'Da una respuesta contextual mostrando lo que favorece, lo que frena y la síntesis.';
    case 'SPREAD_RELATION_09': return 'Amplía el vínculo a nueve posiciones: ambas partes, reciprocidad, deseo, comunicación, bloqueo, acción y tendencia.';
    case 'SPREAD_CELTIC_10': return 'Ofrece un panorama profundo cuando la pregunta necesita contexto amplio.';
    case 'SPREAD_YEAR_12': return 'Sigue la secuencia simbólica de los próximos doce meses.';
    case 'SPREAD_DIAG_05': return analysis.category==='WORK'||analysis.category==='MONEY' ? 'Ordena situación, origen, apoyo, obstáculo y tendencia.' : 'Da contexto suficiente sin sobrecargar la consulta.';
    case 'SPREAD_ONE_01': return 'Útil cuando solo se necesita una orientación central.';
    default: return spread.description;
  }
}

export function recommendSpreads(text:string, limit=3): SpreadRecommendation[] {
  const analysis=classifyQuestion(text);
  return spreads
    .map(spread=>({spread,score:scoreSpread(spread,analysis),reason:reasonFor(spread,analysis)}))
    .sort((a,b)=>b.score-a.score || a.spread.cardCount-b.spread.cardCount)
    .slice(0,limit);
}
