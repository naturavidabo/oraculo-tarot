# ORÁCULO TAROT

**Versión 0.7.0 — Beta funcional visual**

PWA offline-first de Tarot Rider–Waite con tiradas físicas/virtuales, interpretación local, biblioteca visual, historial y aprendizaje.

## Publicación
GitHub Actions ejecuta esta cadena antes de desplegar:

1. instala dependencias;
2. valida Content Pack 78/78;
3. valida combinaciones;
4. valida el manifest de las 78 imágenes;
5. descarga copias redimensionadas del Rider–Waite–Smith de dominio público desde Wikimedia Commons;
6. comprueba que existen 78 archivos de imagen válidos;
7. compila la PWA con Vite;
8. publica `dist` en GitHub Pages.

## Datos personales
Las lecturas, personas, notas y progreso se guardan localmente en IndexedDB mediante Dexie. Supabase no es requisito para esta versión.

## Imágenes
Rider–Waite–Smith, Pamela Colman Smith (1910). Fuente de las copias utilizadas en el build: Wikimedia Commons, conjunto `Rider-Waite-Smith tarot deck (Geldard)`, dominio público.
