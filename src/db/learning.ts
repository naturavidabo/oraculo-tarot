import { db, type LearningProgressRow, type LearningState } from './schema';

export type ReviewResult='AGAIN'|'HARD'|'GOOD'|'EASY';

const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));

function nextState(mastery:number):LearningState{
  if(mastery>=85) return 'MASTERED';
  if(mastery>=55) return 'REVIEW';
  if(mastery>0) return 'LEARNING';
  return 'NEW';
}

function nextIntervalDays(result:ReviewResult,mastery:number){
  if(result==='AGAIN') return 0;
  if(result==='HARD') return 1;
  if(result==='GOOD') return mastery>=70?7:3;
  return mastery>=85?21:10;
}

export async function recordLearningResult(cardId:string,result:ReviewResult,source:'FLASHCARD'|'QUIZ'='FLASHCARD'){
  const now=new Date();
  const existing=await db.learningProgress.where('cardId').equals(cardId).first();
  const delta={AGAIN:-12,HARD:4,GOOD:10,EASY:16}[result];
  const mastery=clamp((existing?.mastery??0)+delta);
  const correct=(existing?.correct??0)+(result==='GOOD'||result==='EASY'?1:0);
  const incorrect=(existing?.incorrect??0)+(result==='AGAIN'?1:0);
  const streak=result==='AGAIN'?0:(existing?.streak??0)+1;
  const interval=nextIntervalDays(result,mastery);
  const next=new Date(now);
  if(interval===0) next.setHours(next.getHours()+6); else next.setDate(next.getDate()+interval);
  const row:LearningProgressRow={
    id:existing?.id??crypto.randomUUID(),cardId,state:nextState(mastery),mastery,correct,incorrect,streak,
    lastReview:now.toISOString(),nextReview:next.toISOString(),updatedAt:now.toISOString(),
  };
  await db.transaction('rw',db.learningProgress,db.flashcardReviews,async()=>{
    if(existing) await db.learningProgress.put(row); else await db.learningProgress.add(row);
    await db.flashcardReviews.add({id:crypto.randomUUID(),cardId,result,source,reviewedAt:now.toISOString()});
  });
  return row;
}

export async function learningProgressMap(){
  const rows=await db.learningProgress.toArray();
  return new Map(rows.map(row=>[row.cardId,row]));
}

export async function dueLearningCardIds(){
  const now=new Date().toISOString();
  const rows=await db.learningProgress.toArray();
  return rows.filter(r=>!r.nextReview||r.nextReview<=now).sort((a,b)=>(a.nextReview??'').localeCompare(b.nextReview??'')).map(r=>r.cardId);
}

export async function saveCardNote(cardId:string,text:string){
  const now=new Date().toISOString();
  const existing=await db.cardNotes.where('cardId').equals(cardId).first();
  if(existing){await db.cardNotes.update(existing.id,{text,updatedAt:now});return existing.id;}
  const id=crypto.randomUUID();
  await db.cardNotes.add({id,cardId,text,createdAt:now,updatedAt:now});
  return id;
}
