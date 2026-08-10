# Validación — ORÁCULO TAROT 0.4.0

Fecha de paquete: 2026-08-09 (Bolivia)

## Suite `npm run test:core`

Resultado: **APROBADA**

- Content Pack Tarot 1.0: 78/78 cartas válidas.
- 22 Arcanos Mayores y 56 Menores.
- 14 cartas por cada palo.
- IDs únicos y vectores dentro de rango.
- 21 referencias usadas en reglas especiales apuntan a cartas existentes.
- Sintaxis TypeScript/TSX válida en 26 archivos fuente.
- Selector de tiradas:
  - vínculo → SPREAD_RELATION_07;
  - comunicación → SPREAD_COMM_06;
  - evolución → SPREAD_EVOLUTION_07;
  - oculto → SPREAD_HIDDEN_06.
- Reglas semánticas:
  - Mundo → Loco reconoce reinicio de ciclo;
  - el orden inverso no activa esa regla;
  - Diablo + As de Bastos refuerza deseo sin convertirlo en acción garantizada;
  - Colgado → Muerte → Templanza reconoce suspensión → transformación → integración;
  - deseo alto + baja manifestación reconoce DESIRE_BLOCKED;
  - tensión deseo vs. manifestación detectada.

## Persistencia 0.4

- ArcanaDB schema 2.
- Aclaratorias crean revisiones nuevas.
- Resultado observado se guarda separado de la interpretación.
- Backup `.otbackup` incluye checksum SHA-256 antes de restaurarse.

## Limitación de build en este contenedor

El registro npm interno usado por este entorno devuelve 404 para `@types/react@19.2.17`. Por ello no se pudo completar `npm install` ni ejecutar el build Vite aquí. La suite de lógica y sintaxis sí fue ejecutada.
