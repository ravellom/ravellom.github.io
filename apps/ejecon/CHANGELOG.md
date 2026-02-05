# 📝 Changelog - EjeCon

## [1.1.0] - 2026-02-05

### 🛠️ Cambios Importantes
- ❌ **ELIMINADOS** tipos `essay` y `drawing` (difíciles de autoevaluar)
- 🔢 Ahora soporta **9 tipos** de ejercicios en lugar de 11
- 🐞 **Corregido** bug en slider: ahora muestra el valor en tiempo real
- 📝 Documentación actualizada eliminando referencias a tipos removidos

### 🔧 Archivos Modificados
- `app.js`: Eliminadas funciones de essay/drawing
- `prompt.md`: Eliminados ejemplos de essay/drawing
- `README.md`, `GUIA_USO.md`, `CHANGELOG.md`: Actualizados a 9 tipos
- `visor.js`: Eliminados renderizadores, listeners y validadores de essay/drawing

---

## [1.0.0] - 2026-02-05

### ✨ Nuevas Funcionalidades

#### Sistema de Prompt Maestro Mejorado
- ✅ Prompt cargado dinámicamente desde `prompt.md` (fácil de editar)
- ✅ Guía completa con ejemplos detallados
- ✅ Mejores prácticas pedagógicas incluidas
- ✅ Checklist de calidad integrado
- ✅ Modal rediseñado con mejor UX
- ✅ Instrucciones claras de uso con IA (ChatGPT, Claude, etc.)

#### Exportación HTML Renovada
- ✅ Diseño moderno con gradientes y efectos
- ✅ Soporta todos los tipos de ejercicios correctamente
- ✅ Incluye scaffolding completo (pistas, explicaciones, ampliación)
- ✅ Estilos responsive y optimizados para imprimir
- ✅ Iconografía de Font Awesome integrada
- ✅ Footer con fecha de generación

#### Mejoras en Drag & Drop
- ✅ Feedback visual mejorado (opacidad, bordes)
- ✅ Limpieza automática de estilos al soltar
- ✅ Guardado en historial (undo/redo funcional)
- ✅ Listeners de dragend y dragleave añadidos

#### Documentación Completa
- ✅ `README.md` - Documentación técnica completa
- ✅ `GUIA_USO.md` - Guía de usuario en español
- ✅ `prompt.md` - Prompt maestro detallado con ejemplos
- ✅ `ejemplo_completo.json` - JSON de ejemplo listo para usar
- ✅ `CHANGELOG.md` - Este archivo

#### Mejoras de Interfaz
- ✅ Botón "Cargar Ejemplo" para pruebas rápidas
- ✅ Botón "Ayuda" en header con enlace a guía
- ✅ Modal del prompt con mejor altura (450px, redimensionable)
- ✅ Mensaje de ayuda contextual en modal
- ✅ Placeholder mejorado en área de texto JSON

### 🔧 Correcciones de Errores

#### Bugs Críticos Resueltos
- ✅ **Exportación HTML**: Usaba propiedades inexistentes (`exercise.question`). Ahora usa schema correcto
- ✅ **Botón Exportar HTML**: Permanecía deshabilitado. Ahora se habilita con ejercicios
- ✅ **Sanitización**: Mejorada con validación de null/undefined
- ✅ **Drag & Drop**: Eventos faltantes agregados, feedback visual implementado

### 🎨 Mejoras de Calidad

#### Código
- ✅ Función `loadMasterPrompt()` asíncrona con fallback
- ✅ Mejor manejo de errores en carga de archivos
- ✅ Validación robusta en `sanitizeText()`
- ✅ Comentarios mejorados en código

#### UX/UI  
- ✅ Estilos responsive mejorados (@media queries)
- ✅ Transiciones suaves en drag & drop
- ✅ Feedback de estado más claro
- ✅ Iconos coherentes (Phosphor Icons)

### 📚 Tipos de Ejercicios Soportados (9 total)

1. **multiple_choice** - Elección múltiple
2. **true_false** - Verdadero/Falso
3. **fill_gaps** - Rellenar huecos
4. **ordering** - Ordenar secuencias
5. **matching** - Relacionar parejas
6. **grouping** - Clasificar elementos
7. **short_answer** - Respuesta corta
8. **hotspot** - Zonas clicables en imagen
9. **slider** - Escala numérica

### 🔄 Funcionalidades Existentes Mantenidas

- ✅ Edición inline de todos los campos
- ✅ Vista previa modal de ejercicios
- ✅ Sistema undo/redo (50 niveles)
- ✅ LocalStorage con autoguardado
- ✅ Gestión de proyectos múltiples
- ✅ Búsqueda y filtros
- ✅ Importar/Exportar JSON
- ✅ Validación automática de schema
- ✅ Atajos de teclado (Ctrl+S, Ctrl+O, ESC)
- ✅ Scaffolding DUA obligatorio

### 📊 Estadísticas del Proyecto

- **1,060 líneas** de JavaScript
- **350+ líneas** de documentación markdown
- **9 tipos** de ejercicios interactivos
- **4 archivos** de documentación
- **1 ejemplo** JSON completo de referencia

### 🎯 Próximas Mejoras Sugeridas (Backlog)

- [ ] Editor visual para opciones (agregar/eliminar sin editar JSON)
- [ ] Duplicar ejercicios existentes
- [ ] Importar desde otros formatos (CSV, Excel)
- [ ] Banco de imágenes gratuitas integrado (tipo Unsplash)
- [ ] Validación en tiempo real del JSON
- [ ] Modo oscuro
- [ ] Estadísticas por tipo de ejercicio
- [ ] Exportar a PDF
- [ ] Exportar a SCORM para LMS
- [ ] Multi-idioma (inglés, portugués)
- [ ] Colaboración en tiempo real
- [ ] Biblioteca de ejercicios compartidos

### 🐛 Problemas Conocidos

- Ninguno reportado en v1.0.0

### 🔗 Enlaces Útiles

- **Repositorio**: https://github.com/ravellom/ravellom.github.io
- **Demo en vivo**: https://ravellom.github.io/apps/ejecon/
- **Schema JSON**: https://ravellom.github.io/apps/ejecon/schema.json
- **RecuEdu Labs**: https://ravellom.github.io

---

## Formato de Versiones

Este proyecto sigue [Semantic Versioning](https://semver.org/):
- **Mayor** (X.0.0): Cambios incompatibles con versiones anteriores
- **Menor** (0.X.0): Nuevas funcionalidades compatibles
- **Parche** (0.0.X): Correcciones de bugs

---

**Mantenido por**: RecuEdu Labs  
**Licencia**: Open Source Educativo  
**Última actualización**: Febrero 5, 2026
