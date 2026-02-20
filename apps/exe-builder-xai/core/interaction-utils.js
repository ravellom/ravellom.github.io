const ORDERING_SOURCE_KEYS = [
    'sequence',
    'steps',
    'items',
    'lines',
    'correct_order',
    'fragments',
    'blocks',
    'snippets',
    'parts',
    'elements',
    'chunks'
];

const GENERIC_GAP_TOKEN_REGEX = /^(answer|answers|respuesta|respuestas|blank|gap)$/i;

function normalizeOrderingItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item, index) => {
            if (typeof item === 'string') {
                const text = item.trim();
                return text ? { text, order: index + 1 } : null;
            }

            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                return null;
            }

            const text = String(item.text ?? item.label ?? item.value ?? '').trim();
            if (!text) {
                return null;
            }

            const rawOrder = Number(item.order ?? item.position ?? item.index);
            return {
                text,
                order: Number.isFinite(rawOrder) && rawOrder > 0 ? rawOrder : index + 1
            };
        })
        .filter(Boolean)
        .sort((left, right) => left.order - right.order)
        .map((item, index) => ({ text: item.text, order: index + 1 }));
}

export function normalizeOrderingEntries(source) {
    const src = source && typeof source === 'object' && !Array.isArray(source) ? source : {};

    for (const key of ORDERING_SOURCE_KEYS) {
        const normalized = normalizeOrderingItems(src[key]);
        if (normalized.length > 0) {
            return normalized;
        }
    }

    return [];
}

export function replaceGenericBracketTokens(template, answers) {
    const text = String(template || '');
    const sourceAnswers = Array.isArray(answers) ? answers : [];
    const parts = text.split(/(\[[^\]]+\])/g);
    let answerIndex = 0;

    return parts.map((part) => {
        if (!part || !part.startsWith('[') || !part.endsWith(']')) {
            return part;
        }

        const token = part.slice(1, -1).trim();
        if (!GENERIC_GAP_TOKEN_REGEX.test(token)) {
            return part;
        }

        const replacement = String(sourceAnswers[answerIndex] || '').trim();
        answerIndex += 1;
        return replacement ? `[${replacement}]` : part;
    }).join('');
}

export function buildFillGapsAnswerMapping(interaction) {
    const source = interaction && typeof interaction === 'object' && !Array.isArray(interaction) ? interaction : {};
    const template = String(source.template || '');
    const correctAnswers = Array.isArray(source.correct_answers) ? source.correct_answers : [];
    const parts = template.split(/(\[[^\]]+\]|\{_+\}|_{3,})/g);
    const mapping = [];
    let answerIndex = 0;

    parts.forEach((part) => {
        if (!part) {
            return;
        }

        if (part.startsWith('[') && part.endsWith(']')) {
            const token = part.slice(1, -1).trim();
            if (GENERIC_GAP_TOKEN_REGEX.test(token)) {
                mapping.push(String(correctAnswers[answerIndex] || '').trim());
                answerIndex += 1;
            } else {
                mapping.push(token);
            }
            return;
        }

        if (/^\{_+\}$/.test(part) || /^_{3,}$/.test(part)) {
            mapping.push(String(correctAnswers[answerIndex] || '').trim());
            answerIndex += 1;
        }
    });

    if (mapping.length === 0 && correctAnswers.length > 0) {
        return correctAnswers.map((answer) => String(answer || '').trim());
    }

    return mapping;
}

