# Estado — ORÁCULO TAROT PWA

## Versión de trabajo: 0.4.0

### Completado
- Identidad oficial ORÁCULO TAROT integrada.
- PWA React + TypeScript preparada para GitHub Pages.
- IndexedDB/Dexie con esquema 2.
- Content Pack Tarot 1.0 con 78/78 cartas diferenciadas.
- Motor contextual 0.4 con ponderación por posición, motivos, tensiones, claims y salvaguardas.
- Combinaciones especiales curadas y secuencias ordenadas.
- Clasificador local de preguntas y recomendador de tiradas.
- Cartas físicas y tirada virtual.
- Aclaratorias vinculadas a una posición con peso secundario.
- Revisiones inmutables de una lectura.
- Evaluación posterior del resultado observado.
- Respaldo/restauración local con comprobación de integridad.
- Modos Rápida, Normal, Profunda y Profesor.
- Historial enriquecido, favoritos y revisión.
- Biblioteca profunda y Aprender básico.

### Validaciones ejecutadas
- 78 cartas; IDs únicos; vectores en rango.
- Todas las referencias de combinaciones especiales apuntan a cartas válidas.
- Sintaxis TypeScript/TSX.
- Selector inteligente: vínculo, comunicación, evolución y oculto.
- Pruebas semánticas: Mundo→Loco, Diablo+As de Bastos, Colgado→Muerte→Templanza y deseo bloqueado.

### Limitación de este entorno
El registro npm interno disponible aquí no contiene `@types/react@19.2.17`, por lo que no es posible instalar todas las dependencias y ejecutar el build final en este contenedor. La suite local del núcleo no depende de esa instalación y sí fue ejecutada.

### Próximo bloque (0.5.0)
1. Aprender avanzado y flashcards con repetición espaciada.
2. Quiz contextual y de combinaciones.
3. Notas personales por carta y progreso.
4. Mejoras de accesibilidad/UX y manejo de borradores.
5. Respaldo protegido opcional y preparación para beta.
