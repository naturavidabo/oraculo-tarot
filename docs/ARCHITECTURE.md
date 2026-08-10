# Arquitectura — ORÁCULO TAROT

## Principio
Offline-first. UI, motor, contenido y datos personales permanecen separados.

## Núcleo 0.5
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


## Aprendizaje 0.5
ArcanaDB esquema 3 añade `learningProgress` y `flashcardReviews`. El progreso se guarda localmente, se incluye en backups y nunca modifica el Content Pack oficial.

## Publicación GitHub Pages
El workflow canónico vive en `.github/workflows/deploy-pages.yml`. Antes del build ejecuta `npm run test:core`; si falta el workflow o falla una validación, el despliegue se detiene.
