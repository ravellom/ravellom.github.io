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

export function exportTeacherProject(bundle) {
    const titlePart = sanitizeFilePart(bundle?.resource_metadata?.title, 'proyecto_docente');
    const payload = {
        ...bundle,
        export_meta: {
            kind: 'teacher_project',
            app: 'exe-builder-xai',
            exported_at: new Date().toISOString()
        }
    };

    downloadJsonFile(`xai_proyecto_docente_${titlePart}.json`, payload);
}

export function toVisorBundle(bundle) {
    const exercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];

    return {
        resource_metadata: {
            title: bundle?.resource_metadata?.title || 'Recurso XAI',
            topic: bundle?.resource_metadata?.topic || 'General',
            grade_level: bundle?.resource_metadata?.grade_level || '',
            language: bundle?.resource_metadata?.language || 'es'
        },
        exercises: exercises.map((exercise) => ({
            id: exercise.id,
            type: exercise.type,
            content: exercise.content || { prompt_text: '' },
            interaction: exercise.interaction || {},
            scaffolding: exercise.scaffolding || {
                hint_1: '',
                explanation: '',
                learn_more: ''
            }
        }))
    };
}

export function exportVisorPackage(bundle) {
    const titlePart = sanitizeFilePart(bundle?.resource_metadata?.title, 'paquete_visor');
    const visorBundle = toVisorBundle(bundle);
    downloadJsonFile(`xai_paquete_visor_${titlePart}.json`, visorBundle);
}
