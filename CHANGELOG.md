# Changelog

## 0.6.1 — Hotfix PWA / Workbox
- Corrige el fallo real de GitHub Actions en `vite-plugin-pwa`: Workbox rechazaba `branding/oraculo-tarot-cover.png` por superar el límite de 2 MiB.
- Elimina el PNG redundante del paquete y conserva el WebP optimizado usado por la interfaz.
- Añade `workbox.globIgnores` para que el build siga funcionando incluso si GitHub conserva una copia antigua del PNG.
- `npm run build` queda orientado al build de producción con Vite; `npm run build:strict` mantiene typecheck + build para desarrollo.
- Mantiene Node 22 y el workflow simplificado de GitHub Pages.

## 0.5.0 — Aprender avanzado + GitHub Pages reforzado
- Añade Modo Aprender con cuatro áreas: Rutas, Flashcards, Quiz y Progreso.
- Añade repetición adaptativa local por carta con estados NEW, LEARNING, REVIEW y MASTERED.
- Añade dominio 0–100, rachas, fecha de última revisión y próxima revisión.
- Añade historial de repasos y distingue Flashcard de Quiz.
- Añade quiz automático de esencia con 4 opciones y retroalimentación inmediata.
- Añade notas personales por carta desde Flashcards sin alterar el contenido oficial.
- Migra ArcanaDB a esquema 3 con learningProgress y flashcardReviews.
- Incluye aprendizaje y repasos dentro del respaldo/restauración local.
- Refuerza `.github/workflows/deploy-pages.yml`: instala, valida núcleo, compila y despliega.
- Añade `validate:pages` para impedir considerar válida una versión si falta el workflow.
- Añade copia visible del workflow e instrucciones de subida para evitar omitir `.github`.
- Mantiene Tarot Engine 0.4.0; esta versión mejora aprendizaje, persistencia y despliegue, no modifica las reglas base de interpretación.

## 0.4.0 — Motor robusto + Aclaratorias + Revisión + Backup
- Añade biblioteca de combinaciones especiales curadas sobre el motor vectorial.
- Añade detección de secuencias: Mundo→Loco, Luna→Sol, 4 Espadas→8 Bastos y otras reglas de referencia.
- Añade patrones de secuencia de tres cartas, incluyendo Colgado→Muerte→Templanza.
- Mantiene salvaguardas: incertidumbre y reserva no se convierten en hechos de engaño/infidelidad.
- Añade cartas aclaratorias con peso secundario (45 %) respecto a la posición principal.
- Cada aclaratoria crea una revisión nueva e inmutable de la lectura.
- Añade registro de resultado observado: coincidió, parcial, no coincidió o indeterminado.
- Migra ArcanaDB a esquema 2 con evaluations, readingEvents y settings.
- Añade respaldo/restauración local con checksum SHA-256.
- Añade suite `npm run test:core` con validaciones de contenido, reglas, selector y motor semántico.
- Actualiza Tarot Engine a 0.4.0.

## 0.3.0 — ORÁCULO TAROT + Selector + Tirada virtual
- Renombra oficialmente la aplicación a ORÁCULO TAROT.
- Integra identidad visual azul/índigo/morado/negro con dorado.
- Añade portada de marca e iconos PNG para PWA.
- Añade clasificador local de preguntas y recomendación de tiradas con puntuación.
- Habilita el catálogo actual de tiradas desde la misma pantalla de lectura.
- Añade método de tirada virtual con Web Crypto, barajado Fisher–Yates, corte opcional e invertidas configurables.
- Mantiene ingreso manual de cartas físicas y prevención de duplicados.
- Registra correctamente PHYSICAL/VIRTUAL en el historial.
- Actualiza Tarot Engine a 0.3.0.
- Añade modos de presentación Rápida, Normal, Profunda y Profesor.
- Enriquece Historial con detalle de lectura, cartas, interpretación original y favoritos.
- Añade primera ruta funcional de Aprender: Primeros pasos, Viaje del Loco, palos y figuras.

## 0.2.0 — Content Pack + Motor contextual
- Migra las 78 cartas a Content Pack Tarot 1.0.
- Elimina vectores genéricos de los Arcanos Menores.
- Añade esencia, resumen, luz, sombra, tags, mecanismo, inversión y nota docente por carta.
- Añade perfiles contextuales por posición.
- Añade motor contextual 0.2 con motivos, tensiones, transiciones, claims y salvaguardas.
- Habilita Vínculo profundo de 7 cartas además de Sentimiento/Pensamiento/Acción.
- Enriquece la pantalla de resultado con lectura por posición y perfil simbólico.
- Enriquece la Biblioteca con contenido 1.0.
- Añade validación automática del Content Pack.

## 0.1.0 — Bootstrap
- Esqueleto inicial PWA.
- IndexedDB/Dexie.
- Biblioteca básica.
- Personas.
- Primera tirada física de 3 cartas.

## 0.6.0 — Hotfix de despliegue reproducible
- Añade package-lock.json para instalaciones reproducibles y compatibilidad con npm ci/cache de GitHub Actions.
- Mantiene workflow moderno con Node 22, validación del núcleo y despliegue Pages.
- La versión se valida con npm ci, npm run test:core y npm run build antes de entrega.
