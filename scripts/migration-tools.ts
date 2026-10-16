import 'reflect-metadata';

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { prepareAutomaticCheckpoint } from './automatic-checkpoint';
import { runMigrationPrepare } from './migration-prepare';
import { migrationFiles } from '../src/database/database-options';
import {
  automaticGenerationOptions,
  registerAutomaticIntegrity,
  renderMigration,
  verifyAutomaticCandidate,
  readStaticCandidate,
} from './migration-approval';
import { detectEnumChange, enumGenerationOptions } from './enum-migration';
import { migrationIntegrityProblems } from '../src/database/migration-integrity';

import source from '../src/database/data-source';
import {
  generationProblems,
  readOnlyDataSource,
} from '../src/database/migration-safety';
import {
  verificationSummary,
  verifyMigrationState,
} from '../src/database/migration-verification';

type MigrationCommand = 'audit' | 'check' | 'generate' | 'prepare';

type GenerationOptions = {
  name: string;
  tables: string[];
};

/**
 * Supports both:
 *   npm run migration:generate
 *   npm run migration:generate -- CreateTemplatePurchases --tables=template_purchases
 *
 * Explicit arguments retain their existing scope validation and missing-value
 * prompts. Automatic generation has a separate, narrower SQL allowlist.
 */
async function resolveGenerationOptions(
  args: string[],
): Promise<GenerationOptions> {
  const positional = args.filter((arg) => !arg.startsWith('--'));
  const tableFlags = args.filter((arg) => arg.startsWith('--tables='));
  const unknownFlags = args.filter(
    (arg) => arg.startsWith('--') && !arg.startsWith('--tables='),
  );

  if (positional.length > 1 || tableFlags.length > 1 || unknownFlags.length) {
    throw new Error(
      'Usage: migration:generate [PascalCaseName] [--tables=table_one,table_two]',
    );
  }

  let name = positional[0]?.trim();
  let tableScope = tableFlags[0]?.slice('--tables='.length).trim();

  if (!name || !tableScope) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error(
        'Non-interactive generation requires a PascalCase name and --tables=table_one,table_two',
      );
    }

    const prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      if (!name) {
        name = (await prompt.question('Migration name (PascalCase): ')).trim();
      }
      if (!tableScope) {
        tableScope = (
          await prompt.question('Affected tables (comma separated): ')
        ).trim();
      }
    } finally {
      prompt.close();
    }
  }

  if (!name || !/^[A-Z][A-Za-z0-9]+$/.test(name)) {
    throw new Error('Migration name must be descriptive PascalCase');
  }

  const tables = (tableScope ?? '').split(',').map((table) => table.trim());
  if (
    !tables.length ||
    tables.some((table) => !/^[a-z][a-z0-9_]*$/.test(table)) ||
    new Set(tables).size !== tables.length
  ) {
    throw new Error('Table scope must contain unique snake_case table names');
  }

  return { name, tables };
}

async function main(): Promise<void> {
  const command = process.argv[2] as MigrationCommand | undefined;
  if (
    command !== 'audit' &&
    command !== 'check' &&
    command !== 'generate' &&
    command !== 'prepare'
  ) {
    throw new Error(
      'Use audit, check, generate, or prepare; execution checks use migration:preflight',
    );
  }

  if (command === 'prepare') {
    return await runMigrationPrepare();
  }

  const args = process.argv.slice(3);
  if (command === 'generate' && !args.length) {
    const invalid = migrationIntegrityProblems().filter(
      (error) =>
        !error.startsWith(
          'Active migration lacks a reviewed integrity record: ',
        ),
    );
    if (invalid.length) throw new Error(invalid.join('\n'));
    const manifest = JSON.parse(
      readFileSync(
        join(process.cwd(), 'src/database/migration-review-manifest.json'),
        'utf8',
      ),
    ) as { files: { file: string }[] };
    for (const file of migrationFiles()) {
      if (!manifest.files.some((record) => record.file === basename(file))) {
        // TypeORM loads migration modules during initialize(). Reject executable
        // code outside the generator template before loading an unapproved file.
        const content = readFileSync(file, 'utf8');
        const candidate = readStaticCandidate(file, content);
        if (candidate.identity[2].startsWith('Create'))
          verifyAutomaticCandidate(file, content);
      }
    }
  }

  const db = readOnlyDataSource(source.options);
  try {
    await db.initialize();
    console.log(
      JSON.stringify({
        host: db.options.type === 'postgres' ? db.options.host : undefined,
        database: db.options.database,
        schema: 'public',
        access: 'read-only',
      }),
    );

    const state = await verifyMigrationState(db);
    const { rows, names, history, errors } = state;
    const diff = await db.driver.createSchemaBuilder().log();
    const queries = diff.upQueries.map((query) => query.query);
    const rollback = diff.downQueries.map((query) => query.query);

    console.log(JSON.stringify(verificationSummary(state), null, 2));
    for (const query of diff.upQueries) console.log(`${query.query};`);

    if (command === 'audit') return;

    if (command === 'check') {
      if (errors.length || diff.upQueries.length || history.pending.length) {
        throw new Error(
          'Migration verification blocked; review the history and SQL above. No database writes were performed.',
        );
      }
      return;
    }

    // Recover one verified pending generator artifact instead of generating a
    // duplicate. Only its missing integrity record is eligible for repair.
    if (!args.length && history.pending.length === 1) {
      const pending = history.pending[0];
      const file = migrationFiles().find(
        (file) =>
          basename(file)
            .replace(/^\d{13}-/, '')
            .replace(/\.ts$/, '') +
            basename(file).slice(0, 13) ===
          pending,
      );
      const missingRecord = file
        ? `Active migration lacks a reviewed integrity record: ${basename(file)}`
        : undefined;
      if (!file || errors.some((error) => error !== missingRecord)) {
        throw new Error(
          'Pending automatic approval blocked by baseline/history/integrity verification',
        );
      }
      const timestamp = Number(basename(file).slice(0, 13));
      if (
        timestamp > Date.now() ||
        rows.some((row) => Number(row.timestamp) >= timestamp)
      ) {
        throw new Error(
          'Pending automatic approval blocked by timestamp ordering',
        );
      }
      if (
        [...diff.upQueries, ...diff.downQueries].some(
          (query) => query.parameters?.length,
        )
      ) {
        throw new Error('Parameterized schema queries require manual review');
      }
      const change = await detectEnumChange(db);
      const manifest = JSON.parse(
        readFileSync(
          join(process.cwd(), 'src/database/migration-review-manifest.json'),
          'utf8',
        ),
      );
      const record = manifest.files.find(
        (item: any) => item.file === basename(file),
      );
      const approval =
        record?.approval?.kind === 'manual'
          ? 'existing'
          : registerAutomaticIntegrity(file, queries, rollback, change);
      const verified = await verifyMigrationState(db);
      if (verified.errors.length) throw new Error(verified.errors.join('\n'));
      await prepareAutomaticCheckpoint(db, file, queries, rollback, change);
      console.log(
        `Pending migration verified; integrity ${approval === 'registered' ? 'automatically registered' : 'record retained'}: ${basename(file)}. No duplicate generated.`,
      );
      return;
    }

    // Reject invalid history before offering an interactive generation prompt.
    if (errors.length || history.pending.length) {
      throw new Error(
        'Generation blocked: resolve baseline/history verification and pending migrations first.',
      );
    }

    if (!diff.upQueries.length) {
      console.log('No schema changes');
      return;
    }

    const change = args.length ? undefined : await detectEnumChange(db);
    const enumOptions = change ? enumGenerationOptions(change) : undefined;
    const { name, tables } = args.length
      ? await resolveGenerationOptions(args)
      : (enumOptions ?? automaticGenerationOptions(queries));

    const problems = change ? [] : generationProblems(queries, tables);
    if (problems.length) {
      for (const problem of problems) console.error(problem);
      throw new Error(
        'Generation blocked: out-of-scope or destructive SQL detected. Review the entity metadata and database drift; do not bypass this check.',
      );
    }

    if (
      [...diff.upQueries, ...diff.downQueries].some(
        (query) => query.parameters?.length,
      )
    ) {
      throw new Error(
        'Parameterized schema queries require a manual migration',
      );
    }

    console.log(
      JSON.stringify({
        name,
        tables,
        mode: args.length ? 'explicit' : 'automatic',
      }),
    );

    const timestamp = Date.now();
    if (
      rows.some((row) => Number(row.timestamp) >= timestamp) ||
      names.some((migration) => Number(migration.slice(-13)) >= timestamp)
    ) {
      throw new Error(
        'Migration clock is behind existing history; reconcile timestamps before generation',
      );
    }

    const down = args.length
      ? rollback
      : (enumOptions ?? automaticGenerationOptions(queries)).down;
    const content = renderMigration(
      name,
      timestamp,
      enumOptions?.up ?? queries,
      down,
    );

    const directory = join(process.cwd(), 'src/database/migrations');
    mkdirSync(directory, { recursive: true });
    const file = join(directory, `${timestamp}-${name}.ts`);
    writeFileSync(file, content, { flag: 'wx' });
    if (!args.length) {
      registerAutomaticIntegrity(file, queries, rollback, change);
      // This connection's metadata predates the newly written migration.
      // Rediscover source files before checking pending history in isolation.
      const checkpointDb = readOnlyDataSource({
        ...db.options,
        migrations: migrationFiles(),
      });
      try {
        await checkpointDb.initialize();
        await prepareAutomaticCheckpoint(
          checkpointDb,
          file,
          queries,
          rollback,
          change,
        );
      } finally {
        if (checkpointDb.isInitialized) await checkpointDb.destroy();
      }
      console.log(
        'Automatic integrity and isolated checkpoint approved; execution still requires read-only preflight.',
      );
    }

    console.log(`Created ${file}`);
    console.log('Review BOTH up() and down() before running the migration.');
    console.log(
      'Verify on an isolated database before applying to valuable data.',
    );
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}

main().catch((error: unknown) => {
  // Do not print connection options, URLs, or query parameters.
  console.error(
    error instanceof Error ? error.message : 'Migration verification failed',
  );
  process.exitCode = 1;
});
