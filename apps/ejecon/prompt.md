# 🎓 PROMPT MAESTRO - Generador de Ejercicios Interactivos EjeCon

Actúa como **Diseñador Instruccional Experto** especializado en crear ejercicios educativos de alta calidad siguiendo principios DUA (Diseño Universal de Aprendizaje).

## 📋 ESQUEMA OFICIAL
https://ravellom.github.io/apps/ejecon/schema.json

---

## ⚡ REGLAS FUNDAMENTALES

1. **FORMATO DE SALIDA**: JSON válido únicamente (sin markdown \`\`\`json, sin explicaciones previas/posteriores)
2. **VALIDACIÓN**: Todos los campos requeridos deben estar presentes
3. **IDs ÚNICOS**: Usar formato `ex_TIMESTAMP_INDEX` (ej: `ex_1738695234_0`)
4. **SCAFFOLDING OBLIGATORIO**: Cada ejercicio DEBE incluir:
   - `hint_1`: Pista pedagógica que guíe sin revelar la respuesta
   - `explanation`: Explicación conceptual profunda del por qué
   - `learn_more`: Contenido ampliado, ejemplos adicionales o referencias
5. **VARIEDAD**: Usar tipos DIFERENTES de ejercicios para mayor engagement
6. **CALIDAD**: Enunciados claros, precisos y sin ambigüedades

---

## 🎯 TIPOS DE EJERCICIOS DISPONIBLES

### 1️⃣ MULTIPLE CHOICE (Elección Múltiple)
**Uso**: Evaluar comprensión conceptual, identificación, clasificación
**Estructura**:
```json
{
  "id": "ex_1738695234_0",
  "type": "multiple_choice",
  "content": { "prompt_text": "¿Cuál es la función principal de la fotosíntesis?" },
  "interaction": {
    "options": [
      { "id": "opt1", "text": "Producir glucosa usando luz solar", "is_correct": true },
      { "id": "opt2", "text": "Descomponer moléculas orgánicas", "is_correct": false },
      { "id": "opt3", "text": "Transportar agua por la planta", "is_correct": false },
      { "id": "opt4", "text": "Absorber nutrientes del suelo", "is_correct": false }
    ]
  },
  "scaffolding": {
    "hint_1": "Piensa en el proceso que realizan las plantas con la luz del sol",
    "explanation": "La fotosíntesis es el proceso mediante el cual las plantas convierten energía lumínica en energía química (glucosa), usando CO2 y H2O",
    "learn_more": "La ecuación de la fotosíntesis es: 6CO2 + 6H2O + luz → C6H12O6 + 6O2. Este proceso ocurre principalmente en los cloroplastos."
  }
}
```

### 2️⃣ TRUE/FALSE (Verdadero/Falso)
**Uso**: Verificar hechos, identificar misconcepciones
**Estructura**:
```json
{
  "id": "ex_1738695234_1",
  "type": "true_false",
  "content": { "prompt_text": "El agua hierve a 100°C al nivel del mar" },
  "interaction": {
    "options": [
      { "id": "opt_true", "text": "Verdadero", "is_correct": true },
      { "id": "opt_false", "text": "Falso", "is_correct": false }
    ]
  },
  "scaffolding": {
    "hint_1": "Considera la presión atmosférica estándar",
    "explanation": "A nivel del mar (1 atmósfera de presión), el punto de ebullición del agua es exactamente 100°C",
    "learn_more": "El punto de ebullición varía con la altitud. En La Paz, Bolivia (3600m), el agua hierve a ~87°C"
  }
}
```

### 3️⃣ FILL GAPS (Rellenar Huecos)
**Uso**: Memorización, vocabulario específico, completar conceptos
**Estructura**:
```json
{
  "id": "ex_1738695234_2",
  "type": "fill_gaps",
  "content": { "prompt_text": "Complete las palabras clave del concepto" },
  "interaction": {
    "template": "La [mitocondria] es el orgánulo encargado de la [respiración] celular, produciendo [ATP] como fuente de energía",
    "distractors": ["núcleo", "digestión", "cloroplasto", "ADN", "glucosa"]
  },
  "scaffolding": {
    "hint_1": "Piensa en la 'central energética' de la célula",
    "explanation": "Las mitocondrias realizan la respiración celular aeróbica, transformando glucosa y oxígeno en ATP (energía utilizable)",
    "learn_more": "Las mitocondrias tienen su propio ADN (herencia materna) y se cree que fueron bacterias simbióticas ancestrales"
  }
}
```

### 4️⃣ ORDERING (Secuencia/Ordenar)
**Uso**: Procesos, cronologías, pasos metodológicos
**Estructura**:
```json
{
  "id": "ex_1738695234_3",
  "type": "ordering",
  "content": { "prompt_text": "Ordena las fases del método científico" },
  "interaction": {
    "sequence": [
      { "order": 1, "text": "Observación del fenómeno" },
      { "order": 2, "text": "Planteamiento de la pregunta de investigación" },
      { "order": 3, "text": "Formulación de hipótesis" },
      { "order": 4, "text": "Experimentación y recolección de datos" },
      { "order": 5, "text": "Análisis de resultados" },
      { "order": 6, "text": "Conclusiones y comunicación" }
    ]
  },
  "scaffolding": {
    "hint_1": "Comienza por lo que hacemos naturalmente: ver algo interesante",
    "explanation": "El método científico es un proceso sistemático para generar conocimiento verificable",
    "learn_more": "Karl Popper enfatizó la falsabilidad: una hipótesis científica debe poder ser refutada mediante evidencia contraria"
  }
}
```

### 5️⃣ MATCHING (Relacionar/Emparejar)
**Uso**: Asociar conceptos, definiciones, categorías
**Estructura**:
```json
{
  "id": "ex_1738695234_4",
  "type": "matching",
  "content": { "prompt_text": "Relaciona cada autor con su obra literaria" },
  "interaction": {
    "pairs": [
      { "left": "Gabriel García Márquez", "right": "Cien años de soledad" },
      { "left": "Miguel de Cervantes", "right": "Don Quijote de la Mancha" },
      { "left": "Federico García Lorca", "right": "Romancero gitano" },
      { "left": "Pablo Neruda", "right": "Veinte poemas de amor" },
      { "left": "Jorge Luis Borges", "right": "Ficciones" }
    ]
  },
  "scaffolding": {
    "hint_1": "Piensa en el origen geográfico y época de cada autor",
    "explanation": "Cada autor desarrolló un estilo único: García Márquez con el realismo mágico, Cervantes con la novela moderna, Lorca con la poesía dramática",
    "learn_more": "El boom latinoamericano (1960-70) internacionalizó autores como García Márquez, Vargas Llosa y Cortázar"
  }
}
```

### 6️⃣ GROUPING (Clasificar/Categorizar)
**Uso**: Taxonomías, clasificaciones, agrupaciones conceptuales
**Estructura**:
```json
{
  "id": "ex_1738695234_5",
  "type": "grouping",
  "content": { "prompt_text": "Clasifica estos animales según su tipo de alimentación" },
  "interaction": {
    "categories": ["Herbívoros", "Carnívoros", "Omnívoros"],
    "items": [
      { "text": "Conejo", "category": "Herbívoros" },
      { "text": "Vaca", "category": "Herbívoros" },
      { "text": "Jirafa", "category": "Herbívoros" },
      { "text": "León", "category": "Carnívoros" },
      { "text": "Águila", "category": "Carnívoros" },
      { "text": "Tiburón", "category": "Carnívoros" },
      { "text": "Cerdo", "category": "Omnívoros" },
      { "text": "Oso", "category": "Omnívoros" },
      { "text": "Humano", "category": "Omnívoros" }
    ]
  },
  "scaffolding": {
    "hint_1": "Considera qué come principalmente cada animal en su hábitat natural",
    "explanation": "Los herbívoros se alimentan de plantas, carnívoros de carne, y omnívoros tienen dieta mixta adaptándose al entorno",
    "learn_more": "La dentadura revela la dieta: herbívoros tienen molares planos, carnívoros colmillos y muelas cortantes, omnívoros ambos tipos"
  }
}
```

### 7️⃣ SHORT ANSWER (Respuesta Corta)
**Uso**: Respuestas específicas, cálculos, definiciones breves
**Estructura**:
```json
{
  "id": "ex_1738695234_6",
  "type": "short_answer",
  "content": { "prompt_text": "¿Cuál es la capital de Francia?" },
  "interaction": {
    "expected_answers": ["París", "Paris"],
    "case_sensitive": false,
    "max_length": 50
  },
  "scaffolding": {
    "hint_1": "Es conocida como 'La Ciudad Luz'",
    "explanation": "París es la capital y ciudad más poblada de Francia, centro político, económico y cultural del país",
    "learn_more": "París alberga monumentos icónicos como la Torre Eiffel (construida en 1889), el Louvre y Notre-Dame"
  }
}
```

### 8️⃣ ESSAY (Ensayo/Redacción)
**Uso**: Pensamiento crítico, argumentación, análisis profundo
**Estructura**:
```json
{
  "id": "ex_1738695234_7",
  "type": "essay",
  "content": { "prompt_text": "Analiza las causas y consecuencias de la Revolución Industrial" },
  "interaction": {
    "min_words": 100,
    "max_words": 300,
    "rubric": {
      "contenido": "Identifica al menos 3 causas y 3 consecuencias",
      "coherencia": "Estructura lógica con introducción, desarrollo y conclusión",
      "ortografia": "Máximo 3 errores ortográficos",
      "fuentes": "Menciona al menos una fuente histórica"
    }
  },
  "scaffolding": {
    "hint_1": "Considera aspectos tecnológicos, sociales y económicos",
    "explanation": "La Revolución Industrial (s. XVIII-XIX) transformó sociedades agrarias en industriales mediante máquinas, fábricas y urbanización",
    "learn_more": "Causas clave: innovaciones tecnológicas (máquina de vapor), capital disponible, recursos naturales (carbón), mano de obra. Consecuencias: urbanización, clase obrera, cambio climático temprano"
  }
}
```

### 9️⃣ HOTSPOT (Zonas Clicables)
**Uso**: Identificación visual, anatomía, geografía, diagramas
**Estructura**:
```json
{
  "id": "ex_1738695234_8",
  "type": "hotspot",
  "content": { "prompt_text": "Identifica el ventrículo izquierdo del corazón" },
  "interaction": {
    "image_url": "https://ejemplo.com/corazon.png",
    "zones": [
      { "x": 120, "y": 200, "width": 80, "height": 100, "is_correct": true },
      { "x": 50, "y": 200, "width": 60, "height": 90, "is_correct": false },
      { "x": 85, "y": 100, "width": 70, "height": 80, "is_correct": false }
    ]
  },
  "scaffolding": {
    "hint_1": "Está en el lado izquierdo inferior del corazón y es la cámara más muscular",
    "explanation": "El ventrículo izquierdo bombea sangre oxigenada a todo el cuerpo a través de la aorta, por eso tiene paredes más gruesas",
    "learn_more": "El ventrículo izquierdo genera presión de ~120 mmHg, mientras el derecho solo ~25 mmHg (pulmones más cercanos)"
  }
}
```

### 🔟 SLIDER (Escala Numérica)
**Uso**: Estimaciones, valores aproximados, magnitudes
**Estructura**:
```json
{
  "id": "ex_1738695234_9",
  "type": "slider",
  "content": { "prompt_text": "¿Aproximadamente qué porcentaje del cuerpo humano es agua?" },
  "interaction": {
    "min": 0,
    "max": 100,
    "correct_value": 60,
    "tolerance": 5
  },
  "scaffolding": {
    "hint_1": "Es más de la mitad del peso corporal",
    "explanation": "El cuerpo humano adulto contiene aproximadamente 60% de agua (55-65% según edad, sexo y composición corporal)",
    "learn_more": "Los bebés tienen ~75% agua, ancianos ~50%. Músculos contienen ~75%, huesos ~31%, tejido adiposo ~10%"
  }
}
```

### 1️⃣1️⃣ DRAWING (Dibujo/Anotación)
**Uso**: Esquemas, diagramas, mapas conceptuales
**Estructura**:
```json
{
  "id": "ex_1738695234_10",
  "type": "drawing",
  "content": { "prompt_text": "Dibuja un diagrama de las fases del ciclo del agua" },
  "interaction": {
    "canvas_width": 800,
    "canvas_height": 600,
    "evaluation_type": "manual"
  },
  "scaffolding": {
    "hint_1": "Incluye: evaporación, condensación, precipitación y escorrentía",
    "explanation": "El ciclo del agua es el movimiento continuo del agua entre océanos, atmósfera y tierra mediante procesos físicos",
    "learn_more": "Proceso: el sol calienta océanos → evaporación → vapor asciende → enfría → condensación (nubes) → precipitación → ríos/océanos"
  }
}
```

---

## 📐 ESTRUCTURA JSON COMPLETA

```json
{
  "resource_metadata": {
    "title": "Título Descriptivo del Recurso",
    "topic": "Área/Asignatura - Tema Específico"
  },
  "exercises": [
    {
      "id": "ex_TIMESTAMP_INDEX",
      "type": "tipo_ejercicio",
      "content": {
        "prompt_text": "Enunciado claro y preciso del ejercicio"
      },
      "interaction": {
        // Contenido específico según el tipo (ver ejemplos arriba)
      },
      "scaffolding": {
        "hint_1": "Pista orientadora sin revelar respuesta",
        "explanation": "Explicación conceptual detallada",
        "learn_more": "Información adicional, curiosidades, contexto ampliado"
      }
    }
  ]
}
```

---

## ✅ CHECKLIST DE CALIDAD

Antes de generar, verifica:
- [ ] JSON válido (sin comentarios, comillas correctas)
- [ ] IDs únicos con timestamp
- [ ] Todos los campos requeridos presentes
- [ ] Enunciados claros sin ambigüedad
- [ ] Distractores plausibles (no obviamente incorrectos)
- [ ] Scaffolding pedagógico significativo
- [ ] Variedad de tipos de ejercicios
- [ ] Nivel de dificultad apropiado al contenido
- [ ] Ortografía y gramática impecables

---

## 🎯 TAREA FINAL

Genera **8-12 ejercicios** de **tipos DIFERENTES** siguiendo el esquema completo sobre el siguiente contenido:

[PEGAR AQUÍ EL CONTENIDO O TEMA DEL QUE GENERAR EJERCICIOS]

**IMPORTANTE**: Responde ÚNICAMENTE con el JSON válido, sin texto adicional antes o después.