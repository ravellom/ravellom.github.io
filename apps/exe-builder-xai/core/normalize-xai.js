function asString(value, fallback = '') {
    if (typeof value === 'string') {
        return value.trim();
    }
    if (value === null || value === undefined) {
        return fallback;
    }
    return String(value).trim();
}

function asArray(value) {
    if (Array.isArray(value)) {
        return value.map((item) => asString(item)).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(/[;|\n]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}

function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeExercise(exercise, index) {
    const ex = asObject(exercise);
    const xaiRaw = ex.xai;
    const xaiObj = typeof xaiRaw === 'string'
        ? { why_this_exercise: xaiRaw }
        : asObject(xaiRaw);

    const pedagogicalRaw = xaiObj.pedagogical_alignment;
    const pedagogical = typeof pedagogicalRaw === 'string'
        ? {
            learning_objective: pedagogicalRaw,
            competency: '',
            bloom_level: '',
            difficulty_level: ''
        }
        : asObject(pedagogicalRaw);

    const contentSelectionRaw = xaiObj.content_selection;
    const contentSelection = typeof contentSelectionRaw === 'string'
        ? {
            why_this_content: contentSelectionRaw,
            source_refs: [],
            alternatives_considered: []
        }
        : asObject(contentSelectionRaw);

    const fairnessRaw = xaiObj.fairness_and_risk;
    const fairness = typeof fairnessRaw === 'string'
        ? {
            potential_biases: [fairnessRaw],
            mitigations: []
        }
        : asObject(fairnessRaw);

    const uncertaintyRaw = xaiObj.uncertainty;
    const uncertainty = typeof uncertaintyRaw === 'string'
        ? {
            confidence: 0,
            limitations: [uncertaintyRaw]
        }
        : asObject(uncertaintyRaw);

    const counterfactualRaw = xaiObj.counterfactual;
    const counterfactual = typeof counterfactualRaw === 'string'
        ? {
            condition: counterfactualRaw,
            expected_change: ''
        }
        : asObject(counterfactualRaw);

    const traceRaw = xaiObj.trace;
    const trace = typeof traceRaw === 'string'
        ? {
            model: traceRaw,
            prompt_id: '',
            timestamp_utc: new Date().toISOString()
        }
        : asObject(traceRaw);

    return {
        id: asString(ex.id, `ex_auto_${Date.now()}_${index}`),
        type: asString(ex.type, 'multiple_choice'),
        content: {
            prompt_text: asString(ex?.content?.prompt_text, '')
        },
        interaction: asObject(ex.interaction),
        scaffolding: {
            hint_1: asString(ex?.scaffolding?.hint_1, ''),
            explanation: asString(ex?.scaffolding?.explanation, ''),
            learn_more: asString(ex?.scaffolding?.learn_more, '')
        },
        xai: {
            why_this_exercise: asString(xaiObj.why_this_exercise, ''),
            pedagogical_alignment: {
                learning_objective: asString(pedagogical.learning_objective, ''),
                competency: asString(pedagogical.competency, ''),
                bloom_level: asString(pedagogical.bloom_level, ''),
                difficulty_level: asString(pedagogical.difficulty_level, '')
            },
            content_selection: {
                why_this_content: asString(contentSelection.why_this_content, ''),
                source_refs: asArray(contentSelection.source_refs),
                alternatives_considered: asArray(contentSelection.alternatives_considered)
            },
            design_rationale: {
                why_this_type: asString(xaiObj?.design_rationale?.why_this_type, ''),
                why_this_distractors: asString(xaiObj?.design_rationale?.why_this_distractors, ''),
                expected_time_sec: Number(xaiObj?.design_rationale?.expected_time_sec) || 60,
                cognitive_load: asString(xaiObj?.design_rationale?.cognitive_load, 'media')
            },
            fairness_and_risk: {
                potential_biases: asArray(fairness.potential_biases),
                mitigations: asArray(fairness.mitigations)
            },
            uncertainty: {
                confidence: Number(uncertainty.confidence) || 0,
                limitations: asArray(uncertainty.limitations)
            },
            counterfactual: {
                condition: asString(counterfactual.condition, ''),
                expected_change: asString(counterfactual.expected_change, '')
            },
            trace: {
                model: asString(trace.model, ''),
                prompt_id: asString(trace.prompt_id, ''),
                timestamp_utc: asString(trace.timestamp_utc, new Date().toISOString())
            }
        }
    };
}

export function normalizeXaiBundle(bundle) {
    const root = asObject(bundle);
    const exercises = Array.isArray(root.exercises) ? root.exercises : [];

    return {
        schema_version: asString(root.schema_version, 'xai-exercises/1.0.0'),
        resource_metadata: {
            title: asString(root?.resource_metadata?.title, ''),
            topic: asString(root?.resource_metadata?.topic, ''),
            grade_level: asString(root?.resource_metadata?.grade_level, ''),
            language: asString(root?.resource_metadata?.language, 'es')
        },
        generation_context: {
            audience: asString(root?.generation_context?.audience, ''),
            pedagogical_goal: asString(root?.generation_context?.pedagogical_goal, ''),
            constraints: asArray(root?.generation_context?.constraints),
            source_material_refs: asArray(root?.generation_context?.source_material_refs)
        },
        exercises: exercises.map((exercise, index) => normalizeExercise(exercise, index))
    };
}
