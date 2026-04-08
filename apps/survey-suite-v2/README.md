# Survey Suite V2

Suite integrada en cliente para flujo de encuestas: procesamiento, Likert y distribución.

## Desarrollo local

```bash
cd apps/survey-suite-v2
npm install
npm run dev
```

## Estado actual

- Shell base + navegación interna.
- Store global + event bus tipado.
- Persistencia de estado V2 en localStorage.
- Módulos iniciales conectados (`processor`, `likert`, `distribution`).