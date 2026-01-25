// js/analytics.js (v4.0 - Gráficos Semáforo)

const Analytics = {
    weightChart: null,
    historyChart: null,

    init: () => {},

    render: () => {
        if (!Store.data) return;
        if(document.getElementById('weightChart')) Analytics.renderWeightChart();
        if(document.getElementById('historyChart')) Analytics.renderHistoryChart();
    },

    renderWeightChart: () => {
        const ctx = document.getElementById('weightChart');
        if(!ctx) return;
        
        const weights = Store.data.weightLogs || [];
        
        if(Analytics.weightChart) Analytics.weightChart.destroy();
        Analytics.weightChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: weights.map(w => w.date.slice(5)), 
                datasets: [{ 
                    label: 'Peso (kg)', 
                    data: weights.map(w => w.weight), 
                    borderColor: '#2563eb', 
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    renderHistoryChart: () => {
        const ctx = document.getElementById('historyChart');
        if(!ctx) return;
        
        // 1. Obtener datos
        const history = {};
        Store.data.logs.forEach(l => {
            history[l.date] = (history[l.date] || 0) + l.k;
        });
        
        // 2. Calcular Meta Diaria para comparar
        const target = Utils.calculateTargets(Store.data.profile).k;
        
        // 3. Preparar últimos 7 días
        const labels = Object.keys(history).sort().slice(-7);
        const data = labels.map(d => history[d]);

        // 4. LÓGICA DE COLORES (Semáforo)
        const bgColors = data.map(val => {
            // Si te pasas un 5% de la meta, rojo. Si no, verde.
            return val > (target * 1.05) ? '#ef4444' : '#22c55e';
        });

        if(Analytics.historyChart) Analytics.historyChart.destroy();
        Analytics.historyChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.map(d => d.slice(5)),
                datasets: [{ 
                    label: 'Kcal', 
                    data: data, 
                    backgroundColor: bgColors, 
                    borderRadius: 5 
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false } // Ocultar leyenda para más limpieza
                },
                scales: {
                    y: {
                        grid: { borderDash: [5, 5] },
                        suggestedMax: target * 1.2
                    }
                }
            }
        });
    },

    logWeight: () => {
        const w = prompt("Introduce tu peso actual (kg):", Store.data.profile.weight);
        if(w && !isNaN(w)) {
            Store.addWeight(Number(w));
            Analytics.render();
            alert("Peso registrado");
        }
    },

    exportCSV: () => {
        const logs = Store.data.logs;
        if(!logs.length) { alert("No hay datos para exportar."); return; }
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fecha,Hora,Tipo,Comida,Kcal,Proteina,Grasa,Carbos\n";
        
        logs.forEach(l => {
            const time = l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : "00:00";
            csvContent += `${l.date},${time},${l.type},"${l.name}",${l.k},${l.p},${l.f},${l.c}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `open_nutrition_export_${Store.currentDate}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};