/* * VISOR.JS - Versión Corregida * */

let state = {
    exercises: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    currentAnswer: null,
    hasAnswered: false,
    graded: {}
};

let ui = {}; // Se inicializa en DOMContentLoaded

// ===== CARGAR EJEMPLO =====
async function loadExample() {
    try {
        const response = await fetch('ejemplo.json');
        if (response.ok) {
            const data = await response.json();
            if (data.exercises && data.exercises.length > 0) {
                initGame(data.exercises);
            }
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
    state.currentAnswer = id;
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

// ===== RENDERIZADO DE EJERCICIOS =====

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
                ${ex.interaction.expected_answers?.length ? `<p class="helper">Referencia: ${ex.interaction.expected_answers.join(', ')}</p>` : ''}
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
        if (typeof Sortable !== 'undefined') {
            new Sortable(document.getElementById('sortable-list'), { animation: 150, onEnd: enableCheck });
        }
        enableCheck(); 
    } 
    else if (ex.type === 'fill_gaps') {
        const inputs = document.querySelectorAll('.cloze-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                // Habilitar si al menos uno está completado
                const allFilled = Array.from(inputs).every(i => i.value.trim() !== '');
                if (allFilled) enableCheck();
            });
        });
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
    else if (ex.type === 'essay') {
        const textarea = document.getElementById('essay-input');
        const counter = document.getElementById('essay-counter');
        if (textarea) {
            textarea.addEventListener('input', () => {
                const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
                if (counter) counter.textContent = `${words} palabras`;
                state.currentAnswer = textarea.value;
                if (state.currentAnswer.trim()) enableCheck();
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
        if (slider) {
            slider.addEventListener('input', () => {
                state.currentAnswer = Number(slider.value);
                enableCheck();
            });
        }
    }
    else if (ex.type === 'drawing') {
        const btn = document.getElementById('drawing-done');
        if (btn) {
            btn.addEventListener('click', () => {
                state.currentAnswer = 'done';
                enableCheck();
            });
        }
    }
    // Para tipos múltiples choice que NO sean true_false
    else if (ex.type === 'multiple_choice') {
        const options = document.querySelectorAll('.options-grid .option-btn');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                enableCheck();
            });
        });
    }

    // Actualizar navegación
    if (ui.btnPrev) ui.btnPrev.disabled = state.currentIndex === 0;
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
    
    if (!domReadTypes.includes(ex.type) && !state.currentAnswer) {
        alert('Por favor, proporciona una respuesta antes de comprobar');
        return;
    }
    
    let isCorrect = false;
    let msg = '';
    const alreadyGraded = state.graded[ex.id] || false;
    
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
    else if (ex.type === 'essay') {
        const text = (state.currentAnswer || '').trim();
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        const min = ex.interaction.min_words || 50;
        const max = ex.interaction.max_words || 250;
        isCorrect = words >= min && words <= max;
        msg = isCorrect ? "Extensión adecuada" : `Usa entre ${min}-${max} palabras`;
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
        msg = isCorrect ? "Dentro del rango" : "Ajusta un poco más";
    }
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
    
    if (ui.btnRetry) {
        ui.btnRetry.disabled = false;
        ui.btnRetry.style.opacity = "1";
    }
}

function showFeedback(isCorrect, msg, scaffolding, alreadyGraded, exId) {
    if (!ui.modal) return;
    
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
