# Survey Suite V2 - Configuration Catalog

## Estructura de configuración
1. `global`: afecta toda la suite.
2. `sharedChart`: base común para gráficos de cualquier módulo.
3. `sharedExport`: reglas comunes de exportación.
4. `sharedAnnotations`: anotaciones y overlays comunes.
5. `module`: ajustes propios de módulo.
6. `chartType`: ajustes exclusivos de cada tipo de gráfico.

## 1) Global config
1. `language`: `es | en`
2. `activeDatasetId`: `string | null`
3. `theme`: `light` (por ahora)
4. `autosave`: `boolean`
5. `numberFormat`: separador decimal y precisión base

## 2) Shared chart config
1. `paletteId`
2. `fontFamily`
3. `titleFontSize`
4. `labelFontSize`
5. `canvasBackground`
6. `canvasTransparent`
7. `showGrid`
8. `gridColor`
9. `axisColor`
10. `lineWidth`
11. `chartWidth`
12. `chartMinHeight`
13. `marginTop`
14. `marginRight`
15. `marginBottom`
16. `marginLeft`
17. `showTitle`
18. `chartTitle`
19. `showAxisLabels`
20. `axisWidth`

## 3) Shared export config
1. `format`: `png | svg | pdf`
2. `scale`: `1..4`
3. `dpi`: `96 | 150 | 300 | 400`
4. `includeTransparentBg`: `boolean`
5. `fileNamePattern`
6. `allowClipboard`: `boolean`
7. `allowBatchExport`: `boolean`

## 4) Shared annotations config
1. `showMeanLine`
2. `meanLineColor`
3. `meanLineWidth`
4. `meanLineDash`
5. `meanLineGap`
6. `showMeanLabel`
7. `showStatsPanel`
8. `statsFields`: `n`, `mean`, `median`, `sd`, `iqr`
9. `statsPosition`
10. `annotationText`
11. `annotationX`, `annotationY`
12. `annotationColor`, `annotationSize`

## 5) Processor config
1. `csvDelimiterMode`: `auto | , | ; | \t | |`
2. `sourceType`: `auto | google_forms | ms_forms | generic | json`
3. `defaultFillValue`
4. `previewRows`
5. `defaultLikertRange`: `{min,max}`
6. `autoDetectLikertColumns`: `boolean`
7. `storageAutoActivateOnSave`: `boolean`

## 6) Likert module config
1. `analysisMode`: `standard | comparison`
2. `valueMode`: `percentage | count`
3. `itemOrder`: `original | mean_desc | mean_asc | label_asc`
4. `showValues`
5. `showLegend`
6. `legendPosition`
7. `decimalPlaces`
8. `selectedItems`
9. `scalePresetId`
10. `scalePoints`
11. `scaleLabels`
12. `zoomLevel`
13. `fullscreenEnabled`
14. `watermark`
15. `labelMaxLines`
16. `fontSizeValues`
17. `fontSizeLegend`
18. `fontSizeTitle`

## 7) Likert chart-type config
1. `stacked`:
`barHeight`, `barSpacing`, `showBarBorders`, `barBorderColor`, `barBorderWidth`
2. `diverging`:
`neutralIndex`, `centerLineColor`, `centerLineWidth`
3. `distribution` (si aplica):
`binningMode`, `showAggregateLine`
4. `split` (post-MVP):
`splitBy`, `gapBetweenPanels`

## 8) Distribution module config
1. `numericColumns`
2. `categoryColumn`
3. `groupOrder`: `original | alphabetical | median_desc | median_asc`
4. `topNGroups`
5. `showSampleSizeLabel`
6. `showOutliers`
7. `showJitter`
8. `jitterSize`
9. `jitterAlpha`
10. `outlierSize`
11. `outlierColor`
12. `orientation`: `horizontal | vertical`
13. `groupThickness`
14. `groupGap`
15. `showHypothesisPanel`
16. `hypothesisMode`: `auto | parametric | nonparametric`
17. `showGroupMarker`
18. `groupMetric`: `median | mean`
19. `groupMarkerStyle`: `point | square | line`
20. `groupMarkerColor`
21. `groupMarkerSize`

## 9) Distribution chart-type config
1. `boxplot`:
`whiskerMultiplier`
2. `violin`:
`kdeBandwidthFactor`, `kdeSteps`, `violinOpacity`
3. `boxviolin`:
`whiskerMultiplier`, `kdeBandwidthFactor`, `kdeSteps`, `violinOpacity`
4. `raincloud` (MVP Plus):
`cloudOffset`, `boxHeightRatio`
5. `errorbar` (MVP Plus):
`errorMetric`, `errorCiLevel`

## 10) Cross-module presets
1. `visualPresetId`: preset visual unificado para Likert y Distribution.
2. `exportPresetId`: preset de export (calidad rápida, informe, imprenta).
3. `annotationPresetId`: preset de anotaciones (none/basic/academic).

## Principio de diseño
1. Todo ajuste común va en `shared*`.
2. Todo ajuste de dominio va en `module*`.
3. Todo ajuste exclusivo del render va en `chartType*`.
4. Si un ajuste empieza a repetirse en 2+ tipos, se promueve a `shared`.
5. No duplicar campos con nombres distintos para el mismo concepto.
