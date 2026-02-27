import { t } from '../i18n/index.js';
import { validateXaiBundle } from '../core/validators.js';
import { buildFillGapsAnswerMapping, normalizeOrderingEntries } from '../core/interaction-utils.js';

let selectedExerciseId = null;
let searchTerm = '';

function safeGet(obj, path, fallback = '') {
    return path.split('.').reduce((acc, key) => {
        if (!acc || typeof acc !== 'object' || Array.isArray(acc)) {
            return undefined;
        }
        return key in acc ? acc[key] : undefined;
    }, obj) ?? fallback;
}

function setByPath(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let cursor = obj;
    keys.forEach((key) => {
        if (!cursor || typeof cursor !== 'object' || !(key in cursor) || typeof cursor[key] !== 'object' || cursor[key] === null || Array.isArray(cursor[key])) {
            cursor[key] = {};
        }
        cursor = cursor[key];
    });
    cursor[lastKey] = value;
}

function createField(label, value, path, onChange, isTextarea = false) {
    const wrapper = document.createElement('div');
    const labelNode = document.createElement('label');
    labelNode.className = 'mini-label';
    labelNode.textContent = label;

    const input = isTextarea ? document.createElement('textarea') : document.createElement('input');
    input.className = isTextarea ? 'mini-textarea' : 'mini-input';
    input.value = value;
    input.addEventListener('change', () => onChange(path, input.value));

    wrapper.appendChild(labelNode);
    wrapper.appendChild(input);
    return wrapper;
}

function createSelectField(label, value, path, options, onChange) {
    const wrapper = document.createElement('div');
    const labelNode = document.createElement('label');
    labelNode.className = 'mini-label';
    labelNode.textContent = label;

    const select = document.createElement('select');
    select.className = 'mini-select';
    options.forEach((opt) => {
        const optionValue = typeof opt === 'string' ? opt : String(opt?.value ?? '');
        const optionLabel = typeof opt === 'string' ? opt : String(opt?.label ?? optionValue);
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionLabel;
        select.appendChild(option);
    });
    select.value = value;
    select.addEventListener('change', () => onChange(path, select.value));

    wrapper.appendChild(labelNode);
    wrapper.appendChild(select);
    return wrapper;
}

function createArrayField(label, arrayValue, path, onChange) {
    const value = Array.isArray(arrayValue) ? arrayValue.join('; ') : '';
    const field = createField(label, value, path, (fieldPath, rawValue) => {
        const parsed = rawValue.split(';').map((item) => item.trim()).filter(Boolean);
        onChange(fieldPath, parsed);
    }, true);
    field.classList.add('field-full');
    return field;
}

function iconByType(type) {
    const iconMap = {
        multiple_choice: 'ph-list-checks',
        true_false: 'ph-check-square',
        fill_gaps: 'ph-textbox',
        ordering: 'ph-sort-ascending',
        matching: 'ph-arrows-left-right',
        grouping: 'ph-folders',
        short_answer: 'ph-chat-text',
        hotspot: 'ph-cursor-click',
        slider: 'ph-sliders-horizontal'
    };
    return iconMap[type] || 'ph-note-pencil';
}

function isReviewed(exercise) {
    return Boolean(exercise?.reviewed === true);
}

function labelBloom(value) {
    const key = String(value || '').trim().toLowerCase();
    const map = {
        remember: 'ui.bloomRecordar',
        understand: 'ui.bloomComprender',
        apply: 'ui.bloomAplicar',
        analyze: 'ui.bloomAnalizar',
        evaluate: 'ui.bloomEvaluar',
        create: 'ui.bloomCrear'
    };
    return map[key] ? t(map[key]) : (value || '-');
}

function labelDifficulty(value) {
    const key = String(value || '').trim().toLowerCase();
    const map = {
        low: 'ui.difficultyBajo',
        medium: 'ui.difficultyMedio',
        high: 'ui.difficultyAlto'
    };
    return map[key] ? t(map[key]) : (value || '-');
}

function uniqueNormalized(values) {
    const source = Array.isArray(values) ? values : [];
    const normalized = source
        .map((value) => String(value || '').trim())
        .filter(Boolean);
    return [...new Set(normalized)];
}

function createInvariantsMatrix(selectedExercise, allExercises) {
    const coreId = getCoreId(selectedExercise);
    const variants = (Array.isArray(allExercises) ? allExercises : [])
        .filter((exercise) => getCoreId(exercise) === coreId);
    const sample = variants[0] || selectedExercise || {};

    const objectiveValues = uniqueNormalized(variants.map((exercise) => safeGet(exercise, 'xai.pedagogical_alignment.learning_objective', '')));
    const bloomValues = uniqueNormalized(variants.map((exercise) => safeGet(exercise, 'xai.pedagogical_alignment.bloom_level', '')));
    const difficultyValues = uniqueNormalized(variants.map((exercise) => safeGet(exercise, 'xai.pedagogical_alignment.difficulty_level', '')));
    const coreStatementValues = uniqueNormalized(variants.map((exercise) => safeGet(exercise, 'dua.core_statement', '')));

    const baseType = String(sample?.type || '').trim();
    const representationOrEngagement = variants.filter((exercise) => {
        const label = String(safeGet(exercise, 'dua.label', '')).trim();
        return label === 'DUA-Representacion' || label === 'DUA-Implicacion' || !label;
    });
    const repImpTypes = uniqueNormalized(representationOrEngagement.map((exercise) => exercise?.type));

    const rows = [
        {
            name: t('editor.matrixObjective'),
            locked: objectiveValues[0] || '-',
            allowed: t('editor.matrixAllowedNone'),
            stable: objectiveValues.length <= 1
        },
        {
            name: t('editor.matrixBloom'),
            locked: labelBloom(bloomValues[0] || '-'),
            allowed: t('editor.matrixAllowedNone'),
            stable: bloomValues.length <= 1
        },
        {
            name: t('editor.matrixDifficulty'),
            locked: labelDifficulty(difficultyValues[0] || '-'),
            allowed: t('editor.matrixAllowedNone'),
            stable: difficultyValues.length <= 1
        },
        {
            name: t('editor.matrixCoreStatement'),
            locked: coreStatementValues[0] || '-',
            allowed: t('editor.matrixAllowedNone'),
            stable: coreStatementValues.length <= 1
        },
        {
            name: t('editor.matrixType'),
            locked: baseType || '-',
            allowed: t('editor.matrixTypeAllowed'),
            stable: repImpTypes.length <= 1 && (!repImpTypes[0] || repImpTypes[0] === baseType)
        }
    ];

    const section = createSection(t('editor.sectionInvariantMatrix'), 'ph-table', 'section-invariant-matrix');
    const tableWrap = document.createElement('div');
    tableWrap.className = 'invariants-table-wrap';
    const table = document.createElement('table');
    table.className = 'invariants-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>${t('editor.matrixColumnInvariant')}</th>
                <th>${t('editor.matrixColumnLocked')}</th>
                <th>${t('editor.matrixColumnAllowed')}</th>
                <th>${t('editor.matrixColumnStatus')}</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    rows.forEach((row) => {
        const tr = document.createElement('tr');
        const statusClass = row.stable ? 'ok' : 'warn';
        tr.innerHTML = `
            <td>${row.name}</td>
            <td>${row.locked}</td>
            <td>${row.allowed}</td>
            <td><span class="matrix-status ${statusClass}">${row.stable ? t('editor.matrixStable') : t('editor.matrixDrift')}</span></td>
        `;
        tbody.appendChild(tr);
    });
    tableWrap.appendChild(table);
    section.appendChild(tableWrap);
    return section;
}

function getCoreId(exercise) {
    const coreId = String(safeGet(exercise, 'dua.core_id', '')).trim();
    return coreId || String(exercise?.id || '').trim();
}

function getVariantLabel(exercise) {
    const duaLabel = String(safeGet(exercise, 'dua.label', '')).trim();
    if (duaLabel) {
        const labelMap = {
            'DUA-Representacion': t('editor.variantRepresentation'),
            'DUA-Accion/Expresion': t('editor.variantActionExpression'),
            'DUA-Implicacion': t('editor.variantEngagement')
        };
        return labelMap[duaLabel] || duaLabel.replace('DUA-', '');
    }
    const variantIndex = Number(safeGet(exercise, 'dua.variant_index', 0));
    return Number.isInteger(variantIndex) && variantIndex > 0 ? `V${variantIndex}` : '';
}

function renderExerciseNav(elements, exercises, activeId, onSelect) {
    elements.exerciseNavList.innerHTML = '';
    elements.exerciseCountBadge.textContent = String(exercises.length);

    if (exercises.length === 0) {
        const li = document.createElement('li');
        li.className = 'exercise-nav-item';
        li.textContent = t('ui.noItems');
        elements.exerciseNavList.appendChild(li);
        return;
    }

    const indexed = exercises.map((exercise, index) => ({ exercise, index }));
    const groups = [];
    const groupMap = new Map();
    indexed.forEach((item) => {
        const coreId = getCoreId(item.exercise) || `core_${item.index + 1}`;
        if (!groupMap.has(coreId)) {
            const group = { coreId, items: [] };
            groupMap.set(coreId, group);
            groups.push(group);
        }
        groupMap.get(coreId).items.push(item);
    });

    groups.forEach((group, groupIndex) => {
        const coreHeader = document.createElement('li');
        coreHeader.className = 'exercise-core-header';
        coreHeader.innerHTML = `
            <span>${t('editor.coreLabel')} ${groupIndex + 1} (${group.items.length})</span>
            <button type="button" class="core-insights-link">${t('insights.tabLabel')}</button>
        `;
        const insightsLink = coreHeader.querySelector('.core-insights-link');
        insightsLink?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const details = document.getElementById('core-insights-details');
            if (!details) {
                return;
            }
            details.open = true;
            details.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        elements.exerciseNavList.appendChild(coreHeader);

        group.items.forEach(({ exercise, index }) => {
            const li = document.createElement('li');
            const reviewClass = isReviewed(exercise) ? 'reviewed' : 'pending';
            const variant = getVariantLabel(exercise);
            li.className = `exercise-nav-item ${exercise.id === activeId ? 'active' : ''} ${reviewClass}`.trim();
            li.innerHTML = `
                <i class="ph ${iconByType(exercise.type)}"></i>
                <div>
                    <div>${t('editor.exercise')} ${index + 1}</div>
                    <div class="type">${exercise.type || '-'}</div>
                    <div class="review-badge">${isReviewed(exercise) ? t('editor.reviewed') : t('editor.pendingReview')}</div>
                </div>
                ${variant ? `<span class="variant-pill">${variant}</span>` : ''}
            `;
            li.addEventListener('click', () => onSelect(exercise.id));
            elements.exerciseNavList.appendChild(li);
        });
    });
}

function renderVariantSwitcher(container, exercises, selectedExercise, onSelect) {
    const selectedCoreId = getCoreId(selectedExercise);
    const variants = (Array.isArray(exercises) ? exercises : []).filter((exercise) => getCoreId(exercise) === selectedCoreId);
    if (variants.length <= 1) {
        return;
    }

    const switcher = document.createElement('div');
    switcher.className = 'variant-switcher';
    variants.forEach((exercise, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `variant-chip ${exercise.id === selectedExercise.id ? 'active' : ''}`.trim();
        const variantLabel = getVariantLabel(exercise) || `V${index + 1}`;
        button.textContent = variantLabel;
        button.addEventListener('click', () => onSelect(exercise.id));
        switcher.appendChild(button);
    });
    container.appendChild(switcher);
}

function renderDetailHeader(container, exercise, index) {
    container.innerHTML = '';
    if (!exercise) {
        container.textContent = t('ui.noItems');
        return;
    }

    const title = document.createElement('h3');
    title.innerHTML = `<i class="ph ${iconByType(exercise.type)}"></i> ${t('editor.exercise')} ${index + 1}: ${exercise.id || '-'}`;

    const type = document.createElement('span');
    type.className = 'exercise-type';
    type.textContent = exercise.type || '-';

    const nav = document.createElement('div');
    nav.style.display = 'inline-flex';
    nav.style.gap = '6px';
    nav.className = 'exercise-detail-tools';
    const reviewed = isReviewed(exercise);
    nav.innerHTML = `
        <button type="button" id="btn-prev-ex" class="btn btn-outline" style="padding:4px 8px; font-size:0.78rem;">◀ ${t('editor.previous')}</button>
        <button type="button" id="btn-next-ex" class="btn btn-outline" style="padding:4px 8px; font-size:0.78rem;">${t('editor.next')} ▶</button>
        <button type="button" id="btn-toggle-reviewed" class="btn btn-outline" style="padding:4px 8px; font-size:0.78rem;">${reviewed ? t('editor.markPending') : t('editor.markReviewed')}</button>
        <button type="button" id="btn-delete-ex" class="btn btn-outline btn-danger-soft" style="padding:4px 8px; font-size:0.78rem;">${t('editor.deleteExercise')}</button>
    `;

    container.appendChild(title);
    container.appendChild(type);
    container.appendChild(nav);
}

function createSection(title, icon, className = '') {
    const section = document.createElement('section');
    section.className = `section-block ${className}`.trim();
    const heading = document.createElement('h4');
    heading.innerHTML = `<i class="ph ${icon}"></i> ${title}`;
    section.appendChild(heading);
    return section;
}

function ensureInteraction(exercise) {
    if (!exercise.interaction || typeof exercise.interaction !== 'object' || Array.isArray(exercise.interaction)) {
        exercise.interaction = {};
    }
    return exercise.interaction;
}

function buildFillGapsMapping(interaction) {
    return buildFillGapsAnswerMapping(interaction);
}

function resolveOrderingSequence(interaction) {
    return normalizeOrderingEntries(interaction);
}

function setupPreviewChoiceInteractions(shell) {
    const options = Array.from(shell.querySelectorAll('.options-grid .option-btn'));
    options.forEach((button) => {
        button.removeAttribute('onclick');
        button.addEventListener('click', () => {
            options.forEach((candidate) => candidate.classList.remove('selected'));
            button.classList.add('selected');
        });
    });
}

function setupPreviewReorderable(listSelector, itemSelector, shell) {
    const list = shell.querySelector(listSelector);
    if (!list) {
        return;
    }

    const items = Array.from(list.querySelectorAll(itemSelector));
    if (items.length === 0) {
        return;
    }

    let draggedItem = null;

    items.forEach((item) => {
        item.draggable = true;

        item.addEventListener('dragstart', () => {
            draggedItem = item;
            item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
        });

        item.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        item.addEventListener('drop', (event) => {
            event.preventDefault();
            if (!draggedItem || draggedItem === item) {
                return;
            }

            const rect = item.getBoundingClientRect();
            const dropAfter = event.clientY > rect.top + rect.height / 2;
            if (dropAfter) {
                item.after(draggedItem);
            } else {
                item.before(draggedItem);
            }
        });
    });
}

function setupPreviewFillGapsInteractions(shell) {
    const bank = shell.querySelector('#cloze-bank');
    const drops = Array.from(shell.querySelectorAll('.cloze-drop'));
    const bankTokens = Array.from(shell.querySelectorAll('#cloze-bank .cloze-token'));

    if (!bank || drops.length === 0 || bankTokens.length === 0) {
        return;
    }

    let selectedToken = null;

    bankTokens.forEach((token) => {
        token.draggable = true;
        token.addEventListener('dragstart', () => {
            selectedToken = token;
        });
        token.addEventListener('click', () => {
            bankTokens.forEach((candidate) => candidate.classList.remove('selected'));
            token.classList.add('selected');
            selectedToken = token;
        });
    });

    const attachTokenToDrop = (drop, token) => {
        if (!drop || !token) {
            return;
        }

        const existing = drop.querySelector('.cloze-token');
        if (existing) {
            bank.appendChild(existing);
            existing.classList.remove('selected');
        }

        const placeholder = drop.querySelector('.cloze-drop-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        token.classList.remove('selected');
        drop.appendChild(token);
        drop.classList.add('filled');
    };

    drops.forEach((drop) => {
        drop.addEventListener('dragover', (event) => {
            event.preventDefault();
            drop.classList.add('drag-over');
        });

        drop.addEventListener('dragleave', () => {
            drop.classList.remove('drag-over');
        });

        drop.addEventListener('drop', (event) => {
            event.preventDefault();
            drop.classList.remove('drag-over');
            attachTokenToDrop(drop, selectedToken);
        });

        drop.addEventListener('click', () => {
            if (selectedToken) {
                attachTokenToDrop(drop, selectedToken);
            }
        });
    });
}

function setupPreviewGroupingInteractions(shell) {
    const pool = shell.querySelector('#pool-list');
    const zones = Array.from(shell.querySelectorAll('.bucket-dropzone'));
    if (!pool || zones.length === 0) {
        return;
    }

    const targets = [pool, ...zones];
    let selectedItem = null;

    const bindItem = (item) => {
        if (!item || item.dataset.previewBound === '1') {
            return;
        }
        item.dataset.previewBound = '1';
        item.draggable = true;

        item.addEventListener('dragstart', () => {
            selectedItem = item;
            item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });

        item.addEventListener('click', () => {
            const alreadySelected = selectedItem === item;
            shell.querySelectorAll('.group-item.selected').forEach((node) => node.classList.remove('selected'));
            selectedItem = alreadySelected ? null : item;
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        });
    };

    shell.querySelectorAll('.group-item').forEach(bindItem);

    targets.forEach((target) => {
        target.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        target.addEventListener('drop', (event) => {
            event.preventDefault();
            if (!selectedItem) {
                return;
            }
            selectedItem.classList.remove('selected', 'dragging');
            target.appendChild(selectedItem);
            selectedItem = null;
        });

        target.addEventListener('click', () => {
            if (!selectedItem) {
                return;
            }
            selectedItem.classList.remove('selected', 'dragging');
            target.appendChild(selectedItem);
            selectedItem = null;
        });
    });
}

function hydratePreviewInteractions(shell, exercise) {
    const type = String(exercise?.type || '').trim();

    if (type === 'multiple_choice' || type === 'true_false') {
        setupPreviewChoiceInteractions(shell);
        return;
    }

    if (type === 'fill_gaps') {
        setupPreviewFillGapsInteractions(shell);
        return;
    }

    if (type === 'ordering') {
        setupPreviewReorderable('#sortable-list', '.sortable-item', shell);
        return;
    }

    if (type === 'matching') {
        setupPreviewReorderable('#matching-list', '.draggable-item', shell);
        return;
    }

    if (type === 'grouping') {
        setupPreviewGroupingInteractions(shell);
    }
}

function createInteractionEditor(selectedExercise, applyChange) {
    const interactionSection = createSection(t('editor.sectionInteraction'), 'ph-sliders-horizontal', 'section-interaction');
    const interaction = ensureInteraction(selectedExercise);
    const type = selectedExercise.type;

    if (type === 'multiple_choice' || type === 'true_false') {
        if (!Array.isArray(interaction.options) || interaction.options.length === 0) {
            interaction.options = type === 'true_false'
                ? [
                    { id: 'o1', text: t('editor.defaultTrue'), is_correct: true },
                    { id: 'o2', text: t('editor.defaultFalse'), is_correct: false }
                ]
                : [
                    { id: 'o1', text: `${t('editor.defaultOption')} 1`, is_correct: true },
                    { id: 'o2', text: `${t('editor.defaultOption')} 2`, is_correct: false }
                ];
        }

        const list = document.createElement('div');
        list.className = 'option-edit-list';

        interaction.options.forEach((option, index) => {
            const row = document.createElement('div');
            row.className = 'option-edit-row';

            const textInput = document.createElement('input');
            textInput.className = 'mini-input';
            textInput.value = option.text || '';
            textInput.placeholder = t('editor.optionText');
            textInput.addEventListener('change', () => {
                interaction.options[index].text = textInput.value;
                applyChange('interaction.options', [...interaction.options]);
            });

            const checkboxWrap = document.createElement('label');
            checkboxWrap.style.display = 'inline-flex';
            checkboxWrap.style.alignItems = 'center';
            checkboxWrap.style.gap = '6px';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = Boolean(option.is_correct);
            checkbox.addEventListener('change', () => {
                interaction.options = interaction.options.map((item, itemIndex) => ({
                    ...item,
                    is_correct: itemIndex === index ? checkbox.checked : false
                }));
                applyChange('interaction.options', [...interaction.options]);
            });
            checkboxWrap.appendChild(checkbox);
            checkboxWrap.append(t('editor.isCorrect'));

            const actions = document.createElement('div');
            actions.className = 'option-edit-actions';
            if (type !== 'true_false' && interaction.options.length > 2) {
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-outline';
                removeBtn.style.padding = '4px 8px';
                removeBtn.textContent = t('editor.remove');
                removeBtn.addEventListener('click', () => {
                    interaction.options.splice(index, 1);
                    applyChange('interaction.options', [...interaction.options]);
                });
                actions.appendChild(removeBtn);
            }

            row.appendChild(textInput);
            row.appendChild(checkboxWrap);
            row.appendChild(actions);
            list.appendChild(row);
        });

        interactionSection.appendChild(list);

        if (type !== 'true_false') {
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'btn btn-outline';
            addBtn.style.marginTop = '8px';
            addBtn.textContent = t('editor.addOption');
            addBtn.addEventListener('click', () => {
                const nextIndex = interaction.options.length + 1;
                interaction.options.push({ id: `o${nextIndex}`, text: `${t('editor.defaultOption')} ${nextIndex}`, is_correct: false });
                applyChange('interaction.options', [...interaction.options]);
            });
            interactionSection.appendChild(addBtn);
        }

        return interactionSection;
    }

    if (type === 'fill_gaps') {
        const grid = document.createElement('div');
        grid.className = 'exercise-grid';
        const templateField = createField(t('editor.template'), interaction.template || '', 'interaction.template', applyChange, true);
        templateField.classList.add('field-full');
        grid.appendChild(templateField);
        grid.appendChild(createField(t('editor.expectedAnswers'), Array.isArray(interaction.correct_answers) ? interaction.correct_answers.join('; ') : '', 'interaction.correct_answers', (_, raw) => {
            applyChange('interaction.correct_answers', raw.split(';').map((item) => item.trim()).filter(Boolean));
        }, true));
        grid.appendChild(createField(t('editor.distractors'), Array.isArray(interaction.distractors) ? interaction.distractors.join('; ') : '', 'interaction.distractors', (_, raw) => {
            applyChange('interaction.distractors', raw.split(';').map((item) => item.trim()).filter(Boolean));
        }, true));

        const mapping = buildFillGapsMapping(interaction);
        const mappingBox = document.createElement('div');
        mappingBox.className = 'fillgaps-map field-full';

        const mappingTitle = document.createElement('div');
        mappingTitle.className = 'fillgaps-map-title';
        mappingTitle.textContent = t('editor.fillGapsMapTitle');
        mappingBox.appendChild(mappingTitle);

        if (mapping.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'fillgaps-map-empty';
            empty.textContent = t('editor.fillGapsNoMap');
            mappingBox.appendChild(empty);
        } else {
            const list = document.createElement('ol');
            list.className = 'fillgaps-map-list';
            mapping.forEach((answer, index) => {
                const li = document.createElement('li');
                const resolved = String(answer || '').trim() || t('editor.fillGapsMissing');
                li.textContent = `${t('editor.fillGapsGapLabel')} ${index + 1}: ${resolved}`;
                list.appendChild(li);
            });
            mappingBox.appendChild(list);
        }

        grid.appendChild(mappingBox);
        interactionSection.appendChild(grid);
        return interactionSection;
    }

    if (type === 'ordering') {
        const resolvedSequence = resolveOrderingSequence(interaction);
        interaction.sequence = resolvedSequence.length > 0 ? resolvedSequence : [];

        const list = document.createElement('div');
        list.className = 'option-edit-list';

        if (interaction.sequence.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'mini-label';
            empty.textContent = t('editor.orderingNoSteps');
            list.appendChild(empty);
        }

        interaction.sequence.forEach((step, index) => {
            const row = document.createElement('div');
            row.className = 'option-edit-row ordering-edit-row';

            const textInput = document.createElement('input');
            textInput.className = 'mini-input';
            textInput.value = step.text || '';
            textInput.placeholder = t('editor.orderingStepPlaceholder');
            textInput.addEventListener('change', () => {
                interaction.sequence[index].text = textInput.value;
                applyChange('interaction.sequence', [...interaction.sequence]);
            });

            const orderInput = document.createElement('input');
            orderInput.type = 'number';
            orderInput.min = '1';
            orderInput.className = 'mini-input ordering-order-input';
            orderInput.value = String(Number(step.order) || (index + 1));
            orderInput.addEventListener('change', () => {
                const value = Number(orderInput.value);
                interaction.sequence[index].order = Number.isFinite(value) && value > 0 ? value : index + 1;
                applyChange('interaction.sequence', [...interaction.sequence]);
            });

            const actions = document.createElement('div');
            actions.className = 'option-edit-actions';
            if (interaction.sequence.length > 2) {
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-outline';
                removeBtn.style.padding = '4px 8px';
                removeBtn.textContent = t('editor.remove');
                removeBtn.addEventListener('click', () => {
                    interaction.sequence.splice(index, 1);
                    interaction.sequence = interaction.sequence.map((item, itemIndex) => ({
                        ...item,
                        order: itemIndex + 1
                    }));
                    applyChange('interaction.sequence', [...interaction.sequence]);
                });
                actions.appendChild(removeBtn);
            }

            row.appendChild(textInput);
            row.appendChild(orderInput);
            row.appendChild(actions);
            list.appendChild(row);
        });

        interactionSection.appendChild(list);

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-outline';
        addBtn.style.marginTop = '8px';
        addBtn.textContent = t('editor.addOrderingStep');
        addBtn.addEventListener('click', () => {
            const nextIndex = interaction.sequence.length + 1;
            interaction.sequence.push({ order: nextIndex, text: '' });
            applyChange('interaction.sequence', [...interaction.sequence]);
        });
        interactionSection.appendChild(addBtn);

        return interactionSection;
    }

    if (type === 'matching') {
        if (!Array.isArray(interaction.pairs)) {
            interaction.pairs = [];
        }

        const list = document.createElement('div');
        list.className = 'option-edit-list';

        if (interaction.pairs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'mini-label';
            empty.textContent = t('editor.matchingNoPairs');
            list.appendChild(empty);
        }

        interaction.pairs.forEach((pair, index) => {
            const row = document.createElement('div');
            row.className = 'option-edit-row';

            const leftInput = document.createElement('input');
            leftInput.className = 'mini-input';
            leftInput.value = pair?.left || '';
            leftInput.placeholder = t('editor.matchingLeft');
            leftInput.addEventListener('change', () => {
                interaction.pairs[index] = { ...interaction.pairs[index], left: leftInput.value };
                applyChange('interaction.pairs', [...interaction.pairs]);
            });

            const rightInput = document.createElement('input');
            rightInput.className = 'mini-input';
            rightInput.value = pair?.right || '';
            rightInput.placeholder = t('editor.matchingRight');
            rightInput.addEventListener('change', () => {
                interaction.pairs[index] = { ...interaction.pairs[index], right: rightInput.value };
                applyChange('interaction.pairs', [...interaction.pairs]);
            });

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-outline';
            removeBtn.style.padding = '4px 8px';
            removeBtn.textContent = t('editor.remove');
            removeBtn.addEventListener('click', () => {
                interaction.pairs.splice(index, 1);
                applyChange('interaction.pairs', [...interaction.pairs]);
            });

            row.appendChild(leftInput);
            row.appendChild(rightInput);
            row.appendChild(removeBtn);
            list.appendChild(row);
        });

        interactionSection.appendChild(list);

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-outline';
        addBtn.style.marginTop = '8px';
        addBtn.textContent = t('editor.addMatchingPair');
        addBtn.addEventListener('click', () => {
            interaction.pairs.push({ left: '', right: '' });
            applyChange('interaction.pairs', [...interaction.pairs]);
        });
        interactionSection.appendChild(addBtn);

        return interactionSection;
    }

    if (type === 'short_answer') {
        const grid = document.createElement('div');
        grid.className = 'exercise-grid';
        grid.appendChild(createField(t('editor.expectedAnswers'), Array.isArray(interaction.expected_answers) ? interaction.expected_answers.join('; ') : '', 'interaction.expected_answers', (_, raw) => {
            applyChange('interaction.expected_answers', raw.split(';').map((item) => item.trim()).filter(Boolean));
        }, true));
        interactionSection.appendChild(grid);
        return interactionSection;
    }

    if (type === 'grouping') {
        const grid = document.createElement('div');
        grid.className = 'exercise-grid';

        grid.appendChild(createField(
            t('editor.groupingCategories'),
            Array.isArray(interaction.categories) ? interaction.categories.join('; ') : '',
            'interaction.categories',
            (_, raw) => {
                const categories = raw.split(';').map((item) => item.trim()).filter(Boolean);
                applyChange('interaction.categories', categories);
            },
            true
        ));

        grid.appendChild(createField(
            t('editor.groupingItemsMap'),
            Array.isArray(interaction.items)
                ? interaction.items.map((item) => `${item?.text || ''} => ${item?.category || ''}`).join('\n')
                : '',
            'interaction.items',
            (_, raw) => {
                const parsed = raw
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                        const separator = line.includes('=>') ? '=>' : ':';
                        const [left, ...rest] = line.split(separator);
                        return {
                            text: String(left || '').trim(),
                            category: String(rest.join(separator) || '').trim()
                        };
                    })
                    .filter((item) => item.text && item.category);

                applyChange('interaction.items', parsed);
            },
            true
        ));

        interactionSection.appendChild(grid);
        return interactionSection;
    }

    const generic = createField(t('editor.interactionJson'), JSON.stringify(interaction, null, 2), 'interaction', (_, raw) => {
        try {
            const parsed = JSON.parse(raw);
            applyChange('interaction', parsed);
        } catch {
            // Ignore parse errors until user completes valid JSON
        }
    }, true);
    generic.classList.add('field-full');
    interactionSection.appendChild(generic);
    return interactionSection;
}

function createPreviewSection(exercise) {
    const previewSection = createSection(t('editor.sectionPreview'), 'ph-eye', 'section-preview');
    const shell = document.createElement('div');
    shell.className = 'preview-shell';

    if (window.RecuEduExerciseEngine && typeof window.RecuEduExerciseEngine.renderGameExercise === 'function') {
        shell.innerHTML = window.RecuEduExerciseEngine.renderGameExercise(exercise);
        hydratePreviewInteractions(shell, exercise);
    } else {
        shell.textContent = t('editor.previewUnavailable');
    }

    previewSection.appendChild(shell);
    return previewSection;
}

function buildExecutiveData(exercise) {
    const bloom = safeGet(exercise, 'xai.pedagogical_alignment.bloom_level', '-');
    const difficulty = safeGet(exercise, 'xai.pedagogical_alignment.difficulty_level', '-');
    const type = safeGet(exercise, 'type', '-');
    const risks = safeGet(exercise, 'xai.fairness_and_risk.potential_biases', []);
    const risksText = Array.isArray(risks) && risks.length > 0 ? risks.slice(0, 2).join(' | ') : t('ui.noItems');
    const confidenceRaw = Number(safeGet(exercise, 'xai.uncertainty.confidence', 0));
    const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0;
    const hasObjective = String(safeGet(exercise, 'xai.pedagogical_alignment.learning_objective', '')).trim().length > 0;
    const hasCompetency = String(safeGet(exercise, 'xai.pedagogical_alignment.competency', '')).trim().length > 0;
    const alignmentOk = hasObjective && hasCompetency && bloom !== '-' && difficulty !== '-';
    const hasHumanReview = String(safeGet(exercise, 'xai.human_oversight.review_protocol', '')).trim().length >= 10;

    return {
        bloom: labelBloom(bloom),
        difficulty: labelDifficulty(difficulty),
        type,
        risksText,
        confidence,
        alignmentStatus: alignmentOk ? t('editor.executiveCoherent') : t('editor.executiveReview'),
        complianceStatus: alignmentOk ? t('editor.executiveOk') : t('editor.executiveReview'),
        humanReviewRequired: hasHumanReview ? t('editor.executiveYes') : t('editor.executiveNo')
    };
}

function createExecutiveLayer(exercise) {
    const section = createSection(t('editor.executiveLayerTitle'), 'ph-gauge', 'section-executive');
    const data = buildExecutiveData(exercise);

    const grid = document.createElement('div');
    grid.className = 'executive-grid';
    grid.innerHTML = `
        <div class="executive-item"><span>${t('editor.executiveAlignment')}</span><strong>${data.alignmentStatus}</strong></div>
        <div class="executive-item"><span>${t('editor.executiveBloom')}</span><strong>${data.bloom || '-'}</strong></div>
        <div class="executive-item"><span>${t('editor.executiveType')}</span><strong>${data.type || '-'}</strong></div>
        <div class="executive-item"><span>${t('editor.executiveDifficulty')}</span><strong>${data.difficulty || '-'}</strong></div>
        <div class="executive-item"><span>${t('editor.executiveRisks')}</span><strong>${data.risksText}</strong></div>
        <div class="executive-item"><span>${t('editor.executiveCompliance')}</span><strong>${data.complianceStatus}</strong></div>
        <div class="executive-item"><span>${t('editor.executiveHumanReview')}</span><strong>${data.humanReviewRequired}</strong></div>
    `;

    const confidence = document.createElement('div');
    confidence.className = 'confidence-widget';
    confidence.innerHTML = `
        <span>${t('editor.executiveConfidence')}</span>
        <div class="confidence-track"><div class="confidence-fill" style="width:${Math.round(data.confidence * 100)}%"></div></div>
    `;

    section.appendChild(grid);
    section.appendChild(confidence);
    return section;
}

function createNarrativeLayer(exercise) {
    const section = createSection(t('editor.narrativeLayerTitle'), 'ph-text-indent', 'section-narrative');
    const bloom = labelBloom(safeGet(exercise, 'xai.pedagogical_alignment.bloom_level', '-'));
    const prompt = safeGet(exercise, 'content.prompt_text', '-');
    const risk = Array.isArray(safeGet(exercise, 'xai.fairness_and_risk.potential_biases', []))
        ? safeGet(exercise, 'xai.fairness_and_risk.potential_biases', [])[0]
        : '';
    const mitigation = Array.isArray(safeGet(exercise, 'xai.fairness_and_risk.mitigations', []))
        ? safeGet(exercise, 'xai.fairness_and_risk.mitigations', [])[0]
        : '';
    const explanation = safeGet(exercise, 'scaffolding.explanation', '');
    const confidence = Number(safeGet(exercise, 'xai.uncertainty.confidence', 0));
    const confidenceLabel = confidence >= 0.75
        ? t('editor.confidenceHigh')
        : (confidence >= 0.45 ? t('editor.confidenceMedium') : t('editor.confidenceLow'));

    const narrative = document.createElement('blockquote');
    narrative.className = 'xai-narrative';
    narrative.innerHTML = `
        ${t('editor.narrativeLine1', { prompt: prompt || '-', bloom: bloom || '-' })}<br>
        ${t('editor.narrativeLine2', { risk: risk || t('editor.notReported') })}<br>
        ${t('editor.narrativeLine3', { mitigation: mitigation || t('editor.notReported') })}<br>
        ${t('editor.narrativeLine4', { explanation: explanation || t('editor.notAvailable') })}<br>
        ${t('editor.narrativeLine5', { confidence: confidenceLabel })}
    `;
    section.appendChild(narrative);
    return section;
}

function createReadableLine(label, value) {
    const p = document.createElement('p');
    p.className = 'technical-readable-line';
    const clean = String(value ?? '').trim();
    p.innerHTML = `<strong>${label}:</strong> ${clean || t('editor.notAvailable')}`;
    return p;
}

function createReadableCard(title, hint, lines) {
    const card = document.createElement('article');
    card.className = 'summary-card technical-readable-card';

    const heading = document.createElement('h5');
    heading.className = 'technical-group-title';
    heading.textContent = title;
    card.appendChild(heading);

    const helper = document.createElement('p');
    helper.className = 'technical-group-hint';
    helper.textContent = hint;
    card.appendChild(helper);

    const box = document.createElement('div');
    box.className = 'technical-readable-box';
    lines.forEach((line) => box.appendChild(line));
    card.appendChild(box);
    return card;
}

function createTechnicalLayer(exercise) {
    const wrapper = document.createElement('section');
    wrapper.className = 'technical-details';

    const title = document.createElement('h4');
    title.className = 'technical-title';
    title.innerHTML = `<i class="ph ph-file-code"></i> ${t('editor.technicalLayerTitle')}`;
    wrapper.appendChild(title);

    const groups = document.createElement('div');
    groups.className = 'technical-groups';

    groups.appendChild(createReadableCard(
        t('editor.technicalGroupPedagogicalTitle'),
        t('editor.technicalGroupPedagogicalHint'),
        [
            createReadableLine(t('editor.learningObjective'), safeGet(exercise, 'xai.pedagogical_alignment.learning_objective', '')),
            createReadableLine(t('editor.competency'), safeGet(exercise, 'xai.pedagogical_alignment.competency', '')),
            createReadableLine(t('editor.bloom'), labelBloom(safeGet(exercise, 'xai.pedagogical_alignment.bloom_level', '-'))),
            createReadableLine(t('editor.difficulty'), labelDifficulty(safeGet(exercise, 'xai.pedagogical_alignment.difficulty_level', '-'))),
            createReadableLine(t('editor.coreStatement'), safeGet(exercise, 'dua.core_statement', '')),
            createReadableLine('Core ID', safeGet(exercise, 'dua.core_id', ''))
        ]
    ));

    const sourceRefs = Array.isArray(safeGet(exercise, 'xai.content_selection.source_refs', []))
        ? safeGet(exercise, 'xai.content_selection.source_refs', []).join('; ')
        : '';
    const risks = Array.isArray(safeGet(exercise, 'xai.fairness_and_risk.potential_biases', []))
        ? safeGet(exercise, 'xai.fairness_and_risk.potential_biases', []).join('; ')
        : '';
    const mitigations = Array.isArray(safeGet(exercise, 'xai.fairness_and_risk.mitigations', []))
        ? safeGet(exercise, 'xai.fairness_and_risk.mitigations', []).join('; ')
        : '';

    groups.appendChild(createReadableCard(
        t('editor.technicalGroupRationaleTitle'),
        t('editor.technicalGroupRationaleHint'),
        [
            createReadableLine(t('editor.whyExercise'), safeGet(exercise, 'xai.why_this_exercise', '')),
            createReadableLine(t('editor.whyContent'), safeGet(exercise, 'xai.content_selection.why_this_content', '')),
            createReadableLine(t('editor.sourceRefs'), sourceRefs),
            createReadableLine(t('editor.risks'), risks),
            createReadableLine(t('editor.mitigations'), mitigations),
            createReadableLine(t('editor.qualityTargetAudience'), safeGet(exercise, 'xai.quality_of_explanation.target_audience', '')),
            createReadableLine(t('editor.qualityClarityLevel'), safeGet(exercise, 'xai.quality_of_explanation.clarity_level', '')),
            createReadableLine(t('editor.qualityActionableFeedback'), safeGet(exercise, 'xai.quality_of_explanation.actionable_feedback', '')),
            createReadableLine(t('editor.qualityAdaptationNotes'), safeGet(exercise, 'xai.quality_of_explanation.adaptation_notes', ''))
        ]
    ));

    const limitations = Array.isArray(safeGet(exercise, 'xai.uncertainty.limitations', []))
        ? safeGet(exercise, 'xai.uncertainty.limitations', []).join('; ')
        : '';

    groups.appendChild(createReadableCard(
        t('editor.technicalGroupControlTitle'),
        t('editor.technicalGroupControlHint'),
        [
            createReadableLine(t('editor.counterfactualCondition'), safeGet(exercise, 'xai.counterfactual.condition', '')),
            createReadableLine(t('editor.counterfactualChange'), safeGet(exercise, 'xai.counterfactual.expected_change', '')),
            createReadableLine(t('editor.reviewProtocol'), safeGet(exercise, 'xai.human_oversight.review_protocol', '')),
            createReadableLine(t('editor.teacherActionOnRisk'), safeGet(exercise, 'xai.human_oversight.teacher_action_on_risk', '')),
            createReadableLine(t('editor.overridePolicy'), safeGet(exercise, 'xai.human_oversight.override_policy', '')),
            createReadableLine(t('editor.confidence'), safeGet(exercise, 'xai.uncertainty.confidence', '')),
            createReadableLine(t('editor.limitations'), limitations)
        ]
    ));

    wrapper.appendChild(groups);

    const traceBox = document.createElement('div');
    traceBox.className = 'technical-trace';
    const promptId = safeGet(exercise, 'xai.trace.prompt_id', '-');
    const model = safeGet(exercise, 'xai.trace.model', '-');
    const timestamp = safeGet(exercise, 'xai.trace.timestamp_utc', '-');
    traceBox.innerHTML = `
        <strong>${t('editor.technicalTraceTitle')}</strong>
        <p>model=${model} | prompt_id=${promptId} | timestamp=${timestamp}</p>
    `;
    wrapper.appendChild(traceBox);

    return wrapper;
}

function createValidationSection(dataBundle, selectedIndex) {
    const section = createSection(t('editor.tabValidation'), 'ph-check-circle', 'section-validation');
    const result = validateXaiBundle(dataBundle, t);
    const position = selectedIndex + 1;
    const isCurrentExerciseMessage = (message) => {
        const text = String(message || '');
        return text.includes(`exercises[${position}]`)
            || new RegExp(`\\bEjercicio\\s+${position}\\b`, 'i').test(text)
            || new RegExp(`\\bExercise\\s+${position}\\b`, 'i').test(text);
    };

    const localErrors = (Array.isArray(result.errors) ? result.errors : []).filter(isCurrentExerciseMessage);
    const localWarnings = (Array.isArray(result.warnings) ? result.warnings : []).filter(isCurrentExerciseMessage);
    const panel = document.createElement('div');
    panel.className = 'exercise-validation-panel';

    if (localErrors.length === 0 && localWarnings.length === 0) {
        const ok = document.createElement('p');
        ok.className = 'exercise-validation-ok';
        ok.textContent = t('editor.validationNoIssues');
        panel.appendChild(ok);
        section.appendChild(panel);
        return section;
    }

    const summary = document.createElement('p');
    summary.className = 'exercise-validation-summary';
    summary.textContent = t('editor.validationSummary', {
        errors: localErrors.length,
        warnings: localWarnings.length
    });
    panel.appendChild(summary);

    if (localErrors.length > 0) {
        const errorTitle = document.createElement('strong');
        errorTitle.textContent = t('editor.validationErrors');
        panel.appendChild(errorTitle);
        const errorList = document.createElement('ul');
        errorList.className = 'exercise-validation-list';
        localErrors.forEach((message) => {
            const li = document.createElement('li');
            li.textContent = String(message);
            errorList.appendChild(li);
        });
        panel.appendChild(errorList);
    }

    if (localWarnings.length > 0) {
        const warningTitle = document.createElement('strong');
        warningTitle.textContent = t('editor.validationWarnings');
        panel.appendChild(warningTitle);
        const warningList = document.createElement('ul');
        warningList.className = 'exercise-validation-list';
        localWarnings.forEach((message) => {
            const li = document.createElement('li');
            li.textContent = String(message);
            warningList.appendChild(li);
        });
        panel.appendChild(warningList);
    }

    section.appendChild(panel);
    return section;
}

function createExerciseTabs(tabEntries) {
    const root = document.createElement('section');
    root.className = 'exercise-tabs-shell';

    const nav = document.createElement('div');
    nav.className = 'exercise-tabs-nav';
    nav.setAttribute('role', 'tablist');

    const body = document.createElement('div');
    body.className = 'exercise-tabs-body';

    const buttons = [];
    const panels = [];

    const activate = (id) => {
        buttons.forEach((button) => {
            const active = button.dataset.target === id;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach((panel) => {
            const active = panel.id === id;
            panel.classList.toggle('active', active);
            panel.hidden = !active;
        });
    };

    tabEntries.forEach((entry, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'exercise-tab-btn';
        button.dataset.target = entry.id;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        button.textContent = entry.label;
        button.addEventListener('click', () => activate(entry.id));
        buttons.push(button);
        nav.appendChild(button);

        const panel = document.createElement('section');
        panel.className = 'exercise-tab-panel';
        panel.id = entry.id;
        panel.setAttribute('role', 'tabpanel');
        panel.hidden = index !== 0;
        if (entry.content) {
            panel.appendChild(entry.content);
        }
        panels.push(panel);
        body.appendChild(panel);
    });

    root.appendChild(nav);
    root.appendChild(body);
    return root;
}

export function renderExerciseEditor(elements, dataBundle, onDataChange) {
    elements.exerciseEditor.innerHTML = '';
    elements.exerciseDetailHeader.innerHTML = '';

    const exercises = Array.isArray(dataBundle?.exercises) ? dataBundle.exercises : [];

    if (elements.exerciseSearch && !elements.exerciseSearch.dataset.bound) {
        elements.exerciseSearch.addEventListener('input', () => {
            searchTerm = elements.exerciseSearch.value.trim().toLowerCase();
            onDataChange(true);
        });
        elements.exerciseSearch.dataset.bound = '1';
    }

    if (exercises.length === 0) {
        renderExerciseNav(elements, [], null, () => {});
        const empty = document.createElement('div');
        empty.className = 'summary-card';
        empty.textContent = t('ui.noItems');
        elements.exerciseEditor.appendChild(empty);
        return;
    }

    const filtered = exercises.filter((exercise) => {
        if (!searchTerm) {
            return true;
        }
        const prompt = safeGet(exercise, 'content.prompt_text', '').toLowerCase();
        const type = (exercise.type || '').toLowerCase();
        const id = (exercise.id || '').toLowerCase();
        return prompt.includes(searchTerm) || type.includes(searchTerm) || id.includes(searchTerm);
    });

    if (!selectedExerciseId || !filtered.some((ex) => ex.id === selectedExerciseId)) {
        selectedExerciseId = filtered[0]?.id || exercises[0]?.id;
    }

    renderExerciseNav(elements, filtered, selectedExerciseId, (id) => {
        selectedExerciseId = id;
        onDataChange(true);
    });

    const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId) || exercises[0];
    const selectedIndex = exercises.findIndex((exercise) => exercise.id === selectedExercise?.id);

    renderDetailHeader(elements.exerciseDetailHeader, selectedExercise, selectedIndex);
    renderVariantSwitcher(elements.exerciseDetailHeader, filtered, selectedExercise, (id) => {
        selectedExerciseId = id;
        onDataChange(true);
    });

    const filteredIndex = filtered.findIndex((ex) => ex.id === selectedExerciseId);
    const prevBtn = elements.exerciseDetailHeader.querySelector('#btn-prev-ex');
    const nextBtn = elements.exerciseDetailHeader.querySelector('#btn-next-ex');
    const toggleReviewedBtn = elements.exerciseDetailHeader.querySelector('#btn-toggle-reviewed');
    const deleteExerciseBtn = elements.exerciseDetailHeader.querySelector('#btn-delete-ex');
    if (prevBtn && nextBtn) {
        prevBtn.disabled = filteredIndex <= 0;
        nextBtn.disabled = filteredIndex < 0 || filteredIndex >= filtered.length - 1;
        prevBtn.addEventListener('click', () => {
            if (filteredIndex > 0) {
                selectedExerciseId = filtered[filteredIndex - 1].id;
                onDataChange(true);
            }
        });
        nextBtn.addEventListener('click', () => {
            if (filteredIndex >= 0 && filteredIndex < filtered.length - 1) {
                selectedExerciseId = filtered[filteredIndex + 1].id;
                onDataChange(true);
            }
        });
    }

    if (toggleReviewedBtn) {
        toggleReviewedBtn.addEventListener('click', () => {
            selectedExercise.reviewed = !isReviewed(selectedExercise);
            onDataChange(false);
        });
    }

    if (deleteExerciseBtn) {
        deleteExerciseBtn.addEventListener('click', () => {
            const confirmed = window.confirm(t('editor.deleteConfirm'));
            if (!confirmed) {
                return;
            }

            const deleteIndex = exercises.findIndex((exercise) => exercise.id === selectedExercise.id);
            if (deleteIndex < 0) {
                return;
            }

            exercises.splice(deleteIndex, 1);
            if (exercises.length === 0) {
                selectedExerciseId = null;
                onDataChange(false);
                return;
            }

            const nextIndex = Math.min(deleteIndex, exercises.length - 1);
            selectedExerciseId = exercises[nextIndex].id;
            onDataChange(false);
        });
    }

    if (!selectedExercise) {
        const empty = document.createElement('div');
        empty.className = 'summary-card';
        empty.textContent = t('editor.noMatch');
        elements.exerciseEditor.appendChild(empty);
        return;
    }

    const card = document.createElement('article');
    card.className = 'exercise-card';

    const applyChange = (path, value) => {
        setByPath(selectedExercise, path, value);
        onDataChange(false);
    };

    const gridCore = document.createElement('div');
    gridCore.className = 'exercise-grid';
    const promptField = createField(t('editor.prompt'), safeGet(selectedExercise, 'content.prompt_text', ''), 'content.prompt_text', applyChange, true);
    promptField.classList.add('field-full');
    gridCore.appendChild(promptField);
    const coreSection = createSection(t('editor.sectionCore'), 'ph-note-pencil', 'section-core');
    coreSection.appendChild(gridCore);

    const interactionSection = createInteractionEditor(selectedExercise, applyChange);
    const previewSection = createPreviewSection(selectedExercise);
    const exerciseDesignSection = createSection(t('editor.sectionExerciseDesign'), 'ph-pencil-ruler', 'section-exercise-design');
    const exerciseDesignStack = document.createElement('div');
    exerciseDesignStack.className = 'exercise-design-stack';
    exerciseDesignStack.appendChild(coreSection);
    exerciseDesignStack.appendChild(interactionSection);
    exerciseDesignSection.appendChild(exerciseDesignStack);

    const executiveLayer = createExecutiveLayer(selectedExercise);
    const narrativeLayer = createNarrativeLayer(selectedExercise);
    const invariantsMatrix = createInvariantsMatrix(selectedExercise, exercises);
    const summarySection = createSection(t('editor.tabSummary'), 'ph-compass-tool', 'section-summary');
    summarySection.appendChild(invariantsMatrix);
    summarySection.appendChild(executiveLayer);
    summarySection.appendChild(narrativeLayer);

    const technicalLayer = createTechnicalLayer(selectedExercise);
    const validationSection = createValidationSection(dataBundle, selectedIndex);

    card.appendChild(createExerciseTabs([
        { id: 'tab-design', label: t('editor.tabDesign'), content: exerciseDesignSection },
        { id: 'tab-preview', label: t('editor.tabPreview'), content: previewSection },
        { id: 'tab-summary', label: t('editor.tabSummary'), content: summarySection },
        { id: 'tab-technical', label: t('editor.tabTechnical'), content: technicalLayer },
        { id: 'tab-validation', label: t('editor.tabValidation'), content: validationSection }
    ]));

    elements.exerciseEditor.appendChild(card);
}
