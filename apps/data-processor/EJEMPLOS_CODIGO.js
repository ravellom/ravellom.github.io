/**
 * EJEMPLOS DE CÓDIGO: Integración de RecuEdu Data Library
 * 
 * Este archivo contiene snippets de código listos para copiar/pegar
 * en tus aplicaciones RecuEdu Labs
 */

// ==================== EJEMPLO 1: SELECTOR DE DATASETS ====================
// Añade un selector HTML para cargar datasets guardados

function createDatasetSelector() {
    const datasets = RecuEduData.storage.getDatasetsInfo();
    
    const select = document.createElement('select');
    select.id = 'dataset-selector';
    select.className = 'input-field';
    
    // Opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Selecciona un dataset --';
    select.appendChild(defaultOption);
    
    // Añadir datasets disponibles
    datasets.forEach(ds => {
        const option = document.createElement('option');
        option.value = ds.name;
        option.textContent = `${ds.name} (${ds.rowCount} filas)`;
        select.appendChild(option);
    });
    
    // Event listener
    select.addEventListener('change', (e) => {
        if (e.target.value) {
            const data = RecuEduData.storage.loadDataset(e.target.value);
            console.log('Dataset cargado:', data);
            // Procesar datos en tu app
            processLoadedData(data.data);
        }
    });
    
    // Añadir al DOM (ajusta el selector según tu HTML)
    document.getElementById('tu-contenedor').appendChild(select);
}

// ==================== EJEMPLO 2: BOTÓN "CARGAR DESDE STORAGE" ====================
// Botón que abre un modal con datasets disponibles

function showDatasetModal() {
    const datasets = RecuEduData.storage.getDatasetsInfo();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex; 
        align-items: center; justify-content: center; z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white; padding: 30px; border-radius: 12px;
        max-width: 600px; max-height: 80vh; overflow-y: auto;
    `;
    
    let html = '<h3>📂 Datasets Disponibles</h3>';
    
    if (datasets.length === 0) {
        html += '<p>No hay datasets guardados. Usa el Procesador de Datos para crear algunos.</p>';
    } else {
        html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
        datasets.forEach(ds => {
            html += `
                <div class="dataset-item" data-name="${ds.name}" style="
                    padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;
                    cursor: pointer; transition: all 0.2s;
                " onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#e2e8f0'">
                    <strong>${ds.name}</strong><br>
                    <small style="color: #64748b;">
                        ${ds.rowCount} filas • ${ds.source || 'Desconocido'} • 
                        ${new Date(ds.savedAt).toLocaleDateString('es-ES')}
                    </small>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '<button onclick="this.closest(\'.modal-overlay\').remove()" style="margin-top: 20px; width: 100%;">Cerrar</button>';
    
    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Añadir listeners a cada dataset
    content.querySelectorAll('.dataset-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            const data = RecuEduData.storage.loadDataset(name);
            processLoadedData(data.data);
            modal.remove();
        });
    });
    
    // Cerrar al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Ejemplo de uso:
// <button onclick="showDatasetModal()">Cargar desde Storage</button>

// ==================== EJEMPLO 3: PROCESAMIENTO AUTOMÁTICO ====================
// Pipeline automático para datos recién cargados

function processLoadedData(data) {
    console.log('📊 Procesando datos...');
    
    // 1. Validar que hay datos
    if (!data || data.length === 0) {
        console.error('❌ No hay datos para procesar');
        return null;
    }
    
    // 2. Limpiar
    let cleaned = RecuEduData.trimValues(data);
    cleaned = RecuEduData.removeNullRows(cleaned);
    cleaned = RecuEduData.removeDuplicates(cleaned);
    
    console.log(`✅ Limpieza completa: ${cleaned.length} filas`);
    
    // 3. Detectar columnas Likert (opcional)
    const columns = Object.keys(cleaned[0]);
    const likertColumns = columns.filter(col => {
        // Buscar columnas que puedan ser Likert
        const values = cleaned.map(row => row[col]).filter(v => v !== '');
        const uniqueValues = [...new Set(values)];
        // Si hay 3-7 valores únicos numéricos, probablemente es Likert
        return uniqueValues.length >= 3 && uniqueValues.length <= 7 &&
               uniqueValues.every(v => !isNaN(Number(v)));
    });
    
    // 4. Normalizar escalas Likert si se encuentran
    if (likertColumns.length > 0) {
        cleaned = RecuEduData.normalizeLikert(cleaned, likertColumns, 1, 5);
        console.log(`✅ ${likertColumns.length} columnas Likert normalizadas`);
    }
    
    // 5. Obtener info estadística
    const info = RecuEduData.getDataInfo(cleaned);
    console.log('📈 Info:', info);
    
    return cleaned;
}

// ==================== EJEMPLO 4: EXPORTAR DESDE TU APP ====================
// Función para exportar datos procesados desde tu aplicación

function exportProcessedData(data, format = 'csv') {
    if (!data || data.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `datos_${timestamp}`;
    
    if (format === 'json') {
        RecuEduData.exportJSON(data, `${filename}.json`);
    } else {
        RecuEduData.exportCSV(data, `${filename}.csv`);
    }
    
    console.log(`✅ Datos exportados como ${format.toUpperCase()}`);
}

// Ejemplo de uso:
// <button onclick="exportProcessedData(misDatos, 'csv')">Exportar CSV</button>
// <button onclick="exportProcessedData(misDatos, 'json')">Exportar JSON</button>

// ==================== EJEMPLO 5: GUARDAR RESULTADOS ====================
// Guarda los resultados procesados de tu app en el storage compartido

function saveAppResults(data, baseName = 'mi-app') {
    const timestamp = Date.now();
    const name = `${baseName}-${timestamp}`;
    
    RecuEduData.storage.saveDataset(name, data, {
        source: 'mi-aplicacion',
        description: 'Resultados procesados',
        appVersion: '1.0'
    });
    
    console.log(`✅ Resultados guardados como: ${name}`);
    alert(`Dataset guardado exitosamente: ${name}`);
}

// ==================== EJEMPLO 6: SINCRONIZACIÓN ENTRE APPS ====================
// Sistema simple de sincronización usando eventos de storage

// En App A (que guarda datos):
function shareDataBetweenApps(data, eventName = 'dataUpdated') {
    // Guardar dataset
    const name = `shared_${Date.now()}`;
    RecuEduData.storage.saveDataset(name, data, {
        source: 'app_a',
        sharedAt: new Date().toISOString()
    });
    
    // Notificar cambio (solo funciona entre pestañas del mismo dominio)
    localStorage.setItem('recueduLabs_lastUpdate', name);
    
    return name;
}

// En App B (que escucha cambios):
window.addEventListener('storage', (e) => {
    if (e.key === 'recueduLabs_lastUpdate' && e.newValue) {
        const datasetName = e.newValue;
        const dataset = RecuEduData.storage.loadDataset(datasetName);
        
        if (dataset) {
            console.log('🔄 Datos actualizados desde otra app');
            processLoadedData(dataset.data);
        }
    }
});

// ==================== EJEMPLO 7: VALIDACIÓN AVANZADA ====================
// Valida estructura de datos antes de procesar

function validateDataStructure(data, requiredColumns = []) {
    if (!Array.isArray(data) || data.length === 0) {
        return { valid: false, error: 'Datos vacíos o inválidos' };
    }
    
    const columns = Object.keys(data[0]);
    
    // Verificar columnas requeridas
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    if (missingColumns.length > 0) {
        return { 
            valid: false, 
            error: `Columnas faltantes: ${missingColumns.join(', ')}` 
        };
    }
    
    // Validar que todas las filas tengan la misma estructura
    const inconsistentRows = data.filter(row => {
        const rowCols = Object.keys(row);
        return rowCols.length !== columns.length;
    });
    
    if (inconsistentRows.length > 0) {
        return { 
            valid: false, 
            error: `${inconsistentRows.length} filas con estructura inconsistente` 
        };
    }
    
    return { valid: true };
}

// Uso:
/*
const validation = validateDataStructure(myData, ['nombre', 'edad', 'satisfaccion']);
if (!validation.valid) {
    alert('Error: ' + validation.error);
} else {
    processLoadedData(myData);
}
*/

// ==================== EJEMPLO 8: PREVIEW RÁPIDO ====================
// Muestra información rápida de un dataset

function showDatasetPreview(datasetName) {
    const dataset = RecuEduData.storage.loadDataset(datasetName);
    
    if (!dataset) {
        console.error('Dataset no encontrado');
        return;
    }
    
    const info = RecuEduData.getDataInfo(dataset.data);
    
    console.log(`
📊 PREVIEW: ${datasetName}
${'='.repeat(50)}
Filas: ${info.rowCount}
Columnas: ${info.columnCount}
Fuente: ${dataset.metadata?.source || 'Desconocido'}
Guardado: ${new Date(dataset.metadata?.savedAt).toLocaleString('es-ES')}

COLUMNAS:
${Object.entries(info.columns).map(([col, stats]) => `
  • ${col}
    - Tipo: ${stats.isNumeric ? 'Numérico' : 'Texto'}
    - Valores únicos: ${stats.uniqueValues}
    - Faltantes: ${stats.missingValues}
    ${stats.isNumeric ? `- Rango: ${stats.min} - ${stats.max}\n    - Promedio: ${stats.avg}` : ''}
`).join('\n')}

PRIMERAS 3 FILAS:
${JSON.stringify(dataset.data.slice(0, 3), null, 2)}
    `);
}

// ==================== EJEMPLO 9: BÚSQUEDA EN DATASETS ====================
// Busca un valor específico en todos los datasets guardados

function searchInDatasets(searchTerm) {
    const datasets = RecuEduData.storage.listDatasets();
    const results = [];
    
    Object.keys(datasets).forEach(name => {
        const dataset = datasets[name];
        const matches = dataset.data.filter(row => 
            Object.values(row).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        
        if (matches.length > 0) {
            results.push({
                dataset: name,
                matchCount: matches.length,
                matches: matches
            });
        }
    });
    
    return results;
}

// Uso:
// const results = searchInDatasets('María');
// console.log('Encontrado en:', results);

// ==================== EJEMPLO 10: LIMPIAR STORAGE ====================
// Funciones de mantenimiento del storage

function cleanupOldDatasets(daysOld = 30) {
    const datasets = RecuEduData.storage.listDatasets();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deleted = 0;
    
    Object.keys(datasets).forEach(name => {
        const savedAt = new Date(datasets[name].metadata.savedAt);
        if (savedAt < cutoffDate) {
            RecuEduData.storage.deleteDataset(name);
            deleted++;
        }
    });
    
    console.log(`🗑️ ${deleted} datasets antiguos eliminados`);
}

function getStorageSize() {
    const datasets = RecuEduData.storage.listDatasets();
    const jsonString = JSON.stringify(datasets);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    
    console.log(`💾 Tamaño del storage: ${sizeInKB} KB (${sizeInMB} MB)`);
    return sizeInBytes;
}

// ==================== NOTAS DE IMPLEMENTACIÓN ====================
/*

PARA USAR EN TUS APPS:

1. Incluye la biblioteca en tu HTML:
   <script src="../data-processor/recuedu-data-lib.js"></script>

2. Verifica que esté cargada:
   console.log('RecuEdu Data Library:', RecuEduData.version);

3. Usa las funciones según necesites:
   - Para cargar datos: createDatasetSelector() o showDatasetModal()
   - Para procesar: processLoadedData()
   - Para guardar: saveAppResults()

4. Manejo de errores:
   Siempre valida que los datos existan antes de procesarlos:
   
   if (!data || data.length === 0) {
       console.error('No hay datos');
       return;
   }

5. Performance:
   Para datasets grandes (>1000 filas), considera:
   - Mostrar solo las primeras filas en previsualización
   - Procesar en chunks si es necesario
   - Usar workers para cálculos pesados

6. Storage limits:
   localStorage tiene límite ~5-10MB dependiendo del navegador
   Usa getStorageSize() para monitorear uso

*/
