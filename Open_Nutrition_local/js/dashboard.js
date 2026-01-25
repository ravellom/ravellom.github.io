// js/dashboard.js
const Dashboard = {
    chartInstance: null,
    selectedType: 'Desayuno',

    init: () => {
        // Inicializar selector de comidas
        Dashboard.renderMealSelector();
        
        // Listener formulario
        document.getElementById('foodForm').addEventListener('submit', (e) => {
            e.preventDefault();
            Dashboard.addFood();
        });

        // Listener IA Input
        document.getElementById('aiInput').addEventListener('input', (e) => {
            const vals = Utils.parseAI(e.target.value);
            if(vals.k) document.getElementById('inpCal').value = vals.k;
            if(vals.p) document.getElementById('inpProt').value = vals.p;
            if(vals.f) document.getElementById('inpFat').value = vals.f;
            if(vals.c) document.getElementById('inpCarb').value = vals.c;
        });
    },

    renderMealSelector: () => {
        const types = ['Desayuno', 'Comida', 'Merienda', 'Cena'];
        const container = document.getElementById('mealTypeSelector');
        container.innerHTML = types.map(t => `
            <button onclick="Dashboard.setType('${t}')" 
                class="meal-btn px-4 py-1 rounded-full border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition whitespace-nowrap ${t === Dashboard.selectedType ? 'selected' : ''}">
                ${t}
            </button>
        `).join('');
    },

    setType: (type) => {
        Dashboard.selectedType = type;
        Dashboard.renderMealSelector();
    },

    addFood: () => {
        // Lógica de Merienda Incremental
        let finalType = Dashboard.selectedType;
        if (finalType === 'Merienda') {
            const snacksToday = Store.getDayLogs().filter(l => l.type.startsWith('Merienda')).length;
            finalType = `Merienda ${snacksToday + 1}`;
        }

        const log = {
            type: finalType,
            name: document.getElementById('inpName').value,
            k: Number(document.getElementById('inpCal').value),
            p: Number(document.getElementById('inpProt').value) || 0,
            f: Number(document.getElementById('inpFat').value) || 0,
            c: Number(document.getElementById('inpCarb').value) || 0
        };

        Store.addLog(log);
        document.getElementById('foodForm').reset();
        document.getElementById('aiInput').value = '';
        Dashboard.render(); // Re-renderizar todo
    },

    render: () => {
        const logs = Store.getDayLogs();
        const targets = Utils.calculateTargets(Store.data.profile);
        
        // Sumatorios
        const totals = logs.reduce((a, b) => ({ k: a.k+b.k, p: a.p+b.p, f: a.f+b.f, c: a.c+b.c }), {k:0, p:0, f:0, c:0});
        const remaining = Math.max(0, targets.k - totals.k);

        // 1. Gráfico Circular
        Dashboard.updateChart(totals.k, remaining);
        document.getElementById('lblRemaining').textContent = remaining;

        // 2. Barras Macros
        document.getElementById('macroBars').innerHTML = `
            ${Dashboard.macroBar('Proteína', totals.p, targets.p, 'bg-purple-500')}
            ${Dashboard.macroBar('Grasas', totals.f, targets.f, 'bg-orange-400')}
            ${Dashboard.macroBar('Carbos', totals.c, targets.c, 'bg-emerald-400')}
        `;

        // 3. Lista Agrupada por Comida (Orden: Desayuno, Comida, Meriendas, Cena)
        const order = ['Desayuno', 'Comida', 'Merienda', 'Cena'];
        // Orden custom para incluir meriendas dinámicas
        const sortedLogs = logs.sort((a,b) => {
            const getIdx = (t) => {
                if(t.startsWith('Merienda')) return 2; // Poner todas las meriendas en medio
                return order.indexOf(t);
            };
            return getIdx(a.type) - getIdx(b.type);
        });

        document.getElementById('dayList').innerHTML = sortedLogs.map(l => `
            <div class="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                    <span class="text-[10px] font-bold uppercase text-brand-blue bg-blue-50 px-2 py-0.5 rounded">${l.type}</span>
                    <p class="font-bold text-slate-700 leading-tight mt-1">${l.name}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">P:${l.p} G:${l.f} C:${l.c}</p>
                </div>
                <div class="text-right">
                    <span class="font-bold block">${l.k}</span>
                    <button onclick="Main.deleteItem('${l.id}')" class="text-red-300 hover:text-red-500 text-xs"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        `).join('') || '<p class="text-center text-slate-300 text-sm py-4">Sin registros hoy</p>';
    },

    macroBar: (label, val, max, color) => `
        <div>
            <div class="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>${label}</span><span>${val}/${max}g</span></div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${color}" style="width:${Math.min(100, (val/max)*100)}%"></div></div>
        </div>
    `,

    updateChart: (used, left) => {
        const ctx = document.getElementById('caloriesChart').getContext('2d');
        if(Dashboard.chartInstance) Dashboard.chartInstance.destroy();
        Dashboard.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Uso', 'Restante'], datasets: [{ data: [used, left], backgroundColor: ['#3b82f6', '#f1f5f9'], borderWidth: 0 }] },
            options: { cutout: '85%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
    }
};
