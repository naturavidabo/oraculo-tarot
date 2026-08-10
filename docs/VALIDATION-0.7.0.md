# Validación — ORÁCULO TAROT 0.7.0

## Objetivo
Primera beta centrada en completar el flujo visible de una lectura y no solamente la estructura técnica.

## Controles incluidos
- Content Pack: 78/78 cartas.
- Manifest visual: 78/78 IDs únicos.
- Casos conocidos: 7 de Oros, As de Espadas, 10 de Espadas.
- Descarga build-time desde Wikimedia Commons a `public/cards/`.
- Cada imagen descargada debe superar 5 KB.
- El build no continúa si falta una sola imagen.
- GitHub Pages compila solamente después de validar las 78 imágenes.
- Diagnóstico en la propia app ejecuta una interpretación real con 3 cartas conocidas.

## Fuente visual
Rider–Waite–Smith, ilustraciones de Pamela Colman Smith, 1910. Conjunto “Rider-Waite-Smith tarot deck (Geldard)” de Wikimedia Commons, identificado como dominio público. Las imágenes se copian durante el build; la PWA publicada no necesita hotlink para mostrarlas.

## Limitación del entorno de preparación
El entorno local de generación no dispone del registro npm completo ni salida directa a Internet desde Node. Por eso la descarga de imágenes y el `vite build` completo se ejecutan y verifican en GitHub Actions, donde el workflow detiene el despliegue ante cualquier imagen ausente o build fallido.
