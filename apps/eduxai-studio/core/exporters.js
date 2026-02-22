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

function downloadBlobFile(fileName, blob, mimeType = 'application/octet-stream') {
    const safeBlob = blob instanceof Blob ? blob : new Blob([blob], { type: mimeType });
    const url = URL.createObjectURL(safeBlob);
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

function pickExercisesForPolicy(exercises, variantPolicy, manualSelection) {
    const source = Array.isArray(exercises) ? exercises : [];
    const groups = groupExercisesByCore(source);
    const hasRealVariants = Array.from(groups.values()).some((variants) => Array.isArray(variants) && variants.length > 1);
    if (!hasRealVariants) {
        return source;
    }

    if (variantPolicy === 'manual_select') {
        return filterExercisesByManualSelection(source, manualSelection);
    }

    if (variantPolicy === 'random_per_core') {
        const selected = [];
        groups.forEach((variants) => {
            const ordered = variants
                .slice()
                .sort((left, right) => (Number(left?.dua?.variant_index) || 999) - (Number(right?.dua?.variant_index) || 999));
            if (ordered.length === 0) {
                return;
            }
            const pick = Math.floor(Math.random() * ordered.length);
            selected.push(ordered[pick]);
        });
        return selected;
    }

    const selected = [];
    groups.forEach((variants) => {
        const ordered = variants
            .slice()
            .sort((left, right) => (Number(left?.dua?.variant_index) || 999) - (Number(right?.dua?.variant_index) || 999));
        if (ordered[0]) {
            selected.push(ordered[0]);
        }
    });
    return selected;
}

function xmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function serializeJsonForInlineScript(value) {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

function buildScormManifest({ identifier, title, launchHref }) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${xmlEscape(identifier)}" version="1.0"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
    http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
    http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
    </metadata>
    <organizations default="ORG-1">
        <organization identifier="ORG-1">
            <title>${xmlEscape(title)}</title>
            <item identifier="ITEM-1" identifierref="RES-1" isvisible="true">
                <title>${xmlEscape(title)}</title>
            </item>
        </organization>
    </organizations>
    <resources>
        <resource identifier="RES-1" type="webcontent" adlcp:scormtype="sco" href="${xmlEscape(launchHref)}">
            <file href="${xmlEscape(launchHref)}" />
            <file href="package-bundle.json" />
            <file href="apps/eduxai-visor/index.html" />
            <file href="apps/eduxai-visor/visor.js" />
            <file href="apps/eduxai-visor/visor.css" />
            <file href="apps/eje-shared/exercise-engine.js" />
            <file href="assets/css/recuedu.css" />
            <file href="assets/css/recuedu-topbar.css" />
            <file href="assets/css/app-trust-bar.css" />
            <file href="assets/js/app-trust-bar.js" />
            <file href="assets/js/app-version.js" />
        </resource>
    </resources>
</manifest>`;
}

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`script_load_failed:${url}`));
        document.head.appendChild(script);
    });
}

async function ensureJsZip() {
    if (typeof window !== 'undefined' && window.JSZip) {
        return window.JSZip;
    }
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    if (typeof window === 'undefined' || !window.JSZip) {
        throw new Error('jszip_unavailable');
    }
    return window.JSZip;
}

async function fetchTextAsset(path) {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`asset_fetch_failed:${path}`);
    }
    return response.text();
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

    const effectiveExercises = pickExercisesForPolicy(sourceExercises, effectivePolicy, options?.manualSelection);

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

export async function exportScorm12Package(bundle, options = {}) {
    const JSZipRef = await ensureJsZip();
    const titlePart = sanitizeFilePart(bundle?.resource_metadata?.title, 'eduxai_scorm12');
    const policy = String(options?.variantPolicy || 'first_per_core').trim() || 'first_per_core';
    const sourceExercises = Array.isArray(bundle?.exercises) ? bundle.exercises : [];
    const selectedExercises = pickExercisesForPolicy(sourceExercises, policy, options?.manualSelection);
    const visorBundle = toVisorBundle({
        ...bundle,
        exercises: selectedExercises
    });
    visorBundle.delivery = {
        ...(visorBundle.delivery || {}),
        variant_policy: policy
    };

    const [
        visorIndexHtml,
        visorJs,
        visorCss,
        engineJs,
        recuEduCss,
        topbarCss,
        trustBarCss,
        trustBarJs,
        appVersionJs
    ] = await Promise.all([
        fetchTextAsset('../eduxai-visor/index.html'),
        fetchTextAsset('../eduxai-visor/visor.js'),
        fetchTextAsset('../eduxai-visor/visor.css'),
        fetchTextAsset('../eje-shared/exercise-engine.js'),
        fetchTextAsset('../../assets/css/recuedu.css'),
        fetchTextAsset('../../assets/css/recuedu-topbar.css'),
        fetchTextAsset('../../assets/css/app-trust-bar.css'),
        fetchTextAsset('../../assets/js/app-trust-bar.js'),
        fetchTextAsset('../../assets/js/app-version.js')
    ]);

    const inlineBundleScript = `<script>window.EDUXAI_EMBEDDED_BUNDLE=${serializeJsonForInlineScript(visorBundle)};</script>`;
    const packagedVisorIndexHtml = visorIndexHtml.includes('</body>')
        ? visorIndexHtml.replace('</body>', `${inlineBundleScript}\n</body>`)
        : `${visorIndexHtml}\n${inlineBundleScript}`;

    const launchHref = 'apps/eduxai-visor/index.html?autostart=1&scorm=1';
    const manifest = buildScormManifest({
        identifier: `EDUXAI_SCORM12_${Date.now()}`,
        title: String(bundle?.resource_metadata?.title || 'EduXAI SCORM Package'),
        launchHref
    });

    const zip = new JSZipRef();
    zip.file('imsmanifest.xml', manifest);
    zip.file('package-bundle.json', JSON.stringify(visorBundle, null, 2));
    zip.file('apps/eduxai-visor/index.html', packagedVisorIndexHtml);
    zip.file('apps/eduxai-visor/visor.js', visorJs);
    zip.file('apps/eduxai-visor/visor.css', visorCss);
    zip.file('apps/eduxai-visor/ejemplo.json', JSON.stringify(visorBundle, null, 2));
    zip.file('apps/eje-shared/exercise-engine.js', engineJs);
    zip.file('assets/css/recuedu.css', recuEduCss);
    zip.file('assets/css/recuedu-topbar.css', topbarCss);
    zip.file('assets/css/app-trust-bar.css', trustBarCss);
    zip.file('assets/js/app-trust-bar.js', trustBarJs);
    zip.file('assets/js/app-version.js', appVersionJs);

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    downloadBlobFile(`eduxai_scorm12_${titlePart}.zip`, blob, 'application/zip');
}

