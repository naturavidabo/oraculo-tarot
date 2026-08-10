# ORÁCULO TAROT PWA

PWA offline-first para Tarot Rider-Waite. El proyecto está preparado para crecer más adelante hacia Astrología, Personas, Matriz y Quirología sin rehacer el núcleo.

## Estado actual
**Versión de trabajo 0.4.0** — robustez del motor, combinaciones curadas, aclaratorias, revisiones, evaluación y respaldo local.

Incluye:
- identidad visual oficial ORÁCULO TAROT;
- 78 cartas Rider-Waite estructuradas (Content Pack 1.0);
- biblioteca offline y perfiles locales;
- selector inteligente de tiradas;
- cartas físicas y tirada virtual;
- motor contextual 0.4 con motivos, tensiones y secuencias;
- biblioteca inicial de combinaciones especiales curadas;
- cartas aclaratorias con peso secundario y vínculo a la posición original;
- revisiones inmutables: una aclaratoria crea una nueva revisión sin destruir la original;
- registro de resultado observado (coincidió / parcial / no coincidió / indeterminado);
- respaldo/restauración local con comprobación SHA-256 de integridad;
- modos Rápida, Normal, Profunda y Profesor;
- historial con favoritos, revisiones y evaluación;
- módulo Aprender inicial;
- PWA preparada para GitHub Pages.

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
Incluye validación del Content Pack, reglas especiales, sintaxis, selector de tiradas y pruebas semánticas de referencia.

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

## Versiones internas
- App: 0.4.0
- Tarot Content: 1.0.0
- Tarot Engine: 0.4.0
- Database schema: 2
