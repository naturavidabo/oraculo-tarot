# ORÁCULO TAROT 1.0.0 Beta 5 — validación

## Objetivo
Pulir el reconocimiento individual antes de pasar a varias cartas por fotografía.

## Cambios críticos
- Preflight de encuadre antes de ejecutar las 78 comparaciones.
- Estados: encuadre apto, ajustar encuadre y posible escena con varias cartas.
- Rechazo temprano de escenas que parecen contener más de una carta, salvo que el usuario delimite una carta con 4 esquinas.
- Varios encuadres candidatos se evalúan como rankings completos y se elige un único encuadre ganador para todo el mazo.
- La orientación 3.0 de Beta 4 se mantiene separada de la identidad.
- El ajuste manual de cuatro esquinas sigue siendo la vía de precisión cuando el autoencuadre no basta.

## Criterio de aceptación
1. Mago, Templanza y Justicia deben mantenerse reconocibles derecha e invertida.
2. Un descuadre moderado no debe enviar la carta real al final del ranking si un recorte alternativo razonable la recupera.
3. La cámara debe advertir antes del reconocimiento cuando el encuadre no aísla bien una carta.
4. Una foto con dos cartas debe bloquear el reconocimiento individual o pedir ajuste de cuatro esquinas cuando la geometría sea claramente ambigua.
