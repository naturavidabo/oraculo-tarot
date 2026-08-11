export type TarotScreen='hub'|'reading'|'camera'|'library'|'history'|'learn';
export function TarotHub({go}:{go:(screen:TarotScreen)=>void}){
  return <section className="page">
    <header className="hero tarot-brand-header"><div className="mini-brand-mark"><img src="./icons/icon-192.png" alt="" /></div><div><span className="eyebrow">ORÁCULO TAROT</span><h1>Tarot Rider–Waite</h1><p>Consulta, interpreta, estudia y registra tus tiradas.</p></div></header>
    <button className="primary-cta" onClick={()=>go('reading')}>+ Nueva lectura</button>
    <div className="card-grid two">
      <button className="feature-card" onClick={()=>go('reading')}><b>Cartas físicas / virtual</b><span>Selector inteligente y catálogo ampliado de 1 a 12 cartas.</span></button>
      <button className="feature-card" onClick={()=>go('camera')}><b>📷 Cámara</b><span>Reconocimiento asistido carta por carta con confirmación antes de interpretar.</span></button>
      <button className="feature-card" onClick={()=>go('library')}><b>Biblioteca 78</b><span>Busca y explora el contenido estructurado 1.0.</span></button>
      <button className="feature-card" onClick={()=>go('history')}><b>Historial</b><span>Lecturas guardadas, método, cartas y explicación.</span></button>
      <button className="feature-card" onClick={()=>go('learn')}><b>Aprender</b><span>Primeros pasos, Viaje del Loco, palos y figuras.</span></button>
    </div>
  </section>;
}
