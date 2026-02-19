const SuiteState = {
    currentView: 'processor',
    activeDataset: '',
    language: localStorage.getItem('survey_suite_language') || 'en'
};

function getLikertFrames() {
    return [
        document.getElementById('frame-likert')
    ].filter(Boolean);
}

function getWordCloudFrames() {
    return [
        document.getElementById('frame-wordcloud')
    ].filter(Boolean);
}

function getProcessorFrames() {
    return [document.getElementById('frame-processor')].filter(Boolean);
}

function setActiveView(viewId) {
    SuiteState.currentView = viewId;

    document.querySelectorAll('.suite-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewId);
    });

    document.querySelectorAll('.view-single').forEach(view => {
        view.classList.remove('active');
    });

    const viewEl = document.getElementById(`view-${viewId}`);
    if (viewEl) viewEl.classList.add('active');

    if (viewId === 'likert') {
        applySharedStateToLikert();
    }
    if (viewId === 'processor') {
        applySharedStateToProcessor();
    }
    if (viewId === 'wordcloud') {
        applySharedStateToWordCloud();
    }
}

function refreshActiveView() {
    const activeMap = {
        processor: ['frame-processor'],
        likert: ['frame-likert'],
        wordcloud: ['frame-wordcloud']
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
    } catch (error) {
        select.innerHTML = '<option value="">Error loading datasets</option>';
    }
}

function setActiveDataset(datasetName) {
    SuiteState.activeDataset = datasetName || '';
    localStorage.setItem('survey_suite_active_dataset', SuiteState.activeDataset);
    applySharedStateToLikert();
    applySharedStateToWordCloud();
}

function setLanguage(lang) {
    if (!['en', 'es'].includes(lang)) return;
    SuiteState.language = lang;
    localStorage.setItem('survey_suite_language', lang);
    applySharedStateToLikert();
    applySharedStateToProcessor();
    applySharedStateToWordCloud();
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

function applySharedStateToWordCloud() {
    getWordCloudFrames().forEach(frame => {
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
    [document.getElementById('frame-wordcloud')].filter(Boolean).forEach(frame => {
        frame.addEventListener('load', () => {
            applySharedStateToWordCloud();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const initialView = params.get('view');
    if (initialView && ['processor', 'likert', 'wordcloud'].includes(initialView)) {
        setActiveView(initialView);
    }

    const savedDataset = localStorage.getItem('survey_suite_active_dataset');
    if (savedDataset) {
        SuiteState.activeDataset = savedDataset;
    }

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
    applySharedStateToWordCloud();
});
