import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import source from '../src/database/data-source';
import {
  verificationSummary,
  verifyMigrationState,
} from '../src/database/migration-verification';
import {
  generationProblems,
  readOnlyDataSource,
} from '../src/database/migration-safety';

async function main() {
  const command = process.argv[2];
  if (!['audit', 'check', 'generate'].includes(command))
    throw new Error(
      'Use audit, check, or generate; execution checks use migration:preflight',
    );
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
    console.log(JSON.stringify(verificationSummary(state), null, 2));
    for (const query of diff.upQueries) console.log(query.query + ';');

    if (command === 'audit') return;
    if (command === 'check') {
      if (errors.length || diff.upQueries.length || history.pending.length) {
        throw new Error(
          'Migration verification blocked; review the history and SQL above. No database writes were performed.',
        );
      }
      return;
    }

    const name = process.argv[3];
    const tableArg = process.argv.find((argument) =>
      argument.startsWith('--tables='),
    );
    if (!name || !/^[A-Z][A-Za-z0-9]+$/.test(name) || !tableArg)
      throw new Error(
        'Generate requires a descriptive PascalCase name and --tables=table_one,table_two',
      );
    const tables = tableArg.slice('--tables='.length).split(',');
    if (
      !tables.length ||
      tables.some((table) => !/^[a-z][a-z0-9_]*$/.test(table))
    )
      throw new Error('Invalid table scope');
    const problems = generationProblems(
      diff.upQueries.map((query) => query.query),
      tables,
    );
    if (errors.length || history.pending.length || problems.length) {
      for (const problem of problems) console.error(problem);
      throw new Error(
        'Generation blocked: resolve history/pending migrations and out-of-scope/destructive drift first',
      );
    }
    if (!diff.upQueries.length) {
      console.log('No schema changes');
      return;
    }
    if (
      [...diff.upQueries, ...diff.downQueries].some(
        (query) => query.parameters?.length,
      )
    )
      throw new Error(
        'Parameterized schema queries require a manual migration',
      );
    const timestamp = Date.now();
    if (
      rows.some((row) => Number(row.timestamp) >= timestamp) ||
      names.some((migration) => Number(migration.slice(-13)) >= timestamp)
    )
      throw new Error(
        'Migration clock is behind existing history; reconcile timestamps before generation',
      );
    const statements = (queries: typeof diff.upQueries) =>
      queries
        .map(
          (query) => `    await runner.query(${JSON.stringify(query.query)});`,
        )
        .join('\n');
    const content = `import { MigrationInterface, QueryRunner } from 'typeorm';\n\nexport class ${name}${timestamp} implements MigrationInterface {\n  name = '${name}${timestamp}';\n  async up(runner: QueryRunner): Promise<void> {\n${statements(diff.upQueries)}\n  }\n  async down(runner: QueryRunner): Promise<void> {\n${statements(diff.downQueries)}\n  }\n}\n`;
    const directory = join(process.cwd(), 'src/database/migrations');
    mkdirSync(directory, { recursive: true });
    const file = join(directory, `${timestamp}-${name}.ts`);
    writeFileSync(file, content, { flag: 'wx' });
    console.log(
      `Created ${file}. Review up AND down SQL, then verify on an isolated database.`,
    );
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}

main().catch((error: unknown) => {
  // Do not dump connection options, URLs, or query parameters.
  console.error(
    error instanceof Error ? error.message : 'Migration verification failed',
  );
  process.exitCode = 1;
});
