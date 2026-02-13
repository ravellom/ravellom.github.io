import { t } from '../i18n/index.js';

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
        li.className = `exercise-nav-item ${exercise.id === activeId ? 'active' : ''}`;
        li.innerHTML = `
            <i class="ph ${iconByType(exercise.type)}"></i>
            <div>
                <div>${t('editor.exercise')} ${index + 1}</div>
                <div class="type">${exercise.type || '-'}</div>
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
    nav.innerHTML = `
        <button type="button" id="btn-prev-ex" class="btn btn-outline" style="padding:4px 8px; font-size:0.78rem;">◀ ${t('editor.previous')}</button>
        <button type="button" id="btn-next-ex" class="btn btn-outline" style="padding:4px 8px; font-size:0.78rem;">${t('editor.next')} ▶</button>
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

function createInteractionEditor(selectedExercise, applyChange) {
    const interactionSection = createSection(t('editor.sectionInteraction'), 'ph-sliders-horizontal', 'section-interaction');
    const interaction = ensureInteraction(selectedExercise);
    const type = selectedExercise.type;

    if (type === 'multiple_choice' || type === 'true_false') {
        if (!Array.isArray(interaction.options) || interaction.options.length === 0) {
            interaction.options = type === 'true_false'
                ? [
                    { id: 'o1', text: 'Verdadero', is_correct: true },
                    { id: 'o2', text: 'Falso', is_correct: false }
                ]
                : [
                    { id: 'o1', text: 'Opción 1', is_correct: true },
                    { id: 'o2', text: 'Opción 2', is_correct: false }
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
                interaction.options.push({ id: `o${nextIndex}`, text: `Opción ${nextIndex}`, is_correct: false });
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
        grid.appendChild(createField(t('editor.distractors'), Array.isArray(interaction.distractors) ? interaction.distractors.join('; ') : '', 'interaction.distractors', (_, raw) => {
            applyChange('interaction.distractors', raw.split(';').map((item) => item.trim()).filter(Boolean));
        }, true));
        interactionSection.appendChild(grid);
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

    if (window.RecuEduExerciseEngine && typeof window.RecuEduExerciseEngine.renderPreviewExercise === 'function') {
        shell.innerHTML = window.RecuEduExerciseEngine.renderPreviewExercise(exercise);
    } else {
        shell.textContent = 'Vista previa no disponible.';
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
    const xaiSection = createSection(t('editor.sectionXai'), 'ph-brain', 'section-xai');
    xaiSection.appendChild(gridXai);

    const gridControl = document.createElement('div');
    gridControl.className = 'exercise-grid';
    gridControl.appendChild(createField(t('editor.counterfactualCondition'), safeGet(selectedExercise, 'xai.counterfactual.condition', ''), 'xai.counterfactual.condition', applyChange, true));
    gridControl.appendChild(createField(t('editor.counterfactualChange'), safeGet(selectedExercise, 'xai.counterfactual.expected_change', ''), 'xai.counterfactual.expected_change', applyChange, true));
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
