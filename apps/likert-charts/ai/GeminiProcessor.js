/**
 * GeminiProcessor - Integración con Google Gemini AI
 * Procesa archivos CSV de formularios y sugiere escalas Likert
 */

export class GeminiProcessor {
    constructor(apiKey, model = 'gemini-2.0-flash') {
        this.apiKey = apiKey;
        this.model = model;
        this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    }

    /**
     * Procesa un archivo CSV y devuelve datos limpios + sugerencias de escala
     * @param {string} csvContent - Contenido del CSV
     * @param {string} sourceType - Tipo de fuente: 'msforms', 'gforms', 'other'
     * @returns {Promise<Object>} - Resultado del procesamiento
     */
    async processFile(csvContent, sourceType = 'other') {
        console.log(`🤖 GeminiProcessor: procesando archivo con ${csvContent.split('\n').length} líneas`);
        const prompt = this.buildPrompt(csvContent, sourceType);
        
        try {
            const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 8192,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Error de Gemini API:', errorData);
                throw new Error(errorData.error?.message || 'Error al procesar con Gemini');
            }

            const data = await response.json();
            const resultText = data.candidates[0].content.parts[0].text;
            
            console.log(`✅ Respuesta de Gemini recibida (${resultText.length} caracteres)`);
            
            return this.parseGeminiResponse(resultText);
        } catch (error) {
            console.error('❌ Error al procesar con Gemini:', error);
            throw error;
        }
    }

    /**
     * Construye el prompt para Gemini según el tipo de archivo
     */
    buildPrompt(csvContent, sourceType) {
        const csvLines = csvContent.split('\n');
        const totalLines = csvLines.length;
        
        console.log(`📄 Construyendo prompt para Gemini:`);
        console.log(`   CSV original: ${totalLines} líneas totales`);
        console.log(`   Enviando CSV COMPLETO a Gemini (todas las filas)`);
        
        return `Eres un asistente experto en análisis de datos de encuestas Likert.

CONTEXTO:
Tienes un archivo CSV/Excel de ${this.getSourceName(sourceType)} con datos de encuesta.
Necesitas transformarlo al formato esperado y detectar la escala Likert utilizada.

IMPORTANTE SOBRE NOMBRES DE COLUMNAS:
- Los nombres de columnas pueden venir CON o SIN comillas
- Microsoft Forms NO usa comillas en los headers
- Acepta ambos formatos: ID,Pregunta1,Pregunta2 o "ID","Pregunta1","Pregunta2"
- Los nombres pueden tener espacios, acentos, signos de interrogación, etc.
- Ejemplos válidos:
  * ID,¿Qué tan satisfecho está?,¿Recomendarias el producto?
  * "ID","Pregunta 1","Pregunta 2"
  * respondent,Q1,Q2,Q3

FORMATO ESPERADO DE SALIDA:
- Primera columna: ID del encuestado (sin comillas en el CSV de salida)
- Resto de columnas: Preguntas/ítems con valores numéricos
- Los valores deben ser enteros (1, 2, 3, 4, 5, etc.)
- Si una celda está vacía, déjala vacía (sin rellenar)
- NO uses comillas en los headers del CSV de salida
- IMPORTANTE: MANTÉN TODAS LAS FILAS, incluso si tienen algunos valores vacíos

ARCHIVO CSV COMPLETO:
\`\`\`csv
${csvContent.trim()}
\`\`\`

TAREAS:
1. **ANALIZAR** la estructura del CSV (con o sin comillas en headers)
2. **DETECTAR** qué columnas son preguntas tipo Likert (generalmente tienen valores 1-5, 1-7, etc.)
3. **IDENTIFICAR** el tipo de escala Likert usada
4. **TRANSFORMAR** respuestas textuales a números si es necesario
5. **SUGERIR** transformaciones necesarias
6. **GENERAR** el CSV limpio en formato ancho SIN comillas en los headers

RESPONDE EN FORMATO JSON ESTRICTO (sin markdown):
{
  "analysis": {
    "sourceDetected": "Tipo de fuente detectada",
    "totalRows": numero,
    "totalColumns": numero,
    "likertColumns": ["columna1", "columna2"],
    "nonLikertColumns": ["columna_texto", "timestamp"],
    "scaleDetected": {
      "points": 5,
      "type": "agreement|frequency|satisfaction|custom",
      "confidence": 0.95,
      "reasoning": "Por qué se detectó esta escala"
    }
  },
  "suggestions": {
    "scaleType": "agreement_5",
    "scaleLabels": ["Totalmente en desacuerdo", "En desacuerdo", "Neutral", "De acuerdo", "Totalmente de acuerdo"],
    "columnsToRemove": ["Timestamp", "Email"],
    "columnsToTransform": [],
    "warnings": ["Advertencia 1", "Advertencia 2"]
  },
  "cleanedCSV": "respondent,Q1,Q2,Q3\\n1,5,4,5\\n2,4,3,4",
  "metadata": {
    "hasHeaderRow": true,
    "delimiter": ",",
    "encoding": "UTF-8"
  }
}

REGLAS IMPORTANTES:
- NO incluyas \`\`\`json en la respuesta, solo el JSON puro
- El cleanedCSV debe ser formato ancho con primera columna = ID
- NO uses comillas en los nombres de columnas del cleanedCSV de salida
- Acepta nombres de columna con o sin comillas en el CSV de entrada
- Si hay columnas de texto libre, exclúyelas del cleanedCSV
- Si detectas timestamps o emails, márcalos en columnsToRemove
- Sé preciso en la detección de la escala Likert
- Si no estás seguro, usa "custom" como tipo de escala
- Respeta caracteres especiales en nombres (¿, á, é, í, ó, ú, ñ, etc.)`;
    }

    /**
     * Parsea la respuesta JSON de Gemini
     */
    parseGeminiResponse(responseText) {
        console.log('🔍 Parseando respuesta de Gemini...');
        
        try {
            // Limpiar posibles markdown code blocks
            let cleanText = responseText.trim();
            cleanText = cleanText.replace(/```json\n?/g, '');
            cleanText = cleanText.replace(/```\n?/g, '');
            
            const parsed = JSON.parse(cleanText);
            
            // Validar estructura
            if (!parsed.analysis || !parsed.suggestions || !parsed.cleanedCSV) {
                console.error('❌ Respuesta de Gemini incompleta:', parsed);
                throw new Error('Respuesta de Gemini incompleta');
            }
            
            // Contar filas en el CSV limpio
            const cleanedLines = parsed.cleanedCSV.trim().split('\n');
            console.log(`✅ CSV limpio por Gemini: ${cleanedLines.length} líneas (${cleanedLines.length - 1} filas de datos)`);
            console.log(`   Columnas Likert detectadas: ${parsed.analysis.likertColumns?.length || 0}`);
            console.log(`   Escala detectada: ${parsed.analysis.scaleDetected?.points} puntos`);
            console.log('   Primeras 3 líneas:');
            console.log(cleanedLines.slice(0, 3).join('\n'));
            
            return parsed;
        } catch (error) {
            console.error('❌ Error al parsear respuesta de Gemini:', error);
            console.log('Respuesta recibida (primeros 500 chars):', responseText.substring(0, 500));
            throw new Error('No se pudo interpretar la respuesta de Gemini. Revisa el formato del archivo.');
        }
    }

    /**
     * Nombre descriptivo de la fuente
     */
    getSourceName(sourceType) {
        const names = {
            'msforms': 'Microsoft Forms',
            'gforms': 'Google Forms',
            'other': 'fuente desconocida'
        };
        return names[sourceType] || names.other;
    }

    /**
     * Valida la API key con una petición simple
     */
    async validateApiKey() {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Test'
                        }]
                    }]
                })
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

/**
 * UI para confirmación interactiva de sugerencias de Gemini
 */
export class GeminiConfirmationUI {
    constructor(result, onConfirm, onCancel) {
        this.result = result;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
    }

    /**
     * Muestra modal de confirmación con las sugerencias
     */
    show() {
        const modal = this.createModal();
        document.body.appendChild(modal);
        
        // Animar entrada
        setTimeout(() => modal.classList.add('show'), 10);
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'gemini-modal';
        modal.innerHTML = `
            <div class="gemini-modal-content">
                <div class="gemini-modal-header">
                    <h3>🤖 Análisis Inteligente Completado</h3>
                    <button class="close-btn" onclick="this.closest('.gemini-modal').remove()">✕</button>
                </div>
                
                <div class="gemini-modal-body">
                    ${this.renderAnalysis()}
                    ${this.renderSuggestions()}
                    ${this.renderWarnings()}
                    ${this.renderPreview()}
                </div>
                
                <div class="gemini-modal-footer">
                    <button class="btn-secondary" id="gemini-cancel">Cancelar</button>
                    <button class="btn-primary" id="gemini-confirm">Aplicar Sugerencias</button>
                </div>
            </div>
        `;

        // Event listeners
        modal.querySelector('#gemini-confirm').addEventListener('click', () => {
            this.onConfirm(this.result);
            modal.remove();
        });

        modal.querySelector('#gemini-cancel').addEventListener('click', () => {
            this.onCancel();
            modal.remove();
        });

        // Click fuera para cerrar
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.onCancel();
                modal.remove();
            }
        });

        return modal;
    }

    renderAnalysis() {
        const { analysis } = this.result;
        return `
            <div class="gemini-section">
                <h4>📊 Análisis del Archivo</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Fuente detectada:</span>
                        <span class="value">${analysis.sourceDetected}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Filas de datos:</span>
                        <span class="value">${analysis.totalRows}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Columnas totales:</span>
                        <span class="value">${analysis.totalColumns}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Preguntas Likert:</span>
                        <span class="value">${analysis.likertColumns.length}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderSuggestions() {
        const { analysis, suggestions } = this.result;
        const scale = analysis.scaleDetected;
        
        return `
            <div class="gemini-section">
                <h4>💡 Sugerencias de Escala</h4>
                <div class="scale-suggestion">
                    <div class="scale-info">
                        <span class="scale-badge">${scale.points} puntos</span>
                        <span class="confidence">Confianza: ${(scale.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p class="scale-reasoning">${scale.reasoning}</p>
                    <div class="scale-labels">
                        ${suggestions.scaleLabels.map((label, i) => `
                            <div class="scale-label-item">
                                <span class="scale-num">${i + 1}</span>
                                <input type="text" class="scale-label-input" value="${label}" data-index="${i}">
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${suggestions.columnsToRemove.length > 0 ? `
                    <div class="columns-removed">
                        <strong>Columnas que se eliminarán:</strong>
                        <div class="chip-list">
                            ${suggestions.columnsToRemove.map(col => `<span class="chip chip-remove">${col}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderWarnings() {
        const { suggestions } = this.result;
        if (!suggestions.warnings || suggestions.warnings.length === 0) return '';
        
        return `
            <div class="gemini-section gemini-warnings">
                <h4>⚠️ Advertencias</h4>
                <ul>
                    ${suggestions.warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderPreview() {
        const { cleanedCSV, analysis } = this.result;
        const lines = cleanedCSV.split('\n').slice(0, 6);
        const likertColumns = analysis.likertColumns || [];
        
        return `
            <div class="gemini-section">
                <h4>👁️ Vista Previa del CSV Limpio</h4>
                <p style="margin-bottom: 12px; color: #64748b; font-size: 0.9rem;">
                    <strong>${cleanedCSV.split('\n').length - 1}</strong> filas de datos encontradas
                </p>
                <div class="csv-preview">
                    <pre>${lines.join('\n')}${cleanedCSV.split('\n').length > 6 ? '\n...' : ''}</pre>
                </div>
                
                <div style="margin-top: 16px;">
                    <h5 style="margin-bottom: 8px; font-size: 0.95rem; color: #475569;">🎯 Nombres de Columnas (editables)</h5>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 12px;">
                        Edita los nombres de las columnas Likert si lo deseas:
                    </p>
                    <div class="column-names-editor">
                        ${likertColumns.map((col, i) => `
                            <div class="column-name-item">
                                <span class="col-index">${i + 1}</span>
                                <input type="text" class="column-name-input" value="${col}" data-col-index="${i}" 
                                       title="Nombre original: ${col}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtiene las etiquetas editadas por el usuario
     */
    getEditedLabels() {
        const inputs = document.querySelectorAll('.scale-label-input');
        return Array.from(inputs).map(input => input.value.trim());
    }
    
    /**
     * Obtiene los nombres de columnas editados por el usuario
     */
    getEditedColumnNames() {
        const inputs = document.querySelectorAll('.column-name-input');
        return Array.from(inputs).map(input => input.value.trim());
    }
}
