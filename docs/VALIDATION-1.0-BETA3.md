# ORÁCULO TAROT 1.0.0 Beta 3 — validación

## Objetivo
Corregir los controles táctiles de cámara y mejorar la precisión del reconocimiento sin afectar la base estable 78/78.

## Cambios críticos
- Confirmación de candidato separada del toque de selección.
- Confirmación manual no depende de localStorage ni de métricas.
- Botones táctiles con `type=button`, área mínima y `touch-action`.
- Reconocimiento 2.5: análisis 64×104, HOG, estructura, bordes, color y Top 12.
- Ajuste manual de cuatro esquinas con rectificación bilineal antes de comparar.
- Búsqueda manual por nombre.

## Regla de aceptación
1. Tocar un candidato debe resaltarlo.
2. “Confirmar candidato seleccionado” debe añadirlo a Cartas confirmadas.
3. La selección manual debe confirmar aunque el guardado de estadísticas falle.
4. El modo de cuatro esquinas debe reanalizar la misma foto con `MANUAL_CORNERS`.
5. Diagnóstico visual debe continuar en 78/78 y motor interpretativo en verde.
