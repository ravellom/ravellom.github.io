// ========================================
// LIKERT DASHBOARD - 3 Column Layout
// Sistema con navegación por paneles
// ========================================

import { chartRegistry } from './core/ChartRegistry.js';
import { ChartOptionsAdapter } from './core/ChartOptionsAdapter.js';
import { GeminiProcessor, GeminiConfirmationUI } from './ai/GeminiProcessor.js';

/**
 * Global Application State
 */
const AppState = {
    data: null,
    longData: null,
    currentLanguage: 'en',
    translations: {},
    config: null,
    geminiApiKey: '',
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
        fontSizeTitle: 18,
        barHeight: 40,
        barSpacing: 10,
        showValues: true,
        showLegend: true,
        legendPosition: 'right',
        decimalPlaces: 1,
        watermark: '',
        backgroundColor: '#ffffff',
        transparentBackground: false,
        showGrid: false,
        gridColor: '#e2e8f0',
        gridLineWidth: 1,
        gridDashed: true,
        gridVertical: true,
        gridHorizontal: false,
        showBarBorders: false,
        barBorderColor: '#ffffff',
        barBorderWidth: 1,
        labelMaxLines: 2,
        // Nuevos controles de márgenes
        marginTop: 60,
        marginBottom: 80,
        marginLeft: 200,
        marginRight: 150,
        chartWidth: 1200,
        // Nuevos controles de títulos y ejes
        chartTitle: '',
        showTitle: true,
        showGridBorder: true,
        showAxisLabels: true,
        axisColor: '#333333',
        axisWidth: 2
    },
    filteredItems: new Set(),
    currentPanel: 'data',
    zoom: 1,
    embedMode: false,
    storageOnlyMode: false
};

window.AppState = AppState;

/**
 * Navegación entre paneles
 */
const Navigation = {
    init() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.switchPanel(item.dataset.panel);
            });
        });
    },

    switchPanel(panelId) {
        // Actualizar botones de navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-panel="${panelId}"]`)?.classList.add('active');

        // Actualizar paneles
        document.querySelectorAll('.options-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`panel-${panelId}`)?.classList.add('active');

        AppState.currentPanel = panelId;
    }
};

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
            
            await this.loadChartTypes();
            
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
            UI.populateChartTypes();
        }
        
        if (AppState.scaleConfig.labels.length > 0) {
            UI.updateScaleLabels();
        }
        
        // Redibujar gráfico si hay datos cargados
        if (AppState.longData && AppState.longData.length > 0) {
            ChartRenderer.render();
        }
    }
};

/**
 * DataParser - Parseo de CSV
 */
const DataParser = {
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n').filter(line => line.trim().length > 0);
        if (lines.length < 2) {
            throw new Error(I18n.t('invalid_csv'));
        }

        let headers = this.parseCSVLine(lines[0]);
        const rows = [];
        
        // NO validamos comillas - MS Forms y otros no las usan
        // Los nombres pueden estar con o sin comillas
        
        console.log(`📄 Parseando CSV: ${lines.length} líneas totales, ${headers.length} columnas`);
        console.log('📊 Headers:', headers);
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Saltar líneas vacías
            
            const values = this.parseCSVLine(line);
            
            // Ajustar número de columnas si es necesario
            if (values.length < headers.length) {
                // Rellenar con valores vacíos
                console.warn(`⚠️ Fila ${i}: ${values.length} columnas (esperadas ${headers.length}), rellenando con vacíos`);
                while (values.length < headers.length) {
                    values.push('');
                }
            } else if (values.length > headers.length) {
                // Truncar columnas extra
                console.warn(`⚠️ Fila ${i}: ${values.length} columnas (esperadas ${headers.length}), truncando extras`);
                values.length = headers.length;
            }
            
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            rows.push(row);
        }
        
        if (rows.length === 0) {
            throw new Error('❌ Error: No se encontraron filas válidas de datos.\n\n' +
                          'Verifica que tu CSV tenga datos y que todas las filas tengan el mismo número de columnas.');
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
        let emptyValueCount = 0;
        let validValueCount = 0;

        console.log(`🔄 Convirtiendo datos de formato ancho a largo...`);
        console.log(`   Columna ID: "${idColumn}"`);
        console.log(`   ${wideData.rows.length} filas × ${headers.length - 1} ítems = ${wideData.rows.length * (headers.length - 1)} registros esperados`);

        wideData.rows.forEach((row, rowIndex) => {
            const respondentId = row[idColumn];
            
            for (let i = 1; i < headers.length; i++) {
                const itemName = headers[i];
                const value = row[itemName];
                
                // Manejar valores vacíos o inválidos
                if (value === '' || value === null || value === undefined) {
                    console.warn(`⚠️ Fila ${rowIndex + 1}, columna "${itemName}": valor vacío, usando null`);
                    emptyValueCount++;
                    longData.push({
                        respondent: respondentId,
                        item: itemName,
                        value: null
                    });
                } else {
                    const numValue = parseInt(value, 10);
                    if (isNaN(numValue)) {
                        console.warn(`⚠️ Fila ${rowIndex + 1}, columna "${itemName}": valor "${value}" no es numérico`);
                        emptyValueCount++;
                    } else {
                        validValueCount++;
                    }
                    longData.push({
                        respondent: respondentId,
                        item: itemName,
                        value: numValue
                    });
                }
            }
        });

        console.log(`✅ Conversión completada: ${validValueCount} valores válidos, ${emptyValueCount} valores vacíos/inválidos`);
        return longData;
    },

    validateData(longData, scaleConfig) {
        const minValue = 1;
        const maxValue = scaleConfig.points;
        const invalidValues = [];
        const nullValues = [];
        const outOfRangeValues = [];

        console.log(`🔍 Validando ${longData.length} registros contra escala de ${minValue}-${maxValue}...`);

        longData.forEach(record => {
            // Permitir valores null/vacíos (respuestas no contestadas)
            if (record.value === null || isNaN(record.value)) {
                nullValues.push({
                    item: record.item,
                    respondent: record.respondent,
                    value: record.value
                });
                // NO agregar a invalidValues - los null son válidos en encuestas
            } else if (record.value < minValue || record.value > maxValue) {
                outOfRangeValues.push({
                    item: record.item,
                    respondent: record.respondent,
                    value: record.value
                });
                invalidValues.push({
                    item: record.item,
                    respondent: record.respondent,
                    value: record.value,
                    reason: `fuera de rango (${minValue}-${maxValue})`
                });
            }
        });

        if (nullValues.length > 0) {
            console.warn(`ℹ️ ${nullValues.length} valores vacíos/no contestados (esto es normal en encuestas)`);
        }
        
        if (outOfRangeValues.length > 0) {
            console.warn(`❌ Validación falló: ${outOfRangeValues.length} valores fuera de rango`);
            console.warn('Primeros 5 valores fuera de rango:', outOfRangeValues.slice(0, 5));
        } else {
            console.log(`✅ Validación exitosa: todos los valores numéricos están en rango ${minValue}-${maxValue}`);
        }

        return {
            valid: invalidValues.length === 0, // Solo fallar si hay valores fuera de rango
            invalidValues: invalidValues,
            summary: {
                total: longData.length,
                nullValues: nullValues.length,
                outOfRange: outOfRangeValues.length
            }
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
            // Filtrar datos por ítem y EXCLUIR valores null/NaN
            const itemData = longData
                .filter(d => d.item === item)
                .map(d => d.value)
                .filter(val => val !== null && !isNaN(val));
            
            // Si no hay datos válidos para este ítem, usar valores por defecto
            if (itemData.length === 0) {
                const maxScale = AppState.scaleConfig.points;
                const frequencies = {};
                for (let i = 1; i <= maxScale; i++) {
                    frequencies[i] = 0;
                }
                
                stats[item] = {
                    mean: 0,
                    median: 0,
                    frequencies,
                    total: 0,
                    agreementPercent: 0
                };
                return;
            }
            
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
        const wrapper = document.querySelector('.chart-wrapper');
        
        if (!canvas || !wrapper) return;

        wrapper.classList.remove('hidden');

        // Aplicar zoom
        canvas.style.transform = `scale(${AppState.zoom})`;

        const chartType = AppState.chartConfig.type;
        const chartModule = chartRegistry.get(chartType);

        if (!chartModule) {
            console.error(`Chart type not found: ${chartType}`);
            this.showPlaceholder();
            return;
        }

        let items = DataTransformer.getUniqueItems(AppState.longData);
        if (AppState.filteredItems.size > 0) {
            items = items.filter(item => AppState.filteredItems.has(item));
        }

        const stats = DataTransformer.calculateStatistics(AppState.longData, items);
        const sortedItems = DataTransformer.sortItems(items, stats, AppState.chartConfig.sortBy);
        const normalizedConfig = ChartOptionsAdapter.normalize(
            AppState.chartConfig,
            AppState.scaleConfig,
            chartType
        );

        try {
            if (chartType === 'distribution') {
                chartModule.render(
                    canvas,
                    AppState.longData,
                    normalizedConfig,
                    AppState.scaleConfig,
                    this.getColors.bind(this),
                    I18n.t.bind(I18n)
                );
            } else {
                chartModule.render(
                    canvas,
                    sortedItems,
                    stats,
                    normalizedConfig,
                    AppState.scaleConfig,
                    this.getColors.bind(this),
                    I18n.t.bind(I18n)
                );
            }
            
            // Actualizar estado
            this.updateStatus(true);
        } catch (error) {
            console.error(`Error rendering chart ${chartType}:`, error);
            this.showPlaceholder();
        }
    },

    showPlaceholder() {
        document.querySelector('.chart-placeholder')?.classList.remove('hidden');
        document.querySelector('.chart-wrapper')?.classList.add('hidden');
        this.updateStatus(false);
    },

    updateStatus(hasData) {
        const statusText = document.getElementById('status-text');
        const statusDot = document.querySelector('.status-dot');
        
        if (statusText) {
            statusText.textContent = hasData ? 'Datos cargados' : 'Sin datos';
        }
        
        if (statusDot) {
            statusDot.classList.toggle('active', hasData);
        }
    },

    downloadChart() {
        const canvas = document.getElementById('chart-canvas');
        if (!canvas) return;

        const format = document.getElementById('export-format')?.value || 'png';
        const scale = parseInt(document.getElementById('export-scale')?.value || '2');

        if (format === 'png') {
            // Crear canvas temporal con escala para alta resolución
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width * scale;
            tempCanvas.height = canvas.height * scale;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Fondo blanco para mejor visualización
            tempCtx.fillStyle = '#FFFFFF';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            tempCtx.scale(scale, scale);
            tempCtx.drawImage(canvas, 0, 0);

            const link = document.createElement('a');
            link.download = `likert-chart-${Date.now()}.png`;
            link.href = tempCanvas.toDataURL('image/png', 1.0);
            link.click();
        } else if (format === 'svg') {
            // Exportar como SVG
            this.exportAsSVG(canvas);
        }
    },

    exportAsSVG(canvas) {
        // Convertir canvas a SVG usando serialización del contenido
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Crear SVG con el contenido del canvas como imagen embebida
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <image width="${width}" height="${height}" xlink:href="${canvas.toDataURL('image/png', 1.0)}"/>
</svg>`;
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `likert-chart-${Date.now()}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }
};

/**
 * UI - Manejo de interfaz
 */
const UI = {
    async init() {
        this.detectModes();
        await ConfigLoader.loadConfig();
        await I18n.loadLanguage('en');
        
        Navigation.init();
        this.setupEventListeners();
        this.setupLayoutSubsections();
        this.setupReactiveControls();
        this.setupColorInputs();
        this.setupZoomControls();
        this.applyRuntimeModes();
        this.populatePresetScales();
        this.populateColorSchemes();
        this.populateChartTypes();
        this.loadGeminiApiKey();
        this.refreshStorageDatasets();
    },

    /**
     * Load saved Gemini API key from localStorage
     */
    loadGeminiApiKey() {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            AppState.geminiApiKey = savedKey;
            const input = document.getElementById('gemini-api-key');
            if (input) {
                input.value = savedKey;
            }
        }
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

        // AI Processing toggle
        document.getElementById('enable-ai-processing')?.addEventListener('change', (e) => {
            this.toggleAISettings(e.target.checked);
        });

        // Gemini API Key save
        document.getElementById('gemini-api-key')?.addEventListener('blur', (e) => {
            this.saveGeminiApiKey(e.target.value);
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

        // Quick access from app header
        document.getElementById('btn-open-export-panel')?.addEventListener('click', () => {
            Navigation.switchPanel('export');
        });

        // Reset upload button
        document.getElementById('reset-upload-btn')?.addEventListener('click', () => {
            this.resetDataUpload();
        });

        // Global storage dataset controls
        document.getElementById('refresh-storage-datasets')?.addEventListener('click', () => {
            this.refreshStorageDatasets();
        });

        document.getElementById('load-storage-dataset')?.addEventListener('click', () => {
            this.loadDatasetFromStorage();
        });

        // Filter buttons
        document.getElementById('select-all-btn')?.addEventListener('click', () => {
            this.selectAllItems(true);
        });

        document.getElementById('deselect-all-btn')?.addEventListener('click', () => {
            this.selectAllItems(false);
        });

        // Message bridge from survey-suite
        window.addEventListener('message', (event) => {
            const data = event?.data;
            if (!data || typeof data !== 'object') return;
            if (data.type === 'survey-suite-load-dataset' && data.datasetName) {
                this.loadDatasetByName(data.datasetName);
            }
            if (data.type === 'survey-suite-set-language' && (data.lang === 'en' || data.lang === 'es')) {
                I18n.loadLanguage(data.lang);
            }
        });
    },

    detectModes() {
        const params = new URLSearchParams(window.location.search);
        AppState.embedMode = params.get('embed') === '1';
        AppState.storageOnlyMode = params.get('storageOnly') === '1';
    },

    applyRuntimeModes() {
        if (!AppState.storageOnlyMode) return;

        const dataNavItem = document.querySelector('.nav-item[data-panel="data"]');
        if (dataNavItem) dataNavItem.style.display = 'none';

        const dataPanel = document.getElementById('panel-data');
        if (dataPanel) dataPanel.classList.remove('active');

        Navigation.switchPanel('chart');
        this.tryAutoLoadSharedDataset();
    },

    setupLayoutSubsections() {
        const tabs = document.querySelectorAll('.layout-tab');
        const sections = document.querySelectorAll('.layout-section');
        if (!tabs.length || !sections.length) return;

        const activateSection = (sectionId) => {
            tabs.forEach(tab => {
                const isActive = tab.dataset.layoutTab === sectionId;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });

            sections.forEach(section => {
                section.classList.toggle('active', section.id === sectionId);
            });
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                activateSection(tab.dataset.layoutTab);
            });
        });

        activateSection(tabs[0].dataset.layoutTab);
    },

    getSharedDataApi() {
        if (typeof window !== 'undefined' && window.RecuEduData) {
            return window.RecuEduData;
        }
        return null;
    },

    refreshStorageDatasets() {
        const selects = [
            document.getElementById('storage-dataset-select')
        ].filter(Boolean);
        if (!selects.length) return;

        const dataApi = this.getSharedDataApi();
        if (!dataApi || !dataApi.storage) {
            selects.forEach(select => {
                select.innerHTML = '<option value="">Storage not available</option>';
            });
            return;
        }

        try {
            const datasets = dataApi.storage.getDatasetsInfo();
            selects.forEach(select => {
                select.innerHTML = '<option value="">Select a saved dataset...</option>';
            });

            if (!Array.isArray(datasets) || datasets.length === 0) {
                selects.forEach(select => {
                    select.innerHTML = '<option value="">No saved datasets</option>';
                });
                return;
            }

            datasets.forEach(ds => {
                selects.forEach(select => {
                    const option = document.createElement('option');
                    option.value = ds.name;
                    option.textContent = `${ds.name} (${ds.rowCount || 0} rows)`;
                    select.appendChild(option);
                });
            });
        } catch (error) {
            console.error('Error al listar datasets del storage:', error);
            selects.forEach(select => {
                select.innerHTML = '<option value="">Error loading datasets</option>';
            });
        }
    },

    loadDatasetFromStorage(selectId = 'storage-dataset-select') {
        const select = document.getElementById(selectId);
        if (!select || !select.value) {
            alert('Select a saved dataset first.');
            return;
        }

        this.loadDatasetByName(select.value);
    },

    loadDatasetByName(datasetName) {
        if (!datasetName) return;

        const dataApi = this.getSharedDataApi();
        if (!dataApi || !dataApi.storage) {
            alert('Shared storage is not available yet. Open Data Processor first to initialize shared data library.');
            return;
        }

        try {
            const dataset = dataApi.storage.loadDataset(datasetName);
            if (!dataset || !Array.isArray(dataset.data) || dataset.data.length === 0) {
                alert('Selected dataset is empty or invalid.');
                return;
            }

            const autoProcess = document.getElementById('storage-auto-process')?.checked !== false;
            let rows = dataset.data.map(row => ({ ...row }));

            if (autoProcess) {
                rows = dataApi.trimValues(rows);
                const itemColumns = Object.keys(rows[0]).slice(1);
                if (itemColumns.length > 0) {
                    rows = dataApi.likertTextToNumber(rows, itemColumns);
                }
            }

            const headers = Object.keys(rows[0]);
            if (headers.length < 2) {
                alert('El dataset necesita al menos 2 columnas (ID + ítems).');
                return;
            }

            const idColumn = headers[0];
            const normalizedRows = rows.map((row, index) => ({
                ...row,
                [idColumn]: row[idColumn] !== undefined && row[idColumn] !== null && row[idColumn] !== ''
                    ? row[idColumn]
                    : `R${index + 1}`
            }));

            const parsedData = {
                headers,
                rows: normalizedRows
            };

            this.applyParsedData(parsedData, `storage: ${datasetName}`);
        } catch (error) {
            console.error('Error al cargar dataset desde storage:', error);
            alert('Could not load saved dataset: ' + error.message);
        }
    },

    tryAutoLoadSharedDataset() {
        const datasetName = localStorage.getItem('survey_suite_active_dataset');
        if (!datasetName) return;

        // Try loading once on startup in storage-only mode.
        try {
            this.loadDatasetByName(datasetName);
        } catch (error) {
            console.warn('Auto-load from survey suite failed:', error);
        }
    },

    applyParsedData(parsedData, sourceLabel = 'archivo') {
        AppState.data = parsedData;
        AppState.longData = DataParser.convertToLong(parsedData);

        const numericValues = AppState.longData
            .map(d => d.value)
            .filter(v => v !== null && !isNaN(v));
        if (numericValues.length > 0) {
            const maxValue = Math.max(...numericValues);
            if (maxValue >= 2 && maxValue <= 10 && maxValue !== AppState.scaleConfig.points) {
                AppState.scaleConfig.points = maxValue;
                AppState.scaleConfig.labels = Array.from({ length: maxValue }, (_, i) => `${i + 1}`);
                const scaleInput = document.getElementById('scale-points');
                if (scaleInput) scaleInput.value = maxValue;
                this.updateScaleLabels();
            }
        }

        const validation = DataParser.validateData(AppState.longData, AppState.scaleConfig);
        if (!validation.valid) {
            alert(I18n.t('invalid_data') + '\n' + JSON.stringify(validation.invalidValues.slice(0, 20), null, 2));
            return;
        }

        this.showDataPreview(parsedData);
        this.populateItemFilter();
        ChartRenderer.render();

        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.textContent = `Datos cargados (${sourceLabel})`;
        }
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
                    case 'legend-position':
                        AppState.chartConfig.legendPosition = value;
                        break;
                    case 'decimal-places':
                        AppState.chartConfig.decimalPlaces = parseInt(value);
                        break;
                    case 'watermark':
                        AppState.chartConfig.watermark = value;
                        break;
                    case 'background-color':
                        AppState.chartConfig.backgroundColor = value;
                        document.getElementById('background-color-text').value = value;
                        break;
                    case 'transparent-background':
                        AppState.chartConfig.transparentBackground = value;
                        break;
                    case 'show-grid':
                        AppState.chartConfig.showGrid = value;
                        break;
                    case 'grid-color':
                        AppState.chartConfig.gridColor = value;
                        document.getElementById('grid-color-text').value = value;
                        break;
                    case 'grid-line-width':
                        AppState.chartConfig.gridLineWidth = parseInt(value);
                        break;
                    case 'grid-dashed':
                        AppState.chartConfig.gridDashed = value;
                        break;
                    case 'grid-vertical':
                        AppState.chartConfig.gridVertical = value;
                        break;
                    case 'grid-horizontal':
                        AppState.chartConfig.gridHorizontal = value;
                        break;
                    case 'show-bar-borders':
                        AppState.chartConfig.showBarBorders = value;
                        break;
                    case 'bar-border-color':
                        AppState.chartConfig.barBorderColor = value;
                        break;
                    case 'bar-border-width':
                        AppState.chartConfig.barBorderWidth = parseInt(value);
                        break;
                    case 'label-max-lines':
                        AppState.chartConfig.labelMaxLines = parseInt(value);
                        break;
                    // Nuevos controles de márgenes
                    case 'margin-top':
                        AppState.chartConfig.marginTop = parseInt(value);
                        break;
                    case 'margin-bottom':
                        AppState.chartConfig.marginBottom = parseInt(value);
                        break;
                    case 'margin-left':
                        AppState.chartConfig.marginLeft = parseInt(value);
                        break;
                    case 'margin-right':
                        AppState.chartConfig.marginRight = parseInt(value);
                        break;
                    case 'chart-width':
                        AppState.chartConfig.chartWidth = parseInt(value);
                        break;
                    // Nuevos controles de títulos y ejes
                    case 'chart-title':
                        AppState.chartConfig.chartTitle = value;
                        break;
                    case 'font-size-title':
                        AppState.chartConfig.fontSizeTitle = parseInt(value);
                        break;
                    case 'show-title':
                        AppState.chartConfig.showTitle = value;
                        break;
                    case 'show-grid-border':
                        AppState.chartConfig.showGridBorder = value;
                        break;
                    case 'show-axis-labels':
                        AppState.chartConfig.showAxisLabels = value;
                        break;
                    case 'axis-color':
                        AppState.chartConfig.axisColor = value;
                        document.getElementById('axis-color-text').value = value;
                        break;
                    case 'axis-width':
                        AppState.chartConfig.axisWidth = parseInt(value);
                        break;
                }

                ChartRenderer.render();
            };

            control.addEventListener('change', updateChart);
            control.addEventListener('input', updateChart);
        });
    },

    setupColorInputs() {
        // Sincronizar color pickers con inputs de texto
        const bgColor = document.getElementById('background-color');
        const bgColorText = document.getElementById('background-color-text');
        const gridColor = document.getElementById('grid-color');
        const gridColorText = document.getElementById('grid-color-text');
        const axisColor = document.getElementById('axis-color');
        const axisColorText = document.getElementById('axis-color-text');
        
        // Inicializar valores desde AppState
        if (bgColor && bgColorText) {
            bgColor.value = AppState.chartConfig.backgroundColor;
            bgColorText.value = AppState.chartConfig.backgroundColor;
        }
        
        if (gridColor && gridColorText) {
            gridColor.value = AppState.chartConfig.gridColor;
            gridColorText.value = AppState.chartConfig.gridColor;
        }

        if (bgColorText) {
            bgColorText.addEventListener('change', (e) => {
                const color = e.target.value;
                if (bgColor) bgColor.value = color;
                AppState.chartConfig.backgroundColor = color;
                ChartRenderer.render();
            });
        }

        if (axisColor && axisColorText) {
            axisColor.value = AppState.chartConfig.axisColor;
            axisColorText.value = AppState.chartConfig.axisColor;
        }

        if (gridColorText) {
            gridColorText.addEventListener('change', (e) => {
                const color = e.target.value;
                if (gridColor) gridColor.value = color;
                AppState.chartConfig.gridColor = color;
                ChartRenderer.render();
            });
        }

        if (axisColorText) {
            axisColorText.addEventListener('change', (e) => {
                const color = e.target.value;
                if (axisColor) axisColor.value = color;
                AppState.chartConfig.axisColor = color;
                ChartRenderer.render();
            });
        }
    },

    setupZoomControls() {
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
            AppState.zoom = Math.min(AppState.zoom + 0.1, 3);
            ChartRenderer.render();
        });

        document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
            AppState.zoom = Math.max(AppState.zoom - 0.1, 0.5);
            ChartRenderer.render();
        });

        document.getElementById('reset-zoom-btn')?.addEventListener('click', () => {
            AppState.zoom = 1;
            ChartRenderer.render();
        });

        document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer) {
                if (!document.fullscreenElement) {
                    chartContainer.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
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

        // Establecer valor por defecto
        select.value = AppState.chartConfig.type || 'stacked';
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
            div.className = 'option-group';
            div.innerHTML = `
                <label class="option-label">${index + 1}:</label>
                <input type="text" value="${label}" data-scale-label="${index}" class="text-input scale-label-input">
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

        // Check if AI processing is enabled
        const aiEnabled = document.getElementById('enable-ai-processing')?.checked;
        if (aiEnabled) {
            await this.processFileWithAI(file);
            return;
        }

        // Traditional manual upload
        try {
            // Convert Excel to CSV if needed
            let csvText;
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                csvText = await this.convertExcelToCSV(file);
            } else {
                csvText = await file.text();
            }
            
            const parsedData = DataParser.parseCSV(csvText);
            this.applyParsedData(parsedData, 'archivo');
        } catch (error) {
            alert(I18n.t('error_loading_csv') + ': ' + error.message);
        }
    },

    /**
     * Toggle AI settings visibility
     */
    toggleAISettings(enabled) {
        const aiSettings = document.getElementById('ai-settings');
        if (aiSettings) {
            aiSettings.classList.toggle('active', enabled);
        }
    },

    /**
     * Save Gemini API key to app state
     */
    saveGeminiApiKey(apiKey) {
        AppState.geminiApiKey = apiKey.trim();
        localStorage.setItem('gemini_api_key', apiKey.trim());
        
        const statusDiv = document.getElementById('ai-status');
        if (statusDiv && apiKey.trim()) {
            statusDiv.className = 'ai-status success';
            statusDiv.textContent = '✓ API Key guardada';
            setTimeout(() => {
                statusDiv.className = 'ai-status';
                statusDiv.textContent = '';
            }, 3000);
        }
    },

    /**
     * Convert Excel file to CSV
     */
    async convertExcelToCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    console.log(`📂 Convirtiendo Excel "${file.name}" a CSV...`);
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Get range info
                    const range = XLSX.utils.decode_range(worksheet['!ref']);
                    const rowCount = range.e.r - range.s.r + 1;
                    const colCount = range.e.c - range.s.c + 1;
                    
                    console.log(`   Hoja: "${firstSheetName}"`);
                    console.log(`   Rango: ${worksheet['!ref']} (${rowCount} filas × ${colCount} columnas)`);
                    console.log(`   Filas de datos: ${rowCount - 1} (excluyendo encabezado)`);
                    
                    // Convert to CSV
                    const csv = XLSX.utils.sheet_to_csv(worksheet);
                    const csvLines = csv.trim().split('\n');
                    console.log(`✅ CSV generado: ${csvLines.length} líneas totales`);
                    
                    // Show first few lines
                    console.log('Primeras 3 líneas del CSV:');
                    console.log(csvLines.slice(0, 3).join('\n'));
                    
                    resolve(csv);
                } catch (error) {
                    console.error('❌ Error al convertir Excel:', error);
                    reject(new Error('Error al convertir Excel a CSV: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                console.error('❌ Error al leer el archivo Excel');
                reject(new Error('Error al leer el archivo Excel'));
            };
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Reset data upload and clear all state
     */
    resetDataUpload() {
        // Clear file input
        const fileInput = document.getElementById('csv-file');
        if (fileInput) {
            fileInput.value = '';
        }

        // Clear app state
        AppState.data = null;
        AppState.longData = null;
        AppState.filteredItems.clear();

        // Clear preview
        const preview = document.getElementById('data-preview');
        if (preview) {
            preview.innerHTML = '<p class="text-muted">No hay datos cargados</p>';
        }

        // Clear filter container
        const filterContainer = document.getElementById('item-filter-container');
        if (filterContainer) {
            filterContainer.innerHTML = '';
        }

        // Clear AI status
        const statusDiv = document.getElementById('ai-status');
        if (statusDiv) {
            statusDiv.className = 'ai-status';
            statusDiv.textContent = '';
        }

        // Clear chart
        const canvas = document.getElementById('chart-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Show placeholder
        document.querySelector('.chart-placeholder')?.classList.remove('hidden');
        document.querySelector('.chart-wrapper')?.classList.add('hidden');

        // Update status
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.textContent = 'Sin datos';
        }

        console.log('✅ Carga de datos reiniciada');
    },

    /**
     * Process file with Gemini AI
     */
    async processFileWithAI(file) {
        const apiKey = document.getElementById('gemini-api-key')?.value.trim();
        const sourceType = document.getElementById('data-source-type')?.value || 'other';
        const model = document.getElementById('gemini-model')?.value || 'gemini-2.0-flash';
        const statusDiv = document.getElementById('ai-status');

        if (!apiKey) {
            if (statusDiv) {
                statusDiv.className = 'ai-status error';
                statusDiv.textContent = I18n.t('ai_invalid_key');
            }
            return;
        }

        try {
            // Show processing status
            if (statusDiv) {
                statusDiv.className = 'ai-status info';
                statusDiv.innerHTML = `<div class="spinner"></div> ${I18n.t('processing_file')}`;
            }

            // Read file - convert Excel to CSV if needed
            let csvContent;
            console.log(`📝 Procesando archivo: ${file.name}`);
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                csvContent = await this.convertExcelToCSV(file);
            } else {
                csvContent = await file.text();
                const csvLines = csvContent.trim().split('\n');
                console.log(`📝 Archivo CSV: ${csvLines.length} líneas totales`);
            }

            // Process with Gemini
            console.log(`🤖 Enviando a Gemini AI (modelo: ${model})...`);
            const processor = new GeminiProcessor(apiKey, model);
            const result = await processor.processFile(csvContent, sourceType);

            // Hide processing status
            if (statusDiv) {
                statusDiv.className = 'ai-status';
                statusDiv.textContent = '';
            }

            // Show confirmation UI
            const confirmUI = new GeminiConfirmationUI(
                result,
                (confirmedResult) => this.applyGeminiSuggestions(confirmedResult),
                () => {
                    // User cancelled
                    if (statusDiv) {
                        statusDiv.className = 'ai-status info';
                        statusDiv.textContent = 'Procesamiento cancelado';
                        setTimeout(() => {
                            statusDiv.className = 'ai-status';
                            statusDiv.textContent = '';
                        }, 3000);
                    }
                }
            );
            confirmUI.show();

        } catch (error) {
            console.error('Error processing with AI:', error);
            
            // Clear file input to allow retry
            const fileInput = document.getElementById('csv-file');
            if (fileInput) {
                fileInput.value = '';
            }
            
            if (statusDiv) {
                statusDiv.className = 'ai-status error';
                
                // Check if it's a quota error
                if (error.message && error.message.includes('quota')) {
                    statusDiv.innerHTML = `
                        <strong>⚠️ Cuota de API excedida</strong><br>
                        El modelo <code>${model}</code> ha alcanzado su límite.<br>
                        <strong>Soluciones:</strong><br>
                        • Espera unos minutos e intenta de nuevo<br>
                        • Prueba con otro modelo (Gemini 3 Flash/Pro)<br>
                        • Usa el modo de carga manual<br>
                        • Revisa tu cuota en: <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>
                    `;
                } else {
                    statusDiv.innerHTML = `
                        <strong>❌ ${I18n.t('ai_error')}</strong><br>
                        ${error.message}<br>
                        <small>Haz clic en "🔄 Reiniciar" para intentar de nuevo</small>
                    `;
                }
            }
        }
    },

    /**
     * Apply Gemini suggestions to the app
     */
    async applyGeminiSuggestions(result) {
        const statusDiv = document.getElementById('ai-status');

        try {
            // Get edited labels and column names from confirmation UI
            const modal = document.querySelector('.gemini-modal');
            let scaleLabels = result.suggestions.scaleLabels;
            let columnNames = result.analysis.likertColumns || [];
            
            if (modal) {
                const labelInputs = modal.querySelectorAll('.scale-label-input');
                scaleLabels = Array.from(labelInputs).map(input => input.value.trim());
                
                const columnInputs = modal.querySelectorAll('.column-name-input');
                if (columnInputs.length > 0) {
                    columnNames = Array.from(columnInputs).map(input => input.value.trim());
                }
            }

            // Apply column name changes to the CSV
            let cleanedCSV = result.cleanedCSV;
            if (columnNames.length > 0) {
                const lines = cleanedCSV.split('\n');
                const originalHeaders = lines[0].split(',');
                const firstCol = originalHeaders[0]; // Keep first column (ID)
                const newHeaders = [firstCol, ...columnNames];
                lines[0] = newHeaders.join(',');
                cleanedCSV = lines.join('\n');
            }
            
            console.log('📊 Aplicando datos procesados por IA...');
            console.log('Nombres de columnas:', columnNames);

            // Parse the cleaned CSV
            console.log('📋 CSV limpio a procesar:');
            console.log(cleanedCSV.split('\n').slice(0, 3).join('\n') + '\n...');
            
            const parsedData = DataParser.parseCSV(cleanedCSV);
            console.log(`✅ Datos parseados: ${parsedData.rows.length} filas, ${parsedData.headers.length} columnas`);

            // Apply detected scale
            const scalePoints = result.analysis.scaleDetected.points;
            AppState.scaleConfig = {
                type: 'custom',
                points: scalePoints,
                labels: scaleLabels
            };

            // Update UI controls
            document.getElementById('scale-points').value = scalePoints;
            document.getElementById('preset-scale').value = '';
            
            // Update scale labels in UI
            this.updateScaleLabels();

            // Aplicar datos después de configurar la escala detectada
            this.applyParsedData(parsedData, 'gemini');

            // Validate data
            const validation = DataParser.validateData(AppState.longData, AppState.scaleConfig);
            if (!validation.valid) {
                const errorMsg = `❌ DATOS INVÁLIDOS DETECTADOS\n\n` +
                    `Total de registros: ${validation.summary.total}\n` +
                    `Valores vacíos/no contestados: ${validation.summary.nullValues} (aceptables)\n` +
                    `Valores fuera de rango (1-${scalePoints}): ${validation.summary.outOfRange} ⚠️\n\n` +
                    `PROBLEMA:\n` +
                    `Hay ${validation.summary.outOfRange} respuestas con valores fuera del rango 1-${scalePoints}\n\n` +
                    `SOLUCIONES:\n` +
                    `1. Revisa la consola (F12) para ver exactamente qué filas tienen problemas\n` +
                    `2. Verifica que todas las respuestas estén entre 1 y ${scalePoints}\n` +
                    `3. Corrige los valores en el archivo Excel original\n` +
                    `4. Intenta cargar el archivo de nuevo\n\n` +
                    `Primeros valores inválidos:\n` +
                    JSON.stringify(validation.invalidValues.slice(0, 3), null, 2);
                
                if (statusDiv) {
                    statusDiv.className = 'ai-status error';
                    statusDiv.innerHTML = `<strong>❌ Error de validación</strong><br>` +
                        `${validation.summary.outOfRange} valores fuera de rango (1-${scalePoints}).<br>` +
                        `<small>Abre la consola (F12) para ver detalles exactos</small>`;
                }
                
                alert(errorMsg);
                console.error('Detalles completos de validación:', validation);
                return;
            }

            // Show success message
            if (statusDiv) {
                statusDiv.className = 'ai-status success';
                statusDiv.textContent = I18n.t('ai_applied_success');
                setTimeout(() => {
                    statusDiv.className = 'ai-status';
                    statusDiv.textContent = '';
                }, 5000);
            }

        } catch (error) {
            console.error('Error applying AI suggestions:', error);
            if (statusDiv) {
                statusDiv.className = 'ai-status error';
                statusDiv.textContent = I18n.t('ai_error') + ': ' + error.message;
            }
        }
    },

    showDataPreview(data) {
        const container = document.getElementById('data-preview');
        if (!container) return;

        const preview = data.rows.slice(0, 5);
        let html = '<table><thead><tr>';
        
        data.headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        preview.forEach(row => {
            html += '<tr>';
            data.headers.forEach(header => {
                html += `<td>${row[header]}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        
        if (data.rows.length > 5) {
            html += `<p class="text-muted" style="margin-top: 0.5rem;">... y ${data.rows.length - 5} filas más</p>`;
        }
        
        container.innerHTML = html;
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
    },

    selectAllItems(checked) {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                AppState.filteredItems.add(checkbox.value);
            } else {
                AppState.filteredItems.delete(checkbox.value);
            }
        });
        ChartRenderer.render();
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
