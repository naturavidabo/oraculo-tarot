# Validación — ORÁCULO TAROT 0.6.0

## Correcciones de saneamiento
- `src/db/backup.ts`: transacción Dexie corregida para usar arreglo de tablas y evitar TS2554.
- `scripts/syntax-check.cjs`: validación mediante CLI de TypeScript, sin depender de la API JS eliminada/cambiada.
- `scripts/smoke-selector.cjs` y `scripts/smoke-engine.cjs`: ya no usan `ts.ScriptTarget` ni `ts.transpileModule`; compilan los módulos de prueba mediante la CLI `tsc`.
- Workflow GitHub Pages: Node 22, `npm install`, `test:core`, `build`, configure/upload/deploy.
- Nueva auditoría de release que comprueba archivos esenciales y evita reintroducir el workflow antiguo.

## Pruebas ejecutadas en el entorno de construcción
- Auditoría de release: OK.
- Content Pack: 78/78 cartas, 22 mayores y 56 menores: OK.
- 14 cartas en cada palo: OK.
- 21 referencias de combinaciones especiales: OK.
- Workflow de GitHub Pages: OK.
- Selector inteligente de tiradas: 4/4 casos de referencia: OK.
- Motor semántico: secuencias, deseo bloqueado y tensiones: OK.

## Limitación del entorno
El registro npm interno del entorno de construcción no expone `@types/react`, por lo que no puede reproducirse aquí el `npm install` completo. El workflow de GitHub ejecutará el typecheck y build con el registro npm normal. Esta limitación no se oculta ni se considera una prueba superada.
