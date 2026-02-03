# INSTRUCCIONES DE USO - Nueva Versión Modular

## 🎯 ¿Qué se implementó?

### ✅ Sistema Completamente Nuevo

Se creó una **arquitectura modular extensible** con las siguientes mejoras:

1. **Sistema de Plugins de Gráficos** 📊
   - Agregar nuevos gráficos sin tocar código principal
   - Solo crear archivo + línea en config.json
   - Interfaz estándar para todos los gráficos

2. **Layout Reorganizado** 🎨
   - Sidebar izquierdo: Controles macro (datos, escala, tipo)
   - Barra superior: Detalles finos (colores, fuentes, dimensiones)
   - Área principal: Gráfico maximizado

3. **Código Modularizado** 📁
   - `/charts/` - Módulos de gráficos (StackedChart, DivergingChart, DistributionChart)
   - `/core/` - Sistema de registro (ChartRegistry)
   - `/api/` - Simulación de backend y protección

4. **Protección del Código** 🔒
   - Sistema de sesiones
   - Detección de DevTools
   - Mensajes de copyright
   - Click derecho deshabilitado en producción

## 🚀 Cómo Usar la Nueva Versión

### Opción A: Probar la Nueva Versión (Recomendado)

1. **Renombra los archivos actuales** (respaldo):
   ```
   index.html → index-old.html
   style.css → style-old.css
   app.js → app-old.js
   ```

2. **Activa los nuevos archivos**:
   ```
   index-new.html → index.html
   style-new.css → style.css
   ```

3. **Abre index.html en un navegador**

### Opción B: Mantener Ambas Versiones

Puedes mantener ambas versiones y comparar:

- **Versión antigua**: Abre `index-old.html`
- **Versión nueva**: Abre `index-new.html`

## 📂 Estructura de Archivos

```
likert_charts/
├── index.html           # (Tu versión original)
├── index-new.html       # ✨ Nueva versión modular
├── style.css            # (Tu versión original)
├── style-new.css        # ✨ Nuevo diseño dashboard
├── app.js               # (Tu versión original)
├── app-modular.js       # ✨ Nueva lógica modular
├── config.json          # Actualizado con chartTypes
│
├── charts/              # ✨ Módulos de gráficos
│   ├── StackedChart.js
│   ├── DivergingChart.js
│   └── DistributionChart.js
│
├── core/                # ✨ Sistema base
│   └── ChartRegistry.js
│
├── api/                 # ✨ Backend simulado
│   └── auth.js
│
├── i18n/                # Traducciones (sin cambios)
│   ├── en.json
│   └── es.json
│
├── AGREGAR_GRAFICOS.md  # ✨ Guía para agregar gráficos
└── USO_NUEVA_VERSION.md # Este archivo
```

## 🎨 Nuevo Layout

### Sidebar Izquierdo (Controles Macro)
- 📁 **Carga de Datos** - Upload CSV
- 📊 **Escala Likert** - Configurar escala y etiquetas
- 📈 **Tipo de Gráfico** - Seleccionar tipo y ordenamiento
- 🔍 **Filtrar Ítems** - Seleccionar qué ítems mostrar
- 💾 **Descargar** - Exportar gráfico

### Barra Superior (Detalles Finos)
- 🎨 **Apariencia** - Colores, valores, leyenda
- 🔤 **Fuentes** - 3 tamaños independientes (etiquetas, valores, leyenda)
- 📐 **Dimensiones** - Alto de barras, espaciado, decimales, marca de agua

### Área Principal
- Gráfico maximizado
- Placeholder cuando no hay datos
- Scroll automático si el gráfico es grande

## 📊 Cómo Agregar un Nuevo Gráfico

### Ejemplo: Gráfico Radar

1. **Crear `charts/RadarChart.js`**:
```javascript
export default {
    id: 'radar',
    name: {
        en: 'Radar Chart',
        es: 'Gráfico Radar'
    },
    render(canvas, items, stats, config, scaleConfig, getColors, t) {
        // Tu código aquí
    }
};
```

2. **Agregar a `config.json`**:
```json
{
  "chartTypes": [
    ...
    {
      "id": "radar",
      "module": "charts/RadarChart.js",
      "enabled": true
    }
  ]
}
```

3. **¡Listo!** Aparece automáticamente en el selector

**Consulta `AGREGAR_GRAFICOS.md` para la guía completa.**

## 🔒 Protección Implementada

### Características de Seguridad

1. **Sistema de Sesiones**
   - Token único por sesión
   - Expiración de 8 horas
   - Log de actividad

2. **Detección de DevTools**
   - Alerta cuando se abren las herramientas de desarrollo
   - Log de eventos

3. **Deshabilitación de Funciones**
   - Click derecho deshabilitado en producción
   - Solo activo fuera de localhost

4. **Mensajes de Copyright**
   - Banner en consola
   - Avisos de derechos de autor

**Nota:** Estas medidas dificultan el copiado casual, pero no son infalibles. Para protección real considera minificación/ofuscación profesional.

## 🔄 Migración desde Versión Anterior

### Compatibilidad

- ✅ **CSV**: Mismo formato, sin cambios
- ✅ **config.json**: Compatible, solo agregamos `chartTypes`
- ✅ **i18n**: Sin cambios
- ✅ **Funcionalidad**: Todo lo anterior + nuevas features

### ¿Qué Cambia?

- **HTML**: Nuevo layout dashboard
- **CSS**: Nuevo diseño moderno
- **JS**: Arquitectura modular con ES6 modules
- **Navegadores**: Requiere soporte de ES6 modules (todos los modernos)

## 🐛 Solución de Problemas

### El gráfico no se muestra

1. Verifica la consola (F12)
2. Busca errores de `[ConfigLoader]` o `[ChartRegistry]`
3. Asegúrate de usar un servidor (no `file://`)

### Los módulos no cargan

- Usa un servidor local:
  ```bash
  # Python 3
  python -m http.server 8000
  
  # Node.js
  npx http-server
  ```
- Abre: `http://localhost:8000/index-new.html`

### Estilos no se aplican

- Verifica que `style-new.css` esté en la misma carpeta
- Revisa la consola para errores 404

## 📈 Próximas Mejoras Sugeridas

- [ ] Minificación/ofuscación del código
- [ ] Sistema de autenticación real
- [ ] Exportar a PDF/SVG además de PNG
- [ ] Modo oscuro
- [ ] Temas personalizables
- [ ] Gráficos adicionales (Radar, Heatmap, etc.)
- [ ] Editor de escalas visual
- [ ] Historial de gráficos generados

## 💬 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador
2. Consulta `AGREGAR_GRAFICOS.md` para ejemplos
3. Compara con la versión antigua (`index-old.html`)

---

**¡Disfruta del nuevo visualizador modular de Likert!** 🎉
