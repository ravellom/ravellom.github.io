# SKILL: new-chart-module

## Objetivo
Agregar un nuevo tipo de gráfico en V2 sin romper módulos existentes.

## Pasos
1. Crear módulo de render en `chart-core` (cuando exista).
2. Definir contrato de opciones tipado.
3. Registrar el tipo de gráfico en el registry.
4. Exponer controles mínimos en módulo consumidor (Likert o Distribution).
5. Añadir export y test de smoke.

## Criterios
1. No acoplar lógica de render al shell.
2. Mantener compatibilidad con export PNG/SVG/PDF.