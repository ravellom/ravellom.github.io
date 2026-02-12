/**
 * RecuEdu Labs - Biblioteca Compartida de Procesamiento de Datos
 * @version 2.0.0
 * @description Librería para procesar, transformar y compartir datos de encuestas
 * entre aplicaciones del ecosistema RecuEdu Labs
 */

const RecuEduData = (function() {
    'use strict';
    
    console.log('🔧 Cargando RecuEduData v2.0.0...');

    const STORAGE_PREFIX = 'recueduLabs_';
    const DATASETS_KEY = `${STORAGE_PREFIX}datasets`;
    const CONFIG_KEY = `${STORAGE_PREFIX}config`;

    // ==================== STORAGE MANAGER ====================
    const Storage = {
        /**
         * Guarda un dataset en localStorage compartido
         * @param {string} name - Nombre del dataset
         * @param {object} data - Datos a guardar
         * @param {object} metadata - Metadatos opcionales
         */
        saveDataset(name, data, metadata = {}) {
            const datasets = this.listDatasets();
            const dataset = {
                name,
                data,
                metadata: {
                    ...metadata,
                    savedAt: new Date().toISOString(),
                    version: '2.0.0'
                }
            };
            
            datasets[name] = dataset;
            localStorage.setItem(DATASETS_KEY, JSON.stringify(datasets));
            return dataset;
        },

        /**
         * Carga un dataset del storage compartido
         * @param {string} name - Nombre del dataset
         */
        loadDataset(name) {
            const datasets = this.listDatasets();
            return datasets[name] || null;
        },

        /**
         * Lista todos los datasets guardados
         */
        listDatasets() {
            const data = localStorage.getItem(DATASETS_KEY);
            return data ? JSON.parse(data) : {};
        },

        /**
         * Elimina un dataset
         * @param {string} name - Nombre del dataset
         */
        deleteDataset(name) {
            const datasets = this.listDatasets();
            delete datasets[name];
            localStorage.setItem(DATASETS_KEY, JSON.stringify(datasets));
        },

        /**
         * Obtiene información resumida de los datasets
         */
        getDatasetsInfo() {
            const datasets = this.listDatasets();
            return Object.keys(datasets).map(name => ({
                name,
                rowCount: datasets[name].data?.length || 0,
                savedAt: datasets[name].metadata?.savedAt,
                source: datasets[name].metadata?.source
            }));
        }
    };

    // ==================== PARSERS ====================
    const Parsers = {
        /**
         * Detecta el tipo de fuente (Google Forms, MS Forms, CSV genérico)
         */
        detectSource(text, filename = '') {
            const firstLine = text.split('\n')[0];
            
            // Google Forms: "Marca temporal" es común
            if (firstLine.includes('Marca temporal') || firstLine.includes('Timestamp')) {
                return 'google_forms';
            }
            
            // MS Forms: suele tener "ID" o "Start time"
            if (firstLine.includes('Start time') || firstLine.includes('Completion time')) {
                return 'ms_forms';
            }
            
            return 'generic_csv';
        },

        /**
         * Detecta automáticamente el delimitador CSV
         */
        detectDelimiter(text) {
            const firstLine = text.split('\n')[0];
            
            // Contar ocurrencias de posibles delimitadores
            const commas = (firstLine.match(/,/g) || []).length;
            const semicolons = (firstLine.match(/;/g) || []).length;
            const tabs = (firstLine.match(/\t/g) || []).length;
            const pipes = (firstLine.match(/\|/g) || []).length;
            
            // Elegir el que tenga más ocurrencias
            const delimiters = [
                { char: ';', count: semicolons },
                { char: ',', count: commas },
                { char: '\t', count: tabs },
                { char: '|', count: pipes }
            ];
            
            delimiters.sort((a, b) => b.count - a.count);
            
            return delimiters[0].count > 0 ? delimiters[0].char : ',';
        },

        /**
         * Parsea CSV a array de objetos
         */
        parseCSV(text, options = {}) {
            let { delimiter, skipEmptyLines = true, trimValues = true } = options;
            
            // Auto-detectar delimitador si no se especifica
            if (!delimiter) {
                delimiter = this.detectDelimiter(text);
                console.log(`Delimitador detectado: "${delimiter === '\t' ? '\\t (tabulador)' : delimiter}"`);
            }
            
            const lines = text.split('\n').filter(line => 
                !skipEmptyLines || line.trim().length > 0
            );
            
            if (lines.length === 0) return [];
            
            const headers = this._parseCSVLine(lines[0], delimiter, trimValues);
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this._parseCSVLine(lines[i], delimiter, trimValues);
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                
                data.push(row);
            }
            
            return data;
        },

        /**
         * Parsea una línea CSV manejando comillas
         */
        _parseCSVLine(line, delimiter, trim) {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                
                if (char === '"' && inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    values.push(trim ? current.trim() : current);
                    current = '';
                } else {
                    current += char;
                }
            }
            
            values.push(trim ? current.trim() : current);
            return values;
        },

        /**
         * Parsea Google Forms CSV
         */
        parseGoogleForms(text, options = {}) {
            const data = this.parseCSV(text, options);
            
            return data.map(row => {
                const cleaned = { ...row };
                
                // Renombrar columna de timestamp
                if (cleaned['Marca temporal']) {
                    cleaned.timestamp = cleaned['Marca temporal'];
                    delete cleaned['Marca temporal'];
                }
                
                return cleaned;
            });
        },

        /**
         * Parsea MS Forms CSV
         */
        parseMSForms(text, options = {}) {
            const data = this.parseCSV(text, options);
            
            return data.map(row => {
                const cleaned = { ...row };
                
                // Normalizar timestamps
                if (cleaned['Start time']) {
                    cleaned.startTime = cleaned['Start time'];
                    delete cleaned['Start time'];
                }
                if (cleaned['Completion time']) {
                    cleaned.completionTime = cleaned['Completion time'];
                    delete cleaned['Completion time'];
                }
                
                return cleaned;
            });
        }
    };

    // ==================== TRANSFORMERS ====================
    const Transformers = {
        /**
         * Normaliza escalas Likert a un rango específico
         * @param {array} data - Datos
         * @param {array} columns - Columnas a normalizar
         * @param {number} min - Valor mínimo deseado
         * @param {number} max - Valor máximo deseado
         */
        normalizeLikert(data, columns, min = 1, max = 5) {
            if (!data || data.length === 0) return data;
            
            // Primero, encontrar el rango actual de cada columna
            const ranges = {};
            
            columns.forEach(col => {
                const values = data
                    .map(row => {
                        const val = row[col];
                        // Convertir a número si es string
                        return typeof val === 'string' ? parseFloat(val.trim()) : parseFloat(val);
                    })
                    .filter(v => !isNaN(v) && v !== null && v !== undefined && v !== '');
                
                if (values.length > 0) {
                    ranges[col] = {
                        min: Math.min(...values),
                        max: Math.max(...values)
                    };
                }
            });
            
            // Normalizar cada fila
            return data.map(row => {
                const newRow = { ...row };
                
                columns.forEach(col => {
                    const cellValue = row[col];
                    
                    if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                        // Convertir a número, manejando strings
                        const value = typeof cellValue === 'string' ? parseFloat(cellValue.trim()) : parseFloat(cellValue);
                        
                        if (!isNaN(value) && ranges[col]) {
                            const currentRange = ranges[col];
                            
                            // Si el rango actual es un solo valor, asignar el mínimo del nuevo rango
                            if (currentRange.min === currentRange.max) {
                                newRow[col] = min;
                            } else {
                                // Fórmula de normalización lineal
                                const normalized = ((value - currentRange.min) / (currentRange.max - currentRange.min)) * (max - min) + min;
                                // Redondear a 2 decimales y guardar como número
                                newRow[col] = Math.round(normalized * 100) / 100;
                            }
                        }
                    }
                });
                
                return newRow;
            });
        },

        /**
         * Recodifica valores según un mapeo
         * @param {array} data - Datos
         * @param {string} column - Columna a recodificar
         * @param {object} mapping - Mapeo de valores (ej: {"Sí": 1, "No": 0})
         */
        recode(data, column, mapping) {
            return data.map(row => ({
                ...row,
                [column]: mapping[row[column]] !== undefined ? mapping[row[column]] : row[column]
            }));
        },

        /**
         * Convierte texto de escala Likert a números
         */
        likertTextToNumber(data, columns, mapping = null) {
            // Mapeo por defecto con matching case-insensitive (español + inglés + portugués)
            const defaultMapping = {
                // === ESPAÑOL ===
                // Escala 1-5 estándar (totalmente en desacuerdo a totalmente de acuerdo)
                'totalmente en desacuerdo': 1,
                'muy en desacuerdo': 1,
                'completamente en desacuerdo': 1,
                'en desacuerdo': 2,
                'desacuerdo': 2,
                'algo en desacuerdo': 2,
                'neutral': 3,
                'ni de acuerdo ni en desacuerdo': 3,
                'indiferente': 3,
                'indeciso': 3,
                'de acuerdo': 4,
                'acuerdo': 4,
                'algo de acuerdo': 4,
                'totalmente de acuerdo': 5,
                'muy de acuerdo': 5,
                'completamente de acuerdo': 5,
                
                // Frecuencia
                'nunca': 1,
                'casi nunca': 2,
                'rara vez': 2,
                'raramente': 2,
                'a veces': 3,
                'ocasionalmente': 3,
                'frecuentemente': 4,
                'a menudo': 4,
                'casi siempre': 4,
                'siempre': 5,
                
                // Satisfacción
                'muy insatisfecho': 1,
                'insatisfecho': 2,
                'poco satisfecho': 2,
                'satisfecho': 4,
                'muy satisfecho': 5,
                
                // Calidad
                'muy malo': 1,
                'malo': 2,
                'regular': 3,
                'bueno': 4,
                'muy bueno': 5,
                'excelente': 5,
                
                // Importancia
                'nada importante': 1,
                'poco importante': 2,
                'moderadamente importante': 3,
                'importante': 4,
                'muy importante': 5,
                
                // Nivel
                'muy bajo': 1,
                'bajo': 2,
                'medio': 3,
                'alto': 4,
                'muy alto': 5,
                
                // Probabilidad
                'muy improbable': 1,
                'improbable': 2,
                'posible': 3,
                'probable': 4,
                
                // === INGLÉS ===
                // Agreement scale (1-5)
                'strongly disagree': 1,
                'completely disagree': 1,
                'totally disagree': 1,
                'disagree': 2,
                'somewhat disagree': 2,
                'neither agree nor disagree': 3,
                'agree': 4,
                'somewhat agree': 4,
                'strongly agree': 5,
                'completely agree': 5,
                'totally agree': 5,
                
                // Frequency
                'never': 1,
                'rarely': 2,
                'seldom': 2,
                'almost never': 2,
                'sometimes': 3,
                'occasionally': 3,
                'often': 4,
                'frequently': 4,
                'almost always': 4,
                'always': 5,
                
                // Satisfaction
                'very dissatisfied': 1,
                'dissatisfied': 2,
                'somewhat dissatisfied': 2,
                'satisfied': 4,
                'very satisfied': 5,
                
                // Quality
                'very poor': 1,
                'poor': 2,
                'fair': 3,
                'good': 4,
                'very good': 5,
                'excellent': 5,
                
                // Importance
                'not important': 1,
                'slightly important': 2,
                'moderately important': 3,
                'important': 4,
                'very important': 5,
                'extremely important': 5,
                
                // Level
                'very low': 1,
                'low': 2,
                'moderate': 3,
                'medium': 3,
                'high': 4,
                'very high': 5,
                
                // Likelihood/Probability
                'very unlikely': 1,
                'unlikely': 2,
                'possible': 3,
                'likely': 4,
                'muy probable': 5,
                'very likely': 5,
                'extremely likely': 5,
                
                // Yes/No
                'yes': 1,
                'no': 0,
                "don't know": 3,
                'not sure': 3,
                
                // Sí/No
                'sí': 1,
                'si': 1,
                'no sé': 3,
                'no se': 3
            };
            
            const map = mapping || defaultMapping;
            
            // Crear un mapa case-insensitive
            const lowerCaseMap = {};
            Object.keys(map).forEach(key => {
                lowerCaseMap[key.toLowerCase()] = map[key];
            });
            
            console.log('📝 Iniciando conversión texto→número');
            console.log('Columnas a convertir:', columns);
            
            let conversionCount = 0;
            const conversionDetails = {};
            
            const result = data.map((row, rowIndex) => {
                const newRow = { ...row };
                columns.forEach(col => {
                    const value = row[col];
                    if (value && typeof value === 'string') {
                        const trimmed = value.trim();
                        const lowerValue = trimmed.toLowerCase();
                        
                        if (lowerCaseMap[lowerValue] !== undefined) {
                            const numericValue = lowerCaseMap[lowerValue];
                            newRow[col] = numericValue;
                            conversionCount++;
                            
                            // Registrar detalles de conversión
                            if (!conversionDetails[col]) {
                                conversionDetails[col] = {};
                            }
                            if (!conversionDetails[col][trimmed]) {
                                conversionDetails[col][trimmed] = { count: 0, numero: numericValue };
                            }
                            conversionDetails[col][trimmed].count++;
                            
                            if (rowIndex < 3) {
                                console.log(`  Fila ${rowIndex}, columna "${col}": "${trimmed}" → ${numericValue}`);
                            }
                        } else if (rowIndex < 3) {
                            console.log(`  Fila ${rowIndex}, columna "${col}": "${trimmed}" → NO CONVERTIDO (sin coincidencia)`);
                        }
                    }
                });
                return newRow;
            });
            
            console.log('✅ Conversión completada:', conversionCount, 'valores convertidos');
            console.log('Detalle por columna:', conversionDetails);
            
            return result;
        },

        /**
         * Calcula columna promedio de múltiples columnas
         */
        calculateAverage(data, columns, newColumnName) {
            return data.map(row => {
                const values = columns
                    .map(col => parseFloat(row[col]))
                    .filter(val => !isNaN(val));
                
                const avg = values.length > 0 
                    ? values.reduce((a, b) => a + b, 0) / values.length 
                    : null;
                
                return {
                    ...row,
                    [newColumnName]: avg !== null ? avg.toFixed(2) : ''
                };
            });
        },

        /**
         * Filtra filas basadas en condición
         */
        filter(data, predicate) {
            return data.filter(predicate);
        },

        /**
         * Selecciona solo columnas específicas
         */
        selectColumns(data, columns) {
            return data.map(row => {
                const newRow = {};
                columns.forEach(col => {
                    if (row.hasOwnProperty(col)) {
                        newRow[col] = row[col];
                    }
                });
                return newRow;
            });
        },

        /**
         * Renombra columnas
         */
        renameColumns(data, mapping) {
            return data.map(row => {
                const newRow = {};
                Object.keys(row).forEach(key => {
                    const newKey = mapping[key] || key;
                    newRow[newKey] = row[key];
                });
                return newRow;
            });
        }
    };

    // ==================== CLEANERS ====================
    const Cleaners = {
        /**
         * Elimina filas con valores faltantes
         */
        removeNullRows(data, columns = null) {
            return data.filter(row => {
                const columnsToCheck = columns || Object.keys(row);
                return columnsToCheck.every(col => 
                    row[col] !== null && 
                    row[col] !== undefined && 
                    row[col] !== ''
                );
            });
        },

        /**
         * Rellena valores faltantes
         */
        fillNA(data, value = '', columns = null) {
            return data.map(row => {
                const newRow = { ...row };
                const columnsToFill = columns || Object.keys(row);
                
                columnsToFill.forEach(col => {
                    if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
                        newRow[col] = value;
                    }
                });
                
                return newRow;
            });
        },

        /**
         * Elimina duplicados
         */
        removeDuplicates(data, keyColumns = null) {
            const seen = new Set();
            
            return data.filter(row => {
                const key = keyColumns 
                    ? keyColumns.map(col => row[col]).join('|')
                    : JSON.stringify(row);
                
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
        },

        /**
         * Limpia espacios en blanco
         */
        trimValues(data) {
            return data.map(row => {
                const newRow = {};
                Object.keys(row).forEach(key => {
                    newRow[key] = typeof row[key] === 'string' 
                        ? row[key].trim() 
                        : row[key];
                });
                return newRow;
            });
        }
    };

    // ==================== VALIDATORS ====================
    const Validators = {
        /**
         * Valida tipos de datos de columnas
         */
        validateSchema(data, schema) {
            const errors = [];
            
            data.forEach((row, index) => {
                Object.keys(schema).forEach(col => {
                    const expectedType = schema[col];
                    const value = row[col];
                    
                    if (value === null || value === undefined || value === '') {
                        return; // Skip empty values
                    }
                    
                    let isValid = true;
                    
                    switch(expectedType) {
                        case 'number':
                            isValid = !isNaN(parseFloat(value));
                            break;
                        case 'string':
                            isValid = typeof value === 'string';
                            break;
                        case 'boolean':
                            isValid = typeof value === 'boolean' || 
                                     value === 'true' || value === 'false';
                            break;
                    }
                    
                    if (!isValid) {
                        errors.push({
                            row: index + 1,
                            column: col,
                            value,
                            expectedType
                        });
                    }
                });
            });
            
            return { isValid: errors.length === 0, errors };
        },

        /**
         * Obtiene información estadística de los datos
         */
        getDataInfo(data) {
            if (!data || data.length === 0) {
                return null;
            }
            
            const columns = Object.keys(data[0]);
            const columnInfo = {};
            
            columns.forEach(col => {
                const values = data.map(row => row[col]).filter(v => v !== '' && v !== null);
                const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
                
                columnInfo[col] = {
                    totalValues: values.length,
                    missingValues: data.length - values.length,
                    uniqueValues: new Set(values).size,
                    isNumeric: numericValues.length === values.length,
                    min: numericValues.length > 0 ? Math.min(...numericValues) : null,
                    max: numericValues.length > 0 ? Math.max(...numericValues) : null,
                    avg: numericValues.length > 0 
                        ? (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2)
                        : null
                };
            });
            
            return {
                rowCount: data.length,
                columnCount: columns.length,
                columns: columnInfo
            };
        }
    };

    // ==================== EXPORTERS ====================
    const Exporters = {
        /**
         * Exporta a JSON
         */
        toJSON(data, pretty = true) {
            return JSON.stringify(data, null, pretty ? 2 : 0);
        },

        /**
         * Exporta a CSV
         */
        toCSV(data) {
            if (!data || data.length === 0) return '';
            
            const headers = Object.keys(data[0]);
            const csvRows = [headers.join(',')];
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header] || '';
                    // Escapar comillas y envolver en comillas si contiene comas
                    const escaped = String(value).replace(/"/g, '""');
                    return escaped.includes(',') || escaped.includes('"') 
                        ? `"${escaped}"` 
                        : escaped;
                });
                csvRows.push(values.join(','));
            });
            
            return csvRows.join('\n');
        },

        /**
         * Descarga datos como archivo
         */
        downloadFile(content, filename, type = 'text/plain') {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        /**
         * Exporta y descarga como JSON
         */
        exportJSON(data, filename = 'data.json') {
            const content = this.toJSON(data);
            this.downloadFile(content, filename, 'application/json');
        },

        /**
         * Exporta y descarga como CSV
         */
        exportCSV(data, filename = 'data.csv') {
            const content = this.toCSV(data);
            this.downloadFile(content, filename, 'text/csv');
        }
    };

    // ==================== PUBLIC API ====================
    return {
        // Storage
        storage: Storage,
        
        // Parsers
        parseCSV: Parsers.parseCSV.bind(Parsers),
        parseGoogleForms: Parsers.parseGoogleForms.bind(Parsers),
        parseMSForms: Parsers.parseMSForms.bind(Parsers),
        detectSource: Parsers.detectSource.bind(Parsers),
        detectDelimiter: Parsers.detectDelimiter.bind(Parsers),
        
        // Transformers
        normalizeLikert: Transformers.normalizeLikert.bind(Transformers),
        recode: Transformers.recode.bind(Transformers),
        likertTextToNumber: Transformers.likertTextToNumber.bind(Transformers),
        calculateAverage: Transformers.calculateAverage.bind(Transformers),
        filter: Transformers.filter.bind(Transformers),
        selectColumns: Transformers.selectColumns.bind(Transformers),
        renameColumns: Transformers.renameColumns.bind(Transformers),
        
        // Cleaners
        removeNullRows: Cleaners.removeNullRows.bind(Cleaners),
        fillNA: Cleaners.fillNA.bind(Cleaners),
        removeDuplicates: Cleaners.removeDuplicates.bind(Cleaners),
        trimValues: Cleaners.trimValues.bind(Cleaners),
        
        // Validators
        validateSchema: Validators.validateSchema.bind(Validators),
        getDataInfo: Validators.getDataInfo.bind(Validators),
        
        // Exporters
        toJSON: Exporters.toJSON.bind(Exporters),
        toCSV: Exporters.toCSV.bind(Exporters),
        exportJSON: Exporters.exportJSON.bind(Exporters),
        exportCSV: Exporters.exportCSV.bind(Exporters),
        downloadFile: Exporters.downloadFile.bind(Exporters),
        
        // Version
        version: '2.0.0'
    };
})();

if (typeof RecuEduData !== 'undefined') {
    console.log('✅ RecuEduData cargado correctamente. Versión:', RecuEduData.version);
} else {
    console.error('❌ Error: RecuEduData no se pudo cargar');
}

if (typeof window !== 'undefined') {
    window.RecuEduData = RecuEduData;
}

// Exportar para uso como módulo ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecuEduData;
}
