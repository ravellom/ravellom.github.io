// Configuración global
let currentWordData = [];
let currentLayout = null;

// Esquemas de color predefinidos
const colorSchemes = {
    default: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'],
    blue: ['#3498db', '#2980b9', '#5dade2', '#1f618d', '#85c1e9', '#21618c', '#aed6f1', '#154360'],
    red: ['#e74c3c', '#c0392b', '#ec7063', '#a93226', '#f1948a', '#943126', '#f5b7b1', '#641e16'],
    green: ['#2ecc71', '#27ae60', '#58d68d', '#1e8449', '#82e0aa', '#186a3b', '#abebc6', '#0e4b26'],
    purple: ['#9b59b6', '#8e44ad', '#bb8fce', '#6c3483', '#d7bde2', '#512e5f', '#e8daef', '#341843'],
    orange: ['#f39c12', '#e67e22', '#f8c471', '#ca6f1e', '#fad7a0', '#a04000', '#fdebd0', '#6e2c00'],
    warm: ['#e74c3c', '#f39c12', '#e67e22', '#d35400', '#c0392b', '#e59866', '#ec7063', '#f8b878'],
    cool: ['#3498db', '#2ecc71', '#1abc9c', '#16a085', '#2980b9', '#27ae60', '#5dade2', '#58d68d'],
    grayscale: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#505a62', '#85929e', '#aab7b8']
};

// Palabras comunes en español (stopwords)
const defaultStopWords = ['de', 'la', 'el', 'en', 'y', 'a', 'o', 'un', 'una', 'los', 'las', 'del', 'al', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'durante', 'mediante'];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Event listeners
    document.getElementById('textInput').addEventListener('input', updateWordCount);
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('generateBtn').addEventListener('click', generateWordCloud);
    document.getElementById('downloadBtn').addEventListener('click', downloadPNG);
    document.getElementById('downloadSVG').addEventListener('click', downloadSVG);
    document.getElementById('resetBtn').addEventListener('click', resetAll);
    document.getElementById('maxWords').addEventListener('input', updateMaxWordsValue);
    document.getElementById('colorScheme').addEventListener('change', handleColorSchemeChange);
    
    // Cargar datos guardados si existen
    loadSavedData();
}

// Actualizar contador de palabras
function updateWordCount() {
    const text = document.getElementById('textInput').value;
    const words = extractWords(text);
    document.getElementById('wordCount').textContent = words.length;
}

// Actualizar valor del slider
function updateMaxWordsValue() {
    const value = document.getElementById('maxWords').value;
    document.getElementById('maxWordsValue').textContent = value;
}

// Manejar cambio de esquema de color
function handleColorSchemeChange() {
    const scheme = document.getElementById('colorScheme').value;
    const customSection = document.getElementById('customColorsSection');
    customSection.style.display = scheme === 'custom' ? 'block' : 'none';
}

// Cargar archivo
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        document.getElementById('textInput').value = text;
        updateWordCount();
        showNotification('Archivo cargado correctamente', 'success');
    };
    reader.onerror = () => {
        showNotification('Error al cargar el archivo', 'error');
    };
    reader.readAsText(file);
}

// Extraer palabras del texto
function extractWords(text) {
    if (!text || text.trim() === '') return [];
    
    const caseSensitive = document.getElementById('caseSensitive').checked;
    const removeNumbers = document.getElementById('removeNumbers').checked;
    
    // Limpiar y dividir el texto
    let words = text.trim().split(/\s+/);
    
    // Limpiar cada palabra
    words = words.map(word => {
        // Eliminar puntuación
        word = word.replace(/[.,;:!?¿¡()[\]{}"""''«»—–-]/g, '');
        
        // Eliminar números si está activado
        if (removeNumbers) {
            word = word.replace(/\d+/g, '');
        }
        
        // Convertir a minúsculas si no es sensible a mayúsculas
        if (!caseSensitive) {
            word = word.toLowerCase();
        }
        
        return word.trim();
    });
    
    // Filtrar palabras vacías y aplicar stopwords
    const stopWords = getStopWords();
    words = words.filter(word => {
        if (!word) return false;
        if (stopWords.includes(word.toLowerCase())) return false;
        return true;
    });
    
    return words;
}

// Obtener palabras a excluir
function getStopWords() {
    const stopWordsText = document.getElementById('stopWords').value;
    if (!stopWordsText.trim()) return [];
    
    return stopWordsText.split(',').map(word => word.trim().toLowerCase());
}

// Calcular frecuencias
function calculateFrequencies(words) {
    const frequencies = {};
    
    words.forEach(word => {
        frequencies[word] = (frequencies[word] || 0) + 1;
    });
    
    // Convertir a array y ordenar por frecuencia
    const sortedWords = Object.entries(frequencies)
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count);
    
    return sortedWords;
}

// Obtener colores según el esquema seleccionado
function getColors() {
    const scheme = document.getElementById('colorScheme').value;
    
    if (scheme === 'custom') {
        const customColors = document.getElementById('customColors').value;
        if (customColors.trim()) {
            return customColors.split(',').map(c => c.trim());
        }
        return colorSchemes.default;
    }
    
    return colorSchemes[scheme] || colorSchemes.default;
}

// Calcular rotación
function getRotation() {
    const rotation = document.getElementById('rotation').value;
    
    switch (rotation) {
        case 'none':
            return () => 0;
        case 'slight':
            return () => (Math.random() > 0.5 ? 1 : -1) * Math.random() * 15;
        case 'medium':
            return () => (Math.random() > 0.5 ? 1 : -1) * Math.random() * 45;
        case 'varied':
            return () => (Math.random() > 0.5 ? 1 : -1) * Math.random() * 90;
        case 'perpendicular':
            return () => Math.random() > 0.5 ? 0 : 90;
        default:
            return () => 0;
    }
}

// Generar nube de palabras
function generateWordCloud() {
    const text = document.getElementById('textInput').value;
    
    if (!text.trim()) {
        showNotification('Por favor, ingresa algún texto', 'warning');
        return;
    }
    
    // Extraer y procesar palabras
    const words = extractWords(text);
    
    if (words.length === 0) {
        showNotification('No se encontraron palabras válidas', 'warning');
        return;
    }
    
    // Calcular frecuencias
    const frequencies = calculateFrequencies(words);
    
    // Limitar número de palabras
    const maxWords = parseInt(document.getElementById('maxWords').value);
    currentWordData = frequencies.slice(0, maxWords);
    
    // Actualizar estadísticas
    updateStatistics(currentWordData);
    
    // Configuración de la nube
    const minFont = parseInt(document.getElementById('minFont').value);
    const maxFont = parseInt(document.getElementById('maxFont').value);
    const colors = getColors();
    const rotationFn = getRotation();
    
    // Limpiar canvas anterior
    d3.select('#cloudCanvas').selectAll('*').remove();
    document.getElementById('emptyState').style.display = 'none';
    
    // Mostrar loading
    showLoading();
    
    // Dimensiones del canvas
    const container = document.getElementById('cloudCanvas');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Escala de tamaños
    const maxCount = d3.max(currentWordData, d => d.count);
    const minCount = d3.min(currentWordData, d => d.count);
    const fontScale = d3.scaleLinear()
        .domain([minCount, maxCount])
        .range([minFont, maxFont]);
    
    // Crear layout de la nube
    currentLayout = d3.layout.cloud()
        .size([width, height])
        .words(currentWordData.map(d => ({
            text: d.text,
            size: fontScale(d.count),
            count: d.count
        })))
        .padding(5)
        .rotate(rotationFn)
        .font('Impact, Arial, sans-serif')
        .fontSize(d => d.size)
        .spiral(getSpiral())
        .on('end', draw);
    
    currentLayout.start();
    
    function draw(words) {
        hideLoading();
        
        const svg = d3.select('#cloudCanvas')
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);
        
        const texts = g.selectAll('text')
            .data(words)
            .enter()
            .append('text')
            .attr('class', 'word-cloud-text')
            .style('font-size', d => `${d.size}px`)
            .style('font-family', 'Impact, Arial, sans-serif')
            .style('fill', (d, i) => colors[i % colors.length])
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
            .text(d => d.text)
            .on('mouseover', function(event, d) {
                d3.select(this).style('opacity', 0.7);
                showTooltip(event, d);
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 1);
                hideTooltip();
            })
            .style('opacity', 0)
            .transition()
            .duration(500)
            .style('opacity', 1);
        
        // Guardar datos
        saveData();
        showNotification('¡Nube de palabras generada!', 'success');
    }
}

// Obtener tipo de espiral según la forma
function getSpiral() {
    const shape = document.getElementById('cloudShape').value;
    
    switch (shape) {
        case 'rectangle':
            return 'rectangular';
        default:
            return 'archimedean';
    }
}

// Mostrar tooltip
function showTooltip(event, d) {
    // Implementación simple de tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'word-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.background = 'rgba(0,0,0,0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '14px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '9999';
    tooltip.innerHTML = `<strong>${d.text}</strong><br>Frecuencia: ${d.count}`;
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    document.body.appendChild(tooltip);
}

// Ocultar tooltip
function hideTooltip() {
    const tooltip = document.getElementById('word-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Actualizar estadísticas
function updateStatistics(wordData) {
    const statsContainer = document.getElementById('stats');
    
    if (wordData.length === 0) {
        statsContainer.innerHTML = '<p class="text-muted">No hay datos</p>';
        return;
    }
    
    const top10 = wordData.slice(0, 10);
    const html = top10.map((item, index) => `
        <div class="stat-item">
            <span class="stat-word">${index + 1}. ${item.text}</span>
            <span class="stat-count">${item.count}</span>
        </div>
    `).join('');
    
    statsContainer.innerHTML = html;
}

// Descargar como PNG
function downloadPNG() {
    const svg = document.querySelector('#cloudCanvas svg');
    
    if (!svg) {
        showNotification('Primero genera una nube de palabras', 'warning');
        return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = svg.clientWidth;
    canvas.height = svg.clientHeight;
    
    img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nube-palabras-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('Imagen descargada', 'success');
        });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

// Descargar como SVG
function downloadSVG() {
    const svg = document.querySelector('#cloudCanvas svg');
    
    if (!svg) {
        showNotification('Primero genera una nube de palabras', 'warning');
        return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nube-palabras-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('SVG descargado', 'success');
}

// Reiniciar todo
function resetAll() {
    if (!confirm('¿Estás seguro de que quieres limpiar todo?')) return;
    
    document.getElementById('textInput').value = '';
    document.getElementById('fileInput').value = '';
    d3.select('#cloudCanvas').selectAll('*').remove();
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('wordCount').textContent = '0';
    document.getElementById('stats').innerHTML = '';
    currentWordData = [];
    
    localStorage.removeItem('wordcloud_data');
    showNotification('Todo limpiado', 'info');
}

// Guardar datos en localStorage
function saveData() {
    const data = {
        text: document.getElementById('textInput').value,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('wordcloud_data', JSON.stringify(data));
}

// Cargar datos guardados
function loadSavedData() {
    const saved = localStorage.getItem('wordcloud_data');
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            document.getElementById('textInput').value = data.text || '';
            updateWordCount();
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Mostrar loading
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading-indicator';
    loading.className = 'loading spin';
    loading.innerHTML = '<i class="fas fa-spinner"></i>';
    document.getElementById('cloudCanvas').appendChild(loading);
}

// Ocultar loading
function hideLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    notification.style.fontWeight = '600';
    notification.style.transition = 'all 0.3s ease';
    notification.textContent = message;
    
    // Colores según tipo
    const colors = {
        success: { bg: '#27ae60', text: 'white' },
        error: { bg: '#e74c3c', text: 'white' },
        warning: { bg: '#f39c12', text: 'white' },
        info: { bg: '#3498db', text: 'white' }
    };
    
    const color = colors[type] || colors.info;
    notification.style.background = color.bg;
    notification.style.color = color.text;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
