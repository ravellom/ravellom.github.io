window.courseData_u7 = {
    id: "u7",
    title: "Unidad 7: Sintaxis y Oración Simple",
    sections: [
        {
            id: "sec1",
            title: "1. Los Grupos Sintácticos (Sintagmas)",
            icon: "🧱",
            activities: [
                { type: "choice", question: "¿Cuál es el núcleo de 'Muy *harto* de todo'?", options: ["Muy (Adv)", "Harto (Adj)", "Todo (Pron)"], correct: 1, feedback: "El núcleo es el adjetivo 'Harto'. 'Muy' lo cuantifica y 'de todo' lo complementa. Es un S. Adjetival." },
                { type: "choice", question: "Identifica el tipo de sintagma: 'Cerca de la estación'", options: ["S. Nominal", "S. Preposicional", "S. Adverbial"], correct: 2, feedback: "El núcleo es 'Cerca' (adverbio). Ojo: 'de la estación' es su complemento, no cambia el tipo de sintagma." },
                { type: "match", question: "Empareja cada sintagma con su tipo:", pairs: [{ left: "El café frío", right: "S. Nominal" }, { left: "Desde ayer", right: "S. Preposicional" }, { left: "Bastante difícil", right: "S. Adjetival" }, { left: "Llegó *pronto*", right: "S. Adverbial" }], feedback: "Fíjate siempre en la palabra principal (núcleo) o si empieza por preposición (enlace)." },
                { type: "binary", question: "En el sintagma 'La prima de Ana', 'de Ana' es el núcleo.", isTrue: false, feedback: "Falso. El núcleo es 'prima' (sustantivo). 'De Ana' es un S. Prep que funciona como Complemento del Nombre (CN)." },
                { type: "sort", question: "Ordena la estructura de un S. Nominal completo:", items: ["Determinante (El)", "Núcleo (coche)", "Adyacente (rojo)", "CN (de mi padre)"], feedback: "El orden habitual es Det + Núcleo + Complementos (Adyacentes adjetivos o CN preposicionales)." },
                { type: "choice", question: "¿Qué función hace 'suya' en 'La decisión es *suya*'?", options: ["Núcleo del Sujeto", "Atributo", "CD"], correct: 1, feedback: "Es un Atributo dentro de un Predicado Nominal (verbo ser)." },
                { type: "choice", question: "¿Qué tipo de palabra es 'quien' en 'La chica *quien* vino'?", options: ["Conjunción", "Pronombre Relativo", "Adverbio"], correct: 1, feedback: "Es un pronombre relativo que introduce una oración subordinada adjetiva." },
                { type: "match", question: "Identifica el núcleo de estos sintagmas:", pairs: [{ left: "Mis tres *amigos*", right: "Amigos (Sust)" }, { left: "Lleno de *gracia*", right: "Gracia (Sust - Término)" }, { left: "*Lleno* de gracia", right: "Lleno (Adj)" }], feedback: "Cuidado: dentro de un S. Prep (de gracia) hay un término que suele ser un SN." },
                { type: "binary", question: "Un pronombre personal (Ella, Nosotros) forma un Sintagma Nominal.", isTrue: true, feedback: "Correcto. El pronombre sustituye al nombre, así que actúa como núcleo de un SN." },
                { type: "choice", question: "En 'Quiero *salir*', ¿qué es 'salir'?", options: ["Verbo principal", "Sustantivo verbal (Núcleo de CD)", "Adverbio"], correct: 1, feedback: "El infinitivo funciona como un sustantivo. Aquí es el núcleo del CD (Lo quiero)." },
                { type: "choice", question: "¿Qué es 'Por la mañana'?", options: ["S. Nominal", "S. Preposicional", "S. Adverbial"], correct: 1, feedback: "Empieza por preposición 'Por' (Enlace) + 'la mañana' (Término SN)." }
            ]
        },
        {
            id: "sec2",
            title: "2. Sujeto y Predicado",
            icon: "⚖️",
            activities: [
                { type: "choice", question: "Truco de oro para el Sujeto: 'Me gustan los gatos'.", options: ["Preguntar ¿Quién gusta?", "Cambiar el número: Me gusta el gato", "Ver qué está primero"], correct: 1, feedback: "Al cambiar 'gustan' a 'gusta', 'los gatos' te obliga a cambiar a 'el gato'. Esa concordancia demuestra que es el Sujeto." },
                { type: "choice", question: "¿Cuál es el sujeto en 'Hubo fiestas en el pueblo'?", options: ["Fiestas", "En el pueblo", "No tiene (Impersonal)"], correct: 2, feedback: "El verbo HABER (de existencia) es siempre IMPERSONAL. 'Fiestas' es el CD (Las hubo)." },
                { type: "binary", question: "El sujeto puede estar omitido (elíptico).", isTrue: true, feedback: "Verdadero. Ej: 'Llegamos tarde' -> Sujeto Omitido: Nosotros." },
                { type: "match", question: "Tipos de oraciones según el sujeto:", pairs: [{ left: "Juan corre", right: "Personal (Sujeto explícito)" }, { left: "Llueve mucho", right: "Impersonal (Unipersonal)" }, { left: "Llaman a la puerta", right: "Impersonal eventual (desconocido)" }, { left: "Se vive bien", right: "Impersonal refleja" }], feedback: "Distinguir los tipos de impersonales es clave en Bachillerato." },
                { type: "choice", question: "En 'A mí me interesa la música', ¿cuál es el sujeto?", options: ["A mí", "La música", "Me"], correct: 1, feedback: "'A mí' empieza por preposición (jamás es sujeto). 'La música' concuerda con 'interesa'." },
                { type: "sort", question: "Analiza 'Ayer vinieron mis primos':", items: ["CCT (Ayer)", "Núcleo Verbal (vinieron)", "Sujeto (mis primos)"], feedback: "El sujeto suele ir al final con verbos de movimiento o existencia." },
                { type: "binary", question: "En 'Hace calor', 'calor' es el sujeto.", isTrue: false, feedback: "Falso. Hacer + Clima es Impersonal. 'Calor' es el CD (Lo hace)." },
                { type: "choice", question: "Identifica el predicado en: 'El niño está contento'.", options: ["Predicado Verbal", "Predicado Nominal"], correct: 1, feedback: "Lleva verbo copulativo (estar) + Atributo. Es Predicado Nominal." },
                { type: "choice", question: "¿Cuál es el sujeto paciente en 'El fuego fue apagado por los bomberos'?", options: ["Los bomberos", "El fuego", "No hay sujeto"], correct: 1, feedback: "En la pasiva, quien 'recibe' la acción y concuerda con el verbo es el Sujeto Paciente." },
                { type: "match", question: "Localiza el sujeto:", pairs: [{ left: "Se venden *pisos*", right: "Sujeto Paciente" }, { left: "*Nosotros* comemos", right: "Sujeto Agente" }, { left: "Me duele *la pierna*", right: "Sujeto (Causa)" }], feedback: "Con verbos como doler/gustar/molestar, el sujeto es la 'cosa' que causa la sensación." },
                { type: "binary", question: "'Entre tú y yo lo haremos' tiene sujeto preposicional.", isTrue: false, feedback: "Es una excepción aparente, pero se analiza como estructura coordinada enfática. El sujeto es 'nosotros' (implícito en haremos) o el conjunto 'tú y yo'." }
            ]
        },
        {
            id: "sec3",
            title: "3. Complementos del Verbo I (CD, CI, Atributo)",
            icon: "🎯",
            activities: [
                { type: "choice", question: "¿Cómo reconocer el CD (Complemento Directo)?", options: ["Sustituir por LE", "Sustituir por LO/LA", "Preguntar ¿Cómo?"], correct: 1, feedback: "La prueba reina es la sustitución por LO/LA/LOS/LAS. Y pasar a pasiva (el CD se vuelve Sujeto)." },
                { type: "choice", question: "En 'Vi a Manuel', ¿qué es 'a Manuel'?", options: ["CD", "CI", "Suplemento"], correct: 0, feedback: "Es CD de persona. Prueba: LO vi. (No caigas en el leísmo 'Le vi')." },
                { type: "match", question: "Sustituye por pronombres:", pairs: [{ left: "Compré *flores*", right: "LAS compré (CD)" }, { left: "Di el regalo *a Luis*", right: "LE di el regalo (CI)" }, { left: "Di *el regalo* a Luis", right: "LO di (CD)" }, { left: "*Luis* es alto", right: "LO es (Atributo)" }], feedback: "LO sirve para CD masculino y para Atributo neutro. LE es siempre CI." },
                { type: "binary", question: "El Atributo solo va con Ser, Estar y Parecer.", isTrue: true, feedback: "Correcto (salvo verbos semicopulativos). Si ves estos verbos, busca el Atributo, no el CD." },
                { type: "choice", question: "En 'El agua se volvió turbia', 'turbia' es...", options: ["CC Modo", "Atributo", "C. Predicativo"], correct: 1, feedback: "¡Ojo! 'Volverse' aquí funciona como semicopulativo (cambio de estado). Se analiza como Atributo." },
                { type: "sort", question: "Ordena la transformación a Pasiva de 'Ana lee el libro':", items: ["El libro (Suj. Paciente)", "es leído (V. Pasivo)", "por Ana (C. Agente)"], feedback: "Si puedes hacer esto, 'el libro' es sin duda el CD." },
                { type: "choice", question: "¿Qué función es 'Les' en 'Les di un abrazo'?", options: ["CD", "CI", "C. Régimen"], correct: 1, feedback: "El pronombre 'Les' siempre es Complemento Indirecto (o acusativo en dialectos, pero gramaticalmente CI)." },
                { type: "choice", question: "En 'Llegaron cansados', 'cansados' es...", options: ["Atributo", "C. Predicativo", "CC Modo"], correct: 1, feedback: "Es un adjetivo que concuerda con el sujeto (Ellos). Con verbos no copulativos se llama Predicativo (CPred)." },
                { type: "binary", question: "El CD nunca lleva preposición.", isTrue: false, feedback: "Falso. El CD de persona SIEMPRE lleva la preposición 'a' (Vi a María)." },
                { type: "match", question: "Diferencia CD y Atributo:", pairs: [{ left: "Juan es *médico*", right: "Atributo (Lo es)" }, { left: "Juan visitó *al médico*", right: "CD (Lo visitó)" }], feedback: "El verbo marca la diferencia: Ser/Estar -> Atributo. Otros -> CD." },
                { type: "choice", question: "¿Qué función tiene 'me' en 'Me lavo las manos'?", options: ["CD", "CI", "Sujeto"], correct: 1, feedback: "Reflexivo. Como 'las manos' es el CD (Me las lavo), el 'Me' pasa a ser CI." }
            ]
        },
        {
            id: "sec4",
            title: "4. Complementos del Verbo II (CRég, CAg, CC)",
            icon: "🔗",
            activities: [
                { type: "choice", question: "¿Qué define al C. Régimen (Suplemento)?", options: ["Es un adverbio de modo", "Lleva una preposición exigida por el verbo", "Se sustituye por LO"], correct: 1, feedback: "Verbos como 'Confiar en', 'Hablar de', 'Arrepentirse de' exigen esa preposición." },
                { type: "match", question: "Asocia verbo y preposición:", pairs: [{ left: "Pensar", right: "EN" }, { left: "Quejarse", right: "DE" }, { left: "Versar", right: "SOBRE" }, { left: "Acostumbrarse", right: "A" }], feedback: "Si quitas la preposición, la frase pierde sentido o cambia de significado." },
                { type: "choice", question: "Distingue en: 'Habló de memoria' vs 'Habló de política'.", options: ["Ambos son CRég", "1º CCM, 2º CRég", "1º CRég, 2º CCM"], correct: 1, feedback: "'De memoria' es el modo (¿cómo habló?). 'De política' es el tema exigido (¿de qué habló?)." },
                { type: "choice", question: "El Complemento Agente aparece en...", options: ["Voz Activa", "Voz Pasiva", "Oraciones Impersonales"], correct: 1, feedback: "Siempre en pasiva, introducido por 'por' (indica quién hace la acción)." },
                { type: "binary", question: "Un verbo puede tener CD y C.Régimen a la vez.", isTrue: true, feedback: "Sí, es posible. Ej: 'Dijo (V) barbaridades (CD) de su jefe (CRég)' o 'Confundió (V) el tocino (CD) con la velocidad (CRég)'." },
                { type: "match", question: "Tipos de Circunstanciales:", pairs: [{ left: "Con un cuchillo", right: "CC Instrumento" }, { left: "Por miedo", right: "CC Causa" }, { left: "Para aprobar", right: "CC Finalidad" }, { left: "Con mi hermano", right: "CC Compañía" }], feedback: "Responden a ¿Con qué?, ¿Por qué?, ¿Para qué?, ¿Con quién?" },
                { type: "choice", question: "En 'Fue construido por el arquitecto', 'por el arquitecto' es...", options: ["CC Causa", "C. Agente", "Sujeto"], correct: 1, feedback: "Es Agente porque si pasas a activa, se vuelve sujeto: 'El arquitecto construyó...'." },
                { type: "sort", question: "Analiza 'Ayer comí en ese restaurante':", items: ["CCT (Ayer)", "Núcleo (comí)", "CCL (en ese restaurante)"], feedback: "Los circunstanciales suelen ser móviles (En ese restaurante comí ayer)." },
                { type: "choice", question: "¿Qué función es 'a Madrid' en 'Voy a Madrid'?", options: ["CD", "CI", "CC Lugar"], correct: 2, feedback: "Indica dirección/lugar. Conmutación: 'Voy allí'." },
                { type: "binary", question: "El C. Agente se puede sustituir por un pronombre tónico (por él).", isTrue: true, feedback: "Correcto. 'Fue hecho por Juan' -> 'Fue hecho por él'." },
                { type: "choice", question: "En 'Se olvidó de las llaves', ¿qué función es 'de las llaves'?", options: ["CD", "C. Régimen", "CN"], correct: 1, feedback: "Verbo 'Olvidarse DE'. Es C. Régimen. (Ojo: 'Olvidar las llaves' sería CD, pero 'Olvidarse' es pronominal y rige 'de')." }
            ]
        },
        {
            id: "sec5",
            title: "5. Los Valores de SE",
            icon: "🤔",
            activities: [
                { type: "choice", question: "¿Qué es 'Juan se lava'? (A sí mismo)", options: ["Reflexivo", "Recíproco", "Pronominal"], correct: 0, feedback: "Reflexivo: El sujeto realiza y recibe la acción." },
                { type: "choice", question: "¿Qué es 'Ana y Luis se odian'? (Mutuamente)", options: ["Reflexivo", "Recíproco", "Impersonal"], correct: 1, feedback: "Recíproco: La acción rebota entre dos o más sujetos." },
                { type: "choice", question: "¿Qué es 'Se venden coches'?", options: ["Pasiva Refleja", "Impersonal", "Reflexivo"], correct: 0, feedback: "Pasiva Refleja. Hay concordancia: 'Se vende coche' / 'Se venden coches'. 'Coches' es el sujeto." },
                { type: "choice", question: "¿Qué es 'Se recibe a los embajadores'?", options: ["Pasiva Refleja", "Impersonal", "Recíproco"], correct: 1, feedback: "Impersonal. Lleva la 'a' (CD persona), lo que bloquea el sujeto. El verbo siempre va en singular." },
                { type: "match", question: "Identifica el valor del SE:", pairs: [{ left: "Se queja mucho", right: "Verbo Pronominal" }, { left: "Se lo di", right: "Sustituto de LE (Falso SE)" }, { left: "Se comió tres platos", right: "Dativo Ético (Enfático)" }, { left: "Se arregla ropa", right: "Pasiva Refleja" }], feedback: "El Pronominal es parte del verbo (quejarse). El Dativo se puede quitar ('Comió tres platos')." },
                { type: "binary", question: "En 'Se afeita la barba', 'Se' es CD.", isTrue: false, feedback: "Falso. 'La barba' es el CD. 'Se' funciona como CI (Le afeita la barba a sí mismo)." },
                { type: "choice", question: "¿Qué función tiene 'Se' en 'Se peina'?", options: ["CD", "CI", "Sujeto"], correct: 0, feedback: "Aquí 'Se' es CD porque no hay otro CD explícito. Se peina a sí mismo (Lo peina)." },
                { type: "sort", question: "Pasos para analizar el SE:", items: ["1. ¿Verbo Pronominal? (Arrepentirse)", "2. ¿Reflexivo/Recíproco? (A sí mismo/Mutuamente)", "3. ¿Pasiva Refleja? (Concuerda con Sujeto)", "4. ¿Impersonal? (No concuerda, verbo singular)"], feedback: "El orden importa para descartar correctamente." },
                { type: "choice", question: "¿Qué 'Se' es: 'Se vive bien aquí'?", options: ["Pasiva Refleja", "Impersonal", "Pronominal"], correct: 1, feedback: "Impersonal. No hay sujeto ni posibilidad de ponerlo." },
                { type: "binary", question: "El 'Se' variante de LE siempre aparece antes de LO/LA/LOS/LAS.", isTrue: true, feedback: "Correcto. No decimos 'Le lo di', sino 'Se lo di'." },
                { type: "match", question: "Distingue Pasiva Refleja e Impersonal:", pairs: [{ left: "Se alquilan pisos", right: "Pasiva Refleja (Plural)" }, { left: "Se busca a los culpables", right: "Impersonal (Singular + A)" }], feedback: "La concordancia es la clave. Si el verbo cambia al plural con el sustantivo, es Pasiva Refleja." }
            ]
        },
        {
            id: "sec6",
            title: "6. Clasificación de la Oración",
            icon: "📋",
            activities: [
                { type: "choice", question: "¿Qué define a una oración TRANSITIVA?", options: ["Tiene CD", "Tiene Atributo", "No tiene CD"], correct: 0, feedback: "Transitiva = La acción transita hacia un objeto directo (CD)." },
                { type: "choice", question: "La oración 'Juan corre por el parque' es...", options: ["Transitiva", "Intransitiva", "Copulativa"], correct: 1, feedback: "Intransitiva. 'Correr' aquí no lleva CD (el parque es CCL)." },
                { type: "match", question: "Clasifica según el predicado:", pairs: [{ left: "Luis es alto", right: "Copulativa / Atributiva" }, { left: "Luis parece cansado", right: "Copulativa / Atributiva" }, { left: "Luis compró pan", right: "Predicativa" }], feedback: "Verbos Ser, Estar, Parecer -> Atributivas. Resto -> Predicativas." },
                { type: "choice", question: "¿Qué es 'O estudias o trabajas'?", options: ["Coordinada Copulativa", "Coordinada Disyuntiva", "Coordinada Adversativa"], correct: 1, feedback: "Disyuntiva (Nexos O, U). Implica elección o exclusión." },
                { type: "choice", question: "¿Qué es 'Es listo, pero vago'?", options: ["Adversativa", "Copulativa", "Explicativa"], correct: 0, feedback: "Adversativa (Pero, mas, sino, sin embargo). Corrige o matiza lo anterior." },
                { type: "binary", question: "Una oración pasiva perifrástica siempre lleva el verbo SER + Participio.", isTrue: true, feedback: "Correcto. 'Fue comido', 'Serán entregados'." },
                { type: "sort", question: "Tipos de oraciones según actitud del hablante:", items: ["Enunciativa (Informa)", "Interrogativa (Pregunta)", "Desiderativa (Deseo)", "Dubitativa (Duda)"], feedback: "También llamado 'Modalidad oracional'." },
                { type: "match", question: "Identifica la modalidad:", pairs: [{ left: "¡Ojalá apruebe!", right: "Desiderativa" }, { left: "Quizás llueva", right: "Dubitativa" }, { left: "Cierra la puerta", right: "Imperativa / Exhortativa" }], feedback: "Refleja la intención comunicativa." },
                { type: "choice", question: "¿Qué es 'Ni come ni deja comer'?", options: ["Coordinada Copulativa", "Coordinada Disyuntiva", "Subordinada"], correct: 0, feedback: "Copulativa negativa (Nexos Y, E, NI). Suma acciones." },
                { type: "binary", question: "Las oraciones reflexivas (se lava) funcionan sintácticamente como transitivas.", isTrue: true, feedback: "Sí, porque el pronombre reflexivo actúa como CD (o CI)." },
                { type: "choice", question: "La oración 'Hizo mucho frío ayer' es...", options: ["Personal", "Impersonal Unipersonal", "Pasiva"], correct: 1, feedback: "Impersonal natural o meteorológica (verbo hacer temporal)." }
            ]
        }
    ]
};