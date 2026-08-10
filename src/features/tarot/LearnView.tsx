import { useEffect, useMemo, useState } from 'react';
import { tarotCards } from '../../data/cards';
import { db, type LearningProgressRow } from '../../db/schema';
import { dueLearningCardIds, learningProgressMap, recordLearningResult, saveCardNote, type ReviewResult } from '../../db/learning';
import type { TarotCard } from '../../types/tarot';

type LearnTab='ROUTES'|'FLASHCARDS'|'QUIZ'|'PROGRESS';

const lessons=[
  {id:'start',title:'Primeros pasos',progress:'Base',text:'Mayores y Menores, los cuatro palos, derecho/invertido y cómo formular una pregunta.'},
  {id:'fool',title:'Viaje del Loco',progress:'22 etapas',text:'Recorre los Arcanos Mayores como una secuencia de inicio, aprendizaje, crisis, integración y culminación.'},
  {id:'suits',title:'Los cuatro palos',progress:'56 cartas',text:'Bastos mueve, Copas siente, Espadas piensa y Oros construye en la realidad concreta.'},
  {id:'courts',title:'Las figuras',progress:'16 cartas',text:'Sota descubre, Caballero mueve, Reina encarna y Rey dirige; el palo define qué energía expresan.'},
  {id:'relations',title:'Relaciones y sentimientos',progress:'Reglas clave',text:'Sentimiento ≠ deseo ≠ intención ≠ acción. Aprende a separar dimensiones que suelen confundirse.'},
  {id:'difficult',title:'Cartas difíciles',progress:'Lectura responsable',text:'Muerte, Torre, Diablo, Luna, 3 y 7 de Espadas sin interpretaciones automáticas ni fatalistas.'},
];

const lessonCentral:Record<string,string>={
  start:'Una carta cambia según la pregunta, la posición y las cartas que la rodean; no existe una frase universal que sirva para todos los contextos.',
  fool:'El Loco inicia el viaje y El Mundo culmina e integra; después puede comenzar un nuevo ciclo.',
  suits:'Los palos ayudan a identificar rápidamente el campo principal de una carta antes de entrar en matices.',
  courts:'El rango aporta una función estable y el palo aporta el contenido que esa función mueve, recibe o dirige.',
  relations:'Una lectura precisa separa lo que alguien siente, desea, piensa, pretende hacer y finalmente manifiesta.',
  difficult:'Una carta intensa o difícil describe una dinámica simbólica; no demuestra hechos ocultos ni autoriza conclusiones absolutas.',
};
const lessonRule:Record<string,string>={
  start:'Sentimiento ≠ intención ≠ acción. ORÁCULO TAROT mantiene esas dimensiones separadas.',
  fool:'Los Arcanos Mayores tienen mayor dominancia estructural, pero la posición y la pregunta siguen mandando.',
  suits:'No confundas intensidad con positividad: un palo puede estar muy presente y expresar tanto su luz como su sombra.',
  courts:'Las figuras no representan automáticamente género: pueden ser persona, estado, forma de actuar o energía de la situación.',
  relations:'Deseo fuerte no equivale a compromiso; silencio no equivale a ausencia de emoción; nostalgia no equivale a regreso.',
  difficult:'Luna no prueba engaño, 7 de Espadas no prueba infidelidad y Muerte no se interpreta como muerte física literal.',
};

function shuffled<T>(items:T[]){
  const out=[...items];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
}

function cardLabel(card:TarotCard){return card.arcana==='major'?'Arcano Mayor':({wands:'Bastos',cups:'Copas',swords:'Espadas',pentacles:'Oros'} as const)[card.suit as 'wands'|'cups'|'swords'|'pentacles'];}

function Flashcards({refreshProgress}:{refreshProgress:()=>Promise<void>}){
  const [queue,setQueue]=useState<TarotCard[]>([]);
  const [index,setIndex]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [note,setNote]=useState('');
  const [saved,setSaved]=useState('');
  const card=queue[index];

  useEffect(()=>{void (async()=>{
    const due=await dueLearningCardIds();
    const dueCards=due.map(id=>tarotCards.find(c=>c.id===id)).filter(Boolean) as TarotCard[];
    const remaining=tarotCards.filter(c=>!due.includes(c.id));
    setQueue([...dueCards,...shuffled(remaining)].slice(0,20));
  })()},[]);

  useEffect(()=>{void (async()=>{
    if(!card){setNote('');return;}
    const row=await db.cardNotes.where('cardId').equals(card.id).first();
    setNote(row?.text??'');setSaved('');
  })()},[card?.id]);

  async function rate(result:ReviewResult){
    if(!card) return;
    await recordLearningResult(card.id,result,'FLASHCARD');
    await refreshProgress();
    setRevealed(false);setIndex(i=>Math.min(i+1,queue.length));
  }

  if(!card) return <div className="empty">No hay más tarjetas en esta sesión. Vuelve a entrar para iniciar otro repaso.</div>;
  return <div className="study-stage">
    <div className="study-counter">Tarjeta {index+1} de {queue.length}</div>
    <button className={`flashcard ${revealed?'revealed':''}`} onClick={()=>setRevealed(true)}>
      <span className="eyebrow">{cardLabel(card)}</span>
      <div className="tarot-placeholder study-card"><span>{card.number??'✦'}</span></div>
      <h2>{card.name}</h2>
      {!revealed?<p>Piensa primero en su esencia, luz y sombra. Luego toca para revelar.</p>:<>
        <p className="flash-essence">{card.essence}</p>
        <div className="study-columns"><div><b>Luz</b><span>{card.light.slice(0,3).join(' · ')}</span></div><div><b>Sombra</b><span>{card.shadow.slice(0,3).join(' · ')}</span></div></div>
        <small>{card.teacherNote}</small>
      </>}
    </button>
    {revealed&&<>
      <div className="rating-grid"><button onClick={()=>void rate('AGAIN')}>Otra vez</button><button onClick={()=>void rate('HARD')}>Difícil</button><button onClick={()=>void rate('GOOD')}>Bien</button><button onClick={()=>void rate('EASY')}>Fácil</button></div>
      <label className="field"><span>Mi nota sobre esta carta</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Tu observación personal no modifica el significado oficial."/></label>
      <button className="secondary-cta" onClick={()=>void saveCardNote(card.id,note).then(()=>setSaved('Nota guardada'))}>Guardar nota</button>{saved&&<small className="saved-note">{saved}</small>}
    </>}
  </div>;
}

type QuizQuestion={card:TarotCard;options:TarotCard[]};
function buildQuestion():QuizQuestion{
  const card=tarotCards[Math.floor(Math.random()*tarotCards.length)];
  const distractors=shuffled(tarotCards.filter(c=>c.id!==card.id)).slice(0,3);
  return {card,options:shuffled([card,...distractors])};
}

function Quiz({refreshProgress}:{refreshProgress:()=>Promise<void>}){
  const [question,setQuestion]=useState<QuizQuestion>(()=>buildQuestion());
  const [answered,setAnswered]=useState<string|null>(null);
  const [score,setScore]=useState({ok:0,total:0});
  const correct=answered===question.card.id;
  async function answer(id:string){
    if(answered) return;
    setAnswered(id);const ok=id===question.card.id;
    setScore(s=>({ok:s.ok+(ok?1:0),total:s.total+1}));
    await recordLearningResult(question.card.id,ok?'GOOD':'AGAIN','QUIZ');
    await refreshProgress();
  }
  function next(){setQuestion(buildQuestion());setAnswered(null)}
  return <div className="quiz-panel">
    <div className="quiz-score">Aciertos {score.ok}/{score.total}</div>
    <span className="eyebrow">QUIZ · ESENCIA</span>
    <h2>¿Qué carta corresponde mejor a esta esencia?</h2>
    <p className="quiz-prompt">{question.card.essence}</p>
    <div className="quiz-options">{question.options.map(option=><button key={option.id} disabled={!!answered} className={answered?(option.id===question.card.id?'correct':option.id===answered?'wrong':''):''} onClick={()=>void answer(option.id)}>{option.name}<small>{cardLabel(option)}</small></button>)}</div>
    {answered&&<div className="quiz-feedback"><b>{correct?'Correcto':'Revisa esta carta'}</b><p>{question.card.name}: {question.card.quick}</p><button className="primary-cta" onClick={next}>Siguiente pregunta</button></div>}
  </div>;
}

function Progress({progress}:{progress:Map<string,LearningProgressRow>}){
  const rows=[...progress.values()];
  const mastered=rows.filter(r=>r.state==='MASTERED').length;
  const review=rows.filter(r=>r.state==='REVIEW').length;
  const learning=rows.filter(r=>r.state==='LEARNING').length;
  const avg=rows.length?Math.round(rows.reduce((a,b)=>a+b.mastery,0)/rows.length):0;
  const needs=rows.sort((a,b)=>a.mastery-b.mastery).slice(0,8).map(r=>({row:r,card:tarotCards.find(c=>c.id===r.cardId)})).filter(x=>x.card);
  return <div>
    <div className="progress-summary"><div><b>{mastered}</b><span>Dominadas</span></div><div><b>{review}</b><span>Repaso</span></div><div><b>{learning}</b><span>Aprendiendo</span></div><div><b>{avg}%</b><span>Dominio medio</span></div></div>
    <div className="section-title"><h2>Conviene repasar</h2><span>{needs.length}</span></div>
    {needs.length===0?<div className="empty">Aún no hay sesiones registradas. Empieza con Flashcards o Quiz.</div>:<div className="progress-list">{needs.map(({row,card})=><div key={row.cardId}><div><b>{card!.name}</b><small>{row.state} · racha {row.streak}</small></div><div className="mastery-bar"><i style={{width:`${row.mastery}%`}}/><span>{row.mastery}%</span></div></div>)}</div>}
  </div>;
}

export function LearnView({back}:{back:()=>void}){
  const [active,setActive]=useState<typeof lessons[number]|null>(null);
  const [tab,setTab]=useState<LearnTab>('ROUTES');
  const [progress,setProgress]=useState<Map<string,LearningProgressRow>>(new Map());
  const refreshProgress=async()=>setProgress(await learningProgressMap());
  useEffect(()=>{void refreshProgress()},[]);
  const studied=useMemo(()=>progress.size,[progress]);

  if(active) return <section className="page"><button className="text-button" onClick={()=>setActive(null)}>← Aprender</button><span className="eyebrow">LECCIÓN</span><h1>{active.title}</h1><p className="lead">{active.text}</p><div className="lesson-panel"><b>Idea central</b><p>{lessonCentral[active.id]}</p></div><div className="lesson-panel"><b>Regla ORÁCULO TAROT</b><p>{lessonRule[active.id]}</p></div></section>;

  return <section className="page"><button className="text-button" onClick={back}>← Tarot</button><span className="eyebrow">APRENDER · v0.5</span><h1>Aprende Rider–Waite</h1><p className="muted">Estudia a tu ritmo. El progreso se guarda localmente y forma parte del respaldo de ORÁCULO TAROT.</p>
    <div className="learn-tabs"><button className={tab==='ROUTES'?'selected':''} onClick={()=>setTab('ROUTES')}>Rutas</button><button className={tab==='FLASHCARDS'?'selected':''} onClick={()=>setTab('FLASHCARDS')}>Flashcards</button><button className={tab==='QUIZ'?'selected':''} onClick={()=>setTab('QUIZ')}>Quiz</button><button className={tab==='PROGRESS'?'selected':''} onClick={()=>setTab('PROGRESS')}>Progreso</button></div>
    {tab==='ROUTES'&&<><div className="learning-status"><b>{studied}/78</b><span>cartas con actividad registrada</span></div><div className="learning-grid">{lessons.map(lesson=><button key={lesson.id} className="feature-card" onClick={()=>setActive(lesson)}><b>{lesson.title}</b><span>{lesson.text}</span><small>{lesson.progress}</small></button>)}</div></>}
    {tab==='FLASHCARDS'&&<Flashcards refreshProgress={refreshProgress}/>} 
    {tab==='QUIZ'&&<Quiz refreshProgress={refreshProgress}/>} 
    {tab==='PROGRESS'&&<Progress progress={progress}/>} 
  </section>;
}
