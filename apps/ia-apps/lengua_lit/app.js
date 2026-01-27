document.addEventListener('DOMContentLoaded', () => {
    // Configuración inicial
    const appTitle = document.getElementById('app-title');
    const mainContainer = document.getElementById('main-container');
    const backBtn = document.getElementById('back-home-btn');
    
    // Iconos para tipos de ejercicios (FontAwesome)
    const icons = {
        choice: '<i class="fa-solid fa-list-ul"></i>',
        binary: '<i class="fa-solid fa-toggle-on"></i>',
        sort: '<i class="fa-solid fa-arrow-down-short-wide"></i>',
        match: '<i class="fa-solid fa-puzzle-piece"></i>'
    };

    let currentData = null;

    loadHome();

    // Event Listeners
    backBtn.addEventListener('click', loadHome);

    // --- HOME ---
    function loadHome() {
        mainContainer.innerHTML = '';
        backBtn.classList.add('hidden');
        if(appTitle) appTitle.textContent = "PLATAFORMA DE REPASO";
        
        const container = document.createElement('div');
        container.className = "w-full h-full overflow-y-auto p-4 md:p-6 bg-gray-50";
        
        const grid = document.createElement('div');
        grid.className = "max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

        if(window.unitIndex) {
            window.unitIndex.forEach(unit => {
                const card = document.createElement('div');
                card.className = "bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100 overflow-hidden group relative";
                card.onclick = () => loadUnit(unit.id);

                card.innerHTML = `
                    <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${unit.color || '#6c5ce7'}"></div>
                    <div class="p-6 md:p-8 flex flex-col items-center text-center h-full">
                        <div class="text-5xl mb-5 group-hover:scale-110 transition duration-300 filter drop-shadow-sm">${unit.icon}</div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${unit.title}</h3>
                        <p class="text-sm text-gray-500 mb-6 flex-grow">${unit.subtitle || ''}</p>
                        <span class="inline-flex items-center text-brand font-bold text-sm bg-indigo-50 px-4 py-2 rounded-full group-hover:bg-brand group-hover:text-white transition">
                            Entrar <i class="fa-solid fa-arrow-right ml-2"></i>
                        </span>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
        container.appendChild(grid);
        mainContainer.appendChild(container);
    }

    // --- CARGAR UNIDAD ---
    function loadUnit(unitId) {
        const dataVar = `courseData_${unitId}`;
        currentData = window[dataVar];
        
        if (!currentData) return alert("Datos no encontrados. Verifica los archivos JS.");

        backBtn.classList.remove('hidden');
        if(appTitle) appTitle.textContent = currentData.title;

        mainContainer.innerHTML = `
            <div class="flex h-full w-full relative overflow-hidden">
                <aside class="absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 w-72 bg-white border-r border-gray-200 z-30 transition-transform duration-300 flex flex-col shadow-xl md:shadow-none" id="sidebar">
                    <div class="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 class="font-bold text-gray-700 text-xs uppercase tracking-widest">Contenido</h2>
                        <button class="md:hidden text-gray-500" onclick="document.getElementById('sidebar').classList.add('-translate-x-full')">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="overflow-y-auto flex-1 p-3 space-y-1" id="unit-menu"></div>
                </aside>
                
                <button onclick="document.getElementById('sidebar').classList.remove('-translate-x-full')" class="md:hidden absolute bottom-6 right-6 z-40 bg-brand text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-brand-dark transition">
                    <i class="fa-solid fa-bars text-xl"></i>
                </button>

                <section class="flex-1 bg-gray-100 h-full overflow-y-auto p-4 md:p-8 w-full" id="exercise-panel">
                    <div class="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto animate-fade-in">
                        <div class="text-7xl mb-6 text-brand opacity-80">${window.unitIndex.find(u => u.id === unitId).icon}</div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-3">¡Bienvenida!</h2>
                        <p class="text-gray-500 text-lg mb-8">Selecciona un bloque del menú lateral para empezar.</p>
                    </div>
                </section>
            </div>
        `;

        renderMenu();
    }

    function renderMenu() {
        const menu = document.getElementById('unit-menu');
        currentData.sections.forEach((sec, idx) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-brand font-medium transition flex items-center gap-3 text-sm group";
            btn.innerHTML = `
                <span class="text-lg w-8 text-center group-hover:scale-110 transition">${sec.icon}</span> 
                <span class="flex-1">${sec.title}</span>
                <i class="fa-solid fa-chevron-right text-xs opacity-0 group-hover:opacity-100 transition transform translate-x-[-10px] group-hover:translate-x-0"></i>
            `;
            btn.onclick = () => {
                document.getElementById('sidebar').classList.add('-translate-x-full'); // Cerrar en móvil
                loadSection(idx);
            };
            menu.appendChild(btn);
        });
    }

    // --- CARGAR SECCIÓN ---
    function loadSection(index) {
        // Highlight active menu
        const menuBtns = document.getElementById('unit-menu').children;
        Array.from(menuBtns).forEach((b, i) => {
            if (i === index) {
                b.className = "w-full text-left px-4 py-3 rounded-xl bg-brand text-white shadow-md font-bold transition flex items-center gap-3 text-sm";
                b.innerHTML = b.innerHTML.replace('text-gray-600', 'text-white'); // Ajuste rápido color icono
            } else {
                b.className = "w-full text-left px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-brand font-medium transition flex items-center gap-3 text-sm group";
            }
        });

        const section = currentData.sections[index];
        const panel = document.getElementById('exercise-panel');
        
        // Mezclar aleatoriamente
        const activities = [...section.activities].sort(() => Math.random() - 0.5);
        let currentIdx = 0;

        function renderActivity() {
            panel.innerHTML = ''; 

            // Pantalla Fin de Sección
            if (currentIdx >= activities.length) {
                panel.innerHTML = `
                    <div class="max-w-2xl mx-auto mt-10 bg-white rounded-3xl shadow-xl p-10 text-center border-t-8 border-green-400 animate-slide-up">
                        <div class="text-6xl mb-6">🏆</div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">¡Sección Completada!</h2>
                        <p class="text-gray-500 mb-8 text-lg">Has repasado: <strong>${section.title}</strong></p>
                        <div class="flex justify-center gap-4">
                            <button onclick="loadSection(${index})" class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Repetir</button>
                        </div>
                    </div>`;
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                return;
            }

            const act = activities[currentIdx];
            const progress = ((currentIdx + 1) / activities.length) * 100;

            // --- TARJETA DEL EJERCICIO ---
            const card = document.createElement('div');
            card.className = "max-w-3xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col min-h-[500px] animate-fade-in relative";
            
            card.innerHTML = `
                <div class="w-full bg-gray-100 h-1.5">
                    <div class="bg-brand h-1.5 transition-all duration-500 shadow-[0_0_10px_rgba(108,92,231,0.5)]" style="width: ${progress}%"></div>
                </div>

                <div class="p-6 md:p-10 flex-1 flex flex-col relative">
                    <div class="flex justify-between items-start mb-6">
                        <div class="flex items-center gap-2">
                            <span class="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                ${icons[act.type] || ''} Ejercicio ${currentIdx + 1}/${activities.length}
                            </span>
                        </div>
                        
                        <button id="skip-btn" class="text-gray-400 hover:text-gray-600 text-sm font-semibold hover:bg-gray-100 px-3 py-1 rounded-lg transition flex items-center gap-1" title="Saltar este ejercicio">
                            Saltar <i class="fa-solid fa-forward"></i>
                        </button>
                    </div>

                    <h3 class="text-xl md:text-2xl font-bold text-gray-800 mb-8 leading-snug">${act.question}</h3>
                    
                    <div id="act-container" class="w-full space-y-3 mb-8 flex-1"></div>
                    
                    <div id="feedback" class="hidden bg-white rounded-2xl p-6 border-2 shadow-inner animate-scale-in"></div>
                </div>
            `;

            panel.appendChild(card);

            // Lógica del Botón Saltar
            const skipBtn = card.querySelector('#skip-btn');
            skipBtn.onclick = () => {
                nextStep(); // Simplemente avanza sin validar
            };
            
            const container = card.querySelector('#act-container');
            const fbBox = card.querySelector('#feedback');
            
            if (act.type === 'choice' || act.type === 'binary') renderChoice(act, container, fbBox, nextStep, skipBtn);
            if (act.type === 'sort') renderSort(act, container, fbBox, nextStep, skipBtn);
            if (act.type === 'match') renderMatch(act, container, fbBox, nextStep, skipBtn);
        }

        function nextStep() {
            currentIdx++;
            renderActivity();
        }

        renderActivity();
    }

    // --- RENDERIZADORES ---

    function renderChoice(act, container, fbBox, onNext, skipBtn) {
        const opts = act.type === 'binary' 
            ? (act.isTrue ? ["Verdadero", "Falso"] : ["Falso", "Verdadero"]) 
            : act.options;
        const correctIdx = act.type === 'binary' ? (act.isTrue ? 0 : 1) : act.correct;

        opts.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left p-5 rounded-2xl border-2 border-gray-100 bg-white hover:border-brand hover:bg-indigo-50/50 font-medium text-gray-700 transition-all flex items-center group relative overflow-hidden";
            btn.innerHTML = `
                <div class="w-6 h-6 rounded-full border-2 border-gray-300 mr-4 flex items-center justify-center group-hover:border-brand transition-colors shrink-0">
                    <div class="w-2.5 h-2.5 rounded-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div> 
                <span class="z-10">${opt}</span>
            `;
            
            btn.onclick = () => {
                if (container.classList.contains('pointer-events-none')) return;
                container.classList.add('pointer-events-none');
                skipBtn.style.display = 'none'; // Ocultar saltar al contestar

                const isCorrect = i === correctIdx;
                
                if (isCorrect) {
                    btn.classList.remove('border-gray-100', 'hover:border-brand');
                    btn.classList.add('border-green-500', 'bg-green-50', 'text-green-800');
                    btn.querySelector('.w-6').outerHTML = '<i class="fa-solid fa-circle-check text-green-500 text-xl mr-4 shrink-0"></i>';
                } else {
                    btn.classList.remove('border-gray-100', 'hover:border-brand');
                    btn.classList.add('border-red-500', 'bg-red-50', 'text-red-800');
                    btn.querySelector('.w-6').outerHTML = '<i class="fa-solid fa-circle-xmark text-red-500 text-xl mr-4 shrink-0"></i>';
                    
                    // Marcar correcta
                    const correctBtn = container.children[correctIdx];
                    correctBtn.classList.add('border-green-500', 'text-green-800', 'opacity-60');
                    correctBtn.innerHTML += ' <span class="ml-auto text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded">Solución</span>';
                }

                showFeedback(fbBox, act.feedback, isCorrect, onNext);
            };
            container.appendChild(btn);
        });
    }

    function renderSort(act, container, fbBox, onNext, skipBtn) {
        const items = [...act.items].sort(() => Math.random() - 0.5);
        items.forEach(txt => {
            const el = document.createElement('div');
            el.className = "bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing flex items-center font-medium text-gray-700 select-none hover:border-gray-300 transition";
            el.innerHTML = `<i class="fa-solid fa-grip-vertical text-gray-300 mr-4"></i> ${txt}`;
            el.dataset.val = txt;
            container.appendChild(el);
        });

        new Sortable(container, { animation: 150, ghostClass: 'bg-indigo-50' });

        const btn = document.createElement('button');
        btn.className = "w-full mt-6 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition shadow-lg flex justify-center items-center gap-2";
        btn.innerHTML = 'Comprobar <i class="fa-solid fa-check"></i>';
        btn.onclick = () => {
            const current = [...container.children].map(c => c.dataset.val);
            const isCorrect = JSON.stringify(current) === JSON.stringify(act.items);
            if(isCorrect) {
                btn.classList.add('hidden');
                skipBtn.style.display = 'none';
                showFeedback(fbBox, act.feedback, true, onNext);
            } else {
                container.classList.add('animate-shake');
                setTimeout(() => container.classList.remove('animate-shake'), 500);
            }
        };
        container.parentElement.appendChild(btn);
    }

    function renderMatch(act, container, fbBox, onNext, skipBtn) {
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";
        
        const colLeft = document.createElement('div'); colLeft.className = "space-y-3";
        const colRight = document.createElement('div'); colRight.className = "space-y-3";
        
        const leftItems = act.pairs.map((p, i) => ({ id: i, text: p.left }));
        const rightItems = act.pairs.map((p, i) => ({ id: i, text: p.right })).sort(() => Math.random() - 0.5);

        let selectedLeft = null;
        let matches = 0;

        function createBtn(item, isLeft) {
            const btn = document.createElement('div');
            btn.className = "p-4 bg-white border-2 border-gray-100 rounded-xl cursor-pointer hover:border-gray-300 transition text-sm md:text-base font-medium flex items-center justify-center text-center min-h-[5rem] shadow-sm";
            btn.textContent = item.text;
            btn.dataset.id = item.id;
            
            btn.onclick = () => {
                if(btn.classList.contains('opacity-20')) return;

                if (isLeft) {
                    if (selectedLeft) selectedLeft.classList.remove('border-brand', 'bg-indigo-50', 'text-brand', 'shadow-md');
                    selectedLeft = btn;
                    btn.classList.add('border-brand', 'bg-indigo-50', 'text-brand', 'shadow-md');
                } else {
                    if (!selectedLeft) return;
                    if (selectedLeft.dataset.id === btn.dataset.id) {
                        // Match
                        selectedLeft.classList.add('opacity-20', 'pointer-events-none', 'border-green-500');
                        btn.classList.add('opacity-20', 'pointer-events-none', 'border-green-500');
                        selectedLeft = null;
                        matches++;
                        if (matches === act.pairs.length) {
                             skipBtn.style.display = 'none';
                             showFeedback(fbBox, act.feedback, true, onNext);
                             confetti({ origin: { y: 0.7 } });
                        }
                    } else {
                        // Error visual
                        btn.classList.add('bg-red-50', 'border-red-300', 'animate-shake');
                        selectedLeft.classList.add('bg-red-50', 'border-red-300', 'animate-shake');
                        setTimeout(() => {
                            btn.classList.remove('bg-red-50', 'border-red-300', 'animate-shake');
                            if(selectedLeft) selectedLeft.classList.remove('bg-red-50', 'border-red-300', 'animate-shake', 'border-brand', 'bg-indigo-50', 'text-brand', 'shadow-md');
                            selectedLeft = null;
                        }, 600);
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
        box.classList.remove('hidden');
        box.classList.add(isCorrect ? 'border-green-100' : 'border-red-100');
        
        box.innerHTML = `
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                        <i class="fa-solid ${isCorrect ? 'fa-thumbs-up' : 'fa-lightbulb'} text-lg"></i>
                    </div>
                    <h4 class="font-bold text-lg ${isCorrect ? 'text-green-800' : 'text-red-800'}">
                        ${isCorrect ? '¡Excelente!' : 'Repasemos esto...'}
                    </h4>
                </div>
                <div class="text-gray-600 leading-relaxed pl-1">
                    ${text}
                </div>
                <button id="next-q-btn" class="w-full mt-2 bg-gray-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-black transition transform active:scale-95 flex justify-center items-center gap-2">
                    Continuar <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;
        
        box.querySelector('#next-q-btn').onclick = nextCallback;
        
        // Scroll suave hacia abajo
        setTimeout(() => {
            box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
});