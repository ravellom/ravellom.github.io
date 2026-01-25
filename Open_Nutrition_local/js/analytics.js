// js/analytics.js
const Analytics = {
    historyChart: null,

    render: () => {
        if (!Store.data) return;
        
        // Agrupar logs por fecha
        const logsByDate = {};
        Store.data.logs.forEach(l => {
            if(!logsByDate[l.date]) logsByDate[l.date] = {k:0, p:0, f:0, c:0};
            logsByDate[l.date].k += l.k;
            logsByDate[l.date].p += l.p;
            logsByDate[l.date].f += l.f;
            logsByDate[l.date].c += l.c;
        });

        // Obtener últimos 7 días
        const dates = Object.keys(logsByDate).sort().slice(-7);
        const dataKcal = dates.map(d => logsByDate[d].k);
        const target = Utils.calculateTargets(Store.data.profile).k;

        // Render Gráfico Lineal
        const ctx = document.getElementById('historyChart').getContext('2d');
        if(Analytics.historyChart) Analytics.historyChart.destroy();
        
        Analytics.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(d => d.slice(5)), // MM-DD
                datasets: [
                    { label: 'Calorías', data: dataKcal, borderColor: '#3b82f6', tension: 0.4 },
                    { label: 'Meta', data: dates.map(()=>target), borderColor: '#cbd5e1', borderDash: [5,5], pointRadius: 0 }
                ]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });

        // Render Tabla
        const tableBody = document.getElementById('historyTableBody');
        tableBody.innerHTML = Object.keys(logsByDate).sort().reverse().map(d => {
            const day = logsByDate[d];
            const diff = day.k - target;
            const status = diff > 100 ? '<span class="text-red-500">+Superávit</span>' : diff < -100 ? '<span class="text-blue-500">-Déficit</span>' : '<span class="text-green-500">Perfecto</span>';
            return `<tr class="border-b border-slate-50 last:border-0">
                <td class="p-2 font-bold text-slate-700">${d}</td>
                <td class="p-2">${day.k} kcal</td>
                <td class="p-2">${day.p} g</td>
                <td class="p-2 text-xs font-bold">${status}</td>
            </tr>`;
        }).join('');
    }
};
