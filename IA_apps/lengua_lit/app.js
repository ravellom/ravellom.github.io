document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar Datos
    const data = window.courseData;
    if (!data) return alert("Error: No se ha cargado el archivo de datos.");

    document.getElementById('course-title').textContent = data.title;
    const menu = document.getElementById('menu-list');
    const content = document.getElementById('content-area');
    
    // 2. Renderizar Menú
    data.sections.forEach((sec, index) => {
        const li = document.createElement('div');
        li.className = 'menu-item';
        li.innerHTML = `${sec.icon} ${sec.title}`;
        li.onclick = () => loadSection(index);
        menu.appendChild(li);
    });

    let currentSection = null;
    let currentActivityIndex = 0;

    function loadSection(index) {
        currentSection = data.sections[index];
        currentSection.activities.sort(() => Math.random() - 0.5);
        currentActivityIndex = 0;
        
        // Highlight menu
        document.querySelectorAll('.menu-item').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });

        loadActivity();
    }

    function loadActivity() {
        const act = currentSection.activities[currentActivityIndex];
        content.innerHTML = ''; // Limpiar

        const card = document.createElement('div');
        card.className = 'card';
        
        // Barra de progreso
        const progress = document.createElement('div');
        progress.style.marginBottom = '15px';
        progress.style.color = '#888';
        progress.style.fontSize = '0.9rem';
        progress.textContent = `Ejercicio ${currentActivityIndex + 1} de ${currentSection.activities.length}`;
        card.appendChild(progress);

        // Título
        const title = document.createElement('div');
        title.className = 'question-title';
        title.textContent = act.question;
        card.appendChild(title);

        // Renderizar según tipo
        const container = document.createElement('div');
        container.id = 'activity-container';
        card.appendChild(container);

        if (act.type === 'choice' || act.type === 'binary') renderChoice(act, container);
        if (act.type === 'sort') renderSort(act, container);
        if (act.type === 'match') renderMatch(act, container);

        // Feedback Area
        const fbBox = document.createElement('div');
        fbBox.className = 'feedback-box';
        fbBox.id = 'feedback';
        card.appendChild(fbBox);

        // Botón Siguiente (oculto al principio)
        const nextBtn = document.createElement('button');
        nextBtn.className = 'check-btn';
        nextBtn.textContent = 'Siguiente ➜';
        nextBtn.style.display = 'none';
        nextBtn.style.background = '#2d3436';
        nextBtn.onclick = () => {
            currentActivityIndex++;
            if (currentActivityIndex < currentSection.activities.length) {
                loadActivity();
            } else {
                content.innerHTML = `<div class="card" style="text-align:center"><h2>¡Sección Completada! 🎉</h2><p>Has repasado todo este tema.</p></div>`;
                confetti();
            }
        };
        fbBox.appendChild(nextBtn); // Añadir botón dentro del feedback para que aparezca junto

        content.appendChild(card);
    }

    // --- RENDERIZADORES ---

    function showFeedback(text, isCorrect) {
        const fb = document.getElementById('feedback');
        const nextBtn = fb.querySelector('button');
        
        fb.innerHTML = `<strong>${isCorrect ? '¡Correcto!' : 'Ojo...'}</strong><br>${text}`;
        fb.style.display = 'block';
        fb.style.borderColor = isCorrect ? 'var(--success)' : 'var(--error)';
        
        fb.appendChild(nextBtn);
        nextBtn.style.display = 'block';
    }

    function renderChoice(act, container) {
        const opts = act.type === 'binary' 
            ? (act.isTrue ? ["Verdadero", "Falso"] : ["Falso", "Verdadero"]) // Truco visual, pero lógica abajo
            : act.options;
            
        // Si es binario, ajustamos opciones fijas para simplificar
        const finalOptions = act.type === 'binary' ? ["Verdadero", "Falso"] : act.options;
        const correctIndex = act.type === 'binary' ? (act.isTrue ? 0 : 1) : act.correct;

        finalOptions.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'btn-option';
            btn.textContent = opt;
            btn.onclick = () => {
                if (container.classList.contains('answered')) return;
                container.classList.add('answered');
                
                if (i === correctIndex) {
                    btn.classList.add('correct');
                    showFeedback(act.feedback, true);
                    if(act.type !== 'binary') confetti({ particleCount: 50, spread: 60 });
                } else {
                    btn.classList.add('wrong');
                    // Marcar la correcta
                    container.children[correctIndex].classList.add('correct');
                    showFeedback(act.feedback, false);
                }
            };
            container.appendChild(btn);
        });
    }

    function renderSort(act, container) {
        // Mezclar aleatoriamente
        const shuffled = [...act.items].sort(() => Math.random() - 0.5);
        
        shuffled.forEach(item => {
            const el = document.createElement('div');
            el.className = 'sort-item';
            el.textContent = item;
            el.dataset.val = item;
            container.appendChild(el);
        });

        // Activar SortableJS
        new Sortable(container, { animation: 150 });

        const btnCheck = document.createElement('button');
        btnCheck.className = 'check-btn';
        btnCheck.textContent = 'Comprobar Orden';
        btnCheck.onclick = () => {
            const currentOrder = [...container.children].map(c => c.dataset.val);
            const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(act.items);
            
            if (isCorrect) {
                btnCheck.style.display = 'none';
                showFeedback(act.feedback, true);
                confetti();
            } else {
                alert("El orden no es correcto. Inténtalo de nuevo.");
            }
        };
        container.parentNode.appendChild(btnCheck);
    }

    function renderMatch(act, container) {
        const grid = document.createElement('div');
        grid.className = 'match-grid';
        
        const colLeft = document.createElement('div'); colLeft.className = 'match-col';
        const colRight = document.createElement('div'); colRight.className = 'match-col';
        
        // Aleatorizar
        const leftItems = act.pairs.map((p, i) => ({ id: i, text: p.left }));
        const rightItems = act.pairs.map((p, i) => ({ id: i, text: p.right })).sort(() => Math.random() - 0.5);

        let selectedLeft = null;

        function createBtn(item, isLeft) {
            const btn = document.createElement('div');
            btn.className = 'match-item';
            btn.textContent = item.text;
            btn.dataset.id = item.id;
            
            btn.onclick = () => {
                if(btn.classList.contains('matched')) return;

                if (isLeft) {
                    // Seleccionar izquierda
                    if (selectedLeft) selectedLeft.classList.remove('selected');
                    selectedLeft = btn;
                    btn.classList.add('selected');
                } else {
                    // Seleccionar derecha (intento de match)
                    if (!selectedLeft) return;
                    
                    if (selectedLeft.dataset.id === btn.dataset.id) {
                        // Acierto
                        selectedLeft.classList.add('matched');
                        btn.classList.add('matched');
                        selectedLeft = null;
                        
                        // Verificar si terminamos
                        if (document.querySelectorAll('.match-item.matched').length === act.pairs.length * 2) {
                            showFeedback(act.feedback, true);
                            confetti();
                        }
                    } else {
                        // Error visual
                        btn.style.borderColor = 'red';
                        selectedLeft.style.borderColor = 'red';
                        setTimeout(() => {
                            btn.style.borderColor = '#eee';
                            if(selectedLeft) selectedLeft.style.borderColor = '#eee';
                        }, 500);
                    }
                }
            };
            return btn;
        }

        leftItems.forEach(it => colLeft.appendChild(createBtn(it, true)));
        rightItems.forEach(it => colRight.appendChild(createBtn(it, false)));

        grid.appendChild(colLeft);
        grid.appendChild(colRight);
        container.appendChild(grid);
    }
});