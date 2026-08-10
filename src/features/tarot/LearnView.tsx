import { useState } from 'react';

const lessons=[
  {id:'start',title:'Primeros pasos',progress:'Base',text:'Mayores y Menores, los cuatro palos, derecho/invertido y cómo formular una pregunta.'},
  {id:'fool',title:'Viaje del Loco',progress:'22 etapas',text:'Recorre los Arcanos Mayores como una secuencia de inicio, aprendizaje, crisis, integración y culminación.'},
  {id:'suits',title:'Los cuatro palos',progress:'56 cartas',text:'Bastos mueve, Copas siente, Espadas piensa y Oros construye en la realidad concreta.'},
  {id:'courts',title:'Las figuras',progress:'16 cartas',text:'Sota descubre, Caballero mueve, Reina encarna y Rey dirige; el palo define qué energía expresan.'},
];

export function LearnView({back}:{back:()=>void}){
  const [active,setActive]=useState<typeof lessons[number]|null>(null);
  if(active) return <section className="page"><button className="text-button" onClick={()=>setActive(null)}>← Aprender</button><span className="eyebrow">LECCIÓN BASE</span><h1>{active.title}</h1><p className="lead">{active.text}</p><div className="lesson-panel"><b>Idea central</b><p>{active.id==='start'?'Una carta cambia según la pregunta, la posición y las cartas que la rodean; no existe una frase universal que sirva para todos los contextos.':active.id==='fool'?'El Loco inicia el viaje y El Mundo culmina e integra; después puede comenzar un nuevo ciclo.':active.id==='suits'?'Los palos ayudan a identificar rápidamente el campo principal de una carta antes de entrar en matices.':'El rango aporta una función estable y el palo aporta el contenido que esa función mueve, recibe o dirige.'}</p></div><div className="lesson-panel"><b>Regla ORÁCULO TAROT</b><p>{active.id==='start'?'Sentimiento ≠ intención ≠ acción. La app mantiene esas dimensiones separadas.':active.id==='fool'?'Los Arcanos Mayores tienen mayor dominancia estructural, pero la posición y la pregunta siguen mandando.':active.id==='suits'?'No confundas intensidad con positividad: un palo puede estar muy presente y describir tanto su luz como su sombra.':'Las figuras no representan automáticamente género: pueden ser persona, estado, forma de actuar o energía de la situación.'}</p></div></section>;
  return <section className="page"><button className="text-button" onClick={back}>← Tarot</button><span className="eyebrow">APRENDER</span><h1>Aprende Rider–Waite</h1><p className="muted">Primera ruta funcional de estudio. Las flashcards y cuestionarios entrarán en una versión posterior.</p><div className="learning-grid">{lessons.map(lesson=><button key={lesson.id} className="feature-card" onClick={()=>setActive(lesson)}><b>{lesson.title}</b><span>{lesson.text}</span><small>{lesson.progress}</small></button>)}</div></section>;
}
