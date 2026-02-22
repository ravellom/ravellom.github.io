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

function ensureMinText(value, minLength, fallback) {
    const text = asString(value, '');
    if (text.length >= minLength) {
        return text;
    }
    const safeFallback = asString(fallback, '');
    if (safeFallback.length >= minLength) {
        return safeFallback;
    }
    const extender = ' Additional contextual clarification is required for teacher review.';
    let candidate = safeFallback || 'Auto-generated explanation.';
    while (candidate.length < minLength) {
        candidate += extender;
    }
    return candidate;
}

function normalizeEnum(value, aliases, fallback) {
    const key = asString(value, fallback).toLowerCase();
    return aliases[key] || fallback;
}

function normalizeDuaProfileValue(group, value, fallback = '') {
    const raw = asString(value, '').toLowerCase();
    if (!raw) {
        return fallback;
    }
    const aliasesByGroup = {
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
    const aliases = aliasesByGroup[group] || {};
    return aliases[raw] || raw || fallback;
}

function normalizeDuaProfile(profile) {
    const source = asObject(profile);
    const rawCount = Number(source.variant_count);
    return {
        profile_level: normalizeDuaProfileValue('profile_level', source.profile_level, 'heterogeneous'),
        barriers: asArray(source.barriers).map((item) => normalizeDuaProfileValue('barrier', item)).filter(Boolean),
        modality: normalizeDuaProfileValue('modality', source.modality, 'individual'),
        purpose: normalizeDuaProfileValue('purpose', source.purpose, 'formative'),
        variation_type: normalizeDuaProfileValue('variation_type', source.variation_type, 'none'),
        variant_count: Number.isFinite(rawCount) ? Math.max(1, Math.min(3, Math.floor(rawCount))) : 1
    };
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
                { id: 'o1', text: 'True', is_correct: true },
                { id: 'o2', text: 'False', is_correct: false }
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

function fallbackWhyThisType(type) {
    const typeName = asString(type, 'exercise').replace(/_/g, ' ');
    return `This ${typeName} format was selected to align interaction with the intended learning objective.`;
}

function fallbackWhyThisDistractors(type) {
    if (type === 'matching') {
        return 'Pairs were selected to reduce ambiguity and force conceptual discrimination between close ideas.';
    }
    if (type === 'ordering') {
        return 'Steps were written to avoid superficial cues and require process understanding, not guessing.';
    }
    if (type === 'fill_gaps') {
        return 'Gap options were designed to check precise understanding while minimizing random completion.';
    }
    if (type === 'multiple_choice' || type === 'true_false') {
        return 'Alternatives were balanced to reveal misconceptions while preserving one clearly defensible answer.';
    }
    return 'Response elements were selected to reduce guessability and increase diagnostic pedagogical value.';
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
            target_audience: 'teacher',
            clarity_level: 'medium',
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

    const bloomAliases = {
        recordar: 'remember',
        comprender: 'understand',
        aplicar: 'apply',
        analizar: 'analyze',
        evaluar: 'evaluate',
        crear: 'create',
        remember: 'remember',
        understand: 'understand',
        apply: 'apply',
        analyze: 'analyze',
        evaluate: 'evaluate',
        create: 'create'
    };
    const difficultyAliases = {
        bajo: 'low',
        medio: 'medium',
        alto: 'high',
        low: 'low',
        medium: 'medium',
        high: 'high'
    };
    const cognitiveAliases = {
        baja: 'low',
        media: 'medium',
        alta: 'high',
        low: 'low',
        medium: 'medium',
        high: 'high'
    };
    const audienceAliases = {
        docente: 'teacher',
        estudiante: 'student',
        mixta: 'mixed',
        teacher: 'teacher',
        student: 'student',
        mixed: 'mixed'
    };
    const clarityAliases = {
        baja: 'low',
        media: 'medium',
        alta: 'high',
        low: 'low',
        medium: 'medium',
        high: 'high'
    };

    const promptText = asString(ex?.content?.prompt_text, '');
    const promptSnippet = promptText.slice(0, 140);
    const genericWhyExercise = `This exercise was generated to assess understanding of the target concept through an interaction aligned with the requested pedagogical objective and expected cognitive demand.`;
    const genericWhyContent = `The selected content keeps conceptual focus, reduces ambiguity, and supports coherent formative evidence for teacher review and instructional decision making.`;
    const genericHumanReview = `Teacher reviews conceptual accuracy, contextual relevance, and potential misunderstanding before publication.`;
    const genericTeacherAction = `If risk is detected, teacher rewrites wording, adjusts scaffolding, and validates expected answer logic.`;
    const genericOverride = `Final decision remains with teacher who can override AI output and document changes for traceability.`;
    const genericActionable = `Use targeted feedback to explain why the selected response is correct and what misconception should be corrected.`;
    const genericAdaptation = `Adjust examples, language load, and scaffolding depth according to group variability and barrier profile.`;
    const genericCounterfactualCondition = `If this exercise changed type or removed scaffolding support while keeping the same objective.`;
    const genericCounterfactualExpected = `Expected change: lower clarity and reduced evidence quality for the same pedagogical target.`;

    const normalizedObjective = asString(pedagogical.learning_objective, '')
        || `Understand the key concept presented in the prompt${promptSnippet ? `: ${promptSnippet}` : ''}.`;
    const normalizedCompetency = asString(pedagogical.competency, '')
        || 'Conceptual understanding and evidence-based reasoning';

    const sourceRefs = asArray(contentSelection.source_refs);
    const normalizedSourceRefs = sourceRefs.length > 0 ? sourceRefs : ['teacher_summary'];
    const limitations = asArray(uncertainty.limitations);

    return {
        id: asString(ex.id, `ex_auto_${Date.now()}_${index}`),
        reviewed: ex.reviewed === true,
        type,
        content: {
            prompt_text: promptText
        },
        interaction: normalizeInteractionByType(type, ex.interaction, promptText),
        scaffolding: {
            hint_1: asString(ex?.scaffolding?.hint_1, ''),
            explanation: asString(ex?.scaffolding?.explanation, ''),
            learn_more: asString(ex?.scaffolding?.learn_more, '')
        },
        dua: {
            label: asString(ex?.dua?.label, ''),
            adaptation_focus: asString(ex?.dua?.adaptation_focus, ''),
            xai_summary: asString(ex?.dua?.xai_summary, ''),
            core_statement: asString(ex?.dua?.core_statement, asString(pedagogical.learning_objective, '')),
            core_id: asString(ex?.dua?.core_id, `core_${index + 1}`),
            variant_index: Math.max(1, Math.min(3, Number(ex?.dua?.variant_index) || 1)),
            variant_total: Math.max(1, Math.min(3, Number(ex?.dua?.variant_total) || 1))
        },
        xai: {
            why_this_exercise: ensureMinText(xaiObj.why_this_exercise, 40, genericWhyExercise),
            pedagogical_alignment: {
                learning_objective: normalizedObjective,
                competency: normalizedCompetency,
                bloom_level: normalizeEnum(pedagogical.bloom_level, bloomAliases, 'understand'),
                difficulty_level: normalizeEnum(pedagogical.difficulty_level, difficultyAliases, 'medium')
            },
            content_selection: {
                why_this_content: ensureMinText(contentSelection.why_this_content, 40, genericWhyContent),
                source_refs: normalizedSourceRefs,
                alternatives_considered: asArray(contentSelection.alternatives_considered)
            },
            design_rationale: {
                why_this_type: asString(xaiObj?.design_rationale?.why_this_type, fallbackWhyThisType(type)),
                why_this_distractors: asString(xaiObj?.design_rationale?.why_this_distractors, fallbackWhyThisDistractors(type)),
                expected_time_sec: Number(xaiObj?.design_rationale?.expected_time_sec) || 60,
                cognitive_load: normalizeEnum(xaiObj?.design_rationale?.cognitive_load, cognitiveAliases, 'medium')
            },
            fairness_and_risk: {
                potential_biases: asArray(fairness.potential_biases),
                mitigations: asArray(fairness.mitigations)
            },
            human_oversight: {
                review_protocol: ensureMinText(oversight.review_protocol, 10, genericHumanReview),
                teacher_action_on_risk: ensureMinText(oversight.teacher_action_on_risk, 10, genericTeacherAction),
                override_policy: ensureMinText(oversight.override_policy, 10, genericOverride)
            },
            quality_of_explanation: {
                target_audience: normalizeEnum(quality.target_audience, audienceAliases, 'teacher'),
                clarity_level: normalizeEnum(quality.clarity_level, clarityAliases, 'medium'),
                actionable_feedback: ensureMinText(quality.actionable_feedback, 10, genericActionable),
                adaptation_notes: ensureMinText(quality.adaptation_notes, 10, genericAdaptation)
            },
            uncertainty: {
                confidence: Number(uncertainty.confidence) || 0,
                limitations: limitations.length > 0 ? limitations : ['Model output may require teacher contextual refinement.']
            },
            counterfactual: {
                condition: ensureMinText(counterfactual.condition, 10, genericCounterfactualCondition),
                expected_change: ensureMinText(counterfactual.expected_change, 10, genericCounterfactualExpected)
            },
            trace: {
                model: asString(trace.model, 'unknown-model'),
                prompt_id: asString(trace.prompt_id, 'xai_prompt_v2'),
                timestamp_utc: asString(trace.timestamp_utc, new Date().toISOString())
            }
        }
    };
}

export function normalizeXaiBundle(bundle) {
    const root = asObject(bundle);
    const exercises = Array.isArray(root.exercises) ? root.exercises : [];
    const language = asString(root?.resource_metadata?.language, 'es');
    const normalizedLanguage = language === 'en' ? 'en' : 'es';

    const sourceRefs = asArray(root?.generation_context?.source_material_refs)
        .map((item) => asString(item))
        .filter((item) => item.length >= 3);

    return {
        schema_version: asString(root.schema_version, 'xai-exercises/2.0.0'),
        resource_metadata: {
            title: asString(root?.resource_metadata?.title, normalizedLanguage === 'en' ? 'AI-generated XAI set' : 'Set XAI generado por IA'),
            topic: asString(root?.resource_metadata?.topic, normalizedLanguage === 'en' ? 'General topic' : 'Tema general'),
            grade_level: asString(root?.resource_metadata?.grade_level, normalizedLanguage === 'en' ? 'secondary' : 'secundaria'),
            language: normalizedLanguage
        },
        generation_context: {
            audience: asString(root?.generation_context?.audience, normalizedLanguage === 'en' ? 'Students' : 'Estudiantes'),
            pedagogical_goal: asString(
                root?.generation_context?.pedagogical_goal,
                normalizedLanguage === 'en'
                    ? 'Practice key concepts from the source material.'
                    : 'Practicar conceptos clave del material fuente.'
            ),
            constraints: asArray(root?.generation_context?.constraints),
            source_material_refs: sourceRefs.length > 0
                ? sourceRefs
                : [normalizedLanguage === 'en' ? 'Teacher summary' : 'Resumen docente'],
            dua_enabled: Boolean(root?.generation_context?.dua_enabled),
            dua_profile: normalizeDuaProfile(root?.generation_context?.dua_profile)
        },
        exercises: exercises.map((exercise, index) => normalizeExercise(exercise, index))
    };
}
