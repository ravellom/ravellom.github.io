let maxAuthors = 6;
let editingIndex = null;

// Estructura para almacenar referencias como objetos
let referencesData = [];

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
  
  if (authors.length === 1) {
    return authors[0];
  } else if (authors.length === 2) {
    return authors.join(' y ');
  } else if (authors.length <= 20) {
    return authors.slice(0, -1).join(', ') + ' y ' + authors[authors.length - 1];
  } else {
    // Más de 20 autores: primeros 19 + et al.
    return authors.slice(0, 19).join(', ') + ' y et al.';
  }
}

// Formato APA 7 según tipo de documento
function formatReferenceAPA(data) {
  let ref = '';
  const { authors, title, year, docType, url, publisher, edition, journal, volume, issue, pages } = data;
  
  // Autores
  if (authors && authors.length > 0) {
    ref += formatAuthorsAPA(authors);
  }
  
  // Año entre paréntesis
  if (year) {
    ref += ` (${year}).`;
  } else {
    ref += ' (s.f.).'; // sin fecha
  }
  
  // Título según tipo
  if (docType === 'Libro') {
    ref += ` <em>${title}</em>`;
    if (edition && edition !== '1') {
      ref += ` (${edition}ª ed.)`;
    }
    ref += '.';
    if (publisher) {
      ref += ` ${publisher}.`;
    }
  } else if (docType === 'Artículo') {
    ref += ` ${title}.`;
    if (journal) {
      ref += ` <em>${journal}</em>`;
      if (volume) {
        ref += `, ${volume}`;
        if (issue) {
          ref += `(${issue})`;
        }
      }
      ref += ',';
      if (pages) {
        ref += ` ${pages}`;
      }
      ref += '.';
    }
  } else if (docType === 'Página web') {
    ref += ` ${title}.`;
    if (url) {
      ref += ` Recuperado de ${url}`;
    }
  } else {
    // Otro
    ref += ` ${title}.`;
    if (url) {
      ref += ` Recuperado de ${url}`;
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
      authors.push(`${surname}, ${name}`);
    }
  });
  return authors;
}

// Mostrar/ocultar campos según el tipo de documento
function updateFormFields() {
  const docType = document.getElementById('docType').value;
  document.getElementById('bookFields').style.display = docType === 'Libro' ? 'block' : 'none';
  document.getElementById('articleFields').style.display = docType === 'Artículo' ? 'block' : 'none';
}

function fillForm(authors, year, title, type, url) {
  document.getElementById('authorInputs').innerHTML = '';
  authors.forEach(author => {
    const [surname, name] = author.split(', ');
    const div = document.createElement('div');
    div.className = 'author-row';
    div.innerHTML = `<label>Autor:</label>
                     <input type="text" value="${name || ''}" placeholder="Nombre">
                     <input type="text" value="${surname || ''}" placeholder="Apellido">
                     <button onclick="this.parentNode.remove()">🗑️</button>`;
    document.getElementById('authorInputs').appendChild(div);
  });

  document.getElementById('title').value = title;
  document.getElementById('year').value = year;
  document.getElementById('docType').value = type;
  document.getElementById('url').value = url || '';
}

function addReference() {
  const authors = getAuthors();
  const title = document.getElementById('title').value.trim();
  const docType = document.getElementById('docType').value;
  const year = document.getElementById('year').value.trim();
  const url = document.getElementById('url').value.trim();
  const publisher = document.getElementById('publisher')?.value.trim() || null;
  const edition = document.getElementById('edition')?.value.trim() || null;
  const journal = document.getElementById('journal')?.value.trim() || null;
  const volume = document.getElementById('volume')?.value.trim() || null;
  const issue = document.getElementById('issue')?.value.trim() || null;
  const pages = document.getElementById('pages')?.value.trim() || null;

  if (!title) {
    alert('Debe completar al menos el título.');
    return;
  }

  // Crear objeto de referencia
  const refData = {
    authors: authors,
    title: title,
    year: year || null,
    docType: docType,
    url: url || null,
    publisher: publisher,
    edition: edition,
    journal: journal,
    volume: volume,
    issue: issue,
    pages: pages
  };

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
  document.getElementById('docType').value = 'Libro';
  document.getElementById('year').value = '';
  document.getElementById('url').value = '';
  document.getElementById('publisher').value = '';
  document.getElementById('edition').value = '';
  document.getElementById('journal').value = '';
  document.getElementById('volume').value = '';
  document.getElementById('issue').value = '';
  document.getElementById('pages').value = '';
  updateFormFields();
}

function editReference(button) {
  const li = button.closest('li');
  const index = Array.from(document.querySelectorAll('.ref-item')).indexOf(li);
  editingIndex = index;

  const refData = referencesData[index];
  
  // Llenar el formulario con los datos
  document.getElementById('authorInputs').innerHTML = '';
  refData.authors.forEach(author => {
    const [surname, name] = author.split(', ');
    const div = document.createElement('div');
    div.className = 'author-row';
    div.innerHTML = `<label>Autor:</label>
                     <input type="text" value="${name || ''}" placeholder="Nombre">
                     <input type="text" value="${surname || ''}" placeholder="Apellido">
                     <button onclick="this.parentNode.remove()">🗑️</button>`;
    document.getElementById('authorInputs').appendChild(div);
  });

  document.getElementById('title').value = refData.title;
  document.getElementById('year').value = refData.year || '';
  document.getElementById('docType').value = refData.docType;
  document.getElementById('url').value = refData.url || '';
  document.getElementById('publisher').value = refData.publisher || '';
  document.getElementById('edition').value = refData.edition || '';
  document.getElementById('journal').value = refData.journal || '';
  document.getElementById('volume').value = refData.volume || '';
  document.getElementById('issue').value = refData.issue || '';
  document.getElementById('pages').value = refData.pages || '';
  updateFormFields();
}

function copyAll() {
  const refs = Array.from(document.querySelectorAll('.ref-text')).map(div => div.textContent).join('\n');
  navigator.clipboard.writeText(refs).then(() => alert('Referencias copiadas.'));
}

function clearAll() {
  if (confirm('¿Seguro que desea eliminar todas las referencias?')) {
    document.getElementById('refsList').innerHTML = '';
    localStorage.removeItem('refs');
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

window.onload = () => {
  loadFromStorage();
  updateFormFields();
};
