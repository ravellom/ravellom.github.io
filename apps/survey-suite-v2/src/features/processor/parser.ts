import type { DatasetRecord } from '../../shared/types/state';

function detectDelimiter(firstLine: string): string {
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let maxCount = -1;

  candidates.forEach((candidate) => {
    const count = (firstLine.match(new RegExp(candidate === '\t' ? '\\t' : `\\${candidate}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      best = candidate;
    }
  });

  return best;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function toMaybeNumber(value: string): string | number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isFinite(parsed) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parsed;
  }
  return trimmed;
}

export function parseCSV(text: string, delimiterMode: 'auto' | ',' | ';' | '\t' | '|'): DatasetRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV inválido: se requieren cabecera y al menos una fila.');
  }

  const delimiter = delimiterMode === 'auto' ? detectDelimiter(lines[0]) : delimiterMode;
  const headers = parseCsvLine(lines[0], delimiter);

  if (!headers.length) {
    throw new Error('CSV inválido: cabecera vacía.');
  }

  const records: DatasetRecord[] = [];
  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const values = parseCsvLine(lines[rowIndex], delimiter);
    const row: DatasetRecord = {};
    headers.forEach((header, idx) => {
      row[header || `col_${idx + 1}`] = toMaybeNumber(values[idx] ?? '');
    });
    records.push(row);
  }

  return records;
}

export function parseJSON(text: string): DatasetRecord[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON inválido: no se pudo parsear.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('JSON inválido: se espera un array de objetos.');
  }

  const rows = parsed as unknown[];
  const records: DatasetRecord[] = rows.map((item, idx) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`JSON inválido en fila ${idx + 1}: cada elemento debe ser objeto.`);
    }

    const row: DatasetRecord = {};
    Object.entries(item as Record<string, unknown>).forEach(([key, value]) => {
      if (value === null || typeof value === 'string' || typeof value === 'number') {
        row[key] = value as string | number | null;
      } else {
        row[key] = String(value);
      }
    });
    return row;
  });

  if (!records.length) {
    throw new Error('JSON inválido: array vacío.');
  }

  return records;
}
