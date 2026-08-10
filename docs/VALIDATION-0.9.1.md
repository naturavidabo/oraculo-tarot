# ORÁCULO TAROT 0.9.1 — estabilización local del mazo

## Cambio crítico
Las 78 imágenes se descargan **durante la instalación del build de GitHub Actions** a `public/cards/` y luego Vite las copia a `dist/cards/`. La app usa esos archivos locales como primera fuente. GitHub Raw y Wikimedia quedan solo como emergencia visual, no como requisito.

## Doble garantía
1. `postinstall` ejecuta `fetch-card-images.mjs` + `validate-card-assets.mjs`, incluso si GitHub conserva un workflow anterior que hace `npm install` + `npx vite build`.
2. El workflow 0.9.1 vuelve a ejecutar explícitamente descarga y validación antes del build.

## Criterio de aceptación
- 78/78 JPEG locales presentes y válidos antes de `vite build`.
- El diagnóstico visual en la app comprueba **solo recursos locales**.
- El diagnóstico del motor no contiene ninguna prueba de imágenes.
- Las cartas JPG locales forman parte del precache PWA para uso offline.

## Nota de validación del entorno de ChatGPT
Este entorno no dispone de salida de red desde el contenedor, por lo que no puede descargar aquí los 78 JPEG. La lógica de descarga, nomenclatura y validación se audita localmente; GitHub Actions realiza la descarga real y aborta el despliegue si falta una sola carta.
