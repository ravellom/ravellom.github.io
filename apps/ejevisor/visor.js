/* * VISOR.JS - Versión Corregida * */

let state = {
    exercises: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    currentAnswer: null,
    hasAnswered: false,
    graded: {},
    attempts: {},
    correctness: {},
    answerSnapshots: {},
    timeMs: {},
    sessionId: '',
    sessionStartedAt: 0,
    exerciseStartedAt: 0,
    loadedMeta: {
        delivery_policy: 'single_fixed',
        resource_metadata: {}
    }
};

let ui = {}; // Se inicializa en DOMContentLoaded

const SoundFX = {
    ctx: null,
    enabled: true,

    getCtx() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            this.ctx = new AudioCtx();
        }
        return this.ctx;
    },

    beep({ frequency = 440, type = 'sine', duration = 0.12, volume = 0.05, at = 0 }) {
        if (!this.enabled) return;
        const ctx = this.getCtx();
        if (!ctx) return;

        const when = ctx.currentTime + at;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, when);

        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(volume, when + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(when);
        oscillator.stop(when + duration + 0.02);
    },

    playSuccess() {
        this.beep({ frequency: 523.25, type: 'triangle', duration: 0.1, volume: 0.04, at: 0.00 });
        this.beep({ frequency: 659.25, type: 'triangle', duration: 0.12, volume: 0.05, at: 0.08 });
        this.beep({ frequency: 783.99, type: 'triangle', duration: 0.14, volume: 0.05, at: 0.16 });
    },

    playError() {
        this.beep({ frequency: 220, type: 'sawtooth', duration: 0.12, volume: 0.045, at: 0.00 });
        this.beep({ frequency: 174.61, type: 'sawtooth', duration: 0.16, volume: 0.04, at: 0.08 });
    }
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function resolveOrderingSequence(interaction) {
    const source = interaction && typeof interaction === 'object' ? interaction : {};

    const normalizeEntries = (value) => {
        if (!Array.isArray(value)) return [];
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
                const rawOrder = Number(item.order ?? item.position ?? item.index);
                return {
                    text,
                    order: Number.isFinite(rawOrder) && rawOrder > 0 ? rawOrder : index + 1
                };
            })
            .filter(Boolean)
            .sort((left, right) => left.order - right.order)
            .map((item, index) => ({ ...item, order: index + 1 }));
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

function resolveGroupingModel(interaction) {
    const source = interaction && typeof interaction === 'object' ? interaction : {};
    const groupsSource = Array.isArray(source.groups)
        ? source.groups
        : (Array.isArray(source.buckets) ? source.buckets : (Array.isArray(source.clusters) ? source.clusters : []));

    const idToLabel = new Map();
    const categories = [];
    const items = [];

    const registerCategory = (label) => {
        const normalized = String(label ?? '').trim();
        if (!normalized) {
            return null;
        }
        if (!categories.includes(normalized)) {
            categories.push(normalized);
        }
        return normalized;
    };

    const normalizeItemText = (item) => {
        if (typeof item === 'string') {
            return item.trim();
        }
        if (!item || typeof item !== 'object') {
            return '';
        }
        return String(item.text ?? item.label ?? item.value ?? item.term ?? '').trim();
    };

    if (Array.isArray(source.categories)) {
        source.categories.forEach((category) => {
            registerCategory(category);
        });
    }

    groupsSource.forEach((group, index) => {
        if (!group || typeof group !== 'object') {
            return;
        }

        const groupId = String(group.id ?? group.key ?? group.group_id ?? index).trim();
        const label = registerCategory(group.label ?? group.name ?? group.title ?? group.category ?? groupId);
        if (!label) {
            return;
        }
        if (groupId) {
            idToLabel.set(groupId, label);
        }

        const groupItems = Array.isArray(group.items)
            ? group.items
            : (Array.isArray(group.elements)
                ? group.elements
                : (Array.isArray(group.values) ? group.values : []));

        groupItems.forEach((entry) => {
            const text = normalizeItemText(entry);
            if (!text) {
                return;
            }
            items.push({ text, category: label });
        });
    });

    const sourceItems = Array.isArray(source.items)
        ? source.items
        : (Array.isArray(source.elements) ? source.elements : []);

    sourceItems.forEach((entry) => {
        const text = normalizeItemText(entry);
        if (!text) {
            return;
        }

        let category = '';
        if (entry && typeof entry === 'object') {
            const rawCategory = String(entry.category ?? entry.group ?? entry.group_id ?? entry.bucket ?? '').trim();
            category = idToLabel.get(rawCategory) || rawCategory;
        }

        const resolvedCategory = registerCategory(category);
        if (!resolvedCategory) {
            return;
        }

        items.push({ text, category: resolvedCategory });
    });

    const deduped = [];
    const seen = new Set();
    items.forEach((item) => {
        const key = `${item.text}::${item.category}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        deduped.push(item);
    });

    return {
        categories,
        items: deduped
    };
}

function resolveExercisesFromBundle(bundle) {
    const data = bundle && typeof bundle === 'object' ? bundle : {};
    const flatExercises = Array.isArray(data.exercises) ? data.exercises : [];
    const cores = Array.isArray(data.udl_cores) ? data.udl_cores : [];
    const policy = String(data?.delivery?.variant_policy || 'first_per_core').trim() || 'first_per_core';

    if (cores.length === 0 || policy === 'single_fixed') {
        return flatExercises;
    }

    const normalizeVariants = (core) => {
        const variants = Array.isArray(core?.variants) ? core.variants : [];
        return variants
            .filter((item) => item && typeof item === 'object')
            .sort((left, right) => {
                const l = Number(left?.dua?.variant_index) || 999;
                const r = Number(right?.dua?.variant_index) || 999;
                return l - r;
            });
    };

    if (policy === 'manual_select') {
        return cores.flatMap((core) => normalizeVariants(core));
    }

    if (policy === 'random_per_core') {
        return cores
            .map((core) => {
                const variants = normalizeVariants(core);
                if (variants.length === 0) return null;
                const pick = Math.floor(Math.random() * variants.length);
                return variants[pick];
            })
            .filter(Boolean);
    }

    return cores
        .map((core) => {
            const variants = normalizeVariants(core);
            return variants[0] || null;
        })
        .filter(Boolean);
}

function initGameFromBundle(bundle) {
    const metadata = bundle && typeof bundle === 'object' ? bundle : {};
    state.loadedMeta = {
        delivery_policy: String(metadata?.delivery?.variant_policy || 'single_fixed').trim() || 'single_fixed',
        resource_metadata: metadata?.resource_metadata && typeof metadata.resource_metadata === 'object'
            ? { ...metadata.resource_metadata }
            : {}
    };
    const exercises = resolveExercisesFromBundle(bundle);
    if (!Array.isArray(exercises) || exercises.length === 0) {
        alert('El archivo no contiene ejercicios validos');
        return;
    }
    initGame(exercises);
}

// ===== CARGAR EJEMPLO =====
async function loadExample() {
    try {
        const response = await fetch('ejemplo.json');
        if (response.ok) {
            const data = await response.json();
            initGameFromBundle(data);
        } else {
            alert('No se pudo cargar el ejemplo');
        }
    } catch (error) {
        alert('Error al cargar ejemplo: ' + error.message);
    }
}

// ===== FUNCIONES GLOBALES (usadas en onclick) =====
window.selectOption = (id, btn) => {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const resolved = (id !== undefined && id !== null && String(id).trim() !== '')
        ? String(id)
        : String(btn?.dataset?.optionIndex ?? '');
    state.currentAnswer = resolved;
    enableCheck();
};

function enableCheck() {
    if (ui.btnCheck) {
        ui.btnCheck.disabled = false;
        ui.btnCheck.style.opacity = "1";
    }
}

// ===== FUNCIONES DE CARGA =====

function loadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            initGameFromBundle(data);
        } catch (err) { alert('Error JSON: ' + err.message); }
    };
    reader.readAsText(file);
}

function initGame(exercises) {
    state.exercises = Array.isArray(exercises) ? exercises : [];
    state.currentIndex = 0;
    state.score = 0;
    state.streak = 0;
    state.graded = {};
    state.attempts = {};
    state.correctness = {};
    state.answerSnapshots = {};
    state.timeMs = {};
    state.sessionId = `session_${Date.now()}`;
    state.sessionStartedAt = Date.now();
    state.exerciseStartedAt = Date.now();
    updateHUD();
    showScreen('game');
    renderCurrentExercise();
}

// ===== PANTALLAS =====

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = ui.screens[screenName];
    if (target) target.classList.add('active');
}

function goToUpload() {
    state.exercises = [];
    state.currentIndex = 0;
    showScreen('upload');
}

// ===== HUD =====

function updateHUD() {
    if (ui.score) ui.score.textContent = state.score;
    if (ui.streak) ui.streak.textContent = state.streak;
    const total = state.exercises.length;
    const current = state.currentIndex + 1;
    if (ui.progressBar) ui.progressBar.style.width = `${(current / total) * 100}%`;
    const qDisplay = document.getElementById('question-display');
    if (qDisplay) qDisplay.textContent = `Pregunta ${current}/${total}`;
}

function initializeExerciseInteractions(ex) {
    if (ex.type === 'ordering') {
        if (typeof Sortable !== 'undefined') {
            new Sortable(document.getElementById('sortable-list'), { animation: 150, onEnd: enableCheck });
        }
        enableCheck(); 
    } 
    else if (ex.type === 'fill_gaps') {
        const drops = Array.from(document.querySelectorAll('.cloze-drop'));
        const bank = document.getElementById('cloze-bank');

        if (drops.length > 0 && bank) {
            let selectedToken = null;

            const setSelectedToken = (token) => {
                document.querySelectorAll('.cloze-token').forEach(item => item.classList.remove('selected'));
                selectedToken = token;
                if (selectedToken) selectedToken.classList.add('selected');
            };

            const ensurePlaceholder = (dropZone) => {
                if (!dropZone.querySelector('.cloze-token')) {
                    dropZone.innerHTML = '<span class="cloze-drop-placeholder">______</span>';
                    dropZone.classList.remove('filled');
                    delete dropZone.dataset.userValueEncoded;
                }
            };

            const updateFillGapsCheckState = () => {
                const allFilled = drops.every(zone => !!zone.querySelector('.cloze-token'));
                if (allFilled) enableCheck();
            };

            const attachTokenEvents = (token) => {
                token.addEventListener('dragstart', (event) => {
                    event.dataTransfer.setData('text/plain', token.dataset.tokenId || '');
                    event.dataTransfer.effectAllowed = 'move';
                    setSelectedToken(token);
                });

                token.addEventListener('click', () => {
                    setSelectedToken(token === selectedToken ? null : token);
                });
            };

            const moveTokenToDrop = (token, dropZone) => {
                const previousParent = token.parentElement;
                if (previousParent && previousParent.classList.contains('cloze-drop')) {
                    ensurePlaceholder(previousParent);
                }

                const existingToken = dropZone.querySelector('.cloze-token');
                if (existingToken && existingToken !== token) {
                    bank.appendChild(existingToken);
                }

                dropZone.innerHTML = '';
                dropZone.appendChild(token);
                dropZone.classList.add('filled');
                dropZone.dataset.userValueEncoded = token.dataset.tokenTextEncoded || '';
                setSelectedToken(null);
                updateFillGapsCheckState();
            };

            const sendTokenToBank = (token) => {
                const previousParent = token.parentElement;
                if (previousParent && previousParent.classList.contains('cloze-drop')) {
                    ensurePlaceholder(previousParent);
                }
                bank.appendChild(token);
                setSelectedToken(null);
            };

            Array.from(document.querySelectorAll('.cloze-token')).forEach(attachTokenEvents);

            drops.forEach(dropZone => {
                dropZone.addEventListener('dragover', (event) => {
                    event.preventDefault();
                    dropZone.classList.add('drag-over');
                });

                dropZone.addEventListener('dragleave', () => {
                    dropZone.classList.remove('drag-over');
                });

                dropZone.addEventListener('drop', (event) => {
                    event.preventDefault();
                    dropZone.classList.remove('drag-over');
                    const tokenId = event.dataTransfer.getData('text/plain');
                    const token = document.querySelector(`.cloze-token[data-token-id="${tokenId}"]`);
                    if (token) moveTokenToDrop(token, dropZone);
                });

                dropZone.addEventListener('click', () => {
                    if (selectedToken) moveTokenToDrop(selectedToken, dropZone);
                });
            });

            bank.addEventListener('dragover', (event) => {
                event.preventDefault();
            });

            bank.addEventListener('drop', (event) => {
                event.preventDefault();
                const tokenId = event.dataTransfer.getData('text/plain');
                const token = document.querySelector(`.cloze-token[data-token-id="${tokenId}"]`);
                if (token) sendTokenToBank(token);
            });

            updateFillGapsCheckState();
        } else {
            const inputs = document.querySelectorAll('.cloze-input');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    const allFilled = Array.from(inputs).every(i => i.value.trim() !== '');
                    if (allFilled) enableCheck();
                });
            });
        }
    }
    else if (ex.type === 'matching') {
        if (typeof Sortable !== 'undefined') {
            new Sortable(document.getElementById('matching-list'), { animation: 150, onEnd: enableCheck });
        }
        enableCheck();
    }
    else if (ex.type === 'grouping') {
        if (typeof Sortable !== 'undefined') {
            new Sortable(document.getElementById('pool-list'), { group: 'shared', animation: 150, onEnd: checkGroupingStatus });
            
            document.querySelectorAll('.bucket-dropzone').forEach(zone => {
                new Sortable(zone, { group: 'shared', animation: 150, onEnd: checkGroupingStatus });
            });
        }
    }
    else if (ex.type === 'short_answer') {
        const input = document.getElementById('short-answer-input');
        if (input) {
            input.addEventListener('input', () => {
                state.currentAnswer = input.value.trim();
                if (state.currentAnswer) enableCheck();
            });
        }
    }
    else if (ex.type === 'hotspot') {
        document.querySelectorAll('.hotspot-zone').forEach(zone => {
            zone.addEventListener('click', () => {
                document.querySelectorAll('.hotspot-zone').forEach(z => z.classList.remove('selected'));
                zone.classList.add('selected');
                state.currentAnswer = zone.dataset.zoneId;
                enableCheck();
            });
        });
    }
    else if (ex.type === 'slider') {
        const slider = document.getElementById('slider-input');
        const valueDisplay = document.getElementById('slider-value');
        if (slider && valueDisplay) {
            slider.addEventListener('input', () => {
                const currentValue = slider.value;
                valueDisplay.textContent = currentValue;
                state.currentAnswer = Number(currentValue);
                enableCheck();
            });
        }
    }
    
    if (ex.type === 'multiple_choice' || ex.type === 'true_false') {
        const options = document.querySelectorAll('.options-grid .option-btn');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                options.forEach(item => item.classList.remove('selected'));
                opt.classList.add('selected');

                const optionId = String(opt.dataset.optionId || '').trim();
                const optionIndex = String(opt.dataset.optionIndex || '').trim();
                state.currentAnswer = optionId || optionIndex;
                enableCheck();
            });
        });
    }

    if (ui.btnPrev) ui.btnPrev.disabled = state.currentIndex === 0;
}

// ===== RENDERIZADO DE EJERCICIOS =====

function renderCurrentExercise() {
    resetUI();
    const ex = state.exercises[state.currentIndex];
    if (!ex) {
        ui.container.innerHTML = '<p style="text-align:center; color:#999;">No hay ejercicio para mostrar.</p>';
        return;
    }

    if (window.RecuEduExerciseEngine && typeof window.RecuEduExerciseEngine.renderGameExercise === 'function') {
        ui.container.innerHTML = window.RecuEduExerciseEngine.renderGameExercise(ex);
        initializeExerciseInteractions(ex);
        return;
    }
    
    // Header Pregunta
    let html = `<div class="question-text">${ex.content.prompt_text}</div>`;
    if (ex.content.media?.url) {
        html += `<img src="${ex.content.media.url}" style="max-width:100%; border-radius:12px; margin-bottom:20px;">`;
    }

    // --- RENDERIZADO POR TIPO ---

    // 1 & 2. MULTIPLE CHOICE / TRUE FALSE
    if (ex.type === 'multiple_choice' || ex.type === 'true_false') {
        html += `<div class="options-grid">
            ${ex.interaction.options.map(opt => `
                <button class="option-btn" onclick="selectOption('${opt.id}', this)">${opt.text}</button>
            `).join('')}
        </div>`;
    } 
    
    // 3. FILL GAPS
    else if (ex.type === 'fill_gaps') {
        const templateSource = String(ex.interaction.template || ex.content?.prompt_text || '');
        const correctAnswers = Array.isArray(ex.interaction.correct_answers) ? ex.interaction.correct_answers : [];
        const distractors = Array.isArray(ex.interaction.distractors) ? ex.interaction.distractors : [];
        const parts = templateSource.split(/(\[[^\]]+\]|\{_+\}|_{3,})/g);
        const wordsPool = [];
        let answerIndex = 0;
        let gapIndex = 0;
        let foundGap = false;

        html += `<div class="cloze-text">
            ${parts.map(part => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    const ans = part.slice(1, -1);
                    const ansEncoded = encodeURIComponent(ans);
                    wordsPool.push(ans);
                    const slot = `<span class="cloze-drop" style="display:inline-flex; align-items:center; justify-content:center; min-width:124px; min-height:44px; padding:2px 8px; margin:0 5px; border:2px dashed var(--primary); border-radius:10px; background:rgba(224,242,254,0.42); vertical-align:middle;" data-gap-index="${gapIndex}" data-ans-encoded="${ansEncoded}"><span class="cloze-drop-placeholder" style="color:var(--text-light); font-weight:700; letter-spacing:0.8px; opacity:0.75;">______</span></span>`;
                    foundGap = true;
                    gapIndex += 1;
                    return slot;
                }
                if (/^\{_+\}$/.test(part) || /^_{3,}$/.test(part)) {
                    const ans = String(correctAnswers[answerIndex] ?? '');
                    answerIndex += 1;
                    const ansEncoded = encodeURIComponent(ans);
                    if (ans) wordsPool.push(ans);
                    const slot = `<span class="cloze-drop" style="display:inline-flex; align-items:center; justify-content:center; min-width:124px; min-height:44px; padding:2px 8px; margin:0 5px; border:2px dashed var(--primary); border-radius:10px; background:rgba(224,242,254,0.42); vertical-align:middle;" data-gap-index="${gapIndex}" data-ans-encoded="${ansEncoded}"><span class="cloze-drop-placeholder" style="color:var(--text-light); font-weight:700; letter-spacing:0.8px; opacity:0.75;">______</span></span>`;
                    foundGap = true;
                    gapIndex += 1;
                    return slot;
                }
                return part;
            }).join('')}
        </div>`;

        if (!foundGap && correctAnswers.length > 0) {
            html += `<div class="cloze-text" style="margin-top:8px;">${correctAnswers.map((ans) => {
                const ansEncoded = encodeURIComponent(String(ans || '').trim());
                return `<span class="cloze-drop" style="display:inline-flex; align-items:center; justify-content:center; min-width:124px; min-height:44px; padding:2px 8px; margin:0 5px; border:2px dashed var(--primary); border-radius:10px; background:rgba(224,242,254,0.42); vertical-align:middle;" data-gap-index="${gapIndex++}" data-ans-encoded="${ansEncoded}"><span class="cloze-drop-placeholder" style="color:var(--text-light); font-weight:700; letter-spacing:0.8px; opacity:0.75;">______</span></span>`;
            }).join('')}</div>`;
            wordsPool.push(...correctAnswers);
        }

        const bankWords = [...wordsPool, ...distractors]
            .map(word => String(word || '').trim())
            .filter(Boolean)
            .sort(() => Math.random() - 0.5);

        if (bankWords.length > 0) {
            html += `<div class="cloze-bank-wrap" style="margin-top:16px;"><p class="helper">Arrastra cada palabra al espacio correcto.</p><div id="cloze-bank" class="cloze-bank" style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; min-height:64px; padding:14px; border:2px dashed #cbd5e1; border-radius:16px; background:rgba(255,255,255,0.82);">${bankWords.map((word, index) => `<button type="button" class="cloze-token" style="font-family:inherit; border:1px solid #cbd5e1; border-radius:999px; padding:8px 16px; font-weight:700; background:var(--bg-card); color:var(--text-main); cursor:grab; box-shadow:0 1px 3px rgba(0,0,0,0.08); font-size:1rem; line-height:1.2;" draggable="true" data-token-id="${index}" data-token-text-encoded="${encodeURIComponent(word)}">${word}</button>`).join('')}</div></div>`;
        }
    }

    // 4. ORDERING
    else if (ex.type === 'ordering') {
        const orderingSequence = resolveOrderingSequence(ex.interaction);
        const shuffled = [...orderingSequence].sort(() => Math.random() - 0.5);
        if (shuffled.length === 0) {
            html += `<p class="helper">No hay pasos definidos para ordenar en este ejercicio.</p>`;
        }
        html += `<ul id="sortable-list" class="sortable-list">
            ${shuffled.map(item => `
                <li class="sortable-item" data-id="${item.order}">
                    <span class="sortable-handle" aria-hidden="true"><i class="ph ph-dots-six-vertical"></i></span>
                    <span class="sortable-label">${item.text}</span>
                </li>
            `).join('')}
        </ul>`;
    } 

    // 5. MATCHING
    else if (ex.type === 'matching') {
        const rightSide = [...ex.interaction.pairs].sort(() => Math.random() - 0.5);
        
        html += `
        <div class="matching-grid">
            <div class="static-list">
                ${ex.interaction.pairs.map(p => `<div class="static-item">${p.left}</div>`).join('')}
            </div>
            <div class="arrows-column">
                ${ex.interaction.pairs.map(() => `<i class="ph ph-arrow-right"></i>`).join('')}
            </div>
            <div id="matching-list" class="draggable-list">
                ${rightSide.map(p => `
                    <div class="draggable-item" data-match="${p.left}">${p.right}</div>
                `).join('')}
            </div>
        </div>`;
    }

    // 6. GROUPING
    else if (ex.type === 'grouping') {
        const grouping = resolveGroupingModel(ex.interaction);
        const allItems = [...grouping.items].sort(() => Math.random() - 0.5);
        
        html += `
        <div class="grouping-area">
            <div id="pool-list" class="items-pool">
                ${allItems.map(item => `
                    <div class="group-item" data-cat="${item.category}">${item.text}</div>
                `).join('')}
            </div>
            <div class="buckets-container">
                ${grouping.categories.map(cat => `
                    <div class="bucket">
                        <div class="bucket-header">${cat}</div>
                        <div class="bucket-dropzone" data-category="${cat}"></div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // 7. SHORT ANSWER
    else if (ex.type === 'short_answer') {
        const maxLen = ex.interaction.max_length || 200;
        html += `
            <div class="short-answer">
                <input id="short-answer-input" type="text" maxlength="${maxLen}" placeholder="Escribe tu respuesta" />
                ${ex.interaction.expected_answers?.length ? `<p class="helper">Referencia: ${ex.interaction.expected_answers.join(', ')}</p>` : ''}
            </div>
        `;
    }

    // 8. HOTSPOT
    else if (ex.type === 'hotspot') {
        html += '<div class="hotspot-container">';
        if (ex.interaction.image_url) {
            html += `<div class="hotspot-image" style="background-image:url('${ex.interaction.image_url}')">`;
            (ex.interaction.zones || []).forEach((zone, idx) => {
                const top = zone.y || 0;
                const left = zone.x || 0;
                const width = zone.width || 20;
                const height = zone.height || 20;
                html += `<button class="hotspot-zone" data-zone-id="${idx}" style="top:${top}%; left:${left}%; width:${width}%; height:${height}%;"></button>`;
            });
            html += '</div>';
            html += `<p class="helper">Pulsa sobre la zona correcta (${ex.interaction.zones?.length || 0} zonas)</p>`;
        } else {
            html += '<p class="helper">No hay imagen configurada</p>';
        }
        html += '</div>';
    }

    // 10. SLIDER
    else if (ex.type === 'slider') {
        const min = ex.interaction.min ?? 0;
        const max = ex.interaction.max ?? 100;
        const target = ex.interaction.correct_value ?? 50;
        const initialValue = Math.floor((min + max) / 2); // Empezar en el medio
        html += `
            <div class="slider-wrap">
                <input id="slider-input" type="range" min="${min}" max="${max}" value="${initialValue}" step="1">
                <div class="slider-meta">
                    <span>${min}</span>
                    <span id="slider-value" style="font-weight: 700; font-size: 1.2rem; color: var(--primary);">${initialValue}</span>
                    <span>${max}</span>
                </div>
                <p class="helper">Objetivo: ${target} (tolerancia ±${ex.interaction.tolerance ?? 5})</p>
            </div>
        `;
    }

    ui.container.innerHTML = html;

    state.exerciseStartedAt = Date.now();
    initializeExerciseInteractions(ex);
}

function buildAnswerSnapshot(ex) {
    try {
        if (!ex || typeof ex !== 'object') {
            return null;
        }
        if (ex.type === 'ordering') {
            return Array.from(document.querySelectorAll('.sortable-item')).map((item) => Number(item.dataset.id));
        }
        if (ex.type === 'matching') {
            return Array.from(document.querySelectorAll('#matching-list .draggable-item')).map((item) => String(item.dataset.match || '').trim());
        }
        if (ex.type === 'grouping') {
            const output = {};
            document.querySelectorAll('.bucket-dropzone').forEach((bucket) => {
                const category = String(bucket.getAttribute('data-category') || '').trim();
                output[category] = Array.from(bucket.querySelectorAll('.group-item')).map((item) => String(item.textContent || '').trim());
            });
            return output;
        }
        if (ex.type === 'fill_gaps') {
            const drops = Array.from(document.querySelectorAll('.cloze-drop'));
            return drops.map((zone) => decodeURIComponent(String(zone.dataset.userValueEncoded || '')).trim());
        }
        return state.currentAnswer;
    } catch {
        return state.currentAnswer;
    }
}

function recordExerciseAttempt(ex, isCorrect) {
    const exerciseId = String(ex?.id || `idx_${state.currentIndex + 1}`);
    const now = Date.now();
    const elapsed = Math.max(0, now - (Number(state.exerciseStartedAt) || now));
    state.timeMs[exerciseId] = Number(state.timeMs[exerciseId] || 0) + elapsed;
    state.exerciseStartedAt = now;
    state.attempts[exerciseId] = Number(state.attempts[exerciseId] || 0) + 1;
    state.correctness[exerciseId] = Boolean(state.correctness[exerciseId] || isCorrect);
    state.answerSnapshots[exerciseId] = buildAnswerSnapshot(ex);
}

function downloadJson(fileName, data) {
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
    }, 100);
}

function exportStudentResults() {
    const endedAt = Date.now();
    const rows = (Array.isArray(state.exercises) ? state.exercises : []).map((exercise, index) => {
        const exerciseId = String(exercise?.id || `idx_${index + 1}`);
        const attempts = Number(state.attempts[exerciseId] || 0);
        const correct = Boolean(state.correctness[exerciseId] || false);
        const timeSec = Number(((Number(state.timeMs[exerciseId] || 0)) / 1000).toFixed(2));
        return {
            exercise_id: exerciseId,
            core_id: String(exercise?.dua?.core_id || '').trim(),
            dua_label: String(exercise?.dua?.label || '').trim(),
            type: String(exercise?.type || '').trim(),
            attempts,
            correct,
            time_sec: timeSec,
            last_answer: state.answerSnapshots[exerciseId] ?? null
        };
    });
    const attempted = rows.filter((row) => row.attempts > 0).length;
    const correct = rows.filter((row) => row.correct).length;
    const totalAttempts = rows.reduce((acc, row) => acc + Number(row.attempts || 0), 0);
    const totalTimeSec = Number(rows.reduce((acc, row) => acc + Number(row.time_sec || 0), 0).toFixed(2));
    const payload = {
        schema_version: 'eduxai-visor-results/1.0.0',
        app: 'EduXAI-Visor',
        exported_at_utc: new Date(endedAt).toISOString(),
        session: {
            id: state.sessionId || `session_${endedAt}`,
            started_at_utc: new Date(Number(state.sessionStartedAt || endedAt)).toISOString(),
            ended_at_utc: new Date(endedAt).toISOString(),
            duration_sec: Number(((endedAt - Number(state.sessionStartedAt || endedAt)) / 1000).toFixed(2)),
            delivery_policy: String(state?.loadedMeta?.delivery_policy || 'single_fixed'),
            resource_metadata: state?.loadedMeta?.resource_metadata || {}
        },
        summary: {
            total_exercises: rows.length,
            attempted_exercises: attempted,
            correct_exercises: correct,
            accuracy_pct: rows.length > 0 ? Number(((correct / rows.length) * 100).toFixed(2)) : 0,
            total_attempts: totalAttempts,
            total_time_sec: totalTimeSec
        },
        exercise_results: rows
    };
    const topicPart = String(state?.loadedMeta?.resource_metadata?.topic || 'topic')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || 'topic';
    downloadJson(`eduxai_visor_results_${topicPart}_${Date.now()}.json`, payload);
}

// LOGICA ESPECIFICA PARA HABILITAR BOTON EN GROUPING
function checkGroupingStatus() {
    const pool = document.getElementById('pool-list');
    if (pool && pool.children.length === 0) {
        enableCheck();
    }
}

// ===== UI RESET =====

function resetUI() {
    if (ui.modal) {
        ui.modal.classList.add('hidden');
        ui.modal.classList.remove('show', 'correct', 'incorrect');
    }
    
    if (ui.btnCheck) {
        ui.btnCheck.disabled = true;
        ui.btnCheck.style.opacity = "0.5";
    }
    
    state.currentAnswer = null;
    state.hasAnswered = false;
    
    // Ocultar pista
    const hintBox = document.getElementById('hint-display');
    if (hintBox) hintBox.classList.remove('show');
    
    // Habilitar botón de pista si existe
    const ex = state.exercises[state.currentIndex];
    if (ex && ex.scaffolding && ex.scaffolding.hint_1) {
        if (ui.btnHint) {
            ui.btnHint.disabled = false;
            ui.btnHint.style.opacity = "1";
        }
    } else {
        if (ui.btnHint) {
            ui.btnHint.disabled = true;
            ui.btnHint.style.opacity = "0.5";
        }
    }
    
    // Reiniciar botón de reintentar
    if (ui.btnRetry) {
        ui.btnRetry.disabled = true;
        ui.btnRetry.style.opacity = "0.5";
    }
}

function showHint() {
    const ex = state.exercises[state.currentIndex];
    const hint = ex.scaffolding?.hint_1;
    if (hint) {
        const hintBox = document.getElementById('hint-display');
        if (hintBox) {
            hintBox.querySelector('span').textContent = hint;
            hintBox.classList.add('show');
        }
    }
}

function closeModal() {
    if (ui.modal) {
        ui.modal.classList.remove('show');
        setTimeout(() => {
            ui.modal.classList.add('hidden');
            ui.modal.classList.remove('correct', 'incorrect');
        }, 300);
    }
}

function retryExercise() {
    closeModal();
    state.hasAnswered = false;
    state.currentAnswer = null;
    renderCurrentExercise();
}

// ===== NAVEGACIÓN =====

function nextExercise() {
    if (state.currentIndex < state.exercises.length - 1) {
        state.currentIndex++;
        updateHUD();
        renderCurrentExercise();
    } else {
        showScreen('results');
        const finalXP = document.getElementById('final-xp');
        if (finalXP) finalXP.textContent = state.score;
        triggerFinalConfetti();
    }
}

function prevExercise() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        updateHUD();
        renderCurrentExercise();
    }
}

// ===== VALIDACIÓN =====

function checkAnswer() {
    if (state.hasAnswered) return;
    
    const ex = state.exercises[state.currentIndex];
    if (!ex) return;
    
    // Validación: debe haber una respuesta según el tipo
    // Tipos que leen del DOM no necesitan state.currentAnswer pre-establecido
    const domReadTypes = ['ordering', 'matching', 'grouping', 'fill_gaps', 'hotspot'];
    
    if ((ex.type === 'multiple_choice' || ex.type === 'true_false') && !state.currentAnswer) {
        const selectedBtn = document.querySelector('.options-grid .option-btn.selected');
        if (selectedBtn) {
            const optionId = String(selectedBtn.dataset.optionId || '').trim();
            const optionIndex = String(selectedBtn.dataset.optionIndex || '').trim();
            state.currentAnswer = optionId || optionIndex;
        }
    }

    if (!domReadTypes.includes(ex.type) && (state.currentAnswer === null || state.currentAnswer === undefined || String(state.currentAnswer).trim() === '')) {
        alert('Por favor, proporciona una respuesta antes de comprobar');
        return;
    }
    
    let isCorrect = false;
    let msg = '';
    let extraFeedbackHtml = '';
    const alreadyGraded = state.graded[ex.id] || false;
    
    // LÓGICA DE VALIDACIÓN
    
    if (ex.type === 'multiple_choice' || ex.type === 'true_false') {
        const options = Array.isArray(ex?.interaction?.options) ? ex.interaction.options : [];
        let opt = options.find(o => String(o.id) === String(state.currentAnswer));
        if (!opt) {
            const asIndex = Number(state.currentAnswer);
            if (Number.isInteger(asIndex) && asIndex >= 0 && asIndex < options.length) {
                opt = options[asIndex];
            }
        }
        isCorrect = opt && opt.is_correct;
        msg = isCorrect ? "¡Correcto!" : "Incorrecto";
        if (!opt) msg = "Elige una opción";
    } 
    else if (ex.type === 'fill_gaps') {
        const drops = Array.from(document.querySelectorAll('.cloze-drop'));
        const expectedByGap = [];
        if (drops.length > 0) {
            const allFilled = drops.every(zone => String(zone.dataset.userValueEncoded || '').trim() !== '');
            if (!allFilled) {
                alert('Completa todos los espacios antes de comprobar');
                return;
            }

            drops.forEach((zone) => {
                expectedByGap.push(decodeURIComponent(zone.dataset.ansEncoded || '').trim());
            });

            isCorrect = drops.every(zone => {
                const expectedValue = decodeURIComponent(zone.dataset.ansEncoded || '').trim();
                const userValue = decodeURIComponent(zone.dataset.userValueEncoded || '').trim();
                if (!expectedValue) {
                    return userValue.length > 0;
                }
                return userValue.toLowerCase() === expectedValue.toLowerCase();
            });
        } else {
            const inputs = document.querySelectorAll('.cloze-input');
            if (inputs.length === 0) {
                alert('No se encontraron espacios para completar');
                return;
            }
            Array.from(inputs).forEach((input) => {
                const expectedRaw = input.dataset.ansEncoded
                    ? decodeURIComponent(input.dataset.ansEncoded)
                    : (input.dataset.ans || '');
                expectedByGap.push(String(expectedRaw).trim());
            });
            isCorrect = Array.from(inputs).every(i => {
                const rawExpected = i.dataset.ansEncoded
                    ? decodeURIComponent(i.dataset.ansEncoded)
                    : (i.dataset.ans || '');
                const userValue = i.value.trim();
                const expectedValue = String(rawExpected).trim();
                if (!expectedValue) {
                    return userValue.length > 0;
                }
                return userValue.toLowerCase() === expectedValue.toLowerCase();
            });
        }
        msg = isCorrect ? "¡Bien completado!" : "Hay errores en las palabras";

        if (!isCorrect) {
            const solved = expectedByGap.map(item => String(item || '').trim()).filter(Boolean);
            if (solved.length > 0) {
                extraFeedbackHtml = `<div style="margin-top:12px; padding:10px; border-radius:8px; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.35);"><div style="font-weight:700; color:#166534; margin-bottom:6px;">✅ Combinación correcta:</div>${solved.map((answer, index) => `<div style="font-size:0.95em; color:#14532d;">Hueco ${index + 1}: <strong>${escapeHtml(answer)}</strong></div>`).join('')}</div>`;
            }
        }
    }
    else if (ex.type === 'ordering') {
        const items = document.querySelectorAll('.sortable-item');
        const currentOrder = Array.from(items).map(i => parseInt(i.dataset.id));
        isCorrect = currentOrder.every((val, i, arr) => !i || (val >= arr[i - 1]));
        msg = isCorrect ? "Secuencia perfecta" : "El orden no es correcto";
    }
    else if (ex.type === 'matching') {
        const leftItems = ex.interaction.pairs;
        const rightDOM = document.querySelectorAll('#matching-list .draggable-item');
        
        isCorrect = Array.from(rightDOM).every((item, index) => {
            return item.dataset.match === leftItems[index].left;
        });
        msg = isCorrect ? "Conexiones correctas" : "Alguna pareja no coincide";
    }
    else if (ex.type === 'grouping') {
        const buckets = document.querySelectorAll('.bucket-dropzone');
        let allItemsCorrect = true;
        let anyItemMissed = document.getElementById('pool-list').children.length > 0;

        buckets.forEach(bucket => {
            const cat = bucket.dataset.category;
            const items = bucket.querySelectorAll('.group-item');
            items.forEach(item => {
                if (item.dataset.cat !== cat) allItemsCorrect = false;
            });
        });

        if (anyItemMissed) {
            isCorrect = false;
            msg = "Faltan elementos por clasificar";
        } else {
            isCorrect = allItemsCorrect;
            msg = isCorrect ? "Clasificación perfecta" : "Algunos elementos están en el grupo incorrecto";
        }
    }
    else if (ex.type === 'short_answer') {
        const answer = (state.currentAnswer || '').trim();
        const expected = (ex.interaction.expected_answers || []).map(a => a.trim());
        const caseSensitive = ex.interaction.case_sensitive === true;
        const normalized = caseSensitive ? answer : answer.toLowerCase();
        isCorrect = expected.some(a => (caseSensitive ? a : a.toLowerCase()) === normalized);
        msg = isCorrect ? "Respuesta correcta" : "Revisa tu respuesta";
    }
    else if (ex.type === 'hotspot') {
        const zones = ex.interaction.zones || [];
        const selectedId = Number(state.currentAnswer);
        const selectedZone = zones[selectedId];
        isCorrect = !!selectedZone && selectedZone.is_correct === true;
        msg = isCorrect ? "Zona correcta" : "Selecciona la zona correcta";
    }
    else if (ex.type === 'slider') {
        const value = Number(state.currentAnswer);
        const target = ex.interaction.correct_value ?? 50;
        const tol = ex.interaction.tolerance ?? 5;
        isCorrect = Math.abs(value - target) <= tol;
        msg = isCorrect ? `¡Correcto! Valor: ${value}` : `Intenta de nuevo. Valor actual: ${value}, objetivo: ${target} (±${tol})`;
    }
    
    state.hasAnswered = true;
    recordExerciseAttempt(ex, isCorrect);
    
    if (ui.btnCheck) {
        ui.btnCheck.disabled = true;
        ui.btnCheck.style.opacity = "0.5";
    }
    
    showFeedback(isCorrect, msg, ex.scaffolding, alreadyGraded, ex.id, extraFeedbackHtml);
    
    if (ui.btnRetry) {
        ui.btnRetry.disabled = false;
        ui.btnRetry.style.opacity = "1";
    }
}

function showFeedback(isCorrect, msg, scaffolding, alreadyGraded, exId, extraFeedbackHtml = '') {
    if (!ui.modal) return;

    if (isCorrect) {
        SoundFX.playSuccess();
    } else {
        SoundFX.playError();
    }
    
    // Actualizar puntuación si es la primera vez
    if (!alreadyGraded && isCorrect) {
        state.score += 100 + (state.streak * 20);
        state.streak++;
        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
        }
    } else if (!alreadyGraded && !isCorrect) {
        state.streak = 0;
    }
    
    if (exId) {
        state.graded[exId] = true;
    }
    updateHUD();
    
    ui.modal.classList.remove('hidden');
    setTimeout(() => {
        ui.modal.classList.add('show', isCorrect ? 'correct' : 'incorrect');
    }, 10);
    
    if (ui.feedbackIcon) {
        ui.feedbackIcon.className = isCorrect ? 'ph ph-check-circle-fill' : 'ph ph-x-circle-fill';
    }
    
    if (ui.feedbackTitle) {
        ui.feedbackTitle.textContent = isCorrect ? '¡Excelente!' : 'Vaya...';
    }
    
    const hint = scaffolding?.hint_1;
    const expl = scaffolding?.explanation;
    const more = scaffolding?.learn_more;
    
    let html = `<div>${msg}</div>`;
    
    if (!isCorrect && hint) {
        html += `<div class="fb-hint" style="margin-top:12px; padding:10px; background:rgba(251,191,36,0.15); border-radius:8px; color:#92400e; font-weight:600;">💡 ${hint}</div>`;
    }
    
    if (expl) {
        html += `<div class="fb-expl" style="margin-top:12px; color:#666;">${expl}</div>`;
    }
    
    if (more) {
        html += `<details class="fb-more" style="margin-top:12px; cursor:pointer;"><summary style="font-weight:700; color:var(--primary); cursor:pointer;">📚 Aprender más</summary><div style="margin-top:8px; padding:10px; background:rgba(59,130,246,0.05); border-radius:8px; color:#333;">${more}</div></details>`;

    }

    if (extraFeedbackHtml) {
        html += extraFeedbackHtml;
    }
    
    if (alreadyGraded) {
        html += `<div style="margin-top:12px; font-size:0.9em; color:#999; font-style:italic;">(Ya realizado anteriormente)</div>`;
    }
    
    if (ui.feedbackText) {
        ui.feedbackText.innerHTML = html;
    }
}

// ===== RESULTADOS =====

function showResults() {
    showScreen('results');
    const finalXP = document.getElementById('final-xp');
    if (finalXP) finalXP.textContent = state.score;
    triggerFinalConfetti();
}

// ===== CONFETTI =====

function triggerStreakConfetti() {
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
}

function triggerFinalConfetti() {
    if (typeof confetti === 'undefined') return;
    const end = Date.now() + 3000;
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    ui = {
        screens: {
            upload: document.getElementById('screen-upload'),
            game: document.getElementById('screen-game'),
            results: document.getElementById('screen-results')
        },
        container: document.getElementById('exercise-area'),
        progressBar: document.getElementById('progress-bar'),
        score: document.getElementById('score-display'),
        streak: document.getElementById('streak-display'),
        btnCheck: document.getElementById('btn-check'),
        btnNext: document.getElementById('btn-next'),
        btnNextNav: document.getElementById('btn-next-nav'),
        btnRetry: document.getElementById('btn-retry'),
        btnPrev: document.getElementById('btn-prev'),
        btnReset: document.getElementById('btn-reset'),
        btnHint: document.getElementById('btn-hint'),
        btnExportResults: document.getElementById('btn-export-results'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        modal: document.getElementById('feedback-overlay'),
        feedbackTitle: document.getElementById('feedback-title'),
        feedbackText: document.getElementById('feedback-text'),
        feedbackIcon: document.getElementById('feedback-icon'),
        themeSelect: document.getElementById('theme-select'),
        dropZone: document.getElementById('drop-zone')
    };

    // Event Listeners con protección
    const fileInput = document.getElementById('file-input');
    
    if (ui.dropZone) {
        ui.dropZone.addEventListener('click', () => { if (fileInput) fileInput.click(); });
        ['dragover', 'dragenter'].forEach(evt => {
            ui.dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                ui.dropZone.classList.add('dragging');
            });
        });
        ['dragleave', 'drop'].forEach(evt => {
            ui.dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                ui.dropZone.classList.remove('dragging');
            });
        });
        ui.dropZone.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files?.[0];
            if (file) processFile(file);
        });
    }
    
    if (fileInput) fileInput.addEventListener('change', loadFile);
    if (ui.btnCheck) ui.btnCheck.addEventListener('click', checkAnswer);
    if (ui.btnNext) ui.btnNext.addEventListener('click', nextExercise);
    if (ui.btnNextNav) ui.btnNextNav.addEventListener('click', nextExercise);
    if (ui.btnRetry) ui.btnRetry.addEventListener('click', retryExercise);
    if (ui.btnPrev) ui.btnPrev.addEventListener('click', prevExercise);
    if (ui.btnReset) ui.btnReset.addEventListener('click', goToUpload);
    if (ui.btnHint) ui.btnHint.addEventListener('click', showHint);
    if (ui.btnExportResults) ui.btnExportResults.addEventListener('click', exportStudentResults);
    if (ui.btnCloseModal) ui.btnCloseModal.addEventListener('click', closeModal);
    
    // Botón cargar ejemplo
    const btnLoadExample = document.getElementById('btn-load-example');
    if (btnLoadExample) {
        btnLoadExample.addEventListener('click', loadExample);
    }
    
    if (ui.themeSelect) {
        ui.themeSelect.addEventListener('change', (e) => {
            document.body.setAttribute('data-theme', e.target.value);
        });
    }
});

