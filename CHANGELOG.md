# ORÁCULO TAROT — CHANGELOG

## 1.0.0-beta.6
- Clasificación robusta 4.0 para una sola carta.
- Detalle fino 32×54 y cromaticidad local 8×12 añadidos al descriptor visual.
- Ranking robusto entre pequeñas variaciones del mismo encuadre.
- Confianza de identificación separada de la similitud visual y métrica de estabilidad.
- Detección multicarta reforzada por regiones y bloqueo duro del modo individual.
- Mantiene orientación 3.0, ajuste de cuatro esquinas, selección manual y mazo 78/78 local.

## 1.0.0-beta.4
- Reconstruye orientación como etapa separada de la identificación de carta.
- La foto original y una copia rotada físicamente 180° se comparan contra una única referencia derecha.
- El ranking de identidad deja de depender de una referencia invertida artificial.
- Añade confianza y margen específicos de orientación: alta, media, baja o dudosa.
- Modo de prueba registra también la orientación real y el diagnóstico calcula acierto derecha/invertida.
- Protege el editor de cuatro esquinas contra selección/copiar, menú contextual y arrastre accidental de la imagen.
- Añade advertencia de encuadre ambiguo cuando no parece existir una sola carta claramente aislada.
- Mantiene reconocimiento individual, ajuste de cuatro esquinas, confirmación táctil, 78/78 imágenes y Tarot estable.

## 1.0.0-beta.3
- Corrige el fallo táctil que impedía confirmar candidatos o selección manual en algunos dispositivos.
- Selección de candidato y confirmación quedan separadas; el candidato elegido se resalta visualmente.
- El guardado de métricas de cámara es no bloqueante: aunque localStorage falle, la carta se confirma.
- Reconocimiento visual 2.5: 64×104, gradientes HOG, estructura, bordes, color y múltiples recortes.
- Top 12 de candidatos y orientación editable antes de confirmar.
- Añade ajuste táctil de cuatro esquinas para rectificar la carta antes de comparar.
- Búsqueda manual rápida por nombre de carta.
- Mantiene 78/78 imágenes locales, motor narrativo 0.6, aclaratorias y catálogo ampliado.

## 1.0.0-beta.1
- Primera Beta funcional sobre la base estable 0.9.1.
- Cámara asistida: reconocimiento local carta por carta, top 5 de candidatos, orientación probable y confirmación manual.
- Motor narrativo 0.6: puentes entre cartas, síntesis más continua y aclaratorias integradas.
- Aclaratorias físicas y virtuales sin sobrescribir la lectura original.
- Catálogo ampliado con 7 nuevas tiradas oficiales, hasta 12 cartas.
- Entrada desde Cámara a Nueva lectura mediante sesión local, sin enviar fotografías a servicios externos.
- Mantiene mazo local 78/78 y diagnósticos separados de motor e imágenes.

## 0.9.1
- Estabilización definitiva del mazo local: 78 imágenes se descargan en build y quedan dentro de la PWA publicada.
- `postinstall` prepara y valida las cartas incluso si persiste un workflow anterior.
- Ruta local pasa a ser la fuente visual primaria.
- Diagnóstico visual comprueba solo archivos locales, no servidores externos.
- Diagnóstico del motor queda separado de imágenes y elimina el falso fallo del 7 de Oros.
- JPG locales incluidos en el precache para funcionamiento offline.

## 0.9.0
- Estabilización visual del mazo Rider-Waite.
- Nueva fuente de imágenes GitHub raw no-LFS con mapeo correcto de arcanos y figuras.
- Wikimedia Commons y copia local como respaldos.
- Carga con timeout y fallback automático.
- Diagnóstico visual 78/78 desde la propia aplicación.
- Cache de imágenes actualizado para funcionamiento progresivamente offline.
- Mantiene motor narrativo 0.5, interpretación general en español, cámara base y respaldo local.

# Changelog

## 0.8.0 — Estabilización narrativa, visual y base de cámara

- Traduce la capa visible de interpretación: confianza, motivos, tensiones, mecanismos, categorías y afirmaciones se presentan en español.
- Añade interpretación general narrativa, conexión entre cartas y conclusión separada.
- Motor narrativo 0.5: mejora la tirada Sentimientos · Pensamientos · Acción y evita inferencias por vectores ausentes.
- Reorganiza los detalles técnicos dentro de «¿Por qué?» y Modo Profesor.
- Añade fallback visual remoto compatible con GitHub Pages y caché progresiva de cartas Rider–Waite.
- La visualización ya no depende de que el workflow descargue 78 imágenes durante el build.
- Añade base de Cámara: captura/selección local de foto, previsualización y guía de encuadre; reconocimiento automático aún no activo.
- Diagnóstico interno comprueba 7 de Oros · As de Espadas · 10 de Espadas, narrativa, conclusión, explicación y cadena visual.
- Añade validación de presentación en español y auditoría de release 0.8.

## 0.7.0 — Beta funcional visual

- Integra las 78 imágenes Rider–Waite–Smith de dominio público durante el build de GitHub Pages.
- Mapeo visual 78/78 con validación específica de 7 de Oros, As de Espadas y 10 de Espadas.
- Las imágenes quedan dentro del artefacto de Pages y el Service Worker las precachea para uso offline.
- Tirada virtual muestra cada carta real, incluida orientación invertida.
- Biblioteca, resultado, historial y aprendizaje usan imágenes reales.
- Interpretar ya no queda bloqueado si la pregunta está vacía: usa “Lectura general de la tirada”.
- Mensajes visibles de cartas faltantes y errores del motor.
- Diagnóstico interno end-to-end con 7 de Oros · As de Espadas · 10 de Espadas.
- Flujo de build reforzado: valida manifest → descarga 78 imágenes → valida archivos → compila PWA.

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
