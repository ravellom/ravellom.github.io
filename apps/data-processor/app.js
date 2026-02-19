/**
 * RecuEdu Labs - Data Processor App
 * Main application logic for survey data processing
 */

(function() {
    'use strict';

    const AppLang = (function detectLang() {
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');
        if (urlLang === 'en' || urlLang === 'es') return urlLang;
        const suiteLang = localStorage.getItem('survey_suite_language');
        if (suiteLang === 'en' || suiteLang === 'es') return suiteLang;
        return 'es';
    })();
    const isEnglish = AppLang === 'en';
    const tr = (es, en) => (isEnglish ? en : es);

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
        applyLanguage(AppLang);
        attachEventListeners();
        setupSidebarNavigation();
        setupPanelResizer();
        refreshSavedDatasets();
        showStatus(AppLang === 'en' ? 'Ready to process data' : '👋 Listo para procesar datos', 'info');
    }

    function applyLanguage(lang) {
        if (lang !== 'en') return;

        document.documentElement.lang = 'en';
        document.title = 'Survey Data Processor | RecuEdu Labs';

        const setText = (selector, text) => {
            const el = document.querySelector(selector);
            if (!el) return;
            const icon = el.querySelector('i');
            if (icon) {
                el.innerHTML = `${icon.outerHTML} ${text}`;
            } else {
                el.textContent = text;
            }
        };

        setText('.brand h1', 'Data Processor v2.0');
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) subtitle.textContent = 'Cleaning, transformation, and management of survey data';
        setText('.sidebar-item[data-panel="import"] span', 'Import');
        setText('.sidebar-item[data-panel="transform"] span', 'Transform');
        setText('.sidebar-item[data-panel="clean"] span', 'Clean');
        setText('.sidebar-item[data-panel="storage"] span', 'Storage');
        setText('.sidebar-item[data-panel="info"] span', 'Info');
        setText('.topbar-links a[href="../../index.html"] span', 'Home');
        setText('#btn-help', 'Help');
        setText('#btn-export-json', 'Export JSON');
        setText('#btn-export-csv', 'Export CSV');
        setText('#btn-save-dataset', 'Save to Storage');
        setText('#btn-upload-trigger', 'Upload CSV/JSON/XLSX');
        setText('#btn-load-csv', 'Process Data');
        setText('#btn-remove-nulls', 'Remove Empty Rows');
        setText('#btn-fill-na', 'Fill Empty with 0');
        setText('#btn-remove-duplicates', 'Remove Duplicates');
        setText('#btn-trim-values', 'Trim Spaces');
        setText('#btn-reset-data', 'Restore Original');
        setText('#btn-refresh-datasets', 'Refresh List');
        setText('#btn-view-table', 'Table');
        setText('#btn-view-json', 'JSON');
        setText('#btn-confirm-save', 'Save');
        setText('#btn-cancel-save', 'Cancel');

        const importTitle = document.querySelector('.option-content[data-content="import"] h3');
        if (importTitle) importTitle.innerHTML = '<i class="ph ph-upload"></i> Import Data';
        const transformTitle = document.querySelector('.option-content[data-content="transform"] h3');
        if (transformTitle) transformTitle.innerHTML = '<i class="ph ph-magic-wand"></i> Transform Data';
        const cleanTitle = document.querySelector('.option-content[data-content="clean"] h3');
        if (cleanTitle) cleanTitle.innerHTML = '<i class="ph ph-broom"></i> Clean Data';
        const storageTitle = document.querySelector('.option-content[data-content="storage"] h3');
        if (storageTitle) storageTitle.innerHTML = '<i class="ph ph-cloud"></i> Shared Storage';
        const infoTitle = document.querySelector('.option-content[data-content="info"] h3');
        if (infoTitle) infoTitle.innerHTML = '<i class="ph ph-info"></i> Dataset Info';

        const importHelper = document.querySelector('.option-content[data-content="import"] .helper-text');
        if (importHelper) importHelper.textContent = 'Or paste CSV data here:';
        if (elements.csvInput) {
            elements.csvInput.placeholder = 'Paste your CSV data here...\n\nname,age,response\nAna,25,Yes\nLuis,30,No';
        }
        const delimiterLabel = document.querySelector('label[for="delimiter-type"], .form-group:nth-of-type(1) label');
        if (delimiterLabel) delimiterLabel.innerHTML = '<i class="ph ph-info"></i> CSV delimiter:';
        const sourceLabel = document.querySelector('label[for="source-type"], .form-group:nth-of-type(2) label');
        if (sourceLabel) sourceLabel.innerHTML = '<i class="ph ph-info"></i> Source type:';
        const delimiterSelect = document.getElementById('delimiter-type');
        if (delimiterSelect) {
            delimiterSelect.options[0].text = 'Auto detect';
            delimiterSelect.options[1].text = 'Comma (,)';
            delimiterSelect.options[2].text = 'Semicolon (;)';
            delimiterSelect.options[3].text = 'Tab';
            delimiterSelect.options[4].text = 'Pipe (|)';
        }
        const sourceSelect = document.getElementById('source-type');
        if (sourceSelect) {
            sourceSelect.options[0].text = 'Auto detect';
            sourceSelect.options[3].text = 'Generic CSV';
        }

        document.querySelectorAll('.transform-section summary')[0].innerHTML = '<i class="ph ph-funnel"></i> 1. Select Columns';
        document.querySelectorAll('.transform-section summary')[1].innerHTML = '<i class="ph ph-pencil-simple"></i> 2. Rename Columns';
        document.querySelectorAll('.transform-section summary')[2].innerHTML = '<i class="ph ph-scales"></i> 3. Normalize Likert Scales';
        document.querySelectorAll('.transform-section summary')[3].innerHTML = '<i class="ph ph-text-aa"></i> 4. Likert Text -> Numbers';
        document.querySelectorAll('.transform-section summary')[4].innerHTML = '<i class="ph ph-calculator"></i> 5. Calculate Averages';
        setText('#btn-select-columns', 'Apply Selection');
        setText('#btn-apply-rename', 'Apply Changes');
        setText('#btn-normalize-likert', 'Apply');
        setText('#btn-text-to-number', 'Apply');
        setText('#btn-calculate-avg', 'Calculate');
        if (elements.avgColumnName) elements.avgColumnName.placeholder = 'New column name';
        if (elements.likertMin) elements.likertMin.placeholder = 'Min: 1';
        if (elements.likertMax) elements.likertMax.placeholder = 'Max: 5';

        const storageHelper = document.querySelector('.option-content[data-content="storage"] .helper-text');
        if (storageHelper) storageHelper.textContent = 'Saved datasets available for other RecuEdu Labs apps';

        const welcomeTitle = document.querySelector('#welcome-screen h2');
        if (welcomeTitle) welcomeTitle.textContent = 'Survey Data Processor';
        const welcomeSub = document.querySelector('#welcome-screen p');
        if (welcomeSub) welcomeSub.textContent = 'Upload a CSV/JSON/XLSX file or load data from shared storage';
        const cards = document.querySelectorAll('.feature-card');
        if (cards[0]) {
            cards[0].querySelector('h4').textContent = 'Parse surveys';
            cards[0].querySelector('p').textContent = 'Google Forms, MS Forms (CSV/XLSX), automatic delimiters';
        }
        if (cards[1]) {
            cards[1].querySelector('h4').textContent = 'Clean data';
            cards[1].querySelector('p').textContent = 'Remove empty values, duplicates and outliers';
        }
        if (cards[2]) {
            cards[2].querySelector('h4').textContent = 'Transform';
            cards[2].querySelector('p').textContent = 'Normalize scales, recode, compute averages';
        }
        if (cards[3]) {
            cards[3].querySelector('h4').textContent = 'Shared storage';
            cards[3].querySelector('p').textContent = 'Share data across RecuEdu Labs apps';
        }

        const statsLabels = document.querySelectorAll('.stats-bar .stat-item span');
        if (statsLabels[0]) statsLabels[0].innerHTML = `Rows: <strong id="stat-rows">${document.getElementById('stat-rows')?.textContent || '0'}</strong>`;
        if (statsLabels[1]) statsLabels[1].innerHTML = `Columns: <strong id="stat-columns">${document.getElementById('stat-columns')?.textContent || '0'}</strong>`;
        if (statsLabels[2]) statsLabels[2].innerHTML = `Source: <strong id="stat-source">${document.getElementById('stat-source')?.textContent || '-'}</strong>`;
        if (statsLabels[3]) statsLabels[3].innerHTML = `Modified: <strong id="stat-modified">${document.getElementById('stat-modified')?.textContent || 'Now'}</strong>`;
        const tableTitle = document.querySelector('.table-controls h3');
        if (tableTitle) tableTitle.textContent = 'Data View';

        const helpTitle = document.querySelector('#help-modal .modal-header h3');
        if (helpTitle) helpTitle.innerHTML = '<i class="ph ph-question"></i> User Guide';
        const saveTitle = document.querySelector('#save-modal .modal-header h3');
        if (saveTitle) saveTitle.innerHTML = '<i class="ph ph-floppy-disk"></i> Save Dataset';
        const nameLabel = document.querySelector('label[for="dataset-name"]');
        if (nameLabel) nameLabel.textContent = 'Dataset name:';
        const descLabel = document.querySelector('label[for="dataset-description"]');
        if (descLabel) descLabel.textContent = 'Description (optional):';
        if (elements.datasetName) elements.datasetName.placeholder = 'E.g. satisfaction-survey-2026';
        if (elements.datasetDescription) elements.datasetDescription.placeholder = 'Short dataset description...';
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
            if (container) container.innerHTML = `<p class="helper-text">${tr('No hay datos cargados', 'No data loaded')}</p>`;
            return;
        }

        const dataApi = getDataApi();
        if (!dataApi) {
            console.warn('⚠️ RecuEduData not available');
            container.innerHTML = `<p class="helper-text">${tr('Error: biblioteca no cargada', 'Error: library not loaded')}</p>`;
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
                            <span>${tr('Tipo', 'Type')}:</span>
                            <strong style="color: #0f172a;">${isNumeric ? tr('Numérico', 'Numeric') : tr('Texto', 'Text')}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span>${tr('Únicos', 'Unique')}:</span>
                            <strong style="color: #0f172a;">${uniqueCount}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span>${tr('Vacíos', 'Empty')}:</span>
                            <strong style="color: ${nullCount > 0 ? '#ef4444' : '#10b981'};">${nullCount}</strong>
                        </div>
                        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                            <span>${tr('Ejemplo', 'Sample')}:</span>
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
        window.addEventListener('message', (event) => {
            const data = event?.data;
            if (!data || typeof data !== 'object') return;
            if (data.type === 'survey-suite-set-language' && (data.lang === 'en' || data.lang === 'es')) {
                localStorage.setItem('survey_suite_language', data.lang);
                if (data.lang === 'en') {
                    applyLanguage('en');
                } else {
                    window.location.reload();
                }
            }
        });

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
                showStatus(tr('⚠️ Para archivos Excel, incluye SheetJS. Ver consola para instrucciones.', '⚠️ For Excel files, include SheetJS. See console for instructions.'), 'warning');
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
                        showStatus(tr('❌ Error: archivo JSON inválido', '❌ Error: invalid JSON file'), 'error');
                    }
                } else if (extension === 'csv') {
                    processCSVContent(content, file.name);
                } else {
                    showStatus(tr('❌ Formato no soportado. Usa CSV, JSON o XLSX', '❌ Unsupported format. Use CSV, JSON, or XLSX'), 'error');
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
                    showStatus(tr('❌ El archivo Excel está vacío', '❌ Excel file is empty'), 'error');
                    return;
                }
                
                loadData(jsonData, 'ms_forms_xlsx', file.name);
                showStatus(tr(`✅ Archivo Excel cargado: ${jsonData.length} filas`, `✅ Excel file loaded: ${jsonData.length} rows`), 'success');
                
            } catch (err) {
                console.error(err);
                showStatus(tr('❌ Error al leer archivo Excel: ', '❌ Error reading Excel file: ') + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function handleCSVInput() {
        const content = elements.csvInput.value.trim();
        if (!content) {
            showStatus(tr('⚠️ Pega datos CSV primero', '⚠️ Paste CSV data first'), 'warning');
            return;
        }
        processCSVContent(content);
    }

    function processCSVContent(content, filename = 'manual input') {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
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
                ',': tr('coma', 'comma'),
                ';': tr('punto y coma', 'semicolon'),
                '\t': tr('tabulador', 'tab'),
                '|': tr('barra vertical', 'pipe')
            }[detectedDelimiter] || detectedDelimiter;

            loadData(parsedData, detectedSource, filename, delimiterName);
        } catch (err) {
            console.error(err);
            showStatus(tr('❌ Error parsing data: ', '❌ Error parsing data: ') + err.message, 'error');
        }
    }

    function loadData(data, source, filename = '', delimiter = null) {
        console.log('📥 Cargando datos...', { rows: data.length, source, filename });
        
        if (!Array.isArray(data) || data.length === 0) {
            showStatus(tr('❌ Datos vacíos o formato inválido', '❌ Empty data or invalid format'), 'error');
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
            'generic_csv': tr('CSV Genérico', 'Generic CSV'),
            'json': 'JSON'
        };

        const sourceName = sourceNames[source] || source;
        let statusMsg = tr(`✅ ${data.length} filas cargadas desde ${sourceName}`, `✅ ${data.length} rows loaded from ${sourceName}`);
        
        if (delimiter) {
            statusMsg += tr(` (delimitador: ${delimiter})`, ` (delimiter: ${delimiter})`);
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
            tbody.innerHTML += `<tr><td colspan="${headers.length}" style="text-align: center; color: var(--text-secondary); font-style: italic;">${tr(`Mostrando primeras 100 filas de ${currentData.length}`, `Showing first 100 rows of ${currentData.length}`)}</td></tr>`;
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
        document.getElementById('stat-modified').textContent = modifiedTime ? formatTime(modifiedTime) : tr('Ahora', 'Now');
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
                    <span>${tr('Valores', 'Values')}:</span>
                    <strong>${stats.totalValues} / ${currentData.length}</strong>
                </div>
                <div class="stat-row">
                    <span>${tr('Faltantes', 'Missing')}:</span>
                    <strong>${stats.missingValues}</strong>
                </div>
                <div class="stat-row">
                    <span>${tr('Únicos', 'Unique')}:</span>
                    <strong>${stats.uniqueValues}</strong>
                </div>
                ${stats.isNumeric ? `
                    <div class="stat-row">
                        <span>${tr('Rango', 'Range')}:</span>
                        <strong>${stats.min} - ${stats.max}</strong>
                    </div>
                    <div class="stat-row">
                        <span>${tr('Promedio', 'Average')}:</span>
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
                <input type="text" class="input-field rename-target" data-original="${escapeHtml(col)}" placeholder="${tr('Nuevo nombre', 'New name')}" style="font-size: 0.8rem;">
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
            elements.btnExportJSON.title = tr('Descargar datos en formato JSON', 'Download data as JSON');
        }
        if (elements.btnExportCSV) {
            elements.btnExportCSV.disabled = false;
            elements.btnExportCSV.title = tr('Descargar datos en formato CSV', 'Download data as CSV');
        }
        if (elements.btnSaveDataset) {
            elements.btnSaveDataset.disabled = false;
            elements.btnSaveDataset.title = tr('Guardar en localStorage compartido', 'Save to shared localStorage');
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
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
            return;
        }

        const columns = getSelectedColumns(elements.likertColumns);
        if (columns.length === 0) {
            showStatus(tr('⚠️ Selecciona al menos una columna', '⚠️ Select at least one column'), 'warning');
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
        showStatus(tr(`✅ Escalas normalizadas ${min}-${max} (${columns.length} columnas, ${totalNumeric} valores procesados)`, `✅ Scales normalized ${min}-${max} (${columns.length} columns, ${totalNumeric} values processed)`), 'success');
        
        console.log('Datos normalizados (primeras 5 filas):', currentData.slice(0, 5));
    }

    function applyTextToNumber() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
            return;
        }

        const columns = getSelectedColumns(elements.textLikertColumns);
        if (columns.length === 0) {
            showStatus(tr('⚠️ Selecciona al menos una columna', '⚠️ Select at least one column'), 'warning');
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
            showStatus(tr(`✅ ${convertedCount} valores convertidos de texto a números`, `✅ ${convertedCount} values converted from text to numbers`), 'success');
        } else {
            showStatus(tr('⚠️ No se encontraron valores de texto Likert para convertir', '⚠️ No Likert text values found to convert'), 'warning');
        }
        
        console.log('Conversión completada:', { columnas: columns, convertidos: convertedCount });
    }

    function applyCalculateAverage() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
            return;
        }

        const columns = getSelectedColumns(elements.avgColumns);
        const newColName = elements.avgColumnName.value.trim();

        if (columns.length === 0) {
            showStatus(tr('⚠️ Selecciona columnas para promediar', '⚠️ Select columns to average'), 'warning');
            return;
        }

        if (!newColName) {
            showStatus(tr('⚠️ Ingresa un nombre para la nueva columna', '⚠️ Enter a name for the new column'), 'warning');
            return;
        }

        currentData = dataApi.calculateAverage(currentData, columns, newColName);
        modifiedTime = new Date();
        
        populateColumnSelectors();
        updateTable();
        updateStats();
        updateColumnInfo();
        elements.avgColumnName.value = '';
        showStatus(tr(`✅ Promedio calculado: "${newColName}"`, `✅ Average calculated: "${newColName}"`), 'success');
    }

    function applyRenameColumns() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
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
            showStatus(tr('⚠️ No hay cambios para aplicar', '⚠️ No changes to apply'), 'warning');
            return;
        }

        currentData = dataApi.renameColumns(currentData, mapping);
        modifiedTime = new Date();
        
        populateColumnSelectors();
        updateTable();
        updateStats();
        updateColumnInfo();
        showStatus(tr(`✅ ${Object.keys(mapping).length} columnas renombradas`, `✅ ${Object.keys(mapping).length} columns renamed`), 'success');
    }

    function applySelectColumns() {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
            return;
        }

        const columns = getSelectedColumns(elements.selectColumns);
        if (columns.length === 0) {
            showStatus(tr('⚠️ Selecciona al menos una columna', '⚠️ Select at least one column'), 'warning');
            return;
        }

        currentData = dataApi.selectColumns(currentData, columns);
        modifiedTime = new Date();
        
        populateColumnSelectors();
        updateTable();
        updateStats();
        updateColumnInfo();
        showStatus(tr(`✅ ${columns.length} columnas seleccionadas`, `✅ ${columns.length} columns selected`), 'success');
    }

    // ==================== CLEANING ====================
    function applyClean(operation) {
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
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
            removeNulls: tr(`✅ ${rowsAffected} filas eliminadas`, `✅ ${rowsAffected} rows removed`),
            fillNA: tr('✅ Valores vacíos rellenados con 0', '✅ Empty values filled with 0'),
            removeDuplicates: tr(`✅ ${rowsAffected} duplicados eliminados`, `✅ ${rowsAffected} duplicates removed`),
            trim: tr('✅ Espacios limpiados', '✅ Spaces trimmed')
        };
        
        showStatus(messages[operation], 'success');
    }

    function resetData() {
        if (!originalData) return;
        
        if (confirm(tr('¿Restaurar los datos originales? Se perderán todos los cambios.', 'Restore original data? All changes will be lost.'))) {
            currentData = JSON.parse(JSON.stringify(originalData));
            modifiedTime = new Date();
            
            updateTable();
            updateStats();
            updateColumnInfo();
            showStatus(tr('🔄 Datos restaurados al original', '🔄 Data restored to original'), 'info');
        }
    }

    // ==================== EXPORT ====================
    function exportJSON() {
        if (!currentData) return;
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
            return;
        }
        
        const filename = `data_${Date.now()}.json`;
        dataApi.exportJSON(currentData, filename);
        showStatus(tr('📥 JSON descargado', '📥 JSON downloaded'), 'success');
    }

    function exportCSV() {
        if (!currentData) return;
        const dataApi = getDataApi();
        if (!dataApi) {
            showStatus(tr('⚠️ Biblioteca de procesamiento no cargada todavía', '⚠️ Processing library not loaded yet'), 'warning');
            return;
        }
        
        const filename = `data_${Date.now()}.csv`;
        dataApi.exportCSV(currentData, filename);
        showStatus(tr('📥 CSV descargado', '📥 CSV downloaded'), 'success');
    }

    // ==================== STORAGE ====================
    function refreshSavedDatasets() {
        const container = elements.savedDatasetsList;
        if (!container) return;

        const dataApi = getDataApi();
        if (!dataApi || !dataApi.storage) {
            container.innerHTML = `<p class="helper-text">${tr('Storage no disponible', 'Storage not available')}</p>`;
            return;
        }

        const datasets = dataApi.storage.getDatasetsInfo();

        if (datasets.length === 0) {
            container.innerHTML = `<p class="helper-text">${tr('No hay datasets guardados', 'No saved datasets')}</p>`;
            return;
        }

        container.innerHTML = datasets.map(ds => `
            <div class="dataset-card" data-name="${escapeHtml(ds.name)}">
                <h4>
                    <i class="ph ph-database"></i>
                    ${escapeHtml(ds.name)}
                </h4>
                <p>${ds.rowCount} ${tr('filas', 'rows')} • ${ds.source || tr('Desconocido', 'Unknown')}</p>
                <p style="font-size: 0.7rem;">${tr('Guardado', 'Saved')}: ${formatTime(new Date(ds.savedAt))}</p>
                <div class="dataset-actions">
                    <button class="btn-icon btn-load" title="${tr('Cargar dataset', 'Load dataset')}">
                        <i class="ph ph-upload"></i> ${tr('Cargar', 'Load')}
                    </button>
                    <button class="btn-icon btn-delete" title="${tr('Eliminar', 'Delete')}">
                        <i class="ph ph-trash"></i> ${tr('Eliminar', 'Delete')}
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
            showStatus(tr('⚠️ Storage no disponible', '⚠️ Storage not available'), 'warning');
            return;
        }

        const dataset = dataApi.storage.loadDataset(name);
        if (!dataset) {
            showStatus(tr('❌ Dataset no encontrado', '❌ Dataset not found'), 'error');
            return;
        }

        loadData(dataset.data, dataset.metadata?.source || 'storage', name);
        showStatus(tr(`✅ Dataset "${name}" cargado desde storage`, `✅ Dataset "${name}" loaded from storage`), 'success');
    }

    function deleteDatasetFromStorage(name) {
        const dataApi = getDataApi();
        if (!dataApi || !dataApi.storage) {
            showStatus(tr('⚠️ Storage no disponible', '⚠️ Storage not available'), 'warning');
            return;
        }

        if (confirm(tr(`¿Eliminar el dataset "${name}"?`, `Delete dataset "${name}"?`))) {
            dataApi.storage.deleteDataset(name);
            refreshSavedDatasets();
            showStatus(tr(`🗑️ Dataset "${name}" eliminado`, `🗑️ Dataset "${name}" deleted`), 'info');
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
            showStatus(tr('⚠️ Storage no disponible', '⚠️ Storage not available'), 'warning');
            return;
        }

        const name = elements.datasetName.value.trim();
        if (!name) {
            alert(tr('Ingresa un nombre para el dataset', 'Enter a dataset name'));
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
        showStatus(tr(`💾 Dataset "${name}" guardado en storage compartido`, `💾 Dataset "${name}" saved to shared storage`), 'success');
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

        if (seconds < 60) return tr('Ahora', 'Now');
        if (minutes < 60) return tr(`Hace ${minutes} min`, `${minutes} min ago`);
        if (hours < 24) return tr(`Hace ${hours}h`, `${hours}h ago`);
        if (days < 7) return tr(`Hace ${days}d`, `${days}d ago`);
        
        return date.toLocaleDateString(isEnglish ? 'en-US' : 'es-ES', { 
            day: 'numeric', 
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    // ==================== START APP ====================
    init();
})();
