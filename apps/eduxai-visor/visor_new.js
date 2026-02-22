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
    const ex = state.exercises[state.currentIndex];
    if (!ex) return;
    
    resetUI();
    
    let html = `<div class="question-text">${ex.content.prompt_text}</div>`;
    
    switch (ex.type) {
        case 'single_choice':
            html += renderSingleChoice(ex);
            break;
        case 'multiple_choice':
            html += renderMultipleChoice(ex);
            break;
        case 'true_false':
            html += renderTrueFalse(ex);
            break;
        case 'short_answer':
            html += renderShortAnswer(ex);
            break;
        case 'ordering':
            html += renderOrdering(ex);
            break;
        case 'grouping':
            html += renderGrouping(ex);
            break;
        default:
            html += '<p>Tipo de ejercicio no soportado</p>';
    }
    
    ui.container.innerHTML = html;
    
    // Inicializar Sortable si es necesario
    if (ex.type === 'ordering') initSortableOrdering();
    if (ex.type === 'grouping') initSortableGrouping();
    
    // Actualizar navegación
    if (ui.btnPrev) ui.btnPrev.disabled = state.currentIndex === 0;
}

function renderSingleChoice(ex) {
    return `<div class="single-choice">
        ${ex.interaction.options.map(opt => `
            <button class="option-btn" onclick="selectOption('${opt.id}', this)">
                ${opt.text}
            </button>
        `).join('')}
    </div>`;
}

function renderMultipleChoice(ex) {
    return `<div class="multiple-choice">
        ${ex.interaction.options.map(opt => `
            <label class="checkbox-option">
                <input type="checkbox" value="${opt.id}" onchange="handleMultiCheck()">
                <span>${opt.text}</span>
            </label>
        `).join('')}
    </div>`;
}

function renderTrueFalse(ex) {
    return `<div class="true-false">
        <button class="option-btn tf-true" onclick="selectOption('true', this)">Verdadero</button>
        <button class="option-btn tf-false" onclick="selectOption('false', this)">Falso</button>
    </div>`;
}

function renderShortAnswer(ex) {
    return `<div class="short-answer">
        <input type="text" id="short-answer-input" placeholder="Escribe tu respuesta..." oninput="handleShortInput()">
    </div>`;
}

function renderOrdering(ex) {
    const shuffled = [...ex.interaction.options].sort(() => Math.random() - 0.5);
    return `<div class="ordering">
        <p class="instruction">Arrastra para ordenar correctamente:</p>
        <ul id="sortable-list" class="sortable-list">
            ${shuffled.map(opt => `<li data-id="${opt.id}">${opt.text}</li>`).join('')}
        </ul>
    </div>`;
}

function renderGrouping(ex) {
    const groups = ex.interaction.groups;
    const items = ex.interaction.items;
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    
    return `<div class="grouping">
        <p class="instruction">Arrastra cada elemento a su categoría:</p>
        <div class="groups-container">
            ${groups.map(g => `
                <div class="group-box">
                    <div class="group-title">${g.label}</div>
                    <ul class="group-list" data-group-id="${g.id}"></ul>
                </div>
            `).join('')}
        </div>
        <div class="pool-box">
            <div class="pool-title">Elementos</div>
            <ul id="pool-list" class="pool-list">
                ${shuffled.map(item => `<li data-id="${item.id}" data-group="${item.group_id}">${item.text}</li>`).join('')}
            </ul>
        </div>
    </div>`;
}

// ===== HANDLERS =====

window.handleMultiCheck = () => {
    const checked = document.querySelectorAll('.multiple-choice input:checked');
    state.currentAnswer = Array.from(checked).map(cb => cb.value);
    if (state.currentAnswer.length > 0) enableCheck();
};

window.handleShortInput = () => {
    const input = document.getElementById('short-answer-input');
    state.currentAnswer = input ? input.value.trim() : '';
    if (state.currentAnswer) enableCheck();
};

function initSortableOrdering() {
    const list = document.getElementById('sortable-list');
    if (list && typeof Sortable !== 'undefined') {
        new Sortable(list, {
            animation: 150,
            onEnd: () => {
                const items = Array.from(list.children).map(li => li.dataset.id);
                state.currentAnswer = items;
                enableCheck();
            }
        });
    }
}

function initSortableGrouping() {
    const groupLists = document.querySelectorAll('.group-list');
    const poolList = document.getElementById('pool-list');
    
    if (typeof Sortable === 'undefined') return;
    
    groupLists.forEach(list => {
        new Sortable(list, {
            group: 'shared',
            animation: 150,
            onEnd: checkGroupingStatus
        });
    });
    
    if (poolList) {
        new Sortable(poolList, {
            group: 'shared',
            animation: 150,
            onEnd: checkGroupingStatus
        });
    }
}

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
    if (ui.modal) ui.modal.classList.add('hidden');
}

function retryExercise() {
    closeModal();
    renderCurrentExercise();
}

// ===== NAVEGACIÓN =====

function nextExercise() {
    if (state.currentIndex < state.exercises.length - 1) {
        state.currentIndex++;
        updateHUD();
        renderCurrentExercise();
    } else {
        showResults();
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
    const ex = state.exercises[state.currentIndex];
    if (!ex || !state.currentAnswer) return;
    
    let isCorrect = false;
    let msg = '';
    const alreadyGraded = state.graded[ex.id] || false;
    
    switch (ex.type) {
        case 'single_choice':
        case 'true_false':
            isCorrect = state.currentAnswer === ex.interaction.correct_answer;
            msg = isCorrect ? '¡Correcto!' : 'Incorrecto';
            break;
            
        case 'multiple_choice':
            const correctSet = new Set(ex.interaction.correct_answers);
            const answerSet = new Set(state.currentAnswer);
            isCorrect = correctSet.size === answerSet.size && 
                        [...correctSet].every(x => answerSet.has(x));
            msg = isCorrect ? '¡Todas correctas!' : 'Revisa tu selección';
            break;
            
        case 'short_answer':
            const userAns = state.currentAnswer.toLowerCase();
            isCorrect = ex.interaction.acceptable_answers.some(a => a.toLowerCase() === userAns);
            msg = isCorrect ? '¡Correcto!' : 'No es la respuesta esperada';
            break;
            
        case 'ordering':
            const correctOrder = ex.interaction.correct_order;
            isCorrect = JSON.stringify(state.currentAnswer) === JSON.stringify(correctOrder);
            msg = isCorrect ? '¡Orden perfecto!' : 'El orden no es correcto';
            break;
            
        case 'grouping':
            const groupLists = document.querySelectorAll('.group-list');
            let allCorrect = true;
            groupLists.forEach(list => {
                const groupId = list.dataset.groupId;
                Array.from(list.children).forEach(item => {
                    if (item.dataset.group !== groupId) allCorrect = false;
                });
            });
            isCorrect = allCorrect;
            msg = isCorrect ? '¡Clasificación perfecta!' : 'Algunos elementos están mal clasificados';
            break;
    }
    
    // Actualizar puntuación solo si es la primera vez
    if (!alreadyGraded && isCorrect) {
        state.score += 100;
        state.streak++;
        state.graded[ex.id] = true;
        updateHUD();
        if (state.streak >= 3) triggerStreakConfetti();
    } else if (!alreadyGraded && !isCorrect) {
        state.streak = 0;
        state.graded[ex.id] = true;
    }
    
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
    
    ui.modal.classList.remove('hidden');
    setTimeout(() => {
        ui.modal.classList.add('show', isCorrect ? 'correct' : 'incorrect');
    }, 10);
    
    if (ui.feedbackIcon) {
        ui.feedbackIcon.className = isCorrect ? 'ph ph-check-circle-fill' : 'ph ph-x-circle-fill';
    }
    
    if (ui.feedbackTitle) {
        ui.feedbackTitle.textContent = msg;
    }
    
    let explanation = '';
    if (!isCorrect && scaffolding?.explanation) {
        explanation = scaffolding.explanation;
    } else if (isCorrect && scaffolding?.learn_more) {
        explanation = scaffolding.learn_more;
    }
    
    if (ui.feedbackText) {
        ui.feedbackText.textContent = explanation || (isCorrect ? '¡Sigue así!' : 'Revisa la pista si necesitas ayuda');
    }
    
    if (alreadyGraded && ui.feedbackText) {
        ui.feedbackText.textContent += ' (Ya realizado)';
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
    if (ui.themeSelect) {
        ui.themeSelect.addEventListener('change', (e) => {
            document.body.setAttribute('data-theme', e.target.value);
        });
    }
});
