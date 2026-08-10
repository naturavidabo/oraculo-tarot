import { useRef, useState } from 'react';
import { createBackupBlob, downloadBackup, restoreBackupFile } from '../../db/backup';

export function MoreView(){
  const inputRef=useRef<HTMLInputElement>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

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
    <span className="eyebrow">MÁS · ORÁCULO TAROT 0.5</span><h1>Herramientas</h1>
    <div className="feature-card static"><b>Respaldo local</b><span>Exporta lecturas, personas, notas, favoritos, evaluaciones y ahora también tu progreso de aprendizaje. El archivo incluye comprobación SHA-256 de integridad.</span></div>
    <div className="backup-actions">
      <button className="primary-cta" disabled={busy} onClick={()=>void backup()}>{busy?'Procesando…':'Crear respaldo'}</button>
      <button className="secondary-cta" disabled={busy} onClick={()=>inputRef.current?.click()}>Restaurar respaldo</button>
      <input ref={inputRef} hidden type="file" accept=".otbackup,application/json" onChange={e=>void restore(e.target.files?.[0])}/>
    </div>
    {message&&<div className="notice-card">{message}</div>}
    <div className="section-title"><h2>Privacidad</h2><span>offline-first</span></div>
    <p className="muted">El respaldo se genera desde la base local del dispositivo. Esta versión no necesita Supabase para conservar tus lecturas.</p>
  </section>;
}
