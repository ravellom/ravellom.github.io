// js/store.js

const Store = {
    data: null,
    currentDate: Utils.formatDate(new Date()),
    autoSaveEnabled: true, // Por defecto activado

    initData: () => ({
        meta: { version: "3.1", app: "Open Nutrition", created: new Date().toISOString() },
        profile: null,
        logs: [],
        waterLogs: {},
        weightLogs: []
    }),

    // Carga inicial inteligente: Intenta LocalStorage, si no, inicia vacío
    init: () => {
        const local = localStorage.getItem('open_nutrition_data');
        if (local) {
            try {
                Store.data = JSON.parse(local);
                console.log("Datos recuperados de LocalStorage");
                return true;
            } catch (e) { console.error("Error local data", e); }
        }
        return false;
    },

    load: (jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);
            // Migración básica de versiones anteriores
            if (!parsed.waterLogs) parsed.waterLogs = {};
            if (!parsed.weightLogs) parsed.weightLogs = [];
            Store.data = parsed;
            Store.persist(); // Guardar en local lo que acabamos de cargar
            return true;
        } catch (e) { return false; }
    },

    // Guardar en archivo (JSON)
    save: () => {
        const str = JSON.stringify(Store.data, null, 2);
        const blob = new Blob([str], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `OpenNutrition_Backup_${Store.currentDate}.json`;
        a.click();
    },

    // Guardar en navegador (Automático)
    persist: () => {
        if (Store.autoSaveEnabled && Store.data) {
            localStorage.setItem('open_nutrition_data', JSON.stringify(Store.data));
        }
    },

    // --- MÉTODOS DE DATOS (Todos llaman a persist()) ---

    getDayLogs: () => {
        if (!Store.data) return [];
        return Store.data.logs.filter(l => l.date === Store.currentDate);
    },

    addLog: (log) => {
        log.id = Utils.uid();
        log.date = Store.currentDate;
        log.timestamp = Date.now();
        Store.data.logs.push(log);
        Store.persist(); // <--- AUTOGUARDADO
    },

    deleteLog: (id) => {
        Store.data.logs = Store.data.logs.filter(l => l.id !== id);
        Store.persist(); // <--- AUTOGUARDADO
    },

    getWater: () => (Store.data.waterLogs && Store.data.waterLogs[Store.currentDate]) || 0,
    
    setWater: (val) => {
        if (!Store.data.waterLogs) Store.data.waterLogs = {};
        Store.data.waterLogs[Store.currentDate] = Math.max(0, val);
        Store.persist(); // <--- AUTOGUARDADO
    },

    addWeight: (val) => {
        const idx = Store.data.weightLogs.findIndex(w => w.date === Store.currentDate);
        if (idx >= 0) Store.data.weightLogs[idx].weight = val;
        else Store.data.weightLogs.push({ date: Store.currentDate, weight: val });
        
        if(Store.data.profile) Store.data.profile.weight = val;
        Store.data.weightLogs.sort((a,b) => new Date(a.date) - new Date(b.date));
        Store.persist(); // <--- AUTOGUARDADO
    },

    getLastMealTime: () => {
        if(!Store.data.logs.length) return null;
        const sorted = [...Store.data.logs].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
        return sorted[0].timestamp || null;
    },
    // --- PESO (Helper nuevo) ---
    getLastWeight: () => {
        const logs = Store.data.weightLogs;
        if (!logs || logs.length === 0) return Store.data.profile?.weight || 0;
        // Ordenamos por fecha (más reciente primero) y devolvemos el último
        const sorted = [...logs].sort((a,b) => new Date(b.date) - new Date(a.date));
        return sorted[0].weight;
    },
};