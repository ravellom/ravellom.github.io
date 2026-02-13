function cleanPotentialMarkdown(text) {
    let jsonText = String(text || '').trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
    }
    return jsonText.trim();
}

function parseJsonSafe(text) {
    try {
        return JSON.parse(text);
    } catch {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            const candidate = text.slice(start, end + 1);
            return JSON.parse(candidate);
        }
        throw new Error('Invalid JSON response');
    }
}

export async function generateWithGemini({ apiKey, model, prompt }) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json'
                }
            })
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanText = cleanPotentialMarkdown(rawText);

    if (!cleanText) {
        throw new Error('Empty response from model.');
    }

    return {
        rawText,
        cleanText,
        parsed: parseJsonSafe(cleanText)
    };
}
