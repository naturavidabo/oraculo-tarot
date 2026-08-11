# ORÁCULO TAROT 1.0 Beta — validación del bloque funcional

Base: v0.9.1, primera versión con 78/78 imágenes locales y diagnóstico interpretativo independiente.

## Cambios del bloque
- Cámara asistida carta por carta: compara una fotografía central con las 78 referencias locales y devuelve cinco candidatos.
- La similitud es orientativa; la confirmación humana es obligatoria antes de usar una carta.
- Detección tentativa de orientación derecha/invertida mediante comparación de la referencia a 0° y 180°.
- Las fotografías no se suben a un servidor externo.
- Aclaratorias con peso reducido y revisiones inmutables.
- Motor narrativo 0.6 con puentes de secuencia y lectura de aclaratorias.
- Catálogo ampliado: Sí/No contextual, Dos caminos, Trabajo, Dinero, Relación completa, Cruz Celta y Rueda del año.

## Regla de aceptación
1. 78/78 imágenes locales siguen operativas.
2. Diagnóstico del motor continúa verde.
3. Una foto de una carta produce candidatos y exige confirmación.
4. Las cartas confirmadas pueden precargar una tirada de cantidad compatible.
5. Una aclaratoria genera una nueva revisión y no sustituye la original.
6. La narrativa visible permanece en español y no expone códigos internos.

## Alcance honesto de cámara
Esta Beta no detecta todavía varias cartas en una sola fotografía. El usuario fotografía una carta por vez. El sistema de similitud no se presenta como certeza: se muestran candidatos y el usuario confirma/corrige.

## Limitación de validación del entorno de empaquetado
El entorno de empaquetado tiene un registro npm inválido y no permite ejecutar `npm install`. Se ejecutó comprobación sintáctica TS/TSX con TypeScript global y typecheck dirigido del motor de cámara. GitHub Actions conserva la validación final de dependencias y build.

## Controles ejecutados en el empaquetado
- Auditoría de release: OK.
- Content Pack: 78/78.
- Combinaciones curadas: 21 referencias válidas.
- Manifest visual: 78/78.
- Presentación española: OK.
- Validación específica Beta: OK.
- Workflow Pages: OK.
- Selector inteligente smoke test: 4/4.
- Motor semántico smoke test: OK.
- Sintaxis TypeScript/TSX: 34 archivos sin errores de sintaxis.
- Typecheck dirigido del bloque nuevo con declaraciones de entorno: OK.

El `npm install` completo no se ejecuta en este contenedor porque `/etc/npmrc` contiene un registry inválido (`https:///`). El workflow de GitHub mantiene la instalación y build final como control de publicación.
