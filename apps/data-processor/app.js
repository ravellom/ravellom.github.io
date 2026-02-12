/**
 * RecuEdu Labs - Data Processor App
 * Main application logic for survey data processing
 */

(function() {
    'use strict';

    // ==================== STATE ====================
    let originalData = null;
    let currentData = null;
    let dataSource = null;
    let modifiedTime = null;

    // ==================== DOM ELEMENTS ====================
    const elements = {
        // Upload & Input
        fileUpload: document.getElementById('file-upload'),
        btnUploadTrigger: document.getElementById('btn-upload-trigger'),
        csvInput: document.getElementById('csv-input'),
        btnLoadCSV: document.getElementById('btn-load-csv'),
        sourceType: document.getElementById('source-type'),
        delimiterType: document.getElementById('delimiter-type'),

        // Views
        welcomeScreen: document.getElementById('welcome-screen'),
        dataView: document.getElementById('data-view'),
        tableView: document.getElementById('table-view'),
        jsonView: document.getElementById('json-view'),

        // Export & Save
        btnExportJSON: document.getElementById('btn-export-json'),
        btnExportCSV: document.getElementById('btn-export-csv'),
        btnSaveDataset: document.getElementById('btn-save-dataset'),

        // Transform controls
        likertColumns: document.getElementById('likert-columns'),
        likertMin: document.getElementById('likert-min'),
        likertMax: document.getElementById('likert-max'),
        btnNormalizeLikert: document.getElementById('btn-normalize-likert'),
        
        textLikertColumns: document.getElementById('text-likert-columns'),
        btnTextToNumber: document.getElementById('btn-text-to-number'),
        
        avgColumns: document.getElementById('avg-columns'),
        avgColumnName: document.getElementById('avg-column-name'),
        btnCalculateAvg: document.getElementById('btn-calculate-avg'),
        
        selectColumns: document.getElementById('select-columns'),
        btnSelectColumns: document.getElementById('btn-select-columns'),

        // Clean controls
        btnRemoveNulls: document.getElementById('btn-remove-nulls'),
        btnFillNA: document.getElementById('btn-fill-na'),
        btnRemoveDuplicates: document.getElementById('btn-remove-duplicates'),
        btnTrimValues: document.getElementById('btn-trim-values'),
        btnResetData: document.getElementById('btn-reset-data'),

        // View toggles
        btnViewTable: document.getElementById('btn-view-table'),
        btnViewJSON: document.getElementById('btn-view-json'),

        // Storage
        savedDatasetsList: document.getElementById('saved-datasets-list'),
        btnRefreshDatasets: document.getElementById('btn-refresh-datasets'),

        // Modals
        helpModal: document.getElementById('help-modal'),
        btnHelp: document.getElementById('btn-help'),
        btnCloseHelp: document.getElementById('btn-close-help'),
        
        saveModal: document.getElementById('save-modal'),
        btnCloseSave: document.getElementById('btn-close-save'),
        btnCancelSave: document.getElementById('btn-cancel-save'),
        btnConfirmSave: document.getElementById('btn-confirm-save'),
        datasetName: document.getElementById('dataset-name'),
        datasetDescription: document.getElementById('dataset-description')
    };

    function getDataApi() {
        if (typeof window !== 'undefined' && window.RecuEduData) {
            return window.RecuEduData;
        }
        if (typeof RecuEduData !== 'undefined') {
            return RecuEduData;
        }
        return null;
    }

    // ==================== INITIALIZATION ====================
    function init() {
        attachEventListeners();
        setupSidebarNavigation();
        setupPanelResizer();
        refreshSavedDatasets();
        showStatus('👋 Listo para procesar datos', 'info');
    }

    // ==================== PANEL RESIZER ====================
    function setupPanelResizer() {
        const resizer = document.getElementById('panel-resizer');
        const optionsPanel = document.getElementById('options-panel');
        const workspace = document.querySelector('.workspace-new');
        
        if (!resizer || !optionsPanel || !workspace) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = optionsPanel.offsetWidth;
            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const delta = e.clientX - startX;
            const newWidth = Math.max(280, Math.min(window.innerWidth * 0.5, startWidth + delta));
            
            // Actualizar el grid-template-columns del workspace
            workspace.style.gridTemplateColumns = `120px ${newWidth}px 4px 1fr`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    // ==================== SIDEBAR NAVIGATION ====================
    function setupSidebarNavigation() {
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        const optionContents = document.querySelectorAll('.option-content');

        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPanel = item.dataset.panel;

                // Actualizar sidebar activo
                sidebarItems.forEach(si => si.classList.remove('active'));
                item.classList.add('active');

                // Actualizar contenido del panel
                optionContents.forEach(content => {
                    if (content.dataset.content === targetPanel) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });

                // Si es el panel de info, actualizar estadísticas
                if (targetPanel === 'info' && currentData) {
                    updateColumnInfoSidebar();
                }
            });
        });
    }

    function updateColumnInfoSidebar() {
        const container = document.getElementById('columns-stats-sidebar');
        if (!container || !currentData || !Array.isArray(currentData) || currentData.length === 0) {
            if (container) container.innerHTML = '<p class="helper-text">No hay datos cargados</p>';
            return;
        }

        const dataApi = getDataApi();
        if (!dataApi) {
            console.warn('⚠️ RecuEduData no está disponible');
            container.innerHTML = '<p class="helper-text">Error: biblioteca no cargada</p>';
            return;
        }

        const columns = Object.keys(currentData[0]);
        let html = '';

        columns.forEach(col => {
            const values = currentData.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
            const uniqueCount = new Set(values).size;
            const nullCount = currentData.length - values.length;
            const sampleValue = values[0] !== undefined ? values[0] : 'N/A';
            const isNumeric = values.every(v => !isNaN(parseFloat(v)) && isFinite(v));

            html += `
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #3b82f6;">
                    <h4 style="font-size: 0.9rem; color: #0f172a; margin-bottom: 6px; font-weight: 600;">${escapeHtml(col)}</h4>
                    <div style="font-size: 0.75rem; color: #64748b; line-height: 1.6;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span>Tipo:</span>
                            <strong style="color: #0f172a;">${isNumeric ? 'Numérico' : 'Texto'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span>Únicos:</span>
                            <strong style="color: #0f172a;">${uniqueCount}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span>Vacíos:</span>
                            <strong style="color: ${nullCount > 0 ? '#ef4444' : '#10b981'};">${nullCount}</strong>
                        </div>
                        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                            <span>Ejemplo:</span>
                            <div style="background: white; padding: 4px 6px; border-radius: 4px; margin-top: 4px; word-break: break-word; font-family: monospace; font-size: 0.7rem;">
                                ${escapeHtml(String(sampleValue).substring(0, 50))}${String(sampleValue).length > 50 ? '...' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function attachEventListeners() {
        // Upload
        if (elements.btnUploadTrigger && elements.fileUpload) {
            elements.btnUploadTrigger.addEventListener('click', () => elements.fileUpload.click());
            elements.fileUpload.addEventListener('change', handleFileUpload);
        }
        if (elements.btnLoadCSV) {
            elements.btnLoadCSV.addEventListener('click', handleCSVInput);
        }

        // Export & Save
        if (elements.btnExportJSON) {
            elements.btnExportJSON.addEventListener('click', exportJSON);
        }
        if (elements.btnExportCSV) {
            elements.btnExportCSV.addEventListener('click', exportCSV);
        }
        if (elements.btnSaveDataset) {
            elements.btnSaveDataset.addEventListener('click', () => openSaveModal());
        }

        // Transform
        if (elements.btnNormalizeLikert) {
            elements.btnNormalizeLikert.addEventListener('click', applyNormalizeLikert);
        }
        if (elements.btnTextToNumber) {
            elements.btnTextToNumber.addEventListener('click', applyTextToNumber);
        }
        if (elements.btnCalculateAvg) {
            elements.btnCalculateAvg.addEventListener('click', applyCalculateAverage);
        }
        if (elements.btnSelectColumns) {
            elements.btnSelectColumns.addEventListener('click', applySelectColumns);
        }

        // Clean
        if (elements.btnRemoveNulls) {
            elements.btnRemoveNulls.addEventListener('click', () => applyClean('removeNulls'));
        }
        if (elements.btnFillNA) {
            elements.btnFillNA.addEventListener('click', () => applyClean('fillNA'));
        }
        if (elements.btnRemoveDuplicates) {
            elements.btnRemoveDuplicates.addEventListener('click', () => applyClean('removeDuplicates'));
        }
        if (elements.btnTrimValues) {
            elements.btnTrimValues.addEventListener('click', () => applyClean('trim'));
        }
        if (elements.btnResetData) {
            elements.btnResetData.addEventListener('click', resetData);
        }

        // View toggles
        if (elements.btnViewTable) {
            elements.btnViewTable.addEventListener('click', () => switchView('table'));
        }
        if (elements.btnViewJSON) {
            elements.btnViewJSON.addEventListener('click', () => switchView('json'));
        }

        // Storage
        if (elements.btnRefreshDatasets) {
            elements.btnRefreshDatasets.addEventListener('click', refreshSavedDatasets);
        }

        // Modals
        if (elements.btnHelp) {
            elements.btnHelp.addEventListener('click', () => openModal(elements.helpModal));
        }
        if (elements.btnCloseHelp) {
            elements.btnCloseHelp.addEventListener('click', () => closeModal(elements.helpModal));
        }
        if (elements.btnCloseSave) {
            elements.btnCloseSave.addEventListener('click', () => closeModal(elements.saveModal));
        }
        if (elements.btnCancelSave) {
            elements.btnCancelSave.addEventListener('click', () => closeModal(elements.saveModal));
        }
        if (elements.btnConfirmSave) {
            elements.btnConfirmSave.addEventListener('click', saveDatasetConfirm);
        }

        // Close modals on outside click
        [elements.helpModal, elements.saveModal].filter(modal => modal).forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });
    }

    // ==================== FILE HANDLING ====================
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'xlsx' || extension === 'xls') {
            // Verificar si SheetJS está disponible
            if (typeof XLSX === 'undefined') {
                showStatus('⚠️ Para archivos Excel, incluye SheetJS. Ver consola para instrucciones.', 'warning');
                console.error(`
❌ SheetJS no está cargado

Para usar archivos Excel (.xlsx/.xls), añade esta línea en el <head> de index.html:

<script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>

Alternativamente, exporta tu archivo como CSV desde Excel/MS Forms.
                `);
                event.target.value = '';
                return;
            }
            
            handleExcelFile(file);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;

                if (extension === 'json') {
                    try {
                        const jsonData = JSON.parse(content);
                        loadData(jsonData, 'json', file.name);
                    } catch (err) {
                        showStatus('❌ Error: archivo JSON inválido', 'error');
                    }
                } else if (extension === 'csv') {
                    processCSVContent(content, file.name);
                } else {
                    showStatus('❌ Formato no soportado. Usa CSV, JSON o XLSX', 'error');
                }
            };
            reader.readAsText(file);
        }
        
        event.target.value = ''; // Reset input
    }

    function handleExcelFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Leer la primera hoja
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convertir a JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    showStatus('❌ El archivo Excel está vacío', 'error');
                    return;
                }
                
                loadData(jsonData, 'ms_forms_xlsx', file.name);
                showStatus(`✅ Archivo Excel cargado: ${jsonData.length} filas`, 'success');
                
            } catch (err) {
                console.error(err);
                showStatus('❌ Error al leer archivo Excel: ' + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function handleCSVInput() {
        const content = elements.csvInput.value.trim();
        if (!content) {
            showStatus('⚠️ Pega datos CSV primero', 'warning');
            return;
        }
        processCSVContent(content);
    }

    function processCSVContent(content, filename = 'manual input') {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }

        const sourceType = elements.sourceType.value;
        const delimiterSetting = elements.delimiterType.value;
        let parsedData;
        let detectedSource = sourceType;
        let detectedDelimiter = null;

        try {
            if (sourceType === 'auto') {
                detectedSource = dataApi.detectSource(content, filename);
            }

            // Preparar opciones de parseo
            const parseOptions = {};
            if (delimiterSetting !== 'auto') {
                parseOptions.delimiter = delimiterSetting;
                detectedDelimiter = delimiterSetting;
                console.log(`Usando delimitador especificado: "${delimiterSetting}"`);
            } else {
                // Detectar automáticamente
                detectedDelimiter = dataApi.detectDelimiter(content);
                console.log(`Delimitador auto-detectado: "${detectedDelimiter}"`);
            }

            switch (detectedSource) {
                case 'google_forms':
                    parsedData = dataApi.parseGoogleForms(content, parseOptions);
                    break;
                case 'ms_forms':
                    parsedData = dataApi.parseMSForms(content, parseOptions);
                    break;
                case 'json':
                    parsedData = JSON.parse(content);
                    break;
                default:
                    parsedData = dataApi.parseCSV(content, parseOptions);
            }

            // Añadir info sobre el delimitador al mensaje de carga
            const delimiterName = {
                ',': 'coma',
                ';': 'punto y coma',
                '\t': 'tabulador',
                '|': 'barra vertical'
            }[detectedDelimiter] || detectedDelimiter;

            loadData(parsedData, detectedSource, filename, delimiterName);
        } catch (err) {
            console.error(err);
            showStatus('❌ Error al parsear datos: ' + err.message, 'error');
        }
    }

    function loadData(data, source, filename = '', delimiter = null) {
        console.log('📥 Cargando datos...', { rows: data.length, source, filename });
        
        if (!Array.isArray(data) || data.length === 0) {
            showStatus('❌ Datos vacíos o formato inválido', 'error');
            return;
        }

        originalData = JSON.parse(JSON.stringify(data));
        currentData = JSON.parse(JSON.stringify(data));
        dataSource = source;
        modifiedTime = new Date();

        console.log('🔄 Actualizando UI...');
        showDataView();
        populateColumnSelectors();
        updateTable();
        updateStats();
        updateColumnInfo();
        enableControls();
        console.log('✅ Datos cargados completamente');

        const sourceNames = {
            'google_forms': 'Google Forms',
            'ms_forms': 'Microsoft Forms',
            'ms_forms_xlsx': 'Microsoft Forms (Excel)',
            'generic_csv': 'CSV Genérico',
            'json': 'JSON'
        };

        const sourceName = sourceNames[source] || source;
        let statusMsg = `✅ ${data.length} filas cargadas desde ${sourceName}`;
        
        if (delimiter) {
            statusMsg += ` (delimitador: ${delimiter})`;
        }
        
        showStatus(statusMsg, 'success');
    }

    // ==================== UI UPDATES ====================
    function showDataView() {
        elements.welcomeScreen.classList.add('hidden');
        elements.dataView.classList.remove('hidden');
    }

    function updateTable() {
        if (!currentData || currentData.length === 0) return;

        const headers = Object.keys(currentData[0]);
        
        // Update table head
        const thead = document.getElementById('table-head');
        thead.innerHTML = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;

        // Update table body (limit to first 100 rows for performance)
        const tbody = document.getElementById('table-body');
        const displayData = currentData.slice(0, 100);
        tbody.innerHTML = displayData.map(row => 
            `<tr>${headers.map(h => `<td>${escapeHtml(String(row[h] || ''))}</td>`).join('')}</tr>`
        ).join('');

        if (currentData.length > 100) {
            tbody.innerHTML += `<tr><td colspan="${headers.length}" style="text-align: center; color: var(--text-secondary); font-style: italic;">Mostrando primeras 100 filas de ${currentData.length}</td></tr>`;
        }

        // Update JSON view
        const jsonPreview = document.getElementById('json-preview');
        jsonPreview.textContent = JSON.stringify(currentData, null, 2);
    }

    function updateStats() {
        if (!currentData || currentData.length === 0) return;

        document.getElementById('stat-rows').textContent = currentData.length;
        document.getElementById('stat-columns').textContent = Object.keys(currentData[0]).length;
        document.getElementById('stat-source').textContent = dataSource || '-';
        document.getElementById('stat-modified').textContent = modifiedTime ? formatTime(modifiedTime) : 'Ahora';
    }

    function updateColumnInfo() {
        if (!currentData || currentData.length === 0) return;
        const dataApi = getDataApi();
        if (!dataApi) {
            console.warn('⚠️ RecuEduData no está disponible todavía');
            return;
        }

        const info = dataApi.getDataInfo(currentData);
        const container = document.getElementById('columns-stats');
        
        // El contenedor columns-stats ya no existe en el nuevo layout
        // La info de columnas ahora se muestra en el panel lateral "Info"
        if (!container) {
            console.log('ℹ️ columns-stats container not found (esto es normal en el nuevo layout)');
            return;
        }
        
        container.innerHTML = Object.entries(info.columns).map(([col, stats]) => `
            <div class="column-stat">
                <h4>
                    <i class="ph ph-${stats.isNumeric ? 'number-circle-one' : 'text-aa'}"></i>
                    ${escapeHtml(col)}
                    ${stats.isNumeric ? '<span class="badge-numeric">NUM</span>' : ''}
                </h4>
                <div class="stat-row">
                    <span>Valores:</span>
                    <strong>${stats.totalValues} / ${currentData.length}</strong>
                </div>
                <div class="stat-row">
                    <span>Faltantes:</span>
                    <strong>${stats.missingValues}</strong>
                </div>
                <div class="stat-row">
                    <span>Únicos:</span>
                    <strong>${stats.uniqueValues}</strong>
                </div>
                ${stats.isNumeric ? `
                    <div class="stat-row">
                        <span>Rango:</span>
                        <strong>${stats.min} - ${stats.max}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Promedio:</span>
                        <strong>${stats.avg}</strong>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    function populateColumnSelectors() {
        if (!currentData || currentData.length === 0) return;

        const columns = Object.keys(currentData[0]);
        
        // Generar checkboxes para cada selector
        const generateCheckboxes = (cols) => cols.map(col => `
            <label style="display: flex; align-items: center; padding: 4px 0; cursor: pointer; font-size: 0.85rem;">
                <input type="checkbox" value="${escapeHtml(col)}" style="margin-right: 8px; cursor: pointer;">
                <span style="word-break: break-word;">${escapeHtml(col)}</span>
            </label>
        `).join('');

        elements.likertColumns.innerHTML = generateCheckboxes(columns);
        elements.textLikertColumns.innerHTML = generateCheckboxes(columns);
        elements.avgColumns.innerHTML = generateCheckboxes(columns);
        elements.selectColumns.innerHTML = generateCheckboxes(columns);

        // Populate rename inputs
        const renameContainer = document.getElementById('rename-inputs');
        renameContainer.innerHTML = columns.map(col => `
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 6px; align-items: center; margin-bottom: 8px;">
                <input type="text" class="input-field" value="${escapeHtml(col)}" readonly style="background: #f1f5f9; font-size: 0.8rem;">
                <i class="ph ph-arrow-right" style="color: var(--text-secondary);"></i>
                <input type="text" class="input-field rename-target" data-original="${escapeHtml(col)}" placeholder="Nuevo nombre" style="font-size: 0.8rem;">
            </div>
        `).join('');

        // Attach rename handler
        document.getElementById('btn-apply-rename').addEventListener('click', applyRenameColumns);
    }
    
    // Función auxiliar para obtener columnas seleccionadas de checkboxes
    function getSelectedColumns(container) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    function enableControls() {
        console.log('🔓 Activando controles de exportación...');
        console.log('btnExportJSON:', elements.btnExportJSON);
        console.log('btnExportCSV:', elements.btnExportCSV);
        console.log('btnSaveDataset:', elements.btnSaveDataset);
        
        if (elements.btnExportJSON) {
            elements.btnExportJSON.disabled = false;
            elements.btnExportJSON.title = 'Descargar datos en formato JSON';
        }
        if (elements.btnExportCSV) {
            elements.btnExportCSV.disabled = false;
            elements.btnExportCSV.title = 'Descargar datos en formato CSV';
        }
        if (elements.btnSaveDataset) {
            elements.btnSaveDataset.disabled = false;
            elements.btnSaveDataset.title = 'Guardar en localStorage compartido';
        }
        console.log('✅ Controles activados');
    }

    function switchView(view) {
        if (!elements.tableView || !elements.jsonView) return;
        
        if (view === 'table') {
            elements.tableView.classList.remove('hidden');
            elements.jsonView.classList.add('hidden');
            if (elements.btnViewTable) elements.btnViewTable.classList.add('active');
            if (elements.btnViewJSON) elements.btnViewJSON.classList.remove('active');
        } else {
            elements.tableView.classList.add('hidden');
            elements.jsonView.classList.remove('hidden');
            if (elements.btnViewTable) elements.btnViewTable.classList.remove('active');
            if (elements.btnViewJSON) elements.btnViewJSON.classList.add('active');
        }
    }

    // ==================== TRANSFORMATIONS ====================
    function applyNormalizeLikert() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }

        const columns = getSelectedColumns(elements.likertColumns);
        if (columns.length === 0) {
            showStatus('⚠️ Selecciona al menos una columna', 'warning');
            return;
        }

        const min = parseInt(elements.likertMin.value) || 1;
        const max = parseInt(elements.likertMax.value) || 5;

        // Verificar que las columnas tengan datos numéricos
        const numericCheck = columns.map(col => {
            const values = currentData
                .map(row => parseFloat(row[col]))
                .filter(v => !isNaN(v));
            return { col, count: values.length, total: currentData.length };
        });

        console.log('Verificación de columnas numéricas:', numericCheck);

        currentData = dataApi.normalizeLikert(currentData, columns, min, max);
        modifiedTime = new Date();
        
        updateTable();
        updateStats();
        updateColumnInfo();
        
        const totalNumeric = numericCheck.reduce((sum, c) => sum + c.count, 0);
        showStatus(`✅ Escalas normalizadas ${min}-${max} (${columns.length} columnas, ${totalNumeric} valores procesados)`, 'success');
        
        console.log('Datos normalizados (primeras 5 filas):', currentData.slice(0, 5));
    }

    function applyTextToNumber() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }

        const columns = getSelectedColumns(elements.textLikertColumns);
        if (columns.length === 0) {
            showStatus('⚠️ Selecciona al menos una columna', 'warning');
            return;
        }
        
        // Contar valores convertidos
        let convertedCount = 0;
        const beforeConversion = JSON.parse(JSON.stringify(currentData));
        
        currentData = dataApi.likertTextToNumber(currentData, columns);
        
        // Contar cuántos valores se convirtieron
        columns.forEach(col => {
            currentData.forEach((row, i) => {
                if (beforeConversion[i][col] !== row[col] && typeof row[col] === 'number') {
                    convertedCount++;
                }
            });
        });
        
        modifiedTime = new Date();
        
        updateTable();
        updateStats();
        updateColumnInfo();
        
        if (convertedCount > 0) {
            showStatus(`✅ ${convertedCount} valores convertidos de texto a números`, 'success');
        } else {
            showStatus('⚠️ No se encontraron valores de texto Likert para convertir', 'warning');
        }
        
        console.log('Conversión completada:', { columnas: columns, convertidos: convertedCount });
    }

    function applyCalculateAverage() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }

        const columns = getSelectedColumns(elements.avgColumns);
        const newColName = elements.avgColumnName.value.trim();

        if (columns.length === 0) {
            showStatus('⚠️ Selecciona columnas para promediar', 'warning');
            return;
        }

        if (!newColName) {
            showStatus('⚠️ Ingresa un nombre para la nueva columna', 'warning');
            return;
        }

        currentData = dataApi.calculateAverage(currentData, columns, newColName);
        modifiedTime = new Date();
        
        populateColumnSelectors();
        updateTable();
        updateStats();
        updateColumnInfo();
        elements.avgColumnName.value = '';
        showStatus(`✅ Promedio calculado: "${newColName}"`, 'success');
    }

    function applyRenameColumns() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }

        const inputs = document.querySelectorAll('.rename-target');
        const mapping = {};
        let hasChanges = false;

        inputs.forEach(input => {
            const original = input.dataset.original;
            const newName = input.value.trim();
            if (newName && newName !== original) {
                mapping[original] = newName;
                hasChanges = true;
            }
        });

        if (!hasChanges) {
            showStatus('⚠️ No hay cambios para aplicar', 'warning');
            return;
        }

        currentData = dataApi.renameColumns(currentData, mapping);
        modifiedTime = new Date();
        
        populateColumnSelectors();
        updateTable();
        updateStats();
        updateColumnInfo();
        showStatus(`✅ ${Object.keys(mapping).length} columnas renombradas`, 'success');
    }

    function applySelectColumns() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }

        const columns = getSelectedColumns(elements.selectColumns);
        if (columns.length === 0) {
            showStatus('⚠️ Selecciona al menos una columna', 'warning');
            return;
        }

        currentData = dataApi.selectColumns(currentData, columns);
        modifiedTime = new Date();
        
        populateColumnSelectors();
        updateTable();
        updateStats();
        updateColumnInfo();
        showStatus(`✅ ${columns.length} columnas seleccionadas`, 'success');
    }

    // ==================== CLEANING ====================
    function applyClean(operation) {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }

        const originalLength = currentData.length;

        switch (operation) {
            case 'removeNulls':
                currentData = dataApi.removeNullRows(currentData);
                break;
            case 'fillNA':
                currentData = dataApi.fillNA(currentData, '0');
                break;
            case 'removeDuplicates':
                currentData = dataApi.removeDuplicates(currentData);
                break;
            case 'trim':
                currentData = dataApi.trimValues(currentData);
                break;
        }

        modifiedTime = new Date();
        const rowsAffected = originalLength - currentData.length;
        
        updateTable();
        updateStats();
        updateColumnInfo();
        
        const messages = {
            removeNulls: `✅ ${rowsAffected} filas eliminadas`,
            fillNA: '✅ Valores vacíos rellenados con 0',
            removeDuplicates: `✅ ${rowsAffected} duplicados eliminados`,
            trim: '✅ Espacios limpiados'
        };
        
        showStatus(messages[operation], 'success');
    }

    function resetData() {
        if (!originalData) return;
        
        if (confirm('¿Restaurar los datos originales? Se perderán todos los cambios.')) {
            currentData = JSON.parse(JSON.stringify(originalData));
            modifiedTime = new Date();
            
            updateTable();
            updateStats();
            updateColumnInfo();
            showStatus('🔄 Datos restaurados al original', 'info');
        }
    }

    // ==================== EXPORT ====================
    function exportJSON() {
        if (!currentData) return;
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }
        
        const filename = `data_${Date.now()}.json`;
        dataApi.exportJSON(currentData, filename);
        showStatus('📥 JSON descargado', 'success');
    }

    function exportCSV() {
        if (!currentData) return;
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus('⚠️ Biblioteca de procesamiento no cargada todavía', 'warning');
            return;
        }
        
        const filename = `data_${Date.now()}.csv`;
        dataApi.exportCSV(currentData, filename);
        showStatus('📥 CSV descargado', 'success');
    }

    // ==================== STORAGE ====================
    function refreshSavedDatasets() {
        const container = elements.savedDatasetsList;
        if (!container) return;

        const dataApi = getDataApi();
        if (!dataApi || !dataApi.storage) {
            container.innerHTML = '<p class="helper-text">Storage no disponible</p>';
            return;
        }

        const datasets = dataApi.storage.getDatasetsInfo();

        if (datasets.length === 0) {
            container.innerHTML = '<p class="helper-text">No hay datasets guardados</p>';
            return;
        }

        container.innerHTML = datasets.map(ds => `
            <div class="dataset-card" data-name="${escapeHtml(ds.name)}">
                <h4>
                    <i class="ph ph-database"></i>
                    ${escapeHtml(ds.name)}
                </h4>
                <p>${ds.rowCount} filas • ${ds.source || 'Desconocido'}</p>
                <p style="font-size: 0.7rem;">Guardado: ${formatTime(new Date(ds.savedAt))}</p>
                <div class="dataset-actions">
                    <button class="btn-icon btn-load" title="Cargar dataset">
                        <i class="ph ph-upload"></i> Cargar
                    </button>
                    <button class="btn-icon btn-delete" title="Eliminar">
                        <i class="ph ph-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        // Attach event listeners
        container.querySelectorAll('.btn-load').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.closest('.dataset-card').dataset.name;
                loadDatasetFromStorage(name);
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.closest('.dataset-card').dataset.name;
                deleteDatasetFromStorage(name);
            });
        });
    }

    function loadDatasetFromStorage(name) {
        const dataApi = getDataApi();
        if (!dataApi || !dataApi.storage) {
            showStatus('⚠️ Storage no disponible', 'warning');
            return;
        }

        const dataset = dataApi.storage.loadDataset(name);
        if (!dataset) {
            showStatus('❌ Dataset no encontrado', 'error');
            return;
        }

        loadData(dataset.data, dataset.metadata?.source || 'storage', name);
        showStatus(`✅ Dataset "${name}" cargado desde storage`, 'success');
    }

    function deleteDatasetFromStorage(name) {
        const dataApi = getDataApi();
        if (!dataApi || !dataApi.storage) {
            showStatus('⚠️ Storage no disponible', 'warning');
            return;
        }

        if (confirm(`¿Eliminar el dataset "${name}"?`)) {
            dataApi.storage.deleteDataset(name);
            refreshSavedDatasets();
            showStatus(`🗑️ Dataset "${name}" eliminado`, 'info');
        }
    }

    function openSaveModal() {
        if (!currentData) return;
        
        elements.datasetName.value = '';
        elements.datasetDescription.value = '';
        openModal(elements.saveModal);
    }

    function saveDatasetConfirm() {
        const dataApi = getDataApi();
        if (!dataApi || !dataApi.storage) {
            showStatus('⚠️ Storage no disponible', 'warning');
            return;
        }

        const name = elements.datasetName.value.trim();
        if (!name) {
            alert('Ingresa un nombre para el dataset');
            return;
        }

        const description = elements.datasetDescription.value.trim();
        
        dataApi.storage.saveDataset(name, currentData, {
            source: dataSource,
            description,
            rowCount: currentData.length,
            columnCount: Object.keys(currentData[0]).length
        });

        closeModal(elements.saveModal);
        refreshSavedDatasets();
        showStatus(`💾 Dataset "${name}" guardado en storage compartido`, 'success');
    }

    // ==================== MODALS ====================
    function openModal(modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    // ==================== UTILITIES ====================
    function showStatus(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Could add a toast notification here
        const statusMsg = document.getElementById('status-msg');
        if (statusMsg) {
            statusMsg.textContent = message;
            statusMsg.className = `status-msg status-${type}`;
            setTimeout(() => {
                statusMsg.textContent = '';
            }, 5000);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days < 7) return `Hace ${days}d`;
        
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    // ==================== START APP ====================
    init();
})();
