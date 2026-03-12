export type ParsedCsvResult = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseCsvText(csvText: string): ParsedCsvResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('El CSV debe tener encabezados y al menos una fila de datos.');
  }

  const headers = splitCsvLine(lines[0]);
  if (headers.length < 2) {
    throw new Error('El CSV requiere al menos 2 columnas.');
  }

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    if (values.length !== headers.length) {
      throw new Error(`Fila ${i + 1}: número de columnas inválido (${values.length} en vez de ${headers.length}).`);
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}
