// ========================================
// LIKERT CHART VISUALIZER - Modular Edition
// Sistema extensible con plugins de gráficos
// ========================================

import { chartRegistry } from './core/ChartRegistry.js';

/**
 * Global Application State
 */
const AppState = {
    data: null,
    longData: null,
    currentLanguage: 'es',
    translations: {},
    config: null,
    scaleConfig: {
        type: 'custom',
        points: 5,
        labels: []
    },
    chartConfig: {
        type: 'stacked',
        valueType: 'percentage',
        sortBy: 'original',
        colorScheme: 'blue_orange',
        fontFamily: 'Arial, sans-serif',
        fontSizeLabels: 12,
        fontSizeValues: 11,
        fontSizeLegend: 10,
        barHeight: 40,
        barSpacing: 10,
        showValues: true,
        showLegend: true,
        decimalPlaces: 1,
        watermark: ''
    },
    filteredItems: new Set()
};

// Export para módulos
window.AppState = AppState;

/**
 * ConfigLoader - Carga configuración y registra tipos de gráficos
 */
const ConfigLoader = {
    async loadConfig() {
        try {
            console.log('[ConfigLoader] Loading config.json...');
            const response = await fetch('config.json');
            if (!response.ok) throw new Error('Failed to load config.json');
            AppState.config = await response.json();
            console.log('[ConfigLoader] Config loaded:', AppState.config);
            
            // Cargar y registrar tipos de gráficos dinámicamente
            await this.loadChartTypes();
            
            // Apply default settings
            if (AppState.config.defaultSettings) {
                Object.assign(AppState.chartConfig, AppState.config.defaultSettings);
            }
            
            return AppState.config;
        } catch (error) {
            console.error('[ConfigLoader] Error loading configuration:', error);
            AppState.config = {
                chartTypes: [],
                presetScales: {},
                colorSchemes: {},
                defaultSettings: AppState.chartConfig
            };
        }
    },

    async loadChartTypes() {
        if (!AppState.config.chartTypes || AppState.config.chartTypes.length === 0) {
            console.warn('[ConfigLoader] No chart types defined in config.json');
            return;
        }

        console.log(`[ConfigLoader] Loading ${AppState.config.chartTypes.length} chart types...`);

        for (const chartType of AppState.config.chartTypes) {
            if (!chartType.enabled) {
                console.log(`[ConfigLoader] Skipping disabled chart: ${chartType.id}`);
                continue;
            }

            try {
                console.log(`[ConfigLoader] Loading chart module: ${chartType.module}`);
                const module = await import(`./${chartType.module}`);
                const chartModule = module.default;
                
                if (chartRegistry.register(chartModule)) {
                    console.log(`[ConfigLoader] ✓ Chart registered: ${chartType.id}`);
                } else {
                    console.error(`[ConfigLoader] ✗ Failed to register: ${chartType.id}`);
                }
            } catch (error) {
                console.error(`[ConfigLoader] Error loading chart ${chartType.id}:`, error);
            }
        }

        console.log(`[ConfigLoader] Total charts registered: ${chartRegistry.getAll().length}`);
    }
};

/**
 * I18n - Internacionalización
 */
const I18n = {
    async loadLanguage(lang) {
        try {
            const response = await fetch(`i18n/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load language: ${lang}`);
            AppState.translations = await response.json();
            AppState.currentLanguage = lang;
            this.updateUI();
        } catch (error) {
            console.error('Error loading language:', error);
            if (lang !== 'en') {
                await this.loadLanguage('en');
            }
        }
    },

    t(key) {
        return AppState.translations[key] || key;
    },

    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.tagName === 'OPTION') {
                if (key) element.textContent = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        if (AppState.config) {
            UI.populatePresetScales();
            UI.populateColorSchemes();
            UI.populateChartTypes(); // Nueva función
        }
        
        if (AppState.scaleConfig.labels.length > 0) {
            UI.updateScaleLabels();
        }
    }
};

/**
 * DataParser - Parseo de CSV
 */
const DataParser = {
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error(I18n.t('invalid_csv'));
        }

        const headers = this.parseCSVLine(lines[0]);
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                rows.push(row);
            }
        }

        return { headers, rows };
    },

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        return values;
    },

    convertToLong(wideData) {
        const longData = [];
        const headers = wideData.headers;
        const idColumn = headers[0];

        wideData.rows.forEach(row => {
            const respondentId = row[idColumn];
            
            for (let i = 1; i < headers.length; i++) {
                const itemName = headers[i];
                const value = row[itemName];
                const numValue = parseInt(value, 10);
                
                longData.push({
                    respondent: respondentId,
                    item: itemName,
                    value: numValue
                });
            }
        });

        return longData;
    },

    validateData(longData, scaleConfig) {
        const minValue = 1;
        const maxValue = scaleConfig.points;
        const invalidValues = [];

        longData.forEach(record => {
            if (isNaN(record.value) || record.value < minValue || record.value > maxValue) {
                invalidValues.push({
                    item: record.item,
                    respondent: record.respondent,
                    value: record.value
                });
            }
        });

        return {
            valid: invalidValues.length === 0,
            invalidValues: invalidValues
        };
    }
};

/**
 * DataTransformer - Transformación de datos
 */
const DataTransformer = {
    calculateStatistics(longData, items) {
        const stats = {};

        items.forEach(item => {
            const itemData = longData.filter(d => d.item === item).map(d => d.value);
            
            const mean = itemData.reduce((sum, val) => sum + val, 0) / itemData.length;
            
            const sorted = [...itemData].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 === 0 
                ? (sorted[mid - 1] + sorted[mid]) / 2 
                : sorted[mid];
            
            const frequencies = {};
            const maxScale = AppState.scaleConfig.points;
            for (let i = 1; i <= maxScale; i++) {
                frequencies[i] = 0;
            }
            itemData.forEach(val => {
                if (frequencies[val] !== undefined) {
                    frequencies[val]++;
                }
            });

            const midpoint = Math.ceil(maxScale / 2);
            const agreementCount = itemData.filter(v => v > midpoint).length;
            const agreementPercent = (agreementCount / itemData.length) * 100;

            stats[item] = {
                mean,
                median,
                frequencies,
                total: itemData.length,
                agreementPercent
            };
        });

        return stats;
    },

    sortItems(items, stats, sortBy) {
        const sorted = [...items];

        switch (sortBy) {
            case 'mean':
                sorted.sort((a, b) => stats[b].mean - stats[a].mean);
                break;
            case 'median':
                sorted.sort((a, b) => stats[b].median - stats[a].median);
                break;
            case 'agreement':
                sorted.sort((a, b) => stats[b].agreementPercent - stats[a].agreementPercent);
                break;
            case 'original':
            default:
                break;
        }

        return sorted;
    },

    getUniqueItems(longData) {
        return [...new Set(longData.map(d => d.item))];
    }
};

/**
 * ChartRenderer - Usa el sistema de plugins
 */
const ChartRenderer = {
    getColors() {
        const schemeName = AppState.chartConfig.colorScheme;
        const scheme = AppState.config?.colorSchemes[schemeName];
        
        if (!scheme) {
            return ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8'];
        }
        
        const colors = scheme.colors;
        const points = AppState.scaleConfig.points;
        
        if (colors.length >= points) {
            return colors.slice(0, points);
        } else {
            return this.interpolateColors(colors, points);
        }
    },

    interpolateColors(colors, targetLength) {
        if (colors.length === targetLength) return colors;
        
        const result = [];
        const step = (colors.length - 1) / (targetLength - 1);
        
        for (let i = 0; i < targetLength; i++) {
            const position = i * step;
            const index1 = Math.floor(position);
            const index2 = Math.min(index1 + 1, colors.length - 1);
            const factor = position - index1;
            
            if (factor === 0) {
                result.push(colors[index1]);
            } else {
                const color1 = this.hexToRgb(colors[index1]);
                const color2 = this.hexToRgb(colors[index2]);
                const interpolated = {
                    r: Math.round(color1.r + (color2.r - color1.r) * factor),
                    g: Math.round(color1.g + (color2.g - color1.g) * factor),
                    b: Math.round(color1.b + (color2.b - color1.b) * factor)
                };
                result.push(this.rgbToHex(interpolated.r, interpolated.g, interpolated.b));
            }
        }
        
        return result;
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    render() {
        if (!AppState.longData || AppState.longData.length === 0) {
            this.showPlaceholder();
            return;
        }

        document.querySelector('.chart-placeholder')?.classList.add('hidden');
        const canvas = document.getElementById('chart-canvas');
        if (!canvas) return;

        canvas.classList.remove('hidden');

        // Obtener el tipo de gráfico del registro
        const chartType = AppState.chartConfig.type;
        const chartModule = chartRegistry.get(chartType);

        if (!chartModule) {
            console.error(`Chart type not found: ${chartType}`);
            this.showPlaceholder();
            return;
        }

        // Filtrar ítems
        let items = DataTransformer.getUniqueItems(AppState.longData);
        if (AppState.filteredItems.size > 0) {
            items = items.filter(item => AppState.filteredItems.has(item));
        }

        const stats = DataTransformer.calculateStatistics(AppState.longData, items);
        const sortedItems = DataTransformer.sortItems(items, stats, AppState.chartConfig.sortBy);

        // Renderizar usando el módulo del gráfico
        try {
            if (chartType === 'distribution') {
                chartModule.render(
                    canvas,
                    AppState.longData,
                    AppState.chartConfig,
                    AppState.scaleConfig,
                    this.getColors.bind(this),
                    I18n.t.bind(I18n)
                );
            } else {
                chartModule.render(
                    canvas,
                    sortedItems,
                    stats,
                    AppState.chartConfig,
                    AppState.scaleConfig,
                    this.getColors.bind(this),
                    I18n.t.bind(I18n)
                );
            }
        } catch (error) {
            console.error(`Error rendering chart ${chartType}:`, error);
            this.showPlaceholder();
        }
    },

    showPlaceholder() {
        document.querySelector('.chart-placeholder')?.classList.remove('hidden');
        document.getElementById('chart-canvas')?.classList.add('hidden');
    },

    downloadChart() {
        const canvas = document.getElementById('chart-canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `likert-chart-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
};

/**
 * UI - Manejo de interfaz
 */
const UI = {
    async init() {
        await ConfigLoader.loadConfig();
        await I18n.loadLanguage('es');
        
        this.setupEventListeners();
        this.setupReactiveControls();
        this.populatePresetScales();
        this.populateColorSchemes();
        this.populateChartTypes();
    },

    setupEventListeners() {
        // Language switcher
        document.getElementById('language-select')?.addEventListener('change', async (e) => {
            await I18n.loadLanguage(e.target.value);
        });

        // File upload
        document.getElementById('csv-file')?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Preset scale
        document.getElementById('preset-scale')?.addEventListener('change', (e) => {
            this.applyPresetScale(e.target.value);
        });

        // Custom scale
        document.getElementById('scale-points')?.addEventListener('change', () => {
            this.updateCustomScale();
        });

        // Download button
        document.getElementById('download-btn')?.addEventListener('click', () => {
            ChartRenderer.downloadChart();
        });
    },

    setupReactiveControls() {
        const controls = document.querySelectorAll('.reactive-control');
        controls.forEach(control => {
            const updateChart = () => {
                const id = control.id;
                const value = control.type === 'checkbox' ? control.checked : control.value;

                switch (id) {
                    case 'chart-type':
                        AppState.chartConfig.type = value;
                        break;
                    case 'value-type':
                        AppState.chartConfig.valueType = value;
                        break;
                    case 'sort-by':
                        AppState.chartConfig.sortBy = value;
                        break;
                    case 'color-scheme':
                        AppState.chartConfig.colorScheme = value;
                        break;
                    case 'font-family':
                        AppState.chartConfig.fontFamily = value;
                        break;
                    case 'font-size-labels':
                        AppState.chartConfig.fontSizeLabels = parseInt(value);
                        break;
                    case 'font-size-values':
                        AppState.chartConfig.fontSizeValues = parseInt(value);
                        break;
                    case 'font-size-legend':
                        AppState.chartConfig.fontSizeLegend = parseInt(value);
                        break;
                    case 'bar-height':
                        AppState.chartConfig.barHeight = parseInt(value);
                        break;
                    case 'bar-spacing':
                        AppState.chartConfig.barSpacing = parseInt(value);
                        break;
                    case 'show-values':
                        AppState.chartConfig.showValues = value;
                        break;
                    case 'show-legend':
                        AppState.chartConfig.showLegend = value;
                        break;
                    case 'decimal-places':
                        AppState.chartConfig.decimalPlaces = parseInt(value);
                        break;
                    case 'watermark':
                        AppState.chartConfig.watermark = value;
                        break;
                }

                ChartRenderer.render();
            };

            control.addEventListener('change', updateChart);
            control.addEventListener('input', updateChart);
        });
    },

    populateChartTypes() {
        const select = document.getElementById('chart-type');
        if (!select) return;

        select.innerHTML = '';

        const charts = chartRegistry.getAll();
        charts.forEach(chart => {
            const option = document.createElement('option');
            option.value = chart.id;
            option.textContent = chartRegistry.getName(chart.id, AppState.currentLanguage);
            select.appendChild(option);
        });

        select.value = AppState.chartConfig.type;
    },

    populatePresetScales() {
        const select = document.getElementById('preset-scale');
        if (!select || !AppState.config.presetScales) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">-- ' + I18n.t('custom_scale') + ' --</option>';

        Object.keys(AppState.config.presetScales).forEach(key => {
            const scale = AppState.config.presetScales[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = AppState.currentLanguage === 'es' ? scale.nameES : scale.name;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    },

    populateColorSchemes() {
        const select = document.getElementById('color-scheme');
        if (!select || !AppState.config.colorSchemes) return;

        const currentValue = select.value;
        select.innerHTML = '';

        Object.keys(AppState.config.colorSchemes).forEach(key => {
            const scheme = AppState.config.colorSchemes[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = AppState.currentLanguage === 'es' ? scheme.nameES : scheme.name;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    },

    applyPresetScale(presetKey) {
        if (!presetKey) {
            this.updateCustomScale();
            return;
        }

        const scale = AppState.config.presetScales[presetKey];
        if (!scale) return;

        AppState.scaleConfig = {
            type: presetKey,
            points: scale.points,
            labels: scale.labels[AppState.currentLanguage] || scale.labels.en
        };

        this.updateScaleLabels();
        ChartRenderer.render();
    },

    updateCustomScale() {
        const points = parseInt(document.getElementById('scale-points')?.value || 5);
        AppState.scaleConfig = {
            type: 'custom',
            points: points,
            labels: Array.from({ length: points }, (_, i) => `${i + 1}`)
        };

        this.updateScaleLabels();
        ChartRenderer.render();
    },

    updateScaleLabels() {
        const container = document.getElementById('scale-labels-container');
        if (!container) return;

        container.innerHTML = '';
        AppState.scaleConfig.labels.forEach((label, index) => {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label>${index + 1}:</label>
                <input type="text" value="${label}" data-scale-label="${index}" class="scale-label-input">
            `;
            container.appendChild(div);
        });

        document.querySelectorAll('.scale-label-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.getAttribute('data-scale-label'));
                AppState.scaleConfig.labels[index] = e.target.value;
                ChartRenderer.render();
            });
        });
    },

    async handleFileUpload(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const parsedData = DataParser.parseCSV(text);
            AppState.data = parsedData;
            AppState.longData = DataParser.convertToLong(parsedData);

            const validation = DataParser.validateData(AppState.longData, AppState.scaleConfig);
            if (!validation.valid) {
                alert(I18n.t('invalid_data') + '\n' + JSON.stringify(validation.invalidValues, null, 2));
                return;
            }

            this.populateItemFilter();
            ChartRenderer.render();
        } catch (error) {
            alert(I18n.t('error_loading_csv') + ': ' + error.message);
        }
    },

    populateItemFilter() {
        const container = document.getElementById('item-filter-container');
        if (!container) return;

        const items = DataTransformer.getUniqueItems(AppState.longData);
        AppState.filteredItems.clear();
        items.forEach(item => AppState.filteredItems.add(item));

        container.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'filter-item';
            div.innerHTML = `
                <label>
                    <input type="checkbox" class="item-checkbox" value="${item}" checked>
                    ${item}
                </label>
            `;
            container.appendChild(div);
        });

        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    AppState.filteredItems.add(e.target.value);
                } else {
                    AppState.filteredItems.delete(e.target.value);
                }
                ChartRenderer.render();
            });
        });
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
