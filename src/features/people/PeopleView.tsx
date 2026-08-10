import { useEffect, useState } from 'react';
import { db, type PersonRow } from '../../db/schema';

export function PeopleView() {
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [name, setName] = useState('');

  async function refresh(){ setPeople(await db.people.orderBy('createdAt').reverse().toArray()); }
  useEffect(()=>{ void refresh(); },[]);

  async function add(){
    const clean=name.trim(); if(!clean) return;
    const now=new Date().toISOString();
    await db.people.add({id:crypto.randomUUID(),displayName:clean,normalizedName:clean.toLocaleLowerCase('es'),createdAt:now,updatedAt:now});
    setName(''); await refresh();
  }

  return <section className="page">
    <span className="eyebrow">PERSONAS</span><h1>Perfiles</h1><p className="muted">La misma persona podrá conectar Tarot, Astrología, Matriz y Quirología.</p>
    <div className="inline-form"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre o alias"/><button onClick={add}>Añadir</button></div>
    <div className="people-list">{people.length===0 ? <div className="empty">Todavía no hay personas guardadas.</div> : people.map(person=><div key={person.id}><div className="avatar">{person.displayName.charAt(0).toUpperCase()}</div><div><b>{person.displayName}</b><small>Perfil local</small></div></div>)}</div>
  </section>;
}
