let maxAuthors = 6;
let editingIndex = null;

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

function getAuthors() {
  const inputs = document.querySelectorAll('#authorInputs .author-row');
  let authors = [];
  inputs.forEach(row => {
    const [label, name, surname] = row.children;
    if (name.value && surname.value) {
      authors.push(`${surname.value}, ${name.value}`);
    }
  });
  return authors;
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

  if (!title) {
    alert('Debe completar al menos el título.');
    return;
  }

  let ref = authors.length ? authors.join('; ') + '. ' : '';
  ref += year ? `${year}. ` : '';
  ref += `${title}. ${docType}.`;
  if (url) ref += ` ${url}`;

  const li = document.createElement('li');
  li.className = 'ref-item';
  li.innerHTML = `<div class="ref-text">${ref}</div>
                  <div>
                    <button onclick="editReference(this)">✏️</button>
                    <button onclick="this.closest('li').remove();saveToStorage();">🗑️</button>
                  </div>`;

  const list = document.getElementById('refsList');

  if (editingIndex !== null) {
    list.children[editingIndex].replaceWith(li);
    editingIndex = null;
  } else {
    list.appendChild(li);
  }

  saveToStorage();
  document.querySelector('.save').textContent = 'Guardar referencia';
}

function editReference(button) {
  const li = button.closest('li');
  const index = Array.from(document.querySelectorAll('.ref-item')).indexOf(li);
  editingIndex = index;

  const ref = li.querySelector('.ref-text').textContent;
  const parts = ref.split('. ');
  let authors = [], year = '', title = '', type = '', url = '';

  if (parts.length >= 3) {
    if (parts[0].includes(',')) {
      authors = parts[0].split('; ');
      year = parts[1];
      title = parts[2];
      type = parts[3];
      url = parts.slice(4).join('. ');
    } else {
      title = parts[0];
      type = parts[1];
      url = parts.slice(2).join('. ');
    }
  }

  fillForm(authors, year, title, type, url);
  document.querySelector('.save').textContent = 'Actualizar referencia';
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
  const refs = Array.from(document.querySelectorAll('.ref-text')).map(div => div.textContent);
  localStorage.setItem('refs', JSON.stringify(refs));
}

function loadFromStorage() {
  const refs = JSON.parse(localStorage.getItem('refs') || '[]');
  refs.forEach(text => {
    const li = document.createElement('li');
    li.className = 'ref-item';
    li.innerHTML = `<div class="ref-text">${text}</div>
                    <div>
                      <button onclick="editReference(this)">✏️</button>
                      <button onclick="this.closest('li').remove();saveToStorage();">🗑️</button>
                    </div>`;
    document.getElementById('refsList').appendChild(li);
  });
}

window.onload = loadFromStorage;
