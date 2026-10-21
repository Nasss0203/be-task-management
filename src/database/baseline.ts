import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { DataSource } from 'typeorm';
import { BASELINE_CUTOFF, BASELINE_VERSION } from './baseline-config';
import { migrationHistory, type HistoryRow } from './migration-safety';
import { loadAutomaticCheckpoints } from './automatic-checkpoint';
export type BaselineManifest = {
  version: string;
  cutoff: number;
  postgresMajor: number;
  sqlSha256: string;
  tableCount: number;
  legacyHistory: HistoryRow[];
  checkpoints: {
    applied: string[];
    schemaSha256: string;
    evidence: string;
    schemaFile?: string;
  }[];
  roundtrip?: { file: string; schemaSha256: string };
};
const execute = promisify(execFile);
export function activeMigrationNames(db: DataSource): string[] {
  const names = db.migrations.map(
    (migration) => migration.name ?? migration.constructor.name,
  );
  if (
    names.some(
      (name) =>
        !/\d{13}$/.test(name) || Number(name.slice(-13)) <= BASELINE_CUTOFF,
    )
  )
    throw new Error(
      'Active migration class must belong to the incremental baseline epoch',
    );
  return names.sort((a, b) => Number(a.slice(-13)) - Number(b.slice(-13)));
}
export function baselineDirectory(): string {
  const direct = join(__dirname, 'baselines', BASELINE_VERSION);
  return existsSync(direct)
    ? direct
    : join(__dirname, 'database/baselines', BASELINE_VERSION);
}
// Keep all DDL/function bodies. Only remove random psql restriction keys and
// tool/server version headers, plus platform line endings, from fingerprints.
export function canonicalSchema(sql: string): string {
  const lines = sql.replace(/\r\n/g, '\n').split('\n');
  const firstSQL = lines.findIndex(
    (line) =>
      line.trim() &&
      !line.startsWith('--') &&
      !/^\\restrict [A-Za-z0-9]+$/.test(line),
  );
  let lastContent = lines.length - 1;
  while (lastContent >= 0 && !lines[lastContent].trim()) lastContent--;
  return (
    lines
      .filter((line, index) => {
        if (
          index < firstSQL &&
          (/^\\restrict [A-Za-z0-9]+$/.test(line) ||
            /^-- Dumped (?:from database|by pg_dump) version /.test(line))
        )
          return false;
        return !(
          index === lastContent && /^\\unrestrict [A-Za-z0-9]+$/.test(line)
        );
      })
      .join('\n')
      .trim() + '\n'
  );
}
export function schemaHash(sql: string): string {
  // Historical hashes must remain unchanged.
  return createHash('sha256').update(canonicalSchema(sql)).digest('hex');
}

// PostgreSQL 18 can dump this *reviewed* constraint with either form.
// This comparison is intentionally narrow: do not normalize arbitrary SQL,
// and do not alter artifact fingerprints recorded in manifest.json.
const CHECK_VISIBILITY_OVERRIDE =
  'CONSTRAINT "CK_page_publications_visibility_override"';
const VISIBILITY_ARRAY_CAST =
  "(ARRAY['PUBLISHED'::character varying, 'UNPUBLISHED'::character varying])::text[]";
const VISIBILITY_ELEMENT_CASTS =
  "ARRAY[('PUBLISHED'::character varying)::text, ('UNPUBLISHED'::character varying)::text]";

export function comparableReviewedSchema(sql: string): string {
  return canonicalSchema(sql)
    .split('\n')
    .map((line) => {
      if (!line.includes(CHECK_VISIBILITY_OVERRIDE)) return line;
      return line.replace(VISIBILITY_ARRAY_CAST, VISIBILITY_ELEMENT_CASTS);
    })
    .join('\n');
}
export function loadBaseline(): BaselineManifest {
  const manifest = JSON.parse(
    readFileSync(join(baselineDirectory(), 'manifest.json'), 'utf8'),
  ) as BaselineManifest;
  if (
    manifest.version !== BASELINE_VERSION ||
    manifest.cutoff !== BASELINE_CUTOFF
  )
    throw new Error('Unknown baseline version/cutoff');
  const sql = readFileSync(join(baselineDirectory(), 'schema.sql'), 'utf8');
  if (
    !manifest.checkpoints.some(
      (checkpoint) =>
        checkpoint.applied.length === 0 &&
        checkpoint.schemaSha256 === manifest.sqlSha256,
    ) ||
    manifest.checkpoints.some(
      (checkpoint) => !/^[a-f0-9]{64}$/.test(checkpoint.schemaSha256),
    )
  )
    throw new Error('Baseline requires reviewed SHA-256 schema checkpoints');
  if (schemaHash(sql) !== manifest.sqlSha256)
    throw new Error('Baseline SQL integrity mismatch');
  for (const checkpoint of manifest.checkpoints) {
    if (!checkpoint.schemaFile) continue;
    if (!/^checkpoints\/[a-z0-9-]+\.sql$/.test(checkpoint.schemaFile))
      throw new Error('Invalid checkpoint evidence path');
    const snapshot = readFileSync(
      join(baselineDirectory(), checkpoint.schemaFile),
      'utf8',
    );
    if (schemaHash(snapshot) !== checkpoint.schemaSha256)
      throw new Error(
        `Checkpoint SQL integrity mismatch: ${checkpoint.schemaFile}`,
      );
  }
  if (
    /^(?:COPY |INSERT INTO |SELECT pg_catalog\.setval|CREATE DATABASE|\\connect|BEGIN;|COMMIT;)/m.test(
      sql,
    )
  )
    throw new Error('Baseline must be schema-only and transaction-safe');
  // Git may check out SQL with CRLF on Windows. Normalize line endings only;
  // preserve strict validation of every metacommand and its restriction key.
  const meta = [...sql.replace(/\r\n/g, '\n').matchAll(/^\\([^\n]+)$/gm)].map(
    (match) => match[1],
  );
  if (
    meta.length !== 2 ||
    !/^restrict [A-Za-z0-9]+$/.test(meta[0]) ||
    meta[1] !== meta[0].replace(/^restrict /, 'unrestrict ')
  )
    throw new Error('Baseline has unreviewed or unbalanced psql metacommands');
  if (
    /\bprice_amount\b|\bCHK_template_listings_pricing\b/.test(sql) ||
    !/CREATE TYPE public\.template_listings_offer_type_enum AS ENUM \(\s*'FREE'\s*\);/.test(
      sql,
    )
  )
    throw new Error('Pre-pricing baseline cannot contain pricing changes');
  const tableCount = sql.match(/^CREATE TABLE /gm)?.length ?? 0;
  if (tableCount !== manifest.tableCount)
    throw new Error('Baseline table inventory mismatch');
  if (manifest.roundtrip) {
    if (manifest.roundtrip.file !== 'roundtrip-schema.sql')
      throw new Error('Unexpected roundtrip artifact path');
    const restored = readFileSync(
      join(baselineDirectory(), manifest.roundtrip.file),
      'utf8',
    );
    const originalCast =
      "(ARRAY['PUBLISHED'::character varying, 'UNPUBLISHED'::character varying])::text[]";
    const restoredCast =
      "ARRAY[('PUBLISHED'::character varying)::text, ('UNPUBLISHED'::character varying)::text]";
    if (
      schemaHash(restored) !== manifest.roundtrip.schemaSha256 ||
      canonicalSchema(restored) !==
        canonicalSchema(sql).replace(originalCast, restoredCast)
    )
      throw new Error(
        'Roundtrip evidence differs beyond the reviewed equivalent array cast',
      );
  }
  manifest.checkpoints.push(
    ...loadAutomaticCheckpoints(
      baselineDirectory(),
      manifest.checkpoints,
      schemaHash,
    ),
  );
  return manifest;
}
export function postgresTool(name: 'pg_dump' | 'psql'): string {
  const configured =
    process.env[name === 'pg_dump' ? 'PG_DUMP_BIN' : 'PSQL_BIN'];
  const windows = `C:/Program Files/PostgreSQL/18/bin/${name}.exe`;
  return (
    configured ??
    (process.platform === 'win32' && existsSync(windows) ? windows : name)
  );
}
export function postgresEnvironment(
  db: DataSource,
  readonly = true,
): NodeJS.ProcessEnv {
  if (db.options.type !== 'postgres' || db.options.url)
    throw new Error(
      'Baseline tools require explicit DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME configuration',
    );
  if (
    typeof db.options.password !== 'string' &&
    db.options.password !== undefined
  )
    throw new Error(
      'Baseline client requires a configured password string, not a provider callback',
    );
  return {
    ...process.env,
    PGHOST: db.options.host ?? 'localhost',
    PGPORT: String(db.options.port ?? 5432),
    PGUSER: db.options.username,
    PGPASSWORD: db.options.password,
    PGDATABASE: String(db.options.database),
    PGOPTIONS: readonly
      ? '-c default_transaction_read_only=on -c statement_timeout=30000'
      : '-c statement_timeout=30000 -c lock_timeout=10000',
  };
}
export async function dumpSchema(
  db: DataSource,
  excludeTables: string[] = [],
): Promise<string> {
  if (excludeTables.some((table) => !/^[a-z][a-z0-9_]*$/.test(table))) {
    throw new Error('Invalid schema dump exclusion');
  }
  const tool = postgresTool('pg_dump');
  const { stdout: version } = await execute(tool, ['--version']);
  if (!/\b18\./.test(version))
    throw new Error('Baseline fingerprint requires PostgreSQL 18 pg_dump');
  const { stdout } = await execute(
    tool,
    [
      '--schema-only',
      '--no-owner',
      '--no-privileges',
      ...excludeTables.map((table) => `--exclude-table=public.${table}`),
    ],
    {
      env: postgresEnvironment(db),
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
    },
  );
  return stdout;
}
function normalizedHistory(rows: HistoryRow[]) {
  return rows
    .map(({ id, timestamp, name }) => ({
      id: Number(id),
      timestamp: String(timestamp),
      name,
    }))
    .sort((a, b) => a.id - b.id);
}
export function baselineLineage(
  rows: HistoryRow[],
  manifest: BaselineManifest,
) {
  const legacy = rows.filter((row) => Number(row.timestamp) <= manifest.cutoff);
  const incremental = rows.filter(
    (row) => Number(row.timestamp) > manifest.cutoff,
  );
  const matchesLegacy =
    JSON.stringify(normalizedHistory(legacy)) ===
    JSON.stringify(normalizedHistory(manifest.legacyHistory));
  return {
    mode: legacy.length === 0 ? 'baseline' : 'legacy',
    valid: legacy.length === 0 || matchesLegacy,
    legacy,
    incremental,
  };
}
/** Names the first differing line so a schema mismatch can be investigated. */
export function firstSchemaDifference(
  expected: string,
  actual: string,
): string {
  const want = comparableReviewedSchema(expected).split('\n');
  const got = comparableReviewedSchema(actual).split('\n');
  const line = want.findIndex((text, index) => text !== got[index]);
  if (line < 0)
    return got.length > want.length
      ? `Extra line ${want.length + 1}: ${got[want.length]}`
      : 'No line differs after normalization.';
  return `First difference at line ${line + 1}: expected "${want[line]}", found "${got[line] ?? '<end of dump>'}"`;
}
/** Legacy migrations executed on only one side, ignoring ids and execution order. */
export function legacyHistoryDiff(legacy: HistoryRow[], frozen: HistoryRow[]) {
  const actual = new Set(legacy.map((row) => row.name));
  const expected = new Set(frozen.map((row) => row.name));
  return {
    missing: [...expected].filter((name) => !actual.has(name)),
    extra: [...actual].filter((name) => !expected.has(name)),
  };
}
export function checkpointFor(names: string[], manifest: BaselineManifest) {
  return manifest.checkpoints.find(
    (checkpoint) =>
      JSON.stringify(checkpoint.applied) === JSON.stringify(names),
  );
}
export async function verifyBaseline(
  db: DataSource,
  rows: HistoryRow[],
  sourceNames: string[],
) {
  const manifest = loadBaseline();
  const lineage = baselineLineage(rows, manifest);
  const applied = lineage.incremental.map((row) => row.name);
  const errors: string[] = [];
  if (!lineage.valid)
    errors.push(
      'Legacy history does not exactly match the frozen 45-row baseline anchor',
    );
  if (lineage.incremental.some((row, index) => row.name !== sourceNames[index]))
    errors.push(
      'Incremental history must be an ordered prefix of the active source',
    );
  const checkpoint = checkpointFor(applied, manifest);
  if (!checkpoint)
    errors.push(
      'No reviewed schema checkpoint for this incremental history; capture and review evidence on an isolated database',
    );
  const identity = (await db.query(
    `SELECT current_database() AS database, current_setting('server_version_num')::int AS version`,
  )) as { database: string; version: number }[];
  if (Math.floor(identity[0].version / 10000) !== manifest.postgresMajor)
    errors.push('Server major differs from the verified baseline');
  const liveSchema = await dumpSchema(db);
  const actualHash = schemaHash(liveSchema);
  const equivalentBaseline =
    applied.length === 0 && actualHash === manifest.roundtrip?.schemaSha256;

  let equivalentReviewedCheckpoint = false;
  if (checkpoint?.schemaFile && actualHash !== checkpoint.schemaSha256) {
    // loadBaseline() already verified this evidence file's SHA-256.
    const checkpointSql = readFileSync(
      join(baselineDirectory(), checkpoint.schemaFile),
      'utf8',
    );
    equivalentReviewedCheckpoint =
      comparableReviewedSchema(liveSchema) ===
      comparableReviewedSchema(checkpointSql);
  }

  if (
    checkpoint &&
    actualHash !== checkpoint.schemaSha256 &&
    !equivalentBaseline &&
    !equivalentReviewedCheckpoint
  ) {
    const expectedSql = readFileSync(
      join(baselineDirectory(), checkpoint.schemaFile ?? 'schema.sql'),
      'utf8',
    );
    errors.push(
      `Live schema differs from the reviewed baseline/checkpoint. ${firstSchemaDifference(expectedSql, liveSchema)}`,
    );
  }
  // pg_dump and history queries use separate read-only snapshots; fail on any
  // observed concurrent history change, and require a maintenance window for DDL.
  const latest = await migrationHistory(db);
  if (
    JSON.stringify(normalizedHistory(rows)) !==
    JSON.stringify(normalizedHistory(latest))
  )
    errors.push('Migration history changed during baseline verification');
  return {
    version: manifest.version,
    mode: lineage.mode,
    schemaSha256: actualHash,
    applied,
    coveredHistory: errors.length ? [] : lineage.legacy,
    errors,
  };
}
export function checkpointEvidenceGaps(
  sourceNames: string[],
  manifest = loadBaseline(),
): string[] {
  // Report future evidence needed for post-migration verification and retry.
  return sourceNames.flatMap((_, index) =>
    checkpointFor(sourceNames.slice(0, index + 1), manifest)
      ? []
      : [
          `Incremental state through ${sourceNames[index]} has no approved schema checkpoint; integration verification is required to verify that state and retry from it`,
        ],
  );
}
export const EMPTY_DATABASE_SQL = `SELECT object FROM (
  SELECT 'schema ' || nspname AS object FROM pg_namespace
    WHERE nspname NOT IN ('public','information_schema','pg_catalog','pg_toast') AND nspname !~ '^pg_(toast_)?temp_[0-9]+$'
  UNION ALL SELECT 'relation ' || n.nspname || '.' || c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
  UNION ALL SELECT 'type ' || n.nspname || '.' || t.typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public'
  UNION ALL SELECT 'function ' || n.nspname || '.' || p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
  UNION ALL SELECT 'extension ' || extname FROM pg_extension WHERE extname <> 'plpgsql'
) objects ORDER BY object`;
export function bootstrapGuard(database: string): string {
  const literal = "'" + database.replace(/'/g, "''") + "'";
  return `SELECT pg_advisory_xact_lock(1791700000, 1);
DO $taskmanly_guard$ BEGIN
  IF current_database() <> ${literal} THEN RAISE EXCEPTION 'Unexpected bootstrap database'; END IF;
  IF EXISTS (${EMPTY_DATABASE_SQL}) THEN RAISE EXCEPTION 'Baseline bootstrap requires an empty database, even when existing tables contain zero rows'; END IF;
END $taskmanly_guard$;\n`;
}
