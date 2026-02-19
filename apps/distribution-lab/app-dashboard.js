import { StatsEngine } from './core/StatsEngine.js';
import { HypothesisTests } from './core/HypothesisTests.js';
import BoxPlotChart from './charts/BoxPlotChart.js';
import ViolinChart from './charts/ViolinChart.js';
import BoxViolinChart from './charts/BoxViolinChart.js';
import RaincloudChart from './charts/RaincloudChart.js';
import ErrorBarChart from './charts/ErrorBarChart.js';
import { ExportUtils } from './utils/ExportUtils.js';

const COLOR_SCHEMES = {
    blue_orange: ['#2563eb', '#3b82f6', '#38bdf8', '#fb923c', '#f97316'],
    cool: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16'],
    warm: ['#ef4444', '#f97316', '#f59e0b', '#fbbf24', '#fb7185']
};

const AppState = {
    currentLanguage: localStorage.getItem('survey_suite_language') || 'en',
    translations: {},
    dataRows: [],
    activeDatasetName: '',
    activePanel: 'data',
    lastRender: null
};

const I18n = {
    async load(lang) {
        try {
            const response = await fetch(`i18n/${lang}.json`);
            if (!response.ok) throw new Error('Language file not found');
            AppState.translations = await response.json();
            AppState.currentLanguage = lang;
            localStorage.setItem('survey_suite_language', lang);
            this.apply();
        } catch (error) {
            if (lang !== 'en') return this.load('en');
            console.error('I18n load error:', error);
        }
    },

    t(key) {
        return AppState.translations[key] || key;
    },

    apply() {
        document.documentElement.lang = AppState.currentLanguage;
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
        this.renderDataSummary();
    },

    renderDataSummary() {
        const summary = document.getElementById('data-summary');
        if (!summary) return;

        if (!Array.isArray(AppState.dataRows) || AppState.dataRows.length === 0) {
            summary.innerHTML = `<span>${this.t('no_data_summary')}</span>`;
            return;
        }

        const columns = Object.keys(AppState.dataRows[0] || {});
        summary.innerHTML = [
            `<div><strong>${this.t('rows')}:</strong> ${AppState.dataRows.length}</div>`,
            `<div><strong>${this.t('columns')}:</strong> ${columns.length}</div>`,
            `<div><strong>${this.t('active_dataset')}:</strong> ${AppState.activeDatasetName || '-'}</div>`
        ].join('');
    }
};

const Navigation = {
    init() {
        document.querySelectorAll('.nav-item').forEach((button) => {
            button.addEventListener('click', () => this.switchPanel(button.dataset.panel));
        });
    },

    switchPanel(panel) {
        AppState.activePanel = panel;
        document.querySelectorAll('.nav-item').forEach((button) => {
            button.classList.toggle('active', button.dataset.panel === panel);
        });
        document.querySelectorAll('.options-panel').forEach((panelEl) => {
            panelEl.classList.toggle('active', panelEl.id === `panel-${panel}`);
        });
    }
};

const DataBridge = {
    getDataApi() {
        return window.RecuEduData || null;
    },

    refreshFromStorage() {
        const datasetName = AppState.activeDatasetName || localStorage.getItem('survey_suite_active_dataset');
        if (!datasetName) return;
        this.loadDatasetByName(datasetName);
    },

    loadDatasetByName(datasetName) {
        const api = this.getDataApi();
        if (!api || !api.storage) return;

        const dataset = api.storage.loadDataset(datasetName);
        if (!dataset || !Array.isArray(dataset.data)) return;

        AppState.activeDatasetName = datasetName;
        AppState.dataRows = dataset.data;

        const nameEl = document.getElementById('active-dataset-name');
        if (nameEl) nameEl.textContent = datasetName;

        this.populateColumnSelects(dataset.data);
        I18n.renderDataSummary();
        ChartController.render();
    },

    populateColumnSelects(rows) {
        const numericSelect = document.getElementById('numeric-column');
        const categorySelect = document.getElementById('category-column');
        if (!numericSelect || !categorySelect) return;

        const columns = Object.keys(rows[0] || {});
        const prevNumeric = numericSelect.value;
        const prevCategory = categorySelect.value;
        const numericColumns = columns.filter((col) => {
            let numericCount = 0;
            let total = 0;
            rows.forEach((row) => {
                const value = row[col];
                if (value === null || value === undefined || value === '') return;
                total += 1;
                if (!isNaN(Number(value))) numericCount += 1;
            });
            return total > 0 && numericCount >= 1;
        });

        numericSelect.innerHTML = '';
        categorySelect.innerHTML = `<option value="">${I18n.t('none')}</option>`;

        numericColumns.forEach((col) => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            numericSelect.appendChild(opt);
        });

        columns.forEach((col) => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            categorySelect.appendChild(opt);
        });

        if (numericColumns.includes(prevNumeric)) {
            numericSelect.value = prevNumeric;
        } else if (numericColumns.length > 0) {
            numericSelect.value = numericColumns[0];
        }

        if (columns.includes(prevCategory)) {
            categorySelect.value = prevCategory;
        }
    }
};

const ChartController = {
    parseNumber(id, fallback, min = null, max = null) {
        const raw = Number(document.getElementById(id)?.value);
        if (!Number.isFinite(raw)) return fallback;
        let value = raw;
        if (Number.isFinite(min)) value = Math.max(min, value);
        if (Number.isFinite(max)) value = Math.min(max, value);
        return value;
    },

    getSelectedConfig() {
        return {
            numericColumn: document.getElementById('numeric-column')?.value || '',
            categoryColumn: document.getElementById('category-column')?.value || '',
            chartType: document.getElementById('chart-type')?.value || 'boxplot',
            orientation: document.getElementById('chart-orientation')?.value || 'horizontal',
            showOutliers: document.getElementById('show-outliers')?.checked !== false,
            showJitter: document.getElementById('show-jitter')?.checked === true,
            showGrid: document.getElementById('show-grid')?.checked !== false,
            groupOrder: document.getElementById('group-order')?.value || 'original',
            topN: this.parseNumber('top-n-groups', 15, 1, 200),
            whiskerMultiplier: this.parseNumber('whisker-multiplier', 1.5, 0.5, 4),
            kdeBandwidthFactor: this.parseNumber('kde-bandwidth-factor', 1, 0.2, 4),
            kdeSteps: this.parseNumber('kde-steps', 70, 30, 260),
            errorMetric: document.getElementById('error-metric')?.value || 'sd',
            errorCiLevel: this.parseNumber('error-ci-level', 95, 80, 99),
            colorScheme: document.getElementById('color-scheme')?.value || 'blue_orange',
            fontFamily: document.getElementById('font-family')?.value || 'Arial, sans-serif',
            titleFontSize: this.parseNumber('title-font-size', 20, 12, 42),
            labelFontSize: this.parseNumber('label-font-size', 12, 10, 24),
            lineWidth: this.parseNumber('line-width', 2, 1, 6),
            violinOpacity: this.parseNumber('violin-opacity', 0.55, 0.1, 1),
            jitterSize: this.parseNumber('jitter-size', 1.6, 1, 8),
            jitterAlpha: this.parseNumber('jitter-alpha', 0.4, 0.1, 1),
            outlierSize: this.parseNumber('outlier-size', 2.2, 1, 10),
            outlierColor: document.getElementById('outlier-color')?.value || '#ef4444',
            groupThickness: this.parseNumber('group-thickness', 34, 20, 80),
            groupGap: this.parseNumber('group-gap', 16, 4, 50),
            chartWidth: this.parseNumber('chart-width', 1200, 800, 2600),
            chartMinHeight: this.parseNumber('chart-min-height', 420, 360, 1600),
            marginLeft: this.parseNumber('margin-left', 220, 50, 600),
            marginRight: this.parseNumber('margin-right', 80, 30, 400),
            marginTop: this.parseNumber('margin-top', 60, 30, 300),
            marginBottom: this.parseNumber('margin-bottom', 70, 30, 300),
            showMeanLine: document.getElementById('show-mean-line')?.checked === true,
            meanLineColor: document.getElementById('mean-line-color')?.value || '#0f172a',
            meanLineWidth: this.parseNumber('mean-line-width', 1.6, 1, 8),
            meanLineDash: this.parseNumber('mean-line-dash', 8, 2, 40),
            meanLineGap: this.parseNumber('mean-line-gap', 6, 2, 40),
            showMeanLabel: document.getElementById('show-mean-label')?.checked !== false,
            showStats: document.getElementById('show-stats-panel')?.checked === true,
            showHypothesis: document.getElementById('show-hypothesis-panel')?.checked === true,
            hypothesisMode: document.getElementById('hypothesis-mode')?.value || 'auto',
            statsPosition: document.getElementById('stats-position')?.value || 'top_right',
            statsFields: {
                n: document.getElementById('stats-show-n')?.checked !== false,
                mean: document.getElementById('stats-show-mean')?.checked !== false,
                median: document.getElementById('stats-show-median')?.checked !== false,
                sd: document.getElementById('stats-show-sd')?.checked !== false,
                iqr: document.getElementById('stats-show-iqr')?.checked !== false
            },
            showGroupMarker: document.getElementById('show-group-marker')?.checked === true,
            groupMetric: document.getElementById('group-metric')?.value || 'median',
            groupMarkerStyle: document.getElementById('group-marker-style')?.value || 'point',
            groupMarkerColor: document.getElementById('group-marker-color')?.value || '#7c3aed',
            groupMarkerSize: this.parseNumber('group-marker-size', 5, 2, 20),
            annotationText: (document.getElementById('annotation-text')?.value || '').trim(),
            annotationX: this.parseNumber('annotation-x', 80, 0, 100),
            annotationY: this.parseNumber('annotation-y', 12, 0, 100),
            annotationColor: document.getElementById('annotation-color')?.value || '#111827',
            annotationSize: this.parseNumber('annotation-size', 13, 10, 40),
            chartTitle: (document.getElementById('chart-title-input')?.value || '').trim()
        };
    },

    computeOverallStats(groups) {
        const values = groups.flatMap((g) => g.values || []).filter((v) => Number.isFinite(Number(v))).map(Number);
        if (!values.length) {
            return {
                n: 0,
                mean: NaN,
                median: NaN,
                sd: NaN,
                iqr: NaN
            };
        }
        const summary = StatsEngine.summarize(values);
        const mean = summary.mean;
        const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / Math.max(1, values.length - 1);
        return {
            n: values.length,
            mean,
            median: summary.median,
            sd: Math.sqrt(variance),
            iqr: summary.iqr
        };
    },

    sortGroups(groups, order) {
        const sorted = [...groups];
        switch (order) {
            case 'alphabetical':
                sorted.sort((a, b) => a.label.localeCompare(b.label));
                break;
            case 'median_desc':
                sorted.sort((a, b) => (b.summary.median || 0) - (a.summary.median || 0));
                break;
            case 'median_asc':
                sorted.sort((a, b) => (a.summary.median || 0) - (b.summary.median || 0));
                break;
            default:
                break;
        }
        return sorted;
    },

    renderMessage(message) {
        const placeholder = document.getElementById('chart-placeholder');
        const canvas = document.getElementById('chart-canvas');
        if (!placeholder || !canvas) return;
        placeholder.classList.remove('hidden');
        canvas.classList.add('hidden');
        const text = placeholder.querySelector('p');
        if (text) text.textContent = message;
    },

    render() {
        const canvas = document.getElementById('chart-canvas');
        const placeholder = document.getElementById('chart-placeholder');
        if (!canvas || !placeholder) return;

        if (!Array.isArray(AppState.dataRows) || AppState.dataRows.length === 0) {
            this.renderMessage(I18n.t('placeholder'));
            return;
        }

        const cfg = this.getSelectedConfig();
        if (!cfg.numericColumn) {
            this.renderMessage(I18n.t('select_numeric'));
            return;
        }

        let groups = StatsEngine.groupNumeric(
            AppState.dataRows,
            cfg.numericColumn,
            cfg.categoryColumn,
            cfg.whiskerMultiplier
        );
        groups = this.sortGroups(groups, cfg.groupOrder).slice(0, cfg.topN);

        if (!groups.length) {
            this.renderMessage(I18n.t('no_valid_numeric'));
            return;
        }

        placeholder.classList.add('hidden');
        canvas.classList.remove('hidden');

        const autoTitleBase = cfg.categoryColumn
            ? `${cfg.numericColumn} by ${cfg.categoryColumn}`
            : cfg.numericColumn;
        const autoTitle = autoTitleBase.length > 80
            ? `${autoTitleBase.slice(0, 77)}...`
            : autoTitleBase;
        const title = cfg.chartTitle || autoTitle;
        const palette = COLOR_SCHEMES[cfg.colorScheme] || COLOR_SCHEMES.blue_orange;
        const overallStats = this.computeOverallStats(groups);
        const hypothesisResult = cfg.categoryColumn && cfg.showHypothesis
            ? HypothesisTests.compare(groups, cfg.hypothesisMode)
            : null;

        const renderOptions = {
            orientation: cfg.orientation,
            showOutliers: cfg.showOutliers,
            showJitter: cfg.showJitter,
            showGrid: cfg.showGrid,
            title,
            palette,
            fontFamily: cfg.fontFamily,
            titleFontSize: cfg.titleFontSize,
            labelFontSize: cfg.labelFontSize,
            lineWidth: cfg.lineWidth,
            violinOpacity: cfg.violinOpacity,
            jitterSize: cfg.jitterSize,
            jitterAlpha: cfg.jitterAlpha,
            outlierSize: cfg.outlierSize,
            outlierColor: cfg.outlierColor,
            groupHeight: cfg.groupThickness,
            groupGap: cfg.groupGap,
            width: this.getResponsiveWidth(cfg.chartWidth),
            minCanvasHeight: cfg.chartMinHeight,
            marginLeft: cfg.marginLeft,
            marginRight: cfg.marginRight,
            marginTop: cfg.marginTop,
            marginBottom: cfg.marginBottom,
            kdeBandwidthFactor: cfg.kdeBandwidthFactor,
            kdeSteps: cfg.kdeSteps,
            errorMetric: cfg.errorMetric,
            errorCiLevel: cfg.errorCiLevel,
            annotations: {
                showMeanLine: cfg.showMeanLine,
                meanValue: overallStats.mean,
                meanLineColor: cfg.meanLineColor,
                meanLineWidth: cfg.meanLineWidth,
                meanLineDash: cfg.meanLineDash,
                meanLineGap: cfg.meanLineGap,
                showMeanLabel: cfg.showMeanLabel,
                showStats: cfg.showStats,
                showHypothesis: cfg.showHypothesis,
                hypothesisMode: cfg.hypothesisMode,
                hypothesisResult,
                statsPosition: cfg.statsPosition,
                statsFields: cfg.statsFields,
                stats: overallStats,
                showGroupMarker: cfg.showGroupMarker,
                groupMetric: cfg.groupMetric,
                groupMarkerStyle: cfg.groupMarkerStyle,
                groupMarkerColor: cfg.groupMarkerColor,
                groupMarkerSize: cfg.groupMarkerSize,
                annotationText: cfg.annotationText,
                annotationX: cfg.annotationX,
                annotationY: cfg.annotationY,
                annotationColor: cfg.annotationColor,
                annotationSize: cfg.annotationSize
            }
        };

        AppState.lastRender = {
            timestamp: new Date().toISOString(),
            dataset: AppState.activeDatasetName || '',
            numericColumn: cfg.numericColumn,
            categoryColumn: cfg.categoryColumn,
            chartType: cfg.chartType,
            config: {
                ...cfg,
                annotations: renderOptions.annotations
            },
            overallStats,
            groups: groups.map((g) => ({
                label: g.label,
                values: Array.isArray(g.values) ? [...g.values] : [],
                summary: g.summary
            }))
        };

        switch (cfg.chartType) {
            case 'violin':
                ViolinChart.render(canvas, groups, renderOptions);
                break;
            case 'boxviolin':
                BoxViolinChart.render(canvas, groups, renderOptions);
                break;
            case 'raincloud':
                RaincloudChart.render(canvas, groups, renderOptions);
                break;
            case 'errorbar':
                ErrorBarChart.render(canvas, groups, renderOptions);
                break;
            case 'boxplot':
            default:
                BoxPlotChart.render(canvas, groups, renderOptions);
                break;
        }
    },

    getResponsiveWidth(requestedWidth) {
        const container = document.querySelector('.chart-container');
        if (!container) return requestedWidth;
        // Usa el ancho interno disponible para evitar overflow inicial en iframe/pantallas pequeñas.
        const availableWidth = Math.max(320, Math.floor(container.clientWidth - 8));
        return Math.min(requestedWidth, availableWidth);
    }
};

function bindMessages() {
    window.addEventListener('message', (event) => {
        const data = event?.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'survey-suite-set-language' && (data.lang === 'en' || data.lang === 'es')) {
            document.getElementById('language-select').value = data.lang;
            I18n.load(data.lang);
        }

        if (data.type === 'survey-suite-load-dataset' && data.datasetName) {
            DataBridge.loadDatasetByName(data.datasetName);
        }
    });
}

function bindUI() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => ChartController.render(), 120);
    });

    document.getElementById('language-select')?.addEventListener('change', (event) => {
        I18n.load(event.target.value);
    });
    document.getElementById('btn-refresh-dataset')?.addEventListener('click', () => {
        DataBridge.refreshFromStorage();
    });
    document.getElementById('btn-export-png')?.addEventListener('click', () => {
        const canvas = document.getElementById('chart-canvas');
        if (!canvas || canvas.classList.contains('hidden')) return;
        const chartType = document.getElementById('chart-type')?.value || 'chart';
        ExportUtils.exportCanvasPNG(canvas, `distribution-${chartType}-${Date.now()}.png`);
    });
    document.getElementById('btn-export-svg')?.addEventListener('click', () => {
        const canvas = document.getElementById('chart-canvas');
        if (!canvas || canvas.classList.contains('hidden')) {
            alert(I18n.t('export_no_chart'));
            return;
        }
        const chartType = document.getElementById('chart-type')?.value || 'chart';
        const ok = ExportUtils.exportVectorSVG(AppState.lastRender, `distribution-${chartType}-${Date.now()}.svg`);
        if (!ok) {
            const context = AppState.lastRender;
            const title = context?.config?.chartTitle
                || `${context?.numericColumn || 'distribution'} ${context?.categoryColumn ? `by ${context.categoryColumn}` : ''}`.trim();
            ExportUtils.exportCanvasSVGFallback(canvas, `distribution-${chartType}-${Date.now()}.svg`, {
                title,
                description: `Dataset: ${AppState.activeDatasetName || '-'}`
            });
        }
    });
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
        const canvas = document.getElementById('chart-canvas');
        if (!canvas || canvas.classList.contains('hidden')) {
            alert(I18n.t('export_no_chart'));
            return;
        }
        const chartType = document.getElementById('chart-type')?.value || 'chart';
        ExportUtils.exportCanvasPDF(canvas, `distribution-${chartType}-${Date.now()}.pdf`);
    });
    document.getElementById('btn-copy-clipboard')?.addEventListener('click', async () => {
        const canvas = document.getElementById('chart-canvas');
        if (!canvas || canvas.classList.contains('hidden')) {
            alert(I18n.t('export_no_chart'));
            return;
        }
        try {
            const ok = await ExportUtils.copyCanvasToClipboard(canvas);
            alert(ok ? I18n.t('clipboard_ok') : I18n.t('clipboard_unsupported'));
        } catch (error) {
            console.error(error);
            alert(I18n.t('clipboard_error'));
        }
    });
    document.getElementById('btn-export-config')?.addEventListener('click', () => {
        if (!AppState.lastRender) {
            alert(I18n.t('export_no_data'));
            return;
        }
        const chartType = AppState.lastRender.chartType || 'chart';
        ExportUtils.exportJSON(AppState.lastRender, `distribution-${chartType}-config-${Date.now()}.json`);
    });
    document.getElementById('btn-export-summary')?.addEventListener('click', () => {
        const context = AppState.lastRender;
        if (!context || !Array.isArray(context.groups) || !context.groups.length) {
            alert(I18n.t('export_no_data'));
            return;
        }
        const chartType = context.chartType || 'chart';
        ExportUtils.exportGroupSummaryCSV(context.groups, `distribution-${chartType}-summary-${Date.now()}.csv`);
    });
    document.getElementById('btn-export-batch')?.addEventListener('click', () => {
        const canvas = document.getElementById('chart-canvas');
        const context = AppState.lastRender;
        if (!canvas || canvas.classList.contains('hidden') || !context) {
            alert(I18n.t('export_no_data'));
            return;
        }
        const chartType = context.chartType || 'chart';
        const stamp = Date.now();
        ExportUtils.exportCanvasPNG(canvas, `distribution-${chartType}-${stamp}.png`);
        const ok = ExportUtils.exportVectorSVG(context, `distribution-${chartType}-${stamp}.svg`);
        if (!ok) {
            ExportUtils.exportCanvasSVGFallback(canvas, `distribution-${chartType}-${stamp}.svg`);
        }
        ExportUtils.exportGroupSummaryCSV(context.groups, `distribution-${chartType}-summary-${stamp}.csv`);
        ExportUtils.exportJSON(context, `distribution-${chartType}-config-${stamp}.json`);
    });

    const configFileInput = document.getElementById('config-file-input');
    document.getElementById('btn-import-config')?.addEventListener('click', () => configFileInput?.click());
    configFileInput?.addEventListener('change', async (event) => {
        const file = event.target?.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const payload = JSON.parse(text);
            const config = payload?.config || payload || {};
            applyConfigToUI(config);
            if (payload?.dataset) {
                DataBridge.loadDatasetByName(payload.dataset);
            }
            ChartController.render();
            alert(I18n.t('import_ok'));
        } catch (error) {
            console.error(error);
            alert(I18n.t('import_error'));
        } finally {
            event.target.value = '';
        }
    });

    [
        'numeric-column',
        'category-column',
        'chart-type',
        'chart-orientation',
        'show-outliers',
        'show-jitter',
        'show-grid',
        'group-order',
        'top-n-groups',
        'whisker-multiplier',
        'kde-bandwidth-factor',
        'kde-steps',
        'error-metric',
        'error-ci-level',
        'color-scheme',
        'font-family',
        'title-font-size',
        'label-font-size',
        'line-width',
        'violin-opacity',
        'jitter-size',
        'jitter-alpha',
        'outlier-size',
        'outlier-color',
        'group-thickness',
        'group-gap',
        'chart-width',
        'chart-min-height',
        'margin-left',
        'margin-right',
        'margin-top',
        'margin-bottom',
        'show-mean-line',
        'mean-line-color',
        'mean-line-width',
        'mean-line-dash',
        'mean-line-gap',
        'show-mean-label',
        'show-stats-panel',
        'show-hypothesis-panel',
        'hypothesis-mode',
        'stats-show-n',
        'stats-show-mean',
        'stats-show-median',
        'stats-show-sd',
        'stats-show-iqr',
        'stats-position',
        'show-group-marker',
        'group-metric',
        'group-marker-style',
        'group-marker-color',
        'group-marker-size',
        'annotation-text',
        'annotation-x',
        'annotation-y',
        'annotation-color',
        'annotation-size',
        'chart-title-input'
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => ChartController.render());
        el.addEventListener('input', () => ChartController.render());
    });
}

function applyConfigToUI(config = {}) {
    const mappings = {
        numericColumn: 'numeric-column',
        categoryColumn: 'category-column',
        chartType: 'chart-type',
        orientation: 'chart-orientation',
        groupOrder: 'group-order',
        topN: 'top-n-groups',
        whiskerMultiplier: 'whisker-multiplier',
        kdeBandwidthFactor: 'kde-bandwidth-factor',
        kdeSteps: 'kde-steps',
        errorMetric: 'error-metric',
        errorCiLevel: 'error-ci-level',
        colorScheme: 'color-scheme',
        fontFamily: 'font-family',
        titleFontSize: 'title-font-size',
        labelFontSize: 'label-font-size',
        lineWidth: 'line-width',
        violinOpacity: 'violin-opacity',
        jitterSize: 'jitter-size',
        jitterAlpha: 'jitter-alpha',
        outlierSize: 'outlier-size',
        outlierColor: 'outlier-color',
        groupThickness: 'group-thickness',
        groupGap: 'group-gap',
        chartWidth: 'chart-width',
        chartMinHeight: 'chart-min-height',
        marginLeft: 'margin-left',
        marginRight: 'margin-right',
        marginTop: 'margin-top',
        marginBottom: 'margin-bottom',
        chartTitle: 'chart-title-input',
        showOutliers: 'show-outliers',
        showJitter: 'show-jitter',
        showGrid: 'show-grid'
    };

    Object.entries(mappings).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el || !(key in config)) return;
        if (el.type === 'checkbox') {
            el.checked = Boolean(config[key]);
        } else {
            el.value = config[key];
        }
    });

    const anno = config.annotations || {};
    const annoMappings = {
        showMeanLine: 'show-mean-line',
        meanLineColor: 'mean-line-color',
        meanLineWidth: 'mean-line-width',
        meanLineDash: 'mean-line-dash',
        meanLineGap: 'mean-line-gap',
        showMeanLabel: 'show-mean-label',
        showStats: 'show-stats-panel',
        showHypothesis: 'show-hypothesis-panel',
        hypothesisMode: 'hypothesis-mode',
        statsPosition: 'stats-position',
        showGroupMarker: 'show-group-marker',
        groupMetric: 'group-metric',
        groupMarkerStyle: 'group-marker-style',
        groupMarkerColor: 'group-marker-color',
        groupMarkerSize: 'group-marker-size',
        annotationText: 'annotation-text',
        annotationX: 'annotation-x',
        annotationY: 'annotation-y',
        annotationColor: 'annotation-color',
        annotationSize: 'annotation-size'
    };
    Object.entries(annoMappings).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el || !(key in anno)) return;
        if (el.type === 'checkbox') {
            el.checked = Boolean(anno[key]);
        } else {
            el.value = anno[key];
        }
    });
    const statsFields = anno.statsFields || {};
    const statsMap = {
        n: 'stats-show-n',
        mean: 'stats-show-mean',
        median: 'stats-show-median',
        sd: 'stats-show-sd',
        iqr: 'stats-show-iqr'
    };
    Object.entries(statsMap).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el || !(key in statsFields)) return;
        el.checked = Boolean(statsFields[key]);
    });
}

async function init() {
    Navigation.init();
    bindUI();
    bindMessages();
    await I18n.load(AppState.currentLanguage);
    document.getElementById('language-select').value = AppState.currentLanguage;
    DataBridge.refreshFromStorage();
}

document.addEventListener('DOMContentLoaded', init);
