# ðŸŽ® EjeVisor - Visor Interactivo de Ejercicios

AplicaciÃ³n gamificada para visualizar y resolver ejercicios generados con **[EjeCon](../ejecon/)**.

## ðŸŒŸ CaracterÃ­sticas Principales

### ðŸŽ¯ Experiencia Gamificada
- **Sistema de puntos XP**: Gana puntos por cada respuesta correcta
- **Rachas (streaks)**: BonificaciÃ³n por respuestas consecutivas correctas
- **Barra de progreso**: Visualiza tu avance en tiempo real
- **Efectos visuales**: Confetti y animaciones en aciertos
- **Feedback inmediato**: RetroalimentaciÃ³n educativa completa

### ðŸŽ¨ 3 Temas Visuales
1. **ðŸŽ¨ Modo Gamer** (por defecto): Colores vibrantes y estilo lÃºdico
2. **ðŸ§˜ Modo Zen**: DiseÃ±o minimalista y relajante
3. **ðŸŒ™ Modo Oscuro**: Pantalla oscura que cuida tus ojos

### ðŸ“š Tipos de Ejercicios Soportados
- âœ… **Multiple Choice** - ElecciÃ³n mÃºltiple
- âœ… **True/False** - Verdadero o Falso
- âœ… **Fill Gaps** - Rellenar huecos
- âœ… **Ordering** - Ordenar secuencias (arrastrables)
- âœ… **Matching** - Emparejar elementos (arrastrables)
- âœ… **Grouping** - Clasificar en categorÃ­as (arrastrables)
- âœ… **Short Answer** - Respuesta corta
- âœ… **Hotspot** - Zonas clicables en imagen
- âœ… **Slider** - Escala numÃ©rica

---

## ðŸš€ CÃ³mo Usar

### 1ï¸âƒ£ Cargar Ejercicios

**OpciÃ³n A: Desde archivo**
1. Clic en la zona de carga o arrastre un archivo `.json`
2. Seleccionar archivo generado con EjeCon
3. Â¡Comenzar a resolver!

**OpciÃ³n B: Ejemplo de prueba**
1. Clic en "Cargar Ejemplo de Prueba"
2. Se cargan ejercicios de demostraciÃ³n
3. Ãšsalo para familiarizarte con la interfaz

### 2ï¸âƒ£ Resolver Ejercicios

1. **Lee el enunciado** en la parte superior
2. **Responde** segÃºn el tipo de ejercicio:
   - ElecciÃ³n: Clic en la opciÃ³n correcta
   - Huecos: Escribe en los espacios
   - Ordenar: Arrastra elementos a su posiciÃ³n
   - Emparejar: Arrastra elementos al lugar correcto
   - Clasificar: Arrastra a la categorÃ­a correspondiente
3. **Comprueba** con el botÃ³n azul
4. **Lee el feedback** con explicaciÃ³n pedagÃ³gica
5. **Siguiente** para continuar

### 3ï¸âƒ£ NavegaciÃ³n

- **â¬…ï¸ Anterior**: Revisar ejercicio previo
- **âž¡ï¸ Siguiente**: Avanzar sin comprobar
- **ðŸ’¡ Ver Pista**: Obtener ayuda (si disponible)
- **ðŸ”„ Nuevo archivo**: Cargar otros ejercicios

---

## ðŸŽ¯ Sistema de PuntuaciÃ³n

### Puntos Base
- **Correcta primera vez**: +100 XP
- **Correcta segundo intento**: +50 XP
- **Tercera vez o mÃ¡s**: +25 XP

### BonificaciÃ³n por Racha
- **2 consecutivas**: +20 XP
- **3 consecutivas**: +30 XP  
- **5 consecutivas**: +50 XP
- **8+ consecutivas**: +100 XP ðŸ”¥

### Penalizaciones
- **Respuesta incorrecta**: Sin puntos
- **Racha rota**: Vuelve a 0

---

## ðŸŽ¨ PersonalizaciÃ³n

### Cambiar Tema
Selector en la esquina superior derecha:
- ðŸŽ¨ Modo Gamer - Colorido y vibrante
- ðŸ§˜ Modo Zen - Minimalista y sereno
- ðŸŒ™ Modo Oscuro - Suave con la vista

### ConfiguraciÃ³n Visual
Cada tema ajusta automÃ¡ticamente:
- Colores de fondo y texto
- Bordes y sombras
- Radios de bordes
- Efectos de hover

---

## ðŸ“ Formato JSON Compatible

EjeVisor usa **el mismo formato que EjeCon**:

```json
{
  "resource_metadata": {
    "title": "TÃ­tulo del recurso",
    "topic": "Tema o asignatura"
  },
  "exercises": [
    {
      "id": "ex_TIMESTAMP_INDEX",
      "type": "tipo_ejercicio",
      "content": {
        "prompt_text": "Enunciado del ejercicio"
      },
      "interaction": {
        // Datos especÃ­ficos del tipo
      },
      "scaffolding": {
        "hint_1": "Pista",
        "explanation": "ExplicaciÃ³n",
        "learn_more": "Contenido ampliado"
      }
    }
  ]
}
```

---

## ðŸ”— IntegraciÃ³n con EjeCon

### Flujo de Trabajo Completo

```
EjeCon (CreaciÃ³n)          EjeVisor (PrÃ¡ctica)
      â†“                           â†“
1. Genera con IA          4. Carga JSON
2. Edita ejercicios       5. Resuelve ejercicios
3. Exporta JSON    â†’      6. Aprende con feedback
```

### Compatibilidad Total
- âœ… Misma estructura JSON
- âœ… Mismo schema de validaciÃ³n
- âœ… Mismos 9 tipos de ejercicios activos en EjeCon
- âœ… Mismo scaffolding DUA

---

## ðŸ› ï¸ CaracterÃ­sticas TÃ©cnicas

### TecnologÃ­as
- **Vanilla JavaScript** (sin frameworks)
- **SortableJS** para drag & drop
- **Canvas Confetti** para efectos visuales
- **Phosphor Icons** para iconografÃ­a
- **CSS Variables** para temas dinÃ¡micos

### Arquitectura
- **SPA** (Single Page Application)
- **3 pantallas**: Upload, Game, Results
- **Estado global** con objeto `state`
- **Renderizado dinÃ¡mico** segÃºn tipo

### Renderizadores EspecÃ­ficos
Cada tipo de ejercicio tiene su propio renderizador:
- `renderMultipleChoice()` / `renderTrueFalse()`
- `renderFillGaps()`
- `renderOrdering()` con SortableJS
- `renderMatching()` con drag & drop
- `renderGrouping()` con drop zones
- `renderShortAnswer()`
- `renderHotspot()`
- `renderSlider()`

### Validadores
- `checkMultipleChoice()` - Compara ID seleccionado
- `checkFillGaps()` - Normaliza y compara texto
- `checkOrdering()` - Verifica orden correcto
- `checkMatching()` - Valida parejas
- `checkGrouping()` - Comprueba categorÃ­as

---

## ðŸ“š Scaffolding DUA Implementado

### hint_1 (Pista)
- BotÃ³n "ðŸ’¡ Ver Pista" (se habilita tras 1er intento fallido)
- Muestra ayuda sin revelar la respuesta
- DiseÃ±ada pedagÃ³gicamente

### explanation (ExplicaciÃ³n)
- Se muestra en el modal de feedback
- Explica el **por quÃ©** de la respuesta correcta
- Refuerza el aprendizaje conceptual

### learn_more (Ampliar)
- Contenido adicional opcional
- Ejemplos, curiosidades, contexto
- ProfundizaciÃ³n para estudiantes interesados

---

## ðŸŽ“ Uso Educativo

### Para Estudiantes
- **AutoevaluaciÃ³n**: Practica a tu ritmo
- **Feedback inmediato**: Aprende de errores
- **GamificaciÃ³n**: MotivaciÃ³n por puntos/rachas
- **Variedad**: Diferentes tipos de interacciÃ³n

### Para Docentes
- **FÃ¡cil distribuciÃ³n**: Comparte archivo JSON
- **Sin instalaciÃ³n**: Solo navegador web
- **Tracking visual**: Estudiante ve su progreso
- **VersÃ¡til**: Funciona en PC, tablet, mÃ³vil

### Para Contenidistas
- **PrevisualizaciÃ³n**: Prueba ejercicios antes de publicar
- **QA rÃ¡pido**: Identifica problemas de diseÃ±o
- **Sin backend**: Funciona offline con archivos locales

---

## ðŸ› SoluciÃ³n de Problemas

### No carga el archivo JSON
- âœ… Verifica que sea JSON vÃ¡lido
- âœ… Comprueba que tenga campo `exercises`
- âœ… Revisa la consola del navegador (F12)

### Drag & drop no funciona
- âœ… Solo en ejercicios ordering, matching, grouping
- âœ… Usa navegador moderno (Chrome, Firefox, Edge)
- âœ… Verifica que SortableJS estÃ© cargado

### Los ejercicios no se muestran bien
- âœ… Verifica estructura del JSON
- âœ… Comprueba campo `interaction` segÃºn tipo
- âœ… Usa ejemplo.json como referencia

---

## ðŸ“„ Archivos del Proyecto

```
eduxai-visor/
â”œâ”€â”€ index.html          # Interfaz principal (con topbar RecuEdu)
â”œâ”€â”€ visor.html          # VersiÃ³n standalone (sin topbar)
â”œâ”€â”€ visor.js            # LÃ³gica principal
â”œâ”€â”€ visor.css           # Estilos y temas
â”œâ”€â”€ ejemplo.json        # Ejercicios de demostraciÃ³n
â””â”€â”€ README.md           # Esta documentaciÃ³n
```

---

## ðŸ”— Enlaces Relacionados

- **[EjeCon](../ejecon/)** - Crea ejercicios con IA
- **[RecuEdu Labs](../../)** - MÃ¡s herramientas educativas
- **[GitHub](https://github.com/ravellom)** - Repositorio del proyecto

---

## ðŸ“ Notas de VersiÃ³n

### v1.0.0 (Febrero 2026)
- âœ… Compatibilidad total con EjeCon
- âœ… CorrecciÃ³n problema topbar
- âœ… BotÃ³n "Cargar Ejemplo"
- âœ… 9 tipos de ejercicios soportados
- âœ… 3 temas visuales
- âœ… Sistema de gamificaciÃ³n completo
- âœ… DocumentaciÃ³n completa

---

**Desarrollado por**: RecuEdu Labs  
**Licencia**: Open Source Educativo  
**Ãšltima actualizaciÃ³n**: Febrero 5, 2026

