window.courseData_u7 = { // Fíjate que cambiamos el nombre de la variable para que no choque
    id: "u7",
    title: "Unidad 7: La Oración Simple",
    sections: [
        {
            id: "sec1",
            title: "1. Grupos y Sintagmas",
            icon: "🧱",
            activities: [
                {
                    type: "choice",
                    question: "Identifica el núcleo del sintagma: 'Muy lejos de mi casa'",
                    options: ["lejos (S.Adv)", "casa (S.Nom)", "muy (S.Adv)"],
                    correct: 0,
                    feedback: "El núcleo es el adverbio 'lejos'. 'Muy' es un cuantificador y 'de mi casa' es un complemento del adverbio."
                },
                {
                    type: "match",
                    question: "Relaciona cada sintagma con su tipo:",
                    pairs: [
                        { left: "Bastante simpático", right: "Sintagma Adjetival" },
                        { left: "Cerca del parque", right: "Sintagma Adverbial" },
                        { left: "La casa de papel", right: "Sintagma Nominal" },
                        { left: "Ha comido pan", right: "Sintagma Verbal" }
                    ],
                    feedback: "Fíjate siempre en la palabra más importante (núcleo) para determinar el tipo de grupo sintáctico."
                }
            ]
        },
        {
            id: "sec2",
            title: "4. Sujeto y Predicado",
            icon: "⚖️",
            activities: [
                {
                    type: "choice",
                    question: "¿Cuál es el sujeto en: 'Me gusta mucho el chocolate'?",
                    options: ["Yo (omitido)", "A mí (implícito)", "El chocolate"],
                    correct: 2,
                    feedback: "¡Cuidado! El sujeto NUNCA empieza por preposición. Haz la prueba de concordancia: 'Me gustan los chocolates'. Lo que cambia es el sujeto."
                },
                {
                    type: "binary",
                    question: "En la oración 'Hace mucho calor', el sujeto es 'el tiempo'.",
                    isTrue: false,
                    feedback: "Falso. Es una oración IMPERSONAL (verbo meteorológico o 'hacer' temporal). No tiene sujeto, ni omitido ni explícito."
                }
            ]
        },
        {
            id: "sec3",
            title: "5. Complementos del Verbo",
            icon: "🎯",
            activities: [
                {
                    type: "match",
                    question: "Averigua la función sintáctica de lo subrayado (mentalmente) sustituyendo:",
                    pairs: [
                        { left: "Compré *manzanas*", right: "CD (Las compré)" },
                        { left: "Di el regalo *a Luis*", right: "CI (Le di el regalo)" },
                        { left: "Llegó *muy cansada*", right: "C. Predicativo (Concuerda con sujeto)" },
                        { left: "Hablamos *de política*", right: "C. Régimen (Exigido por preposición)" }
                    ],
                    feedback: "El CD se sustituye por LO/LA. El CI por LE. El Atributo y el Predicativo concuerdan en género y número con el sujeto o CD."
                },
                {
                    type: "choice",
                    question: "En 'Juan es *médico*', ¿qué función desempeña 'médico'?",
                    options: ["Complemento Directo", "Atributo", "Complemento del Nombre"],
                    correct: 1,
                    feedback: "Es un Atributo porque va con un verbo copulativo (ser, estar, parecer) y se puede sustituir por LO: 'Juan LO es'."
                }
            ]
        },
        {
            id: "sec4",
            title: "6. Los Valores de SE",
            icon: "🤔",
            activities: [
                {
                    type: "sort",
                    question: "Clasifica según la función del 'SE' (de más 'físico' a más gramatical):",
                    items: [
                        "Juan se lava (Reflexivo: a sí mismo)",
                        "Ana y Luis se besan (Recíproco: mutuamente)",
                        "Se venden pisos (Pasiva Refleja)",
                        "Se vive bien aquí (Impersonal)"
                    ],
                    feedback: "El 'Se' es el camaleón de la sintaxis. Distinguir entre pasiva refleja (hay sujeto: los pisos) e impersonal (no hay sujeto) es clave."
                },
                {
                    type: "choice",
                    question: "¿Qué tipo de SE es: 'Se quejan de todo'?",
                    options: ["Reflexivo", "Pronominal (Verbo)", "Dativo Ético"],
                    correct: 1,
                    feedback: "Es pronominal. El verbo es 'quejarse'. No puedes decir 'Yo quejo'. El pronombre es parte inseparable del verbo."
                }
            ]
        },
        {
            id: "sec5",
            title: "7. Clases de Oraciones",
            icon: "🏗️",
            activities: [
                {
                    type: "binary",
                    question: "La oración 'Fue elogiado por el director' es una Pasiva Perifrástica.",
                    isTrue: true,
                    feedback: "Verdadero. Tiene la estructura SER + Participio + Complemento Agente (por el director)."
                },
                {
                    type: "sort",
                    question: "Ordena los pasos para analizar una oración compuesta:",
                    items: [
                        "1. Localizar los verbos",
                        "2. Buscar el nexo",
                        "3. Delimitar la proposición principal y subordinada",
                        "4. Analizar funciones sintácticas internas"
                    ],
                    feedback: "Siempre empieza por los verbos. Los verbos son el rey de la sintaxis. El nexo te dirá el tipo de subordinada."
                }
            ]
        }
    ]
};