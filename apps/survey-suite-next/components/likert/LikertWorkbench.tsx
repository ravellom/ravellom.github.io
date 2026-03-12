'use client';

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

type Primitive = string | number | boolean | null;
type DataRow = Record<string, Primitive>;

type DatasetOption = {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
};

type LikertWorkbenchProps = {
  activeDatasetId: string;
  datasetName: string;
  rows: DataRow[];
  columns: string[];
  datasets: DatasetOption[];
};

type Panel = 'datos' | 'escala' | 'grafico' | 'style' | 'exportar' | 'ayuda';
type StyleTab = 'colors' | 'typography' | 'bars' | 'legend' | 'axes' | 'canvas';

type ItemStat = {
  item: string;
  seriesLabel: string;
  total: number;
  mean: number;
  frequencies: Record<number, number>;
  percentages: Record<number, number>;
};

const COLOR_SCHEMES: Record<string, string[]> = {
  warm: ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b'],
  blue_orange: ['#2f6de3', '#5f8ef0', '#9fb4f7', '#f0c27a', '#eb8f41'],
  cool: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8'],
  balanced: ['#b2182b', '#ef8a62', '#fddbc7', '#d1e5f0', '#67a9cf']
};

export function LikertWorkbench({ activeDatasetId, datasetName, rows, columns, datasets }: LikertWorkbenchProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const [panel, setPanel] = useState<Panel>('datos');
  const [styleTab, setStyleTab] = useState<StyleTab>('colors');

  const [analysisMode, setAnalysisMode] = useState<'standard' | 'comparison'>('standard');
  const [comparisonDatasetId, setComparisonDatasetId] = useState('');
  const [comparisonData, setComparisonData] = useState<{ name: string; rows: DataRow[]; columns: string[] } | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState('');

  const [chartType, setChartType] = useState<'stacked' | 'diverging'>('stacked');
  const [valueType, setValueType] = useState<'percentage' | 'count'>('percentage');
  const [sortBy, setSortBy] = useState<'original' | 'mean_desc' | 'mean_asc'>('original');
  const [maxItems, setMaxItems] = useState(20);
  const [showValues, setShowValues] = useState(true);
  const [decimalPlaces, setDecimalPlaces] = useState(1);

  const [showN, setShowN] = useState(true);
  const [colorScheme, setColorScheme] = useState('warm');
  const [fontFamily, setFontFamily] = useState("'Segoe UI', Arial, sans-serif");
  const [fontSizeLabels, setFontSizeLabels] = useState(15);
  const [fontSizeValues, setFontSizeValues] = useState(12);
  const [barHeight, setBarHeight] = useState(30);
  const [barGap, setBarGap] = useState(12);
  const [barRadius, setBarRadius] = useState(8);
  const [showBarBorders, setShowBarBorders] = useState(false);
  const [barBorderColor, setBarBorderColor] = useState('#ffffff');
  const [barBorderWidth, setBarBorderWidth] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [legendPosition, setLegendPosition] = useState<'top' | 'right' | 'bottom'>('top');
  const [fontSizeLegend, setFontSizeLegend] = useState(12);
  const [showGrid, setShowGrid] = useState(true);
  const [gridColor, setGridColor] = useState('#e2e8f0');
  const [gridLineWidth, setGridLineWidth] = useState(1);
  const [gridDashed, setGridDashed] = useState(false);
  const [gridVertical, setGridVertical] = useState(true);
  const [gridHorizontal, setGridHorizontal] = useState(false);
  const [showAxisLabels, setShowAxisLabels] = useState(true);
  const [axisColor, setAxisColor] = useState('#334155');
  const [axisWidth, setAxisWidth] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [titleText, setTitleText] = useState('Likert Charts');
  const [fontSizeTitle, setFontSizeTitle] = useState(34);
  const [chartWidth, setChartWidth] = useState(1200);
  const [watermark, setWatermark] = useState('');

  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportScale, setExportScale] = useState(2);
  const [exportDpi, setExportDpi] = useState(300);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const baseItems = useMemo(() => detectLikertColumns(rows, columns), [rows, columns]);
  const baseScale = useMemo(() => detectScaleValues(rows, baseItems), [rows, baseItems]);
  const compareItems = useMemo(() => {
    if (!comparisonData) return [];
    return detectLikertColumns(comparisonData.rows, comparisonData.columns);
  }, [comparisonData]);

  const availableItems = useMemo(() => {
    if (analysisMode === 'comparison' && comparisonData) {
      return baseItems.filter((item) => compareItems.includes(item));
    }
    return baseItems;
  }, [analysisMode, comparisonData, baseItems, compareItems]);

  const scaleValues = useMemo(() => {
    if (!comparisonData) return baseScale;
    const compareScale = detectScaleValues(comparisonData.rows, compareItems);
    return mergeScales(baseScale, compareScale);
  }, [baseScale, comparisonData, compareItems]);

  useEffect(() => {
    setSelectedItems((prev) => {
      if (prev.size === 0) return new Set(availableItems);
      const next = new Set<string>();
      availableItems.forEach((item) => {
        if (prev.has(item)) next.add(item);
      });
      if (next.size === 0) availableItems.forEach((item) => next.add(item));
      return next;
    });
  }, [availableItems]);

  useEffect(() => {
    if (analysisMode !== 'comparison' || !comparisonDatasetId) {
      setComparisonData(null);
      setComparisonError('');
      return;
    }

    let cancelled = false;
    const run = async () => {
      setComparisonLoading(true);
      setComparisonError('');
      try {
        const response = await fetch(`/api/datasets/${comparisonDatasetId}`);
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'No se pudo cargar dataset de comparación');
        if (cancelled) return;
        const ds = result.dataset;
        setComparisonData({
          name: ds.name,
          rows: Array.isArray(ds.data) ? ds.data : [],
          columns: Array.isArray(ds.columns) ? ds.columns : []
        });
      } catch (error) {
        if (cancelled) return;
        setComparisonData(null);
        setComparisonError(error instanceof Error ? error.message : 'Error de comparación');
      } finally {
        if (!cancelled) setComparisonLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [analysisMode, comparisonDatasetId]);

  const stats = useMemo(() => {
    const filtered = availableItems.filter((item) => selectedItems.has(item)).slice(0, Math.max(1, maxItems));

    if (analysisMode === 'comparison' && comparisonData) {
      const activeStats = buildStats(rows, filtered, scaleValues, 'Activo');
      const compareStats = buildStats(comparisonData.rows, filtered, scaleValues, comparisonData.name || 'Comparación');
      const sortedItems = sortItemsByMean(filtered, activeStats, sortBy);
      const merged: ItemStat[] = [];

      sortedItems.forEach((item) => {
        const a = activeStats.find((s) => s.item === item);
        const b = compareStats.find((s) => s.item === item);
        if (a) merged.push(a);
        if (b) merged.push(b);
      });

      return merged;
    }

    return sortStats(buildStats(rows, filtered, scaleValues, 'Activo'), sortBy);
  }, [analysisMode, availableItems, comparisonData, maxItems, rows, scaleValues, selectedItems, sortBy]);

  const colors = useMemo(() => getColors(colorScheme, scaleValues.length), [colorScheme, scaleValues.length]);
  const comparisonCandidates = datasets.filter((d) => d.id !== activeDatasetId);
  const gridBackground = useMemo(
    () => buildGridBackground({ showGrid, gridColor, gridLineWidth, gridVertical, gridHorizontal, gridDashed }),
    [gridColor, gridDashed, gridHorizontal, gridLineWidth, gridVertical, showGrid]
  );

  const toggleItem = (item: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(item);
      else next.delete(item);
      return next;
    });
  };

  const selectAllItems = (checked: boolean) => {
    setSelectedItems(() => (checked ? new Set(availableItems) : new Set()));
  };

  const exportImage = async () => {
    if (!previewRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: transparentBackground ? null : backgroundColor,
      scale: Math.max(1, exportScale * (exportDpi / 96)),
      useCORS: true
    });

    const mime = exportFormat === 'jpeg' ? 'image/jpeg' : exportFormat === 'webp' ? 'image/webp' : 'image/png';
    const link = document.createElement('a');
    link.href = canvas.toDataURL(mime, 1);
    link.download = `likert-${Date.now()}.${exportFormat === 'jpeg' ? 'jpg' : exportFormat}`;
    link.click();
  };

  const exportCSV = () => {
    const header = ['item', 'series', 'n', 'mean', ...scaleValues.flatMap((v) => [`count_${v}`, `pct_${v}`])];
    const lines = [header.join(',')];
    stats.forEach((s) => {
      const row = [
        csvSafe(s.item),
        csvSafe(s.seriesLabel),
        String(s.total),
        s.mean.toFixed(decimalPlaces),
        ...scaleValues.flatMap((v) => [String(s.frequencies[v] || 0), (s.percentages[v] || 0).toFixed(decimalPlaces)])
      ];
      lines.push(row.join(','));
    });
    downloadText(lines.join('\n'), `likert-stats-${Date.now()}.csv`, 'text/csv;charset=utf-8');
  };

  const exportJSON = () => {
    const payload = { analysisMode, datasetName, comparisonDataset: comparisonData?.name || null, scaleValues, stats };
    downloadText(JSON.stringify(payload, null, 2), `likert-config-${Date.now()}.json`, 'application/json;charset=utf-8');
  };

  return (
    <div className="workspace-layout">
      <aside className="workspace-menu">
        <div className="workspace-title">WORKSPACE</div>
        <button className={`workspace-tab ${panel === 'datos' ? 'active' : ''}`} onClick={() => setPanel('datos')} type="button">Datos</button>
        <button className={`workspace-tab ${panel === 'escala' ? 'active' : ''}`} onClick={() => setPanel('escala')} type="button">Escala</button>
        <button className={`workspace-tab ${panel === 'grafico' ? 'active' : ''}`} onClick={() => setPanel('grafico')} type="button">Gráfico</button>
        <button className={`workspace-tab ${panel === 'style' ? 'active' : ''}`} onClick={() => setPanel('style')} type="button">Style</button>
        <button className={`workspace-tab ${panel === 'exportar' ? 'active' : ''}`} onClick={() => setPanel('exportar')} type="button">Exportar</button>
        <button className={`workspace-tab ${panel === 'ayuda' ? 'active' : ''}`} onClick={() => setPanel('ayuda')} type="button">Ayuda</button>
      </aside>

      <section className="workspace-config card legacy-options">
        {panel === 'datos' ? (
          <>
            <h2 className="panel-title">Datos</h2>
            <label>
              Modo de análisis
              <select value={analysisMode} onChange={(e) => setAnalysisMode(e.target.value as 'standard' | 'comparison')}>
                <option value="standard">Estándar</option>
                <option value="comparison">Comparación Pre/Post</option>
              </select>
            </label>

            {analysisMode === 'comparison' ? (
              <>
                <label style={{ marginTop: 10 }}>
                  Dataset de comparación
                  <select value={comparisonDatasetId} onChange={(e) => setComparisonDatasetId(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {comparisonCandidates.map((ds) => (
                      <option key={ds.id} value={ds.id}>{ds.name} ({ds.rowCount} filas)</option>
                    ))}
                  </select>
                </label>
                {comparisonLoading ? <p className="muted">Cargando dataset de comparación...</p> : null}
                {comparisonError ? <p className="error">{comparisonError}</p> : null}
              </>
            ) : null}

            <div className="card" style={{ marginTop: 12, padding: 12 }}>
              <p className="muted" style={{ margin: 0 }}>Dataset activo: <strong>{datasetName}</strong></p>
              {comparisonData ? <p className="muted" style={{ marginBottom: 0 }}>Dataset comparación: <strong>{comparisonData.name}</strong></p> : null}
              <p className="muted" style={{ marginBottom: 0 }}>Ítems disponibles: {availableItems.length}</p>
              <p className="muted" style={{ marginBottom: 0 }}>Ítems seleccionados: {selectedItems.size}</p>
            </div>
          </>
        ) : null}

        {panel === 'escala' ? (
          <>
            <h2 className="panel-title">Escala detectada</h2>
            <p className="muted">Escala: {scaleValues.join(' - ')}</p>
            <p className="muted">Respuestas activo: {rows.length}</p>
            {comparisonData ? <p className="muted">Respuestas comparación: {comparisonData.rows.length}</p> : null}
          </>
        ) : null}

        {panel === 'grafico' ? (
          <>
            <h2 className="panel-title">Tipo de Gráfico</h2>
            <div className="likert-controls">
              <label>
                Tipo de gráfico
                <select value={chartType} onChange={(e) => setChartType(e.target.value as 'stacked' | 'diverging')}>
                  <option value="stacked">Barras apiladas</option>
                  <option value="diverging">Divergente</option>
                </select>
              </label>
              <label>
                Valores
                <select value={valueType} onChange={(e) => setValueType(e.target.value as 'percentage' | 'count')}>
                  <option value="percentage">Porcentaje</option>
                  <option value="count">Conteo</option>
                </select>
              </label>
              <label>
                Ordenar por
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'original' | 'mean_desc' | 'mean_asc')}>
                  <option value="original">Orden original</option>
                  <option value="mean_desc">Media descendente</option>
                  <option value="mean_asc">Media ascendente</option>
                </select>
              </label>
              <label>
                Máximo ítems
                <input type="number" min={1} max={100} value={maxItems} onChange={(e) => setMaxItems(Number(e.target.value) || 1)} />
              </label>
            </div>

            <label className="checkbox-label" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={showValues} onChange={(e) => setShowValues(e.target.checked)} /> Mostrar valores
            </label>
            <label>
              Decimales
              <input type="number" min={0} max={4} value={decimalPlaces} onChange={(e) => setDecimalPlaces(Number(e.target.value) || 0)} />
            </label>

            <hr className="section-sep" />
            <label className="option-label" style={{ fontWeight: 700 }}>Item filters:</label>
            <div className="row" style={{ marginTop: 6 }}>
              <button className="btn btn-secondary" type="button" onClick={() => selectAllItems(true)}>Select all</button>
              <button className="btn btn-secondary" type="button" onClick={() => selectAllItems(false)}>Deselect all</button>
            </div>
            <div className="item-filter-list">
              {availableItems.map((item) => (
                <label key={item} className="item-filter-row">
                  <input type="checkbox" checked={selectedItems.has(item)} onChange={(e) => toggleItem(item, e.target.checked)} /> {item}
                </label>
              ))}
            </div>
          </>
        ) : null}

        {panel === 'style' ? (
          <>
            <h2 className="panel-title">Style</h2>
            <div className="style-tabs">
              <button type="button" className={`style-tab ${styleTab === 'colors' ? 'active' : ''}`} onClick={() => setStyleTab('colors')}>Colors</button>
              <button type="button" className={`style-tab ${styleTab === 'typography' ? 'active' : ''}`} onClick={() => setStyleTab('typography')}>Typography</button>
              <button type="button" className={`style-tab ${styleTab === 'bars' ? 'active' : ''}`} onClick={() => setStyleTab('bars')}>Bars</button>
              <button type="button" className={`style-tab ${styleTab === 'legend' ? 'active' : ''}`} onClick={() => setStyleTab('legend')}>Legend</button>
              <button type="button" className={`style-tab ${styleTab === 'axes' ? 'active' : ''}`} onClick={() => setStyleTab('axes')}>Axes & Grid</button>
              <button type="button" className={`style-tab ${styleTab === 'canvas' ? 'active' : ''}`} onClick={() => setStyleTab('canvas')}>Canvas</button>
            </div>

            {styleTab === 'colors' ? (
              <div className="option-stack">
                <label>
                  Esquema de colores
                  <select value={colorScheme} onChange={(e) => setColorScheme(e.target.value)}>
                    <option value="warm">Warm Likert</option>
                    <option value="blue_orange">Azul-Naranja</option>
                    <option value="cool">Cool</option>
                    <option value="balanced">Balanced Diverging</option>
                  </select>
                </label>
                <label>
                  Color de fondo
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: 90, height: 38, padding: 4 }} />
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={transparentBackground} onChange={(e) => setTransparentBackground(e.target.checked)} /> Fondo transparente
                </label>
              </div>
            ) : null}

            {styleTab === 'typography' ? (
              <div className="option-stack">
                <label>
                  Fuente
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                    <option value="'Segoe UI', Arial, sans-serif">Segoe UI</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                    <option value="Georgia, serif">Georgia</option>
                  </select>
                </label>
                <label>
                  Tamaño etiquetas
                  <input type="number" min={10} max={24} value={fontSizeLabels} onChange={(e) => setFontSizeLabels(Number(e.target.value) || 14)} />
                </label>
                <label>
                  Tamaño valores
                  <input type="number" min={8} max={20} value={fontSizeValues} onChange={(e) => setFontSizeValues(Number(e.target.value) || 11)} />
                </label>
              </div>
            ) : null}
            {styleTab === 'bars' ? (
              <div className="option-stack">
                <label>
                  Alto de barra
                  <input type="number" min={18} max={60} value={barHeight} onChange={(e) => setBarHeight(Number(e.target.value) || 26)} />
                </label>
                <label>
                  Separación
                  <input type="number" min={4} max={30} value={barGap} onChange={(e) => setBarGap(Number(e.target.value) || 10)} />
                </label>
                <label>
                  Radio de borde
                  <input type="number" min={0} max={16} value={barRadius} onChange={(e) => setBarRadius(Number(e.target.value) || 6)} />
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={showN} onChange={(e) => setShowN(e.target.checked)} /> Mostrar (n=...)
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={showBarBorders} onChange={(e) => setShowBarBorders(e.target.checked)} /> Mostrar bordes de barra
                </label>
                <label>
                  Color de borde
                  <input type="color" value={barBorderColor} onChange={(e) => setBarBorderColor(e.target.value)} style={{ width: 90, height: 38, padding: 4 }} />
                </label>
                <label>
                  Ancho de borde
                  <input type="number" min={0} max={4} value={barBorderWidth} onChange={(e) => setBarBorderWidth(Number(e.target.value) || 0)} />
                </label>
              </div>
            ) : null}

            {styleTab === 'legend' ? (
              <div className="option-stack">
                <label className="checkbox-label">
                  <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} /> Mostrar leyenda
                </label>
                <label>
                  Posición de leyenda
                  <select value={legendPosition} onChange={(e) => setLegendPosition(e.target.value as 'top' | 'right' | 'bottom')}>
                    <option value="top">Arriba</option>
                    <option value="right">Derecha</option>
                    <option value="bottom">Abajo</option>
                  </select>
                </label>
                <label>
                  Tamaño leyenda
                  <input type="number" min={8} max={24} value={fontSizeLegend} onChange={(e) => setFontSizeLegend(Number(e.target.value) || 10)} />
                </label>
              </div>
            ) : null}

            {styleTab === 'axes' ? (
              <div className="option-stack">
                <label className="checkbox-label">
                  <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Mostrar cuadrícula
                </label>
                <label>
                  Color de cuadrícula
                  <input type="color" value={gridColor} onChange={(e) => setGridColor(e.target.value)} style={{ width: 90, height: 38, padding: 4 }} />
                </label>
                <label>
                  Grosor de cuadrícula
                  <input type="number" min={1} max={4} value={gridLineWidth} onChange={(e) => setGridLineWidth(Number(e.target.value) || 1)} />
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={gridDashed} onChange={(e) => setGridDashed(e.target.checked)} /> Cuadrícula discontinua
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={gridVertical} onChange={(e) => setGridVertical(e.target.checked)} /> Líneas verticales
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={gridHorizontal} onChange={(e) => setGridHorizontal(e.target.checked)} /> Líneas horizontales
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={showAxisLabels} onChange={(e) => setShowAxisLabels(e.target.checked)} /> Mostrar ejes
                </label>
                <label>
                  Color eje
                  <input type="color" value={axisColor} onChange={(e) => setAxisColor(e.target.value)} style={{ width: 90, height: 38, padding: 4 }} />
                </label>
                <label>
                  Grosor eje
                  <input type="number" min={1} max={4} value={axisWidth} onChange={(e) => setAxisWidth(Number(e.target.value) || 1)} />
                </label>
              </div>
            ) : null}

            {styleTab === 'canvas' ? (
              <div className="option-stack">
                <label className="checkbox-label">
                  <input type="checkbox" checked={showTitle} onChange={(e) => setShowTitle(e.target.checked)} /> Mostrar título
                </label>
                <label>
                  Título
                  <input type="text" value={titleText} onChange={(e) => setTitleText(e.target.value)} placeholder="Título del gráfico" />
                </label>
                <label>
                  Tamaño título
                  <input type="number" min={16} max={48} value={fontSizeTitle} onChange={(e) => setFontSizeTitle(Number(e.target.value) || 24)} />
                </label>
                <label>
                  Ancho del gráfico (px)
                  <input type="number" min={700} max={2200} value={chartWidth} onChange={(e) => setChartWidth(Number(e.target.value) || 1200)} />
                </label>
                <label>
                  Marca de agua
                  <input type="text" value={watermark} onChange={(e) => setWatermark(e.target.value)} placeholder="Texto opcional" />
                </label>
              </div>
            ) : null}
          </>
        ) : null}

        {panel === 'exportar' ? (
          <>
            <h2 className="panel-title">Exportar Gráfico</h2>
            <label>
              Formato
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpeg' | 'webp')}>
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WEBP</option>
              </select>
            </label>
            <label>
              Escala
              <select value={exportScale} onChange={(e) => setExportScale(Number(e.target.value))}>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </label>
            <label>
              DPI
              <select value={exportDpi} onChange={(e) => setExportDpi(Number(e.target.value))}>
                <option value={96}>96 DPI</option>
                <option value={150}>150 DPI</option>
                <option value={300}>300 DPI</option>
                <option value={400}>400 DPI</option>
              </select>
            </label>
            <div className="row export-actions">
              <button className="btn export-btn-primary" type="button" onClick={exportImage}>Descargar imagen</button>
              <button className="btn btn-secondary export-btn-secondary" type="button" onClick={exportCSV}>Exportar CSV</button>
              <button className="btn btn-secondary export-btn-secondary" type="button" onClick={exportJSON}>Exportar JSON</button>
            </div>
          </>
        ) : null}

        {panel === 'ayuda' ? (
          <>
            <h2 className="panel-title">Ayuda</h2>
            <p className="muted">1. Carga y activa un dataset en Data Processor.</p>
            <p className="muted">2. En Datos, selecciona modo estándar o comparación pre/post.</p>
            <p className="muted">3. En Gráfico y Style, ajusta filtros y apariencia.</p>
            <p className="muted">4. Exporta en imagen, CSV o JSON.</p>
          </>
        ) : null}
      </section>

      <section className="workspace-preview">
        <div className="preview-header">Visualización</div>
        <div
          className="card preview-canvas"
          ref={previewRef}
          style={{
            background: transparentBackground ? 'transparent' : backgroundColor,
            fontFamily,
            backgroundImage: gridBackground,
            position: 'relative'
          } as CSSProperties}
        >
          {showTitle ? <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: fontSizeTitle }}>{titleText || 'Likert Charts'}</h3> : null}

          <div className={`chart-frame legend-${legendPosition}`} style={{ maxWidth: chartWidth }}>
            {showLegend ? (
              <div className="legend-row" style={{ fontSize: fontSizeLegend }}>
                {scaleValues.map((v, idx) => (
                  <div key={v} className="legend-item" style={{ fontSize: fontSizeLegend }}>
                    <span className="legend-color" style={{ background: colors[idx] }} /> {v}
                  </div>
                ))}
              </div>
            ) : null}

            {stats.length === 0 ? (
              <p className="muted">No hay ítems válidos para graficar con la configuración actual.</p>
            ) : (
              <div className="likert-chart-area">
                {stats.map((stat) => (
                  <LikertRow
                    key={`${stat.item}-${stat.seriesLabel}`}
                    stat={stat}
                    scaleValues={scaleValues}
                    colors={colors}
                    chartType={chartType}
                    valueType={valueType}
                    showN={showN}
                    showValues={showValues}
                    decimalPlaces={decimalPlaces}
                    barHeight={barHeight}
                    barRadius={barRadius}
                    fontSizeLabels={fontSizeLabels}
                    fontSizeValues={fontSizeValues}
                    barGap={barGap}
                    showBarBorders={showBarBorders}
                    barBorderColor={barBorderColor}
                    barBorderWidth={barBorderWidth}
                  />
                ))}
              </div>
            )}

            {showAxisLabels ? (
              <div className="axis-row" style={{ color: axisColor, borderTop: `${axisWidth}px solid ${axisColor}` }}>
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            ) : null}
          </div>

          {watermark ? (
            <div className="watermark-note">{watermark}</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type LikertRowProps = {
  stat: ItemStat;
  scaleValues: number[];
  colors: string[];
  chartType: 'stacked' | 'diverging';
  valueType: 'percentage' | 'count';
  showN: boolean;
  showValues: boolean;
  decimalPlaces: number;
  barHeight: number;
  barRadius: number;
  fontSizeLabels: number;
  fontSizeValues: number;
  barGap: number;
  showBarBorders: boolean;
  barBorderColor: string;
  barBorderWidth: number;
};

function LikertRow({
  stat,
  scaleValues,
  colors,
  chartType,
  valueType,
  showN,
  showValues,
  decimalPlaces,
  barHeight,
  barRadius,
  fontSizeLabels,
  fontSizeValues,
  barGap,
  showBarBorders,
  barBorderColor,
  barBorderWidth
}: LikertRowProps) {
  if (chartType === 'diverging') {
    const midpointIndex = Math.floor((scaleValues.length - 1) / 2);
    const hasNeutral = scaleValues.length % 2 === 1;
    const negative = scaleValues.slice(0, midpointIndex);
    const neutral = hasNeutral ? scaleValues[midpointIndex] : null;
    const positive = scaleValues.slice(hasNeutral ? midpointIndex + 1 : midpointIndex);

    let leftCursor = 50;
    const negativeSegments = [...negative].reverse().map((value) => {
      const percentage = stat.percentages[value] || 0;
      leftCursor -= percentage;
      return { value, percentage, left: leftCursor };
    });

    const neutralWidth = neutral !== null ? (stat.percentages[neutral] || 0) : 0;
    const neutralLeft = 50 - neutralWidth / 2;

    let rightCursor = 50 + neutralWidth / 2;
    const positiveSegments = positive.map((value) => {
      const percentage = stat.percentages[value] || 0;
      const currentLeft = rightCursor;
      rightCursor += percentage;
      return { value, percentage, left: currentLeft };
    });

    return (
      <div className="likert-row" style={{ marginBottom: barGap }}>
        <div className="likert-label" style={{ fontSize: fontSizeLabels }}>
          {stat.item}
          <span className="series-chip">{stat.seriesLabel}</span>
          {showN ? <span className="muted"> (n={stat.total})</span> : null}
        </div>
        <div className="likert-diverging-bar" style={{ height: barHeight, borderRadius: barRadius }}>
          <div className="likert-center-line" />
          {negativeSegments.map((segment) => (
            <LikertSegment key={`n-${stat.item}-${stat.seriesLabel}-${segment.value}`} left={segment.left} width={segment.percentage} color={colors[indexOfValue(scaleValues, segment.value)]} text={formatValue(valueType, stat, segment.value, decimalPlaces)} showValues={showValues} fontSizeValues={fontSizeValues} showBorder={showBarBorders} borderColor={barBorderColor} borderWidth={barBorderWidth} />
          ))}
          {neutral !== null && neutralWidth > 0 ? (
            <LikertSegment key={`m-${stat.item}-${stat.seriesLabel}`} left={neutralLeft} width={neutralWidth} color={colors[indexOfValue(scaleValues, neutral)]} text={formatValue(valueType, stat, neutral, decimalPlaces)} showValues={showValues} fontSizeValues={fontSizeValues} showBorder={showBarBorders} borderColor={barBorderColor} borderWidth={barBorderWidth} />
          ) : null}
          {positiveSegments.map((segment) => (
            <LikertSegment key={`p-${stat.item}-${stat.seriesLabel}-${segment.value}`} left={segment.left} width={segment.percentage} color={colors[indexOfValue(scaleValues, segment.value)]} text={formatValue(valueType, stat, segment.value, decimalPlaces)} showValues={showValues} fontSizeValues={fontSizeValues} showBorder={showBarBorders} borderColor={barBorderColor} borderWidth={barBorderWidth} />
          ))}
        </div>
      </div>
    );
  }

  let cursor = 0;
  return (
    <div className="likert-row" style={{ marginBottom: barGap }}>
      <div className="likert-label" style={{ fontSize: fontSizeLabels }}>
        {stat.item}
        <span className="series-chip">{stat.seriesLabel}</span>
        {showN ? <span className="muted"> (n={stat.total})</span> : null}
      </div>
      <div className="likert-stacked-bar" style={{ height: barHeight, borderRadius: barRadius }}>
        {scaleValues.map((value) => {
          const percentage = stat.percentages[value] || 0;
          const left = cursor;
          cursor += percentage;
          if (percentage <= 0) return null;
          return (
            <LikertSegment key={`${stat.item}-${stat.seriesLabel}-${value}`} left={left} width={percentage} color={colors[indexOfValue(scaleValues, value)]} text={formatValue(valueType, stat, value, decimalPlaces)} showValues={showValues} fontSizeValues={fontSizeValues} showBorder={showBarBorders} borderColor={barBorderColor} borderWidth={barBorderWidth} />
          );
        })}
      </div>
    </div>
  );
}
function LikertSegment({
  left,
  width,
  color,
  text,
  showValues,
  fontSizeValues,
  showBorder,
  borderColor,
  borderWidth
}: {
  left: number;
  width: number;
  color: string;
  text: string;
  showValues: boolean;
  fontSizeValues: number;
  showBorder: boolean;
  borderColor: string;
  borderWidth: number;
}) {
  return (
    <div className="likert-segment" style={{ left: `${left}%`, width: `${width}%`, background: color, border: showBorder ? `${borderWidth}px solid ${borderColor}` : 'none' }} title={text}>
      {showValues && width >= 8 ? <span className="likert-segment-text" style={{ fontSize: fontSizeValues }}>{text}</span> : null}
    </div>
  );
}

function indexOfValue(scaleValues: number[], value: number) {
  const idx = scaleValues.indexOf(value);
  return idx < 0 ? 0 : idx;
}

function formatValue(mode: 'percentage' | 'count', stat: ItemStat, value: number, decimals: number) {
  if (mode === 'count') return `${stat.frequencies[value] || 0}`;
  return `${(stat.percentages[value] || 0).toFixed(decimals)}%`;
}

function getColors(scheme: string, points: number) {
  const source = COLOR_SCHEMES[scheme] || COLOR_SCHEMES.warm;
  if (source.length === points) return source;
  if (source.length > points) return source.slice(0, points);
  const out = [...source];
  while (out.length < points) out.push(source[source.length - 1]);
  return out;
}

function detectLikertColumns(rows: DataRow[], columns: string[]) {
  const candidates = columns.slice(1);
  return candidates.filter((column) => {
    let checked = 0;
    let numeric = 0;
    let integer = 0;
    let inRange = 0;

    for (const row of rows) {
      const raw = row[column];
      if (raw === null || raw === undefined || raw === '') continue;
      checked += 1;
      const value = Number(raw);
      if (!Number.isNaN(value)) {
        numeric += 1;
        if (Number.isInteger(value)) integer += 1;
        if (value >= 0 && value <= 10) inRange += 1;
      }
    }

    if (checked === 0) return false;
    const numericRatio = numeric / checked;
    const integerRatio = numeric > 0 ? integer / numeric : 0;
    const inRangeRatio = numeric > 0 ? inRange / numeric : 0;
    return numericRatio >= 0.8 && integerRatio >= 0.9 && inRangeRatio >= 0.8;
  });
}

function detectScaleValues(rows: DataRow[], itemColumns: string[]) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    for (const column of itemColumns) {
      const value = Number(row[column]);
      if (Number.isNaN(value)) continue;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return [1, 2, 3, 4, 5];

  min = Math.floor(min);
  max = Math.ceil(max);

  if (max - min > 9) {
    min = 1;
    max = 5;
  }

  const values: number[] = [];
  for (let v = min; v <= max; v += 1) values.push(v);
  return values.length > 1 ? values : [1, 2, 3, 4, 5];
}

function mergeScales(a: number[], b: number[]) {
  const all = [...new Set([...a, ...b])].sort((x, y) => x - y);
  return all.length > 1 ? all : [1, 2, 3, 4, 5];
}

function buildStats(rows: DataRow[], items: string[], scaleValues: number[], seriesLabel: string): ItemStat[] {
  return items.map((item) => {
    const frequencies: Record<number, number> = {};
    scaleValues.forEach((v) => {
      frequencies[v] = 0;
    });

    const values: number[] = [];
    rows.forEach((row) => {
      const value = Number(row[item]);
      if (Number.isNaN(value)) return;
      if (!scaleValues.includes(value)) return;
      values.push(value);
      frequencies[value] = (frequencies[value] || 0) + 1;
    });

    const total = values.length;
    const mean = total > 0 ? values.reduce((acc, v) => acc + v, 0) / total : 0;

    const percentages: Record<number, number> = {};
    scaleValues.forEach((v) => {
      percentages[v] = total > 0 ? ((frequencies[v] || 0) / total) * 100 : 0;
    });

    return { item, seriesLabel, total, mean, frequencies, percentages };
  });
}

function sortItemsByMean(items: string[], stats: ItemStat[], sortBy: 'original' | 'mean_desc' | 'mean_asc') {
  const map = new Map<string, number>();
  stats.forEach((s) => map.set(s.item, s.mean));

  const sorted = [...items];
  if (sortBy === 'mean_desc') sorted.sort((a, b) => (map.get(b) || 0) - (map.get(a) || 0));
  if (sortBy === 'mean_asc') sorted.sort((a, b) => (map.get(a) || 0) - (map.get(b) || 0));
  return sorted;
}

function sortStats(stats: ItemStat[], sortBy: 'original' | 'mean_desc' | 'mean_asc') {
  const sorted = [...stats];
  if (sortBy === 'mean_desc') sorted.sort((a, b) => b.mean - a.mean);
  if (sortBy === 'mean_asc') sorted.sort((a, b) => a.mean - b.mean);
  return sorted;
}

function csvSafe(value: string) {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildGridBackground({
  showGrid,
  gridColor,
  gridLineWidth,
  gridVertical,
  gridHorizontal,
  gridDashed
}: {
  showGrid: boolean;
  gridColor: string;
  gridLineWidth: number;
  gridVertical: boolean;
  gridHorizontal: boolean;
  gridDashed: boolean;
}) {
  if (!showGrid) return 'none';

  const lineStyle = gridDashed
    ? `${gridColor} 0, ${gridColor} ${gridLineWidth}px, transparent ${gridLineWidth}px, transparent ${gridLineWidth * 5}px`
    : `${gridColor} 0, ${gridColor} ${gridLineWidth}px, transparent ${gridLineWidth}px, transparent 20%`;

  const layers: string[] = [];
  if (gridVertical) {
    layers.push(`repeating-linear-gradient(to right, ${lineStyle})`);
  }
  if (gridHorizontal) {
    layers.push(`repeating-linear-gradient(to bottom, ${lineStyle})`);
  }
  return layers.length > 0 ? layers.join(',') : 'none';
}
