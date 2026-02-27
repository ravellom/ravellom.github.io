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

  } else if (docType === 'Artículo en conferencia') {
    const year = data.year;
    if (year) ref += ` (${year}).`;
    else ref += ' (s.f.).';

    ref += ` ${title}.`;
    if (data.conference) {
      ref += ` En <em>${data.conference}</em>`;
      if (data.location) {
        ref += ` (${data.location})`;
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

function getOutputStyle() {
  const outputStyle = document.getElementById('outputStyle');
  return outputStyle ? outputStyle.value : 'APA';
}

function stripHtml(htmlText) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlText || '';
  return tempDiv.textContent || tempDiv.innerText || '';
}

function formatReferenceVancouver(data) {
  const authors = data.authors && data.authors.length ? data.authors.join(', ') + '.' : '';
  const title = data.title ? `${data.title}.` : '';
  const year = data.year || 's.f.';
  const pages = data.pages || '';
  const volume = data.volume || '';
  const issue = data.issue ? `(${data.issue})` : '';
  const source = data.journal || data.conference || data.website || data.newspaper || data.publisher || '';
  const tail = data.urlOrDoi ? ` ${data.urlOrDoi}` : '';

  if (data.docType === 'Artículo' || data.docType === 'Artículo en conferencia') {
    return `${authors} ${title} ${source}. ${year};${volume}${issue}:${pages}.${tail}`.replace(/\s+/g, ' ').trim();
  }
  if (data.docType === 'Libro') {
    return `${authors} ${title} ${data.city ? data.city + ': ' : ''}${data.publisher || ''}; ${year}.${tail}`.replace(/\s+/g, ' ').trim();
  }
  return `${authors} ${title} ${source}. ${year}.${tail}`.replace(/\s+/g, ' ').trim();
}

function formatReferenceIEEE(data) {
  const authors = data.authors && data.authors.length ? data.authors.join(', ') : '';
  const title = data.title ? `"${data.title}"` : '""';
  const source = data.journal || data.conference || data.website || data.newspaper || data.publisher || '';
  const volume = data.volume ? `vol. ${data.volume}` : '';
  const issue = data.issue ? `no. ${data.issue}` : '';
  const pages = data.pages ? `pp. ${data.pages}` : '';
  const year = data.year || 's.f.';
  const tail = data.urlOrDoi ? ` ${data.urlOrDoi}` : '';

  return `${authors}, ${title}, ${source}, ${volume}, ${issue}, ${pages}, ${year}.${tail}`
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatReferenceByStyle(data, style) {
  if (style === 'Vancouver') return formatReferenceVancouver(data);
  if (style === 'IEEE') return formatReferenceIEEE(data);
  return formatReferenceAPA(data);
}

function createReferenceItem(refData, index) {
  const style = getOutputStyle();
  const formattedRef = formatReferenceByStyle(refData, style);

  const li = document.createElement('li');
  li.className = 'ref-item';
  li.dataset.index = String(index);
  li.innerHTML = `<label class="ref-selector"><input type="checkbox" class="ref-check" data-index="${index}" /> Seleccionar</label>
                  <div class="ref-text">${formattedRef}</div>
                  <div>
                    <button onclick="editReference(this)">✏️</button>
                    <button onclick="deleteReference(${index})">🗑️</button>
                  </div>`;
  return li;
}

function renderReferencesList() {
  const list = document.getElementById('refsList');
  if (!list) return;
  list.innerHTML = '';
  referencesData.forEach((refData, index) => {
    list.appendChild(createReferenceItem(refData, index));
  });
}

function deleteReference(index) {
  if (index < 0 || index >= referencesData.length) return;
  referencesData.splice(index, 1);
  saveToStorage();
  renderReferencesList();
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

  const refData = {
    authors: authors,
    title: title,
    docType: docType,
    urlOrDoi: urlOrDoi || null
  };

  const schema = documentSchema[docType];
  if (schema) {
    schema.fields.forEach(field => {
      const element = document.getElementById(field.id);
      if (element) {
        refData[field.id] = element.value.trim() || null;
      }
    });
  }

  if (editingIndex !== null) {
    referencesData[editingIndex] = refData;
    editingIndex = null;
  } else {
    referencesData.push(refData);
  }

  saveToStorage();
  renderReferencesList();
  clearForm();
}
function clearForm() {
  document.getElementById('authorInputs').innerHTML = '<div class="author-row"><label>Autor:</label><input type="text" placeholder="Nombre"><input type="text" placeholder="Apellido"></div>';
  document.getElementById('title').value = '';
  document.getElementById('urlOrDoi').value = '';
  const citationInput = document.getElementById('citationInput');
  const parseStatus = document.getElementById('parseStatus');
  if (citationInput) citationInput.value = '';
  if (parseStatus) parseStatus.textContent = '';
  
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
  const index = Number(li.dataset.index);
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
  copyReferences(referencesData);
}

function getSelectedReferences() {
  const selectedChecks = Array.from(document.querySelectorAll('.ref-check:checked'));
  return selectedChecks
    .map(check => Number(check.dataset.index))
    .filter(index => Number.isInteger(index) && index >= 0 && index < referencesData.length)
    .map(index => referencesData[index]);
}

function copySelected() {
  const selectedRefs = getSelectedReferences();
  if (!selectedRefs.length) {
    alert('Selecciona al menos una referencia.');
    return;
  }
  copyReferences(selectedRefs);
}

function copyReferences(referenceItems) {
  const outputStyle = getOutputStyle();
  const formatted = referenceItems.map(ref => formatReferenceByStyle(ref, outputStyle));
  const plainText = formatted.map(stripHtml).join('\n\n');
  const htmlText = formatted.join('<br><br>');

  if (window.ClipboardItem) {
    const blob = new ClipboardItem({
      'text/html': new Blob([htmlText], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' })
    });
    navigator.clipboard.write([blob])
      .then(() => alert(`Referencias copiadas en formato ${outputStyle}.`))
      .catch(() => navigator.clipboard.writeText(plainText).then(() => alert(`Referencias copiadas en formato ${outputStyle}.`)));
    return;
  }

  navigator.clipboard.writeText(plainText)
    .then(() => alert(`Referencias copiadas en formato ${outputStyle}.`));
}

function exportLibraryJson() {
  const payload = {
    app: 'BiblioClick',
    exportedAt: new Date().toISOString(),
    count: referencesData.length,
    references: referencesData
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `biblioclick-library-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importLibraryJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = Array.isArray(parsed) ? parsed : parsed.references;
      if (!Array.isArray(imported)) {
        alert('El archivo JSON no tiene un formato válido.');
        return;
      }

      const validRefs = imported.filter(ref => ref && typeof ref === 'object' && ref.title);
      if (!validRefs.length) {
        alert('No se encontraron referencias validas para importar.');
        return;
      }

      referencesData = [...referencesData, ...validRefs];
      saveToStorage();
      renderReferencesList();
      alert(`Importación completada: ${validRefs.length} referencias.`);
    } catch (error) {
      alert('No se pudo leer el archivo JSON.');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (confirm('¿Seguro que desea eliminar todas las referencias?')) {
    referencesData = [];
    saveToStorage();
    renderReferencesList();
  }
}

function saveToStorage() {
  localStorage.setItem('referencesData', JSON.stringify(referencesData));
}

function loadFromStorage() {
  const data = localStorage.getItem('referencesData');
  if (data) {
    referencesData = JSON.parse(data);
  }
  renderReferencesList();
}

function setInputMode() {
  const modeElement = document.getElementById('inputMode');
  const autoInputArea = document.getElementById('autoInputArea');
  if (!modeElement || !autoInputArea) return;
  autoInputArea.style.display = modeElement.value === 'automatic' ? 'block' : 'none';
}

function normalizeTailPunctuation(value) {
  if (!value) return '';
  return value.trim().replace(/[).,;]+$/, '').trim();
}

function extractLinks(raw) {
  const doiMatch = raw.match(/(?:https?:\/\/(?:dx\.)?doi\.org\/\S+|10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  const urlMatch = raw.match(/https?:\/\/[^\s)]+/i);

  let urlOrDoi = '';
  if (doiMatch) {
    urlOrDoi = normalizeTailPunctuation(doiMatch[0]);
    if (!/^https?:\/\//i.test(urlOrDoi)) {
      urlOrDoi = `https://doi.org/${urlOrDoi}`;
    }
  } else if (urlMatch) {
    urlOrDoi = normalizeTailPunctuation(urlMatch[0]);
  }

  const textWithoutLinks = raw
    .replace(/https?:\/\/(?:dx\.)?doi\.org\/\S+/gi, '')
    .replace(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi, '')
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { urlOrDoi, textWithoutLinks };
}

function detectCitationStyle(raw) {
  const text = raw.trim();
  if (!text) return { style: 'desconocido', confidence: 0 };

  if (/\[\d+\]/.test(text) || /,\s*vol\.?\s*\d+/i.test(text) || /,\s*no\.?\s*\d+/i.test(text)) {
    return { style: 'IEEE', confidence: 0.84 };
  }
  if (/^\s*\d+\./m.test(text) || /\d{4}\s*;\s*\d+\s*(\(|:)/.test(text)) {
    return { style: 'Vancouver', confidence: 0.8 };
  }
  if (/\(\d{4}[a-z]?\)\./i.test(text) || /,\s*&\s*/.test(text)) {
    return { style: 'APA', confidence: 0.88 };
  }
  return { style: 'desconocido', confidence: 0.45 };
}

function splitAuthorToken(token) {
  const cleaned = token.replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  if (!cleaned) return null;

  if (cleaned.includes(',')) {
    const pieces = cleaned.split(',');
    const family = (pieces.shift() || '').trim();
    const given = pieces.join(',').trim();
    if (!family) return null;
    return { family, given: given.replace(/\.$/, '') };
  }

  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return { family: parts[0], given: '' };
  return { family: parts[0], given: parts.slice(1).join(' ') };
}

function parseAuthors(authorsRaw, style) {
  if (!authorsRaw) return [];
  const raw = authorsRaw.replace(/\s+/g, ' ').trim();
  const tokens = [];

  if (style === 'APA') {
    const normalized = raw.replace(/\s*&\s*/g, ', ');
    const regex = /([^,]+,\s*(?:[A-Z]\.\s*)+)/g;
    let match;
    while ((match = regex.exec(normalized)) !== null) {
      tokens.push(match[1].trim().replace(/,\s*$/, ''));
    }
    if (tokens.length === 0) {
      normalized.split(/\s*,\s*/).forEach(token => token && tokens.push(token));
    }
  } else {
    raw
      .replace(/\s+and\s+/gi, ', ')
      .split(/\s*,\s*/)
      .forEach(token => token && tokens.push(token));
  }

  const parsed = [];
  tokens.forEach(token => {
    const split = splitAuthorToken(token);
    if (split) parsed.push(split);
  });
  return parsed;
}

function parseSourceSegment(segment) {
  const source = (segment || '').trim().replace(/\.$/, '');
  const result = { journal: '', volume: '', issue: '', pages: '' };
  if (!source) return result;

  const pagesMatch = source.match(/(\d+\s*[-–]\s*\d+)\s*$/);
  let remaining = source;
  if (pagesMatch) {
    result.pages = pagesMatch[1].replace(/\s+/g, '');
    remaining = remaining.replace(/,?\s*\d+\s*[-–]\s*\d+\s*$/, '').trim();
  }

  const volIssueMatch = remaining.match(/,?\s*(\d+)\s*\(([^)]+)\)\s*$/);
  if (volIssueMatch) {
    result.volume = volIssueMatch[1];
    result.issue = volIssueMatch[2].trim();
    result.journal = remaining.replace(/,?\s*\d+\s*\([^)]+\)\s*$/, '').trim().replace(/[.,]$/, '');
    return result;
  }

  const volOnlyMatch = remaining.match(/,?\s*(\d+)\s*$/);
  if (volOnlyMatch) {
    result.volume = volOnlyMatch[1];
    result.journal = remaining.replace(/,?\s*\d+\s*$/, '').trim().replace(/[.,]$/, '');
    return result;
  }

  result.journal = remaining.trim().replace(/[.,]$/, '');
  return result;
}

function parseAPACitation(text) {
  const output = { authorsRaw: '', year: '', title: '', journal: '', volume: '', issue: '', pages: '' };
  const regex = /^(?<authors>.+?)\s*\((?<year>\d{4}[a-z]?)\)\.\s*(?<title>.+?)\.\s*(?<source>.+)$/i;
  const match = text.match(regex);
  if (match && match.groups) {
    output.authorsRaw = match.groups.authors.trim();
    output.year = match.groups.year.replace(/[^\d]/g, '');
    output.title = match.groups.title.trim();
    const sourceData = parseSourceSegment(match.groups.source);
    output.journal = sourceData.journal;
    output.volume = sourceData.volume;
    output.issue = sourceData.issue;
    output.pages = sourceData.pages;
    return output;
  }

  const yearMatch = text.match(/\((\d{4})[a-z]?\)/i);
  if (yearMatch) output.year = yearMatch[1];

  const parts = text.split('.').map(part => part.trim()).filter(Boolean);
  if (parts.length > 0) output.authorsRaw = parts[0];
  if (parts.length > 1) output.title = parts[1];
  if (parts.length > 2) {
    const sourceData = parseSourceSegment(parts.slice(2).join('. '));
    output.journal = sourceData.journal;
    output.volume = sourceData.volume;
    output.issue = sourceData.issue;
    output.pages = sourceData.pages;
  }
  return output;
}

function parseVancouverOrIEEECitation(text) {
  const output = { authorsRaw: '', year: '', title: '', journal: '', volume: '', issue: '', pages: '' };

  const patternA = /^(?<authors>.+?)\.\s+(?<title>.+?)\.\s+(?<journal>.+?)\.\s+(?<year>\d{4})\s*;\s*(?<volume>\d+)(?:\((?<issue>[^)]+)\))?\s*:\s*(?<pages>\d+\s*[-–]\s*\d+)\.?$/i;
  const mA = text.match(patternA);
  if (mA && mA.groups) {
    output.authorsRaw = mA.groups.authors.trim();
    output.title = mA.groups.title.trim();
    output.journal = mA.groups.journal.trim();
    output.year = mA.groups.year;
    output.volume = mA.groups.volume || '';
    output.issue = mA.groups.issue || '';
    output.pages = (mA.groups.pages || '').replace(/\s+/g, '');
    return output;
  }

  const patternB = /^(?<authors>.+?)\.\s+(?<title>.+?)\.\s+(?<journal>.+?)(?:,|\.)\s*vol\.?\s*(?<volume>\d+)(?:,|\s)*(?:no\.?\s*(?<issue>[\w-]+))?(?:,|\s)*(?:pp\.?\s*)?(?<pages>\d+\s*[-–]\s*\d+)?(?:,|\s)*(?<year>\d{4})/i;
  const mB = text.match(patternB);
  if (mB && mB.groups) {
    output.authorsRaw = mB.groups.authors.trim();
    output.title = mB.groups.title.trim();
    output.journal = mB.groups.journal.trim();
    output.year = mB.groups.year;
    output.volume = mB.groups.volume || '';
    output.issue = mB.groups.issue || '';
    output.pages = (mB.groups.pages || '').replace(/\s+/g, '');
    return output;
  }

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) output.year = yearMatch[0];

  const parts = text.split('.').map(part => part.trim()).filter(Boolean);
  if (parts.length > 0) output.authorsRaw = parts[0];
  if (parts.length > 1) output.title = parts[1];
  if (parts.length > 2) {
    const sourceData = parseSourceSegment(parts.slice(2).join('. '));
    output.journal = sourceData.journal;
    output.volume = sourceData.volume;
    output.issue = sourceData.issue;
    output.pages = sourceData.pages;
  }
  return output;
}

function inferDocType(parsed) {
  const sourceText = (parsed.journal || '').toLowerCase();
  if (sourceText.includes('conference') || sourceText.includes('congreso') || sourceText.includes('proceedings')) {
    return 'Artículo en conferencia';
  }
  if (parsed.journal || parsed.volume || parsed.issue || parsed.pages) return 'Artículo';
  if (parsed.urlOrDoi) return 'Página web';
  return 'Otro';
}

function setDynamicFieldIfExists(fieldId, value) {
  if (!value) return;
  const element = document.getElementById(fieldId);
  if (element) element.value = value;
}

function fillAuthorsIntoForm(authors) {
  const container = document.getElementById('authorInputs');
  container.innerHTML = '';

  if (!authors.length) {
    container.innerHTML = '<div class="author-row"><label>Autor:</label><input type="text" placeholder="Nombre"><input type="text" placeholder="Apellido"></div>';
    return;
  }

  authors.slice(0, maxAuthors).forEach(author => {
    const div = document.createElement('div');
    div.className = 'author-row';
    div.innerHTML = `<label>Autor:</label>
                     <input type="text" value="${(author.given || '').replace(/"/g, '&quot;')}" placeholder="Nombre">
                     <input type="text" value="${(author.family || '').replace(/"/g, '&quot;')}" placeholder="Apellido">
                     <button onclick="this.parentNode.remove()">🗑️</button>`;
    container.appendChild(div);
  });
}

function fillFormFromParsed(parsed) {
  const docTypeElement = document.getElementById('docType');
  const availableTypes = Array.from(docTypeElement.options).map(option => option.value);
  const inferredDocType = inferDocType(parsed);
  const targetDocType = availableTypes.includes(inferredDocType) ? inferredDocType : availableTypes[0];

  docTypeElement.value = targetDocType;
  updateFormFields();

  fillAuthorsIntoForm(parsed.authors || []);
  document.getElementById('title').value = parsed.title || '';
  document.getElementById('urlOrDoi').value = parsed.urlOrDoi || '';

  setDynamicFieldIfExists('year', parsed.year);
  setDynamicFieldIfExists('journal', parsed.journal);
  setDynamicFieldIfExists('conference', parsed.journal);
  setDynamicFieldIfExists('location', parsed.location);
  setDynamicFieldIfExists('volume', parsed.volume);
  setDynamicFieldIfExists('issue', parsed.issue);
  setDynamicFieldIfExists('pages', parsed.pages);
  setDynamicFieldIfExists('website', parsed.journal);
}

function extractFromCitation() {
  const input = document.getElementById('citationInput');
  const status = document.getElementById('parseStatus');
  if (!input || !status) return;

  const raw = input.value.trim();
  if (!raw) {
    status.textContent = 'Pega una referencia para extraer datos.';
    return;
  }

  const detected = detectCitationStyle(raw);
  const links = extractLinks(raw);
  const cleanText = links.textWithoutLinks;

  const parsed = detected.style === 'APA'
    ? parseAPACitation(cleanText)
    : parseVancouverOrIEEECitation(cleanText);

  const authors = parseAuthors(parsed.authorsRaw, detected.style);
  const fullParsed = { ...parsed, authors, urlOrDoi: links.urlOrDoi };

  fillFormFromParsed(fullParsed);

  const missing = [];
  if (!fullParsed.year) missing.push('año');
  if (!fullParsed.title) missing.push('título');
  if (!authors.length) missing.push('autores');

  const confidencePct = Math.round((detected.confidence || 0) * 100);
  const missingText = missing.length ? ` | Revisar: ${missing.join(', ')}` : '';
  status.textContent = `Estilo detectado: ${detected.style} (${confidencePct}% conf.)${missingText}`;
}

// Inicializar la aplicación
window.onload = async () => {
  await loadDocumentSchema();
  loadFromStorage();
  setInputMode();
  const inputMode = document.getElementById('inputMode');
  if (inputMode) inputMode.addEventListener('change', setInputMode);
};


