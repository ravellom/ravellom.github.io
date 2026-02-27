import { appState, setState, subscribe } from './core/state.js';
import { normalizeXaiBundle } from './core/normalize-xai.js';
import { validateXaiBundle } from './core/validators.js';
import { EXERCISE_TYPES } from './core/exercise-types.js';
import { exportTeacherProject, exportVisorPackage, exportScorm12Package } from './core/exporters.js';
import { setLocale, t } from './i18n/index.js';
import { getDomElements } from './ui/dom.js';
import { applyI18n, renderValidationResult } from './ui/renderer.js';
import { renderExerciseEditor } from './ui/exercise-editor.js';
import exampleXaiBundle from './examples/example-xai.js';
import { buildXaiPrompt } from './services/prompt-builder.js';
import { generateWithGemini, parseJsonSafe } from './services/gemini.js';
import { importSummaryFile } from './services/file-import.js';

const PROMPT_TRACE_SESSION_KEY = 'exe_builder_xai_prompt_trace';
const DUA_CONFIG_STORAGE_KEY = 'exe_builder_xai_dua_config';
const SINGLE_EXERCISE_TYPE_STORAGE_KEY = 'exe_builder_xai_single_exercise_type';
const TEACHER_CONFIG_STORAGE_KEY = 'exe_builder_xai_teacher_config';
const PROVIDER_MODE_STORAGE_KEY = 'exe_builder_xai_provider_mode';
const EXERCISE_MEMORY_STORAGE_KEY = 'exe_builder_xai_exercise_memory';
const EXPORT_VARIANT_POLICY_STORAGE_KEY = 'exe_builder_xai_export_variant_policy';
const INSIGHTS_DRAWER_OPEN_STORAGE_KEY = 'eduxai_studio_insights_drawer_open';
const WORKSPACE_MODE_STORAGE_KEY = 'eduxai_studio_workspace_mode';
const AUTOSAVE_DRAFT_STORAGE_KEY = 'eduxai_studio_autosave_draft_v1';
const FEEDBACK_FORM_URL = 'https://forms.gle/NqZWPNXopq6YHJK7A';
const MAX_EXERCISES = 10;
const HIGH_COMPLEXITY_COUNT = 8;
const DUA_RECOMMENDED_MIN = 3;
const DUA_RECOMMENDED_MAX = 6;
const EXERCISE_MEMORY_MAX = 24;
const AUTOSAVE_DEBOUNCE_MS = 1200;
const DUA_LABEL_SEQUENCE = ['DUA-Representacion', 'DUA-Accion/Expresion', 'DUA-Implicacion'];
const EQUIVALENT_TYPE_MAP = {
    multiple_choice: ['multiple_choice', 'true_false', 'matching', 'short_answer'],
    true_false: ['true_false', 'multiple_choice'],
    fill_gaps: ['fill_gaps', 'short_answer', 'multiple_choice'],
    ordering: ['ordering', 'matching', 'grouping'],
    matching: ['matching', 'grouping', 'multiple_choice'],
    grouping: ['grouping', 'matching', 'multiple_choice'],
    short_answer: ['short_answer', 'fill_gaps', 'multiple_choice'],
    hotspot: ['hotspot', 'multiple_choice', 'short_answer'],
    slider: ['slider', 'multiple_choice', 'true_false']
};
const DUA_PROFILE_ALIASES = {
    profile_level: {
        inicial: 'initial',
        intermedio: 'intermediate',
        avanzado: 'advanced',
        heterogeneo: 'heterogeneous',
        initial: 'initial',
        intermediate: 'intermediate',
        advanced: 'advanced',
        heterogeneous: 'heterogeneous'
    },
    barrier: {
        dificultad_lectora: 'reading_difficulty',
        sobrecarga_sintactica: 'syntactic_overload',
        atencion_limitada: 'limited_sustained_attention',
        ansiedad_evaluativa: 'assessment_anxiety',
        ninguna_relevante: 'none_relevant',
        reading_difficulty: 'reading_difficulty',
        syntactic_overload: 'syntactic_overload',
        limited_sustained_attention: 'limited_sustained_attention',
        assessment_anxiety: 'assessment_anxiety',
        none_relevant: 'none_relevant'
    },
    modality: {
        individual: 'individual',
        pareja: 'pair',
        grupo: 'group',
        autonomo_online: 'autonomous_online',
        pair: 'pair',
        group: 'group',
        autonomous_online: 'autonomous_online'
    },
    purpose: {
        diagnostica: 'diagnostic',
        formativa: 'formative',
        sumativa: 'summative',
        practica_autonoma: 'autonomous_practice',
        diagnostic: 'diagnostic',
        formative: 'formative',
        summative: 'summative',
        autonomous_practice: 'autonomous_practice'
    },
    variation_type: {
        none: 'none',
        representacion: 'representation',
        accion_expresion: 'action_expression',
        implicacion: 'engagement',
        equilibradas: 'balanced',
        representation: 'representation',
        action_expression: 'action_expression',
        engagement: 'engagement',
        balanced: 'balanced'
    }
};

let autosaveTimerId = null;
let generationLockActive = false;

function getGenerationOverlayNodes() {
    const overlay = document.getElementById('generation-lock-overlay');
    const message = document.getElementById('generation-lock-message');
    return { overlay, message };
}

function setGenerationLock(active, message = '') {
    generationLockActive = Boolean(active);
    const { overlay, message: messageNode } = getGenerationOverlayNodes();
    if (!overlay) {
        return;
    }
    overlay.hidden = !generationLockActive;
    if (messageNode) {
        messageNode.textContent = generationLockActive
            ? String(message || t('status.generating'))
            : '';
    }
}

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
    const persisted = normalizeExerciseMemoryIndex(appState.exerciseMemory);
    const bucketKey = getMemoryBucketKeyForBundle(normalizedBundle);
    const nextMemory = mergeExerciseMemoryIndex(
        persisted,
        bucketKey,
        buildExerciseMemoryEntries(normalizedBundle, 12),
        EXERCISE_MEMORY_MAX
    );
    saveExerciseMemoryToStorage(nextMemory);
    setState({ data: normalizedBundle, validation, exerciseMemory: nextMemory });
    return validation;
}

function setStatus(elements, message, type = 'info') {
    elements.statusMsg.className = `status-msg ${type}`;
    elements.statusMsg.textContent = message;
    if (generationLockActive) {
        const { message: lockMessage } = getGenerationOverlayNodes();
        if (lockMessage) {
            lockMessage.textContent = String(message || t('status.generating'));
        }
    }
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
    if (elements.feedbackLink) {
        elements.feedbackLink.setAttribute('href', FEEDBACK_FORM_URL);
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

function toNonEmptyString(value, fallback) {
    const text = String(value || '').trim();
    return text || fallback;
}

function firstSentence(text, fallback) {
    const value = String(text || '').trim();
    if (!value) {
        return fallback;
    }
    const parts = value.split(/[.!?\n]+/).map((item) => item.trim()).filter(Boolean);
    return toNonEmptyString(parts[0], fallback);
}

function normalizeDuaProfileValue(group, value, fallback = '') {
    const aliases = DUA_PROFILE_ALIASES[group] || {};
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) {
        return fallback;
    }
    return aliases[raw] || raw || fallback;
}

function normalizeDuaProfileCanonical(profile) {
    const source = profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
    const rawCount = Number(source.variant_count);
    const normalizedCount = Number.isFinite(rawCount) ? Math.max(1, Math.min(3, Math.floor(rawCount))) : 1;
    const barriers = Array.isArray(source.barriers)
        ? source.barriers
            .map((item) => normalizeDuaProfileValue('barrier', item))
            .filter(Boolean)
        : [];
    const dedupedBarriers = [];
    const seen = new Set();
    barriers.forEach((item) => {
        if (!seen.has(item)) {
            seen.add(item);
            dedupedBarriers.push(item);
        }
    });
    return {
        profile_level: normalizeDuaProfileValue('profile_level', source.profile_level, 'heterogeneous'),
        barriers: dedupedBarriers,
        modality: normalizeDuaProfileValue('modality', source.modality, 'individual'),
        purpose: normalizeDuaProfileValue('purpose', source.purpose, 'formative'),
        variation_type: normalizeDuaProfileValue('variation_type', source.variation_type, 'none'),
        variant_count: normalizedCount
    };
}

function normalizeMemoryKeyPart(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, '_')
        .slice(0, 64);
}

function buildMemoryBucketKey({ objective = '', topic = '' } = {}) {
    const objectivePart = normalizeMemoryKeyPart(objective);
    const topicPart = normalizeMemoryKeyPart(topic);
    const key = [objectivePart, topicPart].filter(Boolean).join('__');
    return key || 'global';
}

function normalizeMemoryEntry(entry) {
    return String(entry || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 240);
}

function mergeExerciseMemory(existingEntries, newEntries, limit = EXERCISE_MEMORY_MAX) {
    const merged = [...(Array.isArray(existingEntries) ? existingEntries : []), ...(Array.isArray(newEntries) ? newEntries : [])]
        .map((entry) => normalizeMemoryEntry(entry))
        .filter(Boolean);
    if (merged.length === 0) {
        return [];
    }
    const deduped = [];
    const seen = new Set();
    for (let index = merged.length - 1; index >= 0; index -= 1) {
        const item = merged[index];
        const key = item.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            deduped.push(item);
        }
        if (deduped.length >= Math.max(1, limit)) {
            break;
        }
    }
    return deduped.reverse();
}

function mergeExerciseMemoryIndex(memoryIndex, bucketKey, newEntries, limit = EXERCISE_MEMORY_MAX) {
    const source = memoryIndex && typeof memoryIndex === 'object' && !Array.isArray(memoryIndex) ? memoryIndex : {};
    const next = { ...source };
    const key = String(bucketKey || 'global').trim() || 'global';
    const current = Array.isArray(source[key]) ? source[key] : [];
    next[key] = mergeExerciseMemory(current, newEntries, limit);
    return next;
}

function normalizeExerciseMemoryIndex(rawValue) {
    if (Array.isArray(rawValue)) {
        return { global: mergeExerciseMemory([], rawValue, EXERCISE_MEMORY_MAX) };
    }
    if (!rawValue || typeof rawValue !== 'object') {
        return {};
    }
    const source = rawValue.buckets && typeof rawValue.buckets === 'object' && !Array.isArray(rawValue.buckets)
        ? rawValue.buckets
        : rawValue;
    const normalized = {};
    Object.entries(source).forEach(([rawKey, rawEntries]) => {
        const key = String(rawKey || '').trim();
        if (!key) {
            return;
        }
        const entries = mergeExerciseMemory([], Array.isArray(rawEntries) ? rawEntries : [], EXERCISE_MEMORY_MAX);
        if (entries.length > 0) {
            normalized[key] = entries;
        }
    });
    return normalized;
}

function getMemoryBucketKeyForBundle(bundle) {
    const objective = firstSentence(bundle?.exercises?.[0]?.xai?.pedagogical_alignment?.learning_objective, '');
    const topic = firstSentence(bundle?.resource_metadata?.topic, '');
    return buildMemoryBucketKey({ objective, topic });
}

function getMemoryBucketKeyForRequest(currentBundle, teacherConfig, content) {
    const objective = firstSentence(teacherConfig?.learning_objective, '') || firstSentence(currentBundle?.exercises?.[0]?.xai?.pedagogical_alignment?.learning_objective, '');
    const topic = firstSentence(currentBundle?.resource_metadata?.topic, '') || inferTopicFromContent(content, '');
    return buildMemoryBucketKey({ objective, topic });
}

function loadExerciseMemoryFromStorage() {
    try {
        const raw = localStorage.getItem(EXERCISE_MEMORY_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        return normalizeExerciseMemoryIndex(JSON.parse(raw));
    } catch {
        return {};
    }
}

function saveExerciseMemoryToStorage(memoryIndex) {
    try {
        const normalized = normalizeExerciseMemoryIndex(memoryIndex);
        if (Object.keys(normalized).length === 0) {
            localStorage.removeItem(EXERCISE_MEMORY_STORAGE_KEY);
            return;
        }
        localStorage.setItem(EXERCISE_MEMORY_STORAGE_KEY, JSON.stringify({ version: 2, buckets: normalized }));
    } catch {
        // ignore storage failures
    }
}

function inferTopicFromContent(content, fallback) {
    const value = String(content || '').trim();
    if (!value) {
        return fallback;
    }
    const words = value.split(/\s+/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
    return toNonEmptyString(words.join(' '), fallback);
}

function ensureRequiredRootFields(bundle, { locale, content, exerciseCount }) {
    if (!bundle || typeof bundle !== 'object') {
        return bundle;
    }

    const fallbackTitle = locale === 'en'
        ? `AI-generated XAI set (${exerciseCount})`
        : `Set XAI generado por IA (${exerciseCount})`;
    const fallbackTopic = locale === 'en'
        ? 'Programming fundamentals'
        : 'Fundamentos de programacion';
    const fallbackGradeLevel = locale === 'en' ? 'secondary' : 'secundaria';
    const fallbackAudience = locale === 'en' ? 'Students' : 'Estudiantes';
    const fallbackGoal = locale === 'en'
        ? 'Practice the core concepts described in the source material.'
        : 'Practicar los conceptos nucleares descritos en el material fuente.';
    const fallbackSourceRef = locale === 'en' ? 'Teacher summary' : 'Resumen docente';

    const metadata = bundle.resource_metadata && typeof bundle.resource_metadata === 'object'
        ? bundle.resource_metadata
        : {};
    const outputLanguage = String(locale || 'en').trim().toLowerCase() || 'en';
    bundle.resource_metadata = {
        ...metadata,
        title: toNonEmptyString(metadata.title, fallbackTitle),
        topic: toNonEmptyString(metadata.topic, inferTopicFromContent(content, fallbackTopic)),
        grade_level: toNonEmptyString(metadata.grade_level, fallbackGradeLevel),
        language: outputLanguage
    };

    const context = bundle.generation_context && typeof bundle.generation_context === 'object'
        ? bundle.generation_context
        : {};
    const sourceRefs = Array.isArray(context.source_material_refs)
        ? context.source_material_refs.map((item) => String(item || '').trim()).filter((item) => item.length >= 3)
        : [];
    bundle.generation_context = {
        ...context,
        audience: toNonEmptyString(context.audience, fallbackAudience),
        pedagogical_goal: toNonEmptyString(context.pedagogical_goal, firstSentence(content, fallbackGoal)),
        constraints: Array.isArray(context.constraints) ? context.constraints : [],
        source_material_refs: sourceRefs.length > 0 ? sourceRefs : [fallbackSourceRef]
    };

    return bundle;
}

function enforceCanonicalDuaProfile(bundle, duaConfig) {
    if (!bundle || typeof bundle !== 'object') {
        return bundle;
    }
    const context = bundle.generation_context && typeof bundle.generation_context === 'object' && !Array.isArray(bundle.generation_context)
        ? bundle.generation_context
        : {};
    const enabled = Boolean(context.dua_enabled ?? duaConfig?.enabled);
    bundle.generation_context = {
        ...context,
        dua_enabled: enabled,
        dua_profile: enabled
            ? normalizeDuaProfileCanonical(context.dua_profile || duaConfig || getDefaultDuaConfig())
            : null
    };
    return bundle;
}

function getDefaultDuaConfig() {
    return {
        enabled: false,
        profile_level: 'heterogeneous',
        barriers: [],
        modality: 'individual',
        purpose: 'formative',
        variation_type: 'none',
        variant_count: 1
    };
}

function normalizeDuaConfig(input) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const normalizedProfile = normalizeDuaProfileCanonical(source);
    const variationType = normalizedProfile.variation_type;

    return {
        enabled: Boolean(source.enabled) && variationType !== 'none',
        profile_level: normalizedProfile.profile_level,
        barriers: normalizedProfile.barriers,
        modality: normalizedProfile.modality,
        purpose: normalizedProfile.purpose,
        variation_type: variationType,
        variant_count: variationType === 'none' ? 1 : normalizedProfile.variant_count
    };
}

function readDuaConfigFromDom() {
    const profileLevel = document.getElementById('dua-profile-level');
    const modality = document.getElementById('dua-modality');
    const purpose = document.getElementById('dua-purpose');
    const variationType = document.getElementById('dua-variation-type');
    const variantCount = document.getElementById('dua-variant-count');
    const barrierInputs = Array.from(document.querySelectorAll('.dua-barrier-input'));

    if (!profileLevel || !modality || !purpose || !variationType || !variantCount) {
        return getDefaultDuaConfig();
    }

    const selectedBarriers = barrierInputs
        .filter((input) => input.checked)
        .map((input) => String(input.value || '').trim())
        .filter(Boolean);

    return normalizeDuaConfig({
        enabled: variationType.value !== 'none',
        profile_level: profileLevel.value,
        barriers: selectedBarriers,
        modality: modality.value,
        purpose: purpose.value,
        variation_type: variationType.value,
        variant_count: variantCount.value
    });
}

function setDuaConfigToDom(config) {
    const normalized = normalizeDuaConfig(config);
    const profileLevel = document.getElementById('dua-profile-level');
    const modality = document.getElementById('dua-modality');
    const purpose = document.getElementById('dua-purpose');
    const variationType = document.getElementById('dua-variation-type');
    const variantCount = document.getElementById('dua-variant-count');
    const barrierInputs = Array.from(document.querySelectorAll('.dua-barrier-input'));

    if (profileLevel) profileLevel.value = normalized.profile_level;
    if (modality) modality.value = normalized.modality;
    if (purpose) purpose.value = normalized.purpose;
    if (variationType) variationType.value = normalized.variation_type;
    if (variantCount) {
        variantCount.value = String(normalized.variant_count);
        variantCount.disabled = normalized.variation_type === 'none';
    }

    barrierInputs.forEach((input) => {
        input.checked = normalized.barriers.includes(String(input.value || '').trim());
    });

    return normalized;
}

function loadDuaConfigFromStorage() {
    try {
        const raw = localStorage.getItem(DUA_CONFIG_STORAGE_KEY);
        if (!raw) {
            return getDefaultDuaConfig();
        }
        return normalizeDuaConfig(JSON.parse(raw));
    } catch {
        return getDefaultDuaConfig();
    }
}

function persistDuaConfigFromDom() {
    const config = readDuaConfigFromDom();
    try {
        localStorage.setItem(DUA_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
        // ignore storage failures
    }
    return config;
}

function getDefaultTeacherConfig() {
    return {
        learning_objective: '',
        exercise_language: 'en',
        bloom_level: 'understand',
        difficulty_level: 'medium',
        type_policy: 'locked'
    };
}

function normalizeTeacherConfig(input) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const bloomAliases = {
        recordar: 'remember',
        comprender: 'understand',
        aplicar: 'apply',
        analizar: 'analyze',
        evaluar: 'evaluate',
        crear: 'create'
    };
    const difficultyAliases = {
        bajo: 'low',
        medio: 'medium',
        alto: 'high'
    };
    const bloomRaw = String(source.bloom_level || 'understand').trim().toLowerCase();
    const difficultyRaw = String(source.difficulty_level || 'medium').trim().toLowerCase();
    const exerciseLanguageRaw = String(source.exercise_language || 'en').trim().toLowerCase();
    const bloomLevel = bloomAliases[bloomRaw] || bloomRaw;
    const difficultyLevel = difficultyAliases[difficultyRaw] || difficultyRaw;
    const typePolicy = String(source.type_policy || 'locked').trim().toLowerCase();
    const exerciseLanguage = /^[a-z]{2}(-[a-z]{2})?$/.test(exerciseLanguageRaw) ? exerciseLanguageRaw : 'en';
    return {
        learning_objective: String(source.learning_objective || '').trim(),
        exercise_language: exerciseLanguage,
        bloom_level: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].includes(bloomLevel) ? bloomLevel : 'understand',
        difficulty_level: ['low', 'medium', 'high'].includes(difficultyLevel) ? difficultyLevel : 'medium',
        type_policy: ['locked', 'equivalent'].includes(typePolicy) ? typePolicy : 'locked'
    };
}

function readTeacherConfigFromDom() {
    const learningObjective = document.getElementById('teacher-learning-objective');
    const exerciseLanguage = document.getElementById('teacher-exercise-language');
    const bloomLevel = document.getElementById('teacher-bloom-level');
    const difficultyLevel = document.getElementById('teacher-difficulty-level');
    const typePolicy = document.getElementById('teacher-type-policy');

    if (!learningObjective || !exerciseLanguage || !bloomLevel || !difficultyLevel || !typePolicy) {
        return getDefaultTeacherConfig();
    }

    return normalizeTeacherConfig({
        learning_objective: learningObjective.value,
        exercise_language: exerciseLanguage.value,
        bloom_level: bloomLevel.value,
        difficulty_level: difficultyLevel.value,
        type_policy: typePolicy.value
    });
}

function detectLearningObjectiveTypos(text) {
    const value = String(text || '').trim();
    if (!value) {
        return [];
    }
    const issues = [];
    const checks = [
        { pattern: /\bunderestand\b/i, suggestion: 'understand' },
        { pattern: /\bcicle\b/i, suggestion: 'cycle' },
        { pattern: /\bfuntion\b/i, suggestion: 'function' }
    ];
    checks.forEach((check) => {
        const match = value.match(check.pattern);
        if (match) {
            issues.push({ token: match[0], suggestion: check.suggestion });
        }
    });
    return issues;
}

function setTeacherConfigToDom(config) {
    const normalized = normalizeTeacherConfig(config);
    const learningObjective = document.getElementById('teacher-learning-objective');
    const exerciseLanguage = document.getElementById('teacher-exercise-language');
    const bloomLevel = document.getElementById('teacher-bloom-level');
    const difficultyLevel = document.getElementById('teacher-difficulty-level');
    const typePolicy = document.getElementById('teacher-type-policy');

    if (learningObjective) learningObjective.value = normalized.learning_objective;
    if (exerciseLanguage) exerciseLanguage.value = normalized.exercise_language;
    if (bloomLevel) bloomLevel.value = normalized.bloom_level;
    if (difficultyLevel) difficultyLevel.value = normalized.difficulty_level;
    if (typePolicy) typePolicy.value = normalized.type_policy;

    return normalized;
}

function loadTeacherConfigFromStorage() {
    try {
        const raw = localStorage.getItem(TEACHER_CONFIG_STORAGE_KEY);
        if (!raw) {
            return getDefaultTeacherConfig();
        }
        return normalizeTeacherConfig(JSON.parse(raw));
    } catch {
        return getDefaultTeacherConfig();
    }
}

function persistTeacherConfigFromDom() {
    const config = readTeacherConfigFromDom();
    try {
        localStorage.setItem(TEACHER_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
        // ignore storage failures
    }
    return config;
}

function normalizeProviderMode(value) {
    const mode = String(value || '').trim().toLowerCase();
    return mode === 'manual' ? 'manual' : 'direct';
}

function setProviderMode(elements, mode) {
    const normalized = normalizeProviderMode(mode);
    if (elements.providerMode) {
        elements.providerMode.value = normalized;
    }
    if (elements.manualAiPanel) {
        elements.manualAiPanel.hidden = normalized !== 'manual';
    }
    return normalized;
}

function loadProviderModeFromStorage() {
    try {
        return normalizeProviderMode(localStorage.getItem(PROVIDER_MODE_STORAGE_KEY));
    } catch {
        return 'direct';
    }
}

function normalizeWorkspaceMode(value) {
    const mode = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
    if (
        mode === 'research'
        || mode === 'advanced'
        || mode === 'designer'
        || mode === 'full'
        || mode === 'teacher_researcher'
        || mode === 'docente_investigador'
        || mode === 'investigador'
    ) {
        return 'research';
    }
    return 'basic';
}

function loadWorkspaceModeFromStorage() {
    try {
        return normalizeWorkspaceMode(localStorage.getItem(WORKSPACE_MODE_STORAGE_KEY));
    } catch {
        return 'basic';
    }
}

function loadAutosaveDraft() {
    try {
        const raw = localStorage.getItem(AUTOSAVE_DRAFT_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

function saveAutosaveDraft(payload) {
    try {
        localStorage.setItem(AUTOSAVE_DRAFT_STORAGE_KEY, JSON.stringify(payload));
        return true;
    } catch {
        return false;
    }
}

function clearAutosaveDraft() {
    try {
        localStorage.removeItem(AUTOSAVE_DRAFT_STORAGE_KEY);
    } catch {
        // ignore storage failures
    }
}

function refreshRecoverDraftUi(elements) {
    if (!elements?.btnRecoverDraft) {
        return;
    }
    elements.btnRecoverDraft.disabled = !loadAutosaveDraft();
}

function restoreAutosaveDraftIntoApp(elements, draft, fallbackLocale = 'en') {
    if (!draft || typeof draft !== 'object') {
        return false;
    }

    const draftLocale = setLocale(String(draft.locale || fallbackLocale));
    if (elements.languageSelect) {
        elements.languageSelect.value = draftLocale;
    }
    setProviderMode(elements, normalizeProviderMode(draft.provider_mode));
    if (elements.singleExerciseType) {
        const savedType = String(draft.single_exercise_type || '').trim();
        elements.singleExerciseType.value = EXERCISE_TYPES.includes(savedType) ? savedType : '';
    }
    if (draft.teacher_config) {
        setTeacherConfigToDom(normalizeTeacherConfig(draft.teacher_config));
    }
    if (draft.dua_config) {
        setDuaConfigToDom(normalizeDuaConfig(draft.dua_config));
    }
    if (draft.data && typeof draft.data === 'object') {
        const normalizedBundle = normalizeXaiBundle(draft.data);
        const validation = validateXaiBundle(normalizedBundle, t);
        setState({
            locale: draftLocale,
            data: normalizedBundle,
            validation,
            promptTrace: String(draft.prompt_trace || ''),
            workspaceMode: normalizeWorkspaceMode(draft.workspace_mode || loadWorkspaceModeFromStorage())
        });
    } else {
        setState({
            locale: draftLocale,
            data: null,
            validation: null,
            promptTrace: String(draft.prompt_trace || ''),
            workspaceMode: normalizeWorkspaceMode(draft.workspace_mode || loadWorkspaceModeFromStorage())
        });
    }

    if (!String(draft.prompt_trace || '').trim()) {
        savePromptTraceToSession('');
    } else {
        savePromptTraceToSession(String(draft.prompt_trace || ''));
    }
    return true;
}

function applyWorkspaceMode(elements, mode) {
    const normalized = normalizeWorkspaceMode(mode);
    const insightsDetails = document.getElementById('core-insights-details');
    const jsonOutputDetails = document.getElementById('json-output-details');
    const promptTraceDetails = document.getElementById('prompt-trace-details');

    if (elements.workspaceModeSelect) {
        elements.workspaceModeSelect.value = normalized;
    }

    document.documentElement.setAttribute('data-workspace-mode', normalized);

    const showInsightsControl = normalized !== 'basic';
    if (insightsDetails) {
        insightsDetails.style.display = showInsightsControl ? '' : 'none';
        if (!showInsightsControl) {
            insightsDetails.open = false;
        }
    }

    const showJsonOutput = normalized !== 'basic';
    if (jsonOutputDetails) {
        jsonOutputDetails.style.display = showJsonOutput ? '' : 'none';
    }

    const showPromptTrace = normalized === 'research';
    if (promptTraceDetails) {
        promptTraceDetails.style.display = showPromptTrace ? '' : 'none';
    }

    const navDua = document.querySelector('.left-nav-link[data-target="sec-dua"]');
    const secDua = document.getElementById('sec-dua');
    const showDuaConfig = true;
    if (navDua) {
        navDua.style.display = showDuaConfig ? '' : 'none';
    }
    if (secDua) {
        secDua.style.display = showDuaConfig ? '' : 'none';
    }

    const navProject = document.querySelector('.left-nav-link[data-target="sec-project"]');
    const secProject = document.getElementById('sec-project');
    if (navProject) {
        navProject.style.display = '';
    }
    if (secProject) {
        secProject.style.display = '';
    }

    const navStudents = document.querySelector('.left-nav-link[data-target="sec-student-export"]');
    const secStudents = document.getElementById('sec-student-export');
    const showStudentExport = true;
    if (navStudents) {
        navStudents.style.display = showStudentExport ? '' : 'none';
    }
    if (secStudents) {
        secStudents.style.display = showStudentExport ? '' : 'none';
    }
    const activeLeft = document.querySelector('.left-nav-link.active');
    if (activeLeft && activeLeft.style.display === 'none') {
        const firstVisible = Array.from(document.querySelectorAll('.left-nav-link')).find((node) => node.style.display !== 'none');
        if (firstVisible) {
            firstVisible.click();
        }
    }

    const technicalButton = document.querySelector('.exercise-tab-btn[data-target="tab-technical"]');
    const technicalPanel = document.getElementById('tab-technical');
    const showTechnical = normalized !== 'basic';
    if (technicalButton) {
        technicalButton.style.display = showTechnical ? '' : 'none';
    }
    if (technicalPanel) {
        technicalPanel.style.display = showTechnical ? '' : 'none';
    }
    if (!showTechnical && technicalButton?.classList.contains('active')) {
        const fallbackTab = document.querySelector('.exercise-tab-btn[data-target="tab-design"]')
            || Array.from(document.querySelectorAll('.exercise-tab-btn')).find((btn) => btn.style.display !== 'none');
        fallbackTab?.click();
    }

    return normalized;
}

function scheduleAutosave(elements) {
    if (autosaveTimerId) {
        clearTimeout(autosaveTimerId);
    }
    autosaveTimerId = setTimeout(() => {
        const teacherConfig = readTeacherConfigFromDom();
        const draft = {
            saved_at: new Date().toISOString(),
            locale: String(appState.locale || 'en'),
            workspace_mode: normalizeWorkspaceMode(appState.workspaceMode || 'basic'),
            provider_mode: normalizeProviderMode(elements?.providerMode?.value || loadProviderModeFromStorage()),
            single_exercise_type: String(elements?.singleExerciseType?.value || '').trim(),
            teacher_config: teacherConfig,
            dua_config: readDuaConfigFromDom(),
            data: appState.data || null,
            prompt_trace: String(appState.promptTrace || '').trim()
        };
        saveAutosaveDraft(draft);
        refreshRecoverDraftUi(elements);
    }, AUTOSAVE_DEBOUNCE_MS);
}

function parseManualJson(rawText) {
    const text = String(rawText || '').trim();
    if (!text) {
        throw new Error('empty_manual_json');
    }
    return parseJsonSafe(text);
}

function ensureStringMin(value, minLength, fallback) {
    const text = String(value || '').trim();
    if (text.length >= minLength) {
        return text;
    }
    const base = String(fallback || '').trim();
    if (!base) {
        return text || '';
    }
    if (base.length >= minLength) {
        return base;
    }
    return `${base} ${'Additional pedagogical detail provided for minimum explainability compliance.'.slice(0, Math.max(0, minLength - base.length + 1))}`.trim();
}

function normalizeArrayText(value, fallbackItem) {
    const source = Array.isArray(value)
        ? value.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
    if (source.length > 0) {
        return source;
    }
    return [String(fallbackItem || '').trim()].filter(Boolean);
}

function normalizeCatalogValue(value, allowed, fallback) {
    const key = String(value || '').trim().toLowerCase();
    return allowed.includes(key) ? key : fallback;
}

function applyLocalXaiAutoRepair(bundle, { teacherConfig, modelName, promptId = 'xai_prompt_v2', locale = 'en' } = {}) {
    if (!bundle || typeof bundle !== 'object') {
        return bundle;
    }
    const exercises = Array.isArray(bundle.exercises) ? bundle.exercises : [];
    const objective = String(teacherConfig?.learning_objective || '').trim();
    const bloom = normalizeCatalogValue(teacherConfig?.bloom_level, ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'], 'understand');
    const difficulty = normalizeCatalogValue(teacherConfig?.difficulty_level, ['low', 'medium', 'high'], 'medium');
    const nowIso = new Date().toISOString();

    exercises.forEach((exercise, index) => {
        if (!exercise || typeof exercise !== 'object') {
            return;
        }
        if (!exercise.xai || typeof exercise.xai !== 'object' || Array.isArray(exercise.xai)) {
            exercise.xai = {};
        }
        const xai = exercise.xai;
        const promptText = String(exercise?.content?.prompt_text || '').trim();
        const fallbackCompetency = locale === 'es' ? 'Competencia disciplinar aplicada' : 'Applied disciplinary competency';

        xai.why_this_exercise = ensureStringMin(
            xai.why_this_exercise,
            40,
            locale === 'es'
                ? 'Este ejercicio fue seleccionado para evaluar el objetivo docente con una tarea clara y verificable.'
                : 'This exercise was selected to assess the teacher objective through a clear and verifiable task.'
        );

        if (!xai.pedagogical_alignment || typeof xai.pedagogical_alignment !== 'object' || Array.isArray(xai.pedagogical_alignment)) {
            xai.pedagogical_alignment = {};
        }
        xai.pedagogical_alignment.learning_objective = ensureStringMin(
            xai.pedagogical_alignment.learning_objective,
            6,
            objective || (locale === 'es' ? 'Objetivo de aprendizaje del docente' : 'Teacher learning objective')
        );
        xai.pedagogical_alignment.competency = ensureStringMin(xai.pedagogical_alignment.competency, 4, fallbackCompetency);
        xai.pedagogical_alignment.bloom_level = normalizeCatalogValue(xai.pedagogical_alignment.bloom_level || bloom, ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'], bloom);
        xai.pedagogical_alignment.difficulty_level = normalizeCatalogValue(xai.pedagogical_alignment.difficulty_level || difficulty, ['low', 'medium', 'high'], difficulty);

        if (!xai.content_selection || typeof xai.content_selection !== 'object' || Array.isArray(xai.content_selection)) {
            xai.content_selection = {};
        }
        xai.content_selection.why_this_content = ensureStringMin(
            xai.content_selection.why_this_content,
            40,
            locale === 'es'
                ? 'El contenido fue elegido porque representa el concepto central y permite comprobar comprension en contexto.'
                : 'The selected content represents the core concept and supports checking understanding in context.'
        );
        xai.content_selection.source_refs = normalizeArrayText(
            xai.content_selection.source_refs,
            locale === 'es' ? 'Material fuente del docente' : 'Teacher source material'
        );
        xai.content_selection.alternatives_considered = normalizeArrayText(
            xai.content_selection.alternatives_considered,
            locale === 'es' ? 'Alternativa descartada por menor alineacion pedagogica' : 'Alternative discarded due to lower pedagogical alignment'
        );

        if (!xai.design_rationale || typeof xai.design_rationale !== 'object' || Array.isArray(xai.design_rationale)) {
            xai.design_rationale = {};
        }
        xai.design_rationale.why_this_type = ensureStringMin(
            xai.design_rationale.why_this_type,
            10,
            locale === 'es'
                ? 'El tipo de ejercicio facilita evidenciar el aprendizaje esperado.'
                : 'This exercise type helps make the expected learning evidence observable.'
        );
        xai.design_rationale.why_this_distractors = ensureStringMin(
            xai.design_rationale.why_this_distractors,
            10,
            locale === 'es'
                ? 'Las opciones alternativas capturan errores frecuentes y mejoran la evaluacion formativa.'
                : 'Alternative options capture common misconceptions and improve formative assessment value.'
        );
        const expectedTime = Number(xai.design_rationale.expected_time_sec);
        xai.design_rationale.expected_time_sec = Number.isInteger(expectedTime) && expectedTime >= 10 ? expectedTime : 90;
        xai.design_rationale.cognitive_load = normalizeCatalogValue(xai.design_rationale.cognitive_load, ['low', 'medium', 'high'], 'medium');

        if (!xai.fairness_and_risk || typeof xai.fairness_and_risk !== 'object' || Array.isArray(xai.fairness_and_risk)) {
            xai.fairness_and_risk = {};
        }
        xai.fairness_and_risk.potential_biases = normalizeArrayText(
            xai.fairness_and_risk.potential_biases,
            locale === 'es' ? 'Posible diferencia de conocimientos previos en el grupo.' : 'Potential variation in prior knowledge across learners.'
        );
        xai.fairness_and_risk.mitigations = normalizeArrayText(
            xai.fairness_and_risk.mitigations,
            locale === 'es' ? 'Incluir apoyo adicional y ejemplo guiado durante la revision docente.' : 'Include additional support and a guided example during teacher review.'
        );

        if (!xai.human_oversight || typeof xai.human_oversight !== 'object' || Array.isArray(xai.human_oversight)) {
            xai.human_oversight = {};
        }
        xai.human_oversight.review_protocol = ensureStringMin(
            xai.human_oversight.review_protocol,
            10,
            locale === 'es' ? 'Docente revisa validez disciplinar, claridad y pertinencia contextual antes de publicar.' : 'Teacher reviews disciplinary validity, clarity, and contextual fit before publishing.'
        );
        xai.human_oversight.teacher_action_on_risk = ensureStringMin(
            xai.human_oversight.teacher_action_on_risk,
            10,
            locale === 'es' ? 'Si detecta riesgo, el docente ajusta enunciado, andamiaje o formato de respuesta.' : 'If risk is detected, the teacher adjusts prompt wording, scaffolding, or response format.'
        );
        xai.human_oversight.override_policy = ensureStringMin(
            xai.human_oversight.override_policy,
            10,
            locale === 'es' ? 'La decision final es siempre humana y puede anular cualquier salida automatica.' : 'Final decision remains human and can override any automated output.'
        );

        if (!xai.quality_of_explanation || typeof xai.quality_of_explanation !== 'object' || Array.isArray(xai.quality_of_explanation)) {
            xai.quality_of_explanation = {};
        }
        xai.quality_of_explanation.target_audience = normalizeCatalogValue(xai.quality_of_explanation.target_audience, ['teacher', 'student', 'mixed'], 'mixed');
        xai.quality_of_explanation.clarity_level = normalizeCatalogValue(xai.quality_of_explanation.clarity_level, ['low', 'medium', 'high'], 'high');
        xai.quality_of_explanation.actionable_feedback = ensureStringMin(
            xai.quality_of_explanation.actionable_feedback,
            10,
            locale === 'es' ? 'Entregar retroalimentacion concreta indicando que corregir y como volver a intentarlo.' : 'Provide concrete feedback on what to fix and how to try again.'
        );
        xai.quality_of_explanation.adaptation_notes = ensureStringMin(
            xai.quality_of_explanation.adaptation_notes,
            10,
            locale === 'es' ? 'Ajustar apoyo segun barreras previstas y modalidad de trabajo seleccionada.' : 'Adjust support based on expected barriers and selected work modality.'
        );

        if (!xai.uncertainty || typeof xai.uncertainty !== 'object' || Array.isArray(xai.uncertainty)) {
            xai.uncertainty = {};
        }
        const confidence = Number(xai.uncertainty.confidence);
        xai.uncertainty.confidence = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.78;
        xai.uncertainty.limitations = normalizeArrayText(
            xai.uncertainty.limitations,
            locale === 'es' ? 'La propuesta depende del contexto local y requiere validacion docente final.' : 'The proposal depends on local context and requires final teacher validation.'
        );

        if (!xai.counterfactual || typeof xai.counterfactual !== 'object' || Array.isArray(xai.counterfactual)) {
            xai.counterfactual = {};
        }
        xai.counterfactual.condition = ensureStringMin(
            xai.counterfactual.condition,
            4,
            locale === 'es' ? 'Si cambia el perfil o conocimiento previo del grupo.' : 'If learner profile or prior knowledge conditions change.'
        );
        xai.counterfactual.expected_change = ensureStringMin(
            xai.counterfactual.expected_change,
            4,
            locale === 'es' ? 'Se ajustaria el andamiaje, la dificultad o el formato para mantener el objetivo.' : 'Scaffolding, difficulty, or format would be adjusted to preserve the objective.'
        );

        if (!xai.trace || typeof xai.trace !== 'object' || Array.isArray(xai.trace)) {
            xai.trace = {};
        }
        // Always reflect the actual runtime model used by this app execution.
        if (String(modelName || '').trim()) {
            xai.trace.model = String(modelName).trim();
        } else {
            xai.trace.model = ensureStringMin(xai.trace.model, 2, 'unknown-model');
        }
        xai.trace.prompt_id = ensureStringMin(xai.trace.prompt_id, 2, promptId);
        // Refresh timestamp to avoid stale/example trace dates.
        xai.trace.timestamp_utc = nowIso;

        if (!exercise.dua || typeof exercise.dua !== 'object' || Array.isArray(exercise.dua)) {
            exercise.dua = {};
        }
        exercise.dua.core_statement = ensureStringMin(
            exercise.dua.core_statement,
            12,
            objective || promptText || `core_statement_${index + 1}`
        );
    });
    return bundle;
}

function buildRepairPrompt({
    bundle,
    validation,
    teacherConfig,
    selectedExerciseType,
    exerciseCount,
    exerciseLanguage = 'en',
    duaConfig
}) {
    const issues = Array.isArray(validation?.errors) ? validation.errors.slice(0, 24) : [];
    const issueLines = issues.length > 0
        ? issues.map((item, index) => `${index + 1}. ${String(item || '').trim()}`).join('\n')
        : 'No explicit issues listed. Ensure full schema compliance and minimum XAI criteria.';
    const compactDua = duaConfig && typeof duaConfig === 'object'
        ? {
            enabled: Boolean(duaConfig.enabled),
            variation_type: String(duaConfig.variation_type || 'none').trim() || 'none',
            variant_count: Math.max(1, Math.min(3, Number(duaConfig.variant_count) || 1))
        }
        : { enabled: false, variation_type: 'none', variant_count: 1 };

    return `You are an instructional designer and XAI specialist.
Return ONLY valid JSON, no markdown, no comments.

Repair the JSON below. Keep pedagogical meaning and exercise intent, but fix structure and missing XAI requirements.

MANDATORY REPAIR RULES:
- Keep exactly ${exerciseCount} exercises.
- Keep requested base type policy consistent with selected type "${selectedExerciseType}".
- Keep teacher invariants exactly:
  - learning_objective: "${String(teacherConfig?.learning_objective || '').trim()}"
  - bloom_level: "${String(teacherConfig?.bloom_level || 'understand').trim()}"
  - difficulty_level: "${String(teacherConfig?.difficulty_level || 'medium').trim()}"
- Keep output language locale for learner-facing text: "${String(exerciseLanguage || 'en').trim().toLowerCase()}".
- Ensure every exercise has complete xai fields:
  why_this_exercise, pedagogical_alignment, content_selection, design_rationale,
  fairness_and_risk, human_oversight, quality_of_explanation, uncertainty,
  counterfactual, trace.
- Ensure min quality thresholds:
  why_this_exercise >= 40 chars,
  content_selection.why_this_content >= 40 chars,
  at least 1 source_refs,
  at least 1 uncertainty.limitations,
  complete human_oversight, complete quality_of_explanation,
  valid trace.model, trace.prompt_id, trace.timestamp_utc.
- Preserve IDs if possible.
- Do not add text outside JSON.

DUA CONTEXT:
${JSON.stringify(compactDua, null, 2)}

ERRORS TO FIX:
${issueLines}

JSON TO REPAIR:
${JSON.stringify(bundle, null, 2)}`;
}

function buildGenerationBatchSpecs({ useTypePlan, typePlan, exerciseCount, chunkSize }) {
    const hasTypePlan = typePlan && typeof typePlan === 'object' && !Array.isArray(typePlan) && Object.keys(typePlan).length > 0;
    if (useTypePlan && hasTypePlan) {
        const typeChunks = chunkArray(expandTypePlan(typePlan), chunkSize);
        return typeChunks.map((chunk) => ({
            count: chunk.length,
            typePlan: countTypesFromArray(chunk),
            strictTypeCounts: true
        }));
    }

    return buildBatchCounts(exerciseCount, chunkSize).map((count) => ({
        count,
        typePlan: null,
        strictTypeCounts: false
    }));
}

function evaluateGenerationAdvisory(elements) {
    const duaConfig = readDuaConfigFromDom();
    const duaEnabled = Boolean(duaConfig?.enabled);
    const effectiveCount = duaEnabled
        ? Math.max(1, Math.min(3, Number(duaConfig.variant_count) || 1))
        : 1;

    if (effectiveCount >= HIGH_COMPLEXITY_COUNT) {
        setStatus(elements, t('status.highComplexityCount', { count: effectiveCount }), 'warning');
        return;
    }

    if (duaEnabled && (effectiveCount < DUA_RECOMMENDED_MIN || effectiveCount > DUA_RECOMMENDED_MAX)) {
        setStatus(elements, t('status.duaRecommendedCoreRange', { min: DUA_RECOMMENDED_MIN, max: DUA_RECOMMENDED_MAX }), 'warning');
    }
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
    const insightsDetails = document.getElementById('core-insights-details');
    if (!insightsDetails) {
        return;
    }

    let openByDefault = false;
    try {
        openByDefault = localStorage.getItem(INSIGHTS_DRAWER_OPEN_STORAGE_KEY) === '1';
    } catch {
        openByDefault = false;
    }
    insightsDetails.open = openByDefault;
    insightsDetails.addEventListener('toggle', () => {
        try {
            localStorage.setItem(INSIGHTS_DRAWER_OPEN_STORAGE_KEY, insightsDetails.open ? '1' : '0');
        } catch {
            // ignore storage issues
        }
    });
}

function applyDuaVariantFallback(bundle, duaConfig) {
    if (!bundle || typeof bundle !== 'object' || !duaConfig?.enabled) {
        return bundle;
    }
    const exercises = Array.isArray(bundle.exercises) ? bundle.exercises : [];
    const groupSize = Math.max(1, Math.min(3, Number(duaConfig.variant_count) || 1));
    exercises.forEach((exercise, index) => {
        if (!exercise || typeof exercise !== 'object') {
            return;
        }
        const dua = exercise.dua && typeof exercise.dua === 'object' ? exercise.dua : {};
        const variantIndex = Number(dua.variant_index) || ((index % groupSize) + 1);
        const coreOrdinal = Math.floor(index / groupSize) + 1;
        exercise.dua = {
            ...dua,
            label: String(dua.label || DUA_LABEL_SEQUENCE[(variantIndex - 1) % DUA_LABEL_SEQUENCE.length]),
            adaptation_focus: String(dua.adaptation_focus || duaConfig.variation_type || 'dua_adaptation'),
            xai_summary: String(dua.xai_summary || ''),
            core_id: String(dua.core_id || `core_${coreOrdinal}`),
            variant_index: Math.max(1, Math.min(3, variantIndex)),
            variant_total: Math.max(1, Math.min(3, Number(dua.variant_total) || groupSize))
        };
    });
    return bundle;
}

function appendGeneratedBundle(activeBundle, generatedBundle) {
    const current = activeBundle && typeof activeBundle === 'object' ? activeBundle : null;
    const incoming = generatedBundle && typeof generatedBundle === 'object' ? generatedBundle : null;
    if (!incoming) {
        return current;
    }
    if (!current) {
        return incoming;
    }

    const currentExercises = Array.isArray(current.exercises) ? current.exercises : [];
    const incomingExercisesRaw = Array.isArray(incoming.exercises) ? incoming.exercises : [];
    const maxCurrentCore = currentExercises.reduce((max, exercise) => {
        const coreId = String(exercise?.dua?.core_id || '').trim();
        const match = /^core_(\d+)$/i.exec(coreId);
        if (!match) {
            return max;
        }
        return Math.max(max, Number(match[1]) || 0);
    }, 0);

    const coreMap = new Map();
    let nextCore = maxCurrentCore + 1;
    const incomingExercises = incomingExercisesRaw.map((exercise) => {
        if (!exercise || typeof exercise !== 'object') {
            return exercise;
        }
        const cloned = { ...exercise };
        const dua = cloned.dua && typeof cloned.dua === 'object' ? { ...cloned.dua } : {};
        const rawCore = String(dua.core_id || '').trim() || `core_tmp_${nextCore}`;
        if (!coreMap.has(rawCore)) {
            coreMap.set(rawCore, `core_${nextCore}`);
            nextCore += 1;
        }
        dua.core_id = coreMap.get(rawCore);
        cloned.dua = dua;
        return cloned;
    });
    const merged = {
        ...current,
        exercises: [...currentExercises, ...incomingExercises]
    };
    const deduped = mergeGeneratedBundles([merged]);
    return deduped || merged;
}

async function generateWithModelRetries({ apiKey, model, prompt, isPreviewModel, maxAttempts = 3 }) {
    let lastError = null;
    const attempts = Math.max(1, Number(maxAttempts) || 1);
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await generateWithGemini({
                apiKey,
                model,
                prompt,
                maxOutputTokens: isPreviewModel ? 12288 : 16384,
                timeoutMs: isPreviewModel ? 120000 : 90000
            });
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error('generation_failed');
}

function buildVariantFocus(index) {
    const focusByIndex = [
        'Representation support: add clearer examples and comprehension scaffolds.',
        'Action and expression support: adjust response format and guided interaction.',
        'Engagement support: contextualized scenario to increase motivation.'
    ];
    return focusByIndex[index % focusByIndex.length];
}

function formatDuaLabelForUi(label, fallbackIndex = 1) {
    const key = String(label || '').trim();
    const map = {
        'DUA-Representacion': t('editor.variantRepresentation'),
        'DUA-Accion/Expresion': t('editor.variantActionExpression'),
        'DUA-Implicacion': t('editor.variantEngagement')
    };
    if (map[key]) {
        return map[key];
    }
    return key || `V${Math.max(1, Number(fallbackIndex) || 1)}`;
}

function enforceDuaVariantMetadata(bundle, duaConfig, selectedExerciseType, teacherCoreStatement = '') {
    if (!bundle || typeof bundle !== 'object') {
        return bundle;
    }
    const exercises = Array.isArray(bundle.exercises) ? bundle.exercises : [];
    const total = Math.max(1, Math.min(3, Number(duaConfig?.variant_count) || exercises.length || 1));
    const coreId = `core_${Date.now()}`;
    const coreStatementFallback = String(teacherCoreStatement || exercises[0]?.xai?.pedagogical_alignment?.learning_objective || '').trim();
    exercises.forEach((exercise, index) => {
        if (!exercise || typeof exercise !== 'object') {
            return;
        }
        exercise.type = selectedExerciseType;
        const currentDua = exercise.dua && typeof exercise.dua === 'object' ? exercise.dua : {};
        const variantIndex = index + 1;
        exercise.dua = {
            ...currentDua,
            label: DUA_LABEL_SEQUENCE[(variantIndex - 1) % DUA_LABEL_SEQUENCE.length],
            adaptation_focus: String(currentDua.adaptation_focus || buildVariantFocus(index)),
            xai_summary: String(currentDua.xai_summary || firstSentence(exercise?.xai?.why_this_exercise, 'UDL variant generated with same conceptual core.')),
            core_statement: String(currentDua.core_statement || coreStatementFallback),
            core_id: coreId,
            variant_index: variantIndex,
            variant_total: total
        };
    });
    return bundle;
}

function buildExerciseMemoryEntries(bundle, limit = 8) {
    const exercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];
    const recent = exercises.slice(-Math.max(1, limit));
    return recent.map((exercise) => {
        const type = String(exercise?.type || '').trim() || 'unknown';
        const prompt = firstSentence(exercise?.content?.prompt_text, 'no prompt');
        const objective = firstSentence(exercise?.xai?.pedagogical_alignment?.learning_objective, 'no objective');
        const focus = String(exercise?.dua?.adaptation_focus || '').trim();
        return `${type} | objective: ${objective} | prompt: ${prompt}${focus ? ` | udl: ${focus}` : ''}`;
    });
}

function getPromptMemoryEntries(currentBundle, teacherConfig, content, limit = 8) {
    const memoryIndex = normalizeExerciseMemoryIndex(appState.exerciseMemory);
    const bucketKey = getMemoryBucketKeyForRequest(currentBundle, teacherConfig, content);
    const persisted = Array.isArray(memoryIndex[bucketKey]) && memoryIndex[bucketKey].length > 0
        ? memoryIndex[bucketKey]
        : (Array.isArray(memoryIndex.global) ? memoryIndex.global : []);
    const current = buildExerciseMemoryEntries(currentBundle, limit);
    return mergeExerciseMemory(persisted, current, limit);
}

function getAllowedEquivalentTypes(baseType) {
    const key = String(baseType || '').trim();
    const allowed = Array.isArray(EQUIVALENT_TYPE_MAP[key]) ? EQUIVALENT_TYPE_MAP[key] : [key];
    return allowed.filter((type) => EXERCISE_TYPES.includes(type));
}

function validateEquivalentTypePolicy(bundle, teacherConfig, selectedExerciseType) {
    const exercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];
    if (String(teacherConfig?.type_policy || 'locked') !== 'equivalent' || !selectedExerciseType || exercises.length === 0) {
        return { valid: true, errors: [] };
    }
    const errors = [];
    const actionAllowed = getAllowedEquivalentTypes(selectedExerciseType);
    exercises.forEach((exercise, index) => {
        const type = String(exercise?.type || '').trim();
        const label = String(exercise?.dua?.label || '').trim();
        const isActionExpression = label === 'DUA-Accion/Expresion';
        const allowed = isActionExpression ? actionAllowed : [selectedExerciseType];
        if (!allowed.includes(type)) {
            errors.push(t('status.equivalentTypeMismatch', {
                index: index + 1,
                label: label || 'none',
                type: type || 'unknown',
                allowed: allowed.join(', ')
            }));
        }
    });
    return { valid: errors.length === 0, errors };
}

function harmonizeEquivalentTypes(bundle, teacherConfig, selectedExerciseType) {
    const exercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];
    if (String(teacherConfig?.type_policy || 'locked') !== 'equivalent' || !selectedExerciseType || exercises.length === 0) {
        return bundle;
    }
    const actionAllowed = getAllowedEquivalentTypes(selectedExerciseType);
    exercises.forEach((exercise) => {
        if (!exercise || typeof exercise !== 'object') {
            return;
        }
        const label = String(exercise?.dua?.label || '').trim();
        const isActionExpression = label === 'DUA-Accion/Expresion';
        const type = String(exercise?.type || '').trim();
        if (!isActionExpression) {
            exercise.type = selectedExerciseType;
            return;
        }
        if (!actionAllowed.includes(type)) {
            exercise.type = selectedExerciseType;
        }
    });
    return bundle;
}

function enforceTeacherInvariants(bundle, teacherConfig, selectedExerciseType) {
    if (!bundle || typeof bundle !== 'object') {
        return bundle;
    }
    const exercises = Array.isArray(bundle.exercises) ? bundle.exercises : [];
    exercises.forEach((exercise) => {
        if (!exercise || typeof exercise !== 'object') {
            return;
        }
        if (teacherConfig.type_policy === 'locked') {
            exercise.type = selectedExerciseType;
        }
        if (!exercise.xai || typeof exercise.xai !== 'object' || Array.isArray(exercise.xai)) {
            exercise.xai = {};
        }
        if (!exercise.xai.pedagogical_alignment || typeof exercise.xai.pedagogical_alignment !== 'object' || Array.isArray(exercise.xai.pedagogical_alignment)) {
            exercise.xai.pedagogical_alignment = {};
        }
        exercise.xai.pedagogical_alignment.learning_objective = teacherConfig.learning_objective;
        exercise.xai.pedagogical_alignment.bloom_level = teacherConfig.bloom_level;
        exercise.xai.pedagogical_alignment.difficulty_level = teacherConfig.difficulty_level;
        if (!exercise.dua || typeof exercise.dua !== 'object' || Array.isArray(exercise.dua)) {
            exercise.dua = {};
        }
        exercise.dua.core_statement = String(teacherConfig.learning_objective || exercise.dua.core_statement || '').trim();
    });
    return bundle;
}

function enforceCoreStatementInvariantByCore(bundle, teacherConfig) {
    if (!bundle || typeof bundle !== 'object') {
        return bundle;
    }
    const exercises = Array.isArray(bundle.exercises) ? bundle.exercises : [];
    if (exercises.length === 0) {
        return bundle;
    }
    const groups = new Map();
    exercises.forEach((exercise) => {
        const coreId = String(exercise?.dua?.core_id || '').trim() || 'core_default';
        if (!groups.has(coreId)) {
            groups.set(coreId, []);
        }
        groups.get(coreId).push(exercise);
    });
    groups.forEach((items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return;
        }
        const canonical = String(
            teacherConfig?.learning_objective
            || items[0]?.dua?.core_statement
            || items[0]?.xai?.pedagogical_alignment?.learning_objective
            || ''
        ).trim();
        if (!canonical) {
            return;
        }
        items.forEach((exercise) => {
            if (!exercise.dua || typeof exercise.dua !== 'object' || Array.isArray(exercise.dua)) {
                exercise.dua = {};
            }
            exercise.dua.core_statement = canonical;
        });
    });
    return bundle;
}

function prepareGenerationRequest(elements) {
    const apiKey = elements.apiKeyInput.value.trim();
    const model = elements.modelSelect.value;
    const content = elements.contentInput.value.trim();
    const duaConfig = readDuaConfigFromDom();
    const teacherConfig = readTeacherConfigFromDom();
    const selectedExerciseType = String(elements.singleExerciseType?.value || '').trim();
    const duaVariantCount = duaConfig.enabled ? Math.max(1, Math.min(3, Number(duaConfig.variant_count) || 1)) : 1;
    const exerciseCount = duaVariantCount;
    const expectedTypePlan = teacherConfig.type_policy === 'locked' && selectedExerciseType
        ? { [selectedExerciseType]: exerciseCount }
        : null;
    const useStrictTypePlan = Boolean(expectedTypePlan && Object.keys(expectedTypePlan).length > 0);
    const currentCount = Array.isArray(appState?.data?.exercises) ? appState.data.exercises.length : 0;
    const resultingCount = currentCount + exerciseCount;
    return {
        apiKey,
        model,
        content,
        duaConfig,
        teacherConfig,
        selectedExerciseType,
        duaVariantCount,
        exerciseCount,
        expectedTypePlan,
        useStrictTypePlan,
        resultingCount
    };
}

function setupLeftPanelSections(elements) {
    const panel = document.querySelector('.panel-left');
    if (!panel) {
        return;
    }

    const panelTitle = panel.querySelector('h2');
    const labelApiKey = panel.querySelector('label[for="api-key-input"]');
    const labelModel = panel.querySelector('label[for="model-select"]');
    const labelProviderMode = panel.querySelector('label[for="provider-mode"]');
    const labelContent = panel.querySelector('label[for="content-input"]');
    const labelTypePolicy = panel.querySelector('label[for="teacher-type-policy"]');
    const teacherLockedHelp = panel.querySelector('[data-i18n="ui.teacherLockedHelp"]');
    const typePlanBox = panel.querySelector('.type-plan-box');
    const manualAiPanel = panel.querySelector('#manual-ai-panel');
    const hint = panel.querySelector('.hint');
    const status = elements.statusMsg;

    const createGroup = (id, step, title) => {
        const section = document.createElement('section');
        section.className = 'control-group-panel';
        section.id = id;
        section.setAttribute('aria-hidden', 'true');

        const heading = document.createElement('h3');
        heading.className = 'control-group-title';
        heading.innerHTML = `<span class="group-step">${step}</span><span>${title}</span>`;

        const body = document.createElement('div');
        body.className = 'group-body';

        section.appendChild(heading);
        section.appendChild(body);
        return { section, body };
    };

    const leftHeader = document.createElement('div');
    leftHeader.className = 'left-header';
    if (panelTitle) {
        leftHeader.appendChild(panelTitle);
    }
    const subtitle = document.createElement('p');
    subtitle.className = 'left-subtitle';
    subtitle.textContent = t('ui.leftSubtitle');
    leftHeader.appendChild(subtitle);

    const sectionNav = document.createElement('nav');
    sectionNav.className = 'left-section-nav';
    sectionNav.setAttribute('aria-label', t('ui.panelSectionsLabel'));
    sectionNav.innerHTML = `
        <button type="button" class="left-nav-link" data-target="sec-request">${t('dua.navRequest')}</button>
        <button type="button" class="left-nav-link" data-target="sec-dua">${t('dua.navDua')}</button>
        <button type="button" class="left-nav-link" data-target="sec-ai">${t('dua.navAi')}</button>
        <button type="button" class="left-nav-link" data-target="sec-project">${t('dua.navProject')}</button>
        <button type="button" class="left-nav-link" data-target="sec-student-export">${t('dua.navStudentExport')}</button>
    `;

    const secRequest = createGroup('sec-request', 1, t('dua.sectionRequest'));
    const secDua = createGroup('sec-dua', 2, t('dua.sectionDua'));
    const secAi = createGroup('sec-ai', 3, t('dua.sectionAi'));
    const secProject = createGroup('sec-project', 4, t('dua.sectionProject'));
    const secStudentExport = createGroup('sec-student-export', 5, t('dua.sectionStudentExport'));

    const sourceActions = document.createElement('div');
    sourceActions.className = 'panel-actions';
    const projectActionsTop = document.createElement('div');
    projectActionsTop.className = 'panel-actions';
    const projectActionsBottom = document.createElement('div');
    projectActionsBottom.className = 'panel-actions';
    const exportPolicyWrap = document.createElement('div');
    exportPolicyWrap.className = 'compact-card';
    exportPolicyWrap.innerHTML = `
        <label class="field-label" for="export-variant-policy">${t('ui.exportVariantPolicyLabel')}</label>
        <select id="export-variant-policy" class="control-select">
            <option value="first_per_core">${t('ui.exportVariantPolicyFirst')}</option>
            <option value="manual_select">${t('ui.exportVariantPolicyManual')}</option>
            <option value="random_per_core">${t('ui.exportVariantPolicyRandom')}</option>
        </select>
        <div id="manual-export-config" style="display:none; margin-top:10px;">
            <label class="field-label" for="manual-selection-mode">Manual strategy</label>
            <select id="manual-selection-mode" class="control-select">
                <option value="label_all">Same UDL level for all cores</option>
                <option value="core_map">Advanced per-core selection</option>
            </select>
            <label class="field-label" for="manual-udl-label" style="margin-top:8px;">UDL level (all cores)</label>
            <select id="manual-udl-label" class="control-select">
                <option value="DUA-Representacion">${t('editor.variantRepresentation')}</option>
                <option value="DUA-Accion/Expresion">${t('editor.variantActionExpression')}</option>
                <option value="DUA-Implicacion">${t('editor.variantEngagement')}</option>
            </select>
            <div id="manual-core-map-config" style="display:none; margin-top:10px;"></div>
        </div>
    `;

    const actionBar = document.createElement('div');
    actionBar.className = 'left-action-bar';

    if (labelApiKey) secAi.body.appendChild(labelApiKey);
    if (elements.apiKeyInput) secAi.body.appendChild(elements.apiKeyInput);
    const apiKeyHelp = document.createElement('p');
    apiKeyHelp.className = 'hint';
    apiKeyHelp.style.margin = '8px 0 0';
    apiKeyHelp.innerHTML = `
        <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" class="api-key-help-link">${t('ui.apiKeyHelpText')}</a>
    `;
    secAi.body.appendChild(apiKeyHelp);
    if (labelModel) secAi.body.appendChild(labelModel);
    if (elements.modelSelect) secAi.body.appendChild(elements.modelSelect);
    if (labelProviderMode) secAi.body.appendChild(labelProviderMode);
    if (elements.providerMode) secAi.body.appendChild(elements.providerMode);
    if (manualAiPanel) secAi.body.appendChild(manualAiPanel);

    if (typePlanBox) secRequest.body.appendChild(typePlanBox);
    if (labelContent) secRequest.body.appendChild(labelContent);
    if (elements.contentInput) secRequest.body.appendChild(elements.contentInput);
    if (elements.btnUploadSummary) sourceActions.appendChild(elements.btnUploadSummary);
    if (sourceActions.childElementCount > 0) secRequest.body.appendChild(sourceActions);

    const duaWrap = document.createElement('div');
    duaWrap.className = 'dua-config-grid';
    duaWrap.innerHTML = `
        <label class="field-label" for="dua-profile-level">${t('dua.profileLabel')}</label>
        <select id="dua-profile-level" class="control-select">
            <option value="initial">${t('dua.profileInicial')}</option>
            <option value="intermediate">${t('dua.profileIntermedio')}</option>
            <option value="advanced">${t('dua.profileAvanzado')}</option>
            <option value="heterogeneous">${t('dua.profileHeterogeneo')}</option>
        </select>

        <label class="field-label">${t('dua.barriersLabel')}</label>
        <div class="dua-barriers">
            <label><input class="dua-barrier-input" type="checkbox" value="reading_difficulty"> ${t('dua.barrierDificultadLectora')}</label>
            <label><input class="dua-barrier-input" type="checkbox" value="syntactic_overload"> ${t('dua.barrierSobrecargaSintactica')}</label>
            <label><input class="dua-barrier-input" type="checkbox" value="limited_sustained_attention"> ${t('dua.barrierAtencionLimitada')}</label>
            <label><input class="dua-barrier-input" type="checkbox" value="assessment_anxiety"> ${t('dua.barrierAnsiedadEvaluativa')}</label>
            <label><input class="dua-barrier-input" type="checkbox" value="none_relevant"> ${t('dua.barrierNingunaRelevante')}</label>
        </div>

        <label class="field-label" for="dua-modality">${t('dua.modalityLabel')}</label>
        <select id="dua-modality" class="control-select">
            <option value="individual">${t('dua.modalityIndividual')}</option>
            <option value="pair">${t('dua.modalityPareja')}</option>
            <option value="group">${t('dua.modalityGrupo')}</option>
            <option value="autonomous_online">${t('dua.modalityAutonomoOnline')}</option>
        </select>

        <label class="field-label" for="dua-purpose">${t('dua.purposeLabel')}</label>
        <select id="dua-purpose" class="control-select">
            <option value="diagnostic">${t('dua.purposeDiagnostica')}</option>
            <option value="formative">${t('dua.purposeFormativa')}</option>
            <option value="summative">${t('dua.purposeSumativa')}</option>
            <option value="autonomous_practice">${t('dua.purposePracticaAutonoma')}</option>
        </select>

        <label class="field-label" for="dua-variation-type">${t('dua.variationLabel')}</label>
        <select id="dua-variation-type" class="control-select">
            <option value="none">${t('dua.variationNone')}</option>
            <option value="representation">${t('dua.variationRepresentacion')}</option>
            <option value="action_expression">${t('dua.variationAccionExpresion')}</option>
            <option value="engagement">${t('dua.variationImplicacion')}</option>
            <option value="balanced">${t('dua.variationEquilibradas')}</option>
        </select>

        <label class="field-label" for="dua-variant-count">${t('dua.variantCountLabel')}</label>
        <select id="dua-variant-count" class="control-select">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3" selected>3</option>
        </select>
    `;
    secDua.body.appendChild(duaWrap);
    if (labelTypePolicy && elements.teacherTypePolicy) {
        const duaPolicyCard = document.createElement('div');
        duaPolicyCard.className = 'compact-card';
        duaPolicyCard.appendChild(labelTypePolicy);
        duaPolicyCard.appendChild(elements.teacherTypePolicy);
        if (teacherLockedHelp) {
            duaPolicyCard.appendChild(teacherLockedHelp);
        }
        secDua.body.appendChild(duaPolicyCard);
    }

    if (elements.btnNewProject) projectActionsTop.appendChild(elements.btnNewProject);
    if (elements.btnRecoverDraft) projectActionsTop.appendChild(elements.btnRecoverDraft);
    if (elements.btnImportProject) projectActionsTop.appendChild(elements.btnImportProject);
    if (elements.btnImportResults) projectActionsTop.appendChild(elements.btnImportResults);
    if (elements.btnClearResults) projectActionsTop.appendChild(elements.btnClearResults);
    if (projectActionsTop.childElementCount > 0) secProject.body.appendChild(projectActionsTop);
    if (elements.btnExportProject) projectActionsBottom.appendChild(elements.btnExportProject);
    if (projectActionsBottom.childElementCount > 0) secProject.body.appendChild(projectActionsBottom);

    secStudentExport.body.appendChild(exportPolicyWrap);
    if (elements.btnExportVisor || elements.btnExportScorm) {
        const studentActions = document.createElement('div');
        studentActions.className = 'panel-actions';
        if (elements.btnExportVisor) {
            studentActions.appendChild(elements.btnExportVisor);
        }
        if (elements.btnExportScorm) {
            studentActions.appendChild(elements.btnExportScorm);
        }
        secStudentExport.body.appendChild(studentActions);
    }

    if (elements.btnLoadExample) actionBar.appendChild(elements.btnLoadExample);
    if (elements.btnValidate) actionBar.appendChild(elements.btnValidate);
    if (elements.btnGenerate) actionBar.appendChild(elements.btnGenerate);

    // Remove orphan wrappers after moving action buttons.
    Array.from(panel.querySelectorAll('.panel-actions')).forEach((row) => {
        if (row.childElementCount === 0) {
            row.remove();
        }
    });

    panel.innerHTML = '';
    panel.appendChild(leftHeader);
    panel.appendChild(sectionNav);
    if (elements.summaryFile) panel.appendChild(elements.summaryFile);
    if (elements.projectFile) panel.appendChild(elements.projectFile);
    if (elements.studentResultsFile) panel.appendChild(elements.studentResultsFile);
    panel.appendChild(secRequest.section);
    panel.appendChild(secDua.section);
    panel.appendChild(secAi.section);
    panel.appendChild(secProject.section);
    panel.appendChild(secStudentExport.section);
    if (status) panel.appendChild(status);
    if (hint) panel.appendChild(hint);
    panel.appendChild(actionBar);
    if (!panel.querySelector('#generation-lock-overlay')) {
        const generationOverlay = document.createElement('div');
        generationOverlay.id = 'generation-lock-overlay';
        generationOverlay.className = 'generation-lock-overlay';
        generationOverlay.hidden = true;
        generationOverlay.innerHTML = `
            <div class="generation-lock-inner" role="status" aria-live="polite">
                <div class="generation-lock-gear" aria-hidden="true">&#9881;</div>
                <p id="generation-lock-message" class="generation-lock-message">${t('status.generating')}</p>
            </div>
        `;
        panel.appendChild(generationOverlay);
    }
    panel.dataset.structured = '1';
    enforceLeftPanelScroll(panel);

    const navLinks = Array.from(sectionNav.querySelectorAll('.left-nav-link'));
    const sections = Array.from(panel.querySelectorAll('.control-group-panel'));
    const activateSection = (id) => {
        sections.forEach((section) => {
            const isActive = section.id === id;
            section.classList.toggle('active', isActive);
            section.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('data-target') === id;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    };
    navLinks.forEach((link) => {
        const targetId = String(link.getAttribute('data-target') || '').trim();
        link.setAttribute('role', 'tab');
        link.setAttribute('aria-selected', 'false');
        link.addEventListener('click', (event) => {
            event.preventDefault();
            activateSection(targetId);
        });
    });
    sectionNav.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const button = target.closest('.left-nav-link');
        if (!button) {
            return;
        }
        const targetId = String(button.getAttribute('data-target') || '').trim();
        if (!targetId) {
            return;
        }
        event.preventDefault();
        activateSection(targetId);
    });
    activateSection('sec-request');

    const variationType = panel.querySelector('#dua-variation-type');
    const variantCount = panel.querySelector('#dua-variant-count');
    if (variationType && variantCount) {
        const syncVariantCountState = (persist = true) => {
            variantCount.disabled = variationType.value === 'none';
            if (persist) {
                persistDuaConfigFromDom();
            }
        };
        variationType.addEventListener('change', syncVariantCountState);
        variantCount.addEventListener('change', () => {
            persistDuaConfigFromDom();
        });
        panel.querySelectorAll('.dua-barrier-input, #dua-profile-level, #dua-modality, #dua-purpose').forEach((input) => {
            input.addEventListener('change', () => {
                persistDuaConfigFromDom();
            });
        });
        setDuaConfigToDom(loadDuaConfigFromStorage());
        syncVariantCountState(false);
    }
}

function enforceLeftPanelScroll(panel) {
    if (!(panel instanceof HTMLElement)) {
        return;
    }
    const mobile = window.matchMedia('(max-width: 980px)').matches;
    panel.style.overflowY = 'scroll';
    panel.style.overflowX = 'hidden';
    panel.style.minHeight = '0';
    panel.style.height = mobile ? '72vh' : 'calc(100vh - 96px)';
    panel.style.maxHeight = mobile ? '72vh' : 'calc(100vh - 96px)';
}

function ensureDuaInsightsBlock() {
    const tabInsights = document.getElementById('tab-insights');
    if (!tabInsights) {
        return null;
    }

    let block = document.getElementById('insight-dua-block');
    if (block) {
        return block;
    }

    block = document.createElement('article');
    block.id = 'insight-dua-block';
    block.className = 'insight-block insight-block-dua';
    block.innerHTML = `
        <h3><i class="ph ph-rows-plus-bottom"></i> <span>${t('dua.insightTitle')}</span></h3>
        <p id="insight-dua-inputs"></p>
        <p id="insight-dua-variation"></p>
        <p id="insight-dua-justification"></p>
        <p id="insight-dua-impact"></p>
    `;

    const grid = tabInsights.querySelector('.insight-grid');
    if (grid) {
        grid.appendChild(block);
    } else {
        tabInsights.appendChild(block);
    }
    return block;
}

function ensureStudentResultsInsightsBlock() {
    const tabInsights = document.getElementById('tab-insights');
    if (!tabInsights) {
        return null;
    }

    let block = document.getElementById('insight-results-block');
    if (block) {
        return block;
    }

    block = document.createElement('article');
    block.id = 'insight-results-block';
    block.className = 'insight-block insight-block-results';
    block.innerHTML = `
        <h3><i class="ph ph-chart-line-up"></i> <span>${t('insights.results_title')}</span></h3>
        <p id="insight-results-summary">${t('insights.results_default')}</p>
        <p id="insight-results-udl"></p>
        <p id="insight-results-core"></p>
        <p id="insight-results-reco"></p>
    `;

    const grid = tabInsights.querySelector('.insight-grid');
    if (grid) {
        grid.appendChild(block);
    } else {
        tabInsights.appendChild(block);
    }
    return block;
}

function analyzeStudentResultsPayload(payload, bundle) {
    const root = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
    const rows = Array.isArray(root.exercise_results) ? root.exercise_results : [];
    const currentExercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];
    const exerciseMap = new Map(currentExercises.map((exercise) => [String(exercise?.id || '').trim(), exercise]));

    const total = rows.length;
    const attempted = rows.filter((row) => Number(row?.attempts || 0) > 0).length;
    const correct = rows.filter((row) => Boolean(row?.correct)).length;
    const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;
    const unmatched = rows.filter((row) => !exerciseMap.has(String(row?.exercise_id || '').trim())).length;

    const byLabel = {};
    const byCore = {};
    rows.forEach((row) => {
        const id = String(row?.exercise_id || '').trim();
        const linked = exerciseMap.get(id);
        const label = String(row?.dua_label || linked?.dua?.label || 'unknown').trim() || 'unknown';
        const coreId = String(row?.core_id || linked?.dua?.core_id || 'unknown').trim() || 'unknown';
        const attempts = Number(row?.attempts || 0);
        const isCorrect = Boolean(row?.correct);
        if (!byLabel[label]) {
            byLabel[label] = { total: 0, correct: 0 };
        }
        byLabel[label].total += 1;
        if (isCorrect) {
            byLabel[label].correct += 1;
        }

        if (!byCore[coreId]) {
            byCore[coreId] = {};
        }
        if (!byCore[coreId][label]) {
            byCore[coreId][label] = { total: 0, correct: 0, attempts: 0 };
        }
        byCore[coreId][label].total += 1;
        byCore[coreId][label].attempts += attempts;
        if (isCorrect) {
            byCore[coreId][label].correct += 1;
        }
    });

    let weakest = null;
    Object.entries(byCore).forEach(([coreId, byLabelStats]) => {
        Object.entries(byLabelStats).forEach(([label, stats]) => {
            const totalLocal = Number(stats?.total || 0);
            if (totalLocal <= 0) {
                return;
            }
            const accuracyLocal = Number(((Number(stats?.correct || 0) / totalLocal) * 100).toFixed(2));
            const avgAttempts = Number((Number(stats?.attempts || 0) / totalLocal).toFixed(2));
            const candidate = { coreId, label, accuracy: accuracyLocal, avgAttempts };
            if (!weakest) {
                weakest = candidate;
                return;
            }
            if (candidate.accuracy < weakest.accuracy || (candidate.accuracy === weakest.accuracy && candidate.avgAttempts > weakest.avgAttempts)) {
                weakest = candidate;
            }
        });
    });

    return {
        sourceApp: String(root?.app || '').trim() || 'unknown',
        sessionId: String(root?.session?.id || '').trim() || '',
        total,
        attempted,
        correct,
        accuracy,
        unmatched,
        byLabel
        ,
        byCore,
        weakest
    };
}

function mergeStatsCounter(target, key, deltaTotal, deltaCorrect, deltaAttempts = 0) {
    const safeKey = String(key || 'unknown').trim() || 'unknown';
    if (!target[safeKey]) {
        target[safeKey] = { total: 0, correct: 0, attempts: 0 };
    }
    target[safeKey].total += Number(deltaTotal || 0);
    target[safeKey].correct += Number(deltaCorrect || 0);
    target[safeKey].attempts += Number(deltaAttempts || 0);
}

function aggregateStudentResultsReports(reports) {
    const source = Array.isArray(reports) ? reports : [];
    const byLabel = {};
    const byCore = {};
    let total = 0;
    let attempted = 0;
    let correct = 0;
    let unmatched = 0;

    source.forEach((report) => {
        const summary = report?.summary && typeof report.summary === 'object' ? report.summary : null;
        if (!summary) {
            return;
        }
        total += Number(summary.total || 0);
        attempted += Number(summary.attempted || 0);
        correct += Number(summary.correct || 0);
        unmatched += Number(summary.unmatched || 0);

        Object.entries(summary.byLabel || {}).forEach(([label, stats]) => {
            mergeStatsCounter(byLabel, label, stats?.total, stats?.correct, 0);
        });
        Object.entries(summary.byCore || {}).forEach(([coreId, labels]) => {
            const coreKey = String(coreId || 'unknown').trim() || 'unknown';
            if (!byCore[coreKey]) {
                byCore[coreKey] = {};
            }
            Object.entries(labels || {}).forEach(([label, stats]) => {
                mergeStatsCounter(byCore[coreKey], label, stats?.total, stats?.correct, stats?.attempts);
            });
        });
    });

    let weakest = null;
    Object.entries(byCore).forEach(([coreId, labelStats]) => {
        Object.entries(labelStats || {}).forEach(([label, stats]) => {
            const totalLocal = Number(stats?.total || 0);
            if (totalLocal <= 0) {
                return;
            }
            const accuracyLocal = Number(((Number(stats?.correct || 0) / totalLocal) * 100).toFixed(2));
            const avgAttempts = Number((Number(stats?.attempts || 0) / totalLocal).toFixed(2));
            const candidate = { coreId, label, accuracy: accuracyLocal, avgAttempts };
            if (!weakest) {
                weakest = candidate;
                return;
            }
            if (candidate.accuracy < weakest.accuracy || (candidate.accuracy === weakest.accuracy && candidate.avgAttempts > weakest.avgAttempts)) {
                weakest = candidate;
            }
        });
    });

    const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;
    return {
        sourceApp: source.length === 1 ? String(source[0]?.summary?.sourceApp || 'unknown') : 'cohort',
        sessionId: source.length === 1 ? String(source[0]?.summary?.sessionId || '') : '',
        reports: source.length,
        total,
        attempted,
        correct,
        accuracy,
        unmatched,
        byLabel,
        byCore,
        weakest
    };
}

function getDuaLabeledValue(group, value) {
    const key = String(value || '').trim();
    if (!key) {
        return '-';
    }
    const map = {
        profile: {
            inicial: 'dua.profileInicial',
            intermedio: 'dua.profileIntermedio',
            avanzado: 'dua.profileAvanzado',
            heterogeneo: 'dua.profileHeterogeneo',
            initial: 'dua.profileInicial',
            intermediate: 'dua.profileIntermedio',
            advanced: 'dua.profileAvanzado',
            heterogeneous: 'dua.profileHeterogeneo'
        },
        modality: {
            individual: 'dua.modalityIndividual',
            pareja: 'dua.modalityPareja',
            grupo: 'dua.modalityGrupo',
            autonomo_online: 'dua.modalityAutonomoOnline',
            pair: 'dua.modalityPareja',
            group: 'dua.modalityGrupo',
            autonomous_online: 'dua.modalityAutonomoOnline'
        },
        purpose: {
            diagnostica: 'dua.purposeDiagnostica',
            formativa: 'dua.purposeFormativa',
            sumativa: 'dua.purposeSumativa',
            practica_autonoma: 'dua.purposePracticaAutonoma',
            diagnostic: 'dua.purposeDiagnostica',
            formative: 'dua.purposeFormativa',
            summative: 'dua.purposeSumativa',
            autonomous_practice: 'dua.purposePracticaAutonoma'
        },
        variation: {
            none: 'dua.variationNone',
            representacion: 'dua.variationRepresentacion',
            accion_expresion: 'dua.variationAccionExpresion',
            implicacion: 'dua.variationImplicacion',
            equilibradas: 'dua.variationEquilibradas',
            representation: 'dua.variationRepresentacion',
            action_expression: 'dua.variationAccionExpresion',
            engagement: 'dua.variationImplicacion',
            balanced: 'dua.variationEquilibradas'
        },
        barrier: {
            dificultad_lectora: 'dua.barrierDificultadLectora',
            sobrecarga_sintactica: 'dua.barrierSobrecargaSintactica',
            atencion_limitada: 'dua.barrierAtencionLimitada',
            ansiedad_evaluativa: 'dua.barrierAnsiedadEvaluativa',
            ninguna_relevante: 'dua.barrierNingunaRelevante',
            reading_difficulty: 'dua.barrierDificultadLectora',
            syntactic_overload: 'dua.barrierSobrecargaSintactica',
            limited_sustained_attention: 'dua.barrierAtencionLimitada',
            assessment_anxiety: 'dua.barrierAnsiedadEvaluativa',
            none_relevant: 'dua.barrierNingunaRelevante'
        }
    };
    const i18nKey = map[group]?.[key];
    return i18nKey ? t(i18nKey) : key;
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
    ensureDuaInsightsBlock();
    const duaInputs = document.getElementById('insight-dua-inputs');
    const duaVariation = document.getElementById('insight-dua-variation');
    const duaJustification = document.getElementById('insight-dua-justification');
    const duaImpact = document.getElementById('insight-dua-impact');
    ensureStudentResultsInsightsBlock();
    const resultsSummary = document.getElementById('insight-results-summary');
    const resultsUdl = document.getElementById('insight-results-udl');
    const resultsCore = document.getElementById('insight-results-core');
    const resultsReco = document.getElementById('insight-results-reco');
    const studentResults = appState.studentResultsSummary;

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
            rationale.textContent = t('insights.rationale_default');
        }
        if (bias) {
            bias.textContent = t('insights.bias_default');
        }
        if (pedagogy) {
            pedagogy.textContent = t('insights.pedagogy_default');
        }
        if (compliance) {
            compliance.textContent = t('insights.compliance_default');
        }
        if (duaInputs) {
            duaInputs.textContent = t('dua.insightNoData');
        }
        if (duaVariation) {
            duaVariation.textContent = '';
        }
        if (duaJustification) {
            duaJustification.textContent = '';
        }
        if (duaImpact) {
            duaImpact.textContent = '';
        }
        if (resultsSummary) {
            resultsSummary.textContent = studentResults
                ? t('insights.results_summary', {
                    reports: studentResults.reports || 1,
                    total: studentResults.total,
                    attempted: studentResults.attempted,
                    correct: studentResults.correct,
                    accuracy: studentResults.accuracy
                })
                : t('insights.results_default');
        }
        if (resultsUdl) {
            const parts = studentResults
                ? Object.entries(studentResults.byLabel || {}).map(([label, stats]) => `${label}: ${stats.correct}/${stats.total}`)
                : [];
            resultsUdl.textContent = parts.length > 0 ? t('insights.results_udl', { breakdown: parts.join(' | ') }) : '';
        }
        if (resultsCore) {
            const coreParts = studentResults
                ? Object.entries(studentResults.byCore || {}).map(([coreId, labels]) => {
                    const labelParts = Object.entries(labels || {}).map(([label, stats]) => {
                        const totalLocal = Number(stats?.total || 0);
                        const accuracyLocal = totalLocal > 0 ? Number(((Number(stats?.correct || 0) / totalLocal) * 100).toFixed(2)) : 0;
                        return `${label} ${accuracyLocal}%`;
                    }).join(', ');
                    return `${coreId}: ${labelParts}`;
                })
                : [];
            resultsCore.textContent = coreParts.length > 0 ? t('insights.results_core', { breakdown: coreParts.join(' | ') }) : '';
        }
        if (resultsReco) {
            if (studentResults?.weakest) {
                resultsReco.textContent = t('insights.results_reco_focus', {
                    core: studentResults.weakest.coreId,
                    label: studentResults.weakest.label,
                    accuracy: studentResults.weakest.accuracy,
                    attempts: studentResults.weakest.avgAttempts
                });
            } else {
                resultsReco.textContent = t('insights.results_reco_default');
            }
        }
        return;
    }

    if (rationale) {
        if (validation.valid) {
            rationale.textContent = t('insights.rationale_valid', { count: exerciseCount });
        } else {
            rationale.textContent = t('insights.rationale_invalid', { count: errors });
        }
    }

    if (bias) {
        if (warnings > 0) {
            bias.textContent = t('insights.bias_warnings', { count: warnings });
        } else {
            bias.textContent = t('insights.bias_nowarnings');
        }
    }

    if (pedagogy) {
        const types = new Set((Array.isArray(data?.exercises) ? data.exercises : []).map((exercise) => exercise?.type).filter(Boolean));
        pedagogy.textContent = t('insights.pedagogy_types', { count: types.size || 0 });
    }

    if (compliance) {
        if (validation.valid && warnings === 0) {
            compliance.textContent = t('insights.compliance_high');
        } else if (validation.valid) {
            compliance.textContent = t('insights.compliance_ok');
        } else {
            compliance.textContent = t('insights.compliance_low');
        }
    }

    const duaEnabled = Boolean(data?.generation_context?.dua_enabled);
    const duaProfile = data?.generation_context?.dua_profile && typeof data.generation_context.dua_profile === 'object'
        ? data.generation_context.dua_profile
        : null;
    const exerciseWithDua = (Array.isArray(data?.exercises) ? data.exercises : []).find((exercise) => exercise?.dua?.label);
    if (duaInputs) {
        if (!duaEnabled) {
            duaInputs.textContent = t('dua.insightDisabled');
        } else {
            const barriers = Array.isArray(duaProfile?.barriers)
                ? duaProfile.barriers.map((item) => getDuaLabeledValue('barrier', item)).join(', ')
                : '';
            duaInputs.textContent = t('dua.insightInputs', {
                profile: getDuaLabeledValue('profile', duaProfile?.profile_level),
                barriers: barriers || t('dua.none'),
                modality: getDuaLabeledValue('modality', duaProfile?.modality),
                purpose: getDuaLabeledValue('purpose', duaProfile?.purpose)
            });
        }
    }
    if (duaVariation) {
        duaVariation.textContent = duaEnabled
            ? t('dua.insightVariation', {
                variation: getDuaLabeledValue('variation', duaProfile?.variation_type),
                count: duaProfile?.variant_count || 1
            })
            : '';
    }
    if (duaJustification) {
        duaJustification.textContent = duaEnabled
            ? t('dua.insightJustification', {
                text: String(exerciseWithDua?.dua?.xai_summary || t('dua.notReportedByModel'))
            })
            : '';
    }
    if (duaImpact) {
        duaImpact.textContent = duaEnabled
            ? t('dua.insightImpact')
            : '';
    }
    if (resultsSummary) {
        resultsSummary.textContent = studentResults
            ? t('insights.results_summary', {
                reports: studentResults.reports || 1,
                total: studentResults.total,
                attempted: studentResults.attempted,
                correct: studentResults.correct,
                accuracy: studentResults.accuracy
            })
            : t('insights.results_default');
    }
    if (resultsUdl) {
        const parts = studentResults
            ? Object.entries(studentResults.byLabel || {}).map(([label, stats]) => `${label}: ${stats.correct}/${stats.total}`)
            : [];
        resultsUdl.textContent = parts.length > 0 ? t('insights.results_udl', { breakdown: parts.join(' | ') }) : '';
    }
    if (resultsCore) {
        const coreParts = studentResults
            ? Object.entries(studentResults.byCore || {}).map(([coreId, labels]) => {
                const labelParts = Object.entries(labels || {}).map(([label, stats]) => {
                    const totalLocal = Number(stats?.total || 0);
                    const accuracyLocal = totalLocal > 0 ? Number(((Number(stats?.correct || 0) / totalLocal) * 100).toFixed(2)) : 0;
                    return `${label} ${accuracyLocal}%`;
                }).join(', ');
                return `${coreId}: ${labelParts}`;
            })
            : [];
        resultsCore.textContent = coreParts.length > 0 ? t('insights.results_core', { breakdown: coreParts.join(' | ') }) : '';
    }
    if (resultsReco) {
        if (studentResults?.weakest) {
            resultsReco.textContent = t('insights.results_reco_focus', {
                core: studentResults.weakest.coreId,
                label: studentResults.weakest.label,
                accuracy: studentResults.weakest.accuracy,
                attempts: studentResults.weakest.avgAttempts
            });
        } else {
            resultsReco.textContent = t('insights.results_reco_default');
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

function buildCurrentGenerationPrompt(elements) {
    const request = prepareGenerationRequest(elements);
    const {
        content,
        duaConfig,
        teacherConfig,
        selectedExerciseType,
        exerciseCount,
        expectedTypePlan
    } = request;
    const promptLocale = 'en';
    const typePlan = expectedTypePlan || (teacherConfig.type_policy === 'locked' ? { [selectedExerciseType]: exerciseCount } : null);
    return buildXaiPrompt({
        locale: promptLocale,
        exerciseLanguage: teacherConfig.exercise_language || 'en',
        content,
        exerciseCount,
        typePlan,
        strictTypeCounts: Boolean(typePlan),
        duaConfig,
        teacherConfig,
        memoryEntries: getPromptMemoryEntries(appState.data, teacherConfig, content, 8),
        selectedExerciseType
    });
}

function handleGeneratePrompt(elements) {
    const request = prepareGenerationRequest(elements);
    if (!request.content) {
        setStatus(elements, t('status.needContent'), 'error');
        elements.contentInput.focus();
        return;
    }
    if (!request.selectedExerciseType || !EXERCISE_TYPES.includes(request.selectedExerciseType)) {
        setStatus(elements, t('status.needExerciseType'), 'error');
        elements.singleExerciseType?.focus();
        return;
    }
    if (!request.teacherConfig.learning_objective) {
        setStatus(elements, t('status.needLearningObjective'), 'error');
        elements.teacherLearningObjective?.focus();
        return;
    }
    const objectiveTypos = detectLearningObjectiveTypos(request.teacherConfig.learning_objective);
    if (objectiveTypos.length > 0) {
        const first = objectiveTypos[0];
        setStatus(elements, t('status.learningObjectiveTypos', { token: first.token, suggestion: first.suggestion }), 'warning');
        elements.teacherLearningObjective?.focus();
        return;
    }
    const prompt = buildCurrentGenerationPrompt(elements);
    if (elements.manualAiPrompt) {
        elements.manualAiPrompt.value = prompt;
    }
    savePromptTraceToSession(prompt);
    setStatus(elements, t('status.promptReadyManual'), 'success');
}

function handleImportManualJson(elements) {
    try {
        const raw = String(elements.manualAiResponse?.value || '').trim();
        const parsed = parseManualJson(raw);
        const request = prepareGenerationRequest(elements);
        const {
            content,
            duaConfig,
            teacherConfig,
            selectedExerciseType,
            exerciseCount,
            expectedTypePlan
        } = request;
        const outputLanguage = teacherConfig.exercise_language || 'en';
        let mergedBundle = enforceRequestedExerciseCount(mergeGeneratedBundles([parsed]), exerciseCount);
        if (mergedBundle && typeof mergedBundle === 'object') {
            enforceCanonicalDuaProfile(mergedBundle, duaConfig);
            applyDuaVariantFallback(mergedBundle, duaConfig);
            ensureRequiredRootFields(mergedBundle, { locale: outputLanguage, content, exerciseCount });
            enforceTeacherInvariants(mergedBundle, teacherConfig, selectedExerciseType);
            harmonizeEquivalentTypes(mergedBundle, teacherConfig, selectedExerciseType);
            enforceCoreStatementInvariantByCore(mergedBundle, teacherConfig);
            applyLocalXaiAutoRepair(mergedBundle, {
                teacherConfig,
                modelName: String(elements.modelSelect?.value || ''),
                locale: outputLanguage
            });
        }

        const generatedCount = Array.isArray(mergedBundle?.exercises) ? mergedBundle.exercises.length : 0;
        if (generatedCount !== exerciseCount) {
            setStatus(elements, t('status.incompleteGeneration', { current: generatedCount, expected: exerciseCount }), 'error');
            return;
        }
        if (expectedTypePlan) {
            const generatedTypeCount = countTypesFromExercises(mergedBundle?.exercises);
            if (!sameTypeDistribution(expectedTypePlan, generatedTypeCount)) {
                setStatus(elements, t('status.typePlanMismatch'), 'warning');
                return;
            }
        }
        const equivalentPolicyCheck = validateEquivalentTypePolicy(mergedBundle, teacherConfig, selectedExerciseType);
        if (!equivalentPolicyCheck.valid) {
            setStatus(elements, equivalentPolicyCheck.errors[0], 'warning');
            return;
        }

        const appendedBundle = appendGeneratedBundle(appState.data, mergedBundle);
        const validation = applyBundle(elements, appendedBundle);
        if (validation.valid) {
            setStatus(elements, t('status.manualImportedOk', { added: exerciseCount, total: validation.summary.exerciseCount }), 'success');
        } else {
            setStatus(elements, t('status.generatedInvalid'), 'error');
        }
    } catch (error) {
        if (String(error?.message || '') === 'empty_manual_json') {
            setStatus(elements, t('status.needManualJson'), 'error');
            return;
        }
        setStatus(elements, t('status.manualJsonParseError'), 'error');
    }
}

async function handleGenerate(elements) {
    const providerMode = normalizeProviderMode(elements.providerMode?.value);
    if (providerMode === 'manual') {
        handleGeneratePrompt(elements);
        return;
    }

    const request = prepareGenerationRequest(elements);
    const {
        apiKey,
        model,
        content,
        duaConfig,
        teacherConfig,
        selectedExerciseType,
        duaVariantCount,
        exerciseCount,
        expectedTypePlan,
        useStrictTypePlan,
        resultingCount
    } = request;

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

    if (!selectedExerciseType || !EXERCISE_TYPES.includes(selectedExerciseType)) {
        setStatus(elements, t('status.needExerciseType'), 'error');
        elements.singleExerciseType?.focus();
        return;
    }

    if (!teacherConfig.learning_objective) {
        setStatus(elements, t('status.needLearningObjective'), 'error');
        elements.teacherLearningObjective?.focus();
        return;
    }
    const objectiveTypos = detectLearningObjectiveTypos(teacherConfig.learning_objective);
    if (objectiveTypos.length > 0) {
        const first = objectiveTypos[0];
        setStatus(elements, t('status.learningObjectiveTypos', { token: first.token, suggestion: first.suggestion }), 'warning');
        elements.teacherLearningObjective?.focus();
        return;
    }

    if (resultingCount > MAX_EXERCISES) {
        setStatus(elements, t('status.duaTotalExceeded', { max: MAX_EXERCISES }), 'error');
        return;
    }

    const promptLocale = 'en';
    const outputLanguage = teacherConfig.exercise_language || 'en';
    const isPreviewModel = /preview/i.test(model);
    const batchSpecs = buildGenerationBatchSpecs({ useTypePlan: true, typePlan: expectedTypePlan, exerciseCount, chunkSize: exerciseCount });

    localStorage.setItem('exe_builder_xai_api_key', apiKey);
    localStorage.setItem('exe_builder_xai_model', model);
    localStorage.setItem('exe_builder_xai_count', '1');
    localStorage.setItem(SINGLE_EXERCISE_TYPE_STORAGE_KEY, selectedExerciseType);
    localStorage.setItem(DUA_CONFIG_STORAGE_KEY, JSON.stringify(duaConfig));
    localStorage.setItem(TEACHER_CONFIG_STORAGE_KEY, JSON.stringify(teacherConfig));

    const originalText = t('actions.generate');
    elements.btnGenerate.disabled = true;
    elements.btnGenerate.textContent = t('actions.generating');
    setStatus(elements, t('status.generating'), 'info');
    setGenerationLock(true, t('status.generating'));

    try {
        const maxAttempts = 2;
        let mergedBundle = null;
        let typePlanSatisfied = false;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            const parsedBundles = [];
            const promptTraceEntries = [];

            for (let index = 0; index < batchSpecs.length; index += 1) {
                const spec = batchSpecs[index];
                const batchPrompt = buildXaiPrompt({
                    locale: promptLocale,
                    exerciseLanguage: outputLanguage,
                    content,
                    exerciseCount: spec.count,
                    typePlan: spec.typePlan,
                    strictTypeCounts: spec.strictTypeCounts,
                    duaConfig,
                    teacherConfig,
                    memoryEntries: getPromptMemoryEntries(appState.data, teacherConfig, content, 8),
                    selectedExerciseType
                });
                promptTraceEntries.push(
                    formatPromptTraceEntry(batchPrompt, index + 1, batchSpecs.length, spec.count, spec.typePlan)
                );
                savePromptTraceToSession(promptTraceEntries.join('\n\n'));
                if (batchSpecs.length > 1) {
                    setStatus(elements, `${t('status.generating')} (${index + 1}/${batchSpecs.length})`, 'info');
                }

                const result = await generateWithModelRetries({
                    apiKey,
                    model,
                    prompt: batchPrompt,
                    isPreviewModel,
                    maxAttempts: 3
                });
                parsedBundles.push(result.parsed);
            }

            mergedBundle = enforceRequestedExerciseCount(mergeGeneratedBundles(parsedBundles), exerciseCount);
            if (mergedBundle && typeof mergedBundle === 'object') {
                enforceCanonicalDuaProfile(mergedBundle, duaConfig);
                applyDuaVariantFallback(mergedBundle, duaConfig);
                ensureRequiredRootFields(mergedBundle, { locale: outputLanguage, content, exerciseCount });
                enforceTeacherInvariants(mergedBundle, teacherConfig, selectedExerciseType);
                harmonizeEquivalentTypes(mergedBundle, teacherConfig, selectedExerciseType);
                enforceCoreStatementInvariantByCore(mergedBundle, teacherConfig);
                applyLocalXaiAutoRepair(mergedBundle, {
                    teacherConfig,
                    modelName: model,
                    locale: outputLanguage
                });
            }

            const generatedCount = Array.isArray(mergedBundle?.exercises) ? mergedBundle.exercises.length : 0;
            const countOk = generatedCount === exerciseCount;
            const generatedTypeCount = countTypesFromExercises(mergedBundle?.exercises);
            const typePlanOk = !useStrictTypePlan || sameTypeDistribution(expectedTypePlan, generatedTypeCount);
            const equivalentPolicyCheck = validateEquivalentTypePolicy(mergedBundle, teacherConfig, selectedExerciseType);
            const equivalentOk = equivalentPolicyCheck.valid;
            if (typePlanOk && countOk && equivalentOk) {
                typePlanSatisfied = true;
                break;
            }
            if (attempt < maxAttempts) {
                const base = !countOk
                    ? t('status.incompleteGeneration', { current: generatedCount, expected: exerciseCount })
                    : (!equivalentOk ? equivalentPolicyCheck.errors[0] : t('status.retryingTypePlan'));
                setStatus(elements, base, 'warning');
                mergedBundle = null;
            }
        }

        if ((!mergedBundle || !typePlanSatisfied) && duaConfig.enabled && duaVariantCount > 1) {
            const sequentialBundles = [];
            for (let variantIndex = 0; variantIndex < duaVariantCount; variantIndex += 1) {
                const variantPrompt = buildXaiPrompt({
                    locale: promptLocale,
                    exerciseLanguage: outputLanguage,
                    content: `${content}\n\nUDL focus for this variant: ${buildVariantFocus(variantIndex)}\nKeep the same conceptual core as the other variants.`,
                    exerciseCount: 1,
                    typePlan: { [selectedExerciseType]: 1 },
                    strictTypeCounts: true,
                    duaConfig: { ...duaConfig, enabled: false, variation_type: 'none', variant_count: 1 },
                    teacherConfig,
                    memoryEntries: getPromptMemoryEntries(appState.data, teacherConfig, content, 8),
                    selectedExerciseType
                });
                const existingTrace = readPromptTraceFromSession();
                savePromptTraceToSession(`${existingTrace}\n\n=== Fallback UDL variant ${variantIndex + 1}/${duaVariantCount} ===\n${variantPrompt}`);
                setStatus(elements, `${t('status.generating')} (${variantIndex + 1}/${duaVariantCount})`, 'info');
                const result = await generateWithModelRetries({
                    apiKey,
                    model,
                    prompt: variantPrompt,
                    isPreviewModel,
                    maxAttempts: 3
                });
                sequentialBundles.push(result.parsed);
            }

            mergedBundle = enforceRequestedExerciseCount(mergeGeneratedBundles(sequentialBundles), duaVariantCount);
            if (mergedBundle && typeof mergedBundle === 'object') {
                enforceCanonicalDuaProfile(mergedBundle, duaConfig);
                enforceDuaVariantMetadata(mergedBundle, duaConfig, selectedExerciseType, teacherConfig.learning_objective);
                ensureRequiredRootFields(mergedBundle, { locale: outputLanguage, content, exerciseCount });
                enforceTeacherInvariants(mergedBundle, teacherConfig, selectedExerciseType);
                harmonizeEquivalentTypes(mergedBundle, teacherConfig, selectedExerciseType);
                enforceCoreStatementInvariantByCore(mergedBundle, teacherConfig);
                applyLocalXaiAutoRepair(mergedBundle, {
                    teacherConfig,
                    modelName: model,
                    locale: outputLanguage
                });
            }
            const generatedTypeCount = countTypesFromExercises(mergedBundle?.exercises);
            const generatedCount = Array.isArray(mergedBundle?.exercises) ? mergedBundle.exercises.length : 0;
            const countOk = generatedCount === exerciseCount;
            const equivalentPolicyCheck = validateEquivalentTypePolicy(mergedBundle, teacherConfig, selectedExerciseType);
            typePlanSatisfied = countOk && (!useStrictTypePlan || sameTypeDistribution(expectedTypePlan, generatedTypeCount)) && equivalentPolicyCheck.valid;
            if (!equivalentPolicyCheck.valid) {
                setStatus(elements, equivalentPolicyCheck.errors[0], 'warning');
            }
        }

        if (!mergedBundle || !typePlanSatisfied) {
            const equivalentPolicyCheck = validateEquivalentTypePolicy(mergedBundle, teacherConfig, selectedExerciseType);
            if (!equivalentPolicyCheck.valid) {
                setStatus(elements, equivalentPolicyCheck.errors[0], 'warning');
                return;
            }
            setStatus(elements, t('status.typePlanMismatch'), 'warning');
            return;
        }

        let finalBundle = mergedBundle;
        let preValidation = validateXaiBundle(finalBundle, t);
        if (!preValidation.valid) {
            setStatus(elements, t('status.repairingWithAi'), 'warning');
            const repairPrompt = buildRepairPrompt({
                bundle: finalBundle,
                validation: preValidation,
                teacherConfig,
                selectedExerciseType,
                exerciseCount,
                exerciseLanguage: outputLanguage,
                duaConfig
            });
            const previousTrace = readPromptTraceFromSession();
            savePromptTraceToSession(`${previousTrace}\n\n=== Repair pass (auto) ===\n${repairPrompt}`);

            try {
                const repairResult = await generateWithModelRetries({
                    apiKey,
                    model,
                    prompt: repairPrompt,
                    isPreviewModel,
                    maxAttempts: 2
                });
                let repairedBundle = enforceRequestedExerciseCount(mergeGeneratedBundles([repairResult.parsed]), exerciseCount);
                if (repairedBundle && typeof repairedBundle === 'object') {
                    enforceCanonicalDuaProfile(repairedBundle, duaConfig);
                    applyDuaVariantFallback(repairedBundle, duaConfig);
                    ensureRequiredRootFields(repairedBundle, { locale: outputLanguage, content, exerciseCount });
                    enforceTeacherInvariants(repairedBundle, teacherConfig, selectedExerciseType);
                    harmonizeEquivalentTypes(repairedBundle, teacherConfig, selectedExerciseType);
                    enforceCoreStatementInvariantByCore(repairedBundle, teacherConfig);
                    applyLocalXaiAutoRepair(repairedBundle, {
                        teacherConfig,
                        modelName: model,
                        locale: outputLanguage
                    });
                }

                const repairedValidation = validateXaiBundle(repairedBundle, t);
                const previousCritical = Number(preValidation?.summary?.criticalCount || 9999);
                const repairedCritical = Number(repairedValidation?.summary?.criticalCount || 9999);
                if (repairedValidation.valid || repairedCritical < previousCritical) {
                    finalBundle = repairedBundle;
                    preValidation = repairedValidation;
                    setStatus(
                        elements,
                        repairedValidation.valid
                            ? t('status.repairSucceeded')
                            : t('status.repairPartiallyImproved', { from: previousCritical, to: repairedCritical }),
                        repairedValidation.valid ? 'success' : 'warning'
                    );
                } else {
                    setStatus(elements, t('status.repairNotImproved'), 'warning');
                }
            } catch {
                setStatus(elements, t('status.repairFailed'), 'warning');
            }
        }

        const appendedBundle = appendGeneratedBundle(appState.data, finalBundle);
        const validation = applyBundle(elements, appendedBundle);

        if (validation.valid) {
            setStatus(elements, t('status.generatedAppended', { added: exerciseCount, total: validation.summary.exerciseCount }), 'success');
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
        setGenerationLock(false);
        elements.btnGenerate.disabled = false;
        elements.btnGenerate.textContent = originalText;
    }
}

function getVariantGroupsForExport(bundle) {
    const exercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];
    const groups = new Map();
    exercises.forEach((exercise, index) => {
        const coreId = String(exercise?.dua?.core_id || `core_${index + 1}`).trim();
        if (!groups.has(coreId)) {
            groups.set(coreId, []);
        }
        groups.get(coreId).push(exercise);
    });
    return Array.from(groups.entries()).map(([coreId, variants]) => ({
        coreId,
        variants: variants
            .slice()
            .sort((left, right) => (Number(left?.dua?.variant_index) || 999) - (Number(right?.dua?.variant_index) || 999))
    }));
}

function renderManualCoreSelectionUi(bundle) {
    const container = document.getElementById('manual-core-map-config');
    if (!container) {
        return;
    }
    const previous = {};
    container.querySelectorAll('.manual-core-select').forEach((select) => {
        const coreId = String(select.getAttribute('data-core-id') || '').trim();
        if (coreId) {
            previous[coreId] = String(select.value || '').trim();
        }
    });

    const groups = getVariantGroupsForExport(bundle)
        .filter((group) => Array.isArray(group.variants) && group.variants.length > 1);

    if (groups.length === 0) {
        container.innerHTML = '<p class="hint">No multi-variant cores detected in current package.</p>';
        return;
    }

    const rows = groups.map((group, index) => {
        const options = group.variants.map((variant, index) => {
            const id = String(variant?.id || '').trim();
            const label = formatDuaLabelForUi(String(variant?.dua?.label || '').trim(), index + 1);
            const selected = previous[group.coreId] && previous[group.coreId] === id ? ' selected' : '';
            return `<option value="${id}"${selected}>${label}${id ? ` (${id})` : ''}</option>`;
        }).join('');
        const rowId = `manual-core-${index + 1}`;
        return `
            <div class="compact-card" style="margin-top:8px;">
                <label class="field-label" for="${rowId}">Core: ${group.coreId}</label>
                <select id="${rowId}" class="control-select manual-core-select" data-core-id="${group.coreId}">
                    ${options}
                </select>
            </div>
        `;
    }).join('');

    container.innerHTML = `<p class="hint">Select one variant per core:</p>${rows}`;
}

function buildManualSelectionForExport(variantGroups) {
    const multiGroups = variantGroups.filter((group) => Array.isArray(group.variants) && group.variants.length > 1);
    if (multiGroups.length === 0) {
        return null;
    }
    const mode = String(document.getElementById('manual-selection-mode')?.value || 'label_all').trim();
    if (mode === 'label_all') {
        return {
            mode: 'label_all',
            label: String(document.getElementById('manual-udl-label')?.value || 'DUA-Representacion').trim() || 'DUA-Representacion'
        };
    }

    const byCore = {};
    const selectedInputs = Array.from(document.querySelectorAll('.manual-core-select'));
    selectedInputs.forEach((select) => {
        const coreId = String(select.getAttribute('data-core-id') || '').trim();
        const exerciseId = String(select.value || '').trim();
        if (coreId && exerciseId) {
            byCore[coreId] = exerciseId;
        }
    });
    if (Object.keys(byCore).length === 0) {
        return null;
    }
    return {
        mode: 'core_map',
        byCore
    };
}

function initializeApp() {
    const elements = getDomElements();
    const initialLocale = setLocale('en');
    const initialWorkspaceMode = loadWorkspaceModeFromStorage();
    const promptTrace = readPromptTraceFromSession();
    const exerciseMemory = loadExerciseMemoryFromStorage();
    setState({ locale: initialLocale, promptTrace, exerciseMemory, workspaceMode: initialWorkspaceMode });
    if (elements.languageSelect) {
        elements.languageSelect.value = initialLocale;
    }
    if (elements.workspaceModeSelect) {
        elements.workspaceModeSelect.value = initialWorkspaceMode;
    }
    try {
        applyI18n();
    } catch (error) {
        console.error('applyI18n failed at bootstrap:', error);
    }
    try {
        setupLeftPanelSections(elements);
    } catch (error) {
        console.error('setupLeftPanelSections failed:', error);
    }
    setupMainTabs();
    const panelLeft = document.querySelector('.panel-left');
    enforceLeftPanelScroll(panelLeft);

    setupHorizontalResize(elements.layoutResizer, elements.layout, 320, 760, '--left-panel-width');
    setupHorizontalResize(elements.editorResizer, elements.editorWorkspace, 220, 520, '--exercise-nav-width');
    window.addEventListener('resize', () => {
        enforceLeftPanelScroll(document.querySelector('.panel-left'));
    });

    if (!document.querySelector('.left-section-nav')) {
        const panel = document.querySelector('.panel-left');
        if (panel) {
            panel.dataset.structured = '';
        }
        try {
            setupLeftPanelSections(elements);
        } catch (error) {
            console.error('left panel recovery failed:', error);
        }
        enforceLeftPanelScroll(document.querySelector('.panel-left'));
    }
    updateHelpLinksByLocale(elements, initialLocale);
    updateDerivedViews(elements, null, null, promptTrace);
    applyWorkspaceMode(elements, initialWorkspaceMode);
    setStatus(elements, t('ui.noItems'), 'info');

    const savedApiKey = localStorage.getItem('exe_builder_xai_api_key');
    const savedModel = localStorage.getItem('exe_builder_xai_model');
    if (savedApiKey) {
        elements.apiKeyInput.value = savedApiKey;
    }
    if (savedModel) {
        elements.modelSelect.value = savedModel;
    } else {
        elements.modelSelect.value = 'gemini-2.5-flash';
    }
    setProviderMode(elements, loadProviderModeFromStorage());

    if (elements.exerciseCount) {
        elements.exerciseCount.value = '1';
        elements.exerciseCount.disabled = true;
    }
    refreshRecoverDraftUi(elements);

    const savedSingleType = String(localStorage.getItem(SINGLE_EXERCISE_TYPE_STORAGE_KEY) || '').trim();
    if (elements.singleExerciseType) {
        elements.singleExerciseType.value = EXERCISE_TYPES.includes(savedSingleType) ? savedSingleType : '';
    }
    setTeacherConfigToDom(loadTeacherConfigFromStorage());
    const exportPolicySelect = document.getElementById('export-variant-policy');
    if (exportPolicySelect) {
        const savedPolicy = String(localStorage.getItem(EXPORT_VARIANT_POLICY_STORAGE_KEY) || '').trim();
        const allowedPolicies = new Set(['first_per_core', 'manual_select', 'random_per_core']);
        exportPolicySelect.value = allowedPolicies.has(savedPolicy) ? savedPolicy : 'first_per_core';
        const manualConfig = document.getElementById('manual-export-config');
        const manualModeSelect = document.getElementById('manual-selection-mode');
        const manualLabelSelect = document.getElementById('manual-udl-label');
        const manualCoreMapConfig = document.getElementById('manual-core-map-config');
        const refreshManualExportUi = () => {
            const isManual = String(exportPolicySelect.value || '') === 'manual_select';
            if (manualConfig) {
                manualConfig.style.display = isManual ? 'block' : 'none';
            }
            const mode = String(manualModeSelect?.value || 'label_all');
            const byLabel = mode === 'label_all';
            const byCore = mode === 'core_map';
            if (manualLabelSelect) {
                manualLabelSelect.disabled = !isManual || !byLabel;
            }
            if (manualCoreMapConfig) {
                manualCoreMapConfig.style.display = isManual && byCore ? 'block' : 'none';
            }
            renderManualCoreSelectionUi(appState.data);
        };
        refreshManualExportUi();
        manualModeSelect?.addEventListener('change', refreshManualExportUi);
        exportPolicySelect.addEventListener('change', () => {
            localStorage.setItem(EXPORT_VARIANT_POLICY_STORAGE_KEY, String(exportPolicySelect.value || 'first_per_core'));
            refreshManualExportUi();
        });
    }

    evaluateGenerationAdvisory(elements);

    if (elements.singleExerciseType) {
        elements.singleExerciseType.addEventListener('change', () => {
            const selectedType = String(elements.singleExerciseType.value || '').trim();
            if (EXERCISE_TYPES.includes(selectedType)) {
                localStorage.setItem(SINGLE_EXERCISE_TYPE_STORAGE_KEY, selectedType);
            } else {
                localStorage.removeItem(SINGLE_EXERCISE_TYPE_STORAGE_KEY);
            }
        });
    }
    if (elements.providerMode) {
        elements.providerMode.addEventListener('change', () => {
            const mode = setProviderMode(elements, elements.providerMode.value);
            localStorage.setItem(PROVIDER_MODE_STORAGE_KEY, mode);
        });
    }
    if (elements.btnGeneratePrompt) {
        elements.btnGeneratePrompt.addEventListener('click', () => {
            handleGeneratePrompt(elements);
        });
    }
    if (elements.btnCopyPrompt) {
        elements.btnCopyPrompt.addEventListener('click', async () => {
            const prompt = String(elements.manualAiPrompt?.value || '').trim();
            if (!prompt) {
                setStatus(elements, t('status.promptNotReady'), 'warning');
                return;
            }
            try {
                await navigator.clipboard.writeText(prompt);
                setStatus(elements, t('status.promptCopied'), 'success');
            } catch {
                setStatus(elements, t('status.promptCopyFailed'), 'warning');
            }
        });
    }
    if (elements.btnImportAiJson) {
        elements.btnImportAiJson.addEventListener('click', () => {
            handleImportManualJson(elements);
        });
    }
    if (elements.teacherLearningObjective) {
        elements.teacherLearningObjective.addEventListener('change', () => {
            persistTeacherConfigFromDom();
        });
    }
    if (elements.teacherBloomLevel) {
        elements.teacherBloomLevel.addEventListener('change', () => {
            persistTeacherConfigFromDom();
        });
    }
    if (elements.teacherDifficultyLevel) {
        elements.teacherDifficultyLevel.addEventListener('change', () => {
            persistTeacherConfigFromDom();
        });
    }
    if (elements.teacherTypePolicy) {
        elements.teacherTypePolicy.addEventListener('change', () => {
            persistTeacherConfigFromDom();
        });
    }

    document.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        if (target.matches('.dua-barrier-input, #dua-profile-level, #dua-modality, #dua-purpose, #dua-variation-type, #dua-variant-count')) {
            evaluateGenerationAdvisory(elements);
        }
    });

    elements.languageSelect.addEventListener('change', () => {
        const locale = setLocale(elements.languageSelect.value);
        const currentMode = normalizeWorkspaceMode(appState.workspaceMode || loadWorkspaceModeFromStorage());
        const previousStatus = elements.statusMsg.textContent;
        const previousStatusClass = elements.statusMsg.className;
        setState({ locale, workspaceMode: currentMode });
        const panel = document.querySelector('.panel-left');
        if (panel) {
            panel.dataset.structured = '';
        }
        try {
            applyI18n();
        } catch (error) {
            console.error('applyI18n failed on locale change:', error);
        }
        try {
            setupLeftPanelSections(elements);
        } catch (error) {
            console.error('setupLeftPanelSections (locale change) failed:', error);
        }
        enforceLeftPanelScroll(document.querySelector('.panel-left'));
        updateHelpLinksByLocale(elements, locale);
        if (elements.exerciseCount) {
            elements.exerciseCount.value = '1';
            elements.exerciseCount.disabled = true;
        }
        if (elements.singleExerciseType) {
            const savedType = String(localStorage.getItem(SINGLE_EXERCISE_TYPE_STORAGE_KEY) || '').trim();
            elements.singleExerciseType.value = EXERCISE_TYPES.includes(savedType) ? savedType : '';
        }
        setProviderMode(elements, loadProviderModeFromStorage());
        setTeacherConfigToDom(loadTeacherConfigFromStorage());
        refreshRecoverDraftUi(elements);
        updateDerivedViews(elements, appState.data, appState.validation, appState.promptTrace);
        applyWorkspaceMode(elements, currentMode);
        elements.statusMsg.className = previousStatusClass;
        elements.statusMsg.textContent = previousStatus || t('ui.noItems');
    });

    elements.workspaceModeSelect?.addEventListener('change', () => {
        const mode = normalizeWorkspaceMode(elements.workspaceModeSelect?.value);
        try {
            localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, mode);
        } catch {
            // ignore storage failures
        }
        setState({ workspaceMode: mode });
        applyWorkspaceMode(elements, mode);
        // Ensure mode-dependent UI is reapplied after async render cycles.
        setTimeout(() => applyWorkspaceMode(elements, mode), 0);
    });

    elements.btnUploadSummary.addEventListener('click', () => {
        elements.summaryFile.click();
    });

    elements.summaryFile.addEventListener('change', async () => {
        await handleSummaryUpload(elements);
    });

    elements.btnNewProject?.addEventListener('click', () => {
        savePromptTraceToSession('');
        setState({
            data: null,
            validation: null,
            promptTrace: '',
            studentResultsReports: [],
            studentResultsSummary: null
        });
        if (elements.jsonInput) {
            elements.jsonInput.value = '';
        }
        if (elements.exerciseSearch) {
            elements.exerciseSearch.value = '';
        }
        setStatus(elements, t('status.projectReset'), 'success');
        refreshRecoverDraftUi(elements);
    });

    elements.btnRecoverDraft?.addEventListener('click', () => {
        const autosaveDraft = loadAutosaveDraft();
        if (!autosaveDraft) {
            setStatus(elements, t('status.noDraftToRecover'), 'warning');
            refreshRecoverDraftUi(elements);
            return;
        }
        const restored = restoreAutosaveDraftIntoApp(elements, autosaveDraft, appState.locale || 'en');
        if (!restored) {
            setStatus(elements, t('status.noDraftToRecover'), 'warning');
            clearAutosaveDraft();
            refreshRecoverDraftUi(elements);
            return;
        }
        updateDerivedViews(elements, appState.data, appState.validation, appState.promptTrace);
        applyWorkspaceMode(elements, appState.workspaceMode || loadWorkspaceModeFromStorage());
        setStatus(elements, t('status.draftRecovered'), 'success');
        refreshRecoverDraftUi(elements);
    });

    elements.btnImportProject.addEventListener('click', () => {
        elements.projectFile.click();
    });

    elements.btnImportResults?.addEventListener('click', () => {
        elements.studentResultsFile?.click();
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
            refreshRecoverDraftUi(elements);
        } catch (error) {
            if (error.message === 'invalid_json') {
                setStatus(elements, t('status.projectLoadError'), 'error');
                return;
            }
            setStatus(elements, t('status.fileReadError'), 'error');
        }
    });

    elements.studentResultsFile?.addEventListener('change', async () => {
        const file = elements.studentResultsFile?.files?.[0];
        if (!file) {
            return;
        }
        setStatus(elements, t('status.readingFile'), 'info');
        try {
            const parsed = await readJsonFile(file);
            const summary = analyzeStudentResultsPayload(parsed, appState.data);
            const reportKey = String(summary.sessionId || file.name || '').trim() || `report_${Date.now()}`;
            const previousReports = Array.isArray(appState.studentResultsReports) ? appState.studentResultsReports : [];
            const deduped = previousReports.filter((item) => String(item?.key || '').trim() !== reportKey);
            deduped.push({
                key: reportKey,
                fileName: String(file.name || '').trim(),
                importedAt: new Date().toISOString(),
                summary
            });
            const aggregate = aggregateStudentResultsReports(deduped);
            setState({ studentResultsReports: deduped, studentResultsSummary: aggregate });
            setStatus(elements, t('status.resultsImported', {
                reports: aggregate.reports || deduped.length,
                total: summary.total,
                correct: summary.correct,
                accuracy: summary.accuracy
            }), 'success');
        } catch {
            setStatus(elements, t('status.resultsImportError'), 'error');
        } finally {
            if (elements.studentResultsFile) {
                elements.studentResultsFile.value = '';
            }
        }
    });

    elements.btnClearResults?.addEventListener('click', () => {
        setState({
            studentResultsReports: [],
            studentResultsSummary: null
        });
        setStatus(elements, t('status.resultsCleared'), 'success');
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
        const allExercises = Array.isArray(appState.data.exercises) ? appState.data.exercises : [];
        const unreviewedCount = allExercises.filter((exercise) => exercise?.reviewed !== true).length;
        if (unreviewedCount > 0) {
            const proceed = window.confirm(`There are ${unreviewedCount} exercises not marked as reviewed. Export anyway?`);
            if (!proceed) {
                setStatus(elements, t('status.exportBlockedByUnreviewed'), 'warning');
                return;
            }
        }

        const exportPolicySelect = document.getElementById('export-variant-policy');
        const variantPolicy = String(exportPolicySelect?.value || 'first_per_core').trim() || 'first_per_core';
        const variantGroups = getVariantGroupsForExport(appState.data);
        const hasRealVariants = variantGroups.some((group) => Array.isArray(group.variants) && group.variants.length > 1);
        let manualSelection = null;
        if (variantPolicy === 'manual_select' && hasRealVariants) {
            manualSelection = buildManualSelectionForExport(variantGroups);
            if (!manualSelection) {
                setStatus(elements, t('status.exportCancelled'), 'warning');
                return;
            }
        }

        exportVisorPackage(appState.data, { variantPolicy, manualSelection });
        setStatus(elements, t('status.studentsExported'), 'success');
    });

    elements.btnExportScorm?.addEventListener('click', async () => {
        if (!appState.data || !Array.isArray(appState.data.exercises) || appState.data.exercises.length === 0) {
            setStatus(elements, t('status.nothingToExport'), 'warning');
            return;
        }
        const allExercises = Array.isArray(appState.data.exercises) ? appState.data.exercises : [];
        const unreviewedCount = allExercises.filter((exercise) => exercise?.reviewed !== true).length;
        if (unreviewedCount > 0) {
            const proceed = window.confirm(`There are ${unreviewedCount} exercises not marked as reviewed. Export SCORM anyway?`);
            if (!proceed) {
                setStatus(elements, t('status.exportBlockedByUnreviewed'), 'warning');
                return;
            }
        }

        const exportPolicySelect = document.getElementById('export-variant-policy');
        const variantPolicy = String(exportPolicySelect?.value || 'first_per_core').trim() || 'first_per_core';
        const variantGroups = getVariantGroupsForExport(appState.data);
        const hasRealVariants = variantGroups.some((group) => Array.isArray(group.variants) && group.variants.length > 1);
        let manualSelection = null;
        if (variantPolicy === 'manual_select' && hasRealVariants) {
            manualSelection = buildManualSelectionForExport(variantGroups);
            if (!manualSelection) {
                setStatus(elements, t('status.exportCancelled'), 'warning');
                return;
            }
        }

        try {
            await exportScorm12Package(appState.data, { variantPolicy, manualSelection });
            setStatus(elements, t('status.scormExported'), 'success');
        } catch {
            setStatus(elements, t('status.scormExportError'), 'error');
        }
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
        renderManualCoreSelectionUi(state.data);
        applyWorkspaceMode(elements, state.workspaceMode || loadWorkspaceModeFromStorage());
        scheduleAutosave(elements);
    });

    window.addEventListener('beforeunload', () => {
        scheduleAutosave(elements);
        if (autosaveTimerId) {
            clearTimeout(autosaveTimerId);
            autosaveTimerId = null;
        }
        const teacherConfig = readTeacherConfigFromDom();
        saveAutosaveDraft({
            saved_at: new Date().toISOString(),
            locale: String(appState.locale || 'en'),
            workspace_mode: normalizeWorkspaceMode(appState.workspaceMode || loadWorkspaceModeFromStorage()),
            provider_mode: normalizeProviderMode(elements?.providerMode?.value || loadProviderModeFromStorage()),
            single_exercise_type: String(elements?.singleExerciseType?.value || '').trim(),
            teacher_config: teacherConfig,
            dua_config: readDuaConfigFromDom(),
            data: appState.data || null,
            prompt_trace: String(appState.promptTrace || '').trim()
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
