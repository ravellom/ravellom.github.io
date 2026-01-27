// js/store.js
const Store = {
    // ... mantén data, currentDate, initData igual ...
    data: null,
    currentDate: Utils.formatDate(new Date()),
    autoSaveEnabled: true,

    initData: () => ({
        meta: { version: "4.0", app: "Open Nutrition", created: new Date().toISOString() },
        profile: null,
        logs: [],
        waterLogs: {},
        weightLogs: []
    }),

    // --- NUEVO: GESTIÓN API KEY ---
    setAPIKey: (key) => {
        localStorage.setItem('gemini_api_key', key);
    },
    getAPIKey: () => {
        return localStorage.getItem('gemini_api_key');
    },
    // -----------------------------

    // ... el resto del archivo (init, load, save, persist, etc.) MANTENLO IGUAL ...
    init: () => {
        const local = localStorage.getItem('open_nutrition_data');
        if (local) {
            try { Store.data = JSON.parse(local); return true; } 
            catch (e) { console.error(e); }
        }
        return false;
    },
    
    // ... copia el resto de funciones de store.js que ya tenías ...
    // (load, save, persist, getDayLogs, addLog, deleteLog, getWater, setWater, addWeight, getLastWeight, getLastMealTime)
    load: (jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.waterLogs) parsed.waterLogs = {};
            if (!parsed.weightLogs) parsed.weightLogs = [];
            Store.data = parsed;
            Store.persist();
            return true;
        } catch (e) { return false; }
    },
    save: () => {
        const str = JSON.stringify(Store.data, null, 2);
        const blob = new Blob([str], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `OpenNutrition_Backup_${Store.currentDate}.json`;
        a.click();
    },
    persist: () => {
        if (Store.autoSaveEnabled && Store.data) localStorage.setItem('open_nutrition_data', JSON.stringify(Store.data));
    },
    getDayLogs: () => (Store.data ? Store.data.logs.filter(l => l.date === Store.currentDate) : []),
    addLog: (log) => { log.id = Utils.uid(); log.date = Store.currentDate; log.timestamp = Date.now(); Store.data.logs.push(log); Store.persist(); },
    deleteLog: (id) => { Store.data.logs = Store.data.logs.filter(l => l.id !== id); Store.persist(); },
    getWater: () => (Store.data.waterLogs && Store.data.waterLogs[Store.currentDate]) || 0,
    setWater: (val) => { if(!Store.data.waterLogs) Store.data.waterLogs={}; Store.data.waterLogs[Store.currentDate] = Math.max(0, val); Store.persist(); },
    addWeight: (val) => {
        const idx = Store.data.weightLogs.findIndex(w => w.date === Store.currentDate);
        if (idx >= 0) Store.data.weightLogs[idx].weight = val;
        else Store.data.weightLogs.push({ date: Store.currentDate, weight: val });
        if(Store.data.profile) Store.data.profile.weight = val;
        Store.data.weightLogs.sort((a,b) => new Date(a.date) - new Date(b.date));
        Store.persist();
    },
    getLastWeight: () => {
        const logs = Store.data.weightLogs;
        if (!logs || logs.length === 0) return Store.data.profile?.weight || 0;
        const sorted = [...logs].sort((a,b) => new Date(b.date) - new Date(a.date));
        return sorted[0].weight;
    },
    getLastMealTime: () => {
        if(!Store.data.logs.length) return null;
        const sorted = [...Store.data.logs].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
        return sorted[0].timestamp || null;
    }
};