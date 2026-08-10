import { db } from './schema';
import type { InterpretationRequest, InterpretationResult } from '../engine/contracts';
import { interpretTarot } from '../engine/tarotEngine';

function cardRowsFromRequest(readingId:string,revisionId:string,request:InterpretationRequest,now:string){
  return request.cards.map((entry,index)=>({
    id:crypto.randomUUID(), readingId, revisionId,
    positionId:entry.positionId, positionOrder:index+1, cardId:entry.cardId, orientation:entry.orientation,
    isClarifier:(entry.role==='CLARIFIER'?1:0) as 0|1,
    parentPositionId:entry.parentPositionId,
    drawOrder:index+1, createdAt:now,
  }));
}

export async function saveInterpretedReading(request: InterpretationRequest, result: InterpretationResult) {
  const now = new Date().toISOString();
  const readingId = crypto.randomUUID();
  const revisionId = crypto.randomUUID();

  await db.transaction('rw', db.readings, db.readingRevisions, db.readingCards, db.interpretations, db.readingEvents, async () => {
    await db.readings.add({
      id: readingId,
      question: request.question.text,
      questionNormalized: request.question.text.trim().toLocaleLowerCase('es'),
      category: request.question.category,
      questionType: request.question.type,
      temporalScope: request.question.temporalScope,
      spreadId: request.spread.id,
      spreadVersion: request.spread.version,
      drawMethod: request.options.drawMethod,
      status: 'INTERPRETED',
      currentRevisionId: revisionId,
      createdAt: now,
      updatedAt: now,
    });
    await db.readingRevisions.add({ id:revisionId, readingId, revisionNumber:1, reason:'ORIGINAL', createdAt:now });
    await db.readingCards.bulkAdd(cardRowsFromRequest(readingId,revisionId,request,now));
    await db.interpretations.add({
      id: crypto.randomUUID(), readingId, revisionId, contentVersion:request.versions.content,
      engineVersion:request.versions.engine, structuredResult:result, createdAt:now,
    });
    await db.readingEvents.add({id:crypto.randomUUID(),readingId,revisionId,type:'INTERPRETED',payload:{engine:request.versions.engine},createdAt:now});
  });

  return readingId;
}

export async function addClarifierRevision(readingId:string,parentPositionId:string,cardId:string,orientation:'UPRIGHT'|'REVERSED'){
  const reading=await db.readings.get(readingId);
  if(!reading?.currentRevisionId) throw new Error('READING_NOT_FOUND');
  const previousCards=await db.readingCards.where('revisionId').equals(reading.currentRevisionId).sortBy('positionOrder');
  const revisions=await db.readingRevisions.where('readingId').equals(readingId).toArray();
  const revisionNumber=Math.max(0,...revisions.map(r=>r.revisionNumber))+1;
  const clarifierCount=previousCards.filter(c=>c.isClarifier&&c.parentPositionId===parentPositionId).length;
  if(clarifierCount>=2) throw new Error('CLARIFIER_LIMIT');
  const revisionId=crypto.randomUUID();
  const now=new Date().toISOString();
  const request:InterpretationRequest={
    schemaVersion:'1.0', requestId:crypto.randomUUID(),
    question:{text:reading.question,language:'es',category:reading.category,type:reading.questionType,temporalScope:reading.temporalScope??'PRESENT_NEAR_FUTURE'},
    spread:{id:reading.spreadId,version:reading.spreadVersion},
    cards:[
      ...previousCards.map(c=>({positionId:c.positionId,cardId:c.cardId,orientation:c.orientation,role:(c.isClarifier?'CLARIFIER':'PRIMARY') as 'PRIMARY'|'CLARIFIER',parentPositionId:c.parentPositionId})),
      {positionId:parentPositionId,parentPositionId,cardId,orientation,role:'CLARIFIER' as const},
    ],
    options:{depth:'NORMAL',style:'NORMAL',drawMethod:reading.drawMethod,reversalsEnabled:true},
    versions:{content:'1.0.0',engine:'0.4.0'},
  };
  const result=interpretTarot(request);
  await db.transaction('rw',db.readings,db.readingRevisions,db.readingCards,db.interpretations,db.readingEvents,async()=>{
    await db.readingRevisions.add({id:revisionId,readingId,revisionNumber,reason:`CLARIFIER:${parentPositionId}`,createdAt:now});
    await db.readingCards.bulkAdd(cardRowsFromRequest(readingId,revisionId,request,now));
    await db.interpretations.add({id:crypto.randomUUID(),readingId,revisionId,contentVersion:'1.0.0',engineVersion:'0.4.0',structuredResult:result,createdAt:now});
    await db.readings.update(readingId,{currentRevisionId:revisionId,status:'REVISED',updatedAt:now});
    await db.readingEvents.add({id:crypto.randomUUID(),readingId,revisionId,type:'CLARIFIER_ADDED',payload:{parentPositionId,cardId,orientation},createdAt:now});
  });
  return {revisionId,result};
}

export async function saveEvaluation(readingId:string,revisionId:string,evaluation:'MATCHED'|'PARTIAL'|'NOT_MATCHED'|'INDETERMINATE',notes='',observedDate=''){
  const now=new Date().toISOString();
  const existing=await db.evaluations.where('readingId').equals(readingId).first();
  await db.transaction('rw',db.evaluations,db.readings,db.readingEvents,async()=>{
    if(existing) await db.evaluations.update(existing.id,{revisionId,evaluation,notes,observedDate:observedDate||undefined,updatedAt:now});
    else await db.evaluations.add({id:crypto.randomUUID(),readingId,revisionId,evaluation,notes,observedDate:observedDate||undefined,createdAt:now,updatedAt:now});
    await db.readings.update(readingId,{status:'EVALUATED',updatedAt:now});
    await db.readingEvents.add({id:crypto.randomUUID(),readingId,revisionId,type:'EVALUATED',payload:{evaluation,observedDate},createdAt:now});
  });
}
