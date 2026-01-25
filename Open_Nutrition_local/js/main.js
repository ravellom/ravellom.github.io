// js/main.js (Versión Diagnóstico v3.3)

const Main = {
    init: () => {
        console.log("🚀 Iniciando Open Nutrition...");
        
        try {
            // 1. CHEQUEO DE DEPENDENCIAS (Diagnóstico)
            if (typeof Utils === 'undefined') throw new Error("Error: El archivo 'utils.js' no se ha cargado.");
            if (typeof Store === 'undefined') throw new Error("Error: El archivo 'store.js' no se ha cargado.");
            if (typeof Dashboard === 'undefined') throw new Error("Error: El archivo 'dashboard.js' tiene un error de sintaxis.");
            
            // 2. INICIALIZAR LIBRERÍAS
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            // 3. INICIALIZAR MÓDULOS
            Dashboard.init();
            if (typeof Analytics !== 'undefined') Analytics.init();

            // 4. INTENTO DE CARGA DE DATOS (Con protección)
            try {
                if (Store.init()) {
                    console.log("Datos cargados del navegador.");
                    Main.loadApp();
                }
            } catch (errData) {
                console.error("Datos corruptos, reiniciando...", errData);
                localStorage.clear(); // Limpieza de emergencia
            }

            // 5. CONECTAR BOTONES (Listeners)
            const el = (id) => {
                const element = document.getElementById(id);
                if (!element) console.warn(`Elemento HTML no encontrado: ${id}`);
                return element;
            };

            // Archivos
            if(el('fileInput')) el('fileInput').addEventListener('change', Main.handleFile);
            if(el('btnSaveData')) el('btnSaveData').addEventListener('click', () => Store.save());
            
            // Botón Empezar (Nuevo Perfil)
            if(el('btnNewProfile')) el('btnNewProfile').addEventListener('click', () => {
                const p = prompt("Por favor ingresa: Peso(kg), Altura(cm), Edad.\nEjemplo: 75,175,30");
                if(p) {
                    try {
                        const [w, h, a] = p.split(',');
                        if(!w || !h || !a) throw new Error("Faltan datos");
                        
                        Store.data = Store.initData();
                        Store.data.profile = { 
                            weight: Number(w), 
                            height: Number(h), 
                            age: Number(a), 
                            gender: 'male', 
                            activity: 'mod', 
                            goal: 'lose' 
                        };
                        Store.persist();
                        Main.loadApp();
                    } catch (e) {
                        alert("Datos inválidos. Inténtalo de nuevo.");
                    }
                }
            });

            // Navegación Fechas
            const picker = el('datePicker');
            if(picker) {
                picker.value = Store.currentDate;
                picker.addEventListener('change', (e) => Main.changeDate(e.target.value));
            }
            if(el('prevDayBtn')) el('prevDayBtn').addEventListener('click', () => Main.shiftDate(-1));
            if(el('nextDayBtn')) el('nextDayBtn').addEventListener('click', () => Main.shiftDate(1));

            // Tabs
            if(el('tab-dashboard')) el('tab-dashboard').addEventListener('click', () => Main.switchTab('dashboard'));
            if(el('tab-analytics')) el('tab-analytics').addEventListener('click', () => Main.switchTab('analytics'));

        } catch (errorCritical) {
            alert("🛑 ERROR CRÍTICO:\n" + errorCritical.message + "\n\nRevisa la consola (F12) para más detalles.");
            console.error(errorCritical);
        }
    },

    handleFile: (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => { if(Store.load(ev.target.result)) Main.loadApp(); else alert("Archivo dañado o incompatible."); };
        reader.readAsText(e.target.files[0]);
    },

    loadApp: () => {
        // Ocultar Onboarding
        const onboarding = document.getElementById('view-onboarding');
        if(onboarding) onboarding.classList.add('hidden');
        
        // Mostrar Controles
        const controls = document.getElementById('controls');
        if(controls) controls.classList.remove('hidden');
        
        // Mostrar Tabs
        const tabs = document.getElementById('nav-tabs');
        if(tabs) tabs.classList.remove('hidden');
        
        // Ir al Dashboard
        Main.switchTab('dashboard');
        
        // Asegurar fecha
        const picker = document.getElementById('datePicker');
        if(picker) picker.value = Store.currentDate;
    },

    switchTab: (tab) => {
        const d = document.getElementById('view-dashboard');
        const a = document.getElementById('view-analytics');
        const btD = document.getElementById('tab-dashboard');
        const btA = document.getElementById('tab-analytics');

        if (!d || !a) return;

        if(tab === 'dashboard') {
            d.classList.remove('hidden'); 
            d.classList.add('fade-in');
            a.classList.add('hidden');
            
            if(btD) { btD.classList.add('border-blue-100', 'text-brand-blue'); btD.classList.remove('text-slate-400'); }
            if(btA) { btA.classList.remove('border-blue-100', 'text-brand-blue'); btA.classList.add('text-slate-400'); }
            
            Dashboard.render();
        } else {
            d.classList.add('hidden');
            a.classList.remove('hidden');
            a.classList.add('fade-in');

            if(btA) { btA.classList.add('border-blue-100', 'text-brand-blue'); btA.classList.remove('text-slate-400'); }
            if(btD) { btD.classList.remove('border-blue-100', 'text-brand-blue'); btD.classList.add('text-slate-400'); }
            
            if(typeof Analytics !== 'undefined') Analytics.render();
        }
    },

    changeDate: (d) => { Store.currentDate = d; document.getElementById('datePicker').value = d; Dashboard.render(); },
    
    shiftDate: (d) => { 
        const date = new Date(Store.currentDate); 
        date.setDate(date.getDate() + d); 
        Main.changeDate(Utils.formatDate(date)); 
    },
    
    deleteItem: (id) => { if(confirm('¿Borrar comida?')) { Store.deleteLog(id); Dashboard.render(); } }
};

document.addEventListener('DOMContentLoaded', Main.init);