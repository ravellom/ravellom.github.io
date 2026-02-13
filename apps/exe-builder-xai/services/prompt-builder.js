import { buildXaiContract } from './ai-contract.js';

function buildInstructionByLocale(locale) {
    if (locale === 'en') {
        return `You are an instructional designer and XAI specialist.
Return ONLY valid JSON, no markdown, no comments.
Every exercise must include a complete xai block aligned with the contract.`;
    }

    return `Actúa como diseñador instruccional y especialista en XAI.
Devuelve ÚNICAMENTE JSON válido, sin markdown ni comentarios.
Cada ejercicio debe incluir bloque xai completo y alineado al contrato.`;
}

export function buildXaiPrompt({ locale, content, exerciseCount = 3 }) {
    const contract = buildXaiContract();
    const instruction = buildInstructionByLocale(locale);

    return `${instruction}

CONTRATO XAI (obligatorio):
${JSON.stringify(contract, null, 2)}

REQUISITOS ADICIONALES:
1) Genera exactamente ${exerciseCount} ejercicios.
2) Usa variedad de tipos de ejercicio.
3) Asegura coherencia pedagógica con Bloom y dificultad.
4) Incluye source_refs, uncertainty y counterfactual en cada xai.
5) El output debe cumplir schema_version: "xai-exercises/1.0.0".
6) PROHIBIDO usar strings donde se espera objeto. Ejemplo: xai.pedagogical_alignment DEBE ser objeto.
7) No incluyas texto fuera del JSON.

PLANTILLA OBLIGATORIA POR EJERCICIO (respeta tipos):
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
            "prompt_id": "xai_prompt_v1",
            "timestamp_utc": "2026-02-13T12:00:00Z"
        }
    }
}

CONTENIDO BASE:
${content}`;
}
