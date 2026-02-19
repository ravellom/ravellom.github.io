const AppState = {
    currentLanguage: localStorage.getItem('survey_suite_language') || 'en',
    translations: {},
    dataRows: [],
    activeDatasetName: '',
    activePanel: 'data'
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
        if (window.RecuEduData) return window.RecuEduData;
        return null;
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
    },

    populateColumnSelects(rows) {
        const numericSelect = document.getElementById('numeric-column');
        const categorySelect = document.getElementById('category-column');
        if (!numericSelect || !categorySelect) return;

        const columns = Object.keys(rows[0] || {});
        const numericColumns = columns.filter((col) => {
            let numericCount = 0;
            let total = 0;
            rows.forEach((row) => {
                const value = row[col];
                if (value === null || value === undefined || value === '') return;
                total += 1;
                if (!isNaN(Number(value))) numericCount += 1;
            });
            return total > 0 && (numericCount / total) >= 0.8;
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
    document.getElementById('language-select')?.addEventListener('change', (event) => {
        I18n.load(event.target.value);
    });
    document.getElementById('btn-refresh-dataset')?.addEventListener('click', () => {
        DataBridge.refreshFromStorage();
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

