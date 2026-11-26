import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

export const CSV_IMPORT_LIMITS = {
  maxFileSize: 5 * 1024 * 1024,
  maxRows: 1000,
  maxColumns: 50,
} as const;

export interface CsvRecords {
  headers: string[];
  rows: string[][];
}

function detectDelimiter(text: string): ',' | ';' {
  let commas = 0;
  let semicolons = 0;
  let quoted = false;

  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === '\n' || char === '\r')) break;
    else if (!quoted && char === ',') commas++;
    else if (!quoted && char === ';') semicolons++;
  }

  return semicolons > commas ? ';' : ',';
}

export function readCsvRecords(file: Buffer): CsvRecords {
  const text = file.toString('utf8');
  let records: string[][];

  try {
    records = parse(text, {
      bom: true,
      delimiter: detectDelimiter(text),
      skip_empty_lines: true,
      skip_records_with_empty_values: true,
      relax_column_count: true,
    }) as string[][];
  } catch {
    throw new BadRequestException('The file is not a valid CSV file');
  }

  const [headerRow, ...rows] = records;
  if (!headerRow) {
    throw new BadRequestException('The file has no header row');
  }

  const headers = headerRow.map((header) => header.trim());
  if (headers.length > CSV_IMPORT_LIMITS.maxColumns) {
    throw new BadRequestException(
      `A CSV file can have at most ${CSV_IMPORT_LIMITS.maxColumns} columns`,
    );
  }
  if (rows.length > CSV_IMPORT_LIMITS.maxRows) {
    throw new BadRequestException(
      `A CSV file can have at most ${CSV_IMPORT_LIMITS.maxRows} rows`,
    );
  }

  return { headers, rows };
}
