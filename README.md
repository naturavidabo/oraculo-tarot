# ORÁCULO TAROT

**Versión 0.8.0 — Estabilización narrativa, visual y base de cámara**

PWA de Tarot Rider–Waite con tiradas físicas/virtuales, interpretación local en español, biblioteca, historial, aprendizaje y funcionamiento offline progresivo.

## Qué cambia en 0.8

- La presentación de la lectura queda en español: los códigos internos del motor ya no deben mostrarse directamente al usuario.
- Añade **Interpretación general**, **Cómo se conectan las cartas** y **Conclusión**, separando la lectura humana de los detalles técnicos.
- Motor narrativo 0.5 con síntesis específica para Sentimientos · Pensamientos · Acción y reglas contextuales más cuidadosas.
- Las imágenes de las 78 cartas usan una ruta visual compatible con GitHub Pages y caché progresiva; la interfaz conserva fallback si una fuente falla.
- Añade módulo **Cámara** para capturar o seleccionar una foto de una tirada física. En 0.8 la foto se mantiene local y la identificación automática todavía no está habilitada.
- Mantiene tirada física, virtual, historial, aclaratorias, backup, biblioteca y aprendizaje.

## Publicación

El workflow incluido valida contenido, combinaciones, 78 mapeos visuales y la capa de presentación en español antes de compilar con Vite y publicar en GitHub Pages.

La visualización de cartas ya **no depende de descargar las 78 imágenes durante GitHub Actions**. Esto evita que una carpeta `.github` antigua deje la PWA sin cartas.

## Datos personales

Lecturas, personas, notas y progreso se guardan localmente en IndexedDB mediante Dexie. Supabase no es requisito para esta versión.

## Cámara

0.8 prepara el flujo de captura local. La futura identificación automática seguirá una etapa separada: detección de carta → corrección de perspectiva → clasificación entre 78 cartas → orientación → confianza → confirmación del usuario.
