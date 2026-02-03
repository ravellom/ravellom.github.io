let maxAuthors = 6;
let editingIndex = null;

// Estructura para almacenar referencias como objetos
let referencesData = [];

// Esquema de documentos cargado desde JSON
let documentSchema = null;

// Cargar esquema de documentos desde JSON
async function loadDocumentSchema() {
  try {
    const response = await fetch('document-schema.json');
    documentSchema = await response.json();
    initializeDocumentTypeSelector();
    updateFormFields(); // Cargar campos del primer tipo
  } catch (error) {
    console.error('Error cargando esquema de documentos:', error);
    alert('Error al cargar la configuración. Por favor, recarga la página.');
  }
}

// Inicializar selector de tipos de documento
function initializeDocumentTypeSelector() {
  const select = document.getElementById('docType');
  select.innerHTML = '';
  
  for (const [key, value] of Object.entries(documentSchema)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${value.emoji} ${value.label}`;
    select.appendChild(option);
  }
}

// Generar campos dinámicamente según el tipo de documento
function updateFormFields() {
  if (!documentSchema) return;
  
  const docType = document.getElementById('docType').value;
  const container = document.getElementById('dynamicFields');
  container.innerHTML = '';
  
  const schema = documentSchema[docType];
  if (!schema) return;
  
  schema.fields.forEach(field => {
    const label = document.createElement('label');
    label.setAttribute('for', field.id);
    label.textContent = field.label + ':';
    container.appendChild(label);
    
    if (field.type === 'select') {
      const select = document.createElement('select');
      select.id = field.id;
      if (field.required) select.required = true;
      
      field.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
      });
      
      container.appendChild(select);
    } else {
      const input = document.createElement('input');
      input.type = field.type;
      input.id = field.id;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      container.appendChild(input);
    }
  });
}

function addAuthor() {
  const container = document.getElementById('authorInputs');
  if (container.children.length >= maxAuthors) return alert('Máximo 6 autores');
  const div = document.createElement('div');
  div.className = 'author-row';
  div.innerHTML = `<label>Autor:</label>
                   <input type="text" placeholder="Nombre">
                   <input type="text" placeholder="Apellido">
                   <button onclick="this.parentNode.remove()">🗑️</button>`;
  container.appendChild(div);
}

// Formatea autores en APA 7
function formatAuthorsAPA(authors) {
  if (!authors || authors.length === 0) return '';
  
  let result = '';
  if (authors.length === 1) {
    result = authors[0];
  } else if (authors.length === 2) {
    result = authors[0] + ', & ' + authors[1];
  } else if (authors.length <= 20) {
    result = authors.slice(0, -1).join(', ') + ', & ' + authors[authors.length - 1];
  } else {
    // Más de 20 autores: primeros 19 + ... & último
    result = authors.slice(0, 19).join(', ') + ', ... & ' + authors[authors.length - 1];
  }
  
  // Agregar punto final solo si no termina en punto
  if (!result.endsWith('.')) {
    result += '.';
  }
  
  return result;
}

// Formato APA 7 según tipo de documento
function formatReferenceAPA(data) {
  let ref = '';
  const { authors, title, docType, urlOrDoi } = data;
  
  // Autores
  if (authors && authors.length > 0) {
    ref += formatAuthorsAPA(authors);
  }
  
  // Determinar si es DOI o URL
  const isDOI = urlOrDoi && (urlOrDoi.includes('doi.org') || urlOrDoi.match(/^10\.\d{4,}/));
  const formattedLink = isDOI ? (urlOrDoi.startsWith('http') ? urlOrDoi : `https://doi.org/${urlOrDoi}`) : urlOrDoi;
  
  // Formateo según tipo de documento
  if (docType === 'Libro') {
    // Formato: Autor. (Año). Título. Editorial.
    const year = data.year;
    if (year) ref += ` (${year}).`;
    else ref += ' (s.f.).';
    
    ref += ` <em>${title}</em>`;
    if (data.edition && data.edition !== '1') {
      ref += ` (${data.edition}ª ed.)`;
    }
    ref += '.';
    if (data.city && data.publisher) {
      ref += ` ${data.city}: ${data.publisher}.`;
    } else if (data.publisher) {
      ref += ` ${data.publisher}.`;
    }
    if (formattedLink) ref += ` ${formattedLink}`;
    
  } else if (docType === 'Artículo') {
    // Formato: Autor. (Año). Título. Revista, volumen(número), páginas. DOI/URL
    const year = data.year;
    if (year) ref += ` (${year}).`;
    else ref += ' (s.f.).';
    
    ref += ` ${title}.`;
    if (data.journal) {
      ref += ` <em>${data.journal}</em>`;
      if (data.volume) {
        ref += `, <em>${data.volume}</em>`;
        if (data.issue) {
          ref += `(${data.issue})`;
        }
      }
      if (data.pages) {
        ref += `, ${data.pages}`;
      }
      ref += '.';
    }
    if (formattedLink) {
      ref += ` ${formattedLink}`;
    }
    
  } else if (docType === 'Video') {
    // Formato: Autor/Canal. (Año, fecha). Título [Video]. Plataforma. URL
    if (data.dateVideo) {
      const dateObj = new Date(data.dateVideo);
      ref += ` (${dateObj.getFullYear()}, ${dateObj.toLocaleDateString('es-ES', {month: 'long', day: 'numeric'})}).`;
    } else if (data.year) {
      ref += ` (${data.year}).`;
    } else {
      ref += ' (s.f.).';
    }
    
    ref += ` <em>${title}</em> [Video].`;
    if (data.platform) {
      ref += ` ${data.platform}.`;
    }
    if (formattedLink) {
      ref += ` ${formattedLink}`;
    }
    
  } else if (docType === 'Periódico') {
    // Formato: Autor. (Fecha). Título. Periódico. URL
    if (data.dateNewspaper) {
      const dateObj = new Date(data.dateNewspaper);
      ref += ` (${dateObj.getFullYear()}, ${dateObj.toLocaleDateString('es-ES', {month: 'long', day: 'numeric'})}).`;
    } else {
      ref += ' (s.f.).';
    }
    
    ref += ` ${title}.`;
    if (data.newspaper) {
      ref += ` <em>${data.newspaper}</em>`;
      if (data.section) {
        ref += `, ${data.section}`;
      }
      if (data.pageNumber) {
        ref += `, ${data.pageNumber}`;
      }
      ref += '.';
    }
    if (formattedLink) {
      ref += ` ${formattedLink}`;
    }
    
  } else if (docType === 'Enciclopedia') {
    // Formato: Autor. (Año). Título entrada. En Título enciclopedia. URL
    const year = data.year;
    if (year) ref += ` (${year}).`;
    else ref += ' (s.f.).';
    
    if (data.entryTitle) {
      ref += ` ${data.entryTitle}.`;
    } else {
      ref += ` ${title}.`;
    }
    
    if (data.encyclopedia) {
      ref += ` En`;
      if (data.encyclopediaEditor) {
        ref += ` ${data.encyclopediaEditor},`;
      }
      ref += ` <em>${data.encyclopedia}</em>`;
      if (data.volumeEncyclopedia) {
        ref += ` (${data.volumeEncyclopedia})`;
      }
      ref += '.';
    }
    if (formattedLink) {
      ref += ` ${formattedLink}`;
    }
    
  } else if (docType === 'Entrevista') {
    // Formato: Entrevistado. (Año, fecha). Título [Tipo entrevista]. Medio.
    if (data.dateInterview) {
      const dateObj = new Date(data.dateInterview);
      ref += ` (${dateObj.getFullYear()}, ${dateObj.toLocaleDateString('es-ES', {month: 'long', day: 'numeric'})}).`;
    } else if (data.year) {
      ref += ` (${data.year}).`;
    } else {
      ref += ' (s.f.).';
    }
    
    ref += ` <em>${title}</em>`;
    if (data.interviewType) {
      const types = {
        'personal': 'Entrevista personal',
        'radio': 'Entrevista de radio',
        'tv': 'Entrevista televisiva',
        'podcast': 'Entrevista en podcast'
      };
      ref += ` [${types[data.interviewType] || 'Entrevista'}`;
      if (data.interviewer) {
        ref += ` por ${data.interviewer}`;
      }
      ref += `]`;
    } else {
      ref += ` [Entrevista]`;
    }
    ref += '.';
    
    if (data.medium) {
      ref += ` ${data.medium}.`;
    }
    if (formattedLink) {
      ref += ` ${formattedLink}`;
    }
    
  } else if (docType === 'Documental') {
    // Formato: Director. (Año). Título [Tipo]. Productora.
    const year = data.year;
    if (year) ref += ` (${year}).`;
    else ref += ' (s.f.).';
    
    ref += ` <em>${title}</em>`;
    
    const types = {
      'documental': 'Documental',
      'pelicula': 'Película',
      'serie': 'Episodio de serie'
    };
    ref += ` [${types[data.filmType] || 'Película'}]`;
    
    if (data.director) {
      ref += ` [Dirigida por ${data.director}]`;
    }
    ref += '.';
    
    if (data.studio) {
      ref += ` ${data.studio}.`;
    }
    if (formattedLink) {
      ref += ` ${formattedLink}`;
    }
    
  } else if (docType === 'Página web') {
    // Formato: Autor/Org. (Año, fecha). Título. Sitio web. Recuperado de URL
    if (data.dateWeb) {
      const dateObj = new Date(data.dateWeb);
      ref += ` (${dateObj.getFullYear()}, ${dateObj.toLocaleDateString('es-ES', {month: 'long', day: 'numeric'})}).`;
    } else if (data.year) {
      ref += ` (${data.year}).`;
    } else {
      ref += ' (s.f.).';
    }
    
    ref += ` ${title}.`;
    
    if (data.website) {
      ref += ` <em>${data.website}</em>.`;
    }
    
    if (data.accessDate) {
      const accessDateObj = new Date(data.accessDate);
      ref += ` Recuperado el ${accessDateObj.toLocaleDateString('es-ES', {year: 'numeric', month: 'long', day: 'numeric'})} de`;
    }
    
    if (formattedLink) {
      ref += ` ${formattedLink}`;
    }
    
  } else {
    // Otro
    const year = data.year;
    if (year) ref += ` (${year}).`;
    else ref += ' (s.f.).';
    
    ref += ` ${title}.`;
    if (data.otherInfo) {
      ref += ` ${data.otherInfo}.`;
    }
    if (formattedLink) {
      ref += ` ${formattedLink}`;
    }
  }
  
  return ref;
}

function getAuthors() {
  const inputs = document.querySelectorAll('#authorInputs .author-row');
  let authors = [];
  inputs.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const name = inputs[0].value.trim();
    const surname = inputs[1].value.trim();
    if (name && surname) {
      // Convertir nombres a iniciales (APA 7)
      const initials = name.split(' ')
        .map(n => n.charAt(0).toUpperCase() + '.')
        .join(' ');
      authors.push(`${surname}, ${initials}`);
    }
  });
  return authors;
}

function addReference() {
  const authors = getAuthors();
  const title = document.getElementById('title').value.trim();
  const docType = document.getElementById('docType').value;
  const urlOrDoi = document.getElementById('urlOrDoi').value.trim();

  if (!title) {
    alert('Debe completar al menos el título.');
    return;
  }

  // Recopilar todos los datos de los campos dinámicos
  const refData = {
    authors: authors,
    title: title,
    docType: docType,
    urlOrDoi: urlOrDoi || null
  };

  // Obtener valores de campos dinámicos
  const schema = documentSchema[docType];
  if (schema) {
    schema.fields.forEach(field => {
      const element = document.getElementById(field.id);
      if (element) {
        refData[field.id] = element.value.trim() || null;
      }
    });
  }

  // Formatear en APA 7
  const formattedRef = formatReferenceAPA(refData);

  const li = document.createElement('li');
  li.className = 'ref-item';
  li.innerHTML = `<div class="ref-text">${formattedRef}</div>
                  <div>
                    <button onclick="editReference(this)">✏️</button>
                    <button onclick="this.closest('li').remove();saveToStorage();">🗑️</button>
                  </div>`;

  const list = document.getElementById('refsList');

  if (editingIndex !== null) {
    referencesData[editingIndex] = refData;
    list.children[editingIndex].replaceWith(li);
    editingIndex = null;
  } else {
    referencesData.push(refData);
    list.appendChild(li);
  }

  saveToStorage();
  clearForm();
}

function clearForm() {
  document.getElementById('authorInputs').innerHTML = '<div class="author-row"><label>Autor:</label><input type="text" placeholder="Nombre"><input type="text" placeholder="Apellido"></div>';
  document.getElementById('title').value = '';
  document.getElementById('urlOrDoi').value = '';
  
  // Limpiar campos dinámicos
  const dynamicInputs = document.querySelectorAll('#dynamicFields input, #dynamicFields select');
  dynamicInputs.forEach(input => {
    input.value = '';
  });
  
  // Resetear tipo de documento al primero
  const docType = document.getElementById('docType');
  if (docType.options.length > 0) {
    docType.selectedIndex = 0;
  }
  
  updateFormFields();
}

function editReference(button) {
  const li = button.closest('li');
  const index = Array.from(document.querySelectorAll('.ref-item')).indexOf(li);
  editingIndex = index;

  const refData = referencesData[index];
  
  // Llenar autores
  document.getElementById('authorInputs').innerHTML = '';
  if (refData.authors && refData.authors.length > 0) {
    refData.authors.forEach(author => {
      const parts = author.split(', ');
      const surname = parts[0] || '';
      // Las iniciales ya están en formato "J. M." - convertir a nombre completo no es posible,
      // pero podemos mostrar las iniciales para que el usuario las edite si quiere
      const initials = parts[1] || '';
      const div = document.createElement('div');
      div.className = 'author-row';
      div.innerHTML = `<label>Autor:</label>
                       <input type="text" value="${initials.replace(/\./g, '')}" placeholder="Nombre o Iniciales">
                       <input type="text" value="${surname}" placeholder="Apellido">
                       <button onclick="this.parentNode.remove()">🗑️</button>`;
      document.getElementById('authorInputs').appendChild(div);
    });
  } else {
    // Agregar un campo vacío si no hay autores
    document.getElementById('authorInputs').innerHTML = '<div class="author-row"><label>Autor:</label><input type="text" placeholder="Nombre"><input type="text" placeholder="Apellido"></div>';
  }

  // Llenar campos comunes
  document.getElementById('title').value = refData.title || '';
  document.getElementById('docType').value = refData.docType || 'Libro';
  document.getElementById('urlOrDoi').value = refData.urlOrDoi || '';
  
  // Actualizar campos dinámicos para el tipo de documento
  updateFormFields();
  
  // Llenar campos dinámicos con los datos guardados
  const schema = documentSchema[refData.docType];
  if (schema) {
    schema.fields.forEach(field => {
      const element = document.getElementById(field.id);
      if (element && refData[field.id] !== undefined && refData[field.id] !== null) {
        element.value = refData[field.id];
      }
    });
  }
  
  // Scroll al formulario
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyAll() {
  const refsElements = Array.from(document.querySelectorAll('.ref-text'));
  
  // Crear versión HTML (con formato)
  const htmlContent = refsElements.map(div => div.innerHTML).join('<br><br>');
  
  // Crear versión texto plano (sin etiquetas HTML pero legible)
  const textContent = refsElements.map(div => {
    // Reemplazar <em> con cursiva Unicode o mantener el contenido
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = div.innerHTML;
    return tempDiv.textContent;
  }).join('\n\n');
  
  // Copiar con formato HTML y texto plano
  const blob = new ClipboardItem({
    'text/html': new Blob([htmlContent], { type: 'text/html' }),
    'text/plain': new Blob([textContent], { type: 'text/plain' })
  });
  
  navigator.clipboard.write([blob])
    .then(() => alert('Referencias copiadas con formato. Puedes pegarlas en Word, Google Docs, etc.'))
    .catch(() => {
      // Fallback para navegadores que no soportan ClipboardItem
      navigator.clipboard.writeText(textContent)
        .then(() => alert('Referencias copiadas (solo texto).'));
    });
}

function clearAll() {
  if (confirm('¿Seguro que desea eliminar todas las referencias?')) {
    referencesData = [];
    document.getElementById('refsList').innerHTML = '';
    saveToStorage();
  }
}

function saveToStorage() {
  localStorage.setItem('referencesData', JSON.stringify(referencesData));
}

function loadFromStorage() {
  const data = localStorage.getItem('referencesData');
  if (data) {
    referencesData = JSON.parse(data);
    referencesData.forEach(refData => {
      const formattedRef = formatReferenceAPA(refData);
      const li = document.createElement('li');
      li.className = 'ref-item';
      li.innerHTML = `<div class="ref-text">${formattedRef}</div>
                      <div>
                        <button onclick="editReference(this)">✏️</button>
                        <button onclick="this.closest('li').remove();saveToStorage();">🗑️</button>
                      </div>`;
      document.getElementById('refsList').appendChild(li);
    });
  }
}

// Inicializar la aplicación
window.onload = async () => {
  await loadDocumentSchema();
  loadFromStorage();
};

