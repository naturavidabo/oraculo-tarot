# ORÁCULO TAROT 1.0.0 Beta 6 — validación

## Objetivo
Cerrar la fase de reconocimiento individual antes de iniciar reconocimiento múltiple.

## Cambios críticos
- Descriptor más discriminativo: detalle fino, estructura, bordes, HOG, color regional, cromaticidad local e histograma.
- Coincidencia robusta: una carta debe mantenerse fuerte entre pequeñas variaciones del mismo encuadre; se reduce el efecto de un único ajuste afortunado.
- Autoencuadre con hipótesis completas, un único encuadre ganador para las 78 cartas.
- Detección multicarta reforzada examinando dos regiones laterales y dos regiones verticales con forma de carta.
- Bloqueo duro del reconocimiento individual si se sospechan varias cartas.
- Confianza de identificación separada del porcentaje de similitud visual.
- Métrica de estabilidad del ranking.
- Mantiene orientación 3.0 y rectificación manual por cuatro esquinas.

## Regla de aceptación
Con fotografías razonables de Mago, Templanza, Justicia, Hierofante, As de Copas y As de Oros, la carta real debe aparecer de forma consistente en Top 1–3. Un ligero descuadre no debería expulsarla del Top 5; si lo hace, el ajuste de cuatro esquinas debe recuperarla. Una foto con dos cartas debe bloquear el modo individual antes de mostrar candidatos.
