const exampleXaiBundle = {
    schema_version: 'xai-exercises/2.0.0',
    resource_metadata: {
        title: 'Python Functions: UDL Core Example',
        topic: 'Python functions and return values',
        grade_level: 'Undergraduate introductory programming',
        language: 'en'
    },
    generation_context: {
        audience: 'First-year computer science students',
        pedagogical_goal: 'Understand how return values travel from a function back to the caller.',
        constraints: [
            'Single conceptual core with 3 UDL variants',
            'Bloom level fixed to understand',
            'Difficulty fixed to medium',
            'Type fixed to multiple_choice'
        ],
        source_material_refs: [
            'Python 3.12 docs: Defining Functions',
            'Course module: Intro to procedural abstraction'
        ],
        dua_enabled: true,
        dua_profile: {
            profile_level: 'heterogeneo',
            barriers: ['ninguna_relevante'],
            modality: 'individual',
            purpose: 'formativa',
            variation_type: 'equilibradas',
            variant_count: 3
        }
    },
    exercises: [
        {
            id: 'ex_core_return_repr_01',
            type: 'multiple_choice',
            content: {
                prompt_text: 'Representation variant: In the function below, what value is stored in result after the call?\n\ndef add_tax(price):\n    total = price * 1.1\n    return total\n\nresult = add_tax(50)'
            },
            interaction: {
                options: [
                    { id: 'o1', text: '50', is_correct: false },
                    { id: 'o2', text: '55.0', is_correct: true },
                    { id: 'o3', text: 'None', is_correct: false },
                    { id: 'o4', text: 'The function name add_tax', is_correct: false }
                ]
            },
            scaffolding: {
                hint_1: 'Track the value that is explicitly sent back by the return line.',
                explanation: 'The expression price * 1.1 gives 55.0, and return sends that exact value to the caller.',
                learn_more: 'Python docs: return statement and function outputs.'
            },
            dua: {
                label: 'DUA-Representacion',
                adaptation_focus: 'Code and value flow are presented with explicit variable naming to reduce ambiguity.',
                xai_summary: 'This variant increases representational clarity by making the output path from function to caller explicit.',
                core_statement: 'Interpret how a return statement sends a computed value from a function to the caller.',
                core_id: 'core_return_value_flow',
                variant_index: 1,
                variant_total: 3
            },
            xai: {
                why_this_exercise: 'This exercise targets the exact moment where beginners confuse local computation with returned output, which is central to understanding function behavior.',
                pedagogical_alignment: {
                    learning_objective: 'Explain how return values move from a Python function to the calling context.',
                    competency: 'Programming fundamentals',
                    bloom_level: 'understand',
                    difficulty_level: 'medium'
                },
                content_selection: {
                    why_this_content: 'A short numerical function offers a transparent mapping between input, internal variable, and output, reducing irrelevant complexity while preserving core logic.',
                    source_refs: ['Python language reference: return statement'],
                    alternatives_considered: ['String-return example', 'Boolean-return example']
                },
                design_rationale: {
                    why_this_type: 'Multiple choice isolates conceptual understanding of output flow and allows fast formative diagnosis.',
                    why_this_distractors: 'Distractors represent frequent misconceptions: returning input unchanged, assuming None by default, or confusing identifiers with values.',
                    expected_time_sec: 75,
                    cognitive_load: 'medium'
                },
                fairness_and_risk: {
                    potential_biases: ['Students may overfocus on arithmetic instead of function semantics.'],
                    mitigations: ['Numbers are simple so interpretation can focus on return mechanics.']
                },
                human_oversight: {
                    review_protocol: 'Teacher checks whether students justify why the returned value is the one assigned to result.',
                    teacher_action_on_risk: 'If confusion persists, teacher demonstrates variable tracing line by line with one extra example.',
                    override_policy: 'Teacher may rewrite distractors if local cohort misconceptions differ from default assumptions.'
                },
                quality_of_explanation: {
                    target_audience: 'mixed',
                    clarity_level: 'high',
                    actionable_feedback: 'Ask learners to annotate each line with input, local value, and returned value.',
                    adaptation_notes: 'Use visual highlighting of caller line and return line for students needing stronger cues.'
                },
                uncertainty: {
                    confidence: 0.94,
                    limitations: ['Does not yet test multiple parameters or nested calls.']
                },
                counterfactual: {
                    condition: 'If return total were replaced with print(total)',
                    expected_change: 'The value might display, but result would receive None instead of 55.0.'
                },
                trace: {
                    model: 'example-authoring-v1',
                    prompt_id: 'paper_example_udl_core',
                    timestamp_utc: '2026-02-20T23:30:00Z'
                }
            }
        },
        {
            id: 'ex_core_return_action_02',
            type: 'multiple_choice',
            content: {
                prompt_text: 'Action/Expression variant: A student says, "The function already calculates the value, so return is optional." Which response is most accurate?\n\ndef add_tax(price):\n    total = price * 1.1\n    return total'
            },
            interaction: {
                options: [
                    { id: 'o1', text: 'Correct, because calculated variables automatically become global.', is_correct: false },
                    { id: 'o2', text: 'Incorrect, because without return the caller cannot receive total as an output value.', is_correct: true },
                    { id: 'o3', text: 'Correct, but only when variable names are short.', is_correct: false },
                    { id: 'o4', text: 'Incorrect, because return is used only for loops.', is_correct: false }
                ]
            },
            scaffolding: {
                hint_1: 'Separate what happens inside the function from what the caller can access after the function ends.',
                explanation: 'Computation and output transfer are different steps. return is the mechanism that transfers the result to the caller.',
                learn_more: 'Python tutorial: local scope and function outputs.'
            },
            dua: {
                label: 'DUA-Accion/Expresion',
                adaptation_focus: 'Learner expresses conceptual understanding by evaluating a claim and selecting the best rebuttal.',
                xai_summary: 'This variant shifts expression demand to argument evaluation while preserving the same return-value concept.',
                core_statement: 'Interpret how a return statement sends a computed value from a function to the caller.',
                core_id: 'core_return_value_flow',
                variant_index: 2,
                variant_total: 3
            },
            xai: {
                why_this_exercise: 'It preserves the same conceptual target but changes response expression to claim analysis, helping detect deeper reasoning rather than pattern matching.',
                pedagogical_alignment: {
                    learning_objective: 'Explain how return values move from a Python function to the calling context.',
                    competency: 'Programming fundamentals',
                    bloom_level: 'understand',
                    difficulty_level: 'medium'
                },
                content_selection: {
                    why_this_content: 'A misconception statement is pedagogically useful because it externalizes faulty mental models and allows targeted correction.',
                    source_refs: ['CS education misconception studies on functions'],
                    alternatives_considered: ['Direct output prediction only', 'Short free-text justification']
                },
                design_rationale: {
                    why_this_type: 'Multiple choice with misconception framing supports clear scoring and immediate formative feedback.',
                    why_this_distractors: 'Distractors intentionally include common myth patterns: automatic global access, syntax superstition, and keyword confusion.',
                    expected_time_sec: 85,
                    cognitive_load: 'medium'
                },
                fairness_and_risk: {
                    potential_biases: ['Students with weaker English may misread the claim framing.'],
                    mitigations: ['Sentence structure is concise and avoids idiomatic phrasing.']
                },
                human_oversight: {
                    review_protocol: 'Teacher verifies whether students can restate the correct option in their own words after answering.',
                    teacher_action_on_risk: 'If learners guess correctly without explanation, teacher requests a one-sentence reasoning check.',
                    override_policy: 'Teacher can simplify wording while keeping the same misconception targets and answer logic.'
                },
                quality_of_explanation: {
                    target_audience: 'mixed',
                    clarity_level: 'high',
                    actionable_feedback: 'Prompt learners to state what the caller receives with and without return.',
                    adaptation_notes: 'Useful for students who benefit from verbal reasoning about code behavior.'
                },
                uncertainty: {
                    confidence: 0.92,
                    limitations: ['Focuses on concept talk, not code writing production yet.']
                },
                counterfactual: {
                    condition: 'If the task asked for code writing instead of claim analysis',
                    expected_change: 'Expression demand would increase, but the conceptual target about return transfer could remain identical.'
                },
                trace: {
                    model: 'example-authoring-v1',
                    prompt_id: 'paper_example_udl_core',
                    timestamp_utc: '2026-02-20T23:30:00Z'
                }
            }
        },
        {
            id: 'ex_core_return_engage_03',
            type: 'multiple_choice',
            content: {
                prompt_text: 'Engagement variant: You are building a checkout app. A helper function computes the final price, and another part of the program must use that value. Why is return essential?'
            },
            interaction: {
                options: [
                    { id: 'o1', text: 'return lets the computed price be passed back so the checkout step can use it.', is_correct: true },
                    { id: 'o2', text: 'return permanently saves the value to the internet database by default.', is_correct: false },
                    { id: 'o3', text: 'return makes the function run in parallel threads automatically.', is_correct: false },
                    { id: 'o4', text: 'return is only needed when a function has no parameters.', is_correct: false }
                ]
            },
            scaffolding: {
                hint_1: 'Think of return as the handoff point between one function and the next step of the workflow.',
                explanation: 'In real applications, computed values must be handed to other components. return provides that explicit handoff.',
                learn_more: 'Software design basics: function interfaces and data flow.'
            },
            dua: {
                label: 'DUA-Implicacion',
                adaptation_focus: 'Concept is embedded in an authentic app context to increase relevance and sustained attention.',
                xai_summary: 'This variant keeps the same concept but increases motivation through a realistic development scenario.',
                core_statement: 'Interpret how a return statement sends a computed value from a function to the caller.',
                core_id: 'core_return_value_flow',
                variant_index: 3,
                variant_total: 3
            },
            xai: {
                why_this_exercise: 'Contextual relevance helps retention while preserving the same conceptual invariant about how returned data moves across program components.',
                pedagogical_alignment: {
                    learning_objective: 'Explain how return values move from a Python function to the calling context.',
                    competency: 'Programming fundamentals',
                    bloom_level: 'understand',
                    difficulty_level: 'medium'
                },
                content_selection: {
                    why_this_content: 'A checkout workflow is familiar and concrete, making abstract output transfer easier to internalize without changing the core concept.',
                    source_refs: ['Intro software engineering examples on modular design'],
                    alternatives_considered: ['Game score update context', 'Sensor data context']
                },
                design_rationale: {
                    why_this_type: 'Multiple choice maintains comparability across variants while allowing context-based engagement differences.',
                    why_this_distractors: 'Distractors reflect overclaims about what return does, helping separate data handoff from unrelated system behaviors.',
                    expected_time_sec: 70,
                    cognitive_load: 'medium'
                },
                fairness_and_risk: {
                    potential_biases: ['Commercial scenario may feel less familiar to some learners.'],
                    mitigations: ['Prompt focuses on generic data handoff logic, not domain-specific business knowledge.']
                },
                human_oversight: {
                    review_protocol: 'Teacher confirms students connect the scenario wording back to the exact code-level mechanism.',
                    teacher_action_on_risk: 'If context distracts from concept, teacher provides a neutral non-commercial equivalent example.',
                    override_policy: 'Teacher may swap scenario domain while preserving objective, Bloom level, and difficulty invariants.'
                },
                quality_of_explanation: {
                    target_audience: 'mixed',
                    clarity_level: 'high',
                    actionable_feedback: 'Ask learners to identify the producer function and consumer step in one sentence.',
                    adaptation_notes: 'Supports motivation by linking concept to realistic software workflow decisions.'
                },
                uncertainty: {
                    confidence: 0.93,
                    limitations: ['Context preference differs across cohorts and may require local adaptation.']
                },
                counterfactual: {
                    condition: 'If the scenario context were removed',
                    expected_change: 'Engagement cues may decrease, but conceptual correctness criteria should remain unchanged.'
                },
                trace: {
                    model: 'example-authoring-v1',
                    prompt_id: 'paper_example_udl_core',
                    timestamp_utc: '2026-02-20T23:30:00Z'
                }
            }
        }
    ]
};

export default exampleXaiBundle;
