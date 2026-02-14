# Exe Builder XAI

Aplicación nueva para diseñar sets de ejercicios con trazabilidad de **Explainable AI (XAI)** por ejercicio, con flujo **IA-first** y editor visual para docentes.

## Objetivo

- Definir un contrato JSON XAI robusto y reutilizable.
- Generar automáticamente sets desde IA usando API Key + contenido base.
- Permitir revisar y editar cada ejercicio y su bloque XAI sin trabajar directo sobre JSON.
- Validar criterios mínimos de explicabilidad antes de exportar o publicar.
- Preparar una arquitectura modular para integrar edición y analítica posterior.

## Estructura modular

- `app.js`: orquestación principal.
- `core/state.js`: estado observable de la app.
- `core/validators.js`: validaciones mínimas XAI.
- `i18n/`: internacionalización base (`es`, `en`).
- `ui/`: acceso DOM y render desacoplado.
- `schema/xai-exercise-schema.json`: contrato oficial XAI v2 (`xai-exercises/2.0.0`).
- `examples/example-xai.js`: dataset de prueba.
- `services/ai-contract.js`: contrato para prompts/generación IA.
- `services/prompt-builder.js`: constructor de prompt estricto para salida XAI.
- `services/gemini.js`: cliente Gemini modular para generación JSON.
- `services/file-import.js`: importador de resúmenes (`txt`, `md`, `json`, `docx`, `doc`).
- `ui/exercise-editor.js`: explorador y editor visual por ejercicio.

## Validaciones mínimas incluidas (MVP)

1. Presencia de bloque `xai` por ejercicio.
2. Trazabilidad mínima (`source_refs`, `prompt_id`).
3. Coherencia pedagógica (`learning_objective`, `competency`, `bloom_level`, `difficulty_level`).
4. Justificación mínima (`why_this_exercise`, `why_this_content` con longitud suficiente).
5. Incertidumbre explícita (`confidence` en [0,1] y `limitations`).
6. Contrafactual obligatorio (`condition`, `expected_change`).
7. Supervisión humana obligatoria (`human_oversight.review_protocol`, `teacher_action_on_risk`, `override_policy`).
8. Calidad de explicación obligatoria (`quality_of_explanation.target_audience`, `clarity_level`, `actionable_feedback`, `adaptation_notes`).
9. Control de calidad por lote (fallo si >20% incumple criterios críticos).

## Flujo actual

1. Ingresar API Key de Gemini.
2. Pegar contenido o subir resumen (`.txt`, `.md`, `.json`, `.docx`, `.doc`).
3. Generar set con IA.
4. Revisar/editar por ejercicio los campos clave de XAI en el explorador.
5. Validación XAI automática + JSON técnico opcional.

## Próximos pasos sugeridos

- Añadir editor visual por bloques para el nodo `xai`.
- Conectar previsualización de ejercicio usando `../eje-shared/exercise-engine.js`.
- Exportar informe XAI docente (resumen + auditoría).
