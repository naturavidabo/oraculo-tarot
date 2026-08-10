# Validación — ORÁCULO TAROT 0.6.1

## Error real corregido
El run de GitHub Actions 31354969480 llegó correctamente a Vite y generó los bundles, pero `vite-plugin-pwa` falló en `closeBundle` porque `branding/oraculo-tarot-cover.png` pesa 2.34 MB y Workbox limita por defecto el precache a 2 MiB.

## Corrección
- Se elimina el PNG redundante del paquete.
- Se mantiene `branding/oraculo-tarot-cover.webp` (aprox. 133 KB), que es el archivo realmente usado por la app.
- `vite.config.ts` añade `globIgnores` para excluir el PNG legado incluso si queda retenido en el repositorio al subir desde la web.
- Se conserva el cache de iconos PNG necesarios.

## Verificaciones locales posibles
- Estructura de 78 cartas y combinaciones.
- Presencia del workflow.
- Ausencia del PNG pesado en el ZIP 0.6.1.
- Configuración PWA con exclusión explícita del archivo legado.

## Limitación del entorno local
El registro npm interno no expone `@types/react`, por lo que el build final debe confirmarse en GitHub Actions con npm público.
