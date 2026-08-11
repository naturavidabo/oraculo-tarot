# ORÁCULO TAROT 1.0.0 Beta 2 — validación

Base estable: v0.9.1 (78/78 imágenes locales + motor interpretativo operativo). Beta 1 agregó cámara asistida, aclaratorias, motor 0.6 y catálogo ampliado.

## Objetivo Beta 2
Mejorar sustancialmente el reconocimiento de una sola carta fotografiada sin presentar coincidencias débiles como certeza.

## Arquitectura visual 2.0
1. Intento de localizar los límites de la carta mediante perfiles de bordes verticales y horizontales.
2. Si la detección no es plausible, usa el encuadre central guiado.
3. Normaliza a 48×80 para análisis.
4. Genera pequeñas variantes de rotación, zoom y desplazamiento.
5. Extrae cuatro familias de características: estructura en gris, mapa de bordes Sobel, color regional RGB e histogramas HSV.
6. Compara derecha e invertida con las 78 referencias locales.
7. Devuelve ranking completo 1–78 y Top 8 visible.
8. La confianza puede ser alta, media, baja o no concluyente.

## Calibración local
El usuario puede indicar la carta real durante una prueba. Se registra únicamente: carta real, predicción principal, puesto de la carta real, puntaje y nivel de confianza. No se guarda la foto.

## Criterio práctico
El objetivo inmediato no es prometer 100% de acierto, sino que fotografías razonables coloquen la carta real dentro del Top 5 con mucha más frecuencia. Las estadísticas Top 1 y Top 5 permiten comprobar la mejora con datos del dispositivo real.

## Límites
- Una carta por foto.
- No hay todavía detección de múltiples cartas sobre una mesa.
- La corrección de perspectiva completa por homografía queda reservada para la siguiente iteración si las métricas muestran que sigue siendo necesaria.
- Selección manual siempre disponible.
