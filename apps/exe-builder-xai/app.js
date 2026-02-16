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

const EXERCISE_TYPES = [
    'multiple_choice',
    'true_false',
    'fill_gaps',
    'ordering',
    'matching',
    'grouping',
    'short_answer',
    'hotspot',
    'slider'
];

const PROMPT_TRACE_SESSION_KEY = 'exe_builder_xai_prompt_trace';

function readPromptTraceFromSession() {
    try {
        return String(sessionStorage.getItem(PROMPT_TRACE_SESSION_KEY) || '');
    } catch {
        return '';
    }
}

function savePromptTraceToSession(promptTrace) {
    const normalized = String(promptTrace || '');
    try {
        if (normalized) {
            sessionStorage.setItem(PROMPT_TRACE_SESSION_KEY, normalized);
        } else {
            sessionStorage.removeItem(PROMPT_TRACE_SESSION_KEY);
        }
    } catch {
        // ignore sessionStorage failures
    }
    setState({ promptTrace: normalized });
}

function formatPromptTraceEntry(prompt, batchIndex, totalBatches, batchCount, batchTypePlan = null) {
    const lines = [
        `=== Batch ${batchIndex}/${totalBatches} | count=${batchCount} ===`
    ];

    if (batchTypePlan && Object.keys(batchTypePlan).length > 0) {
        const planText = Object.entries(batchTypePlan)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([type, count]) => `${type}:${count}`)
            .join(', ');
        lines.push(`type_plan: ${planText}`);
    }

    lines.push('', String(prompt || '').trim());
    return lines.join('\n');
}

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

function updateHelpLinksByLocale(elements, locale) {
    if (!elements) {
        return;
    }

    const isEnglish = locale === 'en';
    if (elements.helpLink) {
        elements.helpLink.setAttribute('href', isEnglish ? 'help.en.html' : 'help.html');
    }
    if (elements.helpEvidenceLink) {
        elements.helpEvidenceLink.setAttribute('href', isEnglish ? 'help-xai-evidence.html' : 'help-xai-evidencia.html');
    }
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

function chunkArray(array, size) {
    const source = Array.isArray(array) ? array : [];
    const chunkSize = Math.max(1, Number(size) || 1);
    const result = [];
    for (let index = 0; index < source.length; index += chunkSize) {
        result.push(source.slice(index, index + chunkSize));
    }
    return result;
}

function buildTypePlanFromInputs(elements) {
    const plan = {};
    const inputs = Array.isArray(elements?.typePlanInputs) ? elements.typePlanInputs : [];

    inputs.forEach((input) => {
        const type = String(input?.dataset?.type || '').trim();
        if (!type || !EXERCISE_TYPES.includes(type)) {
            return;
        }

        const raw = Number(input.value);
        const normalized = Number.isFinite(raw) ? Math.max(0, Math.min(15, Math.floor(raw))) : 0;
        input.value = String(normalized);
        if (normalized > 0) {
            plan[type] = normalized;
        }
    });

    const total = Object.values(plan).reduce((accumulator, count) => accumulator + Number(count || 0), 0);
    return { plan, total };
}

function setTypePlanToInputs(elements, plan) {
    const inputMap = new Map((elements.typePlanInputs || []).map((input) => [String(input?.dataset?.type || ''), input]));
    EXERCISE_TYPES.forEach((type) => {
        const input = inputMap.get(type);
        if (!input) {
            return;
        }
        const raw = Number(plan?.[type]);
        const normalized = Number.isFinite(raw) ? Math.max(0, Math.min(15, Math.floor(raw))) : 0;
        input.value = String(normalized);
    });
}

function updateTypePlanSummary(elements) {
    const { total } = buildTypePlanFromInputs(elements);

    if (elements.typePlanTotal) {
        elements.typePlanTotal.textContent = t('ui.typePlanTotalValue', { total });
        elements.typePlanTotal.classList.toggle('over', total > 15);
    }

    if (elements.exerciseCount) {
        if (total > 0 && total <= 15) {
            elements.exerciseCount.value = String(total);
            elements.exerciseCount.disabled = true;
        } else {
            elements.exerciseCount.disabled = false;
        }
    }

    return total;
}

function expandTypePlan(plan) {
    return Object.entries(plan || {}).flatMap(([type, count]) => Array.from({ length: Number(count) || 0 }, () => type));
}

function countTypesFromArray(types) {
    return (Array.isArray(types) ? types : []).reduce((accumulator, type) => {
        const key = String(type || '').trim();
        if (!key) {
            return accumulator;
        }
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
    }, {});
}

function countTypesFromExercises(exercises) {
    return countTypesFromArray((Array.isArray(exercises) ? exercises : []).map((exercise) => exercise?.type));
}

function normalizeTypeCountMap(map) {
    const source = map && typeof map === 'object' && !Array.isArray(map) ? map : {};
    return Object.entries(source)
        .map(([type, count]) => [type, Number(count) || 0])
        .filter(([, count]) => count > 0)
        .sort(([left], [right]) => left.localeCompare(right));
}

function sameTypeDistribution(leftMap, rightMap) {
    const left = normalizeTypeCountMap(leftMap);
    const right = normalizeTypeCountMap(rightMap);
    return JSON.stringify(left) === JSON.stringify(right);
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

function enforceRequestedExerciseCount(bundle, requestedCount) {
    const source = bundle && typeof bundle === 'object' ? bundle : {};
    const exercises = Array.isArray(source.exercises) ? source.exercises : [];
    const expected = Math.max(1, Number(requestedCount) || 1);

    return {
        ...source,
        exercises: exercises.slice(0, expected)
    };
}

function updateDerivedViews(elements, data, validation, promptTrace = '') {
    elements.jsonInput.value = data ? JSON.stringify(data, null, 2) : '';
    renderValidationResult(elements, validation || null);
    updateInsightsAndBadges(data, validation);
    if (elements.promptTraceOutput) {
        elements.promptTraceOutput.textContent = String(promptTrace || '').trim() || t('ui.noPromptTrace');
    }
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

function setupMainTabs() {
    const tabButtons = Array.from(document.querySelectorAll('.main-tab-btn'));
    const tabPanels = Array.from(document.querySelectorAll('.main-tab-panel'));

    if (!tabButtons.length || !tabPanels.length) {
        return;
    }

    const activate = (targetId) => {
        tabButtons.forEach((button) => {
            const isActive = button.dataset.target === targetId;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
        });

        tabPanels.forEach((panel) => {
            panel.classList.toggle('active', panel.id === targetId);
        });
    };

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => activate(button.dataset.target));
    });
}

function updateInsightsAndBadges(data, validation) {
    const errors = Array.isArray(validation?.errors) ? validation.errors.length : 0;
    const warnings = Array.isArray(validation?.warnings) ? validation.warnings.length : 0;
    const exerciseCount = Number(validation?.summary?.exerciseCount)
        || (Array.isArray(data?.exercises) ? data.exercises.length : 0)
        || 0;

    const errorsBadge = document.getElementById('errors-badge');
    const warningsBadge = document.getElementById('warnings-badge');
    const kpiExercises = document.getElementById('insight-kpi-exercises');
    const kpiErrors = document.getElementById('insight-kpi-errors');
    const kpiWarnings = document.getElementById('insight-kpi-warnings');
    const rationale = document.getElementById('insight-rationale');
    const bias = document.getElementById('insight-bias');
    const pedagogy = document.getElementById('insight-pedagogy');
    const compliance = document.getElementById('insight-compliance');

    if (errorsBadge) {
        errorsBadge.textContent = String(errors);
    }
    if (warningsBadge) {
        warningsBadge.textContent = String(warnings);
    }
    if (kpiExercises) {
        kpiExercises.textContent = String(exerciseCount);
    }
    if (kpiErrors) {
        kpiErrors.textContent = String(errors);
    }
    if (kpiWarnings) {
        kpiWarnings.textContent = String(warnings);
    }

    if (!validation) {
        if (rationale) {
            rationale.textContent = 'La lógica de diseño se actualizará cuando generes o valides un conjunto de ejercicios.';
        }
        if (bias) {
            bias.textContent = 'Recomendación: revisar lenguaje inclusivo, diversidad de contextos y accesibilidad en los enunciados.';
        }
        if (pedagogy) {
            pedagogy.textContent = 'Alinea objetivos, criterios y apoyos diferenciados antes de exportar al visor.';
        }
        if (compliance) {
            compliance.textContent = 'Sin datos aún. Genera o valida para estimar cumplimiento técnico inicial.';
        }
        return;
    }

    if (rationale) {
        if (validation.valid) {
            rationale.textContent = `El bundle es válido con ${exerciseCount} ejercicios. Puedes centrar la revisión en calidad pedagógica y ajustes contextuales.`;
        } else {
            rationale.textContent = `Se detectaron ${errors} errores críticos. Prioriza correcciones estructurales antes de exportar o implementar.`;
        }
    }

    if (bias) {
        if (warnings > 0) {
            bias.textContent = `Hay ${warnings} advertencias a revisar: sesgo potencial, formulación o apoyos diferenciados incompletos.`;
        } else {
            bias.textContent = 'No se detectan advertencias en esta revisión automática. Mantén auditoría docente final.';
        }
    }

    if (pedagogy) {
        const types = new Set((Array.isArray(data?.exercises) ? data.exercises : []).map((exercise) => exercise?.type).filter(Boolean));
        pedagogy.textContent = `Se identifican ${types.size || 0} tipos de ejercicio. Verifica variedad metodológica y coherencia con objetivos de aprendizaje.`;
    }

    if (compliance) {
        if (validation.valid && warnings === 0) {
            compliance.textContent = 'Cumplimiento técnico alto: sin errores ni advertencias. Requiere igualmente revisión humana final.';
        } else if (validation.valid) {
            compliance.textContent = 'Cumplimiento técnico aceptable: sin errores críticos, pero con advertencias pendientes.';
        } else {
            compliance.textContent = 'Cumplimiento técnico insuficiente: corrige errores críticos antes de su uso en aula o publicación.';
        }
    }
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
    const requestedCount = Number.isFinite(selectedCount)
        ? Math.min(15, Math.max(1, selectedCount))
        : 3;
    const content = elements.contentInput.value.trim();
    const { plan: typePlan, total: typePlanTotal } = buildTypePlanFromInputs(elements);
    const useTypePlan = typePlanTotal > 0;
    const exerciseCount = useTypePlan ? typePlanTotal : requestedCount;

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

    if (typePlanTotal > 15) {
        setStatus(elements, t('status.typePlanExceeded'), 'error');
        return;
    }

    const locale = appState.locale || 'es';
    const isPreviewModel = /preview/i.test(model);
    const chunkSize = exerciseCount >= 7 ? (isPreviewModel ? 3 : 4) : exerciseCount;
    const batchCounts = useTypePlan ? [] : buildBatchCounts(exerciseCount, chunkSize);
    const typeChunks = useTypePlan ? chunkArray(expandTypePlan(typePlan), chunkSize) : [];

    localStorage.setItem('exe_builder_xai_api_key', apiKey);
    localStorage.setItem('exe_builder_xai_model', model);
    localStorage.setItem('exe_builder_xai_count', String(exerciseCount));
    localStorage.setItem('exe_builder_xai_type_plan', JSON.stringify(typePlan));

    const originalText = t('actions.generate');
    elements.btnGenerate.disabled = true;
    elements.btnGenerate.textContent = t('actions.generating');
    setStatus(elements, t('status.generating'), 'info');

    try {
        const parsedBundles = [];
        const promptTraceEntries = [];

        if (useTypePlan) {
            for (let index = 0; index < typeChunks.length; index += 1) {
                const batchTypePlan = countTypesFromArray(typeChunks[index]);
                const batchCount = typeChunks[index].length;
                const batchPrompt = buildXaiPrompt({
                    locale,
                    content,
                    exerciseCount: batchCount,
                    typePlan: batchTypePlan,
                    strictTypeCounts: true
                });
                promptTraceEntries.push(
                    formatPromptTraceEntry(batchPrompt, index + 1, typeChunks.length, batchCount, batchTypePlan)
                );
                savePromptTraceToSession(promptTraceEntries.join('\n\n'));
                if (typeChunks.length > 1) {
                    setStatus(elements, `${t('status.generating')} (${index + 1}/${typeChunks.length})`, 'info');
                }

                const result = await generateWithGemini({
                    apiKey,
                    model,
                    prompt: batchPrompt,
                    maxOutputTokens: isPreviewModel ? 12288 : 16384
                });
                parsedBundles.push(result.parsed);
            }
        } else {
            for (let index = 0; index < batchCounts.length; index += 1) {
                const batchCount = batchCounts[index];
                const batchPrompt = buildXaiPrompt({ locale, content, exerciseCount: batchCount });
                promptTraceEntries.push(
                    formatPromptTraceEntry(batchPrompt, index + 1, batchCounts.length, batchCount)
                );
                savePromptTraceToSession(promptTraceEntries.join('\n\n'));
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
        }

        const mergedBundle = enforceRequestedExerciseCount(mergeGeneratedBundles(parsedBundles), exerciseCount);
        const validation = applyBundle(elements, mergedBundle);
        const generatedTypeCount = countTypesFromExercises(mergedBundle?.exercises);

        if (useTypePlan && !sameTypeDistribution(typePlan, generatedTypeCount)) {
            setStatus(elements, t('status.typePlanMismatch'), 'warning');
            return;
        }

        if (validation.valid) {
            setStatus(elements, t('status.generatedOk', { count: validation.summary.exerciseCount }), 'success');
        } else {
            setStatus(elements, t('status.generatedInvalid'), 'error');
        }
    } catch (error) {
        const message = String(error?.message || t('status.unknownError'));
        const parseHint = /JSON|Unexpected|Expected ','|position \d+/i.test(message)
            ? t('status.parseHintJson')
            : '';
        setStatus(elements, t('status.requestError', { message: `${message}${parseHint}` }), 'error');
    } finally {
        elements.btnGenerate.disabled = false;
        elements.btnGenerate.textContent = originalText;
    }
}

function initializeApp() {
    const elements = getDomElements();
    setupMainTabs();

    setupHorizontalResize(elements.layoutResizer, elements.layout, 320, 760, '--left-panel-width');
    setupHorizontalResize(elements.editorResizer, elements.editorWorkspace, 220, 520, '--exercise-nav-width');

    setLocale('es');
    const promptTrace = readPromptTraceFromSession();
    setState({ locale: 'es', promptTrace });
    applyI18n();
    updateHelpLinksByLocale(elements, 'es');
    updateDerivedViews(elements, null, null, promptTrace);
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

    const savedTypePlanRaw = localStorage.getItem('exe_builder_xai_type_plan');
    if (savedTypePlanRaw) {
        try {
            const savedTypePlan = JSON.parse(savedTypePlanRaw);
            setTypePlanToInputs(elements, savedTypePlan);
        } catch {
            setTypePlanToInputs(elements, {});
        }
    }

    updateTypePlanSummary(elements);

    if (Array.isArray(elements.typePlanInputs)) {
        elements.typePlanInputs.forEach((input) => {
            input.addEventListener('input', () => {
                const total = updateTypePlanSummary(elements);
                if (total > 15) {
                    setStatus(elements, t('status.typePlanExceeded'), 'warning');
                }
                const { plan } = buildTypePlanFromInputs(elements);
                localStorage.setItem('exe_builder_xai_type_plan', JSON.stringify(plan));
            });
        });
    }

    if (elements.btnClearTypePlan) {
        elements.btnClearTypePlan.addEventListener('click', () => {
            setTypePlanToInputs(elements, {});
            updateTypePlanSummary(elements);
            localStorage.setItem('exe_builder_xai_type_plan', JSON.stringify({}));
        });
    }

    elements.languageSelect.addEventListener('change', () => {
        const locale = setLocale(elements.languageSelect.value);
        const previousStatus = elements.statusMsg.textContent;
        const previousStatusClass = elements.statusMsg.className;
        setState({ locale });
        applyI18n();
        updateHelpLinksByLocale(elements, locale);
        updateTypePlanSummary(elements);
        updateDerivedViews(elements, appState.data, appState.validation, appState.promptTrace);
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
        updateDerivedViews(elements, state.data, state.validation, state.promptTrace);
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);
