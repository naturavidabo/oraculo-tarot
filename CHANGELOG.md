# Changelog

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
