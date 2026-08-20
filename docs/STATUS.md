# Estado de ORÁCULO TAROT

## Versión de trabajo: 1.0.0 Beta 7

Estado: **Tarot estable + nuevo motor geométrico individual en validación física**.

### Base estable
- 78/78 imágenes Rider–Waite locales tras el build.
- Motor interpretativo independiente de imágenes.
- Tiradas físicas y virtuales, historial, aclaratorias, biblioteca, aprendizaje y respaldo.
- Selección manual y confirmación táctil.
- Orientación derecha/invertida preservada como etapa separada.
- Ajuste preciso de cuatro esquinas preservado como respaldo.

### Cámara Beta 7
- Puntos locales con orientación y descriptor binario de 256 bits.
- Matching contra las 78 cartas.
- Homografía + RANSAC para exigir coherencia geométrica.
- Métricas: correspondencias, inliers, cobertura y error de reproyección.
- Rectificación geométrica antes de la verificación visual secundaria.
- Motor visual Beta 6.3 como fallback si no existe geometría suficiente.
- Detección multicarta basada también en hipótesis geométricas espacialmente separadas.
- La advertencia previa de encuadre no bloquea por sí sola una carta individual.

### Validación física pendiente
- Mago, Templanza, Justicia, Hierofante, As de Copas y As de Oros.
- Rotación/perspectiva moderada con Mago y Templanza.
- Hierofante + Templanza juntos para comprobar bloqueo geométrico.
- Objetivo: Top 1–3 consistente antes de activar reconocimiento múltiple real.

### Después de validar V7
- Reconocimiento experimental de 2–3 cartas.
- Ampliación progresiva a 5–7 y luego 9–12.
- Voz / lectura en altavoz.
- IA externa opcional para redacción ampliada.
- Sincronización en nube opcional.
