# Likert Chart Visualizer - Dashboard Edition

Una aplicación web profesional para visualización de datos de encuestas tipo Likert, con interfaz tipo dashboard y actualización reactiva en tiempo real.

## 🎯 Características Principales

### Dashboard Interactivo
- **Vista única tipo PC**: Todos los controles y el gráfico visible simultáneamente
- **Sin navegación por pasos**: Experiencia fluida sin cambiar de pantalla
- **Actualización reactiva**: El gráfico se actualiza automáticamente al cambiar cualquier parámetro

### Escalas Configurables
- **Escalas predefinidas** cargadas desde `config.json`:
  - Acuerdo (5 y 7 puntos)
  - Frecuencia (5 puntos)
  - Satisfacción (5 puntos)
  - Importancia (5 puntos)
  - Calidad (5 puntos)
  - Probabilidad (5 puntos)
- **Escala personalizada**: Define tu propio número de puntos y etiquetas
- **Edición en vivo**: Modifica las etiquetas directamente y ve los cambios al instante

### Paletas de Color Ampliadas
8 esquemas de colores profesionales:
- Blue-Orange (Divergente)
- Red-Green (Divergente)
- Purple-Yellow (Divergente)
- Spectral (Divergente)
- Viridis (Secuencial)
- Warm (Secuencial)
- Cool (Secuencial)
- Earth Tones

### Paneles Organizados
Los controles están separados en paneles colapsables:
- 📤 **Carga de Datos**
- ⚙️ **Configuración de Escala**
- 📊 **Tipo de Gráfico**
- 🔢 **Configuración de Datos** (Porcentaje/Conteo, Ordenamiento)
- 🎨 **Configuración Visual** (Colores, Fuentes, Dimensiones)
- 👁️ **Opciones de Visualización** (Mostrar valores, leyenda, decimales)
- 🎯 **Filtro de Ítems** (Seleccionar qué ítems mostrar)
- 💾 **Exportar** (PNG con marca de agua opcional)

### Filtrado de Ítems
- Muestra/oculta ítems específicos del gráfico
- Selección múltiple con checkboxes
- Actualización instantánea del gráfico

## 📁 Estructura de Archivos

```
likert_charts/
├── index.html          # Interfaz dashboard
├── style.css           # Estilos responsivos
├── app.js              # Aplicación JavaScript modular
├── config.json         # Configuración externa (escalas, colores)
├── example_data.csv    # Datos de ejemplo
└── i18n/
    ├── en.json         # Traducciones inglés
    └── es.json         # Traducciones español
```

## ⚙️ Configuración Externa

El archivo `config.json` permite personalizar la aplicación sin tocar el código:

### Agregar Nueva Escala Predefinida

```json
"new_scale_name": {
  "name": "Your Scale Name",
  "nameES": "Nombre de tu Escala",
  "points": 5,
  "labels": {
    "en": ["Label 1", "Label 2", "Label 3", "Label 4", "Label 5"],
    "es": ["Etiqueta 1", "Etiqueta 2", "Etiqueta 3", "Etiqueta 4", "Etiqueta 5"]
  }
}
```

### Agregar Nueva Paleta de Colores

```json
"new_color_scheme": {
  "name": "Your Color Scheme",
  "nameES": "Tu Esquema de Colores",
  "colors": ["#color1", "#color2", "#color3", "#color4", "#color5"]
}
```

### Cambiar Configuración por Defecto

```json
"defaultSettings": {
  "chartType": "stacked",
  "valueType": "percentage",
  "sortBy": "original",
  "colorScheme": "blue_orange",
  "fontFamily": "Arial, sans-serif",
  "fontSize": 12,
  "barHeight": 40,
  "barSpacing": 10,
  "showValues": true,
  "showLegend": true,
  "decimalPlaces": 1
}
```

## 🚀 Uso

1. **Cargar Datos**: Sube un archivo CSV en formato ancho
2. **Configurar Escala**: Selecciona una escala predefinida o personaliza
3. **Visualizar**: El gráfico se genera automáticamente
4. **Personalizar**: Ajusta colores, fuentes, ordenamiento, etc.
5. **Filtrar**: Selecciona qué ítems mostrar
6. **Exportar**: Descarga como PNG con marca de agua opcional

## 📊 Formatos de Datos Soportados

### CSV Formato Ancho (Recomendado)
```csv
respondent,Q1,Q2,Q3,Q4,Q5
1,5,4,5,4,5
2,4,4,3,4,4
3,3,3,4,3,3
```

- Primera columna: ID del encuestado
- Columnas siguientes: Ítems de la encuesta
- Valores: Enteros dentro de la escala Likert seleccionada

## 🎨 Tipos de Gráficos

1. **Gráfico de Barras Apiladas**: Muestra la distribución de respuestas por ítem
2. **Gráfico Divergente**: Centra las respuestas neutrales y separa negativas/positivas
3. **Distribución General**: Muestra la distribución agregada de todas las respuestas

## 🌐 Internacionalización

Soporta múltiples idiomas (actualmente inglés y español). Para agregar un nuevo idioma:

1. Crea `i18n/[código].json` con todas las traducciones
2. Agrega la opción al selector de idioma en `index.html`
3. Agrega las traducciones de escalas en `config.json`

## 🔧 Personalización Avanzada

### Modificar Colores del Dashboard
Edita las variables CSS en `style.css`:

```css
:root {
    --primary-color: #2563eb;
    --sidebar-width: 320px;
    /* ... más variables */
}
```

### Ajustar Dimensiones del Gráfico
Los valores se pueden ajustar directamente desde la UI o modificar los defaults en `config.json`.

## 📱 Responsividad

El dashboard se adapta automáticamente a diferentes tamaños de pantalla:
- **Desktop**: Vista lateral completa
- **Tablet**: Ancho del sidebar reducido
- **Móvil**: Diseño apilado vertical

## 💡 Características Técnicas

- **100% Cliente**: No requiere servidor
- **Vanilla JavaScript (ES6+)**: Sin frameworks
- **Modular**: Código separado en módulos lógicos
- **Reactivo**: Actualización automática en cada cambio
- **Configurable**: Escalas y colores externos
- **Comentado**: Documentación inline completa

## 🎯 Mejoras Implementadas

✅ Dashboard de vista única sin navegación por pasos
✅ Paneles colapsables organizados
✅ Escalas predefinidas configurables desde JSON
✅ 8 esquemas de colores profesionales
✅ Actualización reactiva instantánea
✅ Filtrado de ítems para mostrar/ocultar
✅ Configuración externa independiente del código
✅ Interfaz optimizada para PC/desktop

## 📝 Notas

- El gráfico se actualiza automáticamente cuando cambias cualquier configuración
- Los paneles se pueden colapsar/expandir haciendo clic en el encabezado
- Las escalas y colores se cargan desde `config.json` al iniciar
- Todos los textos UI están externalizados para fácil traducción

---

**Versión**: 2.0 - Dashboard Edition
**Última actualización**: Febrero 2026
