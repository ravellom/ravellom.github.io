/* * APP.JS - Constructor REAI-DUA (Versión Final Reparada) * */

// 1. PROMPT MAESTRO AVANZADO
const MASTER_PROMPT = `Actúa como un Diseñador Instruccional experto.
Tu tarea es generar un JSON con ejercicios interactivos variados siguiendo el esquema oficial.

📋 ESQUEMA COMPLETO: https://ravellom.github.io/Ejecon/schema.json

REGLAS BÁSICAS:
1. Respuesta SOLO JSON válido (sin markdown, sin explicaciones).
2. Campo "interaction" polimórfico según "type".
3. OBLIGATORIO incluir "scaffolding" con hint_1, explanation y learn_more.

TIPOS DE EJERCICIOS DISPONIBLES (schema v1.1):

• multiple_choice: Opciones múltiples (3-4 opciones, solo 1 correcta)
• true_false: Verdadero/Falso (2 opciones)
• fill_gaps: Rellenar huecos ([palabras] + distractors)
• ordering: Ordenar secuencia (4-8 pasos)
• matching: Relacionar parejas (4-8 pares)
• grouping: Clasificar en categorías (2-4 categorías, 6-12 ítems)
• short_answer: Respuesta corta (expected_answers, case_sensitive, max_length)
• essay: Respuesta larga (min_words, max_words, rubric opcional)
• hotspot: Zonas clicables en imagen (image_url, zones[x,y,width,height,is_correct])
• slider: Escala numérica (min, max, correct_value, tolerance)
• drawing: Dibujo/anotación (canvas_width, canvas_height, evaluation_type)

ESTRUCTURA MÍNIMA REQUERIDA:
{
  "resource_metadata": { "title": "Título", "topic": "Tema" },
  "exercises": [
     {
        "id": "ex_TIMESTAMP_INDEX",
        "type": "uno_de_los_tipos",
        "content": { "prompt_text": "Enunciado" },
        "interaction": { /* ver schema.json */ },
        "scaffolding": { 
          "hint_1": "Pista útil",
          "explanation": "Explicación pedagógica",
          "learn_more": "Contenido ampliado (opcional)"
        }
     }
  ]
}

TAREA: Genera 4-6 ejercicios de DIFERENTES TIPOS sobre: 
[PEGAR CONTENIDO AQUÍ]`;

// 2. ESTADO GLOBAL Y REFERENCIAS
let currentData = { resource_metadata: { title: "", topic: "" }, exercises: [] };
let isModalOpen = false;
let autoSaveTimeout;
let isExerciseListListenerAdded = false;
let history = [];
let historyIndex = -1;
let elements = {}; // Inicializar vacío

// Función para guardar estado en history
function saveToHistory() {
    // Remover futuros estados si estamos en medio
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.parse(JSON.stringify(currentData)));
    historyIndex++;
    if (history.length > 50) { // Limitar a 50 estados
        history.shift();
        historyIndex--;
    }
    updateUndoRedoButtons();
}

// Función para inicializar elementos después de que el DOM esté listo
function initializeElements() {
    elements = {
        // Entradas
        jsonInput: document.getElementById('json-input'),
        fileUpload: document.getElementById('file-upload'),
        
        // Botones
        btnLoad: document.getElementById('btn-load'),
        btnMerge: document.getElementById('btn-merge'),
        btnExport: document.getElementById('btn-export'),
        btnExportHtml: document.getElementById('btn-export-html'),
        btnSaveProject: document.getElementById('btn-save-project'),
        btnUndo: document.getElementById('btn-undo'),
        btnRedo: document.getElementById('btn-redo'),
        btnShowPrompt: document.getElementById('btn-show-prompt'),
        btnUploadTrigger: document.getElementById('btn-upload-trigger'),
        btnLoadProject: document.getElementById('btn-load-project'),
        
        // Vistas principales
        welcomeScreen: document.getElementById('welcome-screen'),
        exerciseList: document.getElementById('exercise-list'),
        metaPanel: document.getElementById('meta-panel'),
        
        // Inputs metadata
        inputs: {
            title: document.getElementById('meta-title'),
            topic: document.getElementById('meta-topic'),
            count: document.getElementById('count-total')
        },
        searchInput: document.getElementById('search-input'),
        filterType: document.getElementById('filter-type'),
        
        projectSelect: document.getElementById('project-select'),
        statusMsg: document.getElementById('status-msg'),
        
        // Modal
        modal: {
            overlay: document.getElementById('prompt-modal'),
            close: document.getElementById('btn-close-modal'),
            copy: document.getElementById('btn-copy-prompt'),
            text: document.getElementById('prompt-text')
        },
        previewModal: {
            overlay: document.getElementById('preview-modal'),
            close: document.getElementById('btn-close-preview'),
            content: document.getElementById('preview-content')
        }
    };
}

// 3. FUNCIONES GLOBALES (Deben estar antes de que se usen en onclick/onblur)
window.updateData = (id, field, val) => {
    const sanitizedVal = window.sanitizeText(val);
    const ex = currentData.exercises.find(e => e.id === id);
    if(ex && field==='prompt') ex.content.prompt_text = sanitizedVal;
    if(ex && field==='hint') { if(!ex.scaffolding) ex.scaffolding={}; ex.scaffolding.hint_1 = sanitizedVal; }
    if(ex && field==='explanation') { if(!ex.scaffolding) ex.scaffolding={}; ex.scaffolding.explanation = sanitizedVal; }
    if(ex && field==='learn_more') { if(!ex.scaffolding) ex.scaffolding={}; ex.scaffolding.learn_more = sanitizedVal; }
    saveToHistory();
    autoSave();
};

window.toggleStatus = (id) => {
    const ex = currentData.exercises.find(e => e.id === id);
    if(ex) { 
        ex.status = ex.status==='approved'?'review':'approved'; 
        renderApp(); 
        saveToHistory(); 
        autoSave(); 
    }
};

window.deleteExercise = (id) => {
    if(confirm('¿Seguro que quieres borrar este ejercicio?')) {
        currentData.exercises = currentData.exercises.filter(e => e.id !== id);
        renderApp();
        saveToHistory();
        autoSave();
    }
};

window.generateStudentView = function(ex) {
    let html = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin-bottom: 20px;">
                <h4 style="margin: 0; font-size: 1.3rem; font-weight: 600;">${ex.content?.prompt_text || 'Sin enunciado'}</h4>
            </div>
    `;
    
    const data = ex.interaction;
    if (!data) return html + '<p style="color: #999; text-align: center; padding: 40px;">⚠️ Interacción no disponible</p></div>';
    
    if (ex.type === 'multiple_choice' || ex.type === 'true_false') {
        html += '<div style="padding: 20px;">';
        html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Selecciona la respuesta correcta:</p>';
        html += data.options?.map((opt, idx) => `
            <label style="display: block; margin: 12px 0; padding: 15px; background: ${opt.is_correct ? '#d4edda' : '#f8f9fa'}; 
                   border: 2px solid ${opt.is_correct ? '#28a745' : '#dee2e6'}; border-radius: 8px; cursor: pointer; 
                   transition: all 0.3s; position: relative;">
                <input type="radio" name="answer" value="${opt.id}" style="margin-right: 10px;">
                <span style="font-weight: 500;">${String.fromCharCode(65 + idx)})</span> ${opt.text}
                ${opt.is_correct ? '<span style="position: absolute; right: 15px; color: #28a745; font-weight: bold;">✓ Correcta</span>' : ''}
            </label>
        `).join('') || '<p style="color: #999;">Opciones no disponibles</p>';
        html += '</div>';
        
    } else if (ex.type === 'fill_gaps') {
        html += '<div style="padding: 20px;">';
        html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Completa los espacios en blanco:</p>';
        let template = data.template || 'Plantilla no disponible';
        template = template.replace(/\[([^\]]+)\]/g, '<input type="text" placeholder="..." style="border: none; border-bottom: 2px solid #667eea; padding: 5px 10px; margin: 0 5px; font-weight: 500; min-width: 100px; background: #f0f4ff;">');
        html += `<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; line-height: 2; font-size: 1.05rem;">${template}</div>`;
        if (data.distractors && data.distractors.length > 0) {
            html += '<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">';
            html += '<p style="font-weight: 500; margin-bottom: 10px; color: #856404;">💡 Palabras disponibles:</p>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
            data.distractors.forEach(word => {
                html += `<span style="background: white; padding: 8px 15px; border-radius: 20px; border: 1px solid #ffc107; font-weight: 500; cursor: pointer;">${word}</span>`;
            });
            html += '</div></div>';
        }
        html += '</div>';
        
    } else if (ex.type === 'ordering') {
        html += '<div style="padding: 20px;">';
        html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Ordena los elementos en la secuencia correcta:</p>';
        html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
        html += data.sequence?.sort((a, b) => a.order - b.order).map(item => `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; 
                 display: flex; align-items: center; gap: 15px; cursor: move; transition: all 0.3s;">
                <span style="background: #667eea; color: white; width: 35px; height: 35px; border-radius: 50%; 
                      display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem;">
                    ${item.order}
                </span>
                <span style="flex: 1; font-weight: 500;">${item.text}</span>
                <i class="ph ph-dots-six-vertical" style="color: #999; font-size: 1.3rem;"></i>
            </div>
        `).join('') || '<p style="color: #999;">Secuencia no disponible</p>';
        html += '</div></div>';
        
    } else if (ex.type === 'matching') {
        html += '<div style="padding: 20px;">';
        html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Relaciona cada concepto con su definición:</p>';
        html += '<div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center;">';
        html += data.pairs?.map((pair, idx) => `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; font-weight: 500; text-align: right; border: 2px solid #2196f3;">
                ${pair.left}
            </div>
            <div style="width: 40px; height: 2px; background: linear-gradient(to right, #2196f3, #f44336); position: relative;">
                <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                      background: white; border: 2px solid #667eea; border-radius: 50%; width: 30px; height: 30px; 
                      display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
                    ${idx + 1}
                </span>
            </div>
            <div style="background: #ffebee; padding: 15px; border-radius: 8px; font-weight: 500; border: 2px solid #f44336;">
                ${pair.right}
            </div>
        `).join('') || '<p style="color: #999; grid-column: 1 / -1;">Parejas no disponibles</p>';
        html += '</div></div>';
        
    } else if (ex.type === 'grouping') {
        html += '<div style="padding: 20px;">';
        html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Clasifica los elementos en las categorías correctas:</p>';
        const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec'];
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">';
        data.categories?.forEach((cat, idx) => {
            html += `
                <div style="background: ${colors[idx % colors.length]}; padding: 15px; border-radius: 10px; border: 2px dashed #667eea;">
                    <h5 style="margin: 0 0 10px 0; color: #667eea; font-weight: 600; text-align: center;">${cat}</h5>
                    <div style="min-height: 100px; display: flex; flex-direction: column; gap: 8px;">
            `;
            data.items?.filter(item => item.category === cat).forEach(item => {
                html += `<div style="background: white; padding: 10px; border-radius: 5px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📌 ${item.text}</div>`;
            });
            html += '</div></div>';
        });
        html += '</div></div>';

    } else if (ex.type === 'short_answer') {
        html += '<div style="padding: 20px;">';
        html += '<p style="font-weight: 500; margin-bottom: 15px; color: #555;">Escribe una respuesta corta:</p>';
        html += `<input type="text" style="width:100%; padding:12px; border:2px solid #e0e7ff; border-radius:8px;" placeholder="Tu respuesta..." maxlength="${ex.interaction.max_length || 200}">`;
        if (ex.interaction.expected_answers) {
            html += '<p style="margin-top:10px; color:#888; font-size:0.9rem;">Respuestas esperadas (referencia): ' + ex.interaction.expected_answers.join(', ') + '</p>';
        }
        html += '</div>';

    } else if (ex.type === 'essay') {
        html += '<div style="padding: 20px;">';
        html += `<p style="font-weight: 500; margin-bottom: 10px; color: #555;">Redacta un ensayo (${ex.interaction.min_words || 50}-${ex.interaction.max_words || 250} palabras):</p>`;
        html += '<textarea style="width:100%; min-height:200px; padding:15px; border:2px solid #e0e7ff; border-radius:8px; resize: vertical;" placeholder="Desarrolla tu respuesta..."></textarea>';
        if (ex.interaction.rubric && Object.keys(ex.interaction.rubric).length > 0) {
            html += '<div style="margin-top:15px; padding:12px; background:#f8f9fa; border-radius:8px;">';
            html += '<strong>Rúbrica:</strong><pre style="white-space: pre-wrap; margin: 8px 0 0 0;">' + JSON.stringify(ex.interaction.rubric, null, 2) + '</pre>';
            html += '</div>';
        }
        html += '</div>';

    } else if (ex.type === 'hotspot') {
        html += '<div style="padding: 20px;">';
        html += '<p style="font-weight: 500; margin-bottom: 10px; color: #555;">Haz clic en las zonas correctas de la imagen:</p>';
        if (ex.interaction.image_url) {
            html += `<img src="${ex.interaction.image_url}" alt="Hotspot" style="max-width:100%; border-radius:8px; border:2px solid #e0e7ff;">`;
            html += '<p style="color:#888; font-size:0.9rem; margin-top:8px;">Zonas definidas: ' + (ex.interaction.zones?.length || 0) + '</p>';
        } else {
            html += '<p style="color:#999;">No hay imagen configurada.</p>';
        }
        html += '</div>';

    } else if (ex.type === 'slider') {
        html += '<div style="padding: 20px;">';
        html += `<p style="font-weight: 500; margin-bottom: 10px; color: #555;">Selecciona un valor entre ${ex.interaction.min || 0} y ${ex.interaction.max || 100}:</p>`;
        html += `<input type="range" min="${ex.interaction.min || 0}" max="${ex.interaction.max || 100}" value="${ex.interaction.correct_value || 50}" style="width:100%;">`;
        html += `<p style="margin-top:8px; color:#888; font-size:0.9rem;">Valor objetivo: ${ex.interaction.correct_value || 50} ± ${ex.interaction.tolerance || 5}</p>`;
        html += '</div>';

    } else if (ex.type === 'drawing') {
        html += '<div style="padding: 20px;">';
        html += '<p style="font-weight: 500; margin-bottom: 10px; color: #555;">Dibuja o anota tu respuesta:</p>';
        html += `<div style="width:100%; max-width: ${ex.interaction.canvas_width || 800}px; height: ${ex.interaction.canvas_height || 400}px; background:#f8f9fa; border:2px dashed #e0e7ff; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#bbb;">Zona de dibujo (mock)</div>`;
        html += `<p style="margin-top:8px; color:#888; font-size:0.9rem;">Evaluación: ${ex.interaction.evaluation_type || 'manual'}</p>`;
        html += '</div>';
    }
    
    // Agregar sección de andamiaje si existe
    if (ex.scaffolding && (ex.scaffolding.hint_1 || ex.scaffolding.explanation || ex.scaffolding.learn_more)) {
        html += '<div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 10px;">';
        if (ex.scaffolding.hint_1) {
            html += `<p style="margin: 0 0 10px 0;"><strong style="color: #d84315;">💡 Pista:</strong> ${ex.scaffolding.hint_1}</p>`;
        }
        if (ex.scaffolding.explanation) {
            html += `<p style="margin: 0 0 10px 0;"><strong style="color: #d84315;">📚 Explicación:</strong> ${ex.scaffolding.explanation}</p>`;
        }
        if (ex.scaffolding.learn_more) {
            html += `<details style="margin: 10px 0 0 0; cursor: pointer;">
                <summary style="font-weight: 600; color: #d84315; padding: 8px; background: rgba(255,255,255,0.3); border-radius: 5px;">
                    📖 Aprender más
                </summary>
                <div style="margin-top: 10px; padding: 15px; background: rgba(255,255,255,0.5); border-radius: 5px; line-height: 1.6;">
                    ${ex.scaffolding.learn_more}
                </div>
            </details>`;
        }
        html += '</div>';
    }
    
    html += '</div>';
    return html;
};

window.previewExercise = (id) => {
    const ex = currentData.exercises.find(e => e.id === id);
    if (ex && elements.previewModal && elements.previewModal.content && elements.previewModal.overlay) {
        elements.previewModal.content.innerHTML = window.generateStudentView(ex);
        elements.previewModal.overlay.classList.remove('hidden');
        elements.previewModal.overlay.style.display = 'flex';
    }
};

// 4. ATTACHEMENT DE EVENT LISTENERS - Se ejecuta al final con DOMContentLoaded
function attachEventListeners() {
    elements.btnLoad.addEventListener('click', () => handleJsonAction('load'));
    elements.btnMerge.addEventListener('click', () => handleJsonAction('merge'));
    elements.btnExport.addEventListener('click', () => window.exportJson());
    elements.btnSaveProject.addEventListener('click', saveProject);
    elements.btnLoadProject.addEventListener('click', loadProject);
    elements.btnUndo.addEventListener('click', undo);
    elements.btnRedo.addEventListener('click', redo);
    elements.btnExportHtml.addEventListener('click', exportAsHTML);

    // Botón limpiar JSON
    const btnClearJson = document.getElementById('btn-clear-json');
    if (btnClearJson) {
        btnClearJson.addEventListener('click', () => {
            if (elements.jsonInput.value.trim() && !confirm('¿Seguro que quieres limpiar el texto?')) {
                return;
            }
            elements.jsonInput.value = '';
            elements.jsonInput.focus();
            showStatus('Texto limpiado', 'success');
        });
    }

    // Listeners de subida de archivos
    elements.btnUploadTrigger.addEventListener('click', () => elements.fileUpload.click());
    elements.fileUpload.addEventListener('change', handleFileUpload);

    // Listeners de UI
    elements.inputs.title.addEventListener('input', (e) => { currentData.resource_metadata.title = e.target.value; autoSave(); });
    elements.inputs.topic.addEventListener('input', (e) => { currentData.resource_metadata.topic = e.target.value; autoSave(); });
    elements.searchInput.addEventListener('input', renderApp);
    elements.filterType.addEventListener('change', renderApp);
    elements.btnShowPrompt.addEventListener('click', (e) => {
        e.preventDefault();
        openPromptModal();
    });
    elements.modal.close.addEventListener('click', closePromptModal);
    elements.modal.overlay.addEventListener('click', (e) => { if(e.target === elements.modal.overlay) closePromptModal(); });
    elements.modal.copy.addEventListener('click', selectAllText);
    elements.previewModal.close.addEventListener('click', closePreviewModal);
    elements.previewModal.overlay.addEventListener('click', (e) => { if(e.target === elements.previewModal.overlay) closePreviewModal(); });

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    saveProject();
                    break;
                case 'o':
                    e.preventDefault();
                    elements.fileUpload.click();
                    break;
            }
        }
        if (e.key === 'Escape' && isModalOpen) {
            closePromptModal();
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    attachEventListeners();
    loadFromLocalStorage();
    populateProjectSelect();
    renderApp();
});
// Función para guardar automáticamente en localStorage con debounce
function autoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        localStorage.setItem('ejecon_currentData', JSON.stringify(currentData));
    }, 1000); // 1 segundo de debounce
}

// Función para cargar desde localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('ejecon_currentData');
    if (saved) {
        try {
            currentData = validateJsonSchema(JSON.parse(saved));
            renderApp();
            saveToHistory();
            showStatus('Datos cargados desde almacenamiento local', 'info');
        } catch (e) {
            showStatus('Error al cargar datos guardados: ' + e.message, 'error');
        }
    }
}
function validateJsonSchema(data) {
    if (!data || typeof data !== 'object') throw new Error('El JSON debe ser un objeto válido.');
    if (!data.resource_metadata || typeof data.resource_metadata !== 'object') {
        data.resource_metadata = { title: '', topic: '' };
    }
    if (!Array.isArray(data.exercises)) {
        data.exercises = []; // Crear array vacío si falta
    }
    
    data.exercises.forEach((ex, index) => {
        if (!ex.id) ex.id = `ex_${Date.now()}_${index}`;
        if (!ex.type || !['multiple_choice', 'true_false', 'fill_gaps', 'ordering', 'matching', 'grouping', 'short_answer', 'essay', 'hotspot', 'slider', 'drawing'].includes(ex.type)) {
            ex.type = 'multiple_choice'; // Default
        }
        if (!ex.content || typeof ex.content !== 'object') ex.content = { prompt_text: 'Enunciado faltante' };
        if (!ex.content.prompt_text) ex.content.prompt_text = 'Enunciado faltante';
        
        if (!ex.interaction || typeof ex.interaction !== 'object') {
            // Crear interacción por defecto según tipo
            switch (ex.type) {
                case 'multiple_choice':
                case 'true_false':
                    ex.interaction = { options: [{ id: 'o1', text: 'Opción 1', is_correct: false }] };
                    break;
                case 'fill_gaps':
                    ex.interaction = { template: '[palabra]', distractors: [] };
                    break;
                case 'ordering':
                    ex.interaction = { sequence: [{ order: 1, text: 'Paso 1' }] };
                    break;
                case 'matching':
                    ex.interaction = { pairs: [{ left: 'Concepto', right: 'Definición' }] };
                    break;
                case 'grouping':
                    ex.interaction = { categories: ['Grupo 1'], items: [{ text: 'Elemento', category: 'Grupo 1' }] };
                    break;
                case 'short_answer':
                    ex.interaction = { expected_answers: ['respuesta'], case_sensitive: false, max_length: 120 };
                    break;
                case 'essay':
                    ex.interaction = { min_words: 50, max_words: 250, rubric: {} };
                    break;
                case 'hotspot':
                    ex.interaction = { image_url: '', zones: [{ x: 0, y: 0, width: 50, height: 50, is_correct: true }] };
                    break;
                case 'slider':
                    ex.interaction = { min: 0, max: 100, correct_value: 50, tolerance: 5 };
                    break;
                case 'drawing':
                    ex.interaction = { canvas_width: 800, canvas_height: 600, evaluation_type: 'manual' };
                    break;
            }
        }
        
        // Validaciones específicas (menos estrictas)
        if ((ex.type === 'multiple_choice' || ex.type === 'true_false') && !Array.isArray(ex.interaction.options)) {
            ex.interaction.options = [{ id: 'o1', text: 'Opción 1', is_correct: false }];
        }
        if (ex.type === 'fill_gaps') {
            if (!ex.interaction.template) ex.interaction.template = '[palabra]';
            if (!Array.isArray(ex.interaction.distractors)) ex.interaction.distractors = [];
        }
        if (ex.type === 'ordering' && !Array.isArray(ex.interaction.sequence)) {
            ex.interaction.sequence = [{ order: 1, text: 'Paso 1' }];
        }
        if (ex.type === 'matching' && !Array.isArray(ex.interaction.pairs)) {
            ex.interaction.pairs = [{ left: 'Concepto', right: 'Definición' }];
        }
        if (ex.type === 'grouping') {
            if (!Array.isArray(ex.interaction.categories)) ex.interaction.categories = ['Grupo 1'];
            if (!Array.isArray(ex.interaction.items)) ex.interaction.items = [{ text: 'Elemento', category: 'Grupo 1' }];
        }
        if (ex.type === 'short_answer') {
            if (!Array.isArray(ex.interaction.expected_answers)) ex.interaction.expected_answers = ['respuesta'];
            if (typeof ex.interaction.case_sensitive !== 'boolean') ex.interaction.case_sensitive = false;
            if (!ex.interaction.max_length) ex.interaction.max_length = 120;
        }
        if (ex.type === 'essay') {
            if (!ex.interaction.min_words) ex.interaction.min_words = 50;
            if (!ex.interaction.max_words) ex.interaction.max_words = 250;
            if (!ex.interaction.rubric || typeof ex.interaction.rubric !== 'object') ex.interaction.rubric = {};
        }
        if (ex.type === 'hotspot') {
            if (!ex.interaction.image_url) ex.interaction.image_url = '';
            if (!Array.isArray(ex.interaction.zones)) ex.interaction.zones = [{ x: 0, y: 0, width: 50, height: 50, is_correct: true }];
        }
        if (ex.type === 'slider') {
            if (typeof ex.interaction.min !== 'number') ex.interaction.min = 0;
            if (typeof ex.interaction.max !== 'number') ex.interaction.max = 100;
            if (typeof ex.interaction.correct_value !== 'number') ex.interaction.correct_value = 50;
            if (typeof ex.interaction.tolerance !== 'number') ex.interaction.tolerance = 5;
        }
        if (ex.type === 'drawing') {
            if (!ex.interaction.canvas_width) ex.interaction.canvas_width = 800;
            if (!ex.interaction.canvas_height) ex.interaction.canvas_height = 600;
            if (!ex.interaction.evaluation_type) ex.interaction.evaluation_type = 'manual';
        }
        
        if (!ex.scaffolding || typeof ex.scaffolding !== 'object') ex.scaffolding = { hint_1: '', explanation: '', learn_more: '' };
        if (!ex.scaffolding.hint_1) ex.scaffolding.hint_1 = '';
        if (!ex.scaffolding.explanation) ex.scaffolding.explanation = '';
        if (!ex.scaffolding.learn_more) ex.scaffolding.learn_more = '';
    });
    return data;
}

// Función para manejar clicks en exerciseList
function handleExerciseListClick(e) {
    const button = e.target.closest('[data-action]');
    if (button) {
        const action = button.dataset.action;
        const id = button.dataset.id;
        if (action === 'preview' && id) window.previewExercise(id);
        if (action === 'delete' && id) window.deleteExercise(id);
    }
}

function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e, exId) {
    e.preventDefault();
    if (draggedElement && draggedElement !== e.target) {
        const ex = currentData.exercises.find(e => e.id === exId);
        if (ex && ex.type === 'ordering') {
            const draggedIdx = parseInt(draggedElement.dataset.index);
            const targetIdx = parseInt(e.target.dataset.index);
            // Reordenar array
            const [removed] = ex.interaction.sequence.splice(draggedIdx, 1);
            ex.interaction.sequence.splice(targetIdx, 0, removed);
            // Actualizar orders
            ex.interaction.sequence.forEach((item, idx) => item.order = idx + 1);
            renderApp();
        }
    }
    draggedElement = null;
}
// Función para sanitizar texto editable (prevenir XSS básico)
window.sanitizeText = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML; // Solo texto plano
}
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        // Ponemos el contenido en el textarea por si el usuario quiere verlo
        elements.jsonInput.value = content;
        // Ejecutamos la carga automáticamente
        handleJsonAction('load');
    };
    reader.readAsText(file);
    // Resetear valor para permitir cargar el mismo archivo dos veces si se necesita
    event.target.value = '';
}

function handleJsonAction(action) {
    const rawText = elements.jsonInput.value.trim();
    if (!rawText) return showStatus('Entrada vacía. Pega un JSON o sube un archivo.', 'error');
    
    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const newData = JSON.parse(cleanText);
        const validatedData = validateJsonSchema(newData); // Validar y crear defaults
        
        if (action === 'load') {
            currentData = validatedData;
        } else {
            mergeExercises(validatedData.exercises);
        }
        renderApp();
        saveToHistory();
        autoSave();
        showStatus('Procesado correctamente', 'success');
    } catch (e) {
        console.error('Error in handleJsonAction:', e);
        showStatus('Error: ' + e.message, 'error');
    }
}

function mergeExercises(newEx) {
    try {
        const validatedEx = validateJsonSchema({ exercises: newEx }).exercises; // Validar solo exercises
        validatedEx.forEach(ex => {
            ex.id = `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            ex.status = 'review';
            currentData.exercises.push(ex);
        });
        saveToHistory();
        autoSave();
    } catch (e) {
        showStatus('Error al fusionar: ' + e.message, 'error');
    }
}

// 5. RENDERIZADO INTELIGENTE
function renderApp() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const filterType = elements.filterType.value;
    
    let filteredExercises = currentData.exercises.filter(ex => {
        const matchesSearch = !searchTerm || ex.content?.prompt_text?.toLowerCase().includes(searchTerm);
        const matchesType = !filterType || ex.type === filterType;
        return matchesSearch && matchesType;
    });
    
    if (filteredExercises.length > 0) {
        elements.welcomeScreen.classList.add('hidden');
        elements.exerciseList.classList.remove('hidden');
        elements.metaPanel.classList.remove('hidden');
        elements.btnExport.disabled = false;
    } else {
        elements.welcomeScreen.classList.remove('hidden');
        elements.exerciseList.classList.add('hidden');
        elements.metaPanel.classList.add('hidden');
    }
    
    elements.inputs.title.value = currentData.resource_metadata.title || '';
    elements.inputs.topic.value = currentData.resource_metadata.topic || '';
    elements.inputs.count.innerText = currentData.exercises.length; // Total, no filtrado
    
    elements.exerciseList.innerHTML = '';

    filteredExercises.forEach((ex, index) => {
        elements.exerciseList.appendChild(createExerciseCard(ex, index));
    });

    // Event delegation for actions (solo una vez)
    if (!isExerciseListListenerAdded) {
        elements.exerciseList.addEventListener('click', handleExerciseListClick);
        isExerciseListListenerAdded = true;
    }
    updateUndoRedoButtons();
}

function createExerciseCard(ex, index) {
    const card = document.createElement('div');
    card.className = 'ex-card fade-in';
    const isApproved = ex.status === 'approved';

    // HTML DE LA TARJETA
    card.innerHTML = `
        <div class="ex-header">
            <span class="ex-type">#${index + 1} &bull; ${ex.type.toUpperCase()}</span>
        <div class="ex-actions">
                <button type="button" data-action="preview" data-id="${ex.id}" title="Vista previa"><i class="ph ph-eye"></i></button>
                <button type="button" data-action="delete" data-id="${ex.id}"><i class="ph ph-trash"></i></button>
            </div>
        </div>
        <div class="ex-body">
            <div class="stimulus-section">
                <div class="stimulus-text editable" contenteditable="true" 
                     onblur="window.updateData('${ex.id}', 'prompt', this.innerText)">
                     ${ex.content?.prompt_text || 'Sin pregunta'}
                </div>
            </div>

            <div class="interaction-section" style="background:#f1f5f9; padding:15px; border-radius:8px;">
                ${getInteractionHTML(ex)} 
            </div>

            <div class="dua-section" style="margin-top:20px;">
                <p><i class="ph ph-lightbulb"></i> 
                   <span class="editable" contenteditable="true" onblur="window.updateData('${ex.id}', 'hint', this.innerText)">
                   ${ex.scaffolding?.hint_1 || 'Añadir pista...'}</span>
                </p>
                <p><i class="ph ph-info"></i> 
                   <span class="editable" contenteditable="true" onblur="window.updateData('${ex.id}', 'explanation', this.innerText)">
                   ${ex.scaffolding?.explanation || 'Añadir explicación...'}</span>
                </p>
                <p><i class="ph ph-book-open"></i> 
                   <span class="editable" contenteditable="true" onblur="window.updateData('${ex.id}', 'learn_more', this.innerText)">
                   ${ex.scaffolding?.learn_more || 'Añadir contenido ampliado...'}</span>
                </p>
            </div>
        </div>
        <div class="ex-footer">
            <button class="btn ${isApproved ? 'btn-approve active' : 'btn-outline'}" 
                    onclick="window.toggleStatus('${ex.id}')">
                <i class="ph ${isApproved ? 'ph-check-circle' : 'ph-circle'}"></i> 
                ${isApproved ? 'Aprobado' : 'Aprobar'}
            </button>
        </div>
    `;
    // Agregar drag-and-drop para ordering
    const orderingItems = card.querySelectorAll('.ordering-item');
    orderingItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', (e) => handleDrop(e, ex.id));
    });
    return card;
}

// --- FUNCIÓN CLAVE: RENDERIZADO SEGÚN TIPOLOGÍA ---
function getInteractionHTML(ex) {
    const data = ex.interaction;
    if (!data) return '<em style="color:red">Error: Datos de interacción vacíos</em>';

    // CASO 1 Y 2: MULTIPLE CHOICE / TRUE FALSE
    if (ex.type === 'multiple_choice' || ex.type === 'true_false') {
        if (!data.options) return 'Faltan opciones';
        return data.options.map(opt => `
            <div style="display:flex; gap:10px; margin-bottom:5px; align-items:center;">
                <i class="ph ${opt.is_correct ? 'ph-check-circle' : 'ph-circle'}" 
                   style="color:${opt.is_correct ? 'green' : 'gray'}"></i>
                <span contenteditable="true" class="editable">${opt.text}</span>
            </div>
        `).join('');
    }

    // CASO 3: FILL GAPS (HUECOS)
    if (ex.type === 'fill_gaps') {
        return `
            <div style="font-family:monospace; background:white; padding:10px; border:1px solid #ccc;">
                <strong>Plantilla:</strong> <br>
                <span contenteditable="true" class="editable">${data.template || ''}</span>
            </div>
            <div style="margin-top:5px; font-size:0.9rem;">
                Distractores: <em>${data.distractors ? data.distractors.join(', ') : 'Ninguno'}</em>
            </div>
        `;
    }

    // CASO 4: ORDERING (SECUENCIA)
    if (ex.type === 'ordering') {
        if (!data.sequence) return 'Falta secuencia';
        return data.sequence.map((item, idx) => `
            <div class="ordering-item" draggable="true" data-index="${idx}" style="display:flex; gap:10px; border-bottom:1px solid #ddd; padding:5px; cursor:move;">
                <strong style="color:var(--primary)">${item.order}.</strong>
                <span contenteditable="true" class="editable">${item.text}</span>
            </div>
        `).join('');
    }

    // CASO 5: MATCHING (PAREJAS)
    if (ex.type === 'matching') {
        if (!data.pairs) return 'Faltan parejas';
        return data.pairs.map(pair => `
            <div style="display:grid; grid-template-columns: 1fr 20px 1fr; gap:10px; align-items:center; margin-bottom:5px;">
                <span contenteditable="true" class="editable" style="background:white; padding:4px;">${pair.left}</span>
                <i class="ph ph-arrows-left-right"></i>
                <span contenteditable="true" class="editable" style="background:white; padding:4px;">${pair.right}</span>
            </div>
        `).join('');
    }

    // CASO 6: GROUPING (CLASIFICACIÓN)
    if (ex.type === 'grouping') {
        return `
            <div style="margin-bottom:10px;"><strong>Categorías:</strong> ${data.categories ? data.categories.join(' | ') : ''}</div>
            ${data.items ? data.items.map(item => `
                <div style="font-size:0.9rem;">
                    • <span contenteditable="true" class="editable">${item.text}</span> 
                    &rarr; <strong>${item.category}</strong>
                </div>
            `).join('') : ''}
        `;
    }

    // CASO 7: SHORT ANSWER (RESPUESTA CORTA)
    if (ex.type === 'short_answer') {
        return `
            <div style="background:white; padding:10px; border-radius:5px;">
                <div style="margin-bottom:8px;">
                    <strong>Respuestas esperadas:</strong> 
                    <em>${data.expected_answers ? data.expected_answers.join(', ') : 'Ninguna'}</em>
                </div>
                <div style="font-size:0.9rem; color:#666;">
                    Max. caracteres: ${data.max_length || 200} | 
                    Sensible a mayúsculas: ${data.case_sensitive ? 'Sí' : 'No'}
                </div>
            </div>
        `;
    }

    // CASO 8: ESSAY (ENSAYO/REDACCIÓN)
    if (ex.type === 'essay') {
        return `
            <div style="background:white; padding:10px; border-radius:5px;">
                <div style="margin-bottom:8px;">
                    <strong>Extensión:</strong> ${data.min_words || 50} - ${data.max_words || 250} palabras
                </div>
                ${data.rubric && Object.keys(data.rubric).length > 0 ? 
                    `<div style="margin-top:8px; font-size:0.9rem;">
                        <strong>Rúbrica:</strong> <pre style="background:#f8f9fa; padding:8px; border-radius:4px; overflow-x:auto;">${JSON.stringify(data.rubric, null, 2)}</pre>
                    </div>` : 
                    '<div style="color:#999; font-size:0.9rem;">Sin rúbrica</div>'}
            </div>
        `;
    }

    // CASO 9: HOTSPOT (ZONAS CLICABLES)
    if (ex.type === 'hotspot') {
        return `
            <div style="background:white; padding:10px; border-radius:5px;">
                <div style="margin-bottom:8px;">
                    <strong>Imagen:</strong> 
                    ${data.image_url ? 
                        `<img src="${data.image_url}" alt="Hotspot" style="max-width:100%; max-height:150px; border-radius:5px; margin-top:5px;">` : 
                        '<span style="color:#999;">No configurada</span>'}
                </div>
                <div style="font-size:0.9rem; color:#666;">
                    Zonas definidas: ${data.zones ? data.zones.length : 0}
                </div>
            </div>
        `;
    }

    // CASO 10: SLIDER (ESCALA NUMÉRICA)
    if (ex.type === 'slider') {
        return `
            <div style="background:white; padding:10px; border-radius:5px;">
                <div style="margin-bottom:8px;">
                    <strong>Rango:</strong> ${data.min ?? 0} - ${data.max ?? 100}
                </div>
                <div style="font-size:0.9rem; color:#666;">
                    Valor correcto: <strong>${data.correct_value ?? 50}</strong> 
                    (tolerancia: ±${data.tolerance ?? 5})
                </div>
                <input type="range" min="${data.min ?? 0}" max="${data.max ?? 100}" 
                       value="${data.correct_value ?? 50}" disabled 
                       style="width:100%; margin-top:8px;">
            </div>
        `;
    }

    // CASO 11: DRAWING (DIBUJO/ANOTACIÓN)
    if (ex.type === 'drawing') {
        return `
            <div style="background:white; padding:10px; border-radius:5px;">
                <div style="margin-bottom:8px;">
                    <strong>Canvas:</strong> ${data.canvas_width || 800}px × ${data.canvas_height || 600}px
                </div>
                <div style="font-size:0.9rem; color:#666;">
                    Evaluación: <strong>${data.evaluation_type || 'manual'}</strong>
                </div>
                <div style="width:100%; height:100px; background:#f8f9fa; border:2px dashed #ddd; 
                            border-radius:5px; display:flex; align-items:center; justify-content:center; 
                            margin-top:8px; color:#999;">
                    Zona de dibujo (vista previa)
                </div>
            </div>
        `;
    }

    return `<div style="color:orange">Tipo desconocido: ${ex.type}</div>`;
}

// 6. FUNCIONES GLOBALES Y UTILIDADES
function openPromptModal() {
    if (isModalOpen) return;
    isModalOpen = true;
    elements.modal.text.value = MASTER_PROMPT;
    elements.modal.overlay.classList.remove('hidden');
    elements.modal.overlay.style.display = 'flex';
    setTimeout(() => {
        elements.modal.text.focus();
        elements.modal.text.select();
    }, 100);
}
function closePromptModal() { 
    isModalOpen = false;
    elements.modal.overlay.classList.add('hidden');
    elements.modal.overlay.style.display = 'none'; 
}
function closePreviewModal() {
    elements.previewModal.overlay.classList.add('hidden');
    elements.previewModal.overlay.style.display = 'none';
}
function selectAllText() { elements.modal.text.select(); }

function showStatus(msg, type) {
    elements.statusMsg.innerText = msg;
    elements.statusMsg.className = 'status-msg'; // Reset
    elements.statusMsg.classList.add(`status-${type}`);
    setTimeout(() => elements.statusMsg.innerText = '', 5000);
}

window.exportJson = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ejercicios_${currentData.resource_metadata.title.replace(/\s+/g,'_')}.json`;
    document.body.appendChild(a); a.click(); setTimeout(()=>document.body.removeChild(a), 100);
};

function exportAsHTML() {
    const htmlContent = generateHTMLExport();
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ejercicios_${currentData.resource_metadata.title.replace(/\s+/g,'_')}.html`;
    document.body.appendChild(a); a.click(); setTimeout(()=>document.body.removeChild(a), 100);
}

function saveProject() {
    const name = prompt('Nombre del proyecto:');
    if (name) {
        const projects = JSON.parse(localStorage.getItem('ejecon_projects') || '{}');
        projects[name] = currentData;
        localStorage.setItem('ejecon_projects', JSON.stringify(projects));
        populateProjectSelect();
        showStatus(`Proyecto "${name}" guardado`, 'success');
    }
}

function loadProject() {
    const selected = elements.projectSelect.value;
    if (selected) {
        const projects = JSON.parse(localStorage.getItem('ejecon_projects') || '{}');
        if (projects[selected]) {
            currentData = validateJsonSchema(projects[selected]);
            renderApp();
            showStatus(`Proyecto "${selected}" cargado`, 'success');
        }
    }
}

function populateProjectSelect() {
    const projects = JSON.parse(localStorage.getItem('ejecon_projects') || '{}');
    elements.projectSelect.innerHTML = '<option value="">Seleccionar proyecto...</option>';
    Object.keys(projects).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        elements.projectSelect.appendChild(option);
    });
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        currentData = JSON.parse(JSON.stringify(history[historyIndex]));
        renderApp();
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        currentData = JSON.parse(JSON.stringify(history[historyIndex]));
        renderApp();
        updateUndoRedoButtons();
    }
}

function updateUndoRedoButtons() {
    elements.btnUndo.disabled = historyIndex <= 0;
    elements.btnRedo.disabled = historyIndex >= history.length - 1;
}

function generateHTMLExport() {
    const title = currentData.resource_metadata.title || 'Ejercicios';
    const topic = currentData.resource_metadata.topic || '';
    
    let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        .exercise { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .exercise h3 { margin-top: 0; color: #444; }
        .question { font-weight: bold; }
        .answer { margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #007bff; }
        .type { font-size: 0.9em; color: #666; text-transform: uppercase; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${topic ? `<h2>Tema: ${topic}</h2>` : ''}
    
    ${currentData.exercises.map((exercise, index) => `
    <div class="exercise">
        <div class="type">${exercise.type || 'Ejercicio'}</div>
        <h3>Ejercicio ${index + 1}</h3>
        <div class="question">${exercise.question || ''}</div>
        ${exercise.answer ? `<div class="answer">${exercise.answer}</div>` : ''}
    </div>
    `).join('')}
</body>
</html>`;
    
    return html;
}