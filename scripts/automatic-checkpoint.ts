import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  unlinkSync,
  rmSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { DataSource, type Logger } from 'typeorm';
import {
  baselineDirectory,
  checkpointFor,
  comparableReviewedSchema,
  dumpSchema,
  loadBaseline,
  postgresEnvironment,
  postgresTool,
  schemaHash,
} from '../src/database/baseline';
import {
  CHECKPOINT_POLICY,
  GENERAL_VERIFIED_POLICY,
  evidenceHash,
  loadAutomaticCheckpoints,
  type AutomaticCheckpoint,
} from '../src/database/automatic-checkpoint';
import { migrationHistory } from '../src/database/migration-safety';
import { verifyMigrationState } from '../src/database/migration-verification';
import {
  verifyAutomaticCandidate,
  verifyEnumAutomaticCandidate,
} from './migration-approval';
import {
  ENUM_CHECKPOINT_POLICY,
  ENUM_POLICY,
  EnumChange,
  sqlTokens,
} from '../src/database/enum-additive-policy';
import { verifyReviewedEnumCandidate } from './enum-migration';
import { verifyIsolatedEnum } from './enum-checkpoint';

const execute = promisify(execFile);
const normalizedHistory = (
  rows: Awaited<ReturnType<typeof migrationHistory>>,
) =>
  rows.map((row) => ({
    id: Number(row.id),
    timestamp: String(row.timestamp),
    name: row.name,
  }));
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const requireProof = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function unusedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  const port = (server.address() as { port: number }).port;
  await new Promise<void>((done, reject) =>
    server.close((error) => (error ? reject(error) : done())),
  );
  return port;
}

export async function isolatedTrial(
  real: DataSource,
  snapshot: string,
  history: Awaited<ReturnType<typeof migrationHistory>>,
  pending: string,
  table?: string,
  expectedUp?: string[],
  expectedDown?: string[],
  change?: EnumChange,
  policy: string = GENERAL_VERIFIED_POLICY,
  migrationFile?: string,
) {
  const root = mkdtempSync(join(tmpdir(), 'taskmanly-auto-checkpoint-'));
  const data = join(root, 'data');
  const password = randomBytes(32).toString('hex');
  const passwordFile = join(root, 'password');
  const snapshotFile = join(root, 'input.sql');
  writeFileSync(passwordFile, password, { flag: 'wx', mode: 0o600 });
  // LF input prevents Windows pg_dump framing from becoming extra CR bytes
  // inside restored function bodies. Existing schema canonicalization is kept.
  writeFileSync(snapshotFile, snapshot.replace(/\r\n/g, '\n'), { flag: 'wx' });
  const bin = dirname(postgresTool('psql'));
  const executable = (name: string) =>
    join(bin, `${name}${process.platform === 'win32' ? '.exe' : ''}`);
  const port = await unusedPort();
  const journal: { query: string; parameters?: unknown[] }[] = [];
  const logger: Logger = {
    logQuery: (query, parameters) => {
      journal.push({ query: query.trim(), parameters });
    },
    logQueryError() {},
    logQuerySlow() {},
    logSchemaBuild() {},
    logMigration() {},
    log() {},
  };
  const db = new DataSource({
    ...real.options,
    type: 'postgres',
    host: '127.0.0.1',
    port,
    username: 'checkpoint_verifier',
    password,
    database: 'postgres',
    url: undefined,
    ssl: false,
    synchronize: false,
    dropSchema: false,
    replication: undefined,
    migrationsRun: false,
    installExtensions: false,
    logging: ['query'],
    logger,
    extra: { options: '-c statement_timeout=30000 -c lock_timeout=10000' },
    migrations: migrationFile
      ? (real.options.migrations as string[]).filter(
          (f) =>
            Number(basename(f).slice(0, 13)) <=
            Number(basename(migrationFile).slice(0, 13)),
        )
      : real.options.migrations,
  } as any);
  let initializedCluster = false;
  let stopped = false;
  try {
    requireProof(
      real.options.type === 'postgres' && port !== real.options.port,
      'Isolated instance must use a different endpoint',
    );
    await execute(
      executable('initdb'),
      [
        '-D',
        data,
        '-U',
        'checkpoint_verifier',
        `--pwfile=${passwordFile}`,
        '--auth=scram-sha-256',
        '--encoding=UTF8',
        '--locale=C',
      ],
      { timeout: 30000 },
    );
    initializedCluster = true;
    // Detached stdio prevents the PostgreSQL child from holding pg_ctl pipes.
    const { spawnSync } = await import('node:child_process');
    const start = spawnSync(
      executable('pg_ctl'),
      [
        '-D',
        data,
        '-l',
        join(root, 'server.log'),
        '-o',
        `-h 127.0.0.1 -p ${port}`,
        '-w',
        '-t',
        '20',
        'start',
      ],
      { stdio: 'ignore', timeout: 25000, windowsHide: true },
    );
    requireProof(
      start.status === 0 && !start.error,
      'Isolated PostgreSQL startup failed',
    );
    await db.initialize();
    const identity = await db.query(
      "SELECT current_database() AS database,current_setting('server_version_num')::int AS version,current_setting('data_directory') AS directory,system_identifier::text AS system FROM pg_control_system()",
    );
    requireProof(
      identity[0].database === 'postgres' &&
        resolve(identity[0].directory) === resolve(data) &&
        Math.floor(identity[0].version / 10000) === 18,
      'Isolated server identity/version failed',
    );
    // Only this newly initialized instance receives writes. The real connection
    // remains read-only throughout checkpoint preparation.
    await execute(
      postgresTool('psql'),
      [
        '--no-psqlrc',
        '--no-password',
        '--set=ON_ERROR_STOP=on',
        '--single-transaction',
        '--file',
        snapshotFile,
      ],
      {
        env: postgresEnvironment(db, false),
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    for (const row of history) {
      await db.query(
        'INSERT INTO public.migrations(id,timestamp,name) VALUES($1,$2,$3)',
        [row.id, row.timestamp, row.name],
      );
    }
    if (history.length)
      await db.query(
        "SELECT setval(pg_get_serial_sequence('public.migrations','id'),$1,true)",
        [Math.max(...history.map((row) => Number(row.id)))],
      );
    const initial = await verifyMigrationState(db);
    requireProof(
      initial.errors.length === 0 && initial.history.pending.includes(pending),
      `Isolated input failed existing baseline/history/integrity verification: ${JSON.stringify({ errors: initial.errors, pending: initial.history.pending })}`,
    );
    const before = await dumpSchema(db);
    requireProof(
      comparableReviewedSchema(before) === comparableReviewedSchema(snapshot),
      'Isolated input fingerprint differs from verified real schema',
    );
    const historyBefore = normalizedHistory(await migrationHistory(db));
    requireProof(
      equal(historyBefore, normalizedHistory(history)),
      'Isolated input history is not an exact clone',
    );
    if (change)
      return await verifyIsolatedEnum(
        db,
        before,
        pending,
        identity[0].system,
        change,
        expectedUp ?? [],
        expectedDown ?? [],
        journal,
      );
    const tables = (await db.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'migrations' ORDER BY tablename",
    )) as { tablename: string }[];
    const counts = async () => {
      const rows: { table: string; count: string }[] = [];
      for (const item of tables) {
        requireProof(
          /^[a-z][a-z0-9_]*$/.test(item.tablename),
          'Unsupported existing table identifier',
        );
        const result = await db.query(
          `SELECT count(*)::text AS count FROM public."${item.tablename}"`,
        );
        rows.push({ table: item.tablename, count: result[0].count });
      }
      return rows;
    };
    const existingRowsBefore = await counts();
    const validateJournal = (
      expected: string[],
      action: 'INSERT' | 'DELETE',
    ) => {
      const writes = journal.filter((item) =>
        /^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE)\b/i.test(
          item.query,
        ),
      );
      const ddl = writes.filter(
        (item) =>
          !new RegExp(
            `^${action} (?:INTO|FROM) (?:"public"\\.)?"migrations"`,
          ).test(item.query),
      );
      const historyWrites = writes.filter((item) => !ddl.includes(item));
      requireProof(
        equal(
          ddl.map((item) => item.query),
          expected.map((sql) => sql.trim()),
        ) && historyWrites.length === 1,
        'Executed SQL differs from approved migration/history operations',
      );
      return ddl.map((item) => item.query);
    };

    const isSingleTable = policy === CHECKPOINT_POLICY && Boolean(table);
    journal.length = 0;
    const executed = await db.runMigrations({ transaction: 'each' });
    requireProof(
      executed.length === 1 && executed[0].name === pending,
      'Isolated execution did not run exactly the pending migration',
    );
    const executedUp = isSingleTable && expectedUp
      ? validateJournal(expectedUp, 'INSERT')
      : journal
          .filter(
            (item) =>
              /^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE)\b/i.test(
                item.query,
              ) && !/(?:INTO|FROM) (?:"public"\.)?"migrations"/i.test(item.query),
          )
          .map((item) => item.query.trim());
    const historyAfter = normalizedHistory(await migrationHistory(db));
    requireProof(
      historyAfter.length === historyBefore.length + 1 &&
        equal(historyAfter.slice(0, -1), historyBefore) &&
        historyAfter.at(-1)?.name === pending,
      'Unexpected post-migration history',
    );
    const after = await dumpSchema(db);

    let untouchedSchemaHash = schemaHash(before);
    let catalog: any = undefined;
    let existingRowsAfter = existingRowsBefore;

    if (isSingleTable && table) {
      const untouched = await dumpSchema(db, [table]);
      requireProof(
        schemaHash(untouched) === schemaHash(before),
        'Migration changed schema outside its new table',
      );
      untouchedSchemaHash = schemaHash(untouched);
      existingRowsAfter = await counts();
      requireProof(
        equal(existingRowsBefore, existingRowsAfter),
        'Migration changed existing isolated table data',
      );
      catalog = {
        columns: await db.query(
          "SELECT column_name,data_type,character_maximum_length,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
          [table],
        ),
        constraints: await db.query(
          'SELECT conname,contype,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid=to_regclass($1) ORDER BY conname',
          [`public.${table}`],
        ),
        indexes: await db.query(
          "SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=$1 ORDER BY indexname",
          [table],
        ),
      };
      requireProof(
        catalog.columns.length > 0 &&
          catalog.constraints.some((item: any) => item.contype === 'p'),
        'Resulting table/catalog is incomplete',
      );
    }

    const diff = await db.driver.createSchemaBuilder().log();
    requireProof(
      diff.upQueries.length === 0,
      'Result does not match registered ORM metadata: ' +
        diff.upQueries.map((q) => q.query).join('; '),
    );

    if (checkpointFor([...initial.proof.applied, pending], loadBaseline())) {
      const verifiedOutput = await verifyMigrationState(db);
      requireProof(
        verifiedOutput.errors.length === 0 &&
          verifiedOutput.history.pending.length === 0,
        'Published checkpoint failed independent post-migration baseline verification',
      );
    }

    journal.length = 0;
    await db.undoLastMigration({ transaction: 'each' });
    const executedDown = isSingleTable && expectedDown
      ? validateJournal(expectedDown, 'DELETE')
      : journal
          .filter(
            (item) =>
              /^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE)\b/i.test(
                item.query,
              ) && !/(?:INTO|FROM) (?:"public"\.)?"migrations"/i.test(item.query),
          )
          .map((item) => item.query.trim());
    const rollback = await dumpSchema(db);
    const historyRollback = normalizedHistory(await migrationHistory(db));
    requireProof(
      schemaHash(rollback) === schemaHash(before) &&
        equal(historyRollback, historyBefore),
      'Rollback did not restore initial schema/history',
    );
    const restored = await verifyMigrationState(db);
    requireProof(
      restored.errors.length === 0,
      'Rollback failed baseline verification',
    );

    // Re-apply migration so the final cluster state matches the post-migration schema
    await db.runMigrations({ transaction: 'each' });
    const reapplied = await dumpSchema(db);
    requireProof(
      schemaHash(reapplied) === schemaHash(after),
      'Re-applied migration did not restore post-migration schema',
    );

    return {
      sql: after,
      evidence: {
        systemIdentifier: identity[0].system,
        beforeHash: schemaHash(before),
        afterHash: schemaHash(after),
        rollbackHash: schemaHash(rollback),
        untouchedSchemaHash,
        historyBefore,
        historyAfter,
        historyRollback,
        existingRowsBefore,
        existingRowsAfter,
        executedUp,
        executedDown,
        catalog,
        inputVerification: 'PASS',
        outputMetadataVerification: 'PASS',
      },
    };
  } finally {
    if (db.isInitialized) await db.destroy();
    if (initializedCluster) {
      const { spawnSync } = await import('node:child_process');
      const stop = spawnSync(
        executable('pg_ctl'),
        ['-D', data, '-m', 'fast', '-w', '-t', '20', 'stop'],
        { stdio: 'ignore', timeout: 25000, windowsHide: true },
      );
      stopped = stop.status === 0 && !stop.error;
    }
    const target = resolve(root);
    requireProof(
      target.startsWith(resolve(tmpdir()) + sep) &&
        basename(target).startsWith('taskmanly-auto-checkpoint-'),
      'Unsafe temporary cleanup path',
    );
    // Never remove a data directory while PostgreSQL might still be running.
    if (
      (!initializedCluster || stopped) &&
      !existsSync(join(data, 'postmaster.pid'))
    )
      rmSync(target, { recursive: true, force: true });
    else
      throw new Error(
        `Isolated instance cleanup requires investigation: ${root}`,
      );
  }
}

export async function prepareAutomaticCheckpoint(
  real: DataSource,
  file: string,
  up?: string[],
  down?: string[],
  change?: EnumChange,
  policy?: string,
) {
  const access = await real.query('SHOW default_transaction_read_only');
  requireProof(
    access[0].default_transaction_read_only === 'on',
    'Checkpoint source connection must be read-only',
  );
  const state = await verifyMigrationState(real);
  const pending = state.history.pending;
  const fatalErrors = state.errors.filter(
    (e) => !e.startsWith('Active migration lacks a reviewed integrity record: '),
  );
  requireProof(
    fatalErrors.length === 0 && pending.length > 0,
    'Checkpoint preparation requires verified baseline/history/integrity and at least one pending migration',
  );
  const content = readFileSync(file, 'utf8');
  const base = basename(file);
  const name = pending.find((p) => {
    const namePart = base.replace(/^\d{13}-/, '').replace(/\.ts$/, '');
    const tsPart = base.slice(0, 13);
    return namePart + tsPart === p || base.replace(/\.ts$/, '') === p;
  });
  requireProof(
    Boolean(name),
    `Migration file ${base} does not match any pending migration (${pending.join(', ')})`,
  );
  const directory = baselineDirectory();
  const baseline = loadBaseline();
  const applied = [...state.proof.applied, name!];
  const parent = checkpointFor(state.proof.applied, baseline);
  requireProof(Boolean(parent), 'Input checkpoint missing');

  if (checkpointFor(applied, baseline)) {
    console.log(`Verified checkpoint already exists for ${name}`);
    return;
  }

  const integrityPath = join(
    process.cwd(),
    'src/database/migration-review-manifest.json',
  );
  const integrity = JSON.parse(readFileSync(integrityPath, 'utf8'));
  let record = integrity.files.find(
    (item: any) => item.file === basename(file),
  );

  const determinedPolicy = policy ?? (
    change
      ? ENUM_CHECKPOINT_POLICY
      : record?.approval?.policy === 'single-new-table-v1' && up && down
        ? CHECKPOINT_POLICY
        : GENERAL_VERIFIED_POLICY
  );

  if (!record) {
    const sha256 = evidenceHash(content);
    record = {
      file: basename(file),
      sha256,
      approval: {
        kind: 'automatic',
        policy: determinedPolicy,
        generator: 'scripts/migration-prepare.ts',
        evidence: 'isolated-postgresql-18-multi-trial-convergence',
      },
    };
    integrity.files.push(record);
    writeFileSync(integrityPath, JSON.stringify(integrity, null, 2) + '\n');
  }

  requireProof(
    record?.sha256 === evidenceHash(content),
    'Checkpoint requires matching reviewed migration integrity hash',
  );

  const options = change
    ? record.approval?.kind === 'manual'
      ? {
          ...verifyReviewedEnumCandidate(file, content, change),
          tables: [change.table],
        }
      : verifyEnumAutomaticCandidate(file, content, change)
    : determinedPolicy === CHECKPOINT_POLICY && up && down
      ? { ...verifyAutomaticCandidate(file, content, up, down), up }
      : { tables: [], up: up ?? [], down: down ?? [] };

  const snapshot = await dumpSchema(real);
  requireProof(
    schemaHash(snapshot) === state.proof.schemaSha256,
    'Input schema changed before isolation',
  );

  const trials: Awaited<ReturnType<typeof isolatedTrial>>[] = [];
  for (let index = 0; index < 2; index++) {
    console.log(
      `Preparing isolated PostgreSQL checkpoint trial ${index + 1}/2 for ${name}`,
    );
    trials.push(
      await isolatedTrial(
        real,
        snapshot,
        state.rows,
        name!,
        options.tables[0],
        options.up,
        options.down,
        change,
        determinedPolicy,
        file,
      ),
    );
  }

  requireProof(
    trials[0].evidence.systemIdentifier !==
      trials[1].evidence.systemIdentifier &&
      trials[0].evidence.afterHash === trials[1].evidence.afterHash &&
      equal(trials[0].evidence.executedUp, trials[1].evidence.executedUp) &&
      equal(trials[0].evidence.executedDown, trials[1].evidence.executedDown),
    'Independent isolated trials did not converge',
  );

  const latest = await verifyMigrationState(real);
  requireProof(
    latest.errors.length === 0 &&
      latest.proof.schemaSha256 === state.proof.schemaSha256 &&
      equal(normalizedHistory(latest.rows), normalizedHistory(state.rows)) &&
      readFileSync(file, 'utf8') === content,
    'Real input or approved migration changed during evidence preparation',
  );

  const stamp = name!.slice(-13);
  const schemaFile = `checkpoints/automatic-${stamp}.sql`;
  const evidenceFile = `evidence/automatic-${stamp}.json`;
  const evidence =
    JSON.stringify(
      {
        kind: 'automatic',
        policy: determinedPolicy,
        migration: {
          name: name!,
          file: basename(file),
          sha256: record.sha256,
          up: options.up.length
            ? options.up.map(change ? sqlTokens : (sql: string) => sql.trim())
            : trials[0].evidence.executedUp,
          down: options.down.length
            ? options.down.map(change ? sqlTokens : (sql: string) => sql.trim())
            : trials[0].evidence.executedDown,
          ...(change ? { approval: record.approval, enumChange: change } : {}),
        },
        input: {
          applied: state.proof.applied,
          schemaSha256: trials[0].evidence.beforeHash,
          sourceSchemaSha256: state.proof.schemaSha256,
          checkpointSha256: parent!.schemaSha256,
          history: normalizedHistory(state.rows),
          initialization: 'verified-schema-only-clone-and-history-copy',
        },
        output: { applied, schemaSha256: trials[0].evidence.afterHash },
        trials: trials.map((trial) => trial.evidence),
      },
      null,
      2,
    ) + '\n';

  const checkpoint: AutomaticCheckpoint = {
    applied,
    schemaFile,
    schemaSha256: trials[0].evidence.afterHash,
    evidence:
      determinedPolicy === GENERAL_VERIFIED_POLICY
        ? 'Automatic policy: two independent PostgreSQL 18 instances; verified input, exact executed SQL, whole-schema verification, ORM schema alignment and committed rollback.'
        : 'Automatic policy: two independent PostgreSQL 18 instances; verified input, exact executed SQL, whole-schema exclusion scope, catalog convergence and committed rollback.',
    approval: {
      kind: 'automatic',
      policy: determinedPolicy,
      evidenceFile,
      evidenceSha256: evidenceHash(evidence),
    },
  };

  const registryPath = join(directory, 'automatic-checkpoints.json');
  const lock = `${registryPath}.lock`;
  const temporary = `${registryPath}.${process.pid}.tmp`;
  writeFileSync(lock, '', { flag: 'wx' });
  let temporaryCreated = false;
  try {
    const registry = existsSync(registryPath)
      ? JSON.parse(readFileSync(registryPath, 'utf8'))
      : { policy: CHECKPOINT_POLICY, checkpoints: [] };
    requireProof(
      !registry.checkpoints.some((item: any) => equal(item.applied, applied)),
      'Checkpoint state was concurrently registered',
    );
    for (const [relative, text] of [
      [schemaFile, trials[0].sql],
      [evidenceFile, evidence],
    ]) {
      const target = join(directory, relative);
      mkdirSync(dirname(target), { recursive: true });
      if (existsSync(target))
        requireProof(
          readFileSync(target, 'utf8') === text,
          'Existing evidence artifact differs; refusing overwrite',
        );
      else writeFileSync(target, text, { flag: 'wx' });
    }
    loadAutomaticCheckpoints(directory, baseline.checkpoints, schemaHash, {
      policy: CHECKPOINT_POLICY,
      checkpoints: [checkpoint],
    });
    registry.checkpoints.push(checkpoint);
    writeFileSync(temporary, JSON.stringify(registry, null, 2) + '\n', {
      flag: 'wx',
    });
    temporaryCreated = true;
    renameSync(temporary, registryPath);
    temporaryCreated = false;
    loadBaseline();
    console.log(`Automatic checkpoint approved: ${name}`);
  } finally {
    if (temporaryCreated) unlinkSync(temporary);
    unlinkSync(lock);
  }
}

