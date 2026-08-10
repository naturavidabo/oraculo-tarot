# Validación — ORÁCULO TAROT 0.5.0

## Objetivo
Comprobar que la versión 0.5 mantiene el núcleo Tarot 0.4 y añade aprendizaje/persistencia sin romper publicación ni contenido.

## Controles
- Content Pack: 78/78 cartas, IDs únicos, 22 Mayores + 56 Menores, 14 cartas por palo.
- Combinaciones: todas las referencias curadas deben apuntar a cartas existentes.
- GitHub Pages: debe existir `.github/workflows/deploy-pages.yml` y contener checkout, setup-node, test:core, build, configure-pages, upload y deploy.
- Sintaxis: todos los archivos `.ts` y `.tsx` deben transpilar sin diagnóstico de sintaxis.
- Selector y motor: se mantienen los smoke tests de v0.4.
- Base local: esquema 3 agrega `learningProgress` y `flashcardReviews` sin borrar tablas previas.
- Backup: el payload 0.5 incorpora aprendizaje y conserva compatibilidad con respaldos antiguos que no contienen esas tablas.

## Aprender 0.5
- Rutas temáticas ampliadas.
- Flashcards con autoevaluación Otra vez / Difícil / Bien / Fácil.
- Dominio 0–100 con estados NEW / LEARNING / REVIEW / MASTERED.
- Programación local de próxima revisión.
- Quiz de esencia con cuatro alternativas.
- Notas personales separadas del contenido oficial.
- Panel de progreso y cartas que conviene repasar.

## Publicación
El ZIP incluye tanto el workflow real como una copia visible en `GITHUB_PAGES_SETUP/`. La copia visible es solo ayuda; GitHub Pages utiliza exclusivamente `.github/workflows/deploy-pages.yml`.
