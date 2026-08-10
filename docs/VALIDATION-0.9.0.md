# ORÁCULO TAROT 0.9.0 — validación de estabilización visual

Objetivo principal: eliminar la dependencia de `media.githubusercontent.com` y del workflow de descarga de imágenes.

## Cambios críticos
- Fuente visual primaria: `raw.githubusercontent.com/seven102161/elaine-tarot-cards`, repositorio con 78 JPG no-LFS.
- Mapeo explícito de 78 IDs internos a códigos de archivo Rider-Waite.
- Fallback secundario: Wikimedia Commons `Special:Redirect/file`.
- Fallback terciario: copia local `public/cards` si existe.
- Temporizador de 6,5 s por fuente para evitar una carta eternamente en estado de carga.
- Diagnóstico visual desde la app que comprueba 78/78 cartas en el dispositivo real.
- CacheFirst del Service Worker para GitHub raw y Wikimedia.

## Regla de aceptación
La versión visual se considera aprobada cuando el diagnóstico de la app muestra 78/78 imágenes operativas y una tirada virtual muestra cartas reales en mesa y resultado.
