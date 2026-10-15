import 'reflect-metadata';

import { basename } from 'node:path';
import source from '../src/database/data-source';
import { migrationFiles } from '../src/database/database-options';
import { readOnlyDataSource } from '../src/database/migration-safety';
import {
  verificationSummary,
  verifyMigrationState,
} from '../src/database/migration-verification';
import { checkpointEvidenceGaps } from '../src/database/baseline';
import { prepareAutomaticCheckpoint } from './automatic-checkpoint';

export async function runMigrationPrepare(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'migration:prepare is strictly prohibited in production. ' +
        'Verified schema checkpoints must be prepared and reviewed during development / CI prior to release.',
    );
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
        action: 'migration:prepare',
      }),
    );

    const state = await verifyMigrationState(db);
    console.log(JSON.stringify(verificationSummary(state), null, 2));

    const fatalErrors = state.errors.filter(
      (error) => !error.startsWith('Active migration lacks a reviewed integrity record: '),
    );
    if (fatalErrors.length > 0) {
      throw new Error(
        `Migration state has verification errors before preparation:\n${fatalErrors.join('\n')}`,
      );
    }

    const pending = state.history.pending;
    if (pending.length === 0) {
      console.log('No pending migrations detected. Schema is up to date with migration history.');
      return;
    }

    console.log(`Detected ${pending.length} pending migration(s): ${pending.join(', ')}`);

    const files = migrationFiles();
    for (const pendingName of pending) {
      const file = files.find((filePath) => {
        const base = basename(filePath);
        const namePart = base.replace(/^\d{13}-/, '').replace(/\.ts$/, '');
        const tsPart = base.slice(0, 13);
        return namePart + tsPart === pendingName || base.replace(/\.ts$/, '') === pendingName;
      });

      if (!file) {
        throw new Error(`Could not find source file for pending migration: ${pendingName}`);
      }

      console.log(`Preparing integration verification trial for: ${pendingName} (${basename(file)})`);
      await prepareAutomaticCheckpoint(db, file);
    }

    const verified = await verifyMigrationState(db);
    const gaps = checkpointEvidenceGaps(verified.names);

    if (verified.errors.length > 0 || gaps.length > 0) {
      throw new Error(
        `Post-preparation verification failed:\n` +
          [...verified.errors, ...gaps].map((e) => ` - ${e}`).join('\n'),
      );
    }

    console.log('\n======================================================');
    console.log('MIGRATION PREPARATION COMPLETED SUCCESSFULLY');
    console.log('------------------------------------------------------');
    console.log(`Verified & Checkpointed: ${pending.join(', ')}`);
    console.log('Remaining Checkpoint Gaps: 0');
    console.log('Real database remained untouched in read-only mode.');
    console.log('Next step: npm run migration:preflight');
    console.log('======================================================\n');
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}

if (require.main === module) {
  runMigrationPrepare().catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.stack || error.message : 'Migration prepare failed',
    );
    process.exitCode = 1;
  });
}
