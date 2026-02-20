import { t } from '../i18n/index.js';
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
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
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

    exercises.forEach((exercise, index) => {
        const li = document.createElement('li');
        const reviewClass = isReviewed(exercise) ? 'reviewed' : 'pending';
        li.className = `exercise-nav-item ${exercise.id === activeId ? 'active' : ''} ${reviewClass}`.trim();
        li.innerHTML = `
            <i class="ph ${iconByType(exercise.type)}"></i>
            <div>
                <div>${t('editor.exercise')} ${index + 1}</div>
                <div class="type">${exercise.type || '-'}</div>
                <div class="review-badge">${isReviewed(exercise) ? t('editor.reviewed') : t('editor.pendingReview')}</div>
            </div>
        `;
        li.addEventListener('click', () => onSelect(exercise.id));
        elements.exerciseNavList.appendChild(li);
    });
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

    const gridPed = document.createElement('div');
    gridPed.className = 'exercise-grid';
    gridPed.appendChild(createField(t('editor.learningObjective'), safeGet(selectedExercise, 'xai.pedagogical_alignment.learning_objective', ''), 'xai.pedagogical_alignment.learning_objective', applyChange));
    gridPed.appendChild(createField(t('editor.competency'), safeGet(selectedExercise, 'xai.pedagogical_alignment.competency', ''), 'xai.pedagogical_alignment.competency', applyChange));
    gridPed.appendChild(createSelectField(t('editor.bloom'), safeGet(selectedExercise, 'xai.pedagogical_alignment.bloom_level', 'analizar'), 'xai.pedagogical_alignment.bloom_level', ['recordar', 'comprender', 'aplicar', 'analizar', 'evaluar', 'crear'], applyChange));
    gridPed.appendChild(createSelectField(t('editor.difficulty'), safeGet(selectedExercise, 'xai.pedagogical_alignment.difficulty_level', 'medio'), 'xai.pedagogical_alignment.difficulty_level', ['bajo', 'medio', 'alto'], applyChange));
    const pedSection = createSection(t('editor.sectionPedagogical'), 'ph-graduation-cap', 'section-pedagogical');
    pedSection.appendChild(gridPed);

    const gridXai = document.createElement('div');
    gridXai.className = 'exercise-grid';
    const whyExField = createField(t('editor.whyExercise'), safeGet(selectedExercise, 'xai.why_this_exercise', ''), 'xai.why_this_exercise', applyChange, true);
    whyExField.classList.add('field-full');
    gridXai.appendChild(whyExField);
    const whyContentField = createField(t('editor.whyContent'), safeGet(selectedExercise, 'xai.content_selection.why_this_content', ''), 'xai.content_selection.why_this_content', applyChange, true);
    whyContentField.classList.add('field-full');
    gridXai.appendChild(whyContentField);
    gridXai.appendChild(createArrayField(t('editor.sourceRefs'), safeGet(selectedExercise, 'xai.content_selection.source_refs', []), 'xai.content_selection.source_refs', applyChange));
    gridXai.appendChild(createArrayField(t('editor.limitations'), safeGet(selectedExercise, 'xai.uncertainty.limitations', []), 'xai.uncertainty.limitations', applyChange));
    gridXai.appendChild(createArrayField(t('editor.risks'), safeGet(selectedExercise, 'xai.fairness_and_risk.potential_biases', []), 'xai.fairness_and_risk.potential_biases', applyChange));
    gridXai.appendChild(createArrayField(t('editor.mitigations'), safeGet(selectedExercise, 'xai.fairness_and_risk.mitigations', []), 'xai.fairness_and_risk.mitigations', applyChange));
    gridXai.appendChild(createField(t('editor.qualityTargetAudience'), safeGet(selectedExercise, 'xai.quality_of_explanation.target_audience', 'docente'), 'xai.quality_of_explanation.target_audience', applyChange));
    gridXai.appendChild(createSelectField(t('editor.qualityClarityLevel'), safeGet(selectedExercise, 'xai.quality_of_explanation.clarity_level', 'media'), 'xai.quality_of_explanation.clarity_level', ['baja', 'media', 'alta'], applyChange));
    const qualityActionableField = createField(t('editor.qualityActionableFeedback'), safeGet(selectedExercise, 'xai.quality_of_explanation.actionable_feedback', ''), 'xai.quality_of_explanation.actionable_feedback', applyChange, true);
    qualityActionableField.classList.add('field-full');
    gridXai.appendChild(qualityActionableField);
    const qualityAdaptationField = createField(t('editor.qualityAdaptationNotes'), safeGet(selectedExercise, 'xai.quality_of_explanation.adaptation_notes', ''), 'xai.quality_of_explanation.adaptation_notes', applyChange, true);
    qualityAdaptationField.classList.add('field-full');
    gridXai.appendChild(qualityAdaptationField);
    const xaiSection = createSection(t('editor.sectionXai'), 'ph-brain', 'section-xai');
    xaiSection.appendChild(gridXai);

    const gridControl = document.createElement('div');
    gridControl.className = 'exercise-grid';
    gridControl.appendChild(createField(t('editor.counterfactualCondition'), safeGet(selectedExercise, 'xai.counterfactual.condition', ''), 'xai.counterfactual.condition', applyChange, true));
    gridControl.appendChild(createField(t('editor.counterfactualChange'), safeGet(selectedExercise, 'xai.counterfactual.expected_change', ''), 'xai.counterfactual.expected_change', applyChange, true));
    const reviewProtocolField = createField(t('editor.reviewProtocol'), safeGet(selectedExercise, 'xai.human_oversight.review_protocol', ''), 'xai.human_oversight.review_protocol', applyChange, true);
    reviewProtocolField.classList.add('field-full');
    gridControl.appendChild(reviewProtocolField);
    const teacherRiskField = createField(t('editor.teacherActionOnRisk'), safeGet(selectedExercise, 'xai.human_oversight.teacher_action_on_risk', ''), 'xai.human_oversight.teacher_action_on_risk', applyChange, true);
    teacherRiskField.classList.add('field-full');
    gridControl.appendChild(teacherRiskField);
    const overridePolicyField = createField(t('editor.overridePolicy'), safeGet(selectedExercise, 'xai.human_oversight.override_policy', ''), 'xai.human_oversight.override_policy', applyChange, true);
    overridePolicyField.classList.add('field-full');
    gridControl.appendChild(overridePolicyField);
    gridControl.appendChild(createField(t('editor.confidence'), String(safeGet(selectedExercise, 'xai.uncertainty.confidence', 0.5)), 'xai.uncertainty.confidence', (path, rawValue) => {
        const num = Number(rawValue);
        applyChange(path, Number.isFinite(num) ? num : 0);
    }));
    const controlSection = createSection(t('editor.sectionControl'), 'ph-shield-check', 'section-control');
    controlSection.appendChild(gridControl);

    const interactionSection = createInteractionEditor(selectedExercise, applyChange);
    const previewSection = createPreviewSection(selectedExercise);

    card.appendChild(coreSection);
    card.appendChild(pedSection);
    card.appendChild(interactionSection);
    card.appendChild(xaiSection);
    card.appendChild(controlSection);
    card.appendChild(previewSection);

    elements.exerciseEditor.appendChild(card);
}
