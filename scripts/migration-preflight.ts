import source from '../src/database/data-source';
import { checkpointEvidenceGaps } from '../src/database/baseline';
import { readOnlyDataSource } from '../src/database/migration-safety';
import {
  verificationSummary,
  verifyMigrationState,
} from '../src/database/migration-verification';

async function main() {
  const db = readOnlyDataSource(source.options);
  try {
    await db.initialize();
    const state = await verifyMigrationState(db);
    const checkpointErrors = state.history.pending.length
      ? checkpointEvidenceGaps(state.names)
      : [];
    console.log(
      JSON.stringify(
        {
          database: db.options.database,
          ...verificationSummary(state),
          checkpointErrors,
        },
        null,
        2,
      ),
    );
    if (state.errors.length || checkpointErrors.length)
      throw new Error(
        'Migration execution blocked by baseline/history/schema verification; no writes performed',
      );
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}
main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Migration preflight failed',
  );
  process.exitCode = 1;
});
