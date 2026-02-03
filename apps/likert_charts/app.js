// ========================================
// LIKERT CHART VISUALIZER - Dashboard Edition
// Reactive, modular Likert-scale visualization tool
// ========================================

/**
 * Global Application State
 * Centralized state management with reactive updates
 */
const AppState = {
    data: null,              // Parsed CSV data (wide format)
    longData: null,          // Converted long format data
    currentLanguage: 'en',   // Current UI language
    translations: {},        // Loaded translations
    config: null,            // Loaded configuration from config.json
    scaleConfig: {
        type: 'custom',      // Current scale type
        points: 5,           // Number of points
        labels: []           // Scale labels
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
    filteredItems: new Set() // Items selected for display
};

// ========================================
// CONFIGURATION LOADER
// Loads external config.json
// ========================================

const ConfigLoader = {
    /**
     * Load configuration from config.json
     */
    async loadConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) throw new Error('Failed to load config.json');
            AppState.config = await response.json();
            
            // Apply default settings
            Object.assign(AppState.chartConfig, AppState.config.defaultSettings);
            
            return AppState.config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            // Provide fallback config
            AppState.config = {
                presetScales: {},
                colorSchemes: {},
                defaultSettings: AppState.chartConfig
            };
        }
    }
};

// ========================================
// INTERNATIONALIZATION MODULE
// Handles multi-language support
// ========================================

const I18n = {
    /**
     * Load translations for a specific language
     */
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

    /**
     * Get translated text for a key
     */
    t(key) {
        return AppState.translations[key] || key;
    },

    /**
     * Update all UI elements with current language
     */
    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.tagName === 'OPTION') {
                // Don't translate option values, only data-i18n labeled options
                if (key) element.textContent = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Reload preset scales and color schemes with new language
        if (AppState.config) {
            UI.populatePresetScales();
            UI.populateColorSchemes();
        }
        
        // Update scale labels if they exist
        if (AppState.scaleConfig.labels.length > 0) {
            UI.updateScaleLabels();
        }
    }
};

// ========================================
// DATA PARSER MODULE
// Handles CSV parsing and validation
// ========================================

const DataParser = {
    /**
     * Parse CSV file content
     * @param {string} csvText - Raw CSV text
     * @returns {Object} Parsed data with headers and rows
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error(I18n.t('invalid_csv'));
        }

        // Parse headers
        const headers = this.parseCSVLine(lines[0]);
        
        // Parse data rows
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

    /**
     * Parse a single CSV line, handling quoted values
     * @param {string} line - CSV line
     * @returns {Array} Parsed values
     */
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

    /**
     * Convert wide format to long format
     * @param {Object} wideData - Wide format data
     * @returns {Array} Long format data
     */
    convertToLong(wideData) {
        const longData = [];
        const headers = wideData.headers;
        const idColumn = headers[0]; // First column is assumed to be respondent ID

        wideData.rows.forEach(row => {
            const respondentId = row[idColumn];
            
            // Skip the ID column and process item columns
            for (let i = 1; i < headers.length; i++) {
                const itemName = headers[i];
                const value = row[itemName];
                
                // Convert to integer
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

    /**
     * Validate data against scale configuration
     * @param {Array} longData - Long format data
     * @param {Object} scaleConfig - Scale configuration
     * @returns {Object} Validation result
     */
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

// ========================================
// DATA TRANSFORMER MODULE
// Processes data for visualization
// ========================================

const DataTransformer = {
    /**
     * Calculate item statistics
     * @param {Array} longData - Long format data
     * @param {Array} items - List of unique items
     * @returns {Object} Statistics by item
     */
    calculateStatistics(longData, items) {
        const stats = {};

        items.forEach(item => {
            const itemData = longData.filter(d => d.item === item).map(d => d.value);
            
            // Calculate mean
            const mean = itemData.reduce((sum, val) => sum + val, 0) / itemData.length;
            
            // Calculate median
            const sorted = [...itemData].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 === 0 
                ? (sorted[mid - 1] + sorted[mid]) / 2 
                : sorted[mid];
            
            // Calculate frequency distribution
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

            // Calculate agreement percentage (values above midpoint)
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

    /**
     * Sort items based on selected criterion
     * @param {Array} items - List of items
     * @param {Object} stats - Item statistics
     * @param {string} sortBy - Sorting criterion
     * @returns {Array} Sorted items
     */
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
                // Keep original order
                break;
        }

        return sorted;
    },

    /**
     * Get unique items from long data
     * @param {Array} longData - Long format data
     * @returns {Array} Unique item names
     */
    getUniqueItems(longData) {
        const items = [...new Set(longData.map(d => d.item))];
        return items;
    }
};

// ========================================
// CHART RENDERER MODULE
// Handles all chart rendering logic
// ========================================

const ChartRenderer = {
    /**
     * Get colors for current scale from config
     */
    getColors() {
        const schemeName = AppState.chartConfig.colorScheme;
        const scheme = AppState.config?.colorSchemes[schemeName];
        
        if (!scheme) {
            // Fallback colors
            return ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8'];
        }
        
        const colors = scheme.colors;
        const points = AppState.scaleConfig.points;
        
        // Interpolate colors if needed
        if (colors.length >= points) {
            return colors.slice(0, points);
        } else {
            return this.interpolateColors(colors, points);
        }
    },

    /**
     * Interpolate colors to match required number of points
     */
    interpolateColors(colors, count) {
        const result = [];
        const step = (colors.length - 1) / (count - 1);
        
        for (let i = 0; i < count; i++) {
            const index = Math.round(i * step);
            result.push(colors[Math.min(index, colors.length - 1)]);
        }
        
        return result;
    },

    /**
     * Render stacked bar chart
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Array} items - Sorted items
     * @param {Object} stats - Item statistics
     */
    renderStackedChart(canvas, items, stats) {
        const ctx = canvas.getContext('2d');
        const config = AppState.chartConfig;
        const scaleConfig = AppState.scaleConfig;
        
        // Calculate dimensions
        const margin = { top: 40, right: 200, bottom: 60, left: 200 };
        const barHeight = config.barHeight;
        const barSpacing = config.barSpacing;
        const chartHeight = items.length * (barHeight + barSpacing) + margin.top + margin.bottom;
        const chartWidth = 1000;
        
        // Set canvas size
        canvas.width = chartWidth;
        canvas.height = chartHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);
        
        // Set font for labels
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        const colors = this.getColors();
        const barWidth = chartWidth - margin.left - margin.right;
        
        // Draw title
        ctx.font = `bold ${config.fontSizeLabels + 4}px ${config.fontFamily}`;
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(I18n.t('chart_stacked'), chartWidth / 2, margin.top / 2);
        
        // Reset font for chart
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        // Draw bars for each item
        items.forEach((item, index) => {
            const y = margin.top + index * (barHeight + barSpacing);
            const stat = stats[item];
            
            // Draw item label
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'right';
            ctx.fillText(item, margin.left - 10, y + barHeight / 2);
            
            // Draw stacked bars
            let xOffset = margin.left;
            
            for (let value = 1; value <= scaleConfig.points; value++) {
                const count = stat.frequencies[value] || 0;
                const percentage = (count / stat.total) * 100;
                const width = (percentage / 100) * barWidth;
                
                if (width > 0) {
                    // Draw bar segment
                    ctx.fillStyle = colors[value - 1];
                    ctx.fillRect(xOffset, y, width, barHeight);
                    
                    // Draw value label if enabled and width is sufficient
                    if (config.showValues && width > 30) {
                        ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayValue = config.valueType === 'percentage' 
                            ? percentage.toFixed(config.decimalPlaces) + '%'
                            : count;
                        ctx.fillText(displayValue, xOffset + width / 2, y + barHeight / 2);
                        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
                    }
                    
                    xOffset += width;
                }
            }
            
            // Draw border
            ctx.strokeStyle = '#cbd5e1';
            ctx.strokeRect(margin.left, y, barWidth, barHeight);
        });
        
        // Draw legend if enabled
        if (config.showLegend) {
            this.drawLegend(ctx, colors, chartWidth - margin.right + 20, margin.top);
        }
        
        // Draw watermark if specified
        if (config.watermark) {
            ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(config.watermark, chartWidth / 2, chartHeight - 20);
        }
    },

    /**
     * Render diverging bar chart
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Array} items - Sorted items
     * @param {Object} stats - Item statistics
     */
    renderDivergingChart(canvas, items, stats) {
        const ctx = canvas.getContext('2d');
        const config = AppState.chartConfig;
        const scaleConfig = AppState.scaleConfig;
        
        // Calculate dimensions
        const margin = { top: 40, right: 200, bottom: 60, left: 200 };
        const barHeight = config.barHeight;
        const barSpacing = config.barSpacing;
        const chartHeight = items.length * (barHeight + barSpacing) + margin.top + margin.bottom;
        const chartWidth = 1000;
        
        // Set canvas size
        canvas.width = chartWidth;
        canvas.height = chartHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);
        
        // Set font for labels
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        const colors = this.getColors();
        const barWidth = chartWidth - margin.left - margin.right;
        const centerX = margin.left + barWidth / 2;
        
        // Determine midpoint (neutral position)
        const midpoint = Math.ceil(scaleConfig.points / 2);
        const hasNeutral = scaleConfig.points % 2 === 1;
        
        // Draw title
        ctx.font = `bold ${config.fontSizeLabels + 4}px ${config.fontFamily}`;
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(I18n.t('chart_diverging'), chartWidth / 2, margin.top / 2);
        
        // Reset font for labels
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        // Draw center line
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, margin.top);
        ctx.lineTo(centerX, chartHeight - margin.bottom);
        ctx.stroke();
        
        // Draw bars for each item
        items.forEach((item, index) => {
            const y = margin.top + index * (barHeight + barSpacing);
            const stat = stats[item];
            
            // Draw item label
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'right';
            ctx.fillText(item, margin.left - 10, y + barHeight / 2);
            
            // Calculate percentages
            const percentages = {};
            for (let value = 1; value <= scaleConfig.points; value++) {
                const count = stat.frequencies[value] || 0;
                percentages[value] = (count / stat.total) * 100;
            }
            
            // Draw negative side (left of center)
            let leftOffset = 0;
            for (let value = 1; value < midpoint; value++) {
                const percentage = percentages[value] || 0;
                const width = (percentage / 100) * (barWidth / 2);
                
                if (width > 0) {
                    ctx.fillStyle = colors[value - 1];
                    ctx.fillRect(centerX - leftOffset - width, y, width, barHeight);
                    
                    if (config.showValues && width > 30) {
                        ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayValue = config.valueType === 'percentage'
                            ? percentage.toFixed(config.decimalPlaces) + '%'
                            : stat.frequencies[value];
                        ctx.fillText(displayValue, centerX - leftOffset - width / 2, y + barHeight / 2);
                        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
                    }
                    
                    leftOffset += width;
                }
            }
            
            // Draw neutral (center) if exists
            if (hasNeutral) {
                const neutralPercentage = percentages[midpoint] || 0;
                const neutralWidth = (neutralPercentage / 100) * (barWidth / 2);
                
                if (neutralWidth > 0) {
                    ctx.fillStyle = colors[midpoint - 1];
                    ctx.fillRect(centerX - neutralWidth / 2, y, neutralWidth, barHeight);
                    
                    if (config.showValues && neutralWidth > 30) {
                        ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayValue = config.valueType === 'percentage'
                            ? neutralPercentage.toFixed(config.decimalPlaces) + '%'
                            : stat.frequencies[midpoint];
                        ctx.fillText(displayValue, centerX, y + barHeight / 2);
                        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
                    }
                }
            }
            
            // Draw positive side (right of center)
            let rightOffset = hasNeutral ? (percentages[midpoint] / 100) * (barWidth / 2) / 2 : 0;
            for (let value = midpoint + (hasNeutral ? 1 : 0); value <= scaleConfig.points; value++) {
                const percentage = percentages[value] || 0;
                const width = (percentage / 100) * (barWidth / 2);
                
                if (width > 0) {
                    ctx.fillStyle = colors[value - 1];
                    ctx.fillRect(centerX + rightOffset, y, width, barHeight);
                    
                    if (config.showValues && width > 30) {
                        ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayValue = config.valueType === 'percentage'
                            ? percentage.toFixed(config.decimalPlaces) + '%'
                            : stat.frequencies[value];
                        ctx.fillText(displayValue, centerX + rightOffset + width / 2, y + barHeight / 2);
                        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
                    }
                    
                    rightOffset += width;
                }
            }
        });
        
        // Draw legend if enabled
        if (config.showLegend) {
            this.drawLegend(ctx, colors, chartWidth - margin.right + 20, margin.top);
        }
        
        // Draw watermark
        if (config.watermark) {
            ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(config.watermark, chartWidth / 2, chartHeight - 20);
        }
    },

    /**
     * Render overall distribution chart
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Array} longData - Long format data
     */
    renderDistributionChart(canvas, longData) {
        const ctx = canvas.getContext('2d');
        const config = AppState.chartConfig;
        const scaleConfig = AppState.scaleConfig;
        
        // Calculate overall frequencies
        const frequencies = {};
        for (let i = 1; i <= scaleConfig.points; i++) {
            frequencies[i] = 0;
        }
        longData.forEach(record => {
            if (frequencies[record.value] !== undefined) {
                frequencies[record.value]++;
            }
        });
        
        const total = longData.length;
        
        // Calculate dimensions
        const margin = { top: 60, right: 100, bottom: 100, left: 80 };
        const chartWidth = 800;
        const chartHeight = 500;
        
        canvas.width = chartWidth;
        canvas.height = chartHeight;
        
        ctx.clearRect(0, 0, chartWidth, chartHeight);
        
        // Set font for labels
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        const colors = this.getColors();
        const barWidth = (chartWidth - margin.left - margin.right) / scaleConfig.points;
        const maxPercentage = Math.max(...Object.values(frequencies).map(f => (f / total) * 100));
        const chartAreaHeight = chartHeight - margin.top - margin.bottom;
        
        // Draw title
        ctx.font = `bold ${config.fontSizeLabels + 4}px ${config.fontFamily}`;
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(I18n.t('chart_distribution'), chartWidth / 2, margin.top / 2);
        
        // Reset font for labels
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        // Draw bars
        for (let value = 1; value <= scaleConfig.points; value++) {
            const count = frequencies[value];
            const percentage = (count / total) * 100;
            const barHeight = (percentage / maxPercentage) * chartAreaHeight;
            const x = margin.left + (value - 1) * barWidth;
            const y = chartHeight - margin.bottom - barHeight;
            
            // Draw bar
            ctx.fillStyle = colors[value - 1];
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);
            
            // Draw border
            ctx.strokeStyle = '#cbd5e1';
            ctx.strokeRect(x, y, barWidth * 0.8, barHeight);
            
            // Draw value label if enabled
            if (config.showValues) {
                ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'center';
                const displayValue = config.valueType === 'percentage'
                    ? percentage.toFixed(config.decimalPlaces) + '%'
                    : count;
                ctx.fillText(displayValue, x + barWidth * 0.4, y - 10);
                ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
            }
            
            // Draw x-axis label
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'center';
            const label = scaleConfig.labels[value - 1] || `${value}`;
            
            // Wrap long labels
            const maxLabelWidth = barWidth * 0.8;
            const words = label.split(' ');
            let line = '';
            let lineY = chartHeight - margin.bottom + 20;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxLabelWidth && line !== '') {
                    ctx.fillText(line, x + barWidth * 0.4, lineY);
                    line = word + ' ';
                    lineY += config.fontSizeLabels + 2;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, x + barWidth * 0.4, lineY);
        }
        
        // Draw y-axis
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, chartHeight - margin.bottom);
        ctx.lineTo(chartWidth - margin.right, chartHeight - margin.bottom);
        ctx.stroke();
        
        // Draw y-axis label
        ctx.save();
        ctx.translate(20, chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#475569';
        ctx.fillText(config.valueType === 'percentage' ? I18n.t('percentage') : I18n.t('count'), 0, 0);
        ctx.restore();
        
        // Draw watermark
        if (config.watermark) {
            ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(config.watermark, chartWidth / 2, chartHeight - 10);
        }
    },

    /**
     * Draw legend
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} colors - Color array
     * @param {number} x - Legend x position
     * @param {number} y - Legend y position
     */
    drawLegend(ctx, colors, x, y) {
        const scaleConfig = AppState.scaleConfig;
        const config = AppState.chartConfig;
        const boxSize = 15;
        const spacing = 5;
        
        ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
        
        for (let i = 0; i < scaleConfig.points; i++) {
            const yPos = y + i * (boxSize + spacing);
            
            // Draw color box
            ctx.fillStyle = colors[i];
            ctx.fillRect(x, yPos, boxSize, boxSize);
            ctx.strokeStyle = '#cbd5e1';
            ctx.strokeRect(x, yPos, boxSize, boxSize);
            
            // Draw label
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'left';
            const label = scaleConfig.labels[i] || `${i + 1}`;
            ctx.fillText(label, x + boxSize + 5, yPos + boxSize / 2);
        }
    },

    /**
     * Main render function - delegates to specific chart type
     * Reactive version - called automatically on any change
     */
    render() {
        if (!AppState.longData || AppState.longData.length === 0) {
            this.showPlaceholder();
            return;
        }

        // Hide placeholder, show canvas
        document.querySelector('.chart-placeholder')?.classList.add('hidden');
        const canvas = document.getElementById('chart-canvas');
        canvas.classList.add('active');

        const allItems = DataTransformer.getUniqueItems(AppState.longData);
        
        // Filter items based on selection
        let items = allItems;
        if (AppState.filteredItems.size > 0) {
            items = allItems.filter(item => AppState.filteredItems.has(item));
        }
        
        if (items.length === 0) {
            this.showPlaceholder();
            return;
        }

        const stats = DataTransformer.calculateStatistics(AppState.longData, items);
        const sortedItems = DataTransformer.sortItems(items, stats, AppState.chartConfig.sortBy);

        switch (AppState.chartConfig.type) {
            case 'stacked':
                this.renderStackedChart(canvas, sortedItems, stats);
                break;
            case 'diverging':
                this.renderDivergingChart(canvas, sortedItems, stats);
                break;
            case 'distribution':
                this.renderDistributionChart(canvas, AppState.longData);
                break;
        }
    },
    
    /**
     * Show placeholder when no data available
     */
    showPlaceholder() {
        const placeholder = document.querySelector('.chart-placeholder');
        const canvas = document.getElementById('chart-canvas');
        
        if (placeholder) placeholder.classList.remove('hidden');
        canvas.classList.remove('active');
    }
};

// ========================================
// UI CONTROLLER MODULE
// Manages dashboard interactions with reactive updates
// ========================================

const UI = {
    /**
     * Initialize UI event listeners
     */
    init() {
        // Language switcher
        document.getElementById('language-select').addEventListener('change', (e) => {
            I18n.loadLanguage(e.target.value);
        });

        // File upload
        document.getElementById('file-input').addEventListener('change', this.handleFileUpload);
        
        // Download template
        document.getElementById('download-template').addEventListener('click', this.downloadTemplate);
        
        // Preset scale selection
        document.getElementById('preset-scale').addEventListener('change', this.handlePresetScaleChange);
        
        // Custom points input
        document.getElementById('custom-points').addEventListener('input', this.handleCustomPointsChange);
        
        // Setup reactive controls - any change triggers chart update
        this.setupReactiveControls();
        
        // Setup collapsible panels
        this.setupCollapsiblePanels();
        
        // Export buttons
        document.getElementById('btn-export-png').addEventListener('click', () => this.exportChart('png'));
        document.getElementById('btn-export-svg').addEventListener('click', () => this.exportChart('svg'));
        
        // Error modal
        document.getElementById('btn-close-error').addEventListener('click', this.hideError);
    },

    /**
     * Setup reactive controls that auto-update chart
     */
    setupReactiveControls() {
        // Chart type
        document.getElementById('chart-type').addEventListener('change', (e) => {
            AppState.chartConfig.type = e.target.value;
            ChartRenderer.render();
        });
        
        // Value type (percentage/count)
        document.querySelectorAll('input[name="value-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                AppState.chartConfig.valueType = e.target.value;
                ChartRenderer.render();
            });
        });
        
        // Sort by
        document.getElementById('sort-by').addEventListener('change', (e) => {
            AppState.chartConfig.sortBy = e.target.value;
            ChartRenderer.render();
        });
        
        // Color scheme
        document.getElementById('color-scheme').addEventListener('change', (e) => {
            AppState.chartConfig.colorScheme = e.target.value;
            ChartRenderer.render();
        });
        
        // Font family
        document.getElementById('font-family').addEventListener('change', (e) => {
            AppState.chartConfig.fontFamily = e.target.value;
            ChartRenderer.render();
        });
        
        // Font sizes
        document.getElementById('font-size-labels').addEventListener('input', (e) => {
            AppState.chartConfig.fontSizeLabels = parseInt(e.target.value, 10);
            ChartRenderer.render();
        });
        
        document.getElementById('font-size-values').addEventListener('input', (e) => {
            AppState.chartConfig.fontSizeValues = parseInt(e.target.value, 10);
            ChartRenderer.render();
        });
        
        document.getElementById('font-size-legend').addEventListener('input', (e) => {
            AppState.chartConfig.fontSizeLegend = parseInt(e.target.value, 10);
            ChartRenderer.render();
        });
        
        // Bar height
        document.getElementById('bar-height').addEventListener('input', (e) => {
            AppState.chartConfig.barHeight = parseInt(e.target.value, 10);
            ChartRenderer.render();
        });
        
        // Bar spacing
        document.getElementById('bar-spacing').addEventListener('input', (e) => {
            AppState.chartConfig.barSpacing = parseInt(e.target.value, 10);
            ChartRenderer.render();
        });
        
        // Show values
        document.getElementById('show-values').addEventListener('change', (e) => {
            AppState.chartConfig.showValues = e.target.checked;
            ChartRenderer.render();
        });
        
        // Show legend
        document.getElementById('show-legend').addEventListener('change', (e) => {
            AppState.chartConfig.showLegend = e.target.checked;
            ChartRenderer.render();
        });
        
        // Decimal places
        document.getElementById('decimal-places').addEventListener('input', (e) => {
            AppState.chartConfig.decimalPlaces = parseInt(e.target.value, 10);
            ChartRenderer.render();
        });
        
        // Watermark
        document.getElementById('watermark').addEventListener('input', (e) => {
            AppState.chartConfig.watermark = e.target.value;
            ChartRenderer.render();
        });
    },

    /**
     * Setup collapsible panel functionality
     */
    setupCollapsiblePanels() {
        document.querySelectorAll('.panel-header[data-toggle]').forEach(header => {
            header.addEventListener('click', function() {
                const targetId = this.getAttribute('data-toggle');
                const content = document.getElementById(targetId);
                
                if (content) {
                    content.classList.toggle('collapsed');
                    this.classList.toggle('collapsed');
                }
            });
        });
    },

    /**
     * Handle file upload with reactive update
     */
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                const parsedData = DataParser.parseCSV(csvText);
                
                AppState.data = parsedData;
                AppState.longData = DataParser.convertToLong(parsedData);
                
                // Initialize filtered items with all items
                const allItems = DataTransformer.getUniqueItems(AppState.longData);
                AppState.filteredItems = new Set(allItems);
                
                UI.showStatus('upload-status', I18n.t('file_loaded'), 'success');
                UI.populateItemFilter();
                UI.validateScale();
                
                // Auto-render chart
                ChartRenderer.render();
            } catch (error) {
                UI.showError(I18n.t('file_error') + ': ' + error.message);
                UI.showStatus('upload-status', I18n.t('file_error'), 'error');
            }
        };
        reader.readAsText(file);
    },

    /**
     * Populate preset scales dropdown from config
     */
    populatePresetScales() {
        const select = document.getElementById('preset-scale');
        if (!select) return;
        
        const currentLang = AppState.currentLanguage;
        
        // Clear existing options except the first one
        const placeholder = currentLang === 'es' ? '-- Seleccionar Preset --' : '-- Select Preset --';
        select.innerHTML = `<option value="">${placeholder}</option>`;
        
        if (!AppState.config || !AppState.config.presetScales) {
            console.warn('No preset scales found in config');
            return;
        }
        
        Object.entries(AppState.config.presetScales).forEach(([key, scale]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = currentLang === 'es' ? scale.nameES : scale.name;
            select.appendChild(option);
        });
        
        console.log('Preset scales loaded:', Object.keys(AppState.config.presetScales).length);
    },

    /**
     * Populate color schemes dropdown from config
     */
    populateColorSchemes() {
        const select = document.getElementById('color-scheme');
        if (!select) return;
        
        const currentLang = AppState.currentLanguage;
        
        select.innerHTML = '';
        
        if (!AppState.config || !AppState.config.colorSchemes) {
            console.warn('No color schemes found in config');
            return;
        }
        
        Object.entries(AppState.config.colorSchemes).forEach(([key, scheme]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = currentLang === 'es' ? scheme.nameES : scheme.name;
            
            // Select default
            if (key === AppState.chartConfig.colorScheme) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        console.log('Color schemes loaded:', Object.keys(AppState.config.colorSchemes).length);
    },

    /**
     * Handle preset scale selection
     */
    handlePresetScaleChange(event) {
        const scaleKey = event.target.value;
        
        if (!scaleKey) return;
        
        const scale = AppState.config.presetScales[scaleKey];
        const currentLang = AppState.currentLanguage;
        
        AppState.scaleConfig.type = scaleKey;
        AppState.scaleConfig.points = scale.points;
        AppState.scaleConfig.labels = scale.labels[currentLang] || scale.labels.en;
        
        // Update custom points input
        document.getElementById('custom-points').value = scale.points;
        
        UI.updateScaleLabels();
        UI.validateScale();
        ChartRenderer.render();
    },

    /**
     * Handle custom points change
     */
    handleCustomPointsChange(event) {
        const points = parseInt(event.target.value, 10);
        
        if (points < 2 || points > 10 || isNaN(points)) return;
        
        // Clear preset selection
        document.getElementById('preset-scale').value = '';
        
        AppState.scaleConfig.type = 'custom';
        AppState.scaleConfig.points = points;
        
        // Generate default labels
        const defaultLabels = [];
        for (let i = 1; i <= points; i++) {
            defaultLabels.push(`Point ${i}`);
        }
        AppState.scaleConfig.labels = defaultLabels;
        
        UI.updateScaleLabels();
        UI.validateScale();
        ChartRenderer.render();
    },

    /**
     * Update scale labels UI with editable inputs
     */
    updateScaleLabels() {
        const labelsDiv = document.getElementById('scale-labels');
        const points = AppState.scaleConfig.points;
        const labels = AppState.scaleConfig.labels;
        
        let html = '';
        for (let i = 0; i < points; i++) {
            html += `
                <div class="scale-label-item">
                    <label>${i + 1}:</label>
                    <input type="text" 
                           class="scale-label-input" 
                           value="${labels[i] || `Point ${i + 1}`}"
                           data-index="${i}">
                </div>
            `;
        }
        
        labelsDiv.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.scale-label-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                AppState.scaleConfig.labels[index] = e.target.value;
                ChartRenderer.render();
            });
        });
    },

    /**
     * Validate scale against data
     */
    validateScale() {
        if (!AppState.longData) return;
        
        const validation = DataParser.validateData(AppState.longData, AppState.scaleConfig);
        const statusDiv = document.getElementById('scale-validation');
        
        if (validation.valid) {
            statusDiv.className = 'validation-status valid';
            statusDiv.textContent = I18n.t('scale_validated');
        } else {
            statusDiv.className = 'validation-status invalid';
            statusDiv.textContent = I18n.t('scale_error') + ' (' + validation.invalidValues.length + ' invalid values)';
        }
    },

    /**
     * Populate item filter checkboxes
     */
    populateItemFilter() {
        const container = document.getElementById('item-checkboxes');
        
        if (!AppState.longData) {
            container.innerHTML = `<p data-i18n="no_data_loaded">${I18n.t('no_data_loaded')}</p>`;
            return;
        }
        
        const items = DataTransformer.getUniqueItems(AppState.longData);
        
        let html = '';
        items.forEach(item => {
            const checked = AppState.filteredItems.has(item) ? 'checked' : '';
            html += `
                <label>
                    <input type="checkbox" 
                           class="item-filter-checkbox" 
                           value="${item}"
                           ${checked}>
                    ${item}
                </label>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.item-filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const item = e.target.value;
                
                if (e.target.checked) {
                    AppState.filteredItems.add(item);
                } else {
                    AppState.filteredItems.delete(item);
                }
                
                ChartRenderer.render();
            });
        });
    },

    /**
     * Download example CSV template
     */
    downloadTemplate() {
        const csv = `respondent,Q1,Q2,Q3,Q4,Q5
1,5,4,5,4,5
2,4,4,3,4,4
3,3,3,4,3,3
4,5,5,5,5,5
5,2,3,2,3,2
6,4,5,4,5,4
7,3,4,3,4,3
8,5,4,5,4,5
9,4,3,4,3,4
10,3,3,3,3,3`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'likert_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Export chart
     */
    exportChart(format) {
        const canvas = document.getElementById('chart-canvas');
        
        if (!canvas.classList.contains('active')) {
            UI.showError('No chart to export. Please upload data first.');
            return;
        }
        
        if (format === 'png') {
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `likert-chart-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
            });
        } else if (format === 'svg') {
            UI.showError('SVG export requires additional library. Exporting as PNG instead.');
            this.exportChart('png');
        }
    },

    /**
     * Show status message
     */
    showStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `status-message ${type}`;
    },

    /**
     * Show error modal
     */
    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-modal').classList.remove('hidden');
    },

    /**
     * Hide error modal
     */
    hideError() {
        document.getElementById('error-modal').classList.add('hidden');
    }
};

// ========================================
// APPLICATION INITIALIZATION
// ========================================

/**
 * Initialize the application
 */
async function initApp() {
    // Load configuration first
    await ConfigLoader.loadConfig();
    
    // Load default language (Spanish)
    await I18n.loadLanguage('es');
    
    // Populate UI elements from config
    UI.populatePresetScales();
    UI.populateColorSchemes();
    
    // Initialize UI
    UI.init();
    
    // Set initial scale configuration (default 5-point)
    document.getElementById('custom-points').value = 5;
    UI.handleCustomPointsChange({ target: { value: '5' } });
    
    console.log('Likert Chart Visualizer Dashboard initialized successfully');
    console.log('Config loaded:', AppState.config ? 'Yes' : 'No');
    console.log('Language:', AppState.currentLanguage);
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
