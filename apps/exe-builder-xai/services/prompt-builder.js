import { buildXaiContract } from './ai-contract.js';
import { EXERCISE_TYPES } from '../core/exercise-types.js';

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

function buildInstruction() {
    return `You are an instructional designer and XAI specialist.
Return ONLY valid JSON, no markdown, no comments.
Every exercise must include a complete xai block aligned with the contract.`;
}

function normalizeTypePlan(typePlan) {
    if (!typePlan || typeof typePlan !== 'object' || Array.isArray(typePlan)) {
        return {};
    }

    return Object.entries(typePlan).reduce((accumulator, [type, count]) => {
        const numeric = Number(count);
        if (Number.isFinite(numeric) && numeric > 0) {
            accumulator[type] = Math.floor(numeric);
        }
        return accumulator;
    }, {});
}

function normalizeDuaConfig(duaConfig) {
    if (!duaConfig || typeof duaConfig !== 'object' || Array.isArray(duaConfig)) {
        return {
            enabled: false,
            profile_level: 'heterogeneo',
            barriers: [],
            modality: 'individual',
            purpose: 'formativa',
            variation_type: 'none',
            variant_count: 1
        };
    }

    const rawCount = Number(duaConfig.variant_count);
    const variationType = String(duaConfig.variation_type || 'none').trim() || 'none';
    return {
        enabled: Boolean(duaConfig.enabled) && variationType !== 'none',
        profile_level: String(duaConfig.profile_level || 'heterogeneo').trim() || 'heterogeneo',
        barriers: Array.isArray(duaConfig.barriers) ? duaConfig.barriers.map((item) => String(item || '').trim()).filter(Boolean) : [],
        modality: String(duaConfig.modality || 'individual').trim() || 'individual',
        purpose: String(duaConfig.purpose || 'formativa').trim() || 'formativa',
        variation_type: variationType,
        variant_count: Number.isFinite(rawCount) ? Math.max(1, Math.min(3, Math.floor(rawCount))) : 1
    };
}

function normalizeTeacherConfig(teacherConfig) {
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
    if (!teacherConfig || typeof teacherConfig !== 'object' || Array.isArray(teacherConfig)) {
        return {
            learning_objective: '',
            bloom_level: 'understand',
            difficulty_level: 'medium',
            type_policy: 'locked'
        };
    }
    const bloomRaw = String(teacherConfig.bloom_level || 'understand').trim().toLowerCase();
    const difficultyRaw = String(teacherConfig.difficulty_level || 'medium').trim().toLowerCase();
    const bloom = bloomAliases[bloomRaw] || bloomRaw;
    const difficulty = difficultyAliases[difficultyRaw] || difficultyRaw;
    return {
        learning_objective: String(teacherConfig.learning_objective || '').trim(),
        bloom_level: bloom || 'understand',
        difficulty_level: difficulty || 'medium',
        type_policy: String(teacherConfig.type_policy || 'locked').trim() || 'locked'
    };
}

function normalizeMemoryEntries(memoryEntries) {
    if (!Array.isArray(memoryEntries)) {
        return [];
    }
    return memoryEntries
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
        .slice(-8);
}

function toPromptDuaValue(value) {
    const key = String(value || '').trim().toLowerCase();
    const map = {
        heterogeneo: 'heterogeneous',
        inicial: 'initial',
        intermedio: 'intermediate',
        avanzado: 'advanced',
        ninguna_relevante: 'none_relevant',
        dificultad_lectora: 'reading_difficulty',
        sobrecarga_sintactica: 'syntactic_overload',
        atencion_limitada: 'limited_sustained_attention',
        ansiedad_evaluativa: 'assessment_anxiety',
        formativa: 'formative',
        diagnostica: 'diagnostic',
        sumativa: 'summative',
        practica_autonoma: 'autonomous_practice',
        equilibradas: 'balanced',
        representacion: 'representation',
        accion_expresion: 'action_expression',
        implicacion: 'engagement'
    };
    return map[key] || key || 'none';
}

export function buildXaiPrompt({
    locale,
    exerciseLanguage = 'en',
    content,
    exerciseCount = 3,
    typePlan = null,
    strictTypeCounts = false,
    duaConfig = null,
    teacherConfig = null,
    memoryEntries = null,
    selectedExerciseType = ''
}) {
    const contract = buildXaiContract();
    const instruction = buildInstruction();
    const normalizedExerciseLanguage = /^[a-z]{2}(-[a-z]{2})?$/.test(String(exerciseLanguage || '').trim().toLowerCase())
        ? String(exerciseLanguage).trim().toLowerCase()
        : 'en';
    const normalizedTypePlan = normalizeTypePlan(typePlan);
    const hasTypePlan = Object.keys(normalizedTypePlan).length > 0;
    const normalizedDua = normalizeDuaConfig(duaConfig);
    const normalizedTeacher = normalizeTeacherConfig(teacherConfig);
    const selectedType = String(selectedExerciseType || '').trim();
    const normalizedMemory = normalizeMemoryEntries(memoryEntries);

    const typePlanSection = hasTypePlan
        ? `
TYPE DISTRIBUTION CONSTRAINT (${strictTypeCounts ? 'strict' : 'preferred'}):
${JSON.stringify(normalizedTypePlan, null, 2)}
- Generate exactly these counts per type.
- Do NOT generate exercise types outside this set.
- Sum of generated exercises must match both the requested distribution and exerciseCount.
- If DUA is enabled, all variants of a core MUST keep this same exercise type.
`
        : (normalizedTeacher.type_policy === 'equivalent' && selectedType
            ? `
TYPE POLICY CONSTRAINT (equivalent):
- Base type requested: "${selectedType}".
- Do not use unrelated types.
- DUA-Representacion and DUA-Implicacion must keep type="${selectedType}".
- Only DUA-Accion/Expresion may use equivalent types allowed by the policy.
`
            : '\nTYPE DISTRIBUTION: No fixed distribution was requested. Prioritize variety and pedagogical fit.');

    const exerciseTypeUnion = EXERCISE_TYPES.join('|');
    const promptDua = normalizedDua.enabled ? {
        ...normalizedDua,
        profile_level: toPromptDuaValue(normalizedDua.profile_level),
        barriers: normalizedDua.barriers.map((item) => toPromptDuaValue(item)),
        modality: toPromptDuaValue(normalizedDua.modality),
        purpose: toPromptDuaValue(normalizedDua.purpose),
        variation_type: toPromptDuaValue(normalizedDua.variation_type)
    } : normalizedDua;
    const duaProfileTemplate = normalizedDua.enabled
        ? JSON.stringify({
            profile_level: promptDua.profile_level,
            barriers: promptDua.barriers,
            modality: promptDua.modality,
            purpose: promptDua.purpose,
            variation_type: promptDua.variation_type,
            variant_count: normalizedDua.variant_count
        }, null, 8)
        : 'null';
    const duaSection = normalizedDua.enabled
        ? `
DUA ADAPTATION ENABLED (mandatory):
${JSON.stringify({
            ...promptDua,
            variant_count: normalizedDua.variant_count
        }, null, 2)}
- Keep a common conceptual core per exercise family.
- Generate at most ${normalizedDua.variant_count} DUA variants per core.
- Use labels in exercise.dua.label: "DUA-Representacion", "DUA-Accion/Expresion", "DUA-Implicacion".
- For each exercise include exercise.dua.xai_summary (short narrative explanation), exercise.dua.core_statement, exercise.dua.core_id, exercise.dua.variant_index, exercise.dua.variant_total.
- Add generation_context.dua_enabled=true and generation_context.dua_profile with the selected DUA input.
`
        : '\nDUA ADAPTATION: disabled. Do not add synthetic DUA variants.';
    const teacherLockedSection = `
TEACHER-LOCKED PEDAGOGICAL INPUTS (mandatory invariants):
${JSON.stringify(normalizedTeacher, null, 2)}
- Keep learning_objective, bloom_level, and difficulty_level constant across all generated exercises and UDL variants.
- Do not change these locked values.
- If type_policy="locked", all variants must keep the requested type.
${normalizedTeacher.type_policy === 'equivalent' && selectedType ? `- If type_policy="equivalent", base requested type is "${selectedType}".` : ''}
${normalizedTeacher.type_policy === 'equivalent' && selectedType ? `- For DUA-Representacion and DUA-Implicacion, keep type="${selectedType}".` : ''}
${normalizedTeacher.type_policy === 'equivalent' && selectedType ? `- Only DUA-Accion/Expresion may change type, and only to: ${(EQUIVALENT_TYPE_MAP[selectedType] || [selectedType]).join(', ')}.` : ''}
`;
    const memorySection = normalizedMemory.length > 0
        ? `
ANTI-REPETITION MEMORY (recent exercises on this topic):
${JSON.stringify(normalizedMemory, null, 2)}
- Avoid repeating the same prompt wording, same context, and same interaction pattern.
`
        : '\nANTI-REPETITION MEMORY: no prior exercises yet.';

    return `${instruction}

XAI CONTRACT (mandatory):
${JSON.stringify(contract, null, 2)}
${typePlanSection}
${duaSection}
${teacherLockedSection}
${memorySection}

ADDITIONAL REQUIREMENTS:
1) Generate exactly ${exerciseCount} exercises.${normalizedDua.enabled ? ' In DUA mode this is total variants (not only cores).' : ''}
2) ${hasTypePlan
        ? 'Use only the requested exercise type(s) exactly as specified.'
        : (normalizedTeacher.type_policy === 'equivalent' && selectedType
            ? `Use base type "${selectedType}" and equivalent-policy rules only. Do not use unrelated types.`
            : 'Use a variety of exercise types.')}
3) Ensure pedagogical coherence with Bloom and difficulty.
4) Include source_refs, uncertainty, and counterfactual in each xai block.
4.1) Include human_oversight in each xai block (teacher review protocol and human override policy).
4.2) Include quality_of_explanation in each xai block (clarity and pedagogical actionability).
5) Output must comply with schema_version: "xai-exercises/2.0.0".
5.1) Top-level required objects must be present and complete: resource_metadata {title, topic, grade_level, language} and generation_context {audience, pedagogical_goal, constraints[], source_material_refs[]}.
6) Do NOT use strings where an object is required (e.g., xai.pedagogical_alignment must be an object).
7) Do not include any text outside the JSON.
8) If type = "fill_gaps", interaction must include: template (with real bracketed answers like [division] or {___}), correct_answers (ordered array), and distractors (extra words array).
9) Exercise IDs must be unique across the exercises array.
10) Do not use null or undefined in required fields.
11) Before responding, internally self-check: correct types, valid enums, minimum text lengths, and exact exercise count.
12) All learner/teacher-facing text fields must be written in locale: "${normalizedExerciseLanguage}".
13) Never use generic placeholder content such as "Option 1", "Option 2", "Paso 1", "Paso 2", or literal "[answer]" as final content.
14) For multiple_choice: provide at least 4 plausible, domain-specific options; exactly 1 correct; all options must be meaningful and distinct.
15) For ordering: steps must be concrete action statements in the correct process, not numbered placeholder labels.
16) For fill_gaps: bracket tokens in template must contain real answer text aligned in order with correct_answers; symbols are allowed as valid answers (e.g., "/", "//", "%").
17) For matching: interaction must include a non-empty pairs array with objects { left, right }, each side meaningful and non-generic.
18) For grouping: interaction must include categories (array of category labels) and items (array of { text, category }); every item.category must exist in categories.
19) If DUA is enabled, each exercise must include exercise.dua = { label, adaptation_focus, xai_summary, core_statement, core_id, variant_index, variant_total }.
20) For exercises sharing the same core_id, keep semantic equivalence: same micro-objective and same answer concept; vary only representation/action-engagement framing.

MANDATORY ROOT TEMPLATE:
{
    "schema_version": "xai-exercises/2.0.0",
    "resource_metadata": {
        "title": "...",
        "topic": "...",
        "grade_level": "...",
        "language": "${normalizedExerciseLanguage}"
    },
    "generation_context": {
        "audience": "...",
        "pedagogical_goal": "...",
        "constraints": ["..."],
        "source_material_refs": ["..."],
        "dua_enabled": ${normalizedDua.enabled ? 'true' : 'false'},
        "dua_profile": ${duaProfileTemplate}
    },
    "exercises": []
}

MANDATORY PER-EXERCISE TEMPLATE (respect types):
{
    "id": "ex_...",
    "type": "${exerciseTypeUnion}",
    "content": { "prompt_text": "..." },
    "interaction": {},
    "scaffolding": { "hint_1": "...", "explanation": "...", "learn_more": "..." },
    "dua": {
        "label": "DUA-Representacion|DUA-Accion/Expresion|DUA-Implicacion",
        "adaptation_focus": "...",
        "xai_summary": "...",
        "core_statement": "...",
        "core_id": "core_1",
        "variant_index": 1,
        "variant_total": 3
    },
    "xai": {
        "why_this_exercise": "...",
        "pedagogical_alignment": {
            "learning_objective": "...",
            "competency": "...",
            "bloom_level": "remember|understand|apply|analyze|evaluate|create",
            "difficulty_level": "low|medium|high"
        },
        "content_selection": {
            "why_this_content": "...",
            "source_refs": ["..."],
            "alternatives_considered": ["..."]
        },
        "design_rationale": {
            "why_this_type": "...",
            "why_this_distractors": "...",
            "expected_time_sec": 90,
            "cognitive_load": "low|medium|high"
        },
        "fairness_and_risk": {
            "potential_biases": ["..."],
            "mitigations": ["..."]
        },
        "human_oversight": {
            "review_protocol": "...",
            "teacher_action_on_risk": "...",
            "override_policy": "..."
        },
        "quality_of_explanation": {
            "target_audience": "teacher|student|mixed",
            "clarity_level": "low|medium|high",
            "actionable_feedback": "...",
            "adaptation_notes": "..."
        },
        "uncertainty": {
            "confidence": 0.75,
            "limitations": ["..."]
        },
        "counterfactual": {
            "condition": "...",
            "expected_change": "..."
        },
        "trace": {
            "model": "model-name",
            "prompt_id": "xai_prompt_v2",
            "timestamp_utc": "2026-02-13T12:00:00Z"
        }
    }
}

SOURCE CONTENT:
${content}`;
}
