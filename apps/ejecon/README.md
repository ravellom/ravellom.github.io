# 🎓 EjeCon - Generador de Ejercicios Educativos

Constructor visual de ejercicios interactivos con soporte para 9 tipos diferentes y principios DUA (Diseño Universal de Aprendizaje).

## � Documentación

| Documento | Propósito | Audiencia |
|-----------|-----------|-----------|
| **[README.md](README.md)** | Documentación técnica y arquitectura | Desarrolladores |
| **[GUIA_USO.md](GUIA_USO.md)** | Guía de usuario paso a paso | Docentes y usuarios finales |
| **[prompt.md](prompt.md)** | Prompt maestro para generar con IA | Usuarios que crean contenido |
| **[CHANGELOG.md](CHANGELOG.md)** | Historial de cambios y versiones | Todos |
| **[ejemplo_completo.json](ejemplo_completo.json)** | Ejemplo funcional listo para usar | Nuevos usuarios |

---

## �🚀 Características

### ✨ Tipos de Ejercicios Soportados
1. **Multiple Choice** - Elección múltiple con opciones
2. **True/False** - Verdadero o Falso
3. **Fill Gaps** - Rellenar huecos con palabras
4. **Ordering** - Ordenar secuencias (con drag & drop)
5. **Matching** - Emparejar conceptos
6. **Grouping** - Clasificar en categorías
7. **Short Answer** - Respuesta corta
8. **Hotspot** - Zonas clicables en imágenes
9. **Slider** - Escala numérica

### 🎯 Funcionalidades Principales

- **Edición en línea**: Campos editables directamente en las tarjetas
- **Prompt Maestro IA**: Sistema de prompts optimizado para generar ejercicios con ChatGPT/Claude
- **Importar/Exportar JSON**: Formato estándar para compartir ejercicios
- **Exportar HTML**: Genera páginas web standalone con los ejercicios
- **Vista Previa**: Visualización del ejercicio como lo verá el estudiante
- **Scaffolding DUA**: Pistas, explicaciones y contenido ampliado obligatorio
- **Undo/Redo**: Historial de cambios con hasta 50 niveles
- **LocalStorage**: Autoguardado y gestión de proyectos
- **Drag & Drop**: Reordenar ejercicios de tipo secuencia
- **Búsqueda y Filtros**: Encontrar ejercicios por texto o tipo

## 📋 Uso del Prompt Maestro

### Paso 1: Obtener el Prompt
1. Clic en **"Obtener Prompt Maestro"** en el panel lateral
2. Se abre un modal con el prompt completo
3. El prompt incluye:
   - Instrucciones detalladas para la IA
   - 11 ejemplos completos (uno por cada tipo)
   - Checklist de calidad
   - Estructura JSON requerida

### Paso 2: Usar con IA
1. Seleccionar todo (Ctrl+A) o clic en "Seleccionar Todo"
2. Copiar (Ctrl+C)
3. Pegar en ChatGPT/Claude/etc.
4. Reemplazar `[PEGAR CONTENIDO AQUÍ]` con tu tema
5. La IA responderá con JSON válido

### Paso 3: Importar Ejercicios
1. Copiar el JSON generado por la IA
2. Pegarlo en el área de texto del panel lateral
3. Clic en **"Procesar Texto"** para cargar
4. O usar **"Fusionar"** para añadir sin reemplazar

## 📁 Estructura de Archivos

```
ejecon/
├── index.html          # Interfaz principal
├── app.js             # Lógica de la aplicación
├── style.css          # Estilos específicos
├── schema.json        # Schema JSON oficial
├── prompt.md          # Prompt maestro (cargado dinámicamente)
└── README.md          # Esta documentación
```

## 🔧 Esquema JSON

El formato JSON sigue este esquema:

```json
{
  "resource_metadata": {
    "title": "Título del recurso",
    "topic": "Tema o asignatura"
  },
  "exercises": [
    {
      "id": "ex_1738695234_0",
      "type": "multiple_choice",
      "content": {
        "prompt_text": "¿Pregunta del ejercicio?"
      },
      "interaction": {
        // Contenido específico según el tipo
      },
      "scaffolding": {
        "hint_1": "Pista pedagógica",
        "explanation": "Explicación conceptual",
        "learn_more": "Contenido ampliado"
      }
    }
  ]
}
```

## 🎨 Principios DUA Implementados

### Representación Múltiple
- 9 tipos diferentes de interacción
- Scaffolding obligatorio (pistas, explicaciones, ampliación)

### Acción y Expresión
- Drag & drop para reordenar
- Edición inline de contenidos
- Diferentes formatos de respuesta

### Implicación y Motivación
- Vista previa interactiva
- Feedback visual inmediato
- Variedad de tipos para evitar monotonía

## 🛠️ Desarrollo

### Tecnologías
- **Vanilla JavaScript** (sin frameworks)
- **LocalStorage API** para persistencia
- **Drag & Drop API** para ordenamiento
- **Phosphor Icons** para iconografía
- **Font Awesome** para iconos adicionales

### Sistema de Validación
El validador `validateJsonSchema()` garantiza:
- Estructura correcta del JSON
- IDs únicos con timestamp
- Campos requeridos presentes
- Defaults automáticos si faltan datos
- Compatibilidad con todos los tipos

## 📝 Personalización del Prompt

Para personalizar el prompt maestro:

1. Editar `prompt.md`
2. Mantener la estructura markdown actual
3. El contenido se carga automáticamente al iniciar
4. Si falla la carga, usa un fallback básico

## 🔄 Flujo de Trabajo Recomendado

1. **Planificación**: Definir tema y objetivos de aprendizaje
2. **Generación**: Usar Prompt Maestro con IA
3. **Importación**: Pegar JSON generado
4. **Revisión**: Editar y ajustar ejercicios inline
5. **Prueba**: Vista previa de cada ejercicio
6. **Aprobación**: Marcar ejercicios como aprobados
7. **Exportación**: Descargar JSON o HTML
8. **Guardado**: Guardar proyecto para edición futura

## 🎯 Casos de Uso

- **Docentes**: Crear bancos de ejercicios para evaluaciones
- **Contenidistas**: Desarrollar materiales interactivos
- **Estudiantes**: Crear ejercicios de repaso personalizado
- **Equipos educativos**: Colaborar en recursos didácticos

## 📚 Recursos Adicionales

- **Schema JSON**: `schema.json` - Especificación completa
- **Ejemplos**: Ver `prompt.md` para 11 ejemplos completos
- **RecuEdu Labs**: https://ravellom.github.io

## 🐛 Solución de Problemas

### El JSON no se importa
- Verificar que sea JSON válido (sin comentarios `//` o `/* */`)
- Sin bloques de código markdown (\`\`\`json)
- Comillas dobles `"` , no simples `'`

### Los ejercicios no se muestran
- Verificar que `exercises` sea un array
- Cada ejercicio debe tener `id`, `type`, `content`, `interaction`

### Error al guardar
- Verificar espacio en LocalStorage del navegador
- Probar con proyecto más pequeño
- Limpiar datos antiguos

## 📄 Licencia

Proyecto educativo de código abierto - RecuEdu Labs 2026
