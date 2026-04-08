# AGENTS - Survey Suite V2

## Objetivo
Construir una suite integrada client-side para procesamiento y visualización de encuestas con arquitectura modular y mantenible.

## Reglas de arquitectura
1. No usar `iframe` para comunicación entre módulos internos.
2. Toda comunicación entre módulos pasa por `store` + `event bus`.
3. Prohibido acceso directo a `localStorage` fuera de `src/app/state/persistence.ts`.
4. Lógica reusable debe vivir fuera de `features/*` (mover a `shared` o `core` cuando aplique).

## Convenciones
1. TypeScript estricto; evitar `any`.
2. Eventos tipados en `src/shared/events/bus.ts`.
3. Estado tipado en `src/shared/types/state.ts`.
4. UI por módulo en `src/features/<module>/view.ts`.

## Calidad mínima por PR
1. Compila sin errores TypeScript.
2. No warnings críticos en consola durante flujo principal.
3. Mantener estilo de código y naming consistente.
4. Actualizar README si cambia comportamiento visible.

## Alcance MVP actual
1. Shell integrado.
2. Store/event bus/persistencia.
3. Processor, Likert y Distribution con integración de dataset activo.
4. Evolución incremental hacia paridad de V1.