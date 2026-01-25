document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const appHeaderTitle = document.getElementById('app-title');
    const mainContainer = document.getElementById('content-area');
    const backBtn = document.getElementById('back-home-btn');

    // Estado de la app
    let currentData = null;

    // 1. INICIALIZACIÓN: Cargar el Home
    loadHome();

    // Evento volver al inicio
    backBtn.addEventListener('click', loadHome);

    // --- FUNCIONES DE NAVEGACIÓN ---

    function loadHome() {
        // Restaurar vista
        mainContainer.innerHTML = '';
        backBtn.style.display = 'none';
        appHeaderTitle.textContent = "Bachillerato: Lengua y Literatura";
        document.body.className = "home-mode";

        // Crear Grid de Unidades
        const grid = document.createElement('div');
        grid.className = 'units-grid';

        window.unitIndex.forEach(unit => {
            const card = document.createElement('div');
            card.className = 'unit-card';
            card.style.borderTop = `5px solid ${unit.color}`;
            card.innerHTML = `
                <div class="unit-icon">${unit.icon}</div>
                <h3>${unit.title}</h3>
                <p>${unit.subtitle}</p>
                <button class="start-btn">Entrar</button>
            `;
            
            card.onclick = () => loadUnit(unit.id);
            grid.appendChild(card);
        });

        mainContainer.appendChild(grid);
    }

    function loadUnit(unitId) {
        // Buscar los datos de la unidad seleccionada
        // NOTA: Asumimos que los archivos JS ya cargaron los datos en window.courseData_uXX
        const dataVarName = `courseData_${unitId}`;
        currentData = window[dataVarName];

        if (!currentData) {
            alert("Error: Datos de la unidad no encontrados. Asegúrate de que el archivo .js está enlazado en el index.html");
            return;
        }

        // Cambiar vista
        backBtn.style.display = 'block';
        appHeaderTitle.textContent = currentData.title;
        document.body.className = "unit-mode";
        
        // Renderizar el layout de la unidad (Menú lateral + contenido)
        renderUnitLayout();
    }

    // --- LÓGICA DE UNIDAD (La que ya tenías, adaptada) ---

    function renderUnitLayout() {
        mainContainer.innerHTML = `
            <div class="unit-container">
                <aside class="sidebar">
                    <div id="unit-menu"></div>
                </aside>
                <section class="exercise-area" id="exercise-panel">
                    <div class="welcome-msg">
                        <h2>${currentData.title}</h2>
                        <p>Selecciona un apartado del menú para comenzar.</p>
                        <div style="font-size:3rem; margin-top:20px">${window.unitIndex.find(u => u.id === currentData.id).icon}</div>
                    </div>
                </section>
            </div>
        `;

        const menu = document.getElementById('unit-menu');
        
        currentData.sections.forEach((sec, index) => {
            const btn = document.createElement('div');
            btn.className = 'menu-item';
            btn.innerHTML = `<span>${sec.icon}</span> ${sec.title}`;
            btn.onclick = () => loadSection(index);
            menu.appendChild(btn);
        });
    }

    function loadSection(index) {
        const section = currentData.sections[index];
        const panel = document.getElementById('exercise-panel');
        
        // Mezclar ejercicios
        const activities = [...section.activities].sort(() => Math.random() - 0.5);
        
        let currentActIdx = 0;

        function renderActivity() {
            if (currentActIdx >= activities.length) {
                panel.innerHTML = `
                    <div class="card completed">
                        <h2>¡Sección Completada! 🎉</h2>
                        <p>Has repasado: ${section.title}</p>
                        <button class="check-btn" onclick="document.querySelector('.menu-item').click()">Repetir</button>
                    </div>`;
                confetti();
                return;
            }

            const act = activities[currentActIdx];
            
            panel.innerHTML = '';
            const card = document.createElement('div');
            card.className = 'card';
            
            // Header Card
            card.innerHTML = `
                <div class="progress-text">Ejercicio ${currentActIdx + 1} / ${activities.length}</div>
                <div class="question-title">${act.question}</div>
                <div id="act-container"></div>
                <div id="feedback" class="feedback-box"></div>
            `;
            
            panel.appendChild(card);
            
            const container = card.querySelector('#act-container');
            const feedbackBox = card.querySelector('#feedback');

            // Renderizar según tipo
            if (act.type === 'choice' || act.type === 'binary') renderChoice(act, container, feedbackBox, nextStep);
            if (act.type === 'sort') renderSort(act, container, feedbackBox, nextStep);
            if (act.type === 'match') renderMatch(act, container, feedbackBox, nextStep);
        }

        function nextStep() {
            currentActIdx++;
            renderActivity();
        }

        // Highlight menú
        document.querySelectorAll('.menu-item').forEach((b, i) => {
            b.classList.toggle('active', i === index);
        });

        renderActivity();
    }

    // --- RENDERIZADORES ESPECÍFICOS (Reutilizables) ---
    // Son iguales que antes, pero pasándoles la función 'nextStep' para avanzar

    function renderChoice(act, container, fbBox, onNext) {
        const opts = act.type === 'binary' 
            ? (act.isTrue ? ["Verdadero", "Falso"] : ["Falso", "Verdadero"]) 
            : act.options;
        const correctIdx = act.type === 'binary' ? (act.isTrue ? 0 : 1) : act.correct;

        opts.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'btn-option';
            btn.textContent = opt;
            btn.onclick = () => {
                if (container.classList.contains('locked')) return;
                container.classList.add('locked');

                const isCorrect = i === correctIdx;
                btn.classList.add(isCorrect ? 'correct' : 'wrong');
                if (!isCorrect) container.children[correctIdx].classList.add('correct');

                showFeedback(fbBox, act.feedback, isCorrect, onNext);
            };
            container.appendChild(btn);
        });
    }

    function renderSort(act, container, fbBox, onNext) {
        const items = [...act.items].sort(() => Math.random() - 0.5);
        items.forEach(txt => {
            const el = document.createElement('div');
            el.className = 'sort-item';
            el.textContent = txt;
            el.dataset.val = txt;
            container.appendChild(el);
        });
        
        new Sortable(container, { animation: 150 });

        const btn = document.createElement('button');
        btn.className = 'check-btn';
        btn.textContent = 'Comprobar';
        btn.onclick = () => {
            const current = [...container.children].map(c => c.dataset.val);
            const isCorrect = JSON.stringify(current) === JSON.stringify(act.items);
            if(isCorrect) {
                btn.style.display = 'none';
                showFeedback(fbBox, act.feedback, true, onNext);
            } else {
                alert("Orden incorrecto");
            }
        };
        container.parentElement.appendChild(btn);
    }

    function renderMatch(act, container, fbBox, onNext) {
        // Lógica de matching idéntica a la versión anterior...
        // (Abreviado aquí para no hacer el código infinito, usa la lógica del paso anterior
        // pero asegúrate de llamar a showFeedback(fbBox, act.feedback, true, onNext) al final)
        const grid = document.createElement('div');
        grid.className = 'match-grid';
        
        const colLeft = document.createElement('div'); colLeft.className = 'match-col';
        const colRight = document.createElement('div'); colRight.className = 'match-col';
        
        const leftItems = act.pairs.map((p, i) => ({ id: i, text: p.left }));
        const rightItems = act.pairs.map((p, i) => ({ id: i, text: p.right })).sort(() => Math.random() - 0.5);

        let selectedLeft = null;
        let matchesFound = 0;

        function createBtn(item, isLeft) {
            const btn = document.createElement('div');
            btn.className = 'match-item';
            btn.textContent = item.text;
            btn.dataset.id = item.id;
            
            btn.onclick = () => {
                if(btn.classList.contains('matched')) return;
                if (isLeft) {
                    if (selectedLeft) selectedLeft.classList.remove('selected');
                    selectedLeft = btn;
                    btn.classList.add('selected');
                } else {
                    if (!selectedLeft) return;
                    if (selectedLeft.dataset.id === btn.dataset.id) {
                        selectedLeft.classList.add('matched');
                        btn.classList.add('matched');
                        selectedLeft = null;
                        matchesFound++;
                        if (matchesFound === act.pairs.length) {
                             showFeedback(fbBox, act.feedback, true, onNext);
                             confetti();
                        }
                    } else {
                        btn.classList.add('wrong-match');
                        selectedLeft.classList.add('wrong-match');
                        setTimeout(() => {
                            btn.classList.remove('wrong-match');
                            selectedLeft.classList.remove('wrong-match');
                        }, 500);
                    }
                }
            };
            return btn;
        }
        
        leftItems.forEach(it => colLeft.appendChild(createBtn(it, true)));
        rightItems.forEach(it => colRight.appendChild(createBtn(it, false)));
        grid.append(colLeft, colRight);
        container.appendChild(grid);
    }

    function showFeedback(box, text, isCorrect, nextCallback) {
        box.innerHTML = `
            <div style="font-weight:bold; color:${isCorrect ? 'var(--success)' : 'var(--error)'}">
                ${isCorrect ? '¡Correcto!' : 'Respuesta Incorrecta'}
            </div>
            <div style="margin:10px 0; color:#555">${text}</div>
            <button class="check-btn">Siguiente ➜</button>
        `;
        box.style.display = 'block';
        box.querySelector('button').onclick = nextCallback;
        if(isCorrect) confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
});