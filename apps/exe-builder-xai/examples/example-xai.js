const exampleXaiBundle = {
    schema_version: 'xai-exercises/2.0.0',
    resource_metadata: {
        title: 'Causa y efecto en Ciencias',
        topic: 'Ciencias Naturales',
        grade_level: '7mo básico',
        language: 'es'
    },
    generation_context: {
        audience: 'Estudiantes de 12-13 años',
        pedagogical_goal: 'Analizar relaciones de causa y efecto en fenómenos cotidianos.',
        constraints: ['Lenguaje claro', 'Sin tecnicismos innecesarios'],
        source_material_refs: ['curriculum:CN7:OA03', 'doc:aula:unidad2']
    },
    exercises: [
        {
            id: 'ex_20260213_1',
            type: 'multiple_choice',
            content: {
                prompt_text: '¿Cuál es la causa más probable del aumento de algas en una laguna cercana?'
            },
            interaction: {
                options: [
                    { id: 'o1', text: 'Exceso de nutrientes por fertilizantes', is_correct: true },
                    { id: 'o2', text: 'Disminución de luz solar', is_correct: false },
                    { id: 'o3', text: 'Menor temperatura del agua', is_correct: false }
                ]
            },
            scaffolding: {
                hint_1: 'Piensa en actividades humanas alrededor de la laguna.',
                explanation: 'El exceso de nutrientes favorece el crecimiento acelerado de algas.',
                learn_more: 'Revisa el concepto de eutrofización y sus impactos ambientales.'
            },
            xai: {
                why_this_exercise: 'Se eligió este ejercicio porque evalúa razonamiento causal aplicado a un contexto local cercano al estudiante, favoreciendo transferencia conceptual realista.',
                pedagogical_alignment: {
                    learning_objective: 'Identificar causas de cambios en ecosistemas acuáticos.',
                    competency: 'Pensamiento crítico científico',
                    bloom_level: 'analizar',
                    difficulty_level: 'medio'
                },
                content_selection: {
                    why_this_content: 'El caso de la laguna conecta con experiencias observables y permite distinguir entre correlación superficial y causa plausible mediante evidencia contextual.',
                    source_refs: ['curriculum:CN7:OA03'],
                    alternatives_considered: ['Caso de contaminación del aire', 'Caso de erosión de suelos']
                },
                design_rationale: {
                    why_this_type: 'La opción múltiple facilita comparar hipótesis causales en poco tiempo y con evaluación objetiva.',
                    why_this_distractors: 'Se usan distractores basados en confusiones frecuentes sobre variables ambientales.',
                    expected_time_sec: 90,
                    cognitive_load: 'media'
                },
                fairness_and_risk: {
                    potential_biases: ['Distinta familiaridad territorial con lagunas'],
                    mitigations: ['Se contextualiza el fenómeno en términos generales antes del ítem']
                },
                human_oversight: {
                    review_protocol: 'Docente revisa enunciado, opciones y justificación XAI antes de publicar el ejercicio.',
                    teacher_action_on_risk: 'Si detecta sesgo contextual o nivel lector inadecuado, ajusta redacción y distractores antes del uso en aula.',
                    override_policy: 'La decisión final de incluir, editar o descartar este ejercicio siempre corresponde al docente responsable.'
                },
                quality_of_explanation: {
                    target_audience: 'mixta',
                    clarity_level: 'alta',
                    actionable_feedback: 'La explicación incluye causa principal, descarte de distractores y criterio observable para justificar la respuesta correcta.',
                    adaptation_notes: 'Para estudiantes con menor comprensión lectora, usar versión resumida en viñetas y glosario breve previo.'
                },
                uncertainty: {
                    confidence: 0.82,
                    limitations: ['No incorpora diagnóstico lector previo del grupo']
                },
                counterfactual: {
                    condition: 'Si el grupo tuviera menor nivel lector',
                    expected_change: 'Reducir longitud del enunciado y usar glosario visual previo.'
                },
                trace: {
                    model: 'gpt-5.3-codex',
                    prompt_id: 'xai_prompt_v2',
                    timestamp_utc: '2026-02-13T12:00:00Z'
                }
            }
        }
    ]
};

export default exampleXaiBundle;
