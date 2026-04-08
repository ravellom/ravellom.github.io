# Survey Suite V2 - Functional Scope

## Objetivo
Definir funcionalidades de la suite antes de profundizar implementación para reducir retrabajo y ajustes tardíos.

## Módulos
1. Processor
2. Likert
3. Distribution

## Funcionalidades globales de la suite
1. Gestión de idioma (`es`, `en`).
2. Gestión de dataset activo global.
3. Persistencia de estado local (modo pruebas).
4. Navegación integrada entre módulos.
5. Notificaciones de error/estado.
6. Reset local data.

## Processor - Funcionalidades
1. Importación: CSV, JSON, XLSX.
2. Preview: tabla/JSON.
3. Limpieza: trim, null rows, duplicates, fill missing.
4. Transformación: texto Likert a numérico, normalización de escala, promedio de columnas.
5. Dataset management: crear, sobrescribir, eliminar, activar.
6. Export básico: CSV, JSON.

## Likert - Funcionalidades
1. Lectura de dataset activo.
2. Configuración de escala Likert (presets y personalizada).
3. Tipos de gráfico (MVP): stacked, diverging.
4. Filtro de ítems.
5. Orden de ítems (original, asc, desc).
6. Export: PNG, SVG, PDF.
7. Zoom del canvas (in/out/reset) y fullscreen.
8. Modo de análisis estándar y comparación PRE/POST.
9. Carga de datasets desde storage global y auto-procesado opcional.
10. Layout ajustable: ancho, márgenes, alto de barra, separación.
11. Tipografía y rotulación: tamaños de labels/values/legend/título, máximo de líneas por label.
12. Ejes y grilla: mostrar/ocultar, color, grosor, líneas verticales/horizontales, dashed, borde de grilla.
13. Leyenda y valores: posición de leyenda, mostrar valores, decimales.
14. Estilo visual: paleta, fondo sólido/transparente, color de ejes, watermark.
15. Bordes de barra: toggle, color y grosor.
16. Exportación configurable por escala (1x..4x).

## Distribution - Funcionalidades
1. Lectura de dataset activo.
2. Selección de variable numérica y categoría opcional.
3. Tipos de gráfico (MVP): boxplot, violin, box+violin.
4. Estadísticos descriptivos base.
5. Hipótesis (fase posterior de MVP extendido).
6. Export: PNG, SVG, PDF, CSV resumen.
7. Selección múltiple de variables numéricas (modo multi-variable sin categoría).
8. Control de orden y recorte de grupos: original, alfabético, mediana asc/desc, top N.
9. Ajustes de distribución: whisker IQR, KDE bandwidth factor, KDE steps.
10. Métrica de error para error bars: SD, SE, CI95, min-max (con nivel CI configurable).
11. Jitter y outliers: show/hide, tamaño, opacidad y color.
12. Layout ajustable: ancho, alto mínimo, espesor de grupo, separación y márgenes.
13. Tema visual: paleta, tipografía, fondo/color texto, grilla y ejes.
14. Anotaciones: línea de media, panel de stats, marcador de centro por grupo, texto libre posicionado.
15. Export avanzado: clipboard, config JSON export/import, batch export (png+svg+csv+json), DPI.

## Compartición entre módulos
1. Configuración visual común (tipografía, tamaño base, fondo, grid).
2. Configuración de exportación común (formato, escala, dpi, transparencia).
3. Configuración de anotaciones común cuando aplique.
4. Paletas de color comunes.
5. Convención de nombres para presets y perfiles de visualización.
6. Contratos de validación de datasets antes de render.

## Perfilado de alcance (para evitar retrabajo)
1. MVP Core:
importación, dataset activo global, stacked/diverging, boxplot/violin/boxviolin, export PNG/SVG/PDF, layout básico.
2. MVP Plus:
comparación PRE/POST, error bars, anotaciones avanzadas, batch export y config JSON.
3. Post-MVP:
IA de preprocesamiento, split chart avanzado, presets por disciplina, temas visuales extendidos.

## Criterio de priorización
1. MVP Core: flujo end-to-end con configuración estable.
2. MVP Plus: anotaciones avanzadas y pruebas de hipótesis completas.
3. Post-MVP: presets avanzados, comparación multi-dataset, IA.
