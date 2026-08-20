# ORÁCULO TAROT

**Versión 1.0.0 Beta 4 — Orientación 3.0, ajuste táctil protegido y reconocimiento individual reforzado**

PWA de Tarot Rider–Waite con tiradas físicas/virtuales, interpretación local en español, biblioteca, historial, aprendizaje y funcionamiento offline progresivo.

## Qué cambia en 0.8

- La presentación de la lectura queda en español: los códigos internos del motor ya no deben mostrarse directamente al usuario.
- Añade **Interpretación general**, **Cómo se conectan las cartas** y **Conclusión**, separando la lectura humana de los detalles técnicos.
- Motor narrativo 0.5 con síntesis específica para Sentimientos · Pensamientos · Acción y reglas contextuales más cuidadosas.
- Las imágenes de las 78 cartas usan una ruta visual compatible con GitHub Pages y caché progresiva; la interfaz conserva fallback si una fuente falla.
- Añade módulo **Cámara** para capturar o seleccionar una foto de una tirada física. En 0.8 la foto se mantiene local y la identificación automática todavía no está habilitada.
- Mantiene tirada física, virtual, historial, aclaratorias, backup, biblioteca y aprendizaje.

## Publicación

El workflow incluido valida contenido, combinaciones, 78 mapeos visuales y la capa de presentación en español antes de compilar con Vite y publicar en GitHub Pages.

La visualización de cartas ya **no depende de descargar las 78 imágenes durante GitHub Actions**. Esto evita que una carpeta `.github` antigua deje la PWA sin cartas.

## Datos personales

Lecturas, personas, notas y progreso se guardan localmente en IndexedDB mediante Dexie. Supabase no es requisito para esta versión.

## Cámara

0.8 prepara el flujo de captura local. La futura identificación automática seguirá una etapa separada: detección de carta → corrección de perspectiva → clasificación entre 78 cartas → orientación → confianza → confirmación del usuario.


## 0.9.0 — estabilización visual
La aplicación usa una fuente GitHub raw no-LFS, Wikimedia Commons y copia local como rutas de respaldo para las 78 cartas. En Más → Diagnóstico visual se puede comprobar la carga real de 78/78 imágenes en el dispositivo.

## 0.9.1 — mazo local obligatorio
Durante el build se preparan 78 JPEG dentro de `public/cards`. GitHub Pages publica esas imágenes junto a la app y el diagnóstico visual solo considera válida una carta si carga desde el propio sitio. Las fuentes externas son únicamente respaldo de emergencia.


## 1.0 Beta — nuevo bloque funcional
- Reconocimiento asistido carta por carta usando las 78 imágenes locales.
- Confirmación obligatoria de candidato y orientación antes de usar una carta detectada.
- Motor narrativo 0.6 con puentes entre cartas y aclaratorias integradas.
- Aclaratorias físicas o virtuales con revisiones inmutables.
- Catálogo oficial ampliado: Sí/No contextual, Dos caminos, Trabajo, Dinero, Relación completa, Cruz Celta y Rueda anual.
- El reconocimiento múltiple de varias cartas en una sola fotografía queda para una fase posterior.


## 1.0.0 Beta 4 — orientación 3.0 y editor táctil protegido
- Separa identificación de carta y orientación: el ranking ya no depende de una referencia invertida artificial.
- Compara la fotografía original y una copia físicamente rotada 180° contra una única referencia derecha por carta.
- Añade confianza y margen específicos para derecha/invertida; si la diferencia es pequeña, la orientación se presenta como dudosa.
- Modo de prueba permite registrar también la orientación real y el diagnóstico muestra porcentaje de aciertos de orientación.
- El ajuste de cuatro esquinas bloquea selección de texto, copiar, menú contextual y arrastre de imagen en móvil.
- Añade advertencia cuando el encuadre no parece aislar una sola carta con suficiente claridad.
- Mantiene selección/confirmación separadas, búsqueda manual y todo el bloque Tarot estable.

## 1.0.0 Beta 3 — reconocimiento visual 2.5 y controles táctiles
- Corrige el bloqueo táctil de candidatos y confirmación manual: seleccionar y confirmar son acciones separadas.
- El guardado de estadísticas ya no puede impedir confirmar una carta.
- Aumenta el análisis a 64×104 e incorpora gradientes HOG, estructura, bordes y color.
- Ranking completo 1–78 y Top 12 visible.
- Añade ajuste preciso de cuatro esquinas para rectificar una foto cuando el recorte automático no basta.
- Mantiene confianza alta/media/baja/no concluyente y modo de prueba con métricas locales.
- Las fotografías no se almacenan.



## 1.0.0 Beta 7.0.1 — motor híbrido individual
Beta 7.0.1 conserva la geometría de V7 y añade una segunda vía visual independiente para rescatar cartas pequeñas, simples o con pocos puntos locales. La detección de keypoints usa umbral adaptativo y una pirámide más amplia; la orientación derecha/invertida se deriva primero de la homografía; y el detector multicarta acepta una segunda homografía moderada si está espacialmente separada de la primera.

## 1.0.0 Beta 7 — motor geométrico individual
Beta 7 cambia la arquitectura principal del reconocimiento de cámara. En vez de decidir por semejanza global, detecta puntos locales de la ilustración, construye descriptores binarios orientados, busca correspondencias contra las 78 referencias y exige una homografía coherente con RANSAC. La homografía permite rectificar la carta encontrada y el clasificador visual de Beta 6 queda como segunda comprobación. Si la geometría no es suficiente, el motor anterior sigue disponible como respaldo; selección manual y cuatro esquinas permanecen intactas.

La detección de más de una carta deja de depender únicamente de la guía previa: el bloqueo definitivo puede surgir de dos coincidencias geométricas fuertes y separadas espacialmente. Esta versión sigue enfocada en una carta; el reconocimiento múltiple real se habilitará después de validar físicamente la base geométrica.

## 1.0.0 Beta 6.3 — clasificación robusta 4.3
Beta 6.3 profundiza el reconocimiento individual antes de iniciar reconocimiento múltiple. Cada carta dispone de varias firmas visuales de referencia, la cámara prueba rescates amplios de rotación (hasta ±26°), escala y posición, y el comparador prioriza la iconografía interior sobre el marco/fondo. La detección de dos cartas contiguas también se refuerza mediante múltiples divisiones espaciales. Se mantienen orientación, cuatro esquinas, selección manual, 78/78 cartas, tiradas, aclaratorias e historial.

## 1.0.0 Beta 6.2 — clasificación robusta 4.2
Beta 6.2 refuerza agresivamente el reconocimiento de una sola carta antes de iniciar reconocimiento múltiple. Añade comparación tolerante a desplazamientos internos, hipótesis más amplias de escala/posición y mayor peso de la iconografía interior para reducir fallos cuando la carta está visible pero ligeramente descuadrada. El bloqueo multicarta de Beta 6.1 se mantiene.

## 1.0.0 Beta 6.1 — clasificación robusta 4.1
La Beta 6.1 no inicia todavía el reconocimiento múltiple. Refuerza primero la identificación de una sola carta con detalle fino, cromaticidad local, ranking estable y bloqueo duro cuando la escena parece contener varias cartas. La confianza de identificación se muestra separada de la similitud visual bruta.
