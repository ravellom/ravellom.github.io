/* * APP.JS - Constructor REAI-DUA (Versión Final Reparada) * */

// 1. PROMPT MAESTRO AVANZADO
const MASTER_PROMPT = `Actúa como un Diseñador Instruccional experto.
Tu tarea es generar un JSON con ejercicios interactivos variados.

REGLAS DE FORMATO:
1. Respuesta SOLO JSON válido.
2. Estructura polimórfica: el campo "interaction" cambia según el "type".

CATÁLOGO DE TIPOLOGÍAS Y SU ESTRUCTURA "interaction":

1. "multiple_choice" o "true_false":
   "interaction": { "options": [{ "id": "o1", "text": "...", "is_correct": true/false }] }

2. "fill_gaps" (Rellenar huecos):
   "interaction": { 
      "template": "Texto con palabras clave entre [corchetes].", 
      "distractors": ["palabra_trampa1", "palabra_trampa2"] 
   }

3. "ordering" (Ordenar secuencia):
   "interaction": { 
      "sequence": [{ "order": 1, "text": "Paso 1" }, { "order": 2, "text": "Paso 2" }] 
   }

4. "matching" (Relacionar parejas):
   "interaction": { 
      "pairs": [{ "left": "Concepto A", "right": "Definición A" }] 
   }

5. "grouping" (Clasificar):
   "interaction": { 
      "categories": ["Grupo 1", "Grupo 2"],
      "items": [{ "text": "Elemento", "category": "Grupo 1" }]
   }

ESTRUCTURA BASE:
{
  "resource_metadata": { "title": "...", "topic": "..." },
  "exercises": [
    {
      "id": "ex_1",
      "type": "tipo_elegido",
      "content": { "prompt_text": "Enunciado" },
      "interaction": { ...según tipo... },
      "scaffolding": { "hint_1": "...", "explanation": "..." }
    }
  ]
}

TAREA: Genera 4 ejercicios de DIFERENTES TIPOS sobre: 
[PEGAR CONTENIDO AQUÍ]`;

// 2. ESTADO GLOBAL Y REFERENCIAS
let currentData = { resource_metadata: { title: "", topic: "" }, exercises: [] };

const elements = {
    // Entradas
    jsonInput: document.getElementById('json-input'),
    fileUpload: document.getElementById('file-upload'), // Faltaba esta referencia
    
    // Botones
    btnLoad: document.getElementById('btn-load'),
    btnMerge: document.getElementById('btn-merge'),
    btnExport: document.getElementById('btn-export'),
    btnShowPrompt: document.getElementById('btn-show-prompt'),
    btnUploadTrigger: document.getElementById('btn-upload-trigger'), // Faltaba esta referencia
    
    // UI
    exerciseList: document.getElementById('exercise-list'),
    welcomeScreen: document.getElementById('welcome-screen'),
    metaPanel: document.getElementById('meta-panel'),
    statusMsg: document.getElementById('status-msg'),
    
    // Inputs de Metadatos
    inputs: {
        title: document.getElementById('meta-title'),
        topic: document.getElementById('meta-topic'),
        count: document.getElementById('count-total')
    },
    
    // Modal
    modal: {
        overlay: document.getElementById('prompt-modal'),
        close: document.getElementById('btn-close-modal'),
        copy: document.getElementById('btn-copy-prompt'),
        text: document.getElementById('prompt-text')
    }
};

// 3. EVENT LISTENERS
elements.btnLoad.addEventListener('click', () => handleJsonAction('load'));
elements.btnMerge.addEventListener('click', () => handleJsonAction('merge'));
elements.btnExport.addEventListener('click', () => window.exportJson());

// Listeners de subida de archivos (RESTAURADOS)
elements.btnUploadTrigger.addEventListener('click', () => elements.fileUpload.click());
elements.fileUpload.addEventListener('change', handleFileUpload);

// Listeners de UI
elements.inputs.title.addEventListener('input', (e) => currentData.resource_metadata.title = e.target.value);
elements.btnShowPrompt.addEventListener('click', openPromptModal);
elements.modal.close.addEventListener('click', closePromptModal);
elements.modal.overlay.addEventListener('click', (e) => { if(e.target === elements.modal.overlay) closePromptModal(); });
elements.modal.copy.addEventListener('click', selectAllText);

// 4. LÓGICA DE DATOS

// Función para manejar la subida del archivo (RESTAURADA)
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
        if (!newData.exercises) throw new Error('Falta array "exercises"');

        if (action === 'load') {
            currentData = newData;
            if(!currentData.resource_metadata) currentData.resource_metadata = {};
        } else {
            mergeExercises(newData.exercises);
        }
        renderApp();
        showStatus('Procesado correctamente', 'success');
    } catch (e) {
        showStatus('Error JSON: ' + e.message, 'error');
    }
}

function mergeExercises(newEx) {
    newEx.forEach(ex => {
        ex.id = `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        ex.status = 'review';
        currentData.exercises.push(ex);
    });
}

// 5. RENDERIZADO INTELIGENTE
function renderApp() {
    if (currentData.exercises.length > 0) {
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
    elements.inputs.count.innerText = currentData.exercises.length;
    
    elements.exerciseList.innerHTML = '';

    currentData.exercises.forEach((ex, index) => {
        elements.exerciseList.appendChild(createExerciseCard(ex, index));
    });
}

function createExerciseCard(ex, index) {
    const card = document.createElement('div');
    card.className = 'ex-card';
    const isApproved = ex.status === 'approved';

    // HTML DE LA TARJETA
    card.innerHTML = `
        <div class="ex-header">
            <span class="ex-type">#${index + 1} &bull; ${ex.type.toUpperCase()}</span>
            <div class="ex-actions">
                <button onclick="window.deleteExercise('${ex.id}')"><i class="ph ph-trash"></i></button>
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
        return data.sequence.map(item => `
            <div style="display:flex; gap:10px; border-bottom:1px solid #ddd; padding:5px;">
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

    return `<div style="color:orange">Tipo desconocido: ${ex.type}</div>`;
}

// 6. FUNCIONES GLOBALES Y UTILIDADES
function openPromptModal() {
    elements.modal.text.value = MASTER_PROMPT;
    elements.modal.overlay.classList.remove('hidden');
    setTimeout(() => elements.modal.text.select(), 100);
}
function closePromptModal() { elements.modal.overlay.classList.add('hidden'); }
function selectAllText() { elements.modal.text.select(); }

function showStatus(msg, type) {
    elements.statusMsg.innerText = msg;
    elements.statusMsg.style.color = type === 'error' ? 'red' : 'green';
    setTimeout(() => elements.statusMsg.innerText = '', 3000);
}

// Funciones expuestas a Window para HTML dinámico
window.updateData = (id, field, val) => {
    const ex = currentData.exercises.find(e => e.id === id);
    if(ex && field==='prompt') ex.content.prompt_text = val;
    // Nota: Para editar la interacción compleja se requiere lógica UI más avanzada
    if(ex && field==='hint') { if(!ex.scaffolding) ex.scaffolding={}; ex.scaffolding.hint_1 = val; }
    if(ex && field==='explanation') { if(!ex.scaffolding) ex.scaffolding={}; ex.scaffolding.explanation = val; }
};
window.toggleStatus = (id) => {
    const ex = currentData.exercises.find(e => e.id === id);
    if(ex) { ex.status = ex.status==='approved'?'review':'approved'; renderApp(); }
};
window.deleteExercise = (id) => {
    if(confirm('¿Seguro que quieres borrar este ejercicio?')) {
        currentData.exercises = currentData.exercises.filter(e => e.id !== id);
        renderApp();
    }
};
window.exportJson = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ejercicios_${currentData.resource_metadata.title.replace(/\s+/g,'_')}.json`;
    document.body.appendChild(a); a.click(); setTimeout(()=>document.body.removeChild(a), 100);
};