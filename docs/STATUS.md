# Estado de ORÁCULO TAROT

## Versión de trabajo: 1.0.0 Beta 6.2

Estado: **Tarot estable + cámara individual en afinación avanzada**.

### Base estable
- 78/78 imágenes Rider–Waite locales.
- Motor interpretativo independiente de imágenes y diagnóstico operativo.
- Tiradas físicas y virtuales, historial, aclaratorias, biblioteca, aprendizaje y respaldo.
- Motor narrativo 0.6 en español.
- Selección manual y confirmación táctil operativas.

### Cámara Beta 6.2
- Reconocimiento de una carta por fotografía.
- Comparación visual 2.5/3.0 con estructura, bordes, color, HOG y varios recortes.
- Ajuste preciso de cuatro esquinas.
- **Orientación 3.0:** identidad y derecha/invertida se calculan por etapas separadas.
- La foto original y una copia rotada físicamente 180° se comparan contra la misma referencia derecha.
- Confianza y margen específicos de orientación; puede indicar orientación dudosa.
- Modo de prueba registra carta real y orientación real sin guardar fotografías.
- Editor táctil protegido contra selección/copiar/menú contextual.
- Advertencia de encuadre ambiguo para evitar usar varias cartas en este modo.
- Métricas locales Top 1 / Top 5 / orientación correcta.

### Aún pendiente
- Validar orientación 3.0 con pruebas reales derecha/invertida.
- Seguir mejorando precisión con más pruebas reales.
- Reconocimiento de varias cartas en una sola fotografía.
- Voz / lectura en altavoz.
- IA externa opcional para redacción ampliada.
- Sincronización en nube.
