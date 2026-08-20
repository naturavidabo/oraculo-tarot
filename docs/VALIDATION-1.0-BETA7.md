# ORÁCULO TAROT 1.0.0 Beta 7 — validación

## Objetivo
Sustituir el ranking visual global como motor principal por una arquitectura geométrica para una sola carta, manteniendo el clasificador Beta 6 como verificación/respaldo.

## Flujo V7
1. La foto se reduce de forma controlada y se extraen puntos locales distribuidos.
2. Cada punto recibe orientación por centroide de intensidad y descriptor binario de 256 bits.
3. Se comparan correspondencias contra las 78 referencias locales.
4. Los candidatos con más correspondencias pasan a RANSAC.
5. RANSAC exige una homografía coherente y mide inliers, cobertura y error de reproyección.
6. La homografía rectifica la carta encontrada y el descriptor visual anterior actúa como segunda comprobación.
7. Si la geometría no es suficiente, V7 cae explícitamente al motor Beta 6.3 como respaldo.
8. Si dos cartas distintas presentan geometrías fuertes y espacialmente separadas, el modo individual se bloquea.

## Funciones preservadas
- 78/78 cartas.
- derecha/invertida como etapa separada.
- ajuste manual de cuatro esquinas.
- selección manual y táctil.
- tiradas, aclaratorias, historial y motor interpretativo.
- funcionamiento offline tras la instalación/PWA precacheada.

## Criterio de prueba física
Primera batería: Mago, Templanza, Justicia, Hierofante, As de Copas y As de Oros. Para cada una registrar puesto, puntuación, confianza y orientación. Después repetir al menos Mago y Templanza con rotación/perspectiva moderada y probar Hierofante + Templanza juntos.

Objetivo para avanzar: cartas razonables normalmente Top 1–3 y escenas con dos cartas bloqueadas por evidencia geométrica, no solo por la guía previa.

## Transparencia
Las validaciones automáticas comprueban estructura, integración y regresiones de software. La precisión real de cámara solo queda validada mediante fotografías físicas en el dispositivo.
