# Estado — ORÁCULO TAROT PWA

## Versión de trabajo: 0.5.0

### Completado
- Identidad oficial ORÁCULO TAROT integrada.
- PWA React + TypeScript preparada para GitHub Pages.
- IndexedDB/Dexie con esquema 3.
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
- Biblioteca profunda.
- Aprender avanzado: rutas, flashcards, quiz, notas personales y progreso local.
- Repetición adaptativa con estados de dominio y próxima revisión.
- Workflow GitHub Pages incluido y validado automáticamente.

### Validaciones previstas en `npm run test:core`
- 78 cartas; IDs únicos; vectores en rango.
- Todas las referencias de combinaciones especiales apuntan a cartas válidas.
- Workflow `.github/workflows/deploy-pages.yml` presente y con acciones necesarias.
- Sintaxis TypeScript/TSX.
- Selector inteligente: vínculo, comunicación, evolución y oculto.
- Pruebas semánticas: Mundo→Loco, Diablo+As de Bastos, Colgado→Muerte→Templanza y deseo bloqueado.

### Limitación del contenedor de desarrollo
El registro npm interno de este entorno no expone algunos paquetes que sí están publicados en npm. Por ello, el `npm install` completo no puede ejecutarse aquí; GitHub Actions utiliza el registro npm normal durante el despliegue.

### Próximo bloque (0.6.0)
1. Borradores/autoguardado de lecturas en curso.
2. Accesibilidad y pulido móvil.
3. Laboratorio de combinaciones interactivo.
4. Comparación de lecturas y estadísticas personales.
5. Preparación de beta Tarot antes de abrir el núcleo Astrología.
