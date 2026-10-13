import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const CHECKPOINT_POLICY = 'isolated-single-new-table-v1';
export type Checkpoint = {
  applied: string[];
  schemaSha256: string;
  evidence: string;
  schemaFile?: string;
};
export type AutomaticCheckpoint = Checkpoint & {
  schemaFile: string;
  approval: {
    kind: 'automatic';
    policy: string;
    evidenceFile: string;
    evidenceSha256: string;
  };
};
export function evidenceHash(text: string): string {
  return createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
}

// Automatic evidence extends the reviewed epoch in a separate registry. It
// never replaces a historical checkpoint or changes its normalization rules.
export function loadAutomaticCheckpoints(
  directory: string,
  reviewed: Checkpoint[],
  schemaHash: (sql: string) => string,
): AutomaticCheckpoint[] {
  const registryPath = join(directory, 'automatic-checkpoints.json');
  if (!existsSync(registryPath)) return [];
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as {
    policy: string;
    checkpoints: AutomaticCheckpoint[];
  };
  if (registry.policy !== CHECKPOINT_POLICY)
    throw new Error('Unknown automatic checkpoint policy');
  const integrity = JSON.parse(
    readFileSync(
      join(dirname(dirname(directory)), 'migration-review-manifest.json'),
      'utf8',
    ),
  ) as {
    files: {
      file: string;
      sha256: string;
      sourceSha256?: string;
      approval?: { kind: string; policy: string };
    }[];
  };
  const accepted = [...reviewed];
  for (const checkpoint of registry.checkpoints) {
    const approval = checkpoint.approval;
    if (
      approval?.kind !== 'automatic' ||
      approval.policy !== CHECKPOINT_POLICY ||
      !/^checkpoints\/automatic-\d{13}\.sql$/.test(checkpoint.schemaFile) ||
      !/^evidence\/automatic-\d{13}\.json$/.test(approval.evidenceFile)
    ) {
      throw new Error('Invalid automatic checkpoint provenance/path');
    }
    if (
      accepted.some(
        (item) =>
          JSON.stringify(item.applied) === JSON.stringify(checkpoint.applied),
      )
    ) {
      throw new Error('Automatic checkpoint cannot replace an existing state');
    }
    const raw = readFileSync(join(directory, approval.evidenceFile), 'utf8');
    if (evidenceHash(raw) !== approval.evidenceSha256)
      throw new Error('Automatic checkpoint evidence integrity mismatch');
    const evidence = JSON.parse(raw);
    const migration = evidence.migration;
    const record = integrity.files.find(
      (item) =>
        item.file === migration?.file ||
        item.file === migration?.file?.replace(/\.ts$/, '.js'),
    );
    const parent = accepted.find(
      (item) =>
        JSON.stringify(item.applied) ===
        JSON.stringify(evidence.input?.applied),
    );
    if (
      evidence.kind !== 'automatic' ||
      evidence.policy !== CHECKPOINT_POLICY ||
      record?.approval?.kind !== 'automatic' ||
      record.approval.policy !== 'single-new-table-v1' ||
      (record.sourceSha256 ?? record.sha256) !== migration.sha256 ||
      !parent ||
      parent.schemaSha256 !== evidence.input.checkpointSha256 ||
      JSON.stringify(checkpoint.applied) !==
        JSON.stringify([...parent.applied, migration.name]) ||
      checkpoint.schemaSha256 !== evidence.output?.schemaSha256 ||
      JSON.stringify(evidence.output.applied) !==
        JSON.stringify(checkpoint.applied) ||
      !Array.isArray(evidence.trials) ||
      evidence.trials.length !== 2 ||
      new Set(evidence.trials.map((trial: any) => trial.systemIdentifier))
        .size !== 2
    ) {
      throw new Error(
        'Automatic checkpoint is not bound to verified input, migration and independent trials',
      );
    }
    for (const trial of evidence.trials) {
      const before = trial.historyBefore;
      const after = trial.historyAfter;
      if (
        trial.beforeHash !== evidence.input.schemaSha256 ||
        trial.rollbackHash !== trial.beforeHash ||
        trial.untouchedSchemaHash !== trial.beforeHash ||
        trial.afterHash !== checkpoint.schemaSha256 ||
        JSON.stringify(trial.executedUp) !== JSON.stringify(migration.up) ||
        JSON.stringify(trial.executedDown) !== JSON.stringify(migration.down) ||
        JSON.stringify(trial.historyRollback) !== JSON.stringify(before) ||
        JSON.stringify(before) !== JSON.stringify(evidence.input.history) ||
        !Array.isArray(after) ||
        after.length !== before.length + 1 ||
        JSON.stringify(after.slice(0, -1)) !== JSON.stringify(before) ||
        after.at(-1)?.name !== migration.name ||
        String(after.at(-1)?.timestamp) !== migration.name.slice(-13) ||
        JSON.stringify(trial.existingRowsBefore) !==
          JSON.stringify(trial.existingRowsAfter) ||
        trial.inputVerification !== 'PASS' ||
        trial.outputMetadataVerification !== 'PASS' ||
        !trial.catalog ||
        JSON.stringify(trial.catalog) !==
          JSON.stringify(evidence.trials[0].catalog)
      ) {
        throw new Error(
          'Automatic checkpoint trial failed apply/scope/history/rollback verification',
        );
      }
    }
    if (
      schemaHash(
        readFileSync(join(directory, checkpoint.schemaFile), 'utf8'),
      ) !== checkpoint.schemaSha256
    ) {
      throw new Error(
        'Automatic checkpoint schema artifact integrity mismatch',
      );
    }
    accepted.push(checkpoint);
  }
  return registry.checkpoints;
}
