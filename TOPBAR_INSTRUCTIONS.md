# RecuEdu Labs - Instrucciones de la Cinta Superior

## Implementación

Para añadir la cinta superior universal a cualquier aplicación de RecuEdu Labs, sigue estos pasos:

### 1. Incluir el CSS

Añade este link en el `<head>` de tu HTML:

```html
<link rel="stylesheet" href="../../assets/css/recuedu-topbar.css">
```

**Nota:** Ajusta la ruta según la ubicación de tu app. Desde `apps/nombre-app/` usa `../../assets/css/recuedu-topbar.css`

### 2. Incluir Font Awesome (si no lo tienes)

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

### 3. Añadir el HTML

Copia este código justo después del `<body>`:

```html
<div class="recuedu-topbar">
    <div class="topbar-container">
        <a href="../../index.html" class="topbar-brand">
            <i class="fa-solid fa-flask-vial"></i>
            <span>RecuEdu Labs</span>
        </a>
        <div class="topbar-links">
            <a href="../../index.html">
                <i class="fa-solid fa-home"></i>
                <span>Inicio</span>
            </a>
            <a href="https://github.com/ravellom" target="_blank">
                <i class="fa-brands fa-github"></i>
            </a>
        </div>
    </div>
</div>
```

**Nota:** Ajusta las rutas según la ubicación de tu app.

### 4. Rutas según ubicación

| Ubicación de la app | Ruta al CSS | Ruta a index.html |
|---------------------|-------------|-------------------|
| `apps/nombre-app/index.html` | `../../assets/css/recuedu-topbar.css` | `../../index.html` |
| `apps/nombre-app/subcarpeta/archivo.html` | `../../../assets/css/recuedu-topbar.css` | `../../../index.html` |

## Ejemplo completo

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi App - RecuEdu Labs</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- RecuEdu Topbar -->
    <link rel="stylesheet" href="../../assets/css/recuedu-topbar.css">
    
    <!-- Tu CSS -->
    <link rel="stylesheet" href="style.css">
</head>
<body>
    
    <!-- RecuEdu Topbar -->
    <div class="recuedu-topbar">
        <div class="topbar-container">
            <a href="../../index.html" class="topbar-brand">
                <i class="fa-solid fa-flask-vial"></i>
                <span>RecuEdu Labs</span>
            </a>
            <div class="topbar-links">
                <a href="../../index.html">
                    <i class="fa-solid fa-home"></i>
                    <span>Inicio</span>
                </a>
                <a href="https://github.com/ravellom" target="_blank">
                    <i class="fa-brands fa-github"></i>
                </a>
            </div>
        </div>
    </div>

    <!-- Contenido de tu aplicación -->
    <div class="app-content">
        <h1>Mi Aplicación</h1>
        <!-- ... -->
    </div>

</body>
</html>
```

## Características

- ✅ Diseño moderno con gradiente
- ✅ Totalmente responsivo
- ✅ No interfiere con el contenido
- ✅ Consistencia visual en todas las apps
- ✅ Enlaces a inicio y GitHub
- ✅ Peso mínimo (~2KB CSS)

## Personalización opcional

Si necesitas ajustar el gradiente o los colores, edita el archivo `assets/css/recuedu-topbar.css`:

```css
.recuedu-topbar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* Cambia estos valores para personalizar el gradiente */
}
```
