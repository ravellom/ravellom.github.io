/* * VISOR.JS - Versión Completa con 6 Tipologías * */

let state = {
    exercises: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    currentAnswer: null,
    hasAnswered: false,
    graded: {}
};

const ui = {
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
    btnCloseModal: document.getElementById('btn-close-modal'),
    modal: document.getElementById('feedback-overlay'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackText: document.getElementById('feedback-text'),
    feedbackIcon: document.getElementById('feedback-icon'),
    themeSelect: document.getElementById('theme-select'),
    dropZone: document.getElementById('drop-zone')
};

// Funciones auxiliares que se necesitan globalmente
function enableCheck() {
    if (ui.btnCheck) {
        ui.btnCheck.disabled = false;
        ui.btnCheck.style.opacity = "1";
    }
}

// Funciones globales que se usan en onclick
window.selectOption = (id, btn) => {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.currentAnswer = id;
    enableCheck();
};

// Listeners
document.getElementById('drop-zone').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', loadFile);
['dragover', 'dragenter'].forEach(evt => ui.dropZone.addEventListener(evt, (e) => { e.preventDefault(); ui.dropZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(evt => ui.dropZone.addEventListener(evt, (e) => { e.preventDefault(); ui.dropZone.classList.remove('dragging'); }));
ui.dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
});
if (ui.btnCheck) ui.btnCheck.addEventListener('click', checkAnswer);
if (ui.btnNext) ui.btnNext.addEventListener('click', nextExercise);
if (ui.btnNextNav) ui.btnNextNav.addEventListener('click', nextExercise);
if (ui.btnRetry) ui.btnRetry.addEventListener('click', retryExercise);
if (ui.btnPrev) ui.btnPrev.addEventListener('click', prevExercise);
if (ui.btnReset) ui.btnReset.addEventListener('click', goToUpload);
if (ui.btnHint) ui.btnHint.addEventListener('click', showHint);
if (ui.btnCloseModal) ui.btnCloseModal.addEventListener('click', closeModal);
if (ui.themeSelect) ui.themeSelect.addEventListener('change', (e) => document.body.setAttribute('data-theme', e.target.value));

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
            if (!data.exercises || !Array.isArray(data.exercises) || data.exercises.length === 0) {
                alert('El archivo no contiene ejercicios válidos');
                return;
            }
            initGame(data.exercises);
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
    updateHUD();
    showScreen('game');
    renderCurrentExercise();
}

function renderCurrentExercise() {
    resetUI();
    const ex = state.exercises[state.currentIndex];
    if (!ex) {
        ui.container.innerHTML = '<p style="text-align:center; color:#999;">No hay ejercicio para mostrar.</p>';
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
        const parts = ex.interaction.template.split(/(\[.*?\])/);
        html += `<div class="cloze-text">
            ${parts.map(part => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    const ans = part.slice(1, -1);
                    return `<input type="text" class="cloze-input" data-ans="${ans}" oninput="enableCheck()">`;
                }
                return part;
            }).join('')}
        </div>`;
    }

    // 4. ORDERING
    else if (ex.type === 'ordering') {
        const shuffled = [...ex.interaction.sequence].sort(() => Math.random() - 0.5);
        html += `<ul id="sortable-list" class="sortable-list">
            ${shuffled.map(item => `
                <li class="sortable-item" data-id="${item.order}">
                    <i class="ph ph-dots-six-vertical"></i> ${item.text}
                </li>
            `).join('')}
        </ul>`;
    } 

    // 5. MATCHING (NUEVO)
    else if (ex.type === 'matching') {
        // Izquierda estática, Derecha mezclada y arrastrable
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

    // 6. GROUPING (NUEVO)
    else if (ex.type === 'grouping') {
        // Pool de items mezclados
        const allItems = [...ex.interaction.items].sort(() => Math.random() - 0.5);
        
        html += `
        <div class="grouping-area">
            <div id="pool-list" class="items-pool">
                ${allItems.map(item => `
                    <div class="group-item" data-cat="${item.category}">${item.text}</div>
                `).join('')}
            </div>
            <div class="buckets-container">
                ${ex.interaction.categories.map(cat => `
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
                ${ex.interaction.expected_answers?.length ? `<p class="helper">Respuestas esperadas (referencia): ${ex.interaction.expected_answers.join(', ')}</p>` : ''}
            </div>
        `;
    }

    // 8. ESSAY
    else if (ex.type === 'essay') {
        const minW = ex.interaction.min_words || 50;
        const maxW = ex.interaction.max_words || 250;
        html += `
            <div class="essay">
                <p class="helper">Extensión sugerida: ${minW}-${maxW} palabras</p>
                <textarea id="essay-input" placeholder="Desarrolla tu respuesta" rows="6"></textarea>
                <div class="essay-footer"><span id="essay-counter">0 palabras</span></div>
                ${ex.interaction.rubric && Object.keys(ex.interaction.rubric).length ? `<details class="rubric"><summary>Ver rúbrica</summary><pre>${JSON.stringify(ex.interaction.rubric, null, 2)}</pre></details>` : ''}
            </div>
        `;
    }

    // 9. HOTSPOT
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
        html += `
            <div class="slider-wrap">
                <input id="slider-input" type="range" min="${min}" max="${max}" value="${target}">
                <div class="slider-meta">
                    <span>${min}</span>
                    <span id="slider-value">${target}</span>
                    <span>${max}</span>
                </div>
                <p class="helper">Objetivo: ${target} (tolerancia ±${ex.interaction.tolerance ?? 5})</p>
            </div>
        `;
    }

    // 11. DRAWING
    else if (ex.type === 'drawing') {
        const w = ex.interaction.canvas_width || 800;
        const h = ex.interaction.canvas_height || 400;
        html += `
            <div class="drawing-wrap">
                <div class="drawing-canvas" style="width:100%; max-width:${w}px; height:${h}px;">Zona de dibujo (mock)</div>
                <p class="helper">Evaluación: ${ex.interaction.evaluation_type || 'manual'}</p>
                <button id="drawing-done" class="btn-action" type="button">Marcar como listo</button>
            </div>
        `;
    }

    ui.container.innerHTML = html;

    // --- INICIALIZAR LIBRERÍAS (Post-Render) ---

    if (ex.type === 'ordering') {
        new Sortable(document.getElementById('sortable-list'), { animation: 150, onEnd: enableCheck });
        enableCheck(); 
    }
    
    else if (ex.type === 'matching') {
        new Sortable(document.getElementById('matching-list'), { animation: 150, onEnd: enableCheck });
        enableCheck();
    }

    else if (ex.type === 'grouping') {
        // Grupo compartido para mover entre Pool y Buckets
        new Sortable(document.getElementById('pool-list'), { group: 'shared', animation: 150, onEnd: checkGroupingStatus });
        
        document.querySelectorAll('.bucket-dropzone').forEach(zone => {
            new Sortable(zone, { group: 'shared', animation: 150, onEnd: checkGroupingStatus });
        });
        // Deshabilitado al inicio hasta que muevan algo
    }

    // 7. SHORT ANSWER
    else if (ex.type === 'short_answer') {
        const input = document.getElementById('short-answer-input');
        if (input) {
            input.addEventListener('input', () => {
                state.currentAnswer = input.value;
                enableCheck();
            });
        }
    }

    // 8. ESSAY
    else if (ex.type === 'essay') {
        const textarea = document.getElementById('essay-input');
        const counter = document.getElementById('essay-counter');
        if (textarea) {
            textarea.addEventListener('input', () => {
                const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
                if (counter) counter.textContent = `${words} palabras`;
                state.currentAnswer = textarea.value;
                enableCheck();
            });
        }
    }

    // 9. HOTSPOT
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

    // 10. SLIDER
    else if (ex.type === 'slider') {
        const slider = document.getElementById('slider-input');
        const valueLabel = document.getElementById('slider-value');
        if (slider) {
            const updateValue = () => {
                valueLabel.textContent = slider.value;
                state.currentAnswer = Number(slider.value);
                enableCheck();
            };
            slider.addEventListener('input', updateValue);
            updateValue();
        }
    }

    // 11. DRAWING (mock)
    else if (ex.type === 'drawing') {
        const btn = document.getElementById('drawing-done');
        if (btn) {
            btn.addEventListener('click', () => {
                state.currentAnswer = 'done';
                enableCheck();
            });
        }
    }

    // Actualizar navegación
    ui.btnPrev.disabled = state.currentIndex === 0;
    ui.btnRepeat.disabled = true; // solo habilitar tras comprobar
}

// LOGICA ESPECIFICA PARA HABILITAR BOTON EN GROUPING
function checkGroupingStatus() {
    const pool = document.getElementById('pool-list');
    // Habilitar si el pool está vacío (todo asignado) o si hay movimiento
    // Para ser estrictos: Habilitar solo si el pool está vacío
    if (pool.children.length === 0) {
        enableCheck();
        // Auto-check opcional? No, mejor manual
    }
}


function resetUI() {
    ui.modal.classList.add('hidden');
    ui.modal.classList.remove('show', 'correct', 'incorrect');
    if (ui.btnCheck) {
        ui.btnCheck.disabled = true;
        ui.btnCheck.style.opacity = "0.5";
    }
    state.currentAnswer = null;
    state.hasAnswered = false;
    
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
}

function showHint() {
    const ex = state.exercises[state.currentIndex];
    const hint = ex.scaffolding?.hint_1;
    if (hint) {
        alert(`💡 Pista: ${hint}`);
    }
}

function closeModal() {
    ui.modal.classList.remove('show');
    setTimeout(() => {
        ui.modal.classList.add('hidden');
        ui.modal.classList.remove('correct', 'incorrect');
    }, 300);
}

function retryExercise() {
    closeModal();
    renderCurrentExercise();
    updateHUD();
}

function checkAnswer() {
    if (state.hasAnswered) return; // evita doble puntuación
    const ex = state.exercises[state.currentIndex];
    let isCorrect = false;
    let msg = "";
    const alreadyGraded = state.graded[ex.id] === true;

    // LÓGICA DE VALIDACIÓN

    if (ex.type === 'multiple_choice' || ex.type === 'true_false') {
        const opt = ex.interaction.options.find(o => o.id === state.currentAnswer);
        isCorrect = opt && opt.is_correct;
        msg = isCorrect ? "¡Correcto!" : "Incorrecto";
        if (!opt) msg = "Elige una opción";
    } 
    else if (ex.type === 'fill_gaps') {
        const inputs = document.querySelectorAll('.cloze-input');
        isCorrect = Array.from(inputs).every(i => i.value.trim().toLowerCase() === i.dataset.ans.toLowerCase());
        msg = isCorrect ? "¡Bien completado!" : "Hay errores en las palabras";
    }
    else if (ex.type === 'ordering') {
        const items = document.querySelectorAll('.sortable-item');
        const currentOrder = Array.from(items).map(i => parseInt(i.dataset.id));
        // Chequeo simple: si el orden es ascendente (1,2,3,4...)
        isCorrect = currentOrder.every((val, i, arr) => !i || (val >= arr[i - 1]));
        msg = isCorrect ? "Secuencia perfecta" : "El orden no es correcto";
    }
    // VALIDACIÓN MATCHING
    else if (ex.type === 'matching') {
        const leftItems = ex.interaction.pairs; // Array original en orden
        const rightDOM = document.querySelectorAll('#matching-list .draggable-item');
        
        // Comparamos el índice i de la izquierda con el elemento i de la derecha
        isCorrect = Array.from(rightDOM).every((item, index) => {
            return item.dataset.match === leftItems[index].left;
        });
        msg = isCorrect ? "Conexiones correctas" : "Alguna pareja no coincide";
    }
    // VALIDACIÓN GROUPING
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

    // SHORT ANSWER
    else if (ex.type === 'short_answer') {
        const answer = (state.currentAnswer || '').trim();
        const expected = (ex.interaction.expected_answers || []).map(a => a.trim());
        const caseSensitive = ex.interaction.case_sensitive === true;
        const normalized = caseSensitive ? answer : answer.toLowerCase();
        isCorrect = expected.some(a => (caseSensitive ? a : a.toLowerCase()) === normalized);
        msg = isCorrect ? "Respuesta correcta" : "Revisa tu respuesta";
    }

    // ESSAY (solo valida rango de palabras)
    else if (ex.type === 'essay') {
        const text = (state.currentAnswer || '').trim();
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        const min = ex.interaction.min_words || 50;
        const max = ex.interaction.max_words || 250;
        isCorrect = words >= min && words <= max;
        msg = isCorrect ? "Extensión adecuada" : `Usa entre ${min}-${max} palabras`;
    }

    // HOTSPOT
    else if (ex.type === 'hotspot') {
        const zones = ex.interaction.zones || [];
        const selectedId = Number(state.currentAnswer);
        const selectedZone = zones[selectedId];
        isCorrect = !!selectedZone && selectedZone.is_correct === true;
        msg = isCorrect ? "Zona correcta" : "Selecciona la zona correcta";
    }

    // SLIDER
    else if (ex.type === 'slider') {
        const value = Number(state.currentAnswer);
        const target = ex.interaction.correct_value ?? 50;
        const tol = ex.interaction.tolerance ?? 5;
        isCorrect = Math.abs(value - target) <= tol;
        msg = isCorrect ? "Dentro del rango" : "Ajusta un poco más";
    }

    // DRAWING (auto marcado como correcto; evaluación manual)
    else if (ex.type === 'drawing') {
        isCorrect = true;
        msg = "Enviado para revisión";
    }

    state.hasAnswered = true;
    if (ui.btnCheck) {
        ui.btnCheck.disabled = true;
        ui.btnCheck.style.opacity = "0.5";
    }
    showFeedback(isCorrect, msg, ex.scaffolding, alreadyGraded, ex.id);
    // Habilitar reinicio del ejercicio tras corregir
    ui.btnRepeat.disabled = false;
}

function showFeedback(isCorrect, msg, scaffolding, alreadyGraded, exId) {
    ui.modal.classList.remove('hidden');
    setTimeout(() => {
        ui.modal.classList.add('show');
        ui.modal.classList.add(isCorrect ? 'correct' : 'incorrect');
    }, 10);

    ui.feedbackTitle.innerText = isCorrect ? "¡Excelente!" : "Vaya...";
    ui.feedbackIcon.className = isCorrect ? "ph ph-check-circle" : "ph ph-warning-circle";
    ui.feedbackIcon.style.color = isCorrect ? "var(--success)" : "var(--error)";
    const hint = scaffolding?.hint_1;
    const expl = scaffolding?.explanation;
    const more = scaffolding?.learn_more;
    let extras = '';
    if (!isCorrect && hint) extras += `<div class="fb-hint">💡 ${hint}</div>`;
    if (expl) extras += `<div class="fb-expl">${expl}</div>`;
    if (more) extras += `<details class="fb-more"><summary>Aprender más</summary><div>${more}</div></details>`;
    ui.feedbackText.innerHTML = `${msg}${extras ? `<div class="feedback-extra">${extras}</div>` : ''}`;

    if (!alreadyGraded) {
        if (isCorrect) {
            state.score += 100 + (state.streak * 20);
            state.streak++;
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
        } else {
            state.streak = 0;
        }
        if (exId) state.graded[exId] = true;
    }
    updateHUD();
}

function prevExercise() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        renderCurrentExercise();
        updateHUD();
    }
}

function repeatExercise() {
    renderCurrentExercise();
    updateHUD();
}

function nextExercise() {
    state.currentIndex++;
    if (state.currentIndex < state.exercises.length) {
        renderCurrentExercise();
        updateHUD();
    } else {
        showScreen('results');
        document.getElementById('final-xp').innerText = state.score;
        triggerFinalConfetti();
    }
}

function updateHUD() {
    ui.score.innerText = state.score;
    ui.streak.innerText = state.streak;
    const total = state.exercises.length || 1;
    const pct = ((state.currentIndex + 1) / total) * 100;
    ui.progressBar.style.width = `${pct}%`;
    document.getElementById('question-display').innerText = `Pregunta ${Math.min(state.currentIndex + 1, total)}/${total}`;
}

function goToUpload() {
    // Reiniciar todo y volver al inicio
    state.exercises = [];
    state.currentIndex = 0;
    state.score = 0;
    state.streak = 0;
    state.currentAnswer = null;
    state.hasAnswered = false;
    state.graded = {};
    ui.modal.classList.add('hidden');
    ui.modal.classList.remove('show', 'correct', 'incorrect');
    ui.progressBar.style.width = '0%';
    ui.score.innerText = '0';
    ui.streak.innerText = '0';
    showScreen('upload');
}

function showScreen(name) {
    Object.values(ui.screens).forEach(s => s.classList.remove('active'));
    ui.screens[name].classList.add('active');
}

function triggerFinalConfetti() {
    const end = Date.now() + 3000;
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}