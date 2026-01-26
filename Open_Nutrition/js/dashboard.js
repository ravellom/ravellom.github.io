// js/dashboard.js (v6.0 - Actualizado a Gemini 3)

const Dashboard = {
    chartInstance: null,
    
    suggestionsDB: {
        Desayuno: ["Avena con plátano y nueces", "Tostada integral con aguacate y huevo", "Yogur griego con frutos rojos", "Tortilla de espinacas"],
        Comida: ["Pechuga de pollo con quinoa", "Lentejas estofadas con verduras", "Salmón al horno con patata", "Ensalada de garbanzos y atún"],
        Merienda: ["Manzana con crema de cacahuete", "Un puñado de almendras", "Batido de proteína", "Zanahorias con hummus"],
        Cena: ["Filete de pescado blanco y ensalada", "Crema de calabacín y huevo duro", "Revuelto de setas", "Ensalada César con pollo"]
    },

    init: () => {
        const form = document.getElementById('foodForm');
        if (form) form.addEventListener('submit', (e) => { e.preventDefault(); Dashboard.addFood(); });

        const btnProcess = document.getElementById('btnProcessAI');
        if (btnProcess) btnProcess.addEventListener('click', Dashboard.processTextAI);

        const cameraInput = document.getElementById('cameraInput');
        if(cameraInput) cameraInput.addEventListener('change', Dashboard.handleImageUpload);
    },

    configureAPI: () => {
        const current = Store.getAPIKey() || "";
        const key = prompt("Introduce tu API Key de Google AI Studio:", current);
        if (key !== null) {
            Store.setAPIKey(key.trim());
            alert("API Key guardada.");
        }
    },

    handleImageUpload: async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const apiKey = Store.getAPIKey();
        if (!apiKey) {
            alert("⚠️ Configura primero tu API Key (engranaje).");
            return;
        }

        document.getElementById('manualAiInput').classList.add('hidden');
        document.getElementById('aiLoading').classList.remove('hidden');

        try {
            const base64Data = await Dashboard.fileToGenerativePart(file);
            const { GoogleGenerativeAI } = await import("@google/generative-ai");

            const genAI = new GoogleGenerativeAI(apiKey);
            
            // --- ACTUALIZACIÓN CRÍTICA SEGÚN TUS NOTAS ---
            // Usamos el modelo vigente a Enero 2026
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

            const prompt = "Analiza esta comida. Devuelve SOLO una lista de texto plano con este formato exacto:\nNombre: [Nombre corto]\nKcal: [número]\nProt: [número]\nGrasas: [número]\nCarbos: [número]";

            const result = await model.generateContent([prompt, base64Data]);
            const response = await result.response;
            const text = response.text();

            console.log("IA:", text);
            Dashboard.fillFromText(text);

        } catch (error) {
            console.error(error);
            alert(`Error IA: ${error.message}`);
        } finally {
            document.getElementById('aiLoading').classList.add('hidden');
            document.getElementById('manualAiInput').classList.remove('hidden');
            e.target.value = '';
        }
    },

    // ... (El resto del código se mantiene IGUAL que la versión v5.2 anterior) ...
    // Asegúrate de copiar las funciones fileToGenerativePart, fillFromText, etc.
    
    fileToGenerativePart: (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ inlineData: { data: reader.result.split(",")[1], mimeType: file.type } });
            reader.readAsDataURL(file);
        });
    },
    fillFromText: (text) => {
        const data = Utils.parseAI(text);
        let filled = 0;
        if(data.name) { Dashboard.fillField('inpName', data.name); filled++; }
        if(data.k)    { Dashboard.fillField('inpCal', data.k); filled++; }
        if(data.p)    { Dashboard.fillField('inpProt', data.p); filled++; }
        if(data.f)    { Dashboard.fillField('inpFat', data.f); filled++; }
        if(data.c)    { Dashboard.fillField('inpCarb', data.c); filled++; }
        if (filled === 0) alert("No pude leer los datos. Intenta otra foto.");
    },
    processTextAI: () => {
        const text = document.getElementById('aiInput').value;
        if (!text.trim()) { alert("Pega texto primero."); return; }
        Dashboard.fillFromText(text);
    },
    fillField: (id, val) => {
        const el = document.getElementById(id);
        if (el) { el.value = val; el.classList.add('bg-green-100'); setTimeout(()=>el.classList.remove('bg-green-100'), 500); }
    },
    copyPrompt: () => {
        if (navigator.clipboard) navigator.clipboard.writeText(Dashboard.aiPromptText).then(()=>alert("Copiado"));
        else prompt("Copia:", Dashboard.aiPromptText);
    },
    addFood: () => {
        const name = document.getElementById('inpName').value.trim();
        const cal = Number(document.getElementById('inpCal').value);
        if (!name || isNaN(cal)) { alert("Falta Nombre o Kcal"); return; }
        const select = document.getElementById('mealTypeSelect');
        let type = select ? select.value : 'Desayuno';
        if (type !== 'Merienda') {
            const exists = Store.getDayLogs().some(l => l.type === type);
            if(exists && !confirm(`Ya existe "${type}". ¿Añadir otro?`)) return;
        }
        if (type === 'Merienda') {
            const count = Store.getDayLogs().filter(l => l.type.startsWith('Merienda')).length;
            if (count > 0) type = `Merienda ${count + 1}`;
        }
        const getVal = (id) => Number(document.getElementById(id)?.value) || 0;
        Store.addLog({ type, name, k: cal, p: getVal('inpProt'), f: getVal('inpFat'), c: getVal('inpCarb') });
        document.getElementById('foodForm').reset();
        document.getElementById('aiInput').value = '';
        document.getElementById('suggestionsBox').classList.add('hidden');
        Dashboard.render();
    },
    render: (logs) => {
        const dataLogs = logs || Store.getDayLogs();
        const targets = Utils.calculateTargets(Store.data.profile);
        const totalKcal = dataLogs.reduce((sum, item) => sum + (Number(item.k)||0), 0);
        const remaining = targets.k - totalKcal;
        Dashboard.updateChart(totalKcal, targets.k);
        Dashboard.updateWeightUI();
        const lbl = document.getElementById('lblRemaining');
        const subLbl = document.getElementById('lblCaption');
        if (lbl) {
            lbl.innerText = totalKcal;
            if (remaining < 0) {
                lbl.classList.replace('text-slate-800', 'text-red-500');
                if(subLbl) { subLbl.innerText = `Exceso: ${Math.abs(remaining)}`; subLbl.classList.add('text-red-400'); subLbl.classList.remove('text-slate-400'); }
            } else {
                lbl.classList.replace('text-red-500', 'text-slate-800');
                if(subLbl) { subLbl.innerText = `Faltan: ${remaining}`; subLbl.classList.remove('text-red-400'); subLbl.classList.add('text-slate-400'); }
            }
        }
        const sumM = (k) => dataLogs.reduce((a,b)=>a+(Number(b[k])||0),0);
        const bars = document.getElementById('macroBars');
        if(bars) {
            bars.innerHTML = `
                ${Dashboard.macroBar('Proteínas', sumM('p'), targets.p, 'bg-purple-500')}
                ${Dashboard.macroBar('Grasas', sumM('f'), targets.f, 'bg-orange-400')}
                ${Dashboard.macroBar('Carbohidratos', sumM('c'), targets.c, 'bg-emerald-400')}
            `;
        }
        const wCount = document.getElementById('waterCount');
        if(wCount) wCount.innerText = Store.getWater();
        Dashboard.updateFastingTimer();
        Dashboard.updateRecommendations(dataLogs, targets);
        Dashboard.renderList(dataLogs);
    },
    updateWeightUI: () => {
        const input = document.getElementById('quickWeightInput');
        if(input) input.value = Store.getLastWeight();
    },
    saveQuickWeight: () => {
        const input = document.getElementById('quickWeightInput');
        const val = parseFloat(input.value);
        if(val && val > 0) {
            Store.addWeight(val);
            const btn = input.nextElementSibling;
            btn.classList.replace('bg-brand-blue', 'bg-green-500');
            setTimeout(() => { btn.classList.replace('bg-green-500', 'bg-brand-blue'); }, 1000);
            if(typeof Analytics !== 'undefined') Analytics.render();
        }
    },
    updateWater: (change) => {
        const current = Store.getWater();
        const newVal = Math.max(0, current + change);
        Store.setWater(newVal);
        const el = document.getElementById('waterCount');
        if(el) el.innerText = newVal;
        Dashboard.updateRecommendations();
    },
    toggleSuggestions: () => {
        const box = document.getElementById('suggestionsBox');
        const list = document.getElementById('suggestionsList');
        const type = document.getElementById('mealTypeSelect').value;
        if (box.classList.contains('hidden')) {
            box.classList.remove('hidden');
            const items = Dashboard.suggestionsDB[type] || Dashboard.suggestionsDB['Desayuno'];
            list.innerHTML = items.map(i => `<li>${i}</li>`).join('');
        } else { box.classList.add('hidden'); }
    },
    updateRecommendations: (logs, targets) => {
        const box = document.getElementById('smartRecommendation');
        const txt = document.getElementById('recommendationText');
        if(!box || !txt) return;
        const water = Store.getWater();
        const currentLogs = logs || Store.getDayLogs();
        const currentTargets = targets || Utils.calculateTargets(Store.data.profile);
        const totalP = currentLogs.reduce((a,b) => a+(Number(b.p)||0), 0);
        const totalKcal = currentLogs.reduce((a,b) => a+(Number(b.k)||0), 0);
        box.classList.remove('hidden');
        if (totalKcal > currentTargets.k) txt.innerText = "Has superado tu meta. Intenta cenar ligero.";
        else if (totalP < (currentTargets.p * 0.5) && totalKcal > (currentTargets.k * 0.6)) txt.innerText = "Proteína baja. Añade huevos o legumbres.";
        else if (water < 4) txt.innerText = "¡Hidrátate! Bebe un vaso ahora.";
        else if (totalKcal < (currentTargets.k * 0.2)) txt.innerText = "¡Buenos días! Carga energía.";
        else txt.innerText = "Vas genial. Mantén el ritmo.";
    },
    updateFastingTimer: () => {
        const el = document.getElementById('fastingTimer');
        if(!el) return;
        const last = Store.getLastMealTime();
        if (!last) { el.innerText = "--:--"; return; }
        const diff = Date.now() - last;
        const hrs = Math.floor(diff/3600000);
        const mins = Math.floor((diff%3600000)/60000);
        el.innerText = `${hrs}h ${mins}m`;
    },
    renderList: (logs) => {
        const container = document.getElementById('dayList');
        if(!container) return;
        if(!logs.length) { container.innerHTML = '<p class="text-center text-slate-300 py-4 text-sm">Sin comidas hoy</p>'; return; }
        const order = ['Desayuno', 'Comida', 'Merienda', 'Cena'];
        const sorted = [...logs].sort((a,b) => {
            let ia = order.indexOf(a.type.split(' ')[0]);
            let ib = order.indexOf(b.type.split(' ')[0]);
            if(ia<0) ia=2; if(ib<0) ib=2;
            return ia - ib;
        });
        container.innerHTML = sorted.map(l => `
            <div class="bg-white p-3 mb-2 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div class="overflow-hidden">
                    <span class="text-[10px] uppercase font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">${l.type}</span>
                    <p class="font-bold text-slate-700 text-sm mt-1 truncate">${l.name}</p>
                    <p class="text-[10px] text-slate-400">P:${l.p} G:${l.f} C:${l.c}</p>
                </div>
                <div class="flex items-center gap-2 pl-2">
                    <span class="font-bold text-slate-800 text-sm whitespace-nowrap">${l.k} kcal</span>
                    <button onclick="Main.deleteItem('${l.id}')" class="text-slate-300 hover:text-red-500 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },
    macroBar: (l, v, m, c) => `<div class="w-full"><div class="flex justify-between text-xs font-bold mb-1"><span class="text-slate-500">${l}</span><span class="text-slate-700">${Math.round(v)}/${m}g</span></div><div class="h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${c}" style="width:${Math.min(100,(v/m)*100)}%"></div></div></div>`,
    updateChart: (used, target) => {
        const ctx = document.getElementById('caloriesChart');
        if(!ctx) return;
        let color = '#2563eb'; let dataGraph = [];
        if (used > target) { color = '#ef4444'; dataGraph = [100, 0]; } else { dataGraph = [used, target - used]; }
        if(Dashboard.chartInstance) Dashboard.chartInstance.destroy();
        Dashboard.chartInstance = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: { labels: ['Consumido', 'Faltan'], datasets: [{ data: dataGraph, backgroundColor: [color, '#f1f5f9'], borderWidth: 0 }] },
            options: { cutout: '88%', responsive: true, maintainAspectRatio: false, plugins: { legend: false, tooltip: false }, animation: { animateScale: true } }
        });
    }
};