import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  ENUM_CHECKPOINT_POLICY,
  ENUM_POLICY,
  enumSchemaBefore,
  assertEnumChange,
  EnumChange,
  enumAddedValues,
  enumDown,
  enumRestore,
  enumUp,
  sqlTokens,
} from './enum-additive-policy';

export const CHECKPOINT_POLICY = 'isolated-single-new-table-v1';
export const GENERAL_VERIFIED_POLICY = 'isolated-migration-verification-v1';
export const SUPPORTED_CHECKPOINT_POLICIES = [
  CHECKPOINT_POLICY,
  ENUM_CHECKPOINT_POLICY,
  GENERAL_VERIFIED_POLICY,
];

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
  proposed?: { policy: string; checkpoints: AutomaticCheckpoint[] },
): AutomaticCheckpoint[] {
  const registryPath = join(directory, 'automatic-checkpoints.json');
  if (!proposed && !existsSync(registryPath)) return [];
  const registry =
    proposed ??
    (JSON.parse(readFileSync(registryPath, 'utf8')) as {
      policy: string;
      checkpoints: AutomaticCheckpoint[];
    });
  if (
    registry.policy !== CHECKPOINT_POLICY &&
    registry.policy !== GENERAL_VERIFIED_POLICY &&
    registry.policy !== 'taskmanly-checkpoint-registry-v1'
  )
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
    const isEnum = approval?.policy === ENUM_CHECKPOINT_POLICY;
    const isGeneral = approval?.policy === GENERAL_VERIFIED_POLICY;
    if (
      approval?.kind !== 'automatic' ||
      !SUPPORTED_CHECKPOINT_POLICIES.includes(approval.policy) ||
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
      evidence.policy !== approval.policy ||
      (isEnum
        ? !(
            record?.approval?.kind === 'manual' ||
            (record?.approval?.kind === 'automatic' &&
              record.approval.policy === ENUM_POLICY)
          ) ||
          JSON.stringify(record?.approval) !==
            JSON.stringify(migration?.approval)
        : isGeneral
          ? !record
          : record?.approval?.kind !== 'automatic' ||
            record.approval.policy !== 'single-new-table-v1') ||
      !record ||
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
    if (isEnum) {
      validateEnumEvidence(evidence);
      const stamp = migration.name.slice(-13);
      if (
        migration.file.replace(/^(\d{13})-(.+)\.ts$/, '$2$1') !==
          migration.name ||
        checkpoint.schemaFile !== `checkpoints/automatic-${stamp}.sql` ||
        approval.evidenceFile !== `evidence/automatic-${stamp}.json` ||
        schemaHash(
          enumSchemaBefore(
            readFileSync(join(directory, checkpoint.schemaFile), 'utf8'),
            migration.enumChange,
          ),
        ) !== evidence.input.schemaSha256
      ) {
        throw new Error(
          'Enum checkpoint artifact is not bound to its migration and exact schema scope',
        );
      }
    }
    for (const trial of evidence.trials) {
      const before = trial.historyBefore;
      const after = trial.historyAfter;
      if (
        trial.beforeHash !== evidence.input.schemaSha256 ||
        trial.rollbackHash !== trial.beforeHash ||
        (!isGeneral && trial.untouchedSchemaHash !== trial.beforeHash) ||
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
        (!isGeneral &&
          JSON.stringify(trial.existingRowsBefore) !==
            JSON.stringify(trial.existingRowsAfter)) ||
        trial.inputVerification !== 'PASS' ||
        trial.outputMetadataVerification !== 'PASS' ||
        (!isGeneral &&
          (!trial.catalog ||
            JSON.stringify(trial.catalog) !==
              JSON.stringify(evidence.trials[0].catalog)))
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

// Private validator shared by all additive enum checkpoints.
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

function validateEnumEvidence(evidence: any): void {
  const change: EnumChange = evidence.migration.enumChange;
  assertEnumChange(change);
  const manual = evidence.migration.approval?.kind === 'manual';
  if (
    !equal(evidence.migration.up, enumUp(change).map(sqlTokens)) ||
    !equal(
      evidence.migration.down,
      (manual ? enumRestore(change) : enumDown(change)).map(sqlTokens),
    )
  ) {
    throw new Error(
      'Enum checkpoint SQL differs from the bounded additive policy',
    );
  }
  for (const trial of evidence.trials) {
    const proof = trial.enumVerification;
    if (
      !proof ||
      !Array.isArray(proof.beforeCatalog) ||
      !Array.isArray(proof.afterCatalog) ||
      !equal(
        proof.beforeCatalog.map((v: any) => v.label),
        change.oldValues,
      ) ||
      !equal(
        proof.afterCatalog.map((v: any) => v.label),
        change.newValues,
      ) ||
      !proof.beforeCatalog.every(
        (old: any) =>
          /^\d+$/.test(old.oid) &&
          proof.afterCatalog.some(
            (v: any) => v.label === old.label && v.oid === old.oid,
          ),
      ) ||
      ![proof.beforeCatalog, proof.afterCatalog].every((catalog: any[]) =>
        catalog.every(
          (v, index) =>
            Number.isFinite(Number(v.position)) &&
            (index === 0 ||
              Number(v.position) > Number(catalog[index - 1].position)),
        ),
      ) ||
      !equal(trial.catalog, {
        labels: change.newValues,
        table: change.table,
        column: change.column,
      }) ||
      proof.oldValueOidsPreserved !== 'PASS' ||
      proof.dataPreservation !== 'PASS' ||
      proof.fixture !==
        'synthetic-old-and-new-label-rows; transaction-local-fk-bypass-for-insertion-only' ||
      !Array.isArray(trial.existingRowsBefore) ||
      !trial.existingRowsBefore.some(
        (row: any) =>
          row.table === change.table && row.count >= change.oldValues.length,
      ) ||
      !trial.existingRowsBefore.every((row: any) =>
        /^[a-f0-9]{64}$/.test(row.sha256),
      ) ||
      !equal(trial.existingRowsRollback, trial.existingRowsBefore) ||
      !Array.isArray(proof.blockedRollbacks) ||
      !equal(
        proof.blockedRollbacks.map((test: any) => test.value),
        enumAddedValues(change),
      ) ||
      !proof.blockedRollbacks.every(
        (test: any) =>
          test.result === 'PASS' &&
          test.schemaSha256 === trial.afterHash &&
          test.historySha256 === hash(trial.historyAfter) &&
          /^[a-f0-9]{64}$/.test(test.dataSha256),
      )
    ) {
      throw new Error(
        'Enum checkpoint lacks catalog/order/OID/data preservation or protected rollback evidence',
      );
    }
  }
}
