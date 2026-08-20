# ORÁCULO TAROT — CHANGELOG

## 1.0.0-beta.6.3
- Clasificación robusta 4.3 centrada en reconocimiento individual.
- Varias firmas visuales por cada una de las 78 cartas, reduciendo dependencia de una referencia ideal única.
- Rescates de rotación ampliados hasta ±26°, además de escala y desplazamiento.
- Mayor peso de estructura/iconografía interior y menor dependencia del marco y fondo.
- Detección de dos cartas contiguas reforzada con múltiples divisiones espaciales.
- Mantiene orientación, 4 esquinas, selección manual, tiradas, aclaratorias, historial y motor interpretativo.

## 1.0.0-beta.6.2
- Reconocimiento individual robusto 4.2.
- Comparación de detalle fino, estructura y bordes tolerante a desplazamientos internos.
- Rescates más amplios de rotación, escala y posición para cartas ligeramente descuadradas.
- Mayor peso de la iconografía interior y menor dependencia del marco perfecto.
- Mantiene bloqueo multicarta conservador, orientación, 4 esquinas, selección manual y motor interpretativo.

## 1.0.0-beta.6.1
- Corrige falsos positivos multicarta con ventanas espaciales casi disjuntas y bloqueo más conservador.
- Añade comparación interior para reducir sensibilidad a bordes recortados y perspectiva leve.
- Amplía hipótesis de encuadre para cartas algo desplazadas, sin tocar orientación ni ajuste manual de 4 esquinas.
- Mantiene selección manual, 78/78 cartas, tiradas, aclaratorias, historial y motor interpretativo.

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

## 0.8.0 — Estabilización narrativa, visual y base de cámara
- Traduce la capa visible de interpretación: confianza, motivos, tensiones, mecanismos, categorías y afirmaciones se presentan en español.
- Añade interpretación general narrativa, conexión entre cartas y conclusión separada.
- Motor narrativo 0.5: mejora la tirada Sentimientos · Pensamientos · Acción y evita inferencias por vectores ausentes.
- Reorganiza los detalles técnicos dentro de «¿Por qué?» y Modo Profesor.
- Añade fallback visual remoto compatible con GitHub Pages y caché progresiva de cartas Rider–Waite.
- Añade base de Cámara: captura/selección local de foto, previsualización y guía de encuadre.

## 0.7.0 — Beta funcional visual
- Integra las 78 imágenes Rider–Waite–Smith de dominio público durante el build de GitHub Pages.
- Mapeo visual 78/78 con validación específica de 7 de Oros, As de Espadas y 10 de Espadas.
- Tirada virtual muestra cada carta real, incluida orientación invertida.
- Biblioteca, resultado, historial y aprendizaje usan imágenes reales.
- Diagnóstico interno end-to-end con cartas de referencia.

## 0.6.1 — Hotfix PWA / Workbox
- Corrige el fallo de Workbox por archivo de branding superior a 2 MiB.
- Conserva el WebP optimizado usado por la interfaz.
- Añade exclusión del PNG legado y mantiene Node 22.

## 0.6.0 — Despliegue reproducible
- Añade package-lock para instalaciones reproducibles.
- Mantiene workflow moderno con Node 22, validación de núcleo y despliegue Pages.

## 0.5.0 — Aprender avanzado + GitHub Pages reforzado
- Añade Rutas, Flashcards, Quiz y Progreso.
- Repetición adaptativa local, dominio 0–100 y estados NEW/LEARNING/REVIEW/MASTERED.
- Añade historial de repasos, notas personales y respaldo del progreso.

## 0.4.0 — Motor robusto + Aclaratorias + Revisión + Backup
- Añade combinaciones especiales, secuencias y salvaguardas.
- Añade aclaratorias con revisiones inmutables.
- Respaldo/restauración local con checksum SHA-256.

## 0.3.0 — ORÁCULO TAROT + Selector + Tirada virtual
- Renombra oficialmente la aplicación a ORÁCULO TAROT.
- Integra identidad visual azul/índigo/morado/negro con dorado.
- Añade clasificador local de preguntas, tirada virtual y modos de presentación.

## 0.2.0 — Content Pack + Motor contextual
- Migra las 78 cartas a Content Pack Tarot 1.0.
- Añade esencia, resumen, luz, sombra, tags, mecanismo, inversión y nota docente por carta.
- Añade perfiles contextuales y motor contextual.

## 0.1.0 — Bootstrap
- Esqueleto inicial PWA.
- IndexedDB/Dexie.
- Biblioteca básica.
- Personas.
- Primera tirada física de 3 cartas.
