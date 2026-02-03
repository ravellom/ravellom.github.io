/**
 * ChartRegistry - Sistema de registro dinámico de tipos de gráficos
 * Permite agregar nuevos tipos de gráficos sin modificar el código principal
 */

export class ChartRegistry {
    constructor() {
        this.charts = new Map();
    }

    /**
     * Registra un nuevo tipo de gráfico
     * @param {Object} chartModule - Módulo del gráfico con interfaz estándar
     * @returns {boolean} - true si se registró exitosamente
     */
    register(chartModule) {
        if (!chartModule.id || !chartModule.render) {
            console.error('Chart module must have id and render method', chartModule);
            return false;
        }

        this.charts.set(chartModule.id, chartModule);
        console.log(`[ChartRegistry] Registered chart: ${chartModule.id}`);
        return true;
    }

    /**
     * Obtiene un tipo de gráfico por ID
     * @param {string} id - ID del tipo de gráfico
     * @returns {Object|null} - Módulo del gráfico o null
     */
    get(id) {
        return this.charts.get(id) || null;
    }

    /**
     * Obtiene todos los tipos de gráficos registrados
     * @returns {Array} - Array de módulos de gráficos
     */
    getAll() {
        return Array.from(this.charts.values());
    }

    /**
     * Verifica si un tipo de gráfico está registrado
     * @param {string} id - ID del tipo de gráfico
     * @returns {boolean}
     */
    has(id) {
        return this.charts.has(id);
    }

    /**
     * Obtiene el nombre traducido de un gráfico
     * @param {string} id - ID del tipo de gráfico
     * @param {string} lang - Código de idioma
     * @returns {string} - Nombre traducido o ID
     */
    getName(id, lang = 'es') {
        const chart = this.get(id);
        if (!chart) return id;
        
        if (typeof chart.name === 'string') return chart.name;
        if (typeof chart.name === 'object') return chart.name[lang] || chart.name.en || id;
        
        return id;
    }
}

// Instancia singleton
export const chartRegistry = new ChartRegistry();
