# ORÁCULO TAROT

**Versión 1.0.0 Beta 6.3 — Clasificación robusta 4.3 y reconocimiento individual reforzado**

PWA de Tarot Rider–Waite con tiradas físicas/virtuales, interpretación local en español, biblioteca, historial, aprendizaje y funcionamiento offline progresivo.

## Publicación

El workflow incluido valida contenido, combinaciones, 78 mapeos visuales y la capa de presentación en español antes de compilar con Vite y publicar en GitHub Pages.

La visualización de cartas usa las 78 imágenes locales preparadas durante el build. Las fuentes externas quedan únicamente como respaldo visual.

## Datos personales

Lecturas, personas, notas y progreso se guardan localmente en IndexedDB mediante Dexie. Supabase no es requisito para esta versión.

## 1.0.0 Beta 6.3 — clasificación robusta 4.3

Beta 6.3 profundiza el reconocimiento individual antes de iniciar reconocimiento múltiple.

- Cada carta dispone de varias firmas visuales de referencia para reducir la dependencia de un único encuadre ideal.
- La cámara prueba rescates de rotación de hasta ±26°, además de variaciones de escala y posición.
- El comparador da mayor peso a la iconografía y estructura interior que al marco o fondo.
- La detección de dos cartas contiguas se refuerza mediante múltiples divisiones espaciales.
- Se mantienen orientación 3.0, ajuste manual de cuatro esquinas, selección manual, 78/78 cartas, tiradas, aclaratorias, historial y motor interpretativo.

## 1.0.0 Beta 6.2 — clasificación robusta 4.2

Beta 6.2 reforzó el reconocimiento de una sola carta con comparación tolerante a desplazamientos internos, hipótesis más amplias de escala/posición y mayor peso de la iconografía interior. El bloqueo multicarta conservador de Beta 6.1 se mantiene como base.

## 1.0.0 Beta 6.1 — clasificación robusta 4.1

Corrigió falsos positivos multicarta, añadió comparación interior y amplió hipótesis de encuadre para cartas desplazadas sin alterar orientación ni el ajuste manual de cuatro esquinas.

## 1.0.0 Beta 4 — orientación 3.0 y editor táctil protegido

- Separa identificación de carta y orientación.
- Compara fotografía original y copia rotada 180° contra una misma referencia derecha.
- Añade confianza y margen independientes para orientación derecha/invertida.
- El ajuste de cuatro esquinas bloquea selección de texto, copiar, menú contextual y arrastre de imagen en móvil.

## 1.0.0 Beta 3 — reconocimiento visual 2.5 y controles táctiles

- Corrige el bloqueo táctil de candidatos y confirmación manual.
- Aumenta el análisis a 64×104 con gradientes HOG, estructura, bordes y color.
- Ranking completo 1–78 y Top 12 visible.
- Añade ajuste preciso de cuatro esquinas y búsqueda manual por nombre.

## 1.0 Beta — bloque funcional

- Reconocimiento asistido carta por carta usando las 78 imágenes locales.
- Confirmación obligatoria de candidato y orientación.
- Motor narrativo 0.6 con puentes entre cartas y aclaratorias integradas.
- Catálogo ampliado con tiradas de decisión, trabajo, dinero, relación, Cruz Celta y rueda anual.

## 0.9.1 — mazo local obligatorio

Durante el build se preparan 78 JPEG dentro de `public/cards`. GitHub Pages publica esas imágenes junto a la app y el diagnóstico visual comprueba únicamente recursos locales.

## 0.9.0 — estabilización visual

Se incorporó una cadena de respaldo visual para las 78 cartas y diagnóstico desde la propia aplicación.

## 0.8.0 — narrativa y base de cámara

- Presentación de la lectura en español.
- Interpretación general, conexión entre cartas y conclusión separadas.
- Motor narrativo 0.5.
- Base del módulo Cámara con captura local.

## Privacidad

Las fotografías utilizadas por Cámara se procesan localmente y no se almacenan como parte de las métricas de prueba. Las lecturas y perfiles permanecen en el dispositivo.
