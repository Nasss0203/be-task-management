import 'dotenv/config';
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import source from '../src/database/data-source';
import {
  activeMigrationNames,
  baselineDirectory,
  baselineLineage,
  bootstrapGuard,
  dumpSchema,
  EMPTY_DATABASE_SQL,
  checkpointEvidenceGaps,
  loadBaseline,
  postgresEnvironment,
  postgresTool,
  schemaHash,
  verifyBaseline,
} from '../src/database/baseline';
import {
  migrationHistory,
  readOnlyDataSource,
} from '../src/database/migration-safety';
import { migrationIntegrityProblems } from '../src/database/migration-integrity';
import {
  staticMigrationNames,
  verificationSummary,
  verifyMigrationState,
} from '../src/database/migration-verification';

const execute = promisify(execFile);

async function main() {
  const command = process.argv[2];
  const manifest = loadBaseline();
  if (command === 'static') {
    console.log(
      JSON.stringify(
        {
          version: manifest.version,
          schemaSha256: manifest.sqlSha256,
          tables: manifest.tableCount,
          legacyAnchor: manifest.legacyHistory.length,
          incrementalOnly: true,
          verificationPending: checkpointEvidenceGaps(
            await staticMigrationNames(source.options),
            manifest,
          ),
        },
        null,
        2,
      ),
    );
    if (migrationIntegrityProblems().length)
      throw new Error('Reviewed migration integrity failed');
    return;
  }
  if (!['verify', 'capture', 'bootstrap'].includes(command))
    throw new Error('Use static, verify, capture, or bootstrap');
  const db = readOnlyDataSource(source.options);
  let rows: Awaited<ReturnType<typeof migrationHistory>> = [];
  try {
    await db.initialize();
    const names = activeMigrationNames(db);
    console.log(
      JSON.stringify({
        host: db.options.type === 'postgres' ? db.options.host : undefined,
        port: db.options.type === 'postgres' ? db.options.port : undefined,
        database: db.options.database,
        access: 'read-only',
        baseline: manifest.version,
      }),
    );
    if (command === 'bootstrap') {
      const server = (await db.query(
        `SELECT current_setting('server_version_num')::int AS version`,
      )) as { version: number }[];
      if (Math.floor(server[0].version / 10000) !== manifest.postgresMajor)
        throw new Error(
          'Bootstrap target major differs from the verified baseline',
        );
      const objects = (await db.query(EMPTY_DATABASE_SQL)) as {
        object: string;
      }[];
      if (objects.length)
        throw new Error(
          `Bootstrap refused: database is not empty (${objects.length} existing objects). Schema-only databases are not empty.`,
        );
      const expected = (key: string) =>
        process.argv
          .find((argument) => argument.startsWith(`--expect-${key}=`))
          ?.split('=')
          .slice(1)
          .join('=');
      const config = postgresEnvironment(db);
      if (
        expected('database') !== config.PGDATABASE ||
        expected('host') !== config.PGHOST ||
        expected('port') !== config.PGPORT
      )
        throw new Error(
          'Bootstrap requires matching --expect-host, --expect-port and --expect-database',
        );
      if (!process.argv.includes('--apply')) {
        console.log(
          'Empty target verified. Dry-run only; no baseline applied.',
        );
        return;
      }
      if (process.env.BASELINE_BOOTSTRAP_CONFIRM !== 'EMPTY_DATABASE')
        throw new Error(
          'Set BASELINE_BOOTSTRAP_CONFIRM=EMPTY_DATABASE only after reviewing the target and SQL',
        );
      if (
        [
          'task_manly_v2',
          'task_manly_v2_baseline_test',
          'task_manly_v2_migration_test_bootstrap',
        ].includes(config.PGDATABASE!)
      )
        throw new Error(
          'This protected audit database cannot be a bootstrap target',
        );
      const psql = postgresTool('psql');
      const { stdout: version } = await execute(psql, ['--version']);
      if (!/\b18\./.test(version))
        throw new Error('Bootstrap requires PostgreSQL 18 psql');
      const directory = mkdtempSync(join(tmpdir(), 'taskmanly-baseline-'));
      try {
        const guard = join(directory, 'guard.sql');
        writeFileSync(guard, bootstrapGuard(config.PGDATABASE!));
        // One connection and one transaction; guard and DDL cannot be separated.
        // Native psql parses the original restrict/unrestrict metacommands.
        await execute(
          psql,
          [
            '--no-psqlrc',
            '--no-password',
            '--set=ON_ERROR_STOP=on',
            '--single-transaction',
            '--file',
            guard,
            '--file',
            join(baselineDirectory(), 'schema.sql'),
          ],
          {
            env: postgresEnvironment(db, false),
            timeout: 60000,
            maxBuffer: 10 * 1024 * 1024,
          },
        );
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
      rows = await migrationHistory(db);
      const proof = await verifyBaseline(db, rows, names);
      if (rows.length || proof.errors.length)
        throw new Error(
          'Baseline restore committed but post-verification failed; stop for investigation, do not reset or rerun bootstrap\n' +
            [
              ...(rows.length
                ? [`${rows.length} migration history rows exist`]
                : []),
              ...proof.errors,
            ].join('\n'),
        );
      console.log(
        'Baseline schema restored and verified. Zero historical migrations inserted; incremental migrations have not run.',
      );
      return;
    }
    if (command === 'capture') {
      rows = await migrationHistory(db);
      const lineage = baselineLineage(rows, manifest);
      if (
        !lineage.valid ||
        lineage.incremental.some((row, index) => row.name !== names[index])
      )
        throw new Error(
          'Cannot propose checkpoint from an unknown migration lineage',
        );
      console.log(
        JSON.stringify(
          {
            proposalOnly: true,
            baseline: manifest.version,
            applied: lineage.incremental.map((row) => row.name),
            schemaSha256: schemaHash(await dumpSchema(db)),
            requirements:
              'Review schema diff, data preservation, commit-boundary tests and independent legacy/new-database convergence before adding any checkpoint to manifest.json. This command never approves a checkpoint.',
          },
          null,
          2,
        ),
      );
      return;
    }
    const state = await verifyMigrationState(db);
    console.log(
      JSON.stringify(
        {
          ...verificationSummary(state),
          unverifiedFutureStates: checkpointEvidenceGaps(names, manifest),
        },
        null,
        2,
      ),
    );
    if (state.errors.length)
      throw new Error(
        'Baseline verification blocked; no database writes performed',
      );
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}
main().catch((error: unknown) => {
  // Avoid child-process error.command/stderr containing credentials or settings.
  console.error(
    error instanceof Error && !('cmd' in error)
      ? error.message
      : 'PostgreSQL baseline tool failed; verify client installation, permissions and target',
  );
  process.exitCode = 1;
});
