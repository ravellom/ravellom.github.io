// js/main.js
const Main = {
    init: () => {
        lucide.createIcons();
        Dashboard.init();
        
        // Elementos UI globales
        const datePicker = document.getElementById('datePicker');
        
        // Sincronizar fecha inicial
        datePicker.value = Store.currentDate;

        // Eventos Carga Archivo
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(Store.load(ev.target.result)) {
                    Main.loadApp();
                }
            };
            reader.readAsText(e.target.files[0]);
        });

        // Crear Perfil Demo
        document.getElementById('btnNewProfile').addEventListener('click', () => {
            const p = prompt("Peso (kg), Altura (cm), Edad. Ej: 75,175,30");
            if(p) {
                const [w, h, a] = p.split(',');
                Store.data = Store.initData();
                Store.data.profile = { weight: Number(w), height: Number(h), age: Number(a), gender: 'male', activity: 'mod', goal: 'lose' };
                Main.loadApp();
            }
        });

        // Navegación Fechas
        datePicker.addEventListener('change', (e) => Main.changeDate(e.target.value));
        document.getElementById('prevDayBtn').addEventListener('click', () => Main.shiftDate(-1));
        document.getElementById('nextDayBtn').addEventListener('click', () => Main.shiftDate(1));

        // Navegación Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'text-brand-blue', 'border-b-2', 'border-brand-blue'));
                e.target.classList.add('active', 'text-brand-blue', 'border-b-2', 'border-brand-blue');
                
                const target = e.target.dataset.target;
                document.getElementById('view-dashboard').classList.add('hidden');
                document.getElementById('view-analytics').classList.add('hidden');
                document.getElementById(`view-${target}`).classList.remove('hidden');
                document.getElementById(`view-${target}`).classList.add('fade-in');

                if(target === 'analytics') Analytics.render();
            });
        });
    },

    loadApp: () => {
        document.getElementById('view-onboarding').classList.add('hidden');
        document.getElementById('controls').classList.remove('hidden');
        document.getElementById('nav-tabs').classList.remove('hidden');
        document.getElementById('view-dashboard').classList.remove('hidden');
        Dashboard.render();
    },

    changeDate: (newDate) => {
        Store.currentDate = newDate;
        document.getElementById('datePicker').value = newDate;
        Dashboard.render(); // Refrescar datos para el nuevo día
    },

    shiftDate: (days) => {
        const d = new Date(Store.currentDate);
        d.setDate(d.getDate() + days);
        Main.changeDate(Utils.formatDate(d));
    },

    deleteItem: (id) => {
        if(confirm('¿Borrar registro?')) {
            Store.deleteLog(id);
            Dashboard.render();
        }
    }
};

document.addEventListener('DOMContentLoaded', Main.init);
