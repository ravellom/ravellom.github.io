(() => {
  "use strict";

  const STORAGE_KEY = "narrativa_emergente_gemini_api_key";
  const TURN_INTERVAL_MS = 15000;
  const MAX_HISTORY_ITEMS = 12;
  const DIALOG_DURATION_MS = 5000;

  const ZONES = {
    Cama: { x: 0.18, y: 0.24 },
    Mesa: { x: 0.79, y: 0.24 },
    Puerta: { x: 0.79, y: 0.78 },
    Centro: { x: 0.5, y: 0.58 }
  };

  const CHARACTERS = [
    {
      id: "iris",
      nombre: "Iris",
      color: "linear-gradient(145deg, #f39fc8, #e04e8d)",
      zonaActual: "Cama",
      personalidad:
        "Eres Iris. Curiosa, poetica, sensible a sonidos y texturas. Tomas decisiones exploratorias y hablas con imagenes breves."
    },
    {
      id: "bruno",
      nombre: "Bruno",
      color: "linear-gradient(145deg, #84b5ff, #2b77f3)",
      zonaActual: "Mesa",
      personalidad:
        "Eres Bruno. Analitico, directo, practico. Priorizas orden, causas y efectos. Hablas corto y concreto."
    },
    {
      id: "luna",
      nombre: "Luna",
      color: "linear-gradient(145deg, #8fe0bf, #2d9c74)",
      zonaActual: "Centro",
      personalidad:
        "Eres Luna. Mediadora, empatica, observadora de emociones. Buscas armonia entre personajes y entorno."
    }
  ];

  const state = {
    apiKey: "",
    turnIndex: 0,
    isRequestInFlight: false,
    timerId: null,
    historialHabitacion: [],
    charactersById: new Map()
  };

  const dom = {
    room: document.getElementById("room"),
    charactersLayer: document.getElementById("charactersLayer"),
    logList: document.getElementById("logList"),
    eventForm: document.getElementById("eventForm"),
    eventInput: document.getElementById("eventInput"),
    forceTurnBtn: document.getElementById("forceTurnBtn"),
    clearApiBtn: document.getElementById("clearApiBtn"),
    apiModal: document.getElementById("apiModal"),
    apiKeyInput: document.getElementById("apiKeyInput"),
    saveApiBtn: document.getElementById("saveApiBtn")
  };

  function init() {
    renderCharacters();
    wireEvents();

    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      state.apiKey = savedKey;
      hideApiModal();
      bootstrapSimulation();
    } else {
      showApiModal();
    }

    // Recalcula posiciones para mantener coherencia al redimensionar.
    window.addEventListener("resize", () => {
      repositionAllCharacters(true);
    });
  }

  function wireEvents() {
    dom.eventForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = dom.eventInput.value.trim();
      if (!text) return;

      const observerEvent = `Evento externo: ${text}`;
      pushHistory(observerEvent);
      addLog(`Observador inyecta: "${text}"`, "observer");
      dom.eventInput.value = "";
    });

    dom.forceTurnBtn.addEventListener("click", () => {
      runTurn("manual");
    });

    dom.clearApiBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state.apiKey = "";
      addLog("API Key eliminada. Debes ingresar una nueva para continuar.", "system");
      showApiModal();
    });

    dom.saveApiBtn.addEventListener("click", handleSaveApiKey);
    dom.apiKeyInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleSaveApiKey();
      }
    });
  }

  function handleSaveApiKey() {
    const key = dom.apiKeyInput.value.trim();
    if (key.length < 20) {
      addLog("La API Key parece invalida o incompleta.", "error");
      return;
    }

    localStorage.setItem(STORAGE_KEY, key);
    state.apiKey = key;
    hideApiModal();
    addLog("API Key configurada localmente. Simulacion iniciada.", "system");

    if (!state.timerId) {
      bootstrapSimulation();
    }
  }

  function bootstrapSimulation() {
    seedInitialHistory();
    repositionAllCharacters(true);

    if (state.timerId) {
      clearInterval(state.timerId);
    }

    state.timerId = setInterval(() => {
      runTurn("interval");
    }, TURN_INTERVAL_MS);

    // Primer turno rapido para que la escena arranque con actividad.
    setTimeout(() => runTurn("initial"), 900);
  }

  function seedInitialHistory() {
    if (state.historialHabitacion.length > 0) return;

    const intro = "Inicio de escena: tres personajes comparten una habitacion y reaccionan a lo que ocurre.";
    pushHistory(intro);
    addLog(intro, "system");
  }

  function renderCharacters() {
    dom.charactersLayer.innerHTML = "";
    state.charactersById.clear();

    CHARACTERS.forEach((char, index) => {
      const wrapper = document.createElement("article");
      wrapper.className = "character";
      wrapper.dataset.charId = char.id;
      wrapper.setAttribute("aria-label", `Avatar de ${char.nombre}`);

      const bubble = document.createElement("div");
      bubble.className = "speech";
      bubble.setAttribute("role", "status");

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.style.background = char.color;

      const name = document.createElement("div");
      name.className = "char-name";
      name.textContent = char.nombre;

      wrapper.appendChild(bubble);
      wrapper.appendChild(avatar);
      wrapper.appendChild(name);
      dom.charactersLayer.appendChild(wrapper);

      state.charactersById.set(char.id, {
        ...char,
        index,
        element: wrapper,
        bubble
      });
    });
  }

  function repositionAllCharacters(instantly) {
    for (const char of state.charactersById.values()) {
      moveCharacterToZone(char, char.zonaActual, instantly);
    }
  }

  function moveCharacterToZone(char, zoneName, instantly = false) {
    const zone = ZONES[zoneName] || ZONES.Centro;
    const roomRect = dom.room.getBoundingClientRect();

    // Offset por personaje para evitar solapamiento cuando coinciden en una zona.
    const offsetX = [0, 18, -18][char.index % 3];
    const offsetY = [0, 12, -10][char.index % 3];

    const x = roomRect.width * zone.x - 43 + offsetX;
    const y = roomRect.height * zone.y - 52 + offsetY;

    if (instantly) {
      const prev = char.element.style.transition;
      char.element.style.transition = "none";
      char.element.style.transform = `translate(${x}px, ${y}px)`;
      // Fuerza reflow para volver a activar transicion en siguientes movimientos.
      void char.element.offsetHeight;
      char.element.style.transition = prev || "transform 2.8s cubic-bezier(0.25, 0.78, 0.22, 0.98)";
    } else {
      char.element.style.transform = `translate(${x}px, ${y}px)`;
    }

    char.zonaActual = zoneName;
  }

  async function runTurn(origin) {
    if (!state.apiKey) {
      addLog("Sin API Key configurada. Turno omitido.", "error");
      return;
    }

    if (state.isRequestInFlight) {
      addLog("Turno omitido: ya hay una solicitud en proceso.", "system");
      return;
    }

    const chars = Array.from(state.charactersById.values());
    const activeChar = chars[state.turnIndex % chars.length];
    state.turnIndex += 1;
    state.isRequestInFlight = true;

    addLog(`${activeChar.nombre} toma el turno (${origin}).`, "system");

    try {
      const decision = await askGeminiForAction(activeChar);
      applyDecision(activeChar, decision);
    } catch (error) {
      console.error(error);
      addLog(`${activeChar.nombre}: error al consultar Gemini (${error.message}).`, "error");

      const fallbackZone = pickRandomZone();
      moveCharacterToZone(activeChar, fallbackZone, false);
      const fallbackMsg = `${activeChar.nombre} improvisa y camina hacia ${fallbackZone}.`;
      pushHistory(fallbackMsg);
      addLog(fallbackMsg, "system");
    } finally {
      state.isRequestInFlight = false;
    }
  }

  async function askGeminiForAction(character) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.apiKey)}`;
    const zonasDisponibles = Object.keys(ZONES);

    const prompt = [
      "Contexto de simulacion:",
      "- Escenario top-down con zonas discretas.",
      `- Zonas disponibles: ${zonasDisponibles.join(", ")}.`,
      "- Debes elegir exactamente una zona_destino valida.",
      "- Historial reciente de la habitacion:",
      JSON.stringify(state.historialHabitacion, null, 2),
      "Devuelve solo JSON valido con este esquema exacto:",
      "{",
      '  "pensamiento": "...",',
      '  "accion_fisica": "...",',
      '  "dialogo": "...",',
      '  "zona_destino": "Cama|Mesa|Puerta|Centro"',
      "}"
    ].join("\n");

    const body = {
      system_instruction: {
        parts: [
          {
            text: [
              character.personalidad,
              "Actua como un personaje de una narrativa emergente.",
              "Responde en espanol.",
              "No incluyas markdown.",
              "No agregues campos fuera del esquema.",
              "Si no deseas hablar, usa dialogo como cadena vacia."
            ].join("\n")
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 260,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 180)}`);
    }

    const data = await response.json();
    const rawText = extractModelText(data);
    const parsed = safeJsonParse(rawText);

    return normalizeDecision(parsed);
  }

  function extractModelText(payload) {
    const parts = payload?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
      throw new Error("Respuesta sin contenido util.");
    }

    const text = parts
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Respuesta vacia del modelo.");
    }

    return text;
  }

  function safeJsonParse(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      return JSON.parse(cleaned);
    }
  }

  function normalizeDecision(input) {
    const zonasDisponibles = Object.keys(ZONES);

    const decision = {
      pensamiento: String(input?.pensamiento ?? "").slice(0, 220),
      accion_fisica: String(input?.accion_fisica ?? "Se queda observando el entorno.").slice(0, 220),
      dialogo: String(input?.dialogo ?? "").slice(0, 220),
      zona_destino: String(input?.zona_destino ?? "Centro")
    };

    if (!zonasDisponibles.includes(decision.zona_destino)) {
      decision.zona_destino = pickRandomZone();
    }

    return decision;
  }

  function applyDecision(character, decision) {
    moveCharacterToZone(character, decision.zona_destino, false);

    if (decision.dialogo.trim()) {
      showDialog(character, decision.dialogo.trim());
    }

    const summary = `${character.nombre} se mueve a ${decision.zona_destino}. Dice: "${decision.dialogo || "..."}"`;
    addLog(summary, "system");

    const memoryEntry = [
      `${character.nombre} piensa: ${decision.pensamiento || "(sin pensamiento explicito)"}`,
      `${character.nombre} actua: ${decision.accion_fisica}`,
      decision.dialogo ? `${character.nombre} dice: ${decision.dialogo}` : `${character.nombre} guarda silencio.`,
      `Destino: ${decision.zona_destino}`
    ].join(" | ");

    pushHistory(memoryEntry);
  }

  function showDialog(character, text) {
    character.bubble.textContent = text;
    character.bubble.classList.add("visible");

    clearTimeout(character.bubble.hideTimer);
    character.bubble.hideTimer = setTimeout(() => {
      character.bubble.classList.remove("visible");
    }, DIALOG_DURATION_MS);
  }

  function pushHistory(eventText) {
    const line = `[${timeNow()}] ${eventText}`;
    state.historialHabitacion.push(line);

    if (state.historialHabitacion.length > MAX_HISTORY_ITEMS) {
      state.historialHabitacion.splice(0, state.historialHabitacion.length - MAX_HISTORY_ITEMS);
    }
  }

  function addLog(message, kind = "system") {
    const item = document.createElement("li");
    item.className = `log-${kind}`;
    item.textContent = `[${timeNow()}] ${message}`;
    dom.logList.appendChild(item);
    dom.logList.scrollTop = dom.logList.scrollHeight;
  }

  function showApiModal() {
    dom.apiModal.classList.remove("hidden");
    dom.apiKeyInput.value = state.apiKey || "";
    dom.apiKeyInput.focus();
  }

  function hideApiModal() {
    dom.apiModal.classList.add("hidden");
  }

  function pickRandomZone() {
    const keys = Object.keys(ZONES);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function timeNow() {
    return new Date().toLocaleTimeString("es-ES", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  init();
})();
