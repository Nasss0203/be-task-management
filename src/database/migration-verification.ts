import { DataSource, type DataSourceOptions } from 'typeorm';
import { activeMigrationNames, verifyBaseline } from './baseline';
import { migrationIntegrityProblems } from './migration-integrity';
import { inspectHistory, migrationHistory } from './migration-safety';

// Shared read-only contract used by baseline verify, audit and execution preflight.
export async function verifyMigrationState(db: DataSource) {
  const names = activeMigrationNames(db);
  const rows = await migrationHistory(db);
  const proof = await verifyBaseline(db, rows, names);
  const history = inspectHistory(names, rows, proof.coveredHistory);
  const errors = [
    ...proof.errors,
    ...history.errors,
    ...migrationIntegrityProblems(),
  ];
  return { names, rows, proof, history, errors };
}

export function verificationSummary(
  state: Awaited<ReturnType<typeof verifyMigrationState>>,
) {
  return {
    executed: state.rows.length,
    activeSource: state.names.length,
    baseline: {
      ...state.proof,
      coveredHistory: undefined,
      coveredHistoryCount: state.proof.coveredHistory.length,
    },
    ...state.history,
    coveredByBaseline: undefined,
    coveredByBaselineCount: state.history.coveredByBaseline.length,
    errors: state.errors,
  };
}

class MetadataOnlyDataSource extends DataSource {
  async names() {
    await this.buildMetadatas();
    return activeMigrationNames(this);
  }
}

export function staticMigrationNames(
  options: DataSourceOptions,
): Promise<string[]> {
  // buildMetadatas loads source classes without opening a connection.
  return new MetadataOnlyDataSource(options).names();
}
