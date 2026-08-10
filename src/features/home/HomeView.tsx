export function HomeView({onNewReading,onLibrary}:{onNewReading:()=>void;onLibrary:()=>void}){
  return <section className="page home-page">
    <header className="brand-hero">
      <img src="./branding/oraculo-tarot-cover.webp" alt="ORÁCULO TAROT" className="brand-cover" />
      <div className="brand-copy"><span className="eyebrow">RIDER–WAITE · OFFLINE FIRST</span><h1>ORÁCULO TAROT</h1><p>Consulta, interpreta, estudia y conserva tus tiradas en un entorno privado y local.</p></div>
    </header>
    <button className="primary-cta" onClick={onNewReading}>+ Nueva lectura</button>
    <div className="card-grid two">
      <button className="feature-card" onClick={onNewReading}><b>🃏 Nueva tirada</b><span>Cartas físicas o mazo virtual.</span></button>
      <button className="feature-card" onClick={onLibrary}><b>Biblioteca 78</b><span>Consulta cartas, vectores y significados.</span></button>
    </div>
    <div className="section-title"><h2>Versión de trabajo</h2><span>0.6.0</span></div>
    <div className="status-card"><div><strong>78</strong><span>cartas reales</span></div><div><strong>2</strong><span>métodos de tirada</span></div><div><strong>Local</strong><span>historial privado</span></div></div>
  </section>;
}
