# 📊 Procesador de Datos de Encuestas | RecuEdu Labs

Aplicación web para procesar, limpiar y transformar datos de encuestas educativas con **almacenamiento compartido** entre aplicaciones del ecosistema RecuEdu Labs.

## ✨ Características

### 📥 Importación de Datos
- **Google Forms**: Detección automática y procesamiento
- **Microsoft Forms**: Soporte nativo para CSV y **Excel (.xlsx/.xls)**
- **CSV Genérico**: Detección automática de delimitadores (`,` `;` `\t` `|`)
- **JSON**: Formato estructurado
- **Pegado directo**: Pega datos CSV en la interfaz
- **Excel**: Lectura directa de archivos .xlsx sin conversión previa

### 🔄 Transformaciones
- **Normalización Likert**: Ajusta escalas al rango deseado (1-5, 0-10, etc.)
- **Texto → Números**: Convierte respuestas textuales a valores numéricos
- **Calcular Promedios**: Crea columnas con promedios de múltiples preguntas
- **Renombrar Columnas**: Simplifica nombres largos
- **Seleccionar Columnas**: Mantén solo las columnas necesarias
- **Recodificación**: Mapea valores personalizados

### 🧹 Limpieza de Datos
- Eliminar filas con valores faltantes
- Rellenar valores vacíos
- Eliminar duplicados
- Limpiar espacios en blanco
- Restaurar datos originales

### 💾 Almacenamiento y Exportación
- **Storage Compartido**: Guarda datasets en `localStorage` para usar en otras apps RecuEdu Labs
- **Exportar JSON**: Descarga datos procesados
- **Exportar CSV**: Formato universal compatible con Excel
- **Persistencia**: Los datos guardados están disponibles en todas las apps del ecosistema

### 📊 Análisis
- Estadísticas automáticas por columna
- Detección de tipos de datos
- Conteo de valores únicos y faltantes
- Promedios, mínimos y máximos automáticos

## 🚀 Uso Rápido

### 1️⃣ Importar Datos
```
1. Click en "Subir Archivo CSV/JSON"
2. O pega datos CSV directamente
3. Selecciona tipo de fuente (auto-detecta Google/MS Forms)
4. Click "Procesar Datos"
```

### 2️⃣ Transformar
```
1. Abre secciones de transformación (escalas Likert, promedios, etc.)
2. Selecciona columnas
3. Configura parámetros
4. Click "Aplicar"
```

### 3️⃣ Limpiar
```
1. Usa botones de limpieza según necesites
2. Puedes restaurar datos originales en cualquier momento
```

### 4️⃣ Exportar o Guardar
```
Opción A - Exportar:
  - Click "Exportar JSON" o "Exportar CSV"
  - Descarga archivo procesado

Opción B - Storage Compartido:
  - Click "Guardar en Storage"
  - Asigna nombre al dataset
  - Usa en otras apps RecuEdu Labs
```

## 📚 Uso de la Biblioteca en Otras Apps

### Importar la Biblioteca

```html
<!-- En cualquier app RecuEdu Labs -->
<script src="../data-processor/recuedu-data-lib.js"></script>
```

### Cargar Datos Guardados

```javascript
// Listar datasets disponibles
const datasets = RecuEduData.storage.getDatasetsInfo();
console.log(datasets);
// [{name: "encuesta-2026", rowCount: 150, savedAt: "..."}]

// Cargar dataset específico
const myData = RecuEduData.storage.loadDataset('encuesta-2026');
console.log(myData.data); // Array de objetos
console.log(myData.metadata); // Información adicional
```

### Procesar Datos

```javascript
// Parsear CSV
const data = RecuEduData.parseCSV(csvText);

// Limpiar
const cleaned = RecuEduData.removeNullRows(data);
const trimmed = RecuEduData.trimValues(cleaned);

// Transformar escalas Likert
const normalized = RecuEduData.normalizeLikert(
  trimmed,
  ['pregunta1', 'pregunta2'], // columnas
  1, // min
  5  // max
);

// Calcular promedios
const withAvg = RecuEduData.calculateAverage(
  normalized,
  ['pregunta1', 'pregunta2', 'pregunta3'],
  'promedio_satisfaccion'
);

// Exportar
RecuEduData.exportCSV(withAvg, 'datos-procesados.csv');
```

### Guardar Datos para Compartir

```javascript
// Desde cualquier app
RecuEduData.storage.saveDataset('mi-encuesta', processedData, {
  source: 'google_forms',
  description: 'Encuesta de satisfacción estudiantes 2026'
});

// Ahora está disponible en todas las apps RecuEdu Labs
```

## 🔌 API de la Biblioteca

### Parsers
```javascript
RecuEduData.parseCSV(text, options)
RecuEduData.parseGoogleForms(text)
RecuEduData.parseMSForms(text)
RecuEduData.detectSource(text, filename)
```

### Transformadores
```javascript
RecuEduData.normalizeLikert(data, columns, min, max)
RecuEduData.likertTextToNumber(data, columns, mapping)
RecuEduData.calculateAverage(data, columns, newColumnName)
RecuEduData.recode(data, column, mapping)
RecuEduData.renameColumns(data, mapping)
RecuEduData.selectColumns(data, columns)
RecuEduData.filter(data, predicate)
```

### Limpiadores
```javascript
RecuEduData.removeNullRows(data, columns)
RecuEduData.fillNA(data, value, columns)
RecuEduData.removeDuplicates(data, keyColumns)
RecuEduData.trimValues(data)
```

### Validadores
```javascript
RecuEduData.validateSchema(data, schema)
RecuEduData.getDataInfo(data)
```

### Exportadores
```javascript
RecuEduData.toJSON(data, pretty)
RecuEduData.toCSV(data)
RecuEduData.exportJSON(data, filename)
RecuEduData.exportCSV(data, filename)
RecuEduData.downloadFile(content, filename, type)
```

### Storage
```javascript
RecuEduData.storage.saveDataset(name, data, metadata)
RecuEduData.storage.loadDataset(name)
RecuEduData.storage.listDatasets()
RecuEduData.storage.deleteDataset(name)
RecuEduData.storage.getDatasetsInfo()
```

## 💡 Ejemplos de Uso

### Ejemplo 1: Procesar Encuesta de Google Forms

```javascript
// CSV de Google Forms
const csvText = `Marca temporal,Nombre,Satisfacción general,Recomendarías
2026-02-12 10:30:00,Ana,Totalmente de acuerdo,Sí
2026-02-12 11:15:00,Luis,De acuerdo,Sí`;

// Procesar
let data = RecuEduData.parseGoogleForms(csvText);

// Convertir texto Likert a números
data = RecuEduData.likertTextToNumber(data, ['Satisfacción general']);

// Recodificar Sí/No
data = RecuEduData.recode(data, 'Recomendarías', { 'Sí': 1, 'No': 0 });

// Guardar para usar en app de gráficos
RecuEduData.storage.saveDataset('satisfaccion-2026', data);
```

### Ejemplo 2: Integración con App de Gráficos Likert

```javascript
// En apps/likert-charts/app.js

// Cargar datos desde storage compartido
const savedData = RecuEduData.storage.loadDataset('satisfaccion-2026');

if (savedData) {
  // Usar datos procesados directamente
  const chartData = prepareChartData(savedData.data);
  renderCharts(chartData);
}

// Listar opciones disponibles
const availableDatasets = RecuEduData.storage.getDatasetsInfo();
populateDatasetSelector(availableDatasets);
```

### Ejemplo 3: Limpieza y Exportación

```javascript
// Cargar archivo
let data = RecuEduData.parseCSV(fileContent);

// Pipeline de limpieza
data = RecuEduData.trimValues(data);           // Limpiar espacios
data = RecuEduData.removeDuplicates(data);     // Quitar duplicados
data = RecuEduData.removeNullRows(data);       // Eliminar vacíos

// Seleccionar solo columnas relevantes
data = RecuEduData.selectColumns(data, [
  'nombre', 'edad', 'respuesta1', 'respuesta2'
]);

// Exportar limpio
RecuEduData.exportCSV(data, 'datos-limpios.csv');
```

## 🗂️ Estructura de Storage Compartido

Los datos se guardan en `localStorage` con la siguiente estructura:

```javascript
// Clave: recueduLabs_datasets
{
  "encuesta-satisfaccion": {
    "name": "encuesta-satisfaccion",
    "data": [...],  // Array de objetos
    "metadata": {
      "savedAt": "2026-02-12T10:30:00Z",
      "version": "2.0.0",
      "source": "google_forms",
      "description": "Encuesta estudiantes",
      "rowCount": 150,
      "columnCount": 8
    }
  },
  "evaluacion-docentes": { ... }
}
```

## ⚙️ Configuración Avanzada

### Mapeo Personalizado de Likert

```javascript
const customMapping = {
  'Muy insatisfecho': 1,
  'Insatisfecho': 2,
  'Neutral': 3,
  'Satisfecho': 4,
  'Muy satisfecho': 5
};

data = RecuEduData.likertTextToNumber(data, ['pregunta1'], customMapping);
```

### Validación de Esquema

```javascript
const schema = {
  'edad': 'number',
  'nombre': 'string',
  'activo': 'boolean'
};

const validation = RecuEduData.validateSchema(data, schema);
if (!validation.isValid) {
  console.error('Errores de validación:', validation.errors);
}
```

## 🔗 Integración con Otras Apps RecuEdu Labs

### En `likert-charts`
```html
<script src="../data-processor/recuedu-data-lib.js"></script>
<script>
  const datasets = RecuEduData.storage.getDatasetsInfo();
  // Mostrar selector de datasets guardados
</script>
```

### En `ejecon` (Generador de Ejercicios)
```javascript
// Cargar respuestas de encuestas para generar ejercicios personalizados
const surveyData = RecuEduData.storage.loadDataset('respuestas-estudiantes');
```

### En aplicaciones futuras
Cualquier nueva app puede acceder inmediatamente a todos los datasets guardados.

## 📝 Notas Técnicas

- **Límite de localStorage**: ~5-10MB dependiendo del navegador
- **Formato de datos**: Array de objetos JavaScript
- **Namespace**: Todos los datos usan el prefijo `recueduLabs_`
- **Versionado**: Sistema de versiones para compatibilidad futura
- **Sin backend**: Todo funciona client-side, sin servidor

## 🤝 Contribuciones

Esta es una herramienta del ecosistema RecuEdu Labs. Para mejoras o sugerencias, contacta al desarrollador.

## 📄 Licencia

Parte del proyecto RecuEdu Labs - Herramientas educativas open source.

---

**Versión**: 2.0.0  
**Última actualización**: Febrero 2026  
**Autor**: RecuEdu Labs
