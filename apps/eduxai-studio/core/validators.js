import { EXERCISE_TYPES } from './exercise-types.js';

export const BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
export const DIFFICULTY_LEVELS = ['low', 'medium', 'high'];
export const CLARITY_LEVELS = ['low', 'medium', 'high'];
export const TARGET_AUDIENCE_LEVELS = ['teacher', 'student', 'mixed'];
export const LANGUAGE_LEVELS = ['es', 'en'];
export const COGNITIVE_LOAD_LEVELS = ['low', 'medium', 'high'];
export const SCHEMA_VERSION = 'xai-exercises/2.0.0';
export const DUA_LABELS = ['DUA-Representacion', 'DUA-Accion/Expresion', 'DUA-Implicacion'];

function hasText(value, min = 1) {
    return typeof value === 'string' && value.trim().length >= min;
}

function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

function addError(errors, criticalErrors, message, isCritical = true) {
    errors.push(message);
    if (isCritical) {
        criticalErrors.push(message);
    }
}

function isValidDateTime(value) {
    if (!hasText(value)) {
        return false;
    }
    return Number.isFinite(Date.parse(value));
}

function isGenericOptionText(value) {
    return /^(opci[oó]n|option)\s*\d+$/i.test(String(value || '').trim());
}

function isGenericStepText(value) {
    return /^(paso|step)\s*\d+$/i.test(String(value || '').trim());
}

function requiredFieldError(t, field) {
    return t('validation.required', { field });
}

function tokenizeSemantic(text) {
    const stopwords = new Set([
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'about', 'what', 'when', 'where', 'which',
        'para', 'con', 'del', 'las', 'los', 'que', 'una', 'uno', 'por', 'como', 'esta', 'este', 'from', 'back',
        'function', 'python', 'value', 'values'
    ]);
    return new Set(
        String(text || '')
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúñü\s]/gi, ' ')
            .split(/\s+/)
            .map((token) => token.trim())
            .filter((token) => token.length >= 4 && !stopwords.has(token))
    );
}

function jaccardSimilarity(setA, setB) {
    const a = setA instanceof Set ? setA : new Set();
    const b = setB instanceof Set ? setB : new Set();
    if (a.size === 0 && b.size === 0) {
        return 1;
    }
    const intersection = [...a].filter((item) => b.has(item)).length;
    const union = new Set([...a, ...b]).size;
    return union > 0 ? intersection / union : 0;
}

function tokenIntersectionCount(setA, setB) {
    const a = setA instanceof Set ? setA : new Set();
    const b = setB instanceof Set ? setB : new Set();
    let count = 0;
    a.forEach((item) => {
        if (b.has(item)) {
            count += 1;
        }
    });
    return count;
}

export function validateXaiBundle(bundle, t) {
    const errors = [];
    const warnings = [];
    const criticalErrors = [];
    const root = isObject(bundle) ? bundle : {};

    const requiredTop = ['schema_version', 'resource_metadata', 'generation_context', 'exercises'];
    requiredTop.forEach((field) => {
        if (!(field in root)) {
            addError(errors, criticalErrors, requiredFieldError(t, field));
        }
    });

    if (hasText(root.schema_version) && root.schema_version !== SCHEMA_VERSION) {
        addError(errors, criticalErrors, requiredFieldError(t, `schema_version=${SCHEMA_VERSION}`));
    }

    const metadata = isObject(root.resource_metadata) ? root.resource_metadata : {};
    if (!isObject(root.resource_metadata)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'resource_metadata'));
    }
    if (!hasText(metadata.title, 3)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'resource_metadata.title'));
    }
    if (!hasText(metadata.topic, 2)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'resource_metadata.topic'));
    }
    if (!hasText(metadata.grade_level, 2)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'resource_metadata.grade_level'));
    }
    if (!hasText(metadata.language) || !LANGUAGE_LEVELS.includes(metadata.language)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'resource_metadata.language (es|en)'));
    }

    const context = isObject(root.generation_context) ? root.generation_context : {};
    if (!isObject(root.generation_context)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'generation_context'));
    }
    if (!hasText(context.audience, 4)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.audience'));
    }
    if (!hasText(context.pedagogical_goal, 8)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.pedagogical_goal'));
    }
    if (!Array.isArray(context.constraints)) {
        addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.constraints[]'));
    }
    if (!Array.isArray(context.source_material_refs) || context.source_material_refs.length < 1) {
        addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.source_material_refs[]'));
    } else if (context.source_material_refs.some((ref) => !hasText(ref, 3))) {
        addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.source_material_refs[] (min length 3)'));
    }

    if (context.dua_enabled === true) {
        if (!isObject(context.dua_profile)) {
            addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.dua_profile'));
        } else {
            if (!hasText(context.dua_profile.profile_level, 3)) {
                addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.dua_profile.profile_level'));
            }
            if (!Array.isArray(context.dua_profile.barriers)) {
                addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.dua_profile.barriers[]'));
            }
            if (!hasText(context.dua_profile.modality, 3)) {
                addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.dua_profile.modality'));
            }
            if (!hasText(context.dua_profile.purpose, 3)) {
                addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.dua_profile.purpose'));
            }
            if (!hasText(context.dua_profile.variation_type, 3)) {
                addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.dua_profile.variation_type'));
            }
            const variantCount = Number(context.dua_profile.variant_count);
            if (!Number.isInteger(variantCount) || variantCount < 1 || variantCount > 3) {
                addError(errors, criticalErrors, requiredFieldError(t, 'generation_context.dua_profile.variant_count (1..3)'));
            }
        }
    }

    if (!Array.isArray(root.exercises) || root.exercises.length === 0) {
        addError(errors, criticalErrors, t('validation.exercisesArray'));
    }

    const exercises = Array.isArray(root.exercises) ? root.exercises : [];

    exercises.forEach((exercise, index) => {
        const pos = index + 1;
        const xai = exercise?.xai;
        const interaction = isObject(exercise?.interaction) ? exercise.interaction : {};
        const exerciseType = String(exercise?.type || '').trim();

        if (!isObject(exercise)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}]`));
            return;
        }

        ['id', 'type', 'content', 'interaction', 'scaffolding', 'xai'].forEach((field) => {
            if (!(field in exercise)) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].${field}`));
            }
        });

        if (!hasText(exercise.id, 5)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].id`));
        }
        if (!EXERCISE_TYPES.includes(exerciseType)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].type (known type)`));
        }
        if (!hasText(exercise?.content?.prompt_text, 8)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].content.prompt_text`));
        }
        if (!isObject(exercise.interaction)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].interaction`));
        }
        if (!hasText(exercise?.scaffolding?.hint_1, 5)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].scaffolding.hint_1`));
        }
        if (!hasText(exercise?.scaffolding?.explanation, 10)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].scaffolding.explanation`));
        }
        if (!hasText(exercise?.scaffolding?.learn_more, 8)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].scaffolding.learn_more`));
        }

        if (context.dua_enabled === true) {
            const duaLabel = String(exercise?.dua?.label || '').trim();
            const duaSummary = String(exercise?.dua?.xai_summary || '').trim();
            const duaCoreStatement = String(exercise?.dua?.core_statement || '').trim();
            const duaCoreId = String(exercise?.dua?.core_id || '').trim();
            const duaVariantIndex = Number(exercise?.dua?.variant_index);
            const duaVariantTotal = Number(exercise?.dua?.variant_total);
            if (!DUA_LABELS.includes(duaLabel)) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].dua.label (${DUA_LABELS.join('|')})`));
            }
            if (!hasText(duaSummary, 10)) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].dua.xai_summary`));
            }
            if (!hasText(duaCoreStatement, 12)) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].dua.core_statement`));
            }
            if (!hasText(duaCoreId, 3)) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].dua.core_id`));
            }
            if (!Number.isInteger(duaVariantIndex) || duaVariantIndex < 1 || duaVariantIndex > 3) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].dua.variant_index (1..3)`));
            }
            if (!Number.isInteger(duaVariantTotal) || duaVariantTotal < 1 || duaVariantTotal > 3) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].dua.variant_total (1..3)`));
            } else if (Number.isInteger(duaVariantIndex) && duaVariantIndex > duaVariantTotal) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].dua.variant_index<=variant_total`));
            }
        }

        if (!xai || !isObject(xai)) {
            addError(errors, criticalErrors, t('validation.xaiMissing', { index: pos }));
            return;
        }

        const requiredXaiFields = [
            'why_this_exercise',
            'pedagogical_alignment',
            'content_selection',
            'design_rationale',
            'fairness_and_risk',
            'human_oversight',
            'quality_of_explanation',
            'uncertainty',
            'counterfactual',
            'trace'
        ];
        requiredXaiFields.forEach((field) => {
            if (!(field in xai)) {
                addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.${field}`));
            }
        });

        const objective = xai?.pedagogical_alignment?.learning_objective;
        const competency = xai?.pedagogical_alignment?.competency;
        const bloom = xai?.pedagogical_alignment?.bloom_level;
        const difficulty = xai?.pedagogical_alignment?.difficulty_level;
        if (!hasText(objective) || !hasText(competency) || !hasText(bloom) || !hasText(difficulty)) {
            addError(errors, criticalErrors, t('validation.pedagogicalMissing', { index: pos }));
        }
        if (hasText(bloom) && !BLOOM_LEVELS.includes(bloom)) {
            addError(errors, criticalErrors, t('validation.bloomOutOfCatalog', { index: pos }));
        }
        if (hasText(difficulty) && !DIFFICULTY_LEVELS.includes(difficulty)) {
            addError(errors, criticalErrors, t('validation.difficultyOutOfCatalog', { index: pos }));
        }

        const whyExercise = xai?.why_this_exercise;
        const whyContent = xai?.content_selection?.why_this_content;
        if (!hasText(whyExercise, 40) || !hasText(whyContent, 40)) {
            addError(errors, criticalErrors, t('validation.rationaleTooShort', { index: pos }));
        }

        const refs = xai?.content_selection?.source_refs;
        if (!Array.isArray(refs) || refs.length < 1) {
            addError(errors, criticalErrors, t('validation.sourceRefs', { index: pos }));
        }
        const alternatives = xai?.content_selection?.alternatives_considered;
        if (!Array.isArray(alternatives)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.content_selection.alternatives_considered[]`));
        }

        const designWhyType = xai?.design_rationale?.why_this_type;
        const designWhyDistractors = xai?.design_rationale?.why_this_distractors;
        const designExpectedTime = xai?.design_rationale?.expected_time_sec;
        const designCognitiveLoad = xai?.design_rationale?.cognitive_load;
        if (!hasText(designWhyType, 10)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.design_rationale.why_this_type`));
        }
        if (!hasText(designWhyDistractors, 10)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.design_rationale.why_this_distractors`));
        }
        if (!Number.isInteger(designExpectedTime) || designExpectedTime < 10) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.design_rationale.expected_time_sec>=10`));
        }
        if (!hasText(designCognitiveLoad) || !COGNITIVE_LOAD_LEVELS.includes(designCognitiveLoad)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.design_rationale.cognitive_load (low|medium|high)`));
        }

        const confidence = xai?.uncertainty?.confidence;
        if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
            addError(errors, criticalErrors, t('validation.confidenceRange', { index: pos }));
        }

        const limitations = xai?.uncertainty?.limitations;
        if (!Array.isArray(limitations) || limitations.length < 1) {
            addError(errors, criticalErrors, t('validation.limitationRequired', { index: pos }));
        }

        const cfCondition = xai?.counterfactual?.condition;
        const cfChange = xai?.counterfactual?.expected_change;
        if (!hasText(cfCondition) || !hasText(cfChange)) {
            addError(errors, criticalErrors, t('validation.counterfactualRequired', { index: pos }));
        }

        const risks = xai?.fairness_and_risk?.potential_biases;
        const mitigations = xai?.fairness_and_risk?.mitigations;
        const hasRisks = Array.isArray(risks) && risks.length > 0;
        const hasMitigations = Array.isArray(mitigations) && mitigations.length > 0;
        if (hasRisks && !hasMitigations) {
            addError(errors, criticalErrors, t('validation.fairnessMitigation', { index: pos }));
        }

        const reviewProtocol = xai?.human_oversight?.review_protocol;
        const teacherActionOnRisk = xai?.human_oversight?.teacher_action_on_risk;
        const overridePolicy = xai?.human_oversight?.override_policy;
        if (!hasText(reviewProtocol, 10) || !hasText(teacherActionOnRisk, 10) || !hasText(overridePolicy, 10)) {
            addError(errors, criticalErrors, t('validation.humanOversightRequired', { index: pos }));
        }

        const qualityAudience = xai?.quality_of_explanation?.target_audience;
        const qualityClarity = xai?.quality_of_explanation?.clarity_level;
        const qualityActionable = xai?.quality_of_explanation?.actionable_feedback;
        const qualityAdaptation = xai?.quality_of_explanation?.adaptation_notes;
        if (!hasText(qualityAudience, 4) || !hasText(qualityActionable, 10) || !hasText(qualityAdaptation, 10)) {
            addError(errors, criticalErrors, t('validation.qualityExplanationRequired', { index: pos }));
        }
        if (hasText(qualityAudience) && !TARGET_AUDIENCE_LEVELS.includes(qualityAudience)) {
            addError(errors, criticalErrors, t('validation.qualityAudienceOutOfCatalog', { index: pos }));
        }
        if (hasText(qualityClarity) && !CLARITY_LEVELS.includes(qualityClarity)) {
            addError(errors, criticalErrors, t('validation.qualityClarityOutOfCatalog', { index: pos }));
        }

        const traceModel = xai?.trace?.model;
        const tracePromptId = xai?.trace?.prompt_id;
        const traceTimestamp = xai?.trace?.timestamp_utc;
        if (!hasText(traceModel, 2)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.trace.model`));
        }
        if (!hasText(tracePromptId, 2)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.trace.prompt_id`));
        }
        if (!isValidDateTime(traceTimestamp)) {
            addError(errors, criticalErrors, requiredFieldError(t, `exercises[${pos}].xai.trace.timestamp_utc (date-time)`));
        }

        if (exerciseType === 'multiple_choice') {
            const options = Array.isArray(interaction.options) ? interaction.options : [];
            if (options.length > 0 && options.every((option) => isGenericOptionText(option?.text))) {
                warnings.push(t('validation.genericMcOptions', { index: pos }));
            }
        }

        if (exerciseType === 'ordering') {
            const sequence = Array.isArray(interaction.sequence) ? interaction.sequence : [];
            if (sequence.length > 0 && sequence.every((step) => isGenericStepText(step?.text))) {
                warnings.push(t('validation.genericOrderingSteps', { index: pos }));
            }
        }

        if (exerciseType === 'fill_gaps') {
            const template = String(interaction.template || '');
            if (/\[(answer|answers|respuesta|respuestas|blank|gap)\]/i.test(template)) {
                warnings.push(t('validation.fillGapsGenericToken', { index: pos }));
            }
        }
    });

    if (context.dua_enabled === true) {
        const groups = new Map();
        exercises.forEach((exercise, index) => {
            const coreId = String(exercise?.dua?.core_id || '').trim();
            if (!coreId) {
                return;
            }
            if (!groups.has(coreId)) {
                groups.set(coreId, []);
            }
            groups.get(coreId).push({ exercise, index: index + 1 });
        });

        groups.forEach((items, coreId) => {
            if (!Array.isArray(items) || items.length <= 1) {
                return;
            }
            const reference = items[0].exercise;
            const refObjective = String(reference?.xai?.pedagogical_alignment?.learning_objective || '').trim();
            const refBloom = String(reference?.xai?.pedagogical_alignment?.bloom_level || '').trim();
            const refDifficulty = String(reference?.xai?.pedagogical_alignment?.difficulty_level || '').trim();
            const refCoreStatement = String(reference?.dua?.core_statement || '').trim().toLowerCase();
            const refPromptTokens = tokenizeSemantic(reference?.content?.prompt_text || '');
            const refCoreTokens = tokenizeSemantic(reference?.dua?.core_statement || reference?.xai?.pedagogical_alignment?.learning_objective || '');

            items.slice(1).forEach(({ exercise, index }) => {
                const objective = String(exercise?.xai?.pedagogical_alignment?.learning_objective || '').trim();
                const bloom = String(exercise?.xai?.pedagogical_alignment?.bloom_level || '').trim();
                const difficulty = String(exercise?.xai?.pedagogical_alignment?.difficulty_level || '').trim();
                const coreStatement = String(exercise?.dua?.core_statement || '').trim().toLowerCase();
                if (objective !== refObjective || bloom !== refBloom || difficulty !== refDifficulty) {
                    addError(
                        errors,
                        criticalErrors,
                        requiredFieldError(t, `exercises[${index}].xai.pedagogical_alignment invariant mismatch in core ${coreId}`)
                    );
                }
                if (coreStatement !== refCoreStatement) {
                    addError(
                        errors,
                        criticalErrors,
                        requiredFieldError(t, `exercises[${index}].dua.core_statement invariant mismatch in core ${coreId}`)
                    );
                }
                const promptTokens = tokenizeSemantic(exercise?.content?.prompt_text || '');
                const similarity = jaccardSimilarity(refPromptTokens, promptTokens);
                const variantCoreTokens = tokenizeSemantic(exercise?.dua?.core_statement || exercise?.xai?.pedagogical_alignment?.learning_objective || '');
                const coreAlignment = Math.max(
                    jaccardSimilarity(refCoreTokens, promptTokens),
                    jaccardSimilarity(variantCoreTokens, promptTokens)
                );
                const directOverlap = tokenIntersectionCount(refPromptTokens, promptTokens);
                // Avoid false positives in UDL variants: style/context may change, but core concept must remain aligned.
                const hasEnoughLexicalSignal = refPromptTokens.size >= 5 && promptTokens.size >= 5;
                if (hasEnoughLexicalSignal && similarity < 0.05 && coreAlignment < 0.05 && directOverlap <= 1) {
                    warnings.push(t('validation.coreSemanticDrift', { index, coreId }));
                }
            });
        });
    }

    const criticalRate = exercises.length > 0 ? criticalErrors.length / exercises.length : 1;
    if (criticalRate > 0.2) {
        addError(errors, criticalErrors, t('validation.criticalThreshold'));
    }

    return {
        valid: criticalErrors.length === 0,
        errors,
        warnings,
        summary: {
            exerciseCount: exercises.length,
            criticalCount: criticalErrors.length
        }
    };
}
