import { useRef, useState } from 'react';
import { createBackupBlob, downloadBackup, restoreBackupFile } from '../../db/backup';
import { runEngineSelfTest, type SelfTestResult } from '../../engine/selfTest';
import { runImageDiagnostic, type ImageDiagnosticResult } from '../../engine/imageDiagnostics';

export function MoreView(){
  const inputRef=useRef<HTMLInputElement>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [diagnostic,setDiagnostic]=useState<SelfTestResult|null>(null);
  const [imageDiagnostic,setImageDiagnostic]=useState<ImageDiagnosticResult|null>(null);
  const [imageProgress,setImageProgress]=useState('');

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
  async function checkImages(){
    setImageDiagnostic(null);setImageProgress('Iniciando comprobación…');
    const result=await runImageDiagnostic((done,total)=>setImageProgress(`Comprobando imágenes ${done}/${total}…`));
    setImageDiagnostic(result);setImageProgress('');
  }

  return <section className="page">
    <span className="eyebrow">MÁS · ORÁCULO TAROT 0.9.0</span><h1>Herramientas</h1>
    <div className="feature-card static"><b>Respaldo local</b><span>Exporta lecturas, personas, notas, favoritos, evaluaciones y progreso de aprendizaje.</span></div>
    <div className="backup-actions">
      <button className="primary-cta" disabled={busy} onClick={()=>void backup()}>{busy?'Procesando…':'Crear respaldo'}</button>
      <button className="secondary-cta" disabled={busy} onClick={()=>inputRef.current?.click()}>Restaurar respaldo</button>
      <input ref={inputRef} hidden type="file" accept=".otbackup,application/json" onChange={e=>void restore(e.target.files?.[0])}/>
    </div>
    {message&&<div className="notice-card">{message}</div>}

    <div className="section-title"><h2>Diagnóstico visual</h2><span>78 cartas</span></div>
    <p className="muted">Comprueba desde este mismo dispositivo que las 78 imágenes Rider–Waite realmente se pueden cargar. La versión 0.9 usa una fuente GitHub raw no-LFS, Wikimedia Commons y copia local como rutas sucesivas de respaldo.</p>
    <button className="secondary-cta" onClick={()=>void checkImages()} disabled={!!imageProgress}>{imageProgress||'Comprobar las 78 imágenes'}</button>
    {imageDiagnostic&&<div className={`diagnostic-panel ${imageDiagnostic.ok?'ok':'fail'}`}>
      <b>{imageDiagnostic.ok?`✓ ${imageDiagnostic.loaded}/78 imágenes operativas`:`✗ ${imageDiagnostic.loaded}/78 imágenes operativas`}</b>
      {!imageDiagnostic.ok&&<><span>Cartas que no cargaron:</span>{imageDiagnostic.failed.slice(0,12).map(item=><small key={item.cardId}>{item.name}</small>)}{imageDiagnostic.failed.length>12&&<small>…y {imageDiagnostic.failed.length-12} más.</small>}</>}
    </div>}

    <div className="section-title"><h2>Diagnóstico del motor</h2><span>prueba real</span></div>
    <p className="muted">Ejecuta internamente una tirada conocida: 7 de Oros · As de Espadas · 10 de Espadas. Comprueba cartas, interpretación general, conclusión y explicación.</p>
    <button className="secondary-cta" onClick={()=>setDiagnostic(runEngineSelfTest())}>Ejecutar diagnóstico del motor</button>
    {diagnostic&&<div className={`diagnostic-panel ${diagnostic.ok?'ok':'fail'}`}><b>{diagnostic.ok?'✓ Motor operativo':'✗ Motor con falla'}</b>{diagnostic.checks.map(item=><div key={item.label}><span>{item.ok?'✓':'✗'} {item.label}</span><small>{item.detail}</small></div>)}</div>}

    <div className="section-title"><h2>Privacidad</h2><span>local</span></div>
    <p className="muted">Las lecturas se guardan en IndexedDB del dispositivo. Esta versión no necesita Supabase para conservarlas.</p>
  </section>;
}
