# Arquitectura — ORÁCULO TAROT

## Principio
Offline-first. UI, motor, contenido y datos personales permanecen separados.

## Núcleo 0.4
`Pregunta → Clasificador → Tirada → Cartas/Orientación → Contexto → Vectores → Motivos → Combinaciones curadas → Secuencias → Claims → Narrativa → ¿Por qué?`

Las cartas aclaratorias se procesan con peso secundario y no sustituyen la carta principal. Toda modificación interpretativa crea una revisión nueva.

## Persistencia
ArcanaDB / IndexedDB mediante Dexie.

Esquema 2:
- people
- readings
- readingRevisions
- readingCards
- interpretations
- favorites
- cardNotes
- evaluations
- readingEvents
- settings

## Respaldo
Archivo `.otbackup` JSON versionado con checksum SHA-256. La restauración reemplaza la base local únicamente tras confirmación del usuario.

## Publicación
Repositorio GitHub + GitHub Actions + GitHub Pages.
