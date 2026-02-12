# 🚀 Guía de Inicio Rápido - Procesador de Datos

## ⚡ 3 Minutos para Empezar

### 1️⃣ Importa Datos (30 segundos)

```
Opción A - Subir archivo:
├─ Click "Subir Archivo CSV/JSON/XLSX"
├─ Selecciona tu archivo de Google Forms o MS Forms
├─ Excel (.xlsx): Se lee automáticamente (MS Forms exporta directo en este formato)
├─ CSV: Detecta automáticamente el delimitador (coma, punto y coma, etc.)
└─ ¡Listo! Se procesa automáticamente

Opción B - Pegar datos:
├─ Copia tus datos CSV (Ctrl+C desde Excel/Sheets)
├─ Pega en el área de texto
├─ Selecciona delimitador (auto-detecta punto y coma para MS Forms)
├─ Click "Procesar Datos"
└─ ¡Listo!

Opción C - Archivo de ejemplo:
└─ Usa ejemplo_google_forms.csv incluido en la carpeta
```

### 2️⃣ Transforma (1 minuto)

Las transformaciones más comunes:

```
✨ Normalizar Escalas Likert:
   → Convierte cualquier escala a 1-5 (o el rango que quieras)
   → Útil para análisis estadístico

🔤 Texto → Números:
   → "Totalmente de acuerdo" → 5
   → "De acuerdo" → 4, etc.
   → Automático, no necesitas configurar mapeo

📊 Calcular Promedios:
   → Selecciona varias preguntas
   → Crea columna con promedio
   → Perfecto para "índice de satisfacción"

✏️ Renombrar Columnas:
   → Simplifica nombres largos
   → Ej: "¿Qué tan satisfecho...?" → "satisfaccion"
```

### 3️⃣ Exporta o Guarda (30 segundos)

```
💾 Guardar en Storage Compartido:
   ├─ Click "Guardar en Storage"
   ├─ Asigna nombre: "encuesta-2026"
   └─ Ahora está disponible en TODAS tus apps RecuEdu Labs

📥 Exportar Archivo:
   ├─ JSON: Para apps web
   └─ CSV: Para Excel, SPSS, etc.
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Preparar datos de encuesta para gráficos

```
1. Sube CSV de Google Forms
2. Transforma texto Likert → números
3. Guarda en storage como "mi-encuesta"
4. Abre app "likert-charts"
5. Carga "mi-encuesta" desde storage
6. ¡Visualiza gráficos!
```

### Caso 2: Limpiar datos antes de análisis

```
1. Sube CSV con datos "sucios"
2. Click "Eliminar Filas Vacías"
3. Click "Eliminar Duplicados"
4. Click "Limpiar Espacios"
5. Exporta CSV limpio
```

### Caso 3: Crear índice de satisfacción

```
1. Carga datos con múltiples preguntas Likert
2. Normaliza todas las escalas a 1-5
3. Calcula promedio de las preguntas relevantes
4. Nombra nueva columna "indice_satisfaccion"
5. Exporta para análisis
```

---

## 🔗 Integración en Tus Apps

### Paso 1: Incluir Biblioteca

```html
<script src="../data-processor/recuedu-data-lib.js"></script>
```

### Paso 2: Usar en tu código

```javascript
// Listar datasets disponibles
const datasets = RecuEduData.storage.getDatasetsInfo();

// Cargar dataset
const data = RecuEduData.storage.loadDataset('mi-encuesta');

// Procesar
const cleaned = RecuEduData.removeNullRows(data.data);
const normalized = RecuEduData.normalizeLikert(cleaned, ['pregunta1', 'pregunta2'], 1, 5);

// Usar en tu app
renderCharts(normalized);
```

### Ejemplo Completo

Ver archivo: `ejemplo-integracion.html`

---

## ❓ Preguntas Frecuentes

**¿Los datos se guardan en la nube?**  
No, todo es local en tu navegador (localStorage). Privado y seguro.

**¿Cuántos datasets puedo guardar?**  
Depende del navegador (~5-10MB total). Suficiente para cientos de encuestas educativas.

**¿Puedo usar los datos en Excel?**  
Sí, exporta como CSV y ábrelo en Excel.

**¿Los datos guardados están en todas las apps?**  
Sí, todos los datasets guardados están disponibles en cualquier app RecuEdu Labs en el mismo navegador.

**¿Qué pasa si borro el historial del navegador?**  
Se pierden los datos guardados. Exporta los importantes como respaldo.

**¿Funciona sin conexión a internet?**  
Sí, una vez cargada la app, funciona 100% offline (excepto CDN de iconos).

---

## 🐛 Solución de Problemas

### "No se detecta la fuente correctamente"
→ Cambia el selector de "Detectar automáticamente" a tu fuente específica (Google Forms, MS Forms, etc.)

### "Errores al parsear CSV"
→ MS Forms en español usa punto y coma (`;`) como separador  
→ El sistema detecta automáticamente, pero puedes especificarlo manualmente en "Delimitador CSV"  
→ Si copias desde Excel, asegúrate de que las comas dentro de celdas estén entre comillas

### "Datos de MS Forms con caracteres raros"
→ MS Forms exporta mejor en Excel (.xlsx)  
→ Usa la opción "Exportar a Excel" desde MS Forms en lugar de CSV  
→ El sistema lee .xlsx directamente sin problemas de codificación

### "No aparecen mis datasets guardados"
→ Click "Actualizar Lista"  
→ Verifica que estés en el mismo navegador donde los guardaste

### "La normalización no funciona"
→ Verifica que las columnas seleccionadas contengan números  
→ Si son texto ("Totalmente de acuerdo"), usa primero "Texto → Números"

### "Archivo Excel no se lee"
→ Verifica que SheetJS esté cargado (debería funcionar automáticamente)  
→ Como alternativa, exporta como CSV desde Excel

---

## 💡 Tips Avanzados

1. **Pipeline de limpieza estándar**:
   ```
   Limpiar espacios → Eliminar vacíos → Eliminar duplicados
   ```

2. **Normalización consistente**:
   Siempre normaliza ANTES de calcular promedios

3. **Nombres descriptivos**:
   Usa nombres claros para datasets guardados:  
   ✅ `satisfaccion-estudiantes-2026-feb`  
   ❌ `datos1`

4. **Respaldo importante**:
   Exporta datasets importantes como JSON antes de experimentar

5. **Validación**:
   Revisa "Información de Columnas" para detectar problemas de tipos de datos

---

## 📚 Recursos

- **README.md**: Documentación completa de la API
- **ejemplo-integracion.html**: Ejemplos interactivos de uso
- **ejemplo_google_forms.csv**: Datos de prueba

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) para mensajes de diagnóstico.
