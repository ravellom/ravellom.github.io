# 📁 Estructura de Archivos - EjeVisor

## ✅ Archivos Principales (USAR ESTOS)

### HTML
- **`index.html`** ✨ **USAR ESTE**
  - Versión completa con topbar de RecuEdu Labs
  - Para integración en el sitio principal
  - Incluye navegación a otras apps

- **`visor.html`** 🔧 Versión standalone
  - Sin topbar
  - Para uso independiente o embeber
  - Más compacta

### JavaScript
- **`visor.js`** ✨ **USAR ESTE**  
  - Código principal estable y probado
  - Todas las funcionalidades implementadas
  - Compatibilidad total con EjeCon

### CSS
- **`visor.css`** ✨ **USAR ESTE**
  - Estilos principales
  - 3 temas incluidos
  - Responsive y optimizado

### JSON
- **`ejemplo.json`** ✨ **USAR ESTE**
  - 6 ejercicios de demostración
  - Variedad de tipos (multiple_choice, true_false, fill_gaps, ordering, matching, grouping)
  - Compatible con formato EjeCon

### Documentación
- **`README.md`** 📚
  - Documentación completa
  - Guía de uso
  - Características técnicas

---

## ⚠️ Archivos Legacy (NO USAR)

Estos archivos son versiones antiguas o experimentales. **No eliminar** (por si se necesita referencia), pero **no usar en producción**.

### JavaScript Legacy
- **`visor_backup.js`**
  - Backup de versión anterior
  - Mantener solo como respaldo histórico

- **`visor_broken.js`**
  - Versión con bugs conocidos
  - Para debugging o comparación

- **`visor_new.js`**
  - Versión experimental
  - Features no completadas

### Razón para Mantenerlos
- Histórico de desarrollo
- Referencia de código antiguo
- Comparación de versiones
- Recuperación en caso de regresión

---

## 📊 Decisión de Archivos por Escenario

### Escenario 1: Integración en RecuEdu Labs
```
Usar: index.html + visor.js + visor.css + ejemplo.json
```
✅ Topbar incluido  
✅ Navegación completa  
✅ Estilo consistente con otras apps

### Escenario 2: Uso Standalone
```
Usar: visor.html + visor.js + visor.css + ejemplo.json
```
✅ Sin dependencias externas del sitio  
✅ Embeber en otras páginas  
✅ Distribución independiente

### Escenario 3: Desarrollo/Testing
```
Usar: index.html o visor.html + visor.js + visor.css
```
✅ Hot reload en navegador  
✅ Console.log para debugging  
✅ Cargar ejemplo.json para pruebas

---

## 🔗 Dependencias Externas (CDN)

### Requeridas
- **SortableJS** (1.15.0+) - Drag & drop para ordering/matching/grouping
- **Canvas Confetti** (1.6.0+) - Efectos visuales de celebración
- **Phosphor Icons** - Iconografía moderna
- **Font Awesome** (6.4.0+) - Iconos adicionales

### Opcionales
- **Nunito Font** (Google Fonts) - Tipografía principal

---

## 📝 Notas de Migración

Si estás actualizando desde versión anterior:

1. ✅ Respaldar datos de usuario (localStorage)
2. ✅ Reemplazar archivos con versiones actuales
3. ✅ Verificar que `visor.js` sea la versión correcta
4. ✅ Probar con `ejemplo.json` primero
5. ✅ Validar compatibilidad con archivos JSON existentes

---

## 🗑️ ¿Puedo Eliminar los Archivos Legacy?

**Sí**, pero **no es recomendable** en este momento porque:
- 📚 Sirven como referencia histórica
- 🔍 Útiles para debugging comparativo
- ⏮️ Permitir rollback si hay problemas
- 📦 Ocupan poco espacio (~50KB total)

**Si decides eliminarlos**, asegúrate de:
1. ✅ Tener backup en Git
2. ✅ Documentar cambios importantes que tenían
3. ✅ Probar exhaustivamente la versión actual

---

## 🎯 Recomendación Final

### Para Usuarios Finales
```
index.html
```

### Para Desarrolladores
```
Todos los archivos (incluyendo legacy para referencia)
```

### Para Producción/Deploy
```
index.html + visor.html + visor.js + visor.css + ejemplo.json + README.md
```

---

**Última actualización**: Febrero 5, 2026  
**Versión actual**: 1.0.0
