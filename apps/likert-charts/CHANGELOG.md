# CHANGELOG - Likert Chart Visualizer

## Version 3.1 - AI Processing Integration (Febrero 2026)

### 🤖 INTEGRACIÓN DE INTELIGENCIA ARTIFICIAL

#### 1. **Procesamiento Inteligente con Google Gemini AI**
- ✅ Soporte completo para archivos Excel (.xlsx, .xls) - Ideal para MS Forms
- ✅ Limpieza automática de archivos CSV de formularios
- ✅ Detección automática de escalas Likert
- ✅ Sugerencias inteligentes de etiquetas apropiadas
- ✅ Transformación automática de formatos (MS Forms, Google Forms, otros)
- ✅ Identificación y eliminación de columnas innecesarias (timestamps, emails, etc.)
- ✅ Manejo inteligente de nombres de columnas sin comillas (estándar en MS Forms)
- ✅ Interfaz de confirmación interactiva para revisar sugerencias
- ✅ Validación y advertencias de posibles problemas
- ✅ Selector de 3 modelos de Gemini (2.0 Flash, 3 Flash Preview, 3 Pro Preview)

**Archivos nuevos:**
- `ai/GeminiProcessor.js` - Módulo de integración con Gemini API
- `style-gemini.css` - Estilos para modal de confirmación y panel de IA
- `GEMINI_AI_GUIDE.md` - Guía completa de uso de la funcionalidad de IA
- `ejemplo_msforms.csv` - Archivo de ejemplo de Microsoft Forms
- `ejemplo_gforms.csv` - Archivo de ejemplo de Google Forms

**Archivos modificados:**
- `app-dashboard.js` - Integración del procesamiento con IA
- `index.html` - Panel de configuración de IA en sección de datos
- `i18n/es.json` - Traducciones en español para funcionalidad de IA
- `i18n/en.json` - Traducciones en inglés para funcionalidad de IA
- `README.md` - Documentación de la nueva funcionalidad

#### 2. **Características del Procesamiento con IA**

**Detección Automática:**
- Identifica el tipo de fuente (MS Forms, Google Forms, otros)
- Detecta automáticamente la escala Likert usada (3, 5, 7 puntos, etc.)
- Reconoce columnas de datos Likert vs columnas administrativas
- Calcula nivel de confianza en las detecciones

**Transformación Inteligente:**
- Convierte respuestas textuales a valores numéricos
- Elimina columnas innecesarias (timestamps, emails, nombres)
- Transforma a formato ancho requerido por la aplicación
- Genera ID de respondent automáticamente si no existe

**Interfaz Interactiva:**
- Modal de confirmación con análisis completo
- Edición directa de etiquetas sugeridas
- Vista previa del CSV limpio
- Advertencias sobre posibles problemas
- Opción de cancelar y volver al modo manual

**Seguridad y Privacidad:**
- API Key guardada localmente en el navegador
- Solo se envía a Google Gemini para procesamiento
- Opción de borrar la clave en cualquier momento
- Modo manual disponible para datos sensibles

#### 3. **Flujo de Trabajo Mejorado**

**Antes (Modo Manual):**
1. Usuario debe conocer formato exacto
2. Limpiar manualmente columnas innecesarias  
3. Identificar escala Likert manualmente
4. Transformar datos al formato correcto
5. Configurar etiquetas manualmente

**Ahora (Modo IA):**
1. Activar procesamiento con IA
2. Ingresar API Key de Gemini (una sola vez)
3. Cargar archivo CSV
4. **Revisar y confirmar sugerencias de la IA**
5. ¡Listo! Gráfico generado automáticamente

#### 4. **Soporte de Formatos**

- ✅ Microsoft Forms (con timestamps, emails, nombres)
- ✅ Google Forms (con timestamps)
- ✅ CSV genéricos con respuestas Likert
- ✅ Respuestas en formato texto o numérico
- ✅ Múltiples idiomas (español, inglés)

### 📊 Ejemplo de Procesamiento

**Entrada (MS Forms):**
```csv
ID,Email,Timestamp,Q1,Q2,Q3
1,user@mail.com,2024-01-15,Totalmente de acuerdo,De acuerdo,Neutral
```

**Salida (Procesada por IA):**
```csv
respondent,Q1,Q2,Q3
1,5,4,3
```

**Escala Detectada:** 5 puntos (Acuerdo)  
**Etiquetas Sugeridas:** Totalmente en desacuerdo, En desacuerdo, Neutral, De acuerdo, Totalmente de acuerdo

### 🎯 Beneficios Clave

- ⚡ **Ahorro de tiempo**: De 15 minutos a 30 segundos
- 🎯 **Mayor precisión**: Detección automática de escalas
- 🧹 **Datos limpios**: Eliminación automática de columnas innecesarias
- 📝 **Etiquetas apropiadas**: Sugerencias en el idioma correcto
- ✅ **Validación**: Advertencias sobre posibles problemas
- 🔄 **Flexibilidad**: Siempre puedes editar o usar modo manual

### 🔗 API y Dependencias

- **Google Gemini API**: Modelos disponibles
  - `gemini-2.0-flash` - Rápido y eficiente (por defecto)
  - `gemini-3-flash-preview` - Preview de última generación
  - `gemini-3-pro-preview` - Máxima potencia
- **Plan gratuito**: 15 req/min
- **Sin librerías adicionales**: Solo Vanilla JavaScript
- **Compatibilidad**: Todos los navegadores modernos

### 📚 Documentación

Ver [GEMINI_AI_GUIDE.md](GEMINI_AI_GUIDE.md) para:
- Guía paso a paso de uso
- Obtención de API Key gratuita
- Ejemplos completos
- Solución de problemas
- FAQs

---

## Version 3.0 - Modular Plugin System (Febrero 2026)

### 🚀 CAMBIOS REVOLUCIONARIOS

#### 1. **Sistema de Plugins de Gráficos**
- ✅ Arquitectura completamente modular y extensible
- ✅ Agregar nuevos tipos de gráficos sin modificar código principal
- ✅ Registro dinámico de gráficos desde config.json
- ✅ Interfaz estándar para todos los tipos de gráficos
- ✅ Carga bajo demanda con ES6 modules

**Archivos nuevos:**
- `core/ChartRegistry.js` - Sistema de registro de gráficos
- `charts/StackedChart.js` - Gráfico apilado como módulo
- `charts/DivergingChart.js` - Gráfico divergente como módulo
- `charts/DistributionChart.js` - Gráfico de distribución como módulo
- `AGREGAR_GRAFICOS.md` - Guía completa para agregar gráficos

**Archivos modificados:**
- `config.json` - Agregado array `chartTypes` con módulos
- `app-modular.js` - Nueva arquitectura modular

#### 2. **Layout Reorganizado (Macro + Detalles)**
- ✅ **Sidebar izquierdo**: Controles macro (datos, escala, tipo, filtros)
- ✅ **Barra superior**: Detalles finos (colores, fuentes, dimensiones)
- ✅ **Área principal**: Gráfico maximizado
- ✅ Mejor aprovechamiento del espacio horizontal
- ✅ Diseño más limpio y profesional

**Archivos nuevos:**
- `index-new.html` - Nuevo layout dashboard optimizado
- `style-new.css` - Diseño moderno con sidebar + topbar

#### 3. **Separación de Tamaños de Fuente**
- ✅ 3 controles independientes de tamaño de fuente:
  - **fontSizeLabels** (12px) - Para nombres de ítems y ejes
  - **fontSizeValues** (11px) - Para valores en las barras
  - **fontSizeLegend** (10px) - Para leyenda y marca de agua
- ✅ Mayor control sobre la apariencia
- ✅ Mejor legibilidad con tamaños optimizados

**Archivos modificados:**
- `app-modular.js` - AppState.chartConfig con 3 propiedades de fuente
- `charts/*.js` - Todos los módulos usan tamaños específicos
- `i18n/es.json` y `i18n/en.json` - Nuevas traducciones

#### 4. **Protección del Código y Backend Simulado**
- ✅ Sistema de sesiones con tokens únicos
- ✅ Detección de DevTools
- ✅ Click derecho deshabilitado en producción
- ✅ Mensajes de copyright en consola
- ✅ Log de actividad del usuario
- ✅ Almacenamiento encriptado básico

**Archivos nuevos:**
- `api/auth.js` - Sistema de autenticación y protección

#### 5. **Español como Idioma Predeterminado**
- ✅ Interfaz inicia en español
- ✅ Mejor soporte para usuarios hispanohablantes

**Archivos modificados:**
- `index-new.html` - lang="es" por defecto
- `app-modular.js` - currentLanguage: 'es'

### 📁 Nueva Estructura de Archivos

```
likert_charts/
├── charts/              ⭐ NUEVO - Módulos de gráficos
│   ├── StackedChart.js
│   ├── DivergingChart.js
│   └── DistributionChart.js
├── core/                ⭐ NUEVO - Sistema base
│   └── ChartRegistry.js
├── api/                 ⭐ NUEVO - Backend simulado
│   └── auth.js
├── index-new.html       ⭐ NUEVO - Layout modernizado
├── style-new.css        ⭐ NUEVO - Estilos dashboard
├── app-modular.js       ⭐ NUEVO - Lógica modular
├── AGREGAR_GRAFICOS.md  ⭐ NUEVO - Guía de extensión
├── USO_NUEVA_VERSION.md ⭐ NUEVO - Instrucciones de uso
└── [archivos anteriores sin cambios]
```

### 🎯 Cómo Agregar un Nuevo Gráfico (Ejemplo)

**Antes (v2.0):**
- ❌ Modificar app.js (100+ líneas)
- ❌ Agregar case en switch
- ❌ Actualizar render()
- ❌ Riesgo de romper código existente

**Ahora (v3.0):**
1. ✅ Crear `charts/MiGrafico.js` (50-100 líneas)
2. ✅ Agregar 1 línea en config.json
3. ✅ ¡Listo! Aparece automáticamente

**Consulta `AGREGAR_GRAFICOS.md` para ejemplos completos.**

### 🔄 Migración desde v2.0

#### Opción A: Usar Nueva Versión
```bash
# Renombrar archivos antiguos (respaldo)
index.html → index-old.html
style.css → style-old.css

# Activar nueva versión
index-new.html → index.html
style-new.css → style.css
```

#### Opción B: Mantener Ambas
- Versión antigua: `index-old.html`
- Versión nueva: `index-new.html`

### 🐛 Correcciones

- ✅ Config.json carga correctamente escalas y colores
- ✅ Cambio de idioma actualiza toda la interfaz
- ✅ Valores mostrados con tamaños de fuente apropiados
- ✅ Leyenda con tamaño de fuente independiente

### 📊 Compatibilidad

- ✅ **Datos CSV**: 100% compatible
- ✅ **config.json**: Compatible + nueva sección `chartTypes`
- ✅ **i18n**: Compatible + nuevas claves
- ✅ **Navegadores**: Requiere ES6 modules (Chrome 61+, Firefox 60+, Safari 11+, Edge 16+)

### ⚡ Rendimiento

- ✅ Carga bajo demanda de módulos
- ✅ Solo carga gráficos habilitados
- ✅ Mejor organización de memoria

---

## Version 2.0 - Dashboard Edition (Febrero 2026)

### 🎯 Cambios Principales

#### 1. **Interfaz Dashboard de Vista Única**
- ✅ Eliminado el sistema de navegación por pasos
- ✅ Layout horizontal con sidebar + área de gráfico
- ✅ Todos los controles visibles simultáneamente
- ✅ Optimizado para uso en PC/desktop

**Archivos modificados:**
- `index.html` - Completamente rediseñado
- `style.css` - Nuevo sistema de layout con CSS Grid/Flexbox

#### 2. **Sistema Reactivo de Actualización**
- ✅ El gráfico se actualiza automáticamente al cambiar cualquier parámetro
- ✅ Eliminados botones "Aplicar" y "Actualizar"
- ✅ Feedback instantáneo en cada cambio
- ✅ Listeners de eventos en todos los controles

**Archivos modificados:**
- `app.js` - Nuevo método `setupReactiveControls()`
- `app.js` - `ChartRenderer.render()` llamado automáticamente

#### 3. **Configuración Externa (config.json)**
- ✅ Escalas Likert predefinidas configurables
  - Agreement (5 y 7 puntos)
  - Frequency (5 puntos)
  - Satisfaction (5 puntos)
  - Importance (5 puntos)
  - Quality (5 puntos)
  - Likelihood (5 puntos)
- ✅ 8 paletas de colores profesionales
- ✅ Configuración por defecto personalizable
- ✅ Soporte multiidioma en configuración

**Archivos nuevos:**
- `config.json` - Archivo de configuración externo

**Archivos modificados:**
- `app.js` - Nuevo módulo `ConfigLoader`
- `app.js` - `ChartRenderer.getColors()` usa config

#### 4. **Paneles Colapsables Organizados**
- ✅ 7 paneles temáticos
  - Carga de Datos
  - Configuración de Escala
  - Tipo de Gráfico
  - Configuración de Datos
  - Configuración Visual
  - Opciones de Visualización
  - Filtro de Ítems
  - Exportar
- ✅ Funcionalidad collapse/expand
- ✅ Iconos visuales de estado
- ✅ Mejor uso del espacio vertical

**Archivos modificados:**
- `index.html` - Estructura de paneles con data-toggle
- `style.css` - Estilos para paneles colapsables
- `app.js` - Método `setupCollapsiblePanels()`

#### 5. **Filtro de Ítems**
- ✅ Panel de checkboxes para seleccionar ítems
- ✅ Muestra/oculta ítems específicos del gráfico
- ✅ Actualización reactiva al filtrar
- ✅ Estado sincronizado con `AppState.filteredItems`

**Archivos modificados:**
- `app.js` - Nuevo método `populateItemFilter()`
- `app.js` - `ChartRenderer.render()` filtra ítems
- `index.html` - Nuevo panel de filtros

#### 6. **Paletas de Color Ampliadas**
- ✅ 8 esquemas de color (antes 4)
- ✅ Incluye divergentes y secuenciales
- ✅ Nombres descriptivos en inglés y español
- ✅ Cargadas dinámicamente desde config

**Archivos modificados:**
- `config.json` - Definición de colorSchemes
- `app.js` - Método `populateColorSchemes()`

#### 7. **Mejoras en Escalas**
- ✅ Dropdown de escalas predefinidas
- ✅ Carga dinámica desde config.json
- ✅ Edición en vivo de etiquetas
- ✅ Cambio de idioma actualiza escalas

**Archivos modificados:**
- `app.js` - Métodos `handlePresetScaleChange()`, `handleCustomPointsChange()`
- `i18n/*.json` - Nuevas claves de traducción

### 📁 Nuevos Archivos

1. **config.json** - Configuración externa
2. **README.md** - Documentación completa
3. **test.html** - Página de información/prueba

### 🔧 Archivos Modificados

1. **index.html**
   - Layout dashboard completo
   - Eliminados steps
   - Paneles colapsables
   - Controles reorganizados

2. **style.css**
   - Variables CSS para dashboard
   - Layout flexbox/grid
   - Estilos para paneles
   - Responsive mejorado
   - Eliminados estilos de steps

3. **app.js**
   - Módulo ConfigLoader
   - Sistema reactivo
   - Filtrado de ítems
   - Paneles colapsables
   - Carga dinámica de escalas/colores
   - Eliminado sistema de navegación

4. **i18n/en.json** y **i18n/es.json**
   - Nuevas claves para dashboard
   - Traducciones de paneles
   - Textos de configuración

### 🎨 Mejoras de UX

- ✅ Menos clics (no hay navegación)
- ✅ Feedback instantáneo
- ✅ Interfaz más limpia
- ✅ Mejor organización visual
- ✅ Controles agrupados lógicamente
- ✅ Paneles colapsables para espacio
- ✅ Placeholder cuando no hay datos
- ✅ Validación en tiempo real

### 🚀 Mejoras Técnicas

- ✅ Código más modular
- ✅ Estado centralizado mejorado
- ✅ Separación de configuración y código
- ✅ Listeners de eventos optimizados
- ✅ Renderizado condicional mejorado
- ✅ Sin dependencias externas
- ✅ 100% cliente

### 📊 Funcionalidad Mantenida

- ✅ 3 tipos de gráficos (Stacked, Diverging, Distribution)
- ✅ Exportar PNG
- ✅ Soporte CSV formato ancho
- ✅ Validación de datos
- ✅ Estadísticas (media, mediana, acuerdo)
- ✅ Ordenamiento múltiple
- ✅ Internacionalización (EN/ES)
- ✅ Responsive design

### 🔍 Testing Recomendado

1. Cargar archivo CSV
2. Probar escalas predefinidas
3. Crear escala personalizada
4. Cambiar entre tipos de gráfico
5. Modificar colores en tiempo real
6. Filtrar ítems
7. Exportar PNG
8. Cambiar idioma
9. Probar en diferentes resoluciones
10. Validar con datos inválidos

### 📝 Notas de Migración

Si actualizas desde versión 1.0:
- El sistema de steps fue eliminado
- config.json es ahora requerido
- Los colores ahora están en config.json
- Las escalas predefinidas se cargan de config.json
- No hay "botón aplicar" - todo es reactivo

### 🎯 Próximas Mejoras Sugeridas

- [ ] Exportar a SVG real (no PNG)
- [ ] Importar/exportar configuración
- [ ] Más tipos de gráficos
- [ ] Temas de color para el dashboard
- [ ] Guardado de sesión (localStorage)
- [ ] Importar múltiples archivos
- [ ] Comparar datasets
- [ ] Anotaciones en gráficos

---

**Versión**: 2.0
**Fecha**: Febrero 2026
**Autor**: Senior Front-end Developer
**Tecnologías**: HTML5, CSS3, Vanilla JavaScript ES6+
