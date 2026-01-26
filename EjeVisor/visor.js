/* * VISOR.JS - Versión Completa con 6 Tipologías * */

let state = {
    exercises: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    currentAnswer: null
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
    modal: document.getElementById('feedback-overlay'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackText: document.getElementById('feedback-text'),
    feedbackIcon: document.getElementById('feedback-icon'),
    themeSelect: document.getElementById('theme-select')
};

// Listeners
document.getElementById('drop-zone').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', loadFile);
ui.btnCheck.addEventListener('click', checkAnswer);
ui.btnNext.addEventListener('click', nextExercise);
ui.themeSelect.addEventListener('change', (e) => document.body.setAttribute('data-theme', e.target.value));

function loadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            initGame(data.exercises);
        } catch (err) { alert('Error JSON: ' + err.message); }
    };
    reader.readAsText(file);
}

function initGame(exercises) {
    state.exercises = exercises;
    state.currentIndex = 0;
    state.score = 0;
    state.streak = 0;
    updateHUD();
    showScreen('game');
    renderCurrentExercise();
}

function renderCurrentExercise() {
    resetUI();
    const ex = state.exercises[state.currentIndex];
    
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
    ui.btnCheck.disabled = true;
    ui.btnCheck.style.opacity = "0.5";
    state.currentAnswer = null;
}

window.selectOption = (id, btn) => {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.currentAnswer = id;
    enableCheck();
};

function enableCheck() {
    ui.btnCheck.disabled = false;
    ui.btnCheck.style.opacity = "1";
}

function checkAnswer() {
    const ex = state.exercises[state.currentIndex];
    let isCorrect = false;
    let msg = "";

    // LÓGICA DE VALIDACIÓN

    if (ex.type === 'multiple_choice' || ex.type === 'true_false') {
        const opt = ex.interaction.options.find(o => o.id === state.currentAnswer);
        isCorrect = opt && opt.is_correct;
        msg = opt ? (opt.feedback || (isCorrect ? "¡Correcto!" : "Incorrecto")) : "Elige una opción";
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

    showFeedback(isCorrect, msg, ex.scaffolding?.explanation);
}

function showFeedback(isCorrect, msg, explanation) {
    ui.modal.classList.remove('hidden');
    setTimeout(() => {
        ui.modal.classList.add('show');
        ui.modal.classList.add(isCorrect ? 'correct' : 'incorrect');
    }, 10);

    ui.feedbackTitle.innerText = isCorrect ? "¡Excelente!" : "Vaya...";
    ui.feedbackIcon.className = isCorrect ? "ph ph-check-circle" : "ph ph-warning-circle";
    ui.feedbackIcon.style.color = isCorrect ? "var(--success)" : "var(--error)";
    ui.feedbackText.innerHTML = `${msg}<br><small style="color:#666; margin-top:5px; display:block;">${explanation || ''}</small>`;

    if (isCorrect) {
        state.score += 100 + (state.streak * 20);
        state.streak++;
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    } else {
        state.streak = 0;
    }
    updateHUD();
}

function nextExercise() {
    state.currentIndex++;
    if (state.currentIndex < state.exercises.length) {
        renderCurrentExercise();
    } else {
        showScreen('results');
        document.getElementById('final-xp').innerText = state.score;
        triggerFinalConfetti();
    }
}

function updateHUD() {
    ui.score.innerText = state.score;
    ui.streak.innerText = state.streak;
    const pct = ((state.currentIndex) / state.exercises.length) * 100;
    ui.progressBar.style.width = `${pct}%`;
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