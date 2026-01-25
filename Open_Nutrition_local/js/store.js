// js/store.js
const Store = {
    data: null,
    currentDate: Utils.formatDate(new Date()), // Fecha seleccionada por el usuario

    initData: () => ({
        meta: { version: "2.0", created: new Date().toISOString() },
        profile: null,
        logs: [] // Array plano: [{ id, date, type, name, k, p, f, c }]
    }),

    load: (jsonString) => {
        try {
            Store.data = JSON.parse(jsonString);
            return true;
        } catch (e) { console.error(e); return false; }
    },

    save: () => {
        const str = JSON.stringify(Store.data, null, 2);
        const blob = new Blob([str], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pulso_backup_${Store.currentDate}.json`;
        a.click();
    },

    // Obtener logs de la fecha seleccionada
    getDayLogs: () => {
        if (!Store.data) return [];
        return Store.data.logs.filter(l => l.date === Store.currentDate);
    },

    // Agregar registro
    addLog: (log) => {
        log.id = Utils.uid();
        log.date = Store.currentDate; // Forzar fecha actual de navegación
        Store.data.logs.push(log);
        // Ordenar logs por fecha (opcional, pero útil)
        Store.data.logs.sort((a,b) => new Date(b.date) - new Date(a.date));
    },

    deleteLog: (id) => {
        Store.data.logs = Store.data.logs.filter(l => l.id !== id);
    }
};
