import { useRef, useState } from 'react';
import { createBackupBlob, downloadBackup, restoreBackupFile } from '../../db/backup';
import { runEngineSelfTest, type SelfTestResult } from '../../engine/selfTest';

export function MoreView(){
  const inputRef=useRef<HTMLInputElement>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [diagnostic,setDiagnostic]=useState<SelfTestResult|null>(null);

  async function backup(){
    setBusy(true); setMessage('');
    try{ const blob=await createBackupBlob(); downloadBackup(blob); setMessage('Respaldo creado. Guárdalo en un lugar seguro.'); }
    catch{ setMessage('No se pudo crear el respaldo.'); }
    finally{setBusy(false)}
  }
  async function restore(file?:File){
    if(!file) return;
    const ok=window.confirm('Restaurar reemplazará los datos locales actuales por los del respaldo. ¿Continuar?');
    if(!ok){ if(inputRef.current) inputRef.current.value=''; return; }
    setBusy(true); setMessage('');
    try{ const data=await restoreBackupFile(file); setMessage(`Respaldo restaurado correctamente · ${new Date(data.createdAt).toLocaleString('es-BO')}. Recarga la app para ver todos los datos.`); }
    catch{ setMessage('El archivo no es un respaldo válido de ORÁCULO TAROT o su integridad no coincide.'); }
    finally{setBusy(false); if(inputRef.current) inputRef.current.value='';}
  }

  return <section className="page">
    <span className="eyebrow">MÁS · ORÁCULO TAROT 0.8.0</span><h1>Herramientas</h1>
    <div className="feature-card static"><b>Respaldo local</b><span>Exporta lecturas, personas, notas, favoritos, evaluaciones y progreso de aprendizaje.</span></div>
    <div className="backup-actions">
      <button className="primary-cta" disabled={busy} onClick={()=>void backup()}>{busy?'Procesando…':'Crear respaldo'}</button>
      <button className="secondary-cta" disabled={busy} onClick={()=>inputRef.current?.click()}>Restaurar respaldo</button>
      <input ref={inputRef} hidden type="file" accept=".otbackup,application/json" onChange={e=>void restore(e.target.files?.[0])}/>
    </div>
    {message&&<div className="notice-card">{message}</div>}

    <div className="section-title"><h2>Diagnóstico del motor</h2><span>prueba real</span></div>
    <p className="muted">Ejecuta internamente una tirada conocida: 7 de Oros · As de Espadas · 10 de Espadas. Comprueba que el motor devuelva cartas, interpretación global, conclusión, explicación e imagen de respaldo.</p>
    <button className="secondary-cta" onClick={()=>setDiagnostic(runEngineSelfTest())}>Ejecutar diagnóstico</button>
    {diagnostic&&<div className={`diagnostic-panel ${diagnostic.ok?'ok':'fail'}`}><b>{diagnostic.ok?'✓ Motor operativo':'✗ Motor con falla'}</b>{diagnostic.checks.map(item=><div key={item.label}><span>{item.ok?'✓':'✗'} {item.label}</span><small>{item.detail}</small></div>)}</div>}

    <div className="section-title"><h2>Privacidad</h2><span>sin conexión</span></div>
    <p className="muted">Las lecturas se guardan en IndexedDB del dispositivo. Esta versión no necesita Supabase para conservarlas.</p>

    <div className="section-title"><h2>Imágenes Rider–Waite</h2><span>dominio público</span></div>
    <p className="muted">La app usa una ruta visual compatible con GitHub Pages y conserva progresivamente las cartas consultadas en caché. Si existe una copia local, también puede utilizarla como respaldo.</p>
  </section>;
}
