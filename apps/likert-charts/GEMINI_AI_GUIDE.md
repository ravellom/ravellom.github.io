# Procesamiento Inteligente con Gemini AI

## 🤖 Nueva Funcionalidad

La aplicación Likert Charts ahora incluye procesamiento inteligente de datos usando **Google Gemini AI** para:

1. **Limpiar automáticamente** archivos CSV de formularios (MS Forms, Google Forms, etc.)
2. **Detectar la escala Likert** utilizada en tus datos
3. **Sugerir etiquetas apropiadas** para cada punto de la escala
4. **Transformar el formato** al esperado por la aplicación
5. **Identificar y eliminar** columnas innecesarias (timestamps, emails, etc.)

## 📋 Requisitos

- **API Key de Google Gemini** (gratuita)
- Archivo de datos en formato:
  - **Excel** (.xlsx, .xls) - Más común en MS Forms
  - **CSV** (.csv)

## 🚀 Cómo Usar

### Paso 1: Obtener API Key de Gemini

1. Visita [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la clave generada (empieza con `AIza...`)

### Paso 2: Configurar en la Aplicación

1. En el panel **"Datos"**, activa el checkbox **"Activar procesamiento con Gemini AI"**
2. Pega tu API Key en el campo correspondiente
3. Selecciona el **tipo de fuente** de tus datos:
   - **Microsoft Forms**: Datos exportados desde MS Forms
   - **Google Forms**: Datos exportados desde Google Forms  
   - **Otro formato**: Cualquier CSV con estructura diferente
4. Selecciona el **modelo de Gemini** (opcional):
   - **Gemini 2.0 Flash**: Rápido y eficiente (recomendado)
   - **Gemini 3 Flash Preview**: Versión preview más reciente
   - **Gemini 3 Pro Preview**: Mayor potencia para casos complejos

### Paso 3: Cargar tu Archivo

1. Haz clic en **"Archivo de Datos"** y selecciona tu archivo
   - Formatos aceptados: **.xlsx**, **.xls**, **.csv**
   - Para MS Forms, usa el formato Excel (.xlsx) - es el más común
2. La IA procesará automáticamente el archivo (puede tardar 5-15 segundos)
3. Se mostrará un **modal de confirmación** con:
   - Análisis del archivo detectado
   - Escala Likert sugerida
   - Etiquetas propuestas para cada punto
   - Vista previa del CSV limpio
   - Advertencias (si las hay)

### Paso 4: Revisar y Confirmar

1. **Revisa las sugerencias** de la IA
2. **Edita las etiquetas** directamente en el modal si necesitas ajustarlas
3. Haz clic en **"Aplicar Sugerencias"** para procesar los datos
4. El gráfico se generará automáticamente con la configuración detectada

## 🎯 Ventajas

### ✅ Procesamiento Tradicional (Manual)
- Debes conocer exactamente el formato esperado
- Necesitas limpiar manualmente columnas innecesarias
- Tienes que identificar la escala Likert tú mismo
- Requiere transformar datos a formato ancho

### 🤖 Procesamiento con Gemini AI
- ✨ **Detecta automáticamente** el formato y estructura
- 🧹 **Limpia** columnas innecesarias (timestamps, emails)
- 🎯 **Identifica** la escala Likert usada
- 📝 **Sugiere** etiquetas apropiadas en tu idioma
- ⚡ **Transforma** al formato correcto automáticamente
- 🔍 **Valida** y advierte sobre posibles problemas

## 📊 Formatos Soportados

### Microsoft Forms (.xlsx - Recomendado)

**Exportación desde MS Forms:**
1. Abre tu formulario en Microsoft Forms
2. Ve a "Respuestas"
3. Haz clic en "Abrir en Excel" o "Descargar"
4. Guarda el archivo .xlsx
5. Cárgalo directamente en la aplicación

**Características:**
- ✅ Soporta nombres de columnas sin comillas
- ✅ Acepta caracteres especiales (¿, á, é, ñ, etc.)
- ✅ Detecta automáticamente columnas de metadatos
- ✅ Convierte respuestas textuales a números

**Ejemplo:**
```
ID | Start time | Email | ¿Qué tan satisfecho? | ¿Recomendarias?
1  | 2024-01-01 | user@mail.com | Muy satisfecho | Sí
2  | 2024-01-01 | user2@mail.com | Satisfecho | Probablemente
```

**La IA detectará:**
- Columnas a eliminar: `Start time`, `Email`
- Preguntas Likert: `¿Qué tan satisfecho?`, `¿Recomendarias?`
- Transformará respuestas textuales a números
- Generará etiquetas apropiadas en español

### Microsoft Forms (CSV)
```csv
ID,Start time,Completion time,Email,Name,¿Pregunta 1?,¿Pregunta 2?
1,2024-01-01,2024-01-01,user@mail.com,User,Totalmente de acuerdo,De acuerdo
2,2024-01-01,2024-01-01,user2@mail.com,User2,De acuerdo,Neutral
```

**La IA detectará:**
- Columnas a eliminar: `Start time`, `Completion time`, `Email`, `Name`
- Preguntas Likert: `¿Pregunta 1?`, `¿Pregunta 2?`
- Transformará respuestas textuales a números (1-5)

### Google Forms

**Exportación desde Google Forms:**
1. Abre tu formulario en Google Forms
2. Ve a "Respuestas"
3. Haz clic en el icono de Google Sheets (crear hoja de cálculo)
4. En la hoja, ve a Archivo > Descargar > CSV o Excel (.xlsx)

**Formatos aceptados:**
```csv
Timestamp,¿Pregunta 1?,¿Pregunta 2?,¿Pregunta 3?
1/15/2024 10:30:00,Muy en desacuerdo,En desacuerdo,Neutral
1/15/2024 11:45:00,Neutral,De acuerdo,Muy de acuerdo
```

**La IA detectará:**
- Columnas a eliminar: `Timestamp`
- Preguntas Likert: Todas las demás
- Identificará escala de 5 puntos
- Sugerirá etiquetas apropiadas

### Otros Formatos
La IA puede procesar casi cualquier formato CSV o Excel que contenga:
- Datos de encuesta con respuestas Likert
- Valores numéricos (1-5, 1-7, etc.) o textuales
- Una o más preguntas tipo Likert
- Headers con o sin comillas

## ⚙️ Configuración Avanzada

### Seguridad de la API Key

- La API Key se guarda en `localStorage` del navegador
- **No se envía a ningún servidor** excepto a Google Gemini
- Puedes borrarla en cualquier momento limpiando el campo

### Personalización del Prompt

Si eres desarrollador, puedes modificar el prompt en:
- Archivo: `ai/GeminiProcessor.js`
- Método: `buildPrompt(csvContent, sourceType)`

### Modelos de Gemini

**Modelos disponibles:**

1. **Gemini 2.0 Flash** (Recomendado)
   - Más rápido y eficiente
   - Ideal para la mayoría de casos
   - Mejor balance velocidad/calidad

2. **Gemini 3 Flash Preview**
   - Versión preview de última generación
   - Mayor capacidad de comprensión
   - Para formatos más complejos

3. **Gemini 3 Pro Preview**
   - Máxima potencia de procesamiento
   - Para archivos grandes o muy complejos
   - Puede ser más lento pero más preciso

**Cambio del modelo:**
Puedes seleccionar el modelo antes de cargar el archivo. El modelo seleccionado se usará para ese procesamiento específico.

## 🔍 Ejemplo Completo

### Entrada (MS Forms - Excel .xlsx)
```
ID | Email | Timestamp | ¿Satisfecho? | ¿Calidad? | ¿Precio?
1  | user@mail.com | 2024-01-15 | Muy satisfecho | Excelente | Totalmente de acuerdo
2  | user2@mail.com | 2024-01-15 | Satisfecho | Buena | De acuerdo
3  | user3@mail.com | 2024-01-15 | Neutral | Aceptable | Neutral
```

### Análisis de Gemini
```
✓ Fuente detectada: Microsoft Forms (Excel)
✓ 3 filas de datos
✓ 6 columnas totales
✓ 3 preguntas Likert (¿Satisfecho?, ¿Calidad?, ¿Precio?)
✓ Escala: 5 puntos (Satisfacción/Acuerdo mixto)
✓ Confianza: 95%
✓ Transformación: Texto → Números
```

### Salida (CSV Limpio)
```csv
respondent,¿Satisfecho?,¿Calidad?,¿Precio?
1,5,5,5
2,4,4,4
3,3,3,3
```

**Nota:** Los headers NO tienen comillas - esto es intencional y compatible con MS Forms.

### Escala Aplicada
```
1: Totalmente en desacuerdo
2: En desacuerdo
3: Neutral
4: De acuerdo
5: Totalmente de acuerdo
```

## ❓ Preguntas Frecuentes

### ¿Es gratis?
Sí, el plan gratuito de Gemini incluye:
- 15 peticiones por minuto
- 1 millón de tokens por mes
- Suficiente para procesar cientos de archivos

### ¿Mis datos son privados?
- Los datos se envían a Google Gemini para procesamiento
- Google puede usar los datos para mejorar sus modelos (según sus términos)
- Si tus datos son sensibles, usa el procesamiento tradicional manual

### ¿Qué pasa si la IA se equivoca?
- **Siempre puedes revisar** las sugerencias antes de aplicarlas
- **Edita las etiquetas** directamente en el modal de confirmación
- Si hay errores graves, **cancela** y usa el modo manual

### ¿Funciona sin conexión?
No, requiere conexión a Internet para comunicarse con la API de Gemini.

### ¿Puedo usar mi propia API?
Sí, el código es open source. Puedes modificar `ai/GeminiProcessor.js` para usar cualquier LLM.

## 🐛 Solución de Problemas

### "Invalid API Key"
- Verifica que copiaste la clave completa
- Asegúrate de que la clave esté activa en Google AI Studio
- Genera una nueva clave si es necesario

### "Cuota de API excedida"
Este es el error más común. Significa que alcanzaste el límite de peticiones del plan gratuito.

**Soluciones:**
1. **Espera 1 minuto** - Los límites se resetean cada minuto
2. **Cambia de modelo** - Prueba con Gemini 3 Flash Preview o Pro
3. **Usa modo manual** - Carga el archivo sin IA
4. **Reinicia la carga** - Haz clic en el botón "🔄 Reiniciar"

**Límites del plan gratuito:**
- 15 peticiones por minuto
- 1,500 peticiones por día
- 1 millón de tokens por mes

### "Error al procesar con IA"
- Revisa tu conexión a Internet
- Verifica que no excediste el límite de peticiones gratuitas
- Intenta con un archivo más pequeño
- **Usa el botón "🔄 Reiniciar"** para limpiar el estado y volver a intentar

### El archivo no se carga después de un error
**Solución:** Haz clic en el botón **"🔄 Reiniciar"** junto al selector de archivo. Esto limpiará el estado y te permitirá cargar un nuevo archivo o reintentar con otro modelo.

### "Respuesta de Gemini incompleta"
- El archivo puede ser demasiado complejo
- Intenta con un formato más simple
- Usa el modo manual para casos complejos

## 📚 Referencias

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Pricing & Limits](https://ai.google.dev/pricing)

---

**Versión**: 3.1 - AI Integration
**Última actualización**: Febrero 2026
