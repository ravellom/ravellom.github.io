export type Lang = 'es' | 'en';
export type ExportFormat = 'png' | 'svg' | 'pdf';
export type PaletteId = 'blue_orange' | 'red_green' | 'purple_yellow' | 'spectral' | 'viridis' | 'warm' | 'cool' | 'earth';

export interface GlobalConfig {
  language: Lang;
  activeDatasetId: string | null;
  theme: 'light';
  autosave: boolean;
}

export interface SharedChartConfig {
  paletteId: PaletteId;
  fontFamily: string;
  titleFontSize: number;
  labelFontSize: number;
  canvasBackground: string;
  canvasTransparent: boolean;
  showGrid: boolean;
  gridColor: string;
  axisColor: string;
  lineWidth: number;
  chartWidth: number;
  chartMinHeight: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  showTitle: boolean;
  chartTitle: string;
  showAxisLabels: boolean;
  axisWidth: number;
  gridDashed: boolean;
  gridVertical: boolean;
  gridHorizontal: boolean;
  showGridBorder: boolean;
}

export interface SharedExportConfig {
  format: ExportFormat;
  scale: 1 | 2 | 3 | 4;
  dpi: 96 | 150 | 300 | 400;
  includeTransparentBg: boolean;
  fileNamePattern: string;
  allowClipboard: boolean;
  allowBatchExport: boolean;
}

export interface SharedAnnotationsConfig {
  showMeanLine: boolean;
  meanLineColor: string;
  meanLineWidth: number;
  meanLineDash: number;
  meanLineGap: number;
  showMeanLabel: boolean;
  showStatsPanel: boolean;
  statsFields: {
    n: boolean;
    mean: boolean;
    median: boolean;
    sd: boolean;
    iqr: boolean;
  };
  statsPosition: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  annotationText: string;
  annotationX: number;
  annotationY: number;
  annotationColor: string;
  annotationSize: number;
}

export interface ProcessorConfig {
  csvDelimiterMode: 'auto' | ',' | ';' | '\t' | '|';
  sourceType: 'auto' | 'google_forms' | 'ms_forms' | 'generic' | 'json';
  defaultFillValue: string;
  previewRows: number;
  defaultLikertRange: { min: number; max: number };
  autoDetectLikertColumns: boolean;
  storageAutoActivateOnSave: boolean;
}

export interface LikertConfig {
  analysisMode: 'standard' | 'comparison';
  chartType: 'stacked' | 'diverging' | 'split' | 'distribution';
  comparisonPreDatasetId: string | null;
  comparisonPostDatasetId: string | null;
  valueMode: 'percentage' | 'count';
  itemOrder: 'original' | 'mean_desc' | 'mean_asc' | 'label_asc';
  showValues: boolean;
  showLegend: boolean;
  legendPosition: 'right' | 'bottom' | 'top' | 'left';
  decimalPlaces: number;
  selectedItems: string[];
  scalePresetId: string;
  scalePoints: number;
  scaleStart: number;
  scaleLabels: string[];
  zoomLevel: number;
  fullscreenEnabled: boolean;
  watermark: string;
  labelMaxLines: number;
  fontSizeValues: number;
  fontSizeLegend: number;
  fontSizeTitle: number;
}

export interface LikertChartTypeConfig {
  stacked: {
    barHeight: number;
    barSpacing: number;
    showBarBorders: boolean;
    barBorderColor: string;
    barBorderWidth: number;
  };
  diverging: {
    neutralIndex: number;
    centerLineColor: string;
    centerLineWidth: number;
  };
}

export interface DistributionConfig {
  chartType: 'boxplot' | 'violin' | 'boxviolin' | 'raincloud' | 'errorbar';
  numericColumns: string[];
  categoryColumn: string | null;
  groupOrder: 'original' | 'alphabetical' | 'median_desc' | 'median_asc';
  topNGroups: number;
  zoomLevel: number;
  fullscreenEnabled: boolean;
  labelMaxLines: number;
  showSampleSizeLabel: boolean;
  showOutliers: boolean;
  showJitter: boolean;
  jitterSize: number;
  jitterAlpha: number;
  outlierSize: number;
  outlierColor: string;
  orientation: 'horizontal' | 'vertical';
  groupThickness: number;
  groupGap: number;
  showHypothesisPanel: boolean;
  hypothesisMode: 'auto' | 'parametric' | 'nonparametric';
  showGroupMarker: boolean;
  groupMetric: 'median' | 'mean';
  groupMarkerStyle: 'point' | 'square' | 'line';
  groupMarkerColor: string;
  groupMarkerSize: number;
}

export interface DistributionChartTypeConfig {
  boxplot: {
    whiskerMultiplier: number;
  };
  violin: {
    kdeBandwidthFactor: number;
    kdeSteps: number;
    violinOpacity: number;
  };
  boxviolin: {
    whiskerMultiplier: number;
    kdeBandwidthFactor: number;
    kdeSteps: number;
    violinOpacity: number;
  };
  raincloud: {
    cloudOffset: number;
    boxHeightRatio: number;
  };
  errorbar: {
    errorMetric: 'sd' | 'se' | 'ci95' | 'minmax';
    errorCiLevel: number;
  };
}

export interface ConfigModel {
  global: GlobalConfig;
  sharedChart: SharedChartConfig;
  sharedExport: SharedExportConfig;
  sharedAnnotations: SharedAnnotationsConfig;
  processor: ProcessorConfig;
  likert: LikertConfig;
  likertChartType: LikertChartTypeConfig;
  distribution: DistributionConfig;
  distributionChartType: DistributionChartTypeConfig;
}

export const defaultConfig: ConfigModel = {
  global: {
    language: 'es',
    activeDatasetId: null,
    theme: 'light',
    autosave: true
  },
  sharedChart: {
    paletteId: 'blue_orange',
    fontFamily: 'Segoe UI, sans-serif',
    titleFontSize: 20,
    labelFontSize: 12,
    canvasBackground: '#ffffff',
    canvasTransparent: false,
    showGrid: true,
    gridColor: '#e2e8f0',
    axisColor: '#64748b',
    lineWidth: 2,
    chartWidth: 1200,
    chartMinHeight: 420,
    marginTop: 60,
    marginRight: 80,
    marginBottom: 70,
    marginLeft: 220,
    showTitle: true,
    chartTitle: '',
    showAxisLabels: true,
    axisWidth: 2,
    gridDashed: true,
    gridVertical: true,
    gridHorizontal: false,
    showGridBorder: true
  },
  sharedExport: {
    format: 'png',
    scale: 2,
    dpi: 300,
    includeTransparentBg: false,
    fileNamePattern: '{module}-{chart}-{timestamp}',
    allowClipboard: true,
    allowBatchExport: true
  },
  sharedAnnotations: {
    showMeanLine: false,
    meanLineColor: '#0f172a',
    meanLineWidth: 1.6,
    meanLineDash: 8,
    meanLineGap: 6,
    showMeanLabel: true,
    showStatsPanel: false,
    statsFields: { n: true, mean: true, median: true, sd: true, iqr: true },
    statsPosition: 'top_right',
    annotationText: '',
    annotationX: 80,
    annotationY: 12,
    annotationColor: '#111827',
    annotationSize: 13
  },
  processor: {
    csvDelimiterMode: 'auto',
    sourceType: 'auto',
    defaultFillValue: '',
    previewRows: 25,
    defaultLikertRange: { min: 1, max: 5 },
    autoDetectLikertColumns: true,
    storageAutoActivateOnSave: true
  },
  likert: {
    analysisMode: 'standard',
    chartType: 'stacked',
    comparisonPreDatasetId: null,
    comparisonPostDatasetId: null,
    valueMode: 'percentage',
    itemOrder: 'original',
    showValues: true,
    showLegend: true,
    legendPosition: 'right',
    decimalPlaces: 1,
    selectedItems: [],
    scalePresetId: 'agreement_5',
    scalePoints: 5,
    scaleStart: 1,
    scaleLabels: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'],
    zoomLevel: 1,
    fullscreenEnabled: false,
    watermark: '',
    labelMaxLines: 2,
    fontSizeValues: 11,
    fontSizeLegend: 10,
    fontSizeTitle: 18
  },
  likertChartType: {
    stacked: {
      barHeight: 40,
      barSpacing: 10,
      showBarBorders: false,
      barBorderColor: '#ffffff',
      barBorderWidth: 1
    },
    diverging: {
      neutralIndex: 3,
      centerLineColor: '#334155',
      centerLineWidth: 1
    }
  },
  distribution: {
    chartType: 'boxplot',
    numericColumns: [],
    categoryColumn: null,
    groupOrder: 'original',
    topNGroups: 15,
    zoomLevel: 1,
    fullscreenEnabled: false,
    labelMaxLines: 2,
    showSampleSizeLabel: true,
    showOutliers: true,
    showJitter: false,
    jitterSize: 1.6,
    jitterAlpha: 0.4,
    outlierSize: 2.2,
    outlierColor: '#ef4444',
    orientation: 'horizontal',
    groupThickness: 34,
    groupGap: 16,
    showHypothesisPanel: false,
    hypothesisMode: 'auto',
    showGroupMarker: false,
    groupMetric: 'median',
    groupMarkerStyle: 'point',
    groupMarkerColor: '#7c3aed',
    groupMarkerSize: 5
  },
  distributionChartType: {
    boxplot: {
      whiskerMultiplier: 1.5
    },
    violin: {
      kdeBandwidthFactor: 1,
      kdeSteps: 70,
      violinOpacity: 0.55
    },
    boxviolin: {
      whiskerMultiplier: 1.5,
      kdeBandwidthFactor: 1,
      kdeSteps: 70,
      violinOpacity: 0.55
    },
    raincloud: {
      cloudOffset: 4,
      boxHeightRatio: 0.35
    },
    errorbar: {
      errorMetric: 'sd',
      errorCiLevel: 95
    }
  }
};

