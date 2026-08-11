# ORÁCULO TAROT 1.0.0 Beta 4 — validación

Objetivo principal: corregir la orientación sin degradar la identificación individual que ya mejoró en Beta 3.

## Cambios críticos
- La identidad de la carta ya no se decide comparando simultáneamente una referencia derecha y una referencia invertida generada matemáticamente.
- Cada consulta genera dos juegos de descriptores: fotografía original y fotografía físicamente rotada 180°.
- Ambos juegos se comparan únicamente contra la referencia derecha de cada carta.
- El mayor valor determina la identidad; recién después la diferencia entre ambas orientaciones determina derecha/invertida.
- La orientación incorpora confianza HIGH / MEDIUM / LOW / AMBIGUOUS y margen independiente.
- Modo de prueba acepta orientación real y registra acierto de orientación.
- Diagnóstico de cámara muestra muestras y porcentaje de orientación correcta.
- Editor de cuatro esquinas bloquea long-press, selección, copiar, menú contextual y arrastre de imagen.
- Si el recorte no aísla claramente una sola carta y la coincidencia es inconclusa, se muestra advertencia de encuadre ambiguo.

## Regla de aceptación en dispositivo
Probar al menos Mago, Templanza y Justicia:
1. derecha;
2. invertida;
3. repetir una de ellas con ajuste de cuatro esquinas.

La Beta 4 se considera satisfactoria si la identidad permanece dentro de candidatos razonables en ambas orientaciones y el indicador derecha/invertida mejora sustancialmente respecto de Beta 3. Si la orientación queda AMBIGUOUS, la interfaz debe permitir corregirla antes de confirmar.
