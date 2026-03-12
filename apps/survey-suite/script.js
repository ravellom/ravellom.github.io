const SuiteState = {
    currentView: 'home',
    activeDataset: '',
    language: localStorage.getItem('survey_suite_language') || 'en'
};

function updateLayoutMetrics() {
    const root = document.documentElement;
    const topbarH = document.querySelector('.recuedu-topbar')?.offsetHeight || 50;
    const headerH = document.querySelector('.app-header')?.offsetHeight || 56;
    const ribbonH = document.querySelector('.module-ribbon')?.offsetHeight || 68;
    const shellH = Math.max(320, window.innerHeight - topbarH - headerH - ribbonH);
    root.style.setProperty('--suite-shell-height', `${shellH}px`);
}

const VIEW_META = {
    home: {
        title: 'Inicio',
        help: 'Selecciona un módulo para comenzar'
    },
    processor: {
        title: 'Data Processor',
        help: 'Importa, limpia y transforma datos antes de visualizar'
    },
    likert: {
        title: 'Likert Charts',
        help: 'Genera gráficos Likert para resultados de encuestas'
    },
    distribution: {
        title: 'Distribution Lab',
        help: 'Analiza distribución y variabilidad de variables numéricas'
    }
};

function getLikertFrames() {
    return [
        document.getElementById('frame-likert')
    ].filter(Boolean);
}

function getDistributionFrames() {
    return [
        document.getElementById('frame-distribution')
    ].filter(Boolean);
}

function getProcessorFrames() {
    return [document.getElementById('frame-processor')].filter(Boolean);
}

function setActiveView(viewId) {
    SuiteState.currentView = viewId;
    document.body.classList.remove('module-home', 'module-processor', 'module-likert', 'module-distribution');
    document.body.classList.add(`module-${viewId}`);

    document.querySelectorAll('.suite-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewId);
    });

    document.querySelectorAll('.view-single').forEach(view => {
        view.classList.remove('active');
    });

    const viewEl = document.getElementById(`view-${viewId}`);
    if (viewEl) viewEl.classList.add('active');

    const titleEl = document.getElementById('ribbon-view-title');
    const helpEl = document.getElementById('ribbon-view-help');
    const meta = VIEW_META[viewId] || VIEW_META.home;
    if (titleEl) titleEl.textContent = meta.title;
    if (helpEl) helpEl.textContent = meta.help;
    updateLayoutMetrics();

    if (viewId === 'likert') {
        applySharedStateToLikert();
    }
    if (viewId === 'processor') {
        applySharedStateToProcessor();
    }
    if (viewId === 'distribution') {
        applySharedStateToDistribution();
    }
}

function refreshActiveView() {
    const activeMap = {
        home: [],
        processor: ['frame-processor'],
        likert: ['frame-likert'],
        distribution: ['frame-distribution']
    };

    const targets = activeMap[SuiteState.currentView] || [];
    targets.forEach(id => {
        const iframe = document.getElementById(id);
        if (iframe) iframe.src = iframe.src;
    });
}

function populateDatasets() {
    const select = document.getElementById('suite-dataset-select');
    if (!select) return;

    const api = window.RecuEduData;
    if (!api || !api.storage) {
        select.innerHTML = '<option value="">Storage not available</option>';
        return;
    }

    try {
        const datasets = api.storage.getDatasetsInfo();
        select.innerHTML = '<option value="">Select saved dataset...</option>';

        if (!Array.isArray(datasets) || datasets.length === 0) {
            select.innerHTML = '<option value="">No saved datasets</option>';
            return;
        }

        datasets.forEach(ds => {
            const option = document.createElement('option');
            option.value = ds.name;
            option.textContent = `${ds.name} (${ds.rowCount || 0} rows)`;
            select.appendChild(option);
        });

        if (SuiteState.activeDataset) {
            select.value = SuiteState.activeDataset;
        }
        updateActiveDatasetBadge();
    } catch (error) {
        select.innerHTML = '<option value="">Error loading datasets</option>';
        updateActiveDatasetBadge();
    }
}

function setActiveDataset(datasetName) {
    SuiteState.activeDataset = datasetName || '';
    localStorage.setItem('survey_suite_active_dataset', SuiteState.activeDataset);
    updateActiveDatasetBadge();
    applySharedStateToLikert();
    applySharedStateToDistribution();
}

function updateActiveDatasetBadge() {
    const badge = document.getElementById('ribbon-active-dataset');
    if (!badge) return;
    badge.textContent = SuiteState.activeDataset || 'Ninguno';
}

function setLanguage(lang) {
    if (!['en', 'es'].includes(lang)) return;
    SuiteState.language = lang;
    localStorage.setItem('survey_suite_language', lang);
    applySharedStateToLikert();
    applySharedStateToProcessor();
    applySharedStateToDistribution();
}

function applySharedStateToLikert() {
    getLikertFrames().forEach(frame => {
        if (!frame?.contentWindow) return;

        frame.contentWindow.postMessage({
            type: 'survey-suite-set-language',
            lang: SuiteState.language
        }, '*');

        if (SuiteState.activeDataset) {
            frame.contentWindow.postMessage({
                type: 'survey-suite-load-dataset',
                datasetName: SuiteState.activeDataset
            }, '*');
        }
    });
}

function applySharedStateToProcessor() {
    getProcessorFrames().forEach(frame => {
        if (!frame?.contentWindow) return;
        frame.contentWindow.postMessage({
            type: 'survey-suite-set-language',
            lang: SuiteState.language
        }, '*');
    });
}

function applySharedStateToDistribution() {
    getDistributionFrames().forEach(frame => {
        if (!frame?.contentWindow) return;

        frame.contentWindow.postMessage({
            type: 'survey-suite-set-language',
            lang: SuiteState.language
        }, '*');

        if (SuiteState.activeDataset) {
            frame.contentWindow.postMessage({
                type: 'survey-suite-load-dataset',
                datasetName: SuiteState.activeDataset
            }, '*');
        }
    });
}

function bindIframeLoads() {
    [document.getElementById('frame-likert')].filter(Boolean).forEach(frame => {
        frame.addEventListener('load', () => {
            applySharedStateToLikert();
        });
    });
    [document.getElementById('frame-distribution')].filter(Boolean).forEach(frame => {
        frame.addEventListener('load', () => {
            applySharedStateToDistribution();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const initialView = params.get('view');
    if (initialView && ['home', 'processor', 'likert', 'distribution'].includes(initialView)) {
        setActiveView(initialView);
    } else {
        setActiveView(SuiteState.currentView);
    }

    const savedDataset = localStorage.getItem('survey_suite_active_dataset');
    if (savedDataset) {
        SuiteState.activeDataset = savedDataset;
    }
    updateActiveDatasetBadge();

    document.querySelectorAll('.suite-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const view = tab.dataset.view;
            setActiveView(view);
            const url = new URL(window.location.href);
            url.searchParams.set('view', view);
            history.replaceState(null, '', url.toString());
        });
    });

    document.querySelectorAll('.btn-open-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.openView;
            if (!view) return;
            setActiveView(view);
            const url = new URL(window.location.href);
            url.searchParams.set('view', view);
            history.replaceState(null, '', url.toString());
        });
    });

    document.getElementById('btn-refresh-active')?.addEventListener('click', refreshActiveView);
    document.getElementById('btn-suite-refresh-datasets')?.addEventListener('click', populateDatasets);

    document.getElementById('suite-dataset-select')?.addEventListener('change', (e) => {
        setActiveDataset(e.target.value);
    });

    const langSelect = document.getElementById('suite-language-select');
    if (langSelect) {
        langSelect.value = SuiteState.language;
        langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
    }

    populateDatasets();
    bindIframeLoads();
    applySharedStateToLikert();
    applySharedStateToProcessor();
    applySharedStateToDistribution();
    updateLayoutMetrics();
    window.addEventListener('resize', updateLayoutMetrics);
});
