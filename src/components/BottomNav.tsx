export type Tab = 'home' | 'tarot' | 'astro' | 'people' | 'more';

export function BottomNav({ active, onChange }:{ active:Tab; onChange:(tab:Tab)=>void }) {
  const items: Array<[Tab,string,string]> = [
    ['home','⌂','Inicio'], ['tarot','✦','Tarot'], ['astro','◉','Astro'], ['people','♙','Personas'], ['more','•••','Más'],
  ];
  return <nav className="bottom-nav" aria-label="Navegación principal">
    {items.map(([id, icon, label]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)}>
      <span className="nav-icon">{icon}</span><span>{label}</span>
    </button>)}
  </nav>;
}
