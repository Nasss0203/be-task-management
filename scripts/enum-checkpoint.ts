import { createHash, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import {
  checkpointFor,
  dumpSchema,
  loadBaseline,
  schemaHash,
} from '../src/database/baseline';
import {
  EnumChange,
  enumAddedValues,
  enumSchemaBefore,
  enumTable,
  sqlTokens,
} from '../src/database/enum-additive-policy';
import { migrationHistory } from '../src/database/migration-safety';
import { verifyMigrationState } from '../src/database/migration-verification';
import { enumCatalog } from './enum-migration';

const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const requireProof = (ok: boolean, message: string) => {
  if (!ok) throw new Error(message);
};
const history = async (db: DataSource) =>
  (await migrationHistory(db)).map((row) => ({
    id: Number(row.id),
    timestamp: String(row.timestamp),
    name: row.name,
  }));
const hash = (text: string) => createHash('sha256').update(text).digest('hex');

async function dataFingerprints(db: DataSource) {
  const tables = await db.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'migrations' ORDER BY tablename",
  );
  const results: { table: string; count: number; sha256: string }[] = [];
  for (const { tablename } of tables) {
    requireProof(
      /^[a-z][a-z0-9_]*$/.test(tablename),
      'Unsupported fixture table identifier',
    );
    const rows = await db.query(
      `SELECT to_jsonb(t)::text AS row FROM public."${tablename}" t ORDER BY to_jsonb(t)::text COLLATE "C"`,
    );
    results.push({
      table: tablename,
      count: rows.length,
      sha256: hash(JSON.stringify(rows)),
    });
  }
  return results;
}

// Synthetic rows live only in a freshly initialized isolated cluster. FK triggers
// are disabled ONLY for fixture insertion; NOT NULL / CHECK / UNIQUE still apply.
// SET LOCAL is reset at commit, before any migration is run. No production rows
// or secrets are copied. Unsupported fixture shapes fail closed.
async function insertFixture(
  db: DataSource,
  change: EnumChange,
  value: string,
) {
  const columns = await db.query(
    `SELECT a.attname,t.typname,a.attnotnull,a.attgenerated,
    pg_get_expr(d.adbin,d.adrelid) AS default_expression
    FROM pg_attribute a JOIN pg_type t ON t.oid=a.atttypid
    LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid=$1::regclass AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum`,
    [`public.${change.table}`],
  );
  const names: string[] = [];
  const values: unknown[] = [];
  for (const column of columns) {
    requireProof(
      /^[a-z][a-z0-9_]*$/.test(column.attname),
      'Unsupported fixture column',
    );
    if (column.attname === change.column) {
      names.push(column.attname);
      values.push(value);
      continue;
    }
    if (column.attgenerated || column.default_expression || !column.attnotnull)
      continue;
    const sample =
      column.typname === 'uuid'
        ? randomUUID()
        : ['text', 'varchar', 'bpchar'].includes(column.typname)
          ? 'x'
          : ['int2', 'int4', 'int8', 'numeric', 'float4', 'float8'].includes(
                column.typname,
              )
            ? 1
            : column.typname === 'bool'
              ? false
              : ['timestamp', 'timestamptz', 'date'].includes(column.typname)
                ? '2026-01-01'
                : ['json', 'jsonb'].includes(column.typname)
                  ? '{}'
                  : undefined;
    requireProof(
      sample !== undefined,
      `Cannot safely construct enum fixture for ${change.table}.${column.attname}; manual integration review required`,
    );
    names.push(column.attname);
    values.push(sample);
  }
  const runner = db.createQueryRunner();
  try {
    await runner.startTransaction();
    await runner.query("SET LOCAL session_replication_role = 'replica'");
    await runner.query(
      `INSERT INTO ${enumTable(change)} (${names.map((name) => `"${name}"`).join(',')}) VALUES (${values.map((_, index) => `$${index + 1}`).join(',')})`,
      values,
    );
    await runner.commitTransaction();
  } catch (error) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
  }
  const role = await db.query('SHOW session_replication_role');
  requireProof(
    role[0].session_replication_role === 'origin',
    'Fixture trigger setting escaped its transaction',
  );
}

export async function verifyIsolatedEnum(
  db: DataSource,
  before: string,
  pending: string,
  systemIdentifier: string,
  change: EnumChange,
  expectedUp: string[],
  expectedDown: string[],
  journal: { query: string; parameters?: unknown[] }[],
) {
  const beforeCatalog = await enumCatalog(db, change.enumName);
  requireProof(
    equal(
      beforeCatalog.map((v) => v.label),
      change.oldValues,
    ),
    'Isolated enum input labels/order changed',
  );
  const historyBefore = await history(db);
  for (const value of change.oldValues) await insertFixture(db, change, value);
  const existingRowsBefore = await dataFingerprints(db);
  const validateJournal = (expected: string[], action: 'INSERT' | 'DELETE') => {
    const writes = journal.filter((item) =>
      /^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE|DO|LOCK|COPY|CALL)\b/i.test(
        item.query,
      ),
    );
    const historyWrites = writes.filter((item) =>
      new RegExp(`^${action} (?:INTO|FROM) (?:"public"\\.)?"migrations"`).test(
        item.query,
      ),
    );
    const ddl = writes.filter((item) => !historyWrites.includes(item));
    requireProof(
      historyWrites.length === 1 &&
        equal(
          ddl.map((item) => sqlTokens(item.query)),
          expected.map(sqlTokens),
        ),
      'Enum migration executed unapproved SQL or history writes',
    );
    return ddl.map((item) => sqlTokens(item.query));
  };
  journal.length = 0;
  const executed = await db.runMigrations({ transaction: 'each' });
  requireProof(
    executed.length === 1 && executed[0].name === pending,
    'Enum trial did not execute exactly the pending migration',
  );
  const executedUp = validateJournal(expectedUp, 'INSERT');
  const historyAfter = await history(db);
  requireProof(
    historyAfter.length === historyBefore.length + 1 &&
      equal(historyAfter.slice(0, -1), historyBefore) &&
      historyAfter.at(-1)?.name === pending,
    'Enum trial changed migration history unexpectedly',
  );
  const after = await dumpSchema(db);
  const untouchedSchemaHash = schemaHash(enumSchemaBefore(after, change));
  requireProof(
    untouchedSchemaHash === schemaHash(before),
    'Enum migration changed schema outside the approved label addition',
  );
  const afterCatalog = await enumCatalog(db, change.enumName);
  requireProof(
    equal(
      afterCatalog.map((v) => v.label),
      change.newValues,
    ) &&
      beforeCatalog.every((old) =>
        afterCatalog.some(
          (value) => value.label === old.label && value.oid === old.oid,
        ),
      ),
    'Enum order differs from metadata or existing enum values were replaced',
  );
  const existingRowsAfter = await dataFingerprints(db);
  requireProof(
    equal(existingRowsBefore, existingRowsAfter),
    'Enum migration altered existing fixture data',
  );
  const diff = await db.driver.createSchemaBuilder().log();
  requireProof(
    diff.upQueries.length === 0,
    'Enum result does not match the entire ORM metadata',
  );
  const baseline = loadBaseline();
  const incremental = historyAfter
    .filter((row) => Number(row.timestamp) > baseline.cutoff)
    .map((row) => row.name);
  if (checkpointFor(incremental, baseline)) {
    const output = await verifyMigrationState(db);
    requireProof(
      output.errors.length === 0 && output.history.pending.length === 0,
      'Published enum checkpoint failed independent post-migration verification',
    );
  }

  const blockedRollbacks: {
    value: string;
    schemaSha256: string;
    historySha256: string;
    dataSha256: string;
    result: string;
  }[] = [];
  for (const value of enumAddedValues(change)) {
    // A separate committed insert also proves the new label is usable after up.
    await insertFixture(db, change, value);
    const protectedData = await dataFingerprints(db);
    let blocked = false;
    try {
      await db.undoLastMigration({ transaction: 'each' });
    } catch {
      blocked = true;
    }
    requireProof(
      blocked &&
        schemaHash(await dumpSchema(db)) === schemaHash(after) &&
        equal(await history(db), historyAfter) &&
        equal(await dataFingerprints(db), protectedData),
      `Rollback did not safely preserve data/schema/history while '${value}' is in use`,
    );
    blockedRollbacks.push({
      value,
      schemaSha256: schemaHash(after),
      historySha256: hash(JSON.stringify(historyAfter)),
      dataSha256: hash(JSON.stringify(protectedData)),
      result: 'PASS',
    });
    await db.query(
      `DELETE FROM ${enumTable(change)} WHERE "${change.column}"::text=$1`,
      [value],
    );
  }
  requireProof(
    equal(await dataFingerprints(db), existingRowsBefore),
    'Blocked rollback tests did not preserve original fixture rows',
  );
  journal.length = 0;
  await db.undoLastMigration({ transaction: 'each' });
  const executedDown = validateJournal(expectedDown, 'DELETE');
  const rollback = await dumpSchema(db);
  const historyRollback = await history(db);
  const existingRowsRollback = await dataFingerprints(db);
  requireProof(
    schemaHash(rollback) === schemaHash(before) &&
      equal(historyRollback, historyBefore) &&
      equal(existingRowsRollback, existingRowsBefore),
    'Enum rollback did not restore schema/history and retain old-value data',
  );
  const restored = await verifyMigrationState(db);
  requireProof(
    restored.errors.length === 0,
    'Enum rollback failed baseline/history/integrity verification',
  );
  return {
    sql: after,
    evidence: {
      systemIdentifier,
      beforeHash: schemaHash(before),
      afterHash: schemaHash(after),
      rollbackHash: schemaHash(rollback),
      untouchedSchemaHash,
      historyBefore,
      historyAfter,
      historyRollback,
      existingRowsBefore,
      existingRowsAfter,
      existingRowsRollback,
      executedUp,
      executedDown,
      catalog: {
        labels: afterCatalog.map((v) => v.label),
        table: change.table,
        column: change.column,
      },
      enumVerification: {
        beforeCatalog,
        afterCatalog,
        blockedRollbacks,
        fixture:
          'synthetic-old-and-new-label-rows; transaction-local-fk-bypass-for-insertion-only',
        oldValueOidsPreserved: 'PASS',
        dataPreservation: 'PASS',
      },
      inputVerification: 'PASS',
      outputMetadataVerification: 'PASS',
    },
  };
}
