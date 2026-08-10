# ORÁCULO TAROT PWA

PWA offline-first para Tarot Rider-Waite. El proyecto está preparado para crecer más adelante hacia Astrología, Personas, Matriz y Quirología sin rehacer el núcleo.

## Estado actual
**Versión de trabajo 0.6.0** — saneamiento de compilación, validaciones y despliegue antes de continuar con nuevas funciones.

Incluye:
- identidad visual oficial ORÁCULO TAROT;
- 78 cartas Rider-Waite estructuradas (Content Pack 1.0);
- biblioteca offline y perfiles locales;
- selector inteligente de tiradas;
- cartas físicas y tirada virtual;
- motor contextual 0.4 con motivos, tensiones y secuencias;
- combinaciones especiales curadas;
- cartas aclaratorias y revisiones inmutables;
- registro de resultado observado;
- respaldo/restauración local con comprobación SHA-256;
- modos Rápida, Normal, Profunda y Profesor;
- historial con favoritos, revisiones y evaluación;
- **Modo Aprender v0.5** con rutas, flashcards, repetición adaptativa, quiz, notas y progreso 78/78;
- progreso de aprendizaje incluido en los respaldos;
- workflow real `.github/workflows/deploy-pages.yml` para GitHub Pages;
- copia visible de verificación en `GITHUB_PAGES_SETUP/`, control `validate:pages` y auditoría automática de release.

## Arquitectura
- React + TypeScript
- Vite
- Dexie / IndexedDB
- Zod
- vite-plugin-pwa

El núcleo Tarot no requiere Supabase ni servidor para funcionar.

## Pruebas del núcleo
```bash
npm run test:core
```
Incluye validación del Content Pack, reglas especiales, presencia del workflow GitHub Pages, sintaxis, selector de tiradas y pruebas semánticas de referencia.

## Desarrollo
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Publicación
El repositorio está preparado para GitHub Pages mediante `.github/workflows/deploy-pages.yml`.

Al subir la versión verifica en GitHub que exista exactamente:
```text
.github/workflows/deploy-pages.yml
```
También se incluye `SUBIDA-GITHUB-LEEME.txt` con el control rápido.

## Versiones internas
- App: 0.6.0
- Tarot Content: 1.0.0
- Tarot Engine: 0.4.0
- Database schema: 3
