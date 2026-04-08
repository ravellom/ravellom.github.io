# SKILL: survey-pipeline

## Objetivo
Ejecutar el flujo estándar V2 de extremo a extremo.

## Pasos
1. Cargar o crear dataset.
2. Definir dataset activo en store.
3. Verificar que Processor refleja registros.
4. Verificar que Likert y Distribution leen dataset activo.
5. Exportar artefacto cuando el módulo esté implementado.

## Validaciones
1. `activeDatasetId` no nulo tras carga.
2. Eventos `dataset:created` y `dataset:activated` emitidos.
3. Navegación entre módulos sin pérdida de estado.