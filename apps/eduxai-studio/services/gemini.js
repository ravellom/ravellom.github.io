function cleanPotentialMarkdown(text) {
    let jsonText = String(text || '').trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
    }
    return jsonText.trim();
}

function stripBomAndControls(text) {
    return String(text || '')
        .replace(/^\uFEFF/, '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function normalizeQuotes(text) {
    return String(text || '')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
}

function stripJsonComments(text) {
    const source = String(text || '');
    let result = '';
    let inString = false;
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const next = source[index + 1];

        if (inString) {
            result += char;
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            result += char;
            continue;
        }

        if (char === '/' && next === '/') {
            while (index < source.length && source[index] !== '\n') {
                index += 1;
            }
            if (index < source.length) {
                result += '\n';
            }
            continue;
        }

        if (char === '/' && next === '*') {
            index += 2;
            while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
                index += 1;
            }
            index += 1;
            continue;
        }

        result += char;
    }
    return result;
}

function removeTrailingCommas(text) {
    const source = String(text || '');
    let result = '';
    let inString = false;
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];

        if (inString) {
            result += char;
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            result += char;
            continue;
        }

        if (char === ',') {
            let lookahead = index + 1;
            while (lookahead < source.length && /\s/.test(source[lookahead])) {
                lookahead += 1;
            }
            const next = source[lookahead];
            if (next === '}' || next === ']') {
                continue;
            }
        }

        result += char;
    }
    return result;
}

function extractBalancedJsonObject(text) {
    const source = String(text || '');
    const start = source.indexOf('{');
    if (start < 0) {
        return '';
    }

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
        const char = source[index];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(start, index + 1);
            }
        }
    }

    return source.slice(start);
}

function closeLikelyTruncatedJson(text) {
    const source = String(text || '');
    const stack = [];
    let inString = false;
    let escaped = false;

    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
        } else if (char === '{') {
            stack.push('}');
        } else if (char === '[') {
            stack.push(']');
        } else if (char === '}' || char === ']') {
            if (stack[stack.length - 1] === char) {
                stack.pop();
            }
        }
    }

    let repaired = source;
    if (inString) {
        repaired += '"';
    }
    if (stack.length) {
        repaired += stack.reverse().join('');
    }
    return repaired;
}

export function parseJsonSafe(text) {
    const prepared = stripBomAndControls(cleanPotentialMarkdown(text));
    const extracted = extractBalancedJsonObject(prepared);
    const baseCandidates = [prepared, extracted].filter(Boolean);

    const candidates = new Set();
    baseCandidates.forEach((candidate) => {
        const normalized = normalizeQuotes(candidate);
        const noComments = stripJsonComments(normalized);
        const noTrailing = removeTrailingCommas(noComments).trim();
        candidates.add(noTrailing);
        candidates.add(closeLikelyTruncatedJson(noTrailing));
    });

    let lastError = null;
    for (const candidate of candidates) {
        if (!candidate) continue;
        try {
            return JSON.parse(candidate);
        } catch (error) {
            lastError = error;
        }
    }

    try {
        const start = prepared.indexOf('{');
        const end = prepared.lastIndexOf('}');
        if (start >= 0 && end > start) {
            const candidate = prepared.slice(start, end + 1);
            return JSON.parse(candidate);
        }
    } catch (error) {
        lastError = error;
    }

    throw lastError || new Error('Invalid JSON response');
}

export async function generateWithGemini({ apiKey, model, prompt, maxOutputTokens = 12288, timeoutMs = 90000 }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.max(10000, Number(timeoutMs) || 90000));
    let response;
    try {
        response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens,
                        responseMimeType: 'application/json'
                    }
                })
            }
        );
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error(`Request timeout after ${Math.round(timeoutMs / 1000)}s`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
    }

    const data = await response.json();
    const rawText = (data?.candidates?.[0]?.content?.parts || [])
        .map((part) => part?.text || '')
        .join('\n')
        .trim();
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
