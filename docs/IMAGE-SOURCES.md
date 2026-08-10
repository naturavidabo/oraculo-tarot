# Fuentes visuales Rider–Waite–Smith

ORÁCULO TAROT mantiene un manifest 78/78 de las cartas Rider–Waite–Smith.

## Estrategia 0.8

La interfaz intenta una ruta visual pública compatible con GitHub Pages y dispone de una ruta local alternativa. El Service Worker usa caché progresiva para las cartas consultadas. Con esto, la visualización no depende de que GitHub Actions descargue las 78 imágenes durante cada build.

La ruta visual de respaldo sigue el conjunto `yunruse/tarot` (`cards/color/<código>.jpg`). Ese proyecto expone las imágenes mediante GitHub Media/LFS. El contenido interpretativo de ORÁCULO TAROT es propio: no se importan las interpretaciones de ese repositorio.

## Privacidad

La petición de una imagen pública no contiene la pregunta ni el contenido de la tirada. Las lecturas y perfiles permanecen en IndexedDB local.
