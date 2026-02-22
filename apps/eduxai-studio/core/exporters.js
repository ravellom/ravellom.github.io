function downloadJsonFile(fileName, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }, 120);
}

function sanitizeFilePart(value, fallback = 'sin_titulo') {
    const text = String(value || '').trim().toLowerCase();
    const normalized = text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return normalized || fallback;
}

function groupExercisesByCore(exercises) {
    const groups = new Map();
    (Array.isArray(exercises) ? exercises : []).forEach((exercise, index) => {
        const coreId = String(exercise?.dua?.core_id || `core_${index + 1}`).trim();
        if (!groups.has(coreId)) {
            groups.set(coreId, []);
        }
        groups.get(coreId).push(exercise);
    });
    return groups;
}

function filterExercisesByManualSelection(exercises, manualSelection) {
    const groups = groupExercisesByCore(exercises);
    const result = [];
    groups.forEach((variants, coreId) => {
        const ordered = variants
            .slice()
            .sort((left, right) => (Number(left?.dua?.variant_index) || 999) - (Number(right?.dua?.variant_index) || 999));
        if (ordered.length <= 1) {
            result.push(ordered[0]);
            return;
        }

        let selected = null;
        if (manualSelection?.mode === 'label_all') {
            const label = String(manualSelection?.label || '').trim();
            selected = ordered.find((exercise) => String(exercise?.dua?.label || '').trim() === label) || null;
        } else if (manualSelection?.mode === 'core_map') {
            const wantedId = String(manualSelection?.byCore?.[coreId] || '').trim();
            selected = ordered.find((exercise) => String(exercise?.id || '').trim() === wantedId) || null;
        }

        result.push(selected || ordered[0]);
    });
    return result.filter(Boolean);
}

export function exportTeacherProject(bundle) {
    const titlePart = sanitizeFilePart(bundle?.resource_metadata?.title, 'proyecto_docente');
    const payload = {
        ...bundle,
        export_meta: {
            kind: 'teacher_project',
            app: 'eduxai-studio',
            exported_at: new Date().toISOString()
        }
    };

    downloadJsonFile(`xai_proyecto_docente_${titlePart}.json`, payload);
}

export function toVisorBundle(bundle) {
    const exercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];
    const grouped = groupExercisesByCore(exercises);
    const hasRealVariants = Array.from(grouped.values()).some((variants) => Array.isArray(variants) && variants.length > 1);
    const variantPolicy = hasRealVariants ? 'first_per_core' : 'single_fixed';

    const toVisorExercise = (exercise) => ({
        id: exercise.id,
        type: exercise.type,
        content: exercise.content || { prompt_text: '' },
        interaction: exercise.interaction || {},
        scaffolding: exercise.scaffolding || {
            hint_1: '',
            explanation: '',
            learn_more: ''
        }
    });

    const groupedByCore = new Map();
    exercises.forEach((exercise, index) => {
        const coreId = String(exercise?.dua?.core_id || `core_${index + 1}`).trim();
        const coreStatement = String(exercise?.dua?.core_statement || '').trim();
        if (!groupedByCore.has(coreId)) {
            groupedByCore.set(coreId, {
                core_id: coreId,
                core_statement: coreStatement,
                variants: []
            });
        }
        const group = groupedByCore.get(coreId);
        group.variants.push({
            ...toVisorExercise(exercise),
            dua: exercise?.dua && typeof exercise.dua === 'object'
                ? {
                    label: String(exercise.dua.label || '').trim(),
                    adaptation_focus: String(exercise.dua.adaptation_focus || '').trim(),
                    xai_summary: String(exercise.dua.xai_summary || '').trim(),
                    core_id: coreId,
                    core_statement: String(exercise.dua.core_statement || coreStatement).trim(),
                    variant_index: Number(exercise.dua.variant_index) || group.variants.length + 1,
                    variant_total: Number(exercise.dua.variant_total) || 1
                }
                : null
        });
    });
    const udlCores = Array.from(groupedByCore.values()).map((core) => ({
        ...core,
        variants: core.variants
            .slice()
            .sort((left, right) => {
                const l = Number(left?.dua?.variant_index) || 999;
                const r = Number(right?.dua?.variant_index) || 999;
                return l - r;
            })
            .map((variant, idx, all) => ({
                ...variant,
                dua: variant?.dua
                    ? {
                        ...variant.dua,
                        variant_index: Number(variant.dua.variant_index) || idx + 1,
                        variant_total: Number(variant.dua.variant_total) || all.length
                    }
                    : null
            }))
    }));

    return {
        package_meta: {
            kind: 'ejevisor_package',
            schema_version: '1.1.0',
            source_schema_version: String(bundle?.schema_version || 'xai-exercises/2.0.0'),
            exported_at: new Date().toISOString()
        },
        delivery: {
            udl_enabled: Boolean(bundle?.generation_context?.dua_enabled),
            variant_policy: variantPolicy
        },
        resource_metadata: {
            title: bundle?.resource_metadata?.title || 'Recurso XAI',
            topic: bundle?.resource_metadata?.topic || 'General',
            grade_level: bundle?.resource_metadata?.grade_level || '',
            language: bundle?.resource_metadata?.language || 'es'
        },
        udl_cores: udlCores,
        exercises: exercises.map((exercise) => toVisorExercise(exercise))
    };
}

export function exportVisorPackage(bundle, options = {}) {
    const titlePart = sanitizeFilePart(bundle?.resource_metadata?.title, 'paquete_visor');
    const policy = String(options?.variantPolicy || 'first_per_core').trim();
    const sourceExercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];
    const grouped = groupExercisesByCore(sourceExercises);
    const hasRealVariants = Array.from(grouped.values()).some((variants) => Array.isArray(variants) && variants.length > 1);
    const effectivePolicy = hasRealVariants ? policy : 'single_fixed';

    let effectiveExercises = sourceExercises;
    if (hasRealVariants && effectivePolicy === 'manual_select') {
        effectiveExercises = filterExercisesByManualSelection(sourceExercises, options?.manualSelection);
    }

    const visorBundle = toVisorBundle({
        ...bundle,
        exercises: effectiveExercises
    });
    visorBundle.delivery = {
        ...(visorBundle.delivery || {}),
        variant_policy: effectivePolicy || 'single_fixed'
    };
    downloadJsonFile(`xai_paquete_visor_${titlePart}.json`, visorBundle);
}

