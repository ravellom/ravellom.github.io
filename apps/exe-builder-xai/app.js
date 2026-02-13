import { appState, setState, subscribe } from './core/state.js';
import { normalizeXaiBundle } from './core/normalize-xai.js';
import { validateXaiBundle } from './core/validators.js';
import { exportTeacherProject, exportVisorPackage } from './core/exporters.js';
import { setLocale, t } from './i18n/index.js';
import { getDomElements } from './ui/dom.js';
import { applyI18n, renderValidationResult } from './ui/renderer.js';
import { renderExerciseEditor } from './ui/exercise-editor.js';
import exampleXaiBundle from './examples/example-xai.js';
import { buildXaiPrompt } from './services/prompt-builder.js';
import { generateWithGemini } from './services/gemini.js';
import { importSummaryFile } from './services/file-import.js';

function getParseErrorResult() {
    return {
        valid: false,
        errors: [t('ui.parseError')],
        warnings: [],
        summary: {
            exerciseCount: 0,
            criticalCount: 1
        }
    };
}

function applyBundle(elements, rawBundle) {
    const normalizedBundle = normalizeXaiBundle(rawBundle);
    const validation = validateXaiBundle(normalizedBundle, t);
    setState({ data: normalizedBundle, validation });
    return validation;
}

function setStatus(elements, message, type = 'info') {
    elements.statusMsg.className = `status-msg ${type}`;
    elements.statusMsg.textContent = message;
}

function setupHorizontalResize(handle, container, minPx, maxPx, cssVarName) {
    if (!handle || !container) {
        return;
    }

    let isDragging = false;

    handle.addEventListener('mousedown', (event) => {
        isDragging = true;
        event.preventDefault();
    });

    window.addEventListener('mousemove', (event) => {
        if (!isDragging) {
            return;
        }

        const rect = container.getBoundingClientRect();
        const next = Math.min(maxPx, Math.max(minPx, event.clientX - rect.left));
        container.style.setProperty(cssVarName, `${next}px`);
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

function readJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || '{}'));
                resolve(parsed);
            } catch {
                reject(new Error('invalid_json'));
            }
        };
        reader.onerror = () => reject(new Error('read_failed'));
        reader.readAsText(file, 'utf-8');
    });
}

function buildBatchCounts(total, chunkSize) {
    const result = [];
    let remaining = Math.max(0, Number(total) || 0);
    while (remaining > 0) {
        const next = Math.min(chunkSize, remaining);
        result.push(next);
        remaining -= next;
    }
    return result;
}

function mergeGeneratedBundles(parsedBundles) {
    const bundles = Array.isArray(parsedBundles) ? parsedBundles.filter(Boolean) : [];
    if (bundles.length === 0) {
        return null;
    }

    const base = bundles[0] && typeof bundles[0] === 'object' ? bundles[0] : {};
    const mergedExercises = bundles.flatMap((bundle) => Array.isArray(bundle?.exercises) ? bundle.exercises : []);
    const usedIds = new Set();

    mergedExercises.forEach((exercise, index) => {
        if (!exercise || typeof exercise !== 'object') {
            return;
        }
        const rawId = String(exercise.id || `ex_${index + 1}`).trim() || `ex_${index + 1}`;
        let nextId = rawId;
        let suffix = 2;
        while (usedIds.has(nextId)) {
            nextId = `${rawId}_${suffix}`;
            suffix += 1;
        }
        exercise.id = nextId;
        usedIds.add(nextId);
    });

    return {
        ...base,
        exercises: mergedExercises
    };
}

function updateDerivedViews(elements, data, validation) {
    elements.jsonInput.value = data ? JSON.stringify(data, null, 2) : '';
    renderValidationResult(elements, validation || null);
    const onEditorChange = (isUiOnly = false) => {
        if (isUiOnly) {
            renderExerciseEditor(elements, data, onEditorChange);
            return;
        }
        const nextValidation = validateXaiBundle(data, t);
        setState({ data, validation: nextValidation });
    };
    renderExerciseEditor(elements, data, onEditorChange);
}

async function handleSummaryUpload(elements) {
    const file = elements.summaryFile.files?.[0];
    if (!file) {
        return;
    }

    setStatus(elements, t('status.readingFile'), 'info');
    try {
        const { text: content, warning } = await importSummaryFile(file);
        elements.contentInput.value = content.trim();
        if (warning === 'doc_legacy') {
            setStatus(elements, t('status.fileLoadedWithWarning'), 'warning');
        } else if (warning === 'pdf_empty') {
            setStatus(elements, t('status.pdfNoText'), 'warning');
        } else {
            setStatus(elements, t('status.fileLoaded'), 'success');
        }
    } catch (error) {
        if (error.message === 'docx_parser_missing') {
            setStatus(elements, t('status.docxParserMissing'), 'error');
            return;
        }
        if (error.message === 'pdf_parser_missing') {
            setStatus(elements, t('status.pdfParserMissing'), 'error');
            return;
        }
        setStatus(elements, t('status.fileReadError'), 'error');
    }
}

async function handleGenerate(elements) {
    const apiKey = elements.apiKeyInput.value.trim();
    const model = elements.modelSelect.value;
    const selectedCount = Number(elements.exerciseCount.value);
    const exerciseCount = Number.isFinite(selectedCount)
        ? Math.min(15, Math.max(1, selectedCount))
        : 3;
    const content = elements.contentInput.value.trim();

    if (!apiKey) {
        setStatus(elements, t('status.needApiKey'), 'error');
        elements.apiKeyInput.focus();
        return;
    }

    if (!content) {
        setStatus(elements, t('status.needContent'), 'error');
        elements.contentInput.focus();
        return;
    }

    const locale = appState.locale || 'es';
    const isPreviewModel = /preview/i.test(model);
    const chunkSize = exerciseCount >= 7
        ? (isPreviewModel ? 3 : 4)
        : exerciseCount;
    const batchCounts = buildBatchCounts(exerciseCount, chunkSize);

    localStorage.setItem('exe_builder_xai_api_key', apiKey);
    localStorage.setItem('exe_builder_xai_model', model);
    localStorage.setItem('exe_builder_xai_count', String(exerciseCount));

    const originalText = t('actions.generate');
    elements.btnGenerate.disabled = true;
    elements.btnGenerate.textContent = t('actions.generating');
    setStatus(elements, t('status.generating'), 'info');

    try {
        const parsedBundles = [];

        for (let index = 0; index < batchCounts.length; index += 1) {
            const batchCount = batchCounts[index];
            const batchPrompt = buildXaiPrompt({ locale, content, exerciseCount: batchCount });
            if (batchCounts.length > 1) {
                setStatus(elements, `${t('status.generating')} (${index + 1}/${batchCounts.length})`, 'info');
            }

            const result = await generateWithGemini({
                apiKey,
                model,
                prompt: batchPrompt,
                maxOutputTokens: isPreviewModel ? 12288 : 16384
            });
            parsedBundles.push(result.parsed);
        }

        const mergedBundle = mergeGeneratedBundles(parsedBundles);
        const validation = applyBundle(elements, mergedBundle);

        if (validation.valid) {
            setStatus(elements, t('status.generatedOk', { count: validation.summary.exerciseCount }), 'success');
        } else {
            setStatus(elements, t('status.generatedInvalid'), 'error');
        }
    } catch (error) {
        const message = String(error?.message || 'Error desconocido');
        const parseHint = /JSON|Unexpected|Expected ','|position \d+/i.test(message)
            ? ' El modelo devolvió JSON incompleto o malformado. Intenta generar de nuevo o reducir la cantidad de ejercicios; para solicitudes grandes ahora se usa generación por lotes.'
            : '';
        setStatus(elements, t('status.requestError', { message: `${message}${parseHint}` }), 'error');
    } finally {
        elements.btnGenerate.disabled = false;
        elements.btnGenerate.textContent = originalText;
    }
}

function initializeApp() {
    const elements = getDomElements();

    setupHorizontalResize(elements.layoutResizer, elements.layout, 320, 760, '--left-panel-width');
    setupHorizontalResize(elements.editorResizer, elements.editorWorkspace, 220, 520, '--exercise-nav-width');

    setLocale('es');
    setState({ locale: 'es' });
    applyI18n();
    updateDerivedViews(elements, null, null);
    setStatus(elements, t('ui.noItems'), 'info');

    const savedApiKey = localStorage.getItem('exe_builder_xai_api_key');
    const savedModel = localStorage.getItem('exe_builder_xai_model');
    const savedCount = Number(localStorage.getItem('exe_builder_xai_count'));
    if (savedApiKey) {
        elements.apiKeyInput.value = savedApiKey;
    }
    if (savedModel) {
        elements.modelSelect.value = savedModel;
    } else {
        elements.modelSelect.value = 'gemini-2.5-flash';
    }

    if (Number.isFinite(savedCount) && savedCount >= 1 && savedCount <= 15) {
        elements.exerciseCount.value = String(savedCount);
    } else {
        elements.exerciseCount.value = '3';
    }

    elements.languageSelect.addEventListener('change', () => {
        const locale = setLocale(elements.languageSelect.value);
        const previousStatus = elements.statusMsg.textContent;
        const previousStatusClass = elements.statusMsg.className;
        setState({ locale });
        applyI18n();
        updateDerivedViews(elements, appState.data, appState.validation);
        elements.statusMsg.className = previousStatusClass;
        elements.statusMsg.textContent = previousStatus || t('ui.noItems');
    });

    elements.btnUploadSummary.addEventListener('click', () => {
        elements.summaryFile.click();
    });

    elements.summaryFile.addEventListener('change', async () => {
        await handleSummaryUpload(elements);
    });

    elements.btnImportProject.addEventListener('click', () => {
        elements.projectFile.click();
    });

    elements.projectFile.addEventListener('change', async () => {
        const file = elements.projectFile.files?.[0];
        if (!file) {
            return;
        }

        setStatus(elements, t('status.readingFile'), 'info');
        try {
            const parsed = await readJsonFile(file);
            applyBundle(elements, parsed);
            setStatus(elements, t('status.projectLoaded'), 'success');
        } catch (error) {
            if (error.message === 'invalid_json') {
                setStatus(elements, t('status.projectLoadError'), 'error');
                return;
            }
            setStatus(elements, t('status.fileReadError'), 'error');
        }
    });

    elements.btnGenerate.addEventListener('click', async () => {
        await handleGenerate(elements);
    });

    elements.btnLoadExample.addEventListener('click', () => {
        applyBundle(elements, exampleXaiBundle);
        setStatus(elements, t('status.fileLoaded'), 'success');
    });

    elements.btnExportProject.addEventListener('click', () => {
        if (!appState.data || !Array.isArray(appState.data.exercises) || appState.data.exercises.length === 0) {
            setStatus(elements, t('status.nothingToExport'), 'warning');
            return;
        }
        exportTeacherProject(appState.data);
        setStatus(elements, t('status.projectExported'), 'success');
    });

    elements.btnExportVisor.addEventListener('click', () => {
        if (!appState.data || !Array.isArray(appState.data.exercises) || appState.data.exercises.length === 0) {
            setStatus(elements, t('status.nothingToExport'), 'warning');
            return;
        }
        exportVisorPackage(appState.data);
        setStatus(elements, t('status.visorExported'), 'success');
    });

    elements.btnValidate.addEventListener('click', () => {
        let parsed;
        try {
            parsed = JSON.parse(elements.jsonInput.value);
        } catch {
            const parseError = getParseErrorResult();
            setState({ data: null, validation: parseError });
            return;
        }

        applyBundle(elements, parsed);
    });

    subscribe((state) => {
        updateDerivedViews(elements, state.data, state.validation);
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);
