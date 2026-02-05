# 📘 Guía Rápida de Uso - EjeCon

## 🎯 Inicio Rápido (3 pasos)

### 1️⃣ Generar Ejercicios con IA
1. Clic en **"Obtener Prompt Maestro"**
2. Copiar todo el texto del modal (Ctrl+A → Ctrl+C)
3. Pegar en ChatGPT, Claude o tu IA favorita
4. Reemplazar `[PEGAR CONTENIDO AQUÍ]` con tu tema (ej: "La fotosíntesis")
5. Copiar el JSON que genera la IA

### 2️⃣ Importar a EjeCon
1. Pegar el JSON en el área de texto del panel lateral
2. Clic en **"Procesar Texto"**
3. ¡Listo! Los ejercicios aparecen como tarjetas editables

### 3️⃣ Editar y Exportar
1. Editar cualquier texto haciendo clic sobre él
2. Vista previa con el icono de ojo 👁️
3. Aprobar ejercicios con el botón verde
4. Exportar como JSON o HTML

---

## 🔧 Funciones Principales

### 📝 Edición Inline
- **Enunciados**: Clic en el texto para editarlo
- **Pistas**: Editar directamente en la tarjeta
- **Explicaciones**: Personalizar para tus estudiantes
- **Guarda automáticamente** cada cambio

### 🎨 Tipos de Ejercicios

| Tipo | Cuándo usar | Ejemplo |
|------|-------------|---------|
| **Multiple Choice** | Evaluar comprensión conceptual | ¿Cuál es la capital de Francia? |
| **True/False** | Verificar hechos rápidamente | El agua hierve a 100°C (V/F) |
| **Fill Gaps** | Vocabulario y términos clave | La [mitocondria] produce [ATP] |
| **Ordering** | Secuencias y procesos | Ordena las fases de la mitosis |
| **Matching** | Relacionar conceptos | Autores ↔ Obras literarias |
| **Grouping** | Clasificaciones | Animales: herbívoros/carnívoros |
| **Short Answer** | Respuestas específicas | ¿En qué año...? |
| **Hotspot** | Identificación visual | Señala el ventrículo izquierdo |
| **Slider** | Valores aproximados | ¿Qué % del cuerpo es agua? |

### 🔍 Buscar y Filtrar
- **Buscar**: Escribe palabras del enunciado
- **Filtrar**: Selecciona un tipo específico
- **Combinar**: Busca "célula" + filtro "multiple_choice"

### 💾 Guardar y Cargar
- **Autoguardado**: Cada cambio se guarda automáticamente
- **Proyectos**: Guarda múltiples proyectos con nombres diferentes
- **Undo/Redo**: Deshaz hasta 50 cambios (Ctrl+Z / Ctrl+Shift+Z)

### 📤 Exportar

#### Como JSON
- Formato estándar
- Compartir con colegas
- Reutilizar en otros sistemas
- Editar manualmente si necesario

#### Como HTML
- Página web completa y autónoma
- Sin dependencias externas
- Listo para imprimir
- Compartir por email o web

### ⌨️ Atajos de Teclado
- `Ctrl + S` → Guardar proyecto
- `Ctrl + O` → Abrir archivo JSON
- `ESC` → Cerrar modal
- `Ctrl + A` → Seleccionar todo (en modal)

---

## 💡 Consejos y Buenas Prácticas

### ✅ Para mejores resultados con IA

**Prompt específico y detallado:**
```
Genera ejercicios sobre: "El ciclo del agua en la naturaleza, 
para estudiantes de 5º de primaria, enfocado en las fases de 
evaporación, condensación y precipitación"
```

**En lugar de genérico:**
```
Genera ejercicios sobre el agua
```

### ✅ Al editar ejercicios

1. **Enunciados claros**: Sin ambigüedades
2. **Opciones plausibles**: Distractores creíbles
3. **Pistas útiles**: Que guíen sin revelar
4. **Explicaciones pedagógicas**: No solo "respuesta correcta"
5. **Contenido ampliado**: Curiosidades, contexto, profundización

### ✅ Scaffolding de calidad

**❌ Mal:**
- Hint: "Piensa bien"
- Explanation: "La respuesta es A"
- Learn More: "Busca en Google"

**✅ Bien:**
- Hint: "Recuerda que los herbívoros tienen dientes planos"
- Explanation: "Los herbívoros necesitan molares para triturar plantas fibrosas"
- Learn More: "Las jirafas tienen lenguas de hasta 50cm para alcanzar hojas altas"

---

## 🐛 Solucionar Problemas Comunes

### "No se carga mi JSON"
✔️ **Verifica:**
- Que sea JSON válido (usa JSONLint.com)
- Sin bloques \`\`\`json de markdown
- Comillas dobles `"`, no simples `'`
- Sin comas finales extras

### "Los ejercicios se ven cortados"
✔️ **Haz scroll** en el panel principal
✔️ Reduce el zoom del navegador (Ctrl + rueda)

### "Perdí mis cambios"
✔️ EjeCon **guarda automáticamente** en tu navegador
✔️ Busca en "Seleccionar proyecto..."
✔️ O verifica localStorage (F12 → Application → Local Storage)

### "El drag & drop no funciona"
✔️ Solo funciona en ejercicios tipo **"ordering"**
✔️ Arrastra por el ícono de puntos ⋮⋮
✔️ Suelta sobre otro elemento de la secuencia

---

## 🎓 Flujos de Trabajo Recomendados

### Para Docentes
1. Prepara tu contenido didáctico
2. Usa Prompt Maestro para generar base
3. Revisa y personaliza cada ejercicio
4. Aprueba los ejercicios listos
5. Exporta HTML para compartir con estudiantes
6. Guarda JSON para futuras ediciones

### Para Contenidistas
1. Define objetivos de aprendizaje
2. Genera múltiples versiones con IA
3. Fusiona los mejores ejercicios
4. Estandariza scaffolding
5. Exporta JSON para integrar en LMS

### Para Estudiantes
1. Identifica tus dificultades en un tema
2. Genera ejercicios personalizados
3. Practica con vista previa
4. Revisa explicaciones cuando falles
5. Amplía conocimiento con "Learn More"

---

## 🔗 Recursos Adicionales

- **Schema JSON completo**: `schema.json`
- **Ejemplos detallados**: `prompt.md`
- **Documentación técnica**: `README.md`
- **RecuEdu Labs**: [ravellom.github.io](https://ravellom.github.io)

---

## 📞 ¿Necesitas ayuda?

Si encuentras errores o tienes sugerencias:
1. Verifica la consola del navegador (F12)
2. Revisa que tu JSON cumpla el schema
3. Prueba con el ejemplo del prompt maestro
4. Reporta en GitHub: ravellom/ravellom.github.io

---

**Versión 1.0** | Actualizado: Febrero 2026 | RecuEdu Labs
