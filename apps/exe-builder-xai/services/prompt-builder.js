import { buildXaiContract } from './ai-contract.js';

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

export function buildXaiPrompt({ locale, content, exerciseCount = 3, typePlan = null, strictTypeCounts = false }) {
    const contract = buildXaiContract();
    const instruction = buildInstruction();
    const normalizedTypePlan = normalizeTypePlan(typePlan);
    const hasTypePlan = Object.keys(normalizedTypePlan).length > 0;

    const typePlanSection = hasTypePlan
        ? `
TYPE DISTRIBUTION CONSTRAINT (${strictTypeCounts ? 'strict' : 'preferred'}):
${JSON.stringify(normalizedTypePlan, null, 2)}
- Generate exactly these counts per type.
- Do NOT generate exercise types outside this set.
- Sum of generated exercises must match both the requested distribution and exerciseCount.
`
        : '\nTYPE DISTRIBUTION: No fixed distribution was requested. Prioritize variety and pedagogical fit.';

    return `${instruction}

XAI CONTRACT (mandatory):
${JSON.stringify(contract, null, 2)}
${typePlanSection}

ADDITIONAL REQUIREMENTS:
1) Generate exactly ${exerciseCount} exercises.
2) Use a variety of exercise types.
3) Ensure pedagogical coherence with Bloom and difficulty.
4) Include source_refs, uncertainty, and counterfactual in each xai block.
4.1) Include human_oversight in each xai block (teacher review protocol and human override policy).
4.2) Include quality_of_explanation in each xai block (clarity and pedagogical actionability).
5) Output must comply with schema_version: "xai-exercises/2.0.0".
6) Do NOT use strings where an object is required (e.g., xai.pedagogical_alignment must be an object).
7) Do not include any text outside the JSON.
8) If type = "fill_gaps", interaction must include: template (with real bracketed answers like [división] or {___}), correct_answers (ordered array), and distractors (extra words array).
9) Exercise IDs must be unique across the exercises array.
10) Do not use null or undefined in required fields.
11) Before responding, internally self-check: correct types, valid enums, minimum text lengths, and exact exercise count.
12) All learner/teacher-facing text fields must be written in locale: "${locale}".
13) Never use generic placeholder content such as "Option 1", "Option 2", "Paso 1", "Paso 2", or literal "[answer]" as final content.
14) For multiple_choice: provide at least 4 plausible, domain-specific options; exactly 1 correct; all options must be meaningful and distinct.
15) For ordering: steps must be concrete action statements in the correct process, not numbered placeholder labels.
16) For fill_gaps: bracket tokens in template must contain real answer text aligned in order with correct_answers; symbols are allowed as valid answers (e.g., "/", "//", "%").
17) For matching: interaction must include a non-empty pairs array with objects { left, right }, each side meaningful and non-generic.
18) For grouping: interaction must include categories (array of category labels) and items (array of { text, category }); every item.category must exist in categories.

MANDATORY PER-EXERCISE TEMPLATE (respect types):
{
    "id": "ex_...",
    "type": "multiple_choice|true_false|fill_gaps|ordering|matching|grouping|short_answer|hotspot|slider",
    "content": { "prompt_text": "..." },
    "interaction": {},
    "scaffolding": { "hint_1": "...", "explanation": "...", "learn_more": "..." },
    "xai": {
        "why_this_exercise": "...",
        "pedagogical_alignment": {
            "learning_objective": "...",
            "competency": "...",
            "bloom_level": "recordar|comprender|aplicar|analizar|evaluar|crear",
            "difficulty_level": "bajo|medio|alto"
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
            "cognitive_load": "baja|media|alta"
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
            "target_audience": "docente|estudiante|mixta",
            "clarity_level": "baja|media|alta",
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
            "model": "${locale === 'en' ? 'model-name' : 'nombre-modelo'}",
            "prompt_id": "xai_prompt_v2",
            "timestamp_utc": "2026-02-13T12:00:00Z"
        }
    }
}

SOURCE CONTENT:
${content}`;
}
