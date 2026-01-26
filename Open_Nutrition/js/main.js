// js/main.js (v4.2 - Logout + Better Error Handling)

const Main = {
    init: () => {
        console.log("🚀 Iniciando Open Nutrition...");
        
        try {
            // DIAGNÓSTICO PARA GITHUB PAGES
            // Si alguno de estos falla, saldrá una alerta visible
            if (typeof Utils === 'undefined') throw new Error("Fallo al cargar utils.js. Revisa mayúsculas/minúsculas.");
            if (typeof Store === 'undefined') throw new Error("Fallo al cargar store.js. Revisa mayúsculas/minúsculas.");
            if (typeof Dashboard === 'undefined') throw new Error("Fallo al cargar dashboard.js. Revisa mayúsculas/minúsculas.");

            // Inicializar Librerías
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            Dashboard.init();
            if (typeof Analytics !== 'undefined') Analytics.init();

            // Cargar datos
            try {
                if (Store.init()) {
                    Main.loadApp();
                }
            } catch (err) {
                console.error("Error de datos", err);
                localStorage.clear();
            }

            // LISTENERS
            const el = (id) => document.getElementById(id);

            // Archivos
            if(el('fileInput')) el('fileInput').addEventListener('change', Main.handleFile);
            if(el('btnSaveData')) el('btnSaveData').addEventListener('click', () => Store.save());
            
            // NUEVO: Listener Logout
            if(el('btnLogout')) el('btnLogout').addEventListener('click', Main.logout);

            // Perfil Nuevo
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
                    } catch (e) { alert("Datos inválidos."); }
                }
            });

            // Navegación
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

        } catch (error) {
            // ESTO HARÁ QUE EL ERROR SEA VISIBLE EN EL MÓVIL/WEB
            alert("⚠️ ERROR DE CARGA:\n" + error.message);
            console.error(error);
        }
    },

    // NUEVA FUNCIÓN LOGOUT
    logout: () => {
        if(confirm("¿Cerrar sesión?\n\nAsegúrate de haber descargado una copia de tus datos (Botón Guardar) si quieres conservarlos. Se borrará la sesión actual del navegador.")) {
            // 1. Borrar Autoguardado
            localStorage.removeItem('open_nutrition_data');
            // 2. Limpiar memoria
            Store.data = null;
            // 3. Recargar página (Reset total)
            location.reload();
        }
    },

    handleFile: (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => { if(Store.load(ev.target.result)) Main.loadApp(); else alert("Archivo inválido."); };
        reader.readAsText(e.target.files[0]);
    },

    loadApp: () => {
        const onboarding = document.getElementById('view-onboarding');
        if(onboarding) onboarding.classList.add('hidden');
        
        const controls = document.getElementById('controls');
        if(controls) controls.classList.remove('hidden');
        
        const tabs = document.getElementById('nav-tabs');
        if(tabs) tabs.classList.remove('hidden');
        
        Main.switchTab('dashboard');
        
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
            d.classList.remove('hidden'); d.classList.add('fade-in');
            a.classList.add('hidden');
            if(btD) { btD.classList.add('border-blue-100', 'text-brand-blue'); btD.classList.remove('text-slate-400'); }
            if(btA) { btA.classList.remove('border-blue-100', 'text-brand-blue'); btA.classList.add('text-slate-400'); }
            Dashboard.render();
        } else {
            d.classList.add('hidden');
            a.classList.remove('hidden'); a.classList.add('fade-in');
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
    
    deleteItem: (id) => { if(confirm('¿Eliminar?')) { Store.deleteLog(id); Dashboard.render(); } }
};

document.addEventListener('DOMContentLoaded', Main.init);