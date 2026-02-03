# Cómo Agregar Nuevos Tipos de Gráficos

## 📌 Sistema de Plugins de Gráficos

Este visualizador usa un sistema extensible que permite agregar nuevos tipos de gráficos sin modificar el código principal.

## 🚀 Pasos para Agregar un Nuevo Gráfico

### 1. Crear el Módulo del Gráfico

Crea un nuevo archivo en la carpeta `charts/`, por ejemplo: `charts/MiNuevoGrafico.js`

```javascript
/**
 * MiNuevoGrafico - Descripción breve
 * Explicación detallada del tipo de gráfico
 */

export default {
    // ID único del gráfico (requerido)
    id: 'mi-nuevo-grafico',
    
    // Nombre del gráfico en diferentes idiomas (requerido)
    name: {
        en: 'My New Chart',
        es: 'Mi Nuevo Gráfico'
    },

    // Descripción (opcional)
    description: {
        en: 'Description in English',
        es: 'Descripción en español'
    },

    /**
     * Función de renderizado (requerida)
     * @param {HTMLCanvasElement} canvas - Canvas donde dibujar
     * @param {Array} items - Lista de ítems a mostrar
     * @param {Object} stats - Estadísticas por ítem
     * @param {Object} config - Configuración del gráfico
     * @param {Object} scaleConfig - Configuración de la escala Likert
     * @param {Function} getColors - Función para obtener colores
     * @param {Function} t - Función de traducción
     */
    render(canvas, items, stats, config, scaleConfig, getColors, t) {
        const ctx = canvas.getContext('2d');
        const colors = getColors();
        
        // Tu código de renderizado aquí
        canvas.width = 800;
        canvas.height = 600;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Ejemplo: dibujar algo simple
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        ctx.fillStyle = colors[0];
        ctx.fillText(t('my_translation_key'), 50, 50);
        
        // ... resto de tu lógica de renderizado
    },

    /**
     * Validación (opcional)
     * Verifica si puede renderizar los datos proporcionados
     */
    canRender(items, stats, scaleConfig) {
        return items && items.length > 0 && stats && scaleConfig;
    },

    /**
     * Dibuja la leyenda (opcional pero recomendado)
     */
    drawLegend(ctx, colors, scaleConfig, config, x, y) {
        // Código para dibujar leyenda
    }
};
```

### 2. Registrar el Gráfico en config.json

Abre `config.json` y agrega tu gráfico al array `chartTypes`:

```json
{
  "chartTypes": [
    {
      "id": "stacked",
      "module": "charts/StackedChart.js",
      "enabled": true
    },
    {
      "id": "diverging",
      "module": "charts/DivergingChart.js",
      "enabled": true
    },
    {
      "id": "distribution",
      "module": "charts/DistributionChart.js",
      "enabled": true
    },
    {
      "id": "mi-nuevo-grafico",
      "module": "charts/MiNuevoGrafico.js",
      "enabled": true
    }
  ],
  ...
}
```

### 3. Agregar Traducciones (Opcional)

Si tu gráfico usa claves de traducción personalizadas, agrégalas a los archivos de idioma:

**i18n/es.json:**
```json
{
  ...
  "my_translation_key": "Mi texto en español"
}
```

**i18n/en.json:**
```json
{
  ...
  "my_translation_key": "My text in English"
}
```

### 4. ¡Listo!

Recarga la aplicación y tu nuevo tipo de gráfico aparecerá automáticamente en el selector de tipos de gráfico.

## 📊 Tipos de Renderizado

### Para gráficos por ítem (como Stacked y Diverging):

```javascript
render(canvas, items, stats, config, scaleConfig, getColors, t) {
    // items: ['Item 1', 'Item 2', 'Item 3']
    // stats: { 'Item 1': { mean: 3.5, frequencies: {...}, ... } }
}
```

### Para gráficos de distribución general:

```javascript
render(canvas, longData, config, scaleConfig, getColors, t) {
    // longData: [{ respondent: '1', item: 'Q1', value: 5 }, ...]
}
```

**Nota:** El sistema detecta automáticamente qué parámetros necesita tu gráfico basándose en el tipo.

## 🎨 Recursos Disponibles

### config (Object)
- `config.fontSizeLabels` - Tamaño de fuente para etiquetas
- `config.fontSizeValues` - Tamaño de fuente para valores
- `config.fontSizeLegend` - Tamaño de fuente para leyenda
- `config.fontFamily` - Familia de fuente
- `config.barHeight` - Alto de barras
- `config.barSpacing` - Espaciado entre barras
- `config.showValues` - Mostrar valores
- `config.showLegend` - Mostrar leyenda
- `config.valueType` - 'percentage' o 'count'
- `config.decimalPlaces` - Decimales a mostrar
- `config.watermark` - Marca de agua

### scaleConfig (Object)
- `scaleConfig.points` - Número de puntos en la escala
- `scaleConfig.labels` - Array de etiquetas para cada punto
- `scaleConfig.type` - Tipo de escala

### getColors()
Devuelve un array de colores HEX basado en el esquema seleccionado y la cantidad de puntos de la escala.

```javascript
const colors = getColors(); // ['#d73027', '#f46d43', '#fdae61', ...]
```

### t(key)
Función de traducción que devuelve el texto en el idioma actual.

```javascript
const title = t('chart_stacked'); // "Gráfico de Barras Apiladas"
```

## 💡 Ejemplos de Gráficos que Puedes Agregar

1. **Gráfico Radar/Spider** - Comparación multidimensional
2. **Mapa de Calor** - Matriz de respuestas
3. **Gráfico de Violín** - Distribución con densidad
4. **Gráfico de Puntos** - Scatter plot de respuestas
5. **Gráfico de Líneas** - Evolución temporal (si hay timestamp)
6. **Gráfico de Caja (Boxplot)** - Estadísticas descriptivas
7. **Gráfico de Embudo (Funnel)** - Para escalas de conversión

## 🔧 Deshabilitar Gráficos

Para deshabilitar temporalmente un gráfico sin eliminarlo:

```json
{
  "id": "mi-grafico",
  "module": "charts/MiGrafico.js",
  "enabled": false
}
```

## 🐛 Debugging

Si tu gráfico no aparece:

1. Abre la consola del navegador (F12)
2. Busca mensajes de `[ConfigLoader]` y `[ChartRegistry]`
3. Verifica que el módulo se cargó correctamente
4. Asegúrate de que `id` y `render()` estén definidos
5. Revisa la sintaxis de `config.json` (debe ser JSON válido)

## 📝 Mejores Prácticas

✅ **Hacer:**
- Usar los tamaños de fuente de `config`
- Obtener colores con `getColors()`
- Validar datos en `canRender()`
- Limpiar el canvas antes de dibujar
- Usar traducciones con `t()`
- Documentar tu código

❌ **Evitar:**
- Hardcodear colores o tamaños
- Modificar `AppState` directamente
- Asumir que los datos siempre son válidos
- Dibujar fuera de los límites del canvas

## 🤝 Compartir Tu Gráfico

Si creas un gráfico útil, puedes compartirlo:

1. Crea un archivo `.js` limpio y documentado
2. Incluye ejemplos de uso
3. Especifica requisitos de datos
4. Comparte en el repositorio o comunidad

---

**¿Preguntas?** Consulta los archivos en `charts/` para ver ejemplos completos de implementación.
