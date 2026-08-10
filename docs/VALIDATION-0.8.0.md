# Validación ORÁCULO TAROT 0.8.0

## Controles ejecutados en el entorno de preparación

- Auditoría de release 0.8.0: OK.
- Content Pack: 78 cartas, 22 Mayores, 56 Menores: OK.
- Palos: 14 Bastos, 14 Copas, 14 Espadas, 14 Oros: OK.
- 21 referencias de combinaciones curadas: OK.
- Manifest visual: 78/78: OK.
- Capa de presentación en español: OK.
- Workflow Pages 0.8: estructura válida.
- Selector de tiradas: 4 casos de referencia: OK.
- Smoke tests semánticos: secuencias y tensiones de referencia: OK.
- Parseo sintáctico TS/TSX: 32 archivos, 0 errores de sintaxis.
- Prueba de runtime del motor con dos tiradas de referencia: OK.
  - Sota de Espadas · Cinco de Espadas · Siete de Bastos.
  - Siete de Oros · As de Espadas · Diez de Espadas.
- En ambos casos se verificó interpretación global extensa, conclusión y ausencia de códigos ingleses en la narrativa principal.

## Limitación del entorno

No se pudo ejecutar aquí un `npm install` + build de producción completo contra el registro npm público. Por tanto, el build definitivo de la PWA debe validarse en GitHub Actions. El paquete no se presenta como «build local completo aprobado»; sí como código y motor sometidos a las validaciones indicadas arriba.

## Criterio de aprobación en GitHub

La versión se considera publicada correctamente cuando GitHub Actions completa en verde: instalación → validaciones → Vite build → configuración Pages → despliegue.
