import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import source from '../src/database/data-source';
import { readOnlyDataSource } from '../src/database/migration-safety';
import { verifyMigrationState } from '../src/database/migration-verification';
import { dumpSchema } from '../src/database/baseline';
import {
  detectEnumChange,
  enumGenerationOptions,
} from '../scripts/enum-migration';
import { isolatedTrial } from '../scripts/automatic-checkpoint';

// Exercise newly generated SQL against the real schema-only snapshot without
// replacing the reviewed source, publishing evidence or running on the source DB.
async function main() {
  const real = readOnlyDataSource(source.options);
  try {
    await real.initialize();
    const state = await verifyMigrationState(real);
    if (state.errors.length || state.history.pending.length !== 1)
      throw new Error(
        'Integration requires one verified pending enum migration',
      );
    const change = await detectEnumChange(real);
    if (!change)
      throw new Error('Integration requires a supported enum addition');
    const options = enumGenerationOptions(change);
    const pending = state.history.pending[0];
    class GeneratedEnum {
      name = pending;
      async up(runner: QueryRunner) {
        for (const sql of options.up) await runner.query(sql);
      }
      async down(runner: QueryRunner) {
        for (const sql of options.down) await runner.query(sql);
      }
    }
    // This DataSource is an options carrier only; isolatedTrial creates and
    // verifies a NEW cluster before initializing any writable connection.
    const model = new DataSource({
      ...real.options,
      migrations: real.migrations.map((migration) =>
        migration.name === pending ? GeneratedEnum : migration.constructor,
      ),
    });
    const snapshot = await dumpSchema(real);
    const result = await isolatedTrial(
      model,
      snapshot,
      state.rows,
      pending,
      change.table,
      options.up,
      options.down,
      change,
    );
    if (result.evidence.afterHash === result.evidence.beforeHash)
      throw new Error('Generated enum SQL did not change schema');
    const latest = await verifyMigrationState(real);
    if (
      latest.errors.length ||
      JSON.stringify(state.rows) !== JSON.stringify(latest.rows) ||
      state.proof.schemaSha256 !== latest.proof.schemaSha256
    )
      throw new Error('Source changed during integration');
    console.log(
      JSON.stringify({
        generatedEnumSql: 'PASS',
        committedRollback: 'PASS',
        rollbackWithValueInUse: 'PASS',
        sourceReadOnly: 'PASS',
        checkpointPublished: false,
      }),
    );
  } finally {
    if (real.isInitialized) await real.destroy();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Integration failed');
  process.exitCode = 1;
});
