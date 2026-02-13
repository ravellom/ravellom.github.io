export const BLOOM_LEVELS = ['recordar', 'comprender', 'aplicar', 'analizar', 'evaluar', 'crear'];
export const DIFFICULTY_LEVELS = ['bajo', 'medio', 'alto'];

function hasText(value, min = 1) {
    return typeof value === 'string' && value.trim().length >= min;
}

function addError(errors, criticalErrors, message, isCritical = true) {
    errors.push(message);
    if (isCritical) {
        criticalErrors.push(message);
    }
}

export function validateXaiBundle(bundle, t) {
    const errors = [];
    const warnings = [];
    const criticalErrors = [];
    const root = bundle && typeof bundle === 'object' && !Array.isArray(bundle) ? bundle : {};

    const requiredTop = ['schema_version', 'resource_metadata', 'generation_context', 'exercises'];
    requiredTop.forEach((field) => {
        if (!(field in root)) {
            addError(errors, criticalErrors, t('validation.required', { field }));
        }
    });

    if (!Array.isArray(root.exercises) || root.exercises.length === 0) {
        addError(errors, criticalErrors, t('validation.exercisesArray'));
    }

    const exercises = Array.isArray(root.exercises) ? root.exercises : [];

    exercises.forEach((exercise, index) => {
        const pos = index + 1;
        const xai = exercise?.xai;

        if (!xai || typeof xai !== 'object') {
            addError(errors, criticalErrors, t('validation.xaiMissing', { index: pos }));
            return;
        }

        const objective = xai?.pedagogical_alignment?.learning_objective;
        const competency = xai?.pedagogical_alignment?.competency;
        const bloom = xai?.pedagogical_alignment?.bloom_level;
        const difficulty = xai?.pedagogical_alignment?.difficulty_level;
        if (!hasText(objective) || !hasText(competency) || !hasText(bloom) || !hasText(difficulty)) {
            addError(errors, criticalErrors, t('validation.pedagogicalMissing', { index: pos }));
        }

        if (hasText(bloom) && !BLOOM_LEVELS.includes(bloom)) {
            warnings.push(t('validation.bloomOutOfCatalog', { index: pos }));
        }
        if (hasText(difficulty) && !DIFFICULTY_LEVELS.includes(difficulty)) {
            warnings.push(t('validation.difficultyOutOfCatalog', { index: pos }));
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
    });

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
