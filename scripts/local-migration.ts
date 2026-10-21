import 'reflect-metadata';

import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';

import { renderMigration } from './migration-approval';
import {
  activeMigrationNames,
  baselineLineage,
  checkpointFor,
  legacyHistoryDiff,
  loadBaseline,
  verifyBaseline,
} from '../src/database/baseline';
import { migrationFiles } from '../src/database/database-options';
import { migrationIntegrityProblems } from '../src/database/migration-integrity';
import {
  historyToReorder,
  inspectHistory,
  migrationHistory,
  readOnlyDataSource,
  type HistoryRow,
} from '../src/database/migration-safety';
import source from '../src/database/data-source';

const migrationDirectory = join(process.cwd(), 'src/database/migrations');
const manifestPath = join(
  process.cwd(),
  'src/database/migration-review-manifest.json',
);

function fileHash(file: string): string {
  return createHash('sha256')
    .update(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))
    .digest('hex');
}

// Record immutable bytes; this is an integrity snapshot, not SQL approval.
function registerGeneratedFile(file: string): void {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    files: { file: string; sha256: string; approval?: unknown }[];
  };
  if (manifest.files.some((item) => item.file === basename(file)))
    throw new Error(
      `Migration integrity record already exists: ${basename(file)}`,
    );
  manifest.files.push({ file: basename(file), sha256: fileHash(file) });
  const temporary = `${manifestPath}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, JSON.stringify(manifest, null, 2) + '\n', {
      flag: 'wx',
    });
    renameSync(temporary, manifestPath);
  } finally {
    try {
      unlinkSync(temporary);
    } catch {
      // The rename consumed the temporary file.
    }
  }
}

// This is a guard for data loss, not a list of SQL that TypeORM may generate.
const destructive = [
  /\bDROP\s+(?:TABLE|COLUMN|SCHEMA|TYPE)\b/i,
  /\bTRUNCATE\b|\bDELETE\s+FROM\b/i,
  /\bALTER\s+TABLE\b[\s\S]*\bALTER\s+COLUMN\b[\s\S]*\b(?:SET\s+DATA\s+TYPE|TYPE)\b/i,
  /\bALTER\s+TABLE\b[\s\S]*\bALTER\s+COLUMN\b[\s\S]*\bSET\s+NOT\s+NULL\b/i,
];

export function assertSafeStatements(statements: string[]): void {
  const risky = statements.filter((sql) =>
    destructive.some((pattern) => pattern.test(sql)),
  );
  if (risky.length && process.env.MIGRATION_ALLOW_DESTRUCTIVE !== '1') {
    throw new Error(
      `Potentially destructive migration SQL detected:\n${risky.join('\n')}\n` +
        'Review the generated migration and set MIGRATION_ALLOW_DESTRUCTIVE=1 to generate or run it.',
    );
  }
  if (risky.length)
    console.warn(
      `WARNING: ${risky.length} potentially destructive SQL statement(s).`,
    );
}

function generatedStatements(file: string): string[] | null {
  const content = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const match = basename(file).match(/^(\d{13})-([A-Za-z][A-Za-z0-9]+)\.ts$/);
  if (!match) return null;
  const split = content.indexOf('  async down(');
  if (split < 0) return null;
  const parse = (part: string) =>
    [...part.matchAll(/    await runner\.query\(("(?:[^"\\]|\\.)*")\);/g)].map(
      (item) => JSON.parse(item[1]) as string,
    );
  const up = parse(content.slice(0, split));
  const down = parse(content.slice(split));
  return content === renderMigration(match[2], Number(match[1]), up, down)
    ? up
    : null;
}

// After a merge, a local database may already hold newer migrations than one
// that just arrived. Only local databases may apply it out of order.
function isLocalDatabase(options: DataSourceOptions): boolean {
  const host = (options as { host?: string }).host;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

async function inspect(db: DataSource, allowOutOfOrder = false) {
  const names = activeMigrationNames(db);
  const rows = await migrationHistory(db);
  const baseline = loadBaseline();
  const lineage = baselineLineage(rows, baseline);
  // The frozen history records one machine's ids and order. Another developer's
  // local database only needs to have executed the same legacy migrations.
  const diff = legacyHistoryDiff(lineage.legacy, baseline.legacyHistory);
  const sameLegacy = !diff.missing.length && !diff.extra.length;
  if (!lineage.valid && !(sameLegacy && isLocalDatabase(db.options)))
    throw new Error(
      [
        `Migration history before the baseline (timestamp <= ${baseline.cutoff}) differs from the frozen baseline.`,
        ...(diff.missing.length
          ? [`  Not executed in this database: ${diff.missing.join(', ')}`]
          : []),
        ...(diff.extra.length
          ? [
              `  Executed here but not in the baseline: ${diff.extra.join(', ')}`,
            ]
          : []),
        sameLegacy
          ? '  Only ids or order differ, which is accepted for localhost databases only.'
          : '  This database predates the baseline with a different schema. Back up any data you need, then recreate it from the baseline (docs/database-baseline.md).',
      ].join('\n'),
    );
  const applied = lineage.incremental.map((row) => row.name);
  const outOfOrder = applied.some((name, index) => names[index] !== name);
  if (
    outOfOrder &&
    !(allowOutOfOrder && applied.every((name) => names.includes(name)))
  )
    throw new Error(
      'Executed migrations are not an ordered prefix of source migrations.' +
        (isLocalDatabase(db.options)
          ? ' A merge brought in an older migration; run `npm run migration:run` first.'
          : ''),
    );
  const history = inspectHistory(names, rows, lineage.legacy);
  const historyErrors = history.errors.filter(
    (error) =>
      !(allowOutOfOrder && error.startsWith('Out-of-order pending migration:')),
  );
  if (historyErrors.length) throw new Error(historyErrors.join('\n'));
  const integrity = migrationIntegrityProblems().filter(
    (problem) =>
      !problem.startsWith(
        'Active migration lacks a reviewed integrity record:',
      ),
  );
  if (integrity.length) throw new Error(integrity.join('\n'));
  // verifyBaseline requires the exact frozen history, so a local database
  // accepted above with different ids falls back to the lighter check below.
  if (lineage.valid && checkpointFor(applied, baseline)) {
    const verified = await verifyBaseline(db, rows, names);
    if (verified.errors.length) throw new Error(verified.errors.join('\n'));
  } else {
    const identity = (await db.query(
      `SELECT current_setting('server_version_num')::int AS version`,
    )) as { version: number }[];
    if (Math.floor(identity[0].version / 10000) !== baseline.postgresMajor)
      throw new Error('PostgreSQL major differs from the baseline.');
    console.warn(
      'No schema checkpoint for this newer migration state. History is valid, but unrelated schema drift cannot be ruled out; review migration SQL.',
    );
  }
  return { names, rows, history, outOfOrder };
}

// Rewrite incremental history in timestamp order, as a fresh database would
// record it, so the strict prefix checks pass again.
async function reorderHistory(db: DataSource): Promise<void> {
  const cutoff = loadBaseline().cutoff;
  await db.transaction(async (manager) => {
    const rows: HistoryRow[] = await manager.query(
      'SELECT id, timestamp, name FROM public.migrations WHERE timestamp > $1 ORDER BY id',
      [cutoff],
    );
    const moved = historyToReorder(rows);
    if (!moved.length) return;
    await manager.query('DELETE FROM public.migrations WHERE name = ANY($1)', [
      moved.map((row) => row.name),
    ]);
    for (const row of moved)
      await manager.query(
        'INSERT INTO public.migrations (timestamp, name) VALUES ($1, $2)',
        [row.timestamp, row.name],
      );
    console.log(
      `Reordered ${moved.length} migration history row(s) to source order.`,
    );
  });
}

export async function generateMigration(
  options: DataSourceOptions = source.options,
  directory = migrationDirectory,
): Promise<string | null> {
  const db = readOnlyDataSource(options);
  try {
    await db.initialize();
    const { names, rows, history } = await inspect(db);
    if (history.pending.length)
      throw new Error(
        `Run pending migration(s) before generating another: ${history.pending.join(', ')}`,
      );
    const diff = await db.driver.createSchemaBuilder().log();
    const up = diff.upQueries.map((query) => query.query);
    // TypeORM's migration generator reverses rollback queries so dependent
    // constraints and indexes are removed before their table.
    const down = diff.downQueries.map((query) => query.query).reverse();
    if (!up.length) {
      console.log('No schema changes; no migration created.');
      return null;
    }
    if (
      [...diff.upQueries, ...diff.downQueries].some(
        (query) => query.parameters?.length,
      )
    )
      throw new Error(
        'Parameterized schema diff requires an explicit migration.',
      );
    assertSafeStatements(up);
    const timestamp = Math.max(
      Date.now(),
      ...names.map((name) => Number(name.slice(-13)) + 1),
      ...rows.map((row) => Number(row.timestamp) + 1),
    );
    const table = up
      .find((sql) => /^CREATE TABLE\s/i.test(sql))
      ?.match(/^CREATE TABLE\s+(?:"public"\.)?"([a-z][a-z0-9_]*)"/i)?.[1];
    const name = table
      ? `Create${table
          .split('_')
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join('')}`
      : 'UpdateSchema';
    const content = renderMigration(name, timestamp, up, down);
    mkdirSync(directory, { recursive: true });
    const file = join(directory, `${timestamp}-${name}.ts`);
    writeFileSync(file, content, { flag: 'wx' });
    if (resolve(directory) === resolve(migrationDirectory)) {
      try {
        registerGeneratedFile(file);
      } catch (error) {
        unlinkSync(file);
        throw error;
      }
    }
    console.log(
      `Created ${file} (${up.length} up, ${down.length} down statements).`,
    );
    return file;
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}

export async function runMigrations(
  options: DataSourceOptions = source.options,
): Promise<string[]> {
  const readOnly = readOnlyDataSource(options);
  let pending: string[];
  let outOfOrder: boolean;
  try {
    await readOnly.initialize();
    const inspected = await inspect(readOnly, isLocalDatabase(options));
    pending = inspected.history.pending;
    outOfOrder = inspected.outOfOrder;
  } finally {
    if (readOnly.isInitialized) await readOnly.destroy();
  }
  if (!pending.length && !outOfOrder) {
    console.log('No pending migrations.');
    return [];
  }
  const files =
    (options.migrations as string[] | undefined) ?? migrationFiles();
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    files: { file: string; sha256: string; approval?: unknown }[];
  };
  for (const name of pending) {
    // Match on the unique timestamp: older files are kebab-case
    // (add-paid-template-offer) while their class is AddPaidTemplateOffer.
    const file = files.find((candidate) => {
      const match = basename(candidate).match(/^(\d{13})-(.+)\.(?:ts|js)$/);
      return match && name.endsWith(match[1]);
    });
    if (!file) throw new Error(`Source file missing for ${name}`);
    const record = manifest.files.find((item) => item.file === basename(file));
    if (record) {
      if (fileHash(file) !== record.sha256)
        throw new Error(`Reviewed migration changed: ${name}`);
      // Its author already confirmed destructive SQL at generate time; the
      // hash proves it is unchanged, so local databases need not confirm again.
      if (!record.approval && !isLocalDatabase(options)) {
        const statements = generatedStatements(file);
        if (statements) assertSafeStatements(statements);
      }
    } else {
      const statements = generatedStatements(file);
      if (!statements)
        throw new Error(
          `Unreviewed migration is not generated by migration:generate: ${name}`,
        );
      assertSafeStatements(statements);
    }
  }
  const db = new DataSource({
    ...options,
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'each',
    dropSchema: false,
  } as DataSourceOptions);
  try {
    await db.initialize();
    const executed = await db.runMigrations({ transaction: 'each' });
    console.log(`Executed ${executed.length} migration(s).`);
    if (outOfOrder) await reorderHistory(db);
    return executed.map(
      (migration) => migration.name ?? migration.constructor.name,
    );
  } catch (error) {
    throw new Error(
      `Migration execution failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}

if (require.main === module) {
  const action = process.argv[2];
  const task =
    action === 'generate'
      ? // After a merge, apply teammates' migrations first so the diff holds
        // only this branch's entity changes.
        (isLocalDatabase(source.options)
          ? runMigrations()
          : Promise.resolve()
        ).then(() => generateMigration())
      : action === 'run'
        ? runMigrations()
        : Promise.reject(new Error('Use generate or run'));
  task.catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Migration failed');
    process.exitCode = 1;
  });
}
