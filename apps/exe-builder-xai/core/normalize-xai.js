import { normalizeOrderingEntries, replaceGenericBracketTokens } from './interaction-utils.js';

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

function normalizeChoiceOptions(interaction, forceBoolean = false) {
    const source = asObject(interaction);
    const candidates = [
        source.options,
        source.choices,
        source.answers,
        source.items
    ];

    let rawOptions = [];
    for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) {
            rawOptions = candidate;
            break;
        }
    }

    const normalized = rawOptions
        .map((item, index) => {
            if (typeof item === 'string') {
                return {
                    id: `o${index + 1}`,
                    text: asString(item),
                    is_correct: index === 0
                };
            }
            const asItem = asObject(item);
            return {
                id: asString(asItem.id, `o${index + 1}`),
                text: asString(asItem.text ?? asItem.label ?? asItem.value),
                is_correct: Boolean(asItem.is_correct ?? asItem.correct ?? asItem.isCorrect)
            };
        })
        .filter((item) => item.text);

    if (forceBoolean && normalized.length === 0) {
        return {
            ...source,
            options: [
                { id: 'o1', text: 'Verdadero', is_correct: true },
                { id: 'o2', text: 'Falso', is_correct: false }
            ]
        };
    }

    if (normalized.length > 0 && !normalized.some((item) => item.is_correct)) {
        normalized[0].is_correct = true;
    }

    return {
        ...source,
        options: normalized
    };
}

function normalizeFillGapsInteraction(interaction, promptText = '') {
    const source = asObject(interaction);
    const correctAnswers = asArray(source.correct_answers);
    const distractors = asArray(source.distractors);
    const templateBase = asString(source.template, asString(promptText, ''));
    const template = replaceGenericBracketTokens(templateBase, correctAnswers);

    return {
        ...source,
        template,
        correct_answers: correctAnswers,
        distractors
    };
}

function normalizeOrderingInteraction(interaction) {
    const source = asObject(interaction);
    const sequence = normalizeOrderingEntries(source);

    return {
        ...source,
        sequence
    };
}

function normalizeMatchingInteraction(interaction) {
    const source = asObject(interaction);

    const normalizePair = (item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return null;
        }
        const obj = asObject(item);
        const left = asString(obj.left ?? obj.term ?? obj.concept ?? obj.a ?? obj.source);
        const right = asString(obj.right ?? obj.definition ?? obj.target ?? obj.b ?? obj.match);
        if (!left || !right) {
            return null;
        }
        return { left, right };
    };

    let pairs = [];
    if (Array.isArray(source.pairs)) {
        pairs = source.pairs.map(normalizePair).filter(Boolean);
    }

    if (pairs.length === 0 && Array.isArray(source.matching_pairs)) {
        pairs = source.matching_pairs.map(normalizePair).filter(Boolean);
    }

    if (pairs.length === 0 && Array.isArray(source.left_items) && Array.isArray(source.right_items)) {
        const limit = Math.min(source.left_items.length, source.right_items.length);
        pairs = Array.from({ length: limit }, (_, index) => ({
            left: asString(source.left_items[index]),
            right: asString(source.right_items[index])
        })).filter((pair) => pair.left && pair.right);
    }

    return {
        ...source,
        pairs
    };
}

function normalizeGroupingInteraction(interaction) {
    const source = asObject(interaction);
    const groupsSource = Array.isArray(source.groups)
        ? source.groups
        : (Array.isArray(source.buckets) ? source.buckets : (Array.isArray(source.clusters) ? source.clusters : []));

    const idToLabel = new Map();
    const categories = [];
    const items = [];

    const registerCategory = (value) => {
        const normalized = asString(value, '');
        if (!normalized) {
            return '';
        }
        if (!categories.includes(normalized)) {
            categories.push(normalized);
        }
        return normalized;
    };

    const normalizeItemText = (value) => {
        if (typeof value === 'string') {
            return asString(value, '');
        }
        const obj = asObject(value);
        return asString(obj.text ?? obj.label ?? obj.value ?? obj.term, '');
    };

    if (Array.isArray(source.categories)) {
        source.categories.forEach((category) => {
            registerCategory(category);
        });
    }

    groupsSource.forEach((group, index) => {
        const grp = asObject(group);
        const groupId = asString(grp.id ?? grp.key ?? grp.group_id ?? String(index), '');
        const label = registerCategory(grp.label ?? grp.name ?? grp.title ?? grp.category ?? groupId);
        if (!label) {
            return;
        }
        if (groupId) {
            idToLabel.set(groupId, label);
        }

        const groupItems = Array.isArray(grp.items)
            ? grp.items
            : (Array.isArray(grp.elements) ? grp.elements : (Array.isArray(grp.values) ? grp.values : []));

        groupItems.forEach((entry) => {
            const text = normalizeItemText(entry);
            if (!text) {
                return;
            }
            items.push({ text, category: label });
        });
    });

    const sourceItems = Array.isArray(source.items)
        ? source.items
        : (Array.isArray(source.elements) ? source.elements : []);

    sourceItems.forEach((entry) => {
        const text = normalizeItemText(entry);
        if (!text) {
            return;
        }

        const itemObj = asObject(entry);
        const rawCategory = asString(itemObj.category ?? itemObj.group ?? itemObj.group_id ?? itemObj.bucket, '');
        const resolvedCategory = registerCategory(idToLabel.get(rawCategory) || rawCategory);
        if (!resolvedCategory) {
            return;
        }

        items.push({ text, category: resolvedCategory });
    });

    const deduped = [];
    const seen = new Set();
    items.forEach((item) => {
        const key = `${item.text}::${item.category}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        deduped.push(item);
    });

    return {
        ...source,
        categories,
        items: deduped
    };
}

function normalizeInteractionByType(type, interactionValue, promptText = '') {
    const interaction = asObject(interactionValue);

    if (type === 'multiple_choice') {
        return normalizeChoiceOptions(interaction, false);
    }

    if (type === 'true_false') {
        return normalizeChoiceOptions(interaction, true);
    }

    if (type === 'fill_gaps') {
        return normalizeFillGapsInteraction(interaction, promptText);
    }

    if (type === 'ordering') {
        return normalizeOrderingInteraction(interaction);
    }

    if (type === 'matching') {
        return normalizeMatchingInteraction(interaction);
    }

    if (type === 'grouping') {
        return normalizeGroupingInteraction(interaction);
    }

    return interaction;
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

    const oversightRaw = xaiObj.human_oversight;
    const oversight = typeof oversightRaw === 'string'
        ? {
            review_protocol: oversightRaw,
            teacher_action_on_risk: '',
            override_policy: ''
        }
        : asObject(oversightRaw);

    const qualityRaw = xaiObj.quality_of_explanation;
    const quality = typeof qualityRaw === 'string'
        ? {
            target_audience: 'docente',
            clarity_level: 'media',
            actionable_feedback: qualityRaw,
            adaptation_notes: ''
        }
        : asObject(qualityRaw);

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

    const type = asString(ex.type, 'multiple_choice');

    return {
        id: asString(ex.id, `ex_auto_${Date.now()}_${index}`),
        reviewed: ex.reviewed === true,
        type,
        content: {
            prompt_text: asString(ex?.content?.prompt_text, '')
        },
        interaction: normalizeInteractionByType(type, ex.interaction, ex?.content?.prompt_text),
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
            human_oversight: {
                review_protocol: asString(oversight.review_protocol, ''),
                teacher_action_on_risk: asString(oversight.teacher_action_on_risk, ''),
                override_policy: asString(oversight.override_policy, '')
            },
            quality_of_explanation: {
                target_audience: asString(quality.target_audience, 'docente'),
                clarity_level: asString(quality.clarity_level, 'media'),
                actionable_feedback: asString(quality.actionable_feedback, ''),
                adaptation_notes: asString(quality.adaptation_notes, '')
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
        schema_version: asString(root.schema_version, 'xai-exercises/2.0.0'),
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
