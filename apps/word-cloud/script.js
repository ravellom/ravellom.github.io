// Configuración global
let currentWordData = [];
let currentLayout = null;
let currentLanguage = 'en';
let activeDatasetName = '';
let activeDatasetRows = [];

// Traducciones
const translations = {
    es: {
        title: 'Nube de Palabras',
        textSection: 'Texto',
        textPlaceholder: 'Escribe o pega tu texto aquí...',
        wordsDetected: 'Palabras detectadas',
        loadFile: 'Cargar archivo',
        excludeWords: 'Palabras a excluir',
        excludePlaceholder: 'Ej: de, la, el, en, y (separadas por comas)',
        addGroups: 'Agregar grupos de palabras',
        btnArticles: 'Artículos',
        btnPrepositions: 'Preposiciones',
        btnConjunctions: 'Conjunciones',
        btnPronouns: 'Pronombres',
        btnCommon: 'Comunes',
        btnAll: 'Todas',
        btnClear: 'Limpiar',
        caseSensitive: 'Distinguir mayúsculas/minúsculas',
        removeNumbers: 'Eliminar números',
        visualConfig: 'Configuración visual',
        maxWords: 'Palabras máximas',
        fontSize: 'Tamaño de fuente',
        minMax: 'mín-máx',
        minimum: 'Mínimo',
        maximum: 'Máximo',
        colorScheme: 'Esquema de color',
        colorDefault: 'Multicolor (Defecto)',
        colorBlue: 'Azules',
        colorRed: 'Rojos',
        colorGreen: 'Verdes',
        colorPurple: 'Púrpuras',
        colorOrange: 'Naranjas',
        colorWarm: 'Cálidos',
        colorCool: 'Fríos',
        colorGrayscale: 'Escala de grises',
        colorCustom: 'Personalizado',
        customColors: 'Colores personalizados',
        commaSeparated: 'separados por comas',
        shape: 'Forma',
        shapeCircle: 'Circular',
        shapeRectangle: 'Rectangular',
        shapeEllipse: 'Elipse',
        fontFamily: 'Fuente tipográfica',
        fontImpact: 'Impact (Clásica)',
        rotation: 'Rotación',
        rotationNone: 'Sin rotación',
        rotationSlight: 'Leve (-15° a 15°)',
        rotationMedium: 'Moderada (-45° a 45°)',
        rotationVaried: 'Variada (-90° a 90°)',
        rotationPerpendicular: 'Solo perpendicular (0° o 90°)',
        btnGenerate: 'Generar Nube',
        btnDownloadPNG: 'Descargar PNG',
        btnDownloadSVG: 'Descargar SVG',
        btnReset: 'Limpiar todo',
        statistics: 'Estadísticas',
        emptyTitle: '¡Crea tu nube de palabras!',
        emptyDescription: 'Escribe o carga texto y haz clic en "Generar Nube"',
        // Notificaciones
        fileLoaded: 'Archivo cargado correctamente',
        fileError: 'Error al cargar el archivo',
        enterText: 'Por favor, ingresa algún texto',
        noValidWords: 'No se encontraron palabras válidas',
        cloudGenerated: '¡Nube de palabras generada!',
        wordsAdded: 'palabras del grupo',
        wordsCleared: 'Palabras a excluir limpiadas',
        downloadedImage: 'Imagen descargada',
        downloadedSVG: 'SVG descargado',
        generateFirst: 'Primero genera una nube de palabras',
        confirmClear: '¿Estás seguro de que quieres limpiar todo?',
        allCleared: 'Todo limpiado',
        confirmClearWords: '¿Limpiar todas las palabras a excluir?',
        frequency: 'Frecuencia',
        sharedDataset: 'Dataset compartido',
        activeDataset: 'Dataset activo',
        textColumn: 'Columna de texto',
        useColumn: 'Usar texto de la columna',
        selectColumn: 'Selecciona columna...',
        noDatasetLoaded: 'No hay dataset activo cargado',
        noTextColumnSelected: 'Selecciona una columna de texto',
        loadedColumnRows: 'Filas cargadas desde la columna',
        noTextValuesFound: 'No se encontraron valores de texto en la columna',
        noData: 'Sin datos'
    },
    en: {
        title: 'Word Cloud',
        textSection: 'Text',
        textPlaceholder: 'Type or paste your text here...',
        wordsDetected: 'Words detected',
        loadFile: 'Load file',
        excludeWords: 'Exclude words',
        excludePlaceholder: 'E.g: the, and, of, to, a (comma separated)',
        addGroups: 'Add word groups',
        btnArticles: 'Articles',
        btnPrepositions: 'Prepositions',
        btnConjunctions: 'Conjunctions',
        btnPronouns: 'Pronouns',
        btnCommon: 'Common',
        btnAll: 'All',
        btnClear: 'Clear',
        caseSensitive: 'Case sensitive',
        removeNumbers: 'Remove numbers',
        visualConfig: 'Visual configuration',
        maxWords: 'Maximum words',
        fontSize: 'Font size',
        minMax: 'min-max',
        minimum: 'Minimum',
        maximum: 'Maximum',
        colorScheme: 'Color scheme',
        colorDefault: 'Multicolor (Default)',
        colorBlue: 'Blues',
        colorRed: 'Reds',
        colorGreen: 'Greens',
        colorPurple: 'Purples',
        colorOrange: 'Oranges',
        colorWarm: 'Warm',
        colorCool: 'Cool',
        colorGrayscale: 'Grayscale',
        colorCustom: 'Custom',
        customColors: 'Custom colors',
        commaSeparated: 'comma separated',
        shape: 'Shape',
        shapeCircle: 'Circular',
        shapeRectangle: 'Rectangular',
        shapeEllipse: 'Ellipse',
        fontFamily: 'Font family',
        fontImpact: 'Impact (Classic)',
        rotation: 'Rotation',
        rotationNone: 'No rotation',
        rotationSlight: 'Slight (-15° to 15°)',
        rotationMedium: 'Medium (-45° to 45°)',
        rotationVaried: 'Varied (-90° to 90°)',
        rotationPerpendicular: 'Perpendicular only (0° or 90°)',
        btnGenerate: 'Generate Cloud',
        btnDownloadPNG: 'Download PNG',
        btnDownloadSVG: 'Download SVG',
        btnReset: 'Clear all',
        statistics: 'Statistics',
        emptyTitle: 'Create your word cloud!',
        emptyDescription: 'Type or load text and click "Generate Cloud"',
        // Notifications
        fileLoaded: 'File loaded successfully',
        fileError: 'Error loading file',
        enterText: 'Please enter some text',
        noValidWords: 'No valid words found',
        cloudGenerated: 'Word cloud generated!',
        wordsAdded: 'words from group',
        wordsCleared: 'Excluded words cleared',
        downloadedImage: 'Image downloaded',
        downloadedSVG: 'SVG downloaded',
        generateFirst: 'Generate a word cloud first',
        confirmClear: 'Are you sure you want to clear everything?',
        allCleared: 'All cleared',
        confirmClearWords: 'Clear all excluded words?',
        frequency: 'Frequency',
        sharedDataset: 'Shared dataset',
        activeDataset: 'Active dataset',
        textColumn: 'Text column',
        useColumn: 'Use column text',
        selectColumn: 'Select column...',
        noDatasetLoaded: 'No active dataset loaded',
        noTextColumnSelected: 'Select a text column',
        loadedColumnRows: 'Rows loaded from column',
        noTextValuesFound: 'No text values found in selected column',
        noData: 'No data'
    }
};

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

// Grupos de palabras a excluir en español
const stopWordGroups = {
    es: {
        // Artículos
        articles: ['el', 'la', 'lo', 'los', 'las', 'un', 'una', 'unos', 'unas'],
        
        // Preposiciones
        prepositions: ['a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras', 'versus', 'vía', 'del', 'al'],
        
        // Conjunciones
        conjunctions: ['y', 'e', 'ni', 'que', 'o', 'u', 'pero', 'mas', 'aunque', 'sino', 'siquiera', 'porque', 'pues', 'si', 'como', 'cuando', 'donde', 'mientras'],
        
        // Pronombres
        pronouns: ['yo', 'tu', 'tú', 'el', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'usted', 'ustedes', 'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la', 'los', 'las', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas', 'quien', 'quienes', 'cual', 'cuales', 'cuanto', 'cuanta', 'cuantos', 'cuantas', 'que', 'qué'],
        
        // Palabras comunes
        common: ['ser', 'estar', 'haber', 'hacer', 'tener', 'decir', 'ir', 'ver', 'dar', 'saber', 'querer', 'poder', 'poner', 'parecer', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar', 'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír', 'acabar', 'suponer', 'comprender', 'lograr', 'explicar', 'reconocer', 'estudiar', 'intentar', 'usar', 'demostrar', 'fue', 'ha', 'han', 'sido', 'es', 'son', 'era', 'eran', 'eres', 'soy', 'somos', 'son', 'está', 'están', 'estoy', 'estamos', 'hay', 'había', 'he', 'has', 'hemos', 'habían', 'tenía', 'tenían', 'tiene', 'tienen', 'tengo', 'tenemos', 'hice', 'hizo', 'hicieron', 'hace', 'hacen', 'hago', 'hacemos', 'dijo', 'dice', 'dicen', 'digo', 'decimos', 'muy', 'mucho', 'muchos', 'mucha', 'muchas', 'poco', 'pocos', 'poca', 'pocas', 'todo', 'toda', 'todos', 'todas', 'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'mismos', 'mismas', 'tal', 'tales', 'tanto', 'tanta', 'tantos', 'tantas', 'algún', 'alguno', 'alguna', 'algunos', 'algunas', 'ningún', 'ninguno', 'ninguna', 'ningunos', 'ningunas', 'cada', 'varios', 'varias', 'cualquier', 'cualquiera', 'cualesquiera', 'demás', 'mismo', 'propio', 'cierto', 'cierta', 'ciertos', 'ciertas', 'más', 'menos', 'bien', 'mal', 'mejor', 'peor', 'sí', 'si', 'no', 'nunca', 'siempre', 'también', 'tampoco', 'ya', 'aún', 'aun', 'todavía', 'solo', 'sólo', 'solamente', 'apenas', 'quizá', 'quizas', 'quizás', 'acaso', 'tal vez', 'talvez']
    },
    en: {
        // Articles
        articles: ['the', 'a', 'an'],
        
        // Prepositions
        prepositions: ['about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'at', 'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'by', 'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into', 'like', 'near', 'of', 'off', 'on', 'onto', 'out', 'outside', 'over', 'past', 'since', 'through', 'throughout', 'to', 'toward', 'under', 'underneath', 'until', 'up', 'upon', 'with', 'within', 'without'],
        
        // Conjunctions
        conjunctions: ['and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'although', 'because', 'since', 'unless', 'while', 'where', 'whereas', 'whether', 'if', 'that', 'than', 'when', 'as', 'though'],
        
        // Pronouns
        pronouns: ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves'],
        
        // Common words
        common: ['be', 'is', 'am', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could', 'get', 'got', 'getting', 'make', 'made', 'making', 'go', 'goes', 'going', 'went', 'gone', 'take', 'took', 'taken', 'taking', 'come', 'came', 'coming', 'see', 'saw', 'seen', 'seeing', 'know', 'knew', 'known', 'knowing', 'think', 'thought', 'thinking', 'look', 'looked', 'looking', 'want', 'wanted', 'wanting', 'give', 'gave', 'given', 'giving', 'use', 'used', 'using', 'find', 'found', 'finding', 'tell', 'told', 'telling', 'ask', 'asked', 'asking', 'work', 'worked', 'working', 'seem', 'seemed', 'seeming', 'feel', 'felt', 'feeling', 'try', 'tried', 'trying', 'leave', 'left', 'leaving', 'call', 'called', 'calling', 'very', 'all', 'just', 'not', 'now', 'only', 'also', 'well', 'then', 'first', 'many', 'more', 'most', 'other', 'some', 'such', 'no', 'any', 'each', 'every', 'both', 'few', 'much', 'own', 'same', 'so', 'too', 'very', 'one', 'two', 'three', 'said', 'still', 'way', 'even', 'new', 'old', 'good', 'great', 'right', 'little', 'big', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'public', 'bad', 'same', 'able']
    }
};

// Palabras comunes en español (stopwords) - lista por defecto
const defaultStopWords = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Event listeners
    document.getElementById('languageSelector').addEventListener('change', changeLanguage);
    document.getElementById('textInput').addEventListener('input', updateWordCount);
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('generateBtn').addEventListener('click', generateWordCloud);
    document.getElementById('downloadBtn').addEventListener('click', downloadPNG);
    document.getElementById('downloadSVG').addEventListener('click', downloadSVG);
    document.getElementById('resetBtn').addEventListener('click', resetAll);
    document.getElementById('maxWords').addEventListener('input', updateMaxWordsValue);
    document.getElementById('colorScheme').addEventListener('change', handleColorSchemeChange);
    document.getElementById('btn-use-column')?.addEventListener('click', loadSelectedDatasetColumn);
    
    // Cargar idioma guardado o detectar del navegador
    const savedLang = localStorage.getItem('wordcloud_language');
    const suiteLang = localStorage.getItem('survey_suite_language');
    const browserLang = navigator.language.startsWith('es') ? 'es' : 'en';
    currentLanguage = suiteLang || savedLang || browserLang;
    document.getElementById('languageSelector').value = currentLanguage;
    
    // Aplicar traducciones iniciales
    updateLanguage();
    
    // Inicializar con lista básica
    initializeStopWords();
    
    // Cargar datos guardados si existen
    loadSavedData();
    bindSuiteMessaging();

    const savedActiveDataset = localStorage.getItem('survey_suite_active_dataset');
    if (savedActiveDataset) {
        loadDatasetByName(savedActiveDataset);
    }
}

// Inicializar palabras a excluir con una lista básica
function initializeStopWords() {
    const groups = stopWordGroups[currentLanguage];
    const basicWords = [
        ...groups.articles,
        ...groups.prepositions.slice(0, 10),
        ...groups.conjunctions.slice(0, 5)
    ];
    document.getElementById('stopWords').value = basicWords.join(', ');
}

// Cambiar idioma
function changeLanguage() {
    currentLanguage = document.getElementById('languageSelector').value;
    localStorage.setItem('wordcloud_language', currentLanguage);
    localStorage.setItem('survey_suite_language', currentLanguage);
    updateLanguage();
    initializeStopWords();
}

// Actualizar todos los textos de la interfaz
function updateLanguage() {
    const t = translations[currentLanguage];
    
    // Actualizar elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) {
            element.textContent = t[key];
        }
    });
    
    // Actualizar placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            element.placeholder = t[key];
        }
    });
    
    // Actualizar opciones de select
    document.querySelectorAll('[data-i18n-option]').forEach(option => {
        const key = option.getAttribute('data-i18n-option');
        if (t[key]) {
            option.textContent = t[key];
        }
    });

    const columnSelect = document.getElementById('datasetColumnSelect');
    if (columnSelect && columnSelect.options.length > 0 && !activeDatasetRows.length) {
        columnSelect.innerHTML = `<option value="">${t.selectColumn}</option>`;
    }
}

// Obtener traducción
function t(key) {
    return translations[currentLanguage][key] || key;
}

function bindSuiteMessaging() {
    window.addEventListener('message', (event) => {
        const data = event?.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'survey-suite-set-language' && (data.lang === 'en' || data.lang === 'es')) {
            currentLanguage = data.lang;
            localStorage.setItem('wordcloud_language', currentLanguage);
            localStorage.setItem('survey_suite_language', currentLanguage);
            const languageSelector = document.getElementById('languageSelector');
            if (languageSelector) languageSelector.value = currentLanguage;
            updateLanguage();
            return;
        }

        if (data.type === 'survey-suite-load-dataset' && data.datasetName) {
            loadDatasetByName(data.datasetName);
        }
    });
}

function loadDatasetByName(datasetName) {
    const api = window.RecuEduData;
    if (!api || !api.storage) return;

    const dataset = api.storage.loadDataset(datasetName);
    if (!dataset || !Array.isArray(dataset.data)) {
        showNotification(t('noDatasetLoaded'), 'warning');
        return;
    }

    activeDatasetName = datasetName;
    activeDatasetRows = dataset.data;

    const activeLabel = document.getElementById('activeDatasetName');
    if (activeLabel) activeLabel.textContent = datasetName;

    populateDatasetColumns(activeDatasetRows);
}

function populateDatasetColumns(rows) {
    const select = document.getElementById('datasetColumnSelect');
    if (!select) return;

    select.innerHTML = `<option value="">${t('selectColumn')}</option>`;

    if (!Array.isArray(rows) || rows.length === 0) return;

    const columns = Object.keys(rows[0] || {});
    columns.forEach((col) => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        select.appendChild(option);
    });
}

function loadSelectedDatasetColumn() {
    if (!Array.isArray(activeDatasetRows) || activeDatasetRows.length === 0) {
        showNotification(t('noDatasetLoaded'), 'warning');
        return;
    }

    const column = document.getElementById('datasetColumnSelect')?.value;
    if (!column) {
        showNotification(t('noTextColumnSelected'), 'warning');
        return;
    }

    const values = activeDatasetRows
        .map((row) => row?.[column])
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0);

    if (!values.length) {
        showNotification(t('noTextValuesFound'), 'warning');
        return;
    }

    document.getElementById('textInput').value = values.join('\n');
    updateWordCount();
    showNotification(`${t('loadedColumnRows')}: ${values.length}`, 'success');
}

// Agregar grupo de palabras
function addWordGroup(groupName) {
    const stopWordsTextarea = document.getElementById('stopWords');
    let currentWords = stopWordsTextarea.value
        .split(',')
        .map(w => w.trim())
        .filter(w => w.length > 0);
    
    let newWords = [];
    const groups = stopWordGroups[currentLanguage];
    
    if (groupName === 'all') {
        // Agregar todos los grupos
        Object.values(groups).forEach(group => {
            newWords.push(...group);
        });
    } else if (groups[groupName]) {
        newWords = groups[groupName];
    }
    
    // Combinar y eliminar duplicados
    const combined = [...new Set([...currentWords, ...newWords])];
    stopWordsTextarea.value = combined.join(', ');
    
    showNotification(`${t('wordsAdded')}: ${newWords.length}`, 'success');
}

// Limpiar palabras a excluir
function clearStopWords() {
    if (confirm(t('confirmClearWords'))) {
        document.getElementById('stopWords').value = '';
        showNotification(t('wordsCleared'), 'info');
    }
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
        showNotification(t('fileLoaded'), 'success');
    };
    reader.onerror = () => {
        showNotification(t('fileError'), 'error');
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
        showNotification(t('enterText'), 'warning');
        return;
    }
    
    // Extraer y procesar palabras
    const words = extractWords(text);
    
    if (words.length === 0) {
        showNotification(t('noValidWords'), 'warning');
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
    const fontFamily = document.getElementById('fontFamily').value;
    
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
        .font(fontFamily)
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
            .style('font-family', fontFamily)
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
        showNotification(t('cloudGenerated'), 'success');
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
    tooltip.innerHTML = `<strong>${d.text}</strong><br>${t('frequency')}: ${d.count}`;
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
        statsContainer.innerHTML = `<p class="text-muted">${t('noData')}</p>`;
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
        showNotification(t('generateFirst'), 'warning');
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
            showNotification(t('downloadedImage'), 'success');
        });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

// Descargar como SVG
function downloadSVG() {
    const svg = document.querySelector('#cloudCanvas svg');
    
    if (!svg) {
        showNotification(t('generateFirst'), 'warning');
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
    showNotification(t('downloadedSVG'), 'success');
}

// Reiniciar todo
function resetAll() {
    if (!confirm(t('confirmClear'))) return;
    
    document.getElementById('textInput').value = '';
    document.getElementById('fileInput').value = '';
    d3.select('#cloudCanvas').selectAll('*').remove();
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('wordCount').textContent = '0';
    document.getElementById('stats').innerHTML = '';
    currentWordData = [];
    
    localStorage.removeItem('wordcloud_data');
    showNotification(t('allCleared'), 'info');
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
