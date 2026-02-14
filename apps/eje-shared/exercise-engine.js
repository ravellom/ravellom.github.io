(function() {
    'use strict';

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeHtmlWithLineBreaks(value) {
        return escapeHtml(value).replace(/\r?\n/g, '<br>');
    }

    function buildFillGapsModel(templateSource, correctAnswers) {
        const safeTemplate = String(templateSource || '');
        const answers = Array.isArray(correctAnswers) ? correctAnswers : [];
        const parts = safeTemplate.split(/(\[[^\]]+\]|\{_+\}|_{3,})/g);
        let answerIndex = 0;
        const segments = [];
        const usedAnswers = [];
        const isGenericToken = (value) => /^(answer|answers|respuesta|respuestas|blank|gap)$/i.test(String(value || '').trim());

        parts.forEach(part => {
            if (!part) {
                return;
            }

            if (part.startsWith('[') && part.endsWith(']')) {
                const token = part.slice(1, -1);
                const answerRaw = isGenericToken(token)
                    ? String(answers[answerIndex] ?? '')
                    : token;
                if (isGenericToken(token)) {
                    answerIndex += 1;
                }
                segments.push({ type: 'gap', answer: answerRaw });
                usedAnswers.push(answerRaw);
                return;
            }

            if (/^\{_+\}$/.test(part) || /^_{3,}$/.test(part)) {
                const answerRaw = String(answers[answerIndex] ?? '');
                answerIndex += 1;
                segments.push({ type: 'gap', answer: answerRaw });
                usedAnswers.push(answerRaw);
                return;
            }

            segments.push({ type: 'text', value: part });
        });

        const hasAtLeastOneGap = segments.some(segment => segment.type === 'gap');
        if (!hasAtLeastOneGap && answers.length > 0) {
            if (segments.length > 0) {
                segments.push({ type: 'text', value: '\n' });
            }
            answers.forEach(answer => {
                const normalized = String(answer ?? '').trim();
                if (!normalized) return;
                segments.push({ type: 'gap', answer: normalized });
                usedAnswers.push(normalized);
                segments.push({ type: 'text', value: ' ' });
            });
        }

        return {
            segments,
            usedAnswers: usedAnswers.map(item => String(item ?? '').trim()).filter(Boolean)
        };
    }

    function buildFillGapsWordBank(usedAnswers, distractors) {
        const base = Array.isArray(usedAnswers) ? usedAnswers : [];
        const extras = Array.isArray(distractors) ? distractors : [];
        return shuffleArray(
            [...base, ...extras]
                .map(item => String(item ?? '').trim())
                .filter(Boolean)
        );
    }

    function renderFillGapsGameMarkup(templateSource, correctAnswers, distractors) {
        const model = buildFillGapsModel(templateSource, correctAnswers);
        const bankWords = buildFillGapsWordBank(model.usedAnswers, distractors);
        let gapIndex = 0;

        const renderedTemplate = model.segments.map(segment => {
            if (segment.type === 'text') {
                return escapeHtmlWithLineBreaks(segment.value);
            }

            const answerEncoded = encodeURIComponent(String(segment.answer || ''));
            const currentIndex = gapIndex;
            gapIndex += 1;
            return `<span class="cloze-drop" style="display:inline-flex; align-items:center; justify-content:center; min-width:124px; min-height:44px; padding:2px 8px; margin:0 5px; border:2px dashed var(--primary); border-radius:10px; background:rgba(224,242,254,0.42); vertical-align:middle;" data-gap-index="${currentIndex}" data-ans-encoded="${answerEncoded}"><span class="cloze-drop-placeholder" style="color:var(--text-light); font-weight:700; letter-spacing:0.8px; opacity:0.75;">______</span></span>`;
        }).join('');

        const bankHtml = bankWords.length > 0
            ? `<div class="cloze-bank-wrap" style="margin-top:16px;"><p class="helper" style="margin-top:12px; margin-bottom:8px;">Arrastra cada palabra al espacio correcto.</p><div class="cloze-bank" id="cloze-bank" style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; min-height:64px; padding:14px; border:2px dashed #cbd5e1; border-radius:16px; background:rgba(255,255,255,0.82);">${bankWords.map((word, index) => `<button type="button" class="cloze-token" style="font-family:inherit; border:1px solid #cbd5e1; border-radius:999px; padding:8px 16px; font-weight:700; background:var(--bg-card); color:var(--text-main); cursor:grab; box-shadow:0 1px 3px rgba(0,0,0,0.08); font-size:1rem; line-height:1.2;" draggable="true" data-token-id="${index}" data-token-text-encoded="${encodeURIComponent(word)}">${escapeHtml(word)}</button>`).join('')}</div></div>`
            : '';

        return {
            templateHtml: renderedTemplate,
            bankHtml,
            usedAnswers: model.usedAnswers
        };
    }

    function shuffleArray(items) {
        const array = Array.isArray(items) ? [...items] : [];
        for (let index = array.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
        }
        return array;
    }

    function resolveOrderingSequence(interaction) {
        const source = interaction && typeof interaction === 'object' ? interaction : {};

        const normalizeEntries = (value) => {
            if (!Array.isArray(value)) {
                return [];
            }

            return value
                .map((item, index) => {
                    if (typeof item === 'string') {
                        const text = item.trim();
                        return text ? { text, order: index + 1 } : null;
                    }
                    if (!item || typeof item !== 'object') {
                        return null;
                    }
                    const text = String(item.text ?? item.label ?? item.value ?? '').trim();
                    if (!text) {
                        return null;
                    }
                    const orderRaw = Number(item.order ?? item.position ?? item.index);
                    return {
                        text,
                        order: Number.isFinite(orderRaw) && orderRaw > 0 ? orderRaw : index + 1
                    };
                })
                .filter(Boolean)
                .sort((left, right) => left.order - right.order)
                .map((item, index) => ({ text: item.text, order: index + 1 }));
        };

        const candidates = [
            source.sequence,
            source.steps,
            source.items,
            source.lines,
            source.correct_order
        ];

        for (const candidate of candidates) {
            const normalized = normalizeEntries(candidate);
            if (normalized.length > 0) {
                return normalized;
            }
        }

        return [];
    }

    function renderGameExercise(exercise) {
        if (!exercise || typeof exercise !== 'object') {
            return '<p style="text-align:center; color:#999;">No hay ejercicio para mostrar.</p>';
        }

        const content = exercise.content || {};
        const interaction = exercise.interaction || {};

        let html = `<div class="question-text">${escapeHtmlWithLineBreaks(content.prompt_text || '')}</div>`;

        if (content.media && content.media.url) {
            html += `<img src="${escapeHtml(content.media.url)}" style="max-width:100%; border-radius:12px; margin-bottom:20px;">`;
        }

        if (exercise.type === 'multiple_choice' || exercise.type === 'true_false') {
            const options = Array.isArray(interaction.options) ? interaction.options : [];
            html += `<div class="options-grid">${options.map((opt, index) => {
                const optionId = escapeHtml(String(opt.id ?? ''));
                return `<button class="option-btn" data-option-id="${optionId}" data-option-index="${index}" onclick="selectOption(this.dataset.optionId, this)">${escapeHtml(opt.text || '')}</button>`;
            }).join('')}</div>`;
        } else if (exercise.type === 'fill_gaps') {
            const template = String(interaction.template || content.prompt_text || '');
            const fillGapsMarkup = renderFillGapsGameMarkup(template, interaction.correct_answers, interaction.distractors);
            html += `<div class="cloze-text">${fillGapsMarkup.templateHtml}</div>${fillGapsMarkup.bankHtml}`;
        } else if (exercise.type === 'ordering') {
            const sequence = shuffleArray(resolveOrderingSequence(interaction));
            html += `<ul id="sortable-list" class="sortable-list">${sequence.map(item => `
                <li class="sortable-item" data-id="${Number(item.order) || 0}">
                    <span class="sortable-handle" aria-hidden="true"><i class="ph ph-dots-six-vertical"></i></span>
                    <span class="sortable-label">${escapeHtml(item.text || '')}</span>
                </li>
            `).join('')}</ul>`;
        } else if (exercise.type === 'matching') {
            const pairs = Array.isArray(interaction.pairs) ? interaction.pairs : [];
            const rightSide = shuffleArray(pairs);
            html += `
            <div class="matching-grid">
                <div class="static-list">
                    ${pairs.map(pair => `<div class="static-item">${escapeHtml(pair.left || '')}</div>`).join('')}
                </div>
                <div class="arrows-column">
                    ${pairs.map(() => `<i class="ph ph-arrow-right"></i>`).join('')}
                </div>
                <div id="matching-list" class="draggable-list">
                    ${rightSide.map(pair => `
                        <div class="draggable-item" data-match="${escapeHtml(pair.left || '')}">${escapeHtml(pair.right || '')}</div>
                    `).join('')}
                </div>
            </div>`;
        } else if (exercise.type === 'grouping') {
            const items = shuffleArray(Array.isArray(interaction.items) ? interaction.items : []);
            const categories = Array.isArray(interaction.categories) ? interaction.categories : [];
            html += `
            <div class="grouping-area">
                <div id="pool-list" class="items-pool">
                    ${items.map(item => `
                        <div class="group-item" data-cat="${escapeHtml(item.category || '')}">${escapeHtml(item.text || '')}</div>
                    `).join('')}
                </div>
                <div class="buckets-container">
                    ${categories.map(category => `
                        <div class="bucket">
                            <div class="bucket-header">${escapeHtml(category)}</div>
                            <div class="bucket-dropzone" data-category="${escapeHtml(category)}"></div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        } else if (exercise.type === 'short_answer') {
            const maxLength = Number(interaction.max_length) || 200;
            const expectedAnswers = Array.isArray(interaction.expected_answers) ? interaction.expected_answers : [];
            html += `
                <div class="short-answer">
                    <input id="short-answer-input" type="text" maxlength="${maxLength}" placeholder="Escribe tu respuesta" />
                    ${expectedAnswers.length ? `<p class="helper">Referencia: ${expectedAnswers.map(answer => escapeHtml(answer)).join(', ')}</p>` : ''}
                </div>
            `;
        } else if (exercise.type === 'hotspot') {
            const zones = Array.isArray(interaction.zones) ? interaction.zones : [];
            html += '<div class="hotspot-container">';
            if (interaction.image_url) {
                html += `<div class="hotspot-image" style="background-image:url('${escapeHtml(interaction.image_url)}')">`;
                zones.forEach((zone, index) => {
                    const top = Number(zone.y) || 0;
                    const left = Number(zone.x) || 0;
                    const width = Number(zone.width) || 20;
                    const height = Number(zone.height) || 20;
                    html += `<button class="hotspot-zone" data-zone-id="${index}" style="top:${top}%; left:${left}%; width:${width}%; height:${height}%;"></button>`;
                });
                html += '</div>';
                html += `<p class="helper">Pulsa sobre la zona correcta (${zones.length} zonas)</p>`;
            } else {
                html += '<p class="helper">No hay imagen configurada</p>';
            }
            html += '</div>';
        } else if (exercise.type === 'slider') {
            const min = Number(interaction.min ?? 0);
            const max = Number(interaction.max ?? 100);
            const target = Number(interaction.correct_value ?? 50);
            const initialValue = Math.floor((min + max) / 2);
            const tolerance = Number(interaction.tolerance ?? 5);
            html += `
                <div class="slider-wrap">
                    <input id="slider-input" type="range" min="${min}" max="${max}" value="${initialValue}" step="1">
                    <div class="slider-meta">
                        <span>${min}</span>
                        <span id="slider-value" style="font-weight: 700; font-size: 1.2rem; color: var(--primary);">${initialValue}</span>
                        <span>${max}</span>
                    </div>
                    <p class="helper">Objetivo: ${target} (tolerancia ±${tolerance})</p>
                </div>
            `;
        } else {
            html += `<p class="helper">Tipo no soportado: ${escapeHtml(exercise.type || 'desconocido')}</p>`;
        }

        return html;
    }

    function renderPreviewExercise(exercise) {
        if (!exercise || typeof exercise !== 'object') {
            return '<p style="color:#999; text-align:center; padding:40px;">⚠️ Ejercicio no disponible</p>';
        }

        const interaction = exercise.interaction || {};
        let html = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin-bottom: 20px;">
                    <h4 style="margin: 0; font-size: 1.3rem; font-weight: 600;">${escapeHtmlWithLineBreaks(exercise.content?.prompt_text || 'Sin enunciado')}</h4>
                </div>
        `;

        if (exercise.type === 'multiple_choice' || exercise.type === 'true_false') {
            const options = Array.isArray(interaction.options) ? interaction.options : [];
            html += '<div style="padding: 20px;">';
            html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Selecciona la respuesta correcta:</p>';
            html += `
                <style>
                    .preview-options { display: grid; gap: 10px; }
                    .preview-option {
                        display: block;
                        width: 100%;
                        text-align: left;
                        margin: 0;
                        padding: 15px;
                        background: #f8f9fa;
                        border: 2px solid #dee2e6;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                        font: inherit;
                    }
                    .preview-option:hover { border-color: #667eea; background: #f0f4ff; }
                    .preview-option.selected { border-color: #667eea; background: #e0e7ff; }
                </style>
            `;
            html += `<div class="preview-options">${options.map((option, index) => `
                <button type="button" class="preview-option" onclick="this.closest('.preview-options').querySelectorAll('.preview-option').forEach(btn => btn.classList.remove('selected')); this.classList.add('selected');">
                    <span style="font-weight: 500;">${String.fromCharCode(65 + index)})</span> ${escapeHtml(option.text || '')}
                </button>
            `).join('')}</div>`;
            html += '</div>';
        } else if (exercise.type === 'fill_gaps') {
            const template = String(interaction.template || 'Plantilla no disponible');
            const fillGapsMarkup = renderFillGapsGameMarkup(template, interaction.correct_answers, interaction.distractors);
            const renderedTemplate = fillGapsMarkup.templateHtml
                .replace(/class="cloze-drop"[^>]*>/g, 'style="display:inline-flex; align-items:center; justify-content:center; min-width:100px; border-bottom:2px solid #667eea; margin:0 5px;">')
                .replace(/<span class="cloze-drop-placeholder">______<\/span>/g, '______')
                .replace(/<button type="button" class="cloze-token"[^>]*>/g, '<span style="background:white; padding:8px 15px; border-radius:20px; border:1px solid #ffc107; font-weight:500; display:inline-block;">')
                .replace(/<\/button>/g, '</span>');
            html += '<div style="padding: 20px;">';
            html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Completa los espacios en blanco:</p>';
            html += `<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; line-height: 2; font-size: 1.05rem;">${renderedTemplate}</div>`;
            const previewWords = buildFillGapsWordBank(fillGapsMarkup.usedAnswers, interaction.distractors);
            if (previewWords.length > 0) {
                html += '<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">';
                html += '<p style="font-weight: 500; margin-bottom: 10px; color: #856404;">💡 Palabras disponibles:</p>';
                html += `<div style="display: flex; flex-wrap: wrap; gap: 10px;">${previewWords.map(word => `<span style="background: white; padding: 8px 15px; border-radius: 20px; border: 1px solid #ffc107; font-weight: 500;">${escapeHtml(word)}</span>`).join('')}</div>`;
                html += '</div>';
            }
            html += '</div>';
        } else if (exercise.type === 'ordering') {
            const sequence = resolveOrderingSequence(interaction);
            html += '<div style="padding: 20px;">';
            html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Ordena los elementos en la secuencia correcta:</p>';
            html += `${sequence.length === 0 ? '<p style="color:#999;">No hay pasos definidos para este ejercicio.</p>' : ''}`;
            html += `<div style="display: flex; flex-direction: column; gap: 10px;">${sequence.map(item => `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; display: flex; align-items: center; gap: 15px;">
                    <span style="background: #667eea; color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem;">
                        ${Number(item.order) || 0}
                    </span>
                    <span style="flex: 1; font-weight: 500;">${escapeHtml(item.text || '')}</span>
                </div>
            `).join('')}</div>`;
            html += '</div>';
        } else if (exercise.type === 'matching') {
            const pairs = Array.isArray(interaction.pairs) ? interaction.pairs : [];
            html += '<div style="padding: 20px;">';
            html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Relaciona cada concepto con su definición:</p>';
            html += `<div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center;">${pairs.map((pair, index) => `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; font-weight: 500; text-align: right; border: 2px solid #2196f3;">${escapeHtml(pair.left || '')}</div>
                <div style="width: 40px; height: 2px; background: linear-gradient(to right, #2196f3, #f44336); position: relative;">
                    <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 2px solid #667eea; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">${index + 1}</span>
                </div>
                <div style="background: #ffebee; padding: 15px; border-radius: 8px; font-weight: 500; border: 2px solid #f44336;">${escapeHtml(pair.right || '')}</div>
            `).join('')}</div>`;
            html += '</div>';
        } else if (exercise.type === 'grouping') {
            const categories = Array.isArray(interaction.categories) ? interaction.categories : [];
            const items = Array.isArray(interaction.items) ? interaction.items : [];
            const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec'];
            html += '<div style="padding: 20px;">';
            html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Clasifica los elementos en las categorías correctas:</p>';
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">';
            categories.forEach((category, index) => {
                html += `<div style="background: ${colors[index % colors.length]}; padding: 15px; border-radius: 10px; border: 2px dashed #667eea;">`;
                html += `<h5 style="margin: 0 0 10px 0; color: #667eea; font-weight: 600; text-align: center;">${escapeHtml(category)}</h5>`;
                html += '<div style="min-height: 100px; display: flex; flex-direction: column; gap: 8px;">';
                items.filter(item => item.category === category).forEach(item => {
                    html += `<div style="background: white; padding: 10px; border-radius: 5px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📌 ${escapeHtml(item.text || '')}</div>`;
                });
                html += '</div></div>';
            });
            html += '</div></div>';
        } else if (exercise.type === 'short_answer') {
            const expectedAnswers = Array.isArray(interaction.expected_answers) ? interaction.expected_answers : [];
            const maxLength = Number(interaction.max_length) || 200;
            html += '<div style="padding: 20px;">';
            html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Escribe una respuesta corta:</p>';
            html += `<input type="text" style="width:100%; padding:12px; border:2px solid #e0e7ff; border-radius:8px;" placeholder="Tu respuesta..." maxlength="${maxLength}">`;
            if (expectedAnswers.length > 0) {
                html += `<p style="margin-top:10px; color:#888; font-size:0.9rem;">Respuestas esperadas (referencia): ${expectedAnswers.map(answer => escapeHtml(answer)).join(', ')}</p>`;
            }
            html += '</div>';
        } else if (exercise.type === 'hotspot') {
            const zones = Array.isArray(interaction.zones) ? interaction.zones : [];
            html += '<div style="padding: 20px;">';
            html += '<p style="font-weight: 500; margin-bottom: 10px; color: #555;">Haz clic en las zonas correctas de la imagen:</p>';
            if (interaction.image_url) {
                html += `<img src="${escapeHtml(interaction.image_url)}" alt="Hotspot" style="max-width:100%; border-radius:8px; border:2px solid #e0e7ff;">`;
                html += `<p style="color:#888; font-size:0.9rem; margin-top:8px;">Zonas definidas: ${zones.length}</p>`;
            } else {
                html += '<p style="color:#999;">No hay imagen configurada.</p>';
            }
            html += '</div>';
        } else if (exercise.type === 'slider') {
            const min = Number(interaction.min ?? 0);
            const max = Number(interaction.max ?? 100);
            const target = Number(interaction.correct_value ?? 50);
            const tolerance = Number(interaction.tolerance ?? 5);
            html += '<div style="padding: 20px;">';
            html += `<p style="font-weight: 500; margin-bottom: 10px; color: #555;">Selecciona un valor entre ${min} y ${max}:</p>`;
            html += `<input type="range" min="${min}" max="${max}" value="${target}" style="width:100%;">`;
            html += `<p style="margin-top:8px; color:#888; font-size:0.9rem;">Valor objetivo: ${target} ± ${tolerance}</p>`;
            html += '</div>';
        } else {
            html += `<p style="color:#999; text-align:center; padding:20px;">Tipo no soportado: ${escapeHtml(exercise.type || 'desconocido')}</p>`;
        }

        const scaffolding = exercise.scaffolding || {};
        if (scaffolding.hint_1 || scaffolding.explanation || scaffolding.learn_more) {
            html += '<div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 10px;">';
            if (scaffolding.hint_1) {
                html += `<p style="margin: 0 0 10px 0;"><strong style="color: #d84315;">💡 Pista:</strong> ${escapeHtml(scaffolding.hint_1)}</p>`;
            }
            if (scaffolding.explanation) {
                html += `<p style="margin: 0 0 10px 0;"><strong style="color: #d84315;">📚 Explicación:</strong> ${escapeHtml(scaffolding.explanation)}</p>`;
            }
            if (scaffolding.learn_more) {
                html += `
                    <details style="margin: 10px 0 0 0; cursor: pointer;">
                        <summary style="font-weight: 600; color: #d84315; padding: 8px; background: rgba(255,255,255,0.3); border-radius: 5px;">
                            📖 Aprender más
                        </summary>
                        <div style="margin-top: 10px; padding: 15px; background: rgba(255,255,255,0.5); border-radius: 5px; line-height: 1.6;">
                            ${escapeHtml(scaffolding.learn_more)}
                        </div>
                    </details>
                `;
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    const engine = {
        renderGameExercise,
        renderPreviewExercise
    };

    if (typeof window !== 'undefined') {
        window.RecuEduExerciseEngine = engine;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = engine;
    }
})();
