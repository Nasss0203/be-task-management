import { DataSource, DataSourceOptions } from 'typeorm';
import { QUARANTINED_MIGRATIONS } from './database-options';

export type HistoryRow = {
  id: number;
  timestamp: string | number;
  name: string;
};

// Tail of an id-ordered history that is out of timestamp order, sorted by
// timestamp; empty when the history is already ordered.
export function historyToReorder<T extends HistoryRow>(rows: T[]): T[] {
  const first = rows.findIndex((row, index) =>
    rows
      .slice(index + 1)
      .some((later) => Number(later.timestamp) < Number(row.timestamp)),
  );
  return first < 0
    ? []
    : rows
        .slice(first)
        .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}

export function inspectHistory(
  sourceNames: string[],
  rows: HistoryRow[],
  coveredHistory: HistoryRow[] = [],
) {
  const coveredNames = new Set(coveredHistory.map((row) => row.name));
  const seen = new Set<string>();
  const timestamps = new Set<string>();
  const errors: string[] = [];
  for (const row of rows) {
    if (seen.has(row.name))
      errors.push(`Duplicate executed migration: ${row.name}`);
    if (timestamps.has(String(row.timestamp)))
      errors.push(`Duplicate executed timestamp: ${row.timestamp}`);
    if (!row.name.endsWith(String(row.timestamp)))
      errors.push(`Name/timestamp mismatch: ${row.name}`);
    seen.add(row.name);
    timestamps.add(String(row.timestamp));
    if (QUARANTINED_MIGRATIONS.includes(row.name))
      errors.push(
        `Quarantined migration was executed: ${row.name}; reconcile this environment before proceeding`,
      );
  }
  if (new Set(sourceNames).size !== sourceNames.length)
    errors.push('Duplicate source migration names');
  const pending = sourceNames.filter((name) => !seen.has(name));
  const missingSource = rows
    .filter(
      (row) =>
        !sourceNames.includes(row.name) &&
        !coveredNames.has(row.name) &&
        !QUARANTINED_MIGRATIONS.includes(row.name),
    )
    .map((row) => row.name);
  const lastTimestamp = Math.max(
    0,
    ...rows.map((row) => Number(row.timestamp)),
  );
  for (const name of pending) {
    if (Number(name.slice(-13)) <= lastTimestamp)
      errors.push(`Out-of-order pending migration: ${name}`);
  }
  if (missingSource.length)
    errors.push(
      `${missingSource.length} executed migrations have no active source; recover history or approve a verified baseline first`,
    );
  return {
    pending,
    missingSource,
    coveredByBaseline: [...coveredNames],
    errors,
  };
}

// Read-only at PostgreSQL session level, including TypeORM initialization.
export function readOnlyDataSource(options: DataSourceOptions): DataSource {
  return new DataSource({
    ...options,
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: false,
    installExtensions: false,
    extra: {
      ...options.extra,
      options: '-c default_transaction_read_only=on -c statement_timeout=30000',
      connectionTimeoutMillis: 5000,
    },
  } as DataSourceOptions);
}

export async function migrationHistory(db: DataSource): Promise<HistoryRow[]> {
  const exists = (await db.query(
    `SELECT to_regclass('public.migrations') AS relation`,
  )) as { relation: string | null }[];
  return exists[0].relation
    ? ((await db.query(
        'SELECT id,timestamp,name FROM public.migrations ORDER BY id',
      )) as HistoryRow[])
    : [];
}

// Conservative allowlist: unknown SQL, enum replacements and destructive changes
// require a manual migration. Both forward and rollback SQL must be reviewed.
export function generationProblems(
  queries: string[],
  tables: string[],
): string[] {
  const problems: string[] = [];
  for (const sql of queries) {
    const target = sql.match(
      /^(?:CREATE TABLE|ALTER TABLE|CREATE (?:UNIQUE )?INDEX "[^"]+" ON)\s+(?:"public"\.)?"([^"]+)"/i,
    )?.[1];
    if (!target || !tables.includes(target))
      problems.push(`Outside approved tables or unsupported DDL: ${sql}`);
    if (
      /\b(DROP|RENAME|TRUNCATE|DELETE)\b|ALTER COLUMN[^;]*\bTYPE\b/i.test(sql)
    )
      problems.push(`Manual data-preserving migration required: ${sql}`);
  }
  return problems;
}
