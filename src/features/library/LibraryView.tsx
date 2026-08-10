import { useMemo, useState } from 'react';
import { tarotCards } from '../../data/cards';
import { dimensionLabels } from '../../engine/contextProfile';
import type { Suit, TarotDimension } from '../../types/tarot';
import { TarotCardImage } from '../../components/TarotCardImage';

export function LibraryView() {
  const [query, setQuery] = useState('');
  const [suit, setSuit] = useState<'all'|Suit>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const cards = useMemo(() => tarotCards.filter(card => {
    const q = query.trim().toLocaleLowerCase('es');
    const matchesSuit = suit === 'all' || card.suit === suit;
    const haystack = [card.name, card.originalName, card.essence, card.quick, card.teacherNote, ...card.keywords, ...card.tags, ...card.light, ...card.shadow].join(' ').toLocaleLowerCase('es');
    return matchesSuit && (!q || haystack.includes(q));
  }), [query, suit]);

  const active = selected ? tarotCards.find(card => card.id === selected) : undefined;

  if (active) return <section className="page">
    <button className="text-button" onClick={() => setSelected(null)}>← Biblioteca</button>
    <div className="detail-card">
      <TarotCardImage card={active} className="library-detail-image" eager />
      <span className="eyebrow">{active.arcana === 'major' ? 'ARCANO MAYOR' : active.suit.toUpperCase()}</span>
      <h1>{active.name}</h1>
      <p className="lead">{active.essence}</p>
      <p>{active.quick}</p>
      <div className="chips">{active.tags.slice(0,8).map(tag => <span key={tag}>{tag}</span>)}</div>

      <div className="section-title"><h2>Luz</h2></div>
      <div className="chips">{active.light.map(item=><span key={item}>{item}</span>)}</div>
      <div className="section-title"><h2>Sombra</h2></div>
      <div className="chips">{active.shadow.map(item=><span key={item}>{item}</span>)}</div>
      <div className="section-title"><h2>Invertida</h2><span>{active.reversal.modes.join(' · ')}</span></div>
      <p className="muted">{active.reversal.summary}</p>
      <div className="section-title"><h2>Perfil simbólico</h2><span>Content 1.0</span></div>
      <div className="vector-list">{Object.entries(active.vectors).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,12).map(([k,v]) => <div key={k}><span>{dimensionLabels[k as TarotDimension] ?? k}</span><b>{v}</b></div>)}</div>
      <div className="section-title"><h2>Modo profesor</h2><span>{active.mechanism}</span></div>
      <p className="muted">{active.teacherNote}</p>
    </div>
  </section>;

  return <section className="page">
    <div className="section-title"><div><span className="eyebrow">BIBLIOTECA · RIDER–WAITE VISUAL</span><h1>78 cartas</h1></div><span>{cards.length}</span></div>
    <input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar deseo, silencio, estabilidad, nostalgia…" />
    <div className="filter-row">
      {([['all','Todos'],['major','Mayores'],['wands','Bastos'],['cups','Copas'],['swords','Espadas'],['pentacles','Oros']] as const).map(([id,label]) => <button key={id} className={suit===id ? 'selected':''} onClick={()=>setSuit(id)}>{label}</button>)}
    </div>
    <div className="library-grid">
      {cards.map(card => <button key={card.id} className="library-card" onClick={()=>setSelected(card.id)}>
        <TarotCardImage card={card} className="library-card-image" />
        <b>{card.name}</b><small>{card.arcana === 'major' ? 'Arcano Mayor' : card.suit}</small>
      </button>)}
    </div>
  </section>;
}
