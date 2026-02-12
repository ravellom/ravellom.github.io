# Archivos de Ejemplo para MS Forms y Google Forms

Este directorio contiene archivos de ejemplo en diferentes formatos para probar la funcionalidad de procesamiento con IA.

## 📊 Archivos Disponibles

### Microsoft Forms

1. **ejemplo_msforms.csv** - Formato CSV exportado de MS Forms
   - Contiene columnas de metadatos (ID, Start time, Email, Name)
   - Preguntas con valores textuales en español
   - Sin comillas en los nombres de columnas (estándar de MS Forms)

2. **ejemplo_msforms.xlsx** - Formato Excel exportado de MS Forms ⭐ **Recomendado**
   - Formato nativo de exportación de MS Forms
   - Incluye todos los metadatos
   - Respuestas textuales completas

### Google Forms

1. **ejemplo_gforms.csv** - Formato CSV exportado de Google Forms
   - Timestamp en primera columna
   - Preguntas con valores textuales
   - Formato estándar de Google Forms

## 🚀 Cómo Usar

### Con Procesamiento de IA (Recomendado)

1. Activa "Procesamiento con Gemini AI"
2. Ingresa tu API Key de Gemini
3. Selecciona el tipo de fuente correspondiente
4. Carga cualquiera de estos archivos
5. Revisa las sugerencias de la IA
6. ¡Listo!

### Sin IA (Manual)

Los archivos CSV se pueden cargar directamente, pero requieren:
- Formato correcto (primera columna = ID)
- Valores numéricos (no textuales)
- Sin columnas de metadatos

## 📝 Notas

- **Para MS Forms**: Usa preferiblemente el formato **.xlsx** - es el más común y mejor soportado
- **Nombres sin comillas**: MS Forms no usa comillas en los headers - esto es normal y está soportado
- **Caracteres especiales**: Totalmente soportados (¿, á, é, í, ó, ú, ñ, etc.)

## 🔗 Exportar Tus Propios Datos

### Desde Microsoft Forms:
1. Abre tu formulario
2. Ve a "Respuestas"
3. Haz clic en "Abrir en Excel" o "Descargar respuestas"
4. Guarda el archivo .xlsx
5. Cárgalo en la aplicación

### Desde Google Forms:
1. Abre tu formulario
2. Ve a "Respuestas"  
3. Haz clic en el icono de Google Sheets
4. En la hoja: Archivo > Descargar > Microsoft Excel (.xlsx) o CSV

## ⚠️ Importante

Si usas archivos de ejemplo para pruebas, recuerda que la IA:
- Detectará automáticamente la escala
- Sugerirá etiquetas apropiadas
- Eliminará columnas de metadatos
- Transformará valores textuales a números

¡Los resultados pueden variar según el modelo de Gemini seleccionado!
