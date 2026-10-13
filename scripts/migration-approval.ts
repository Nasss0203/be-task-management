import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { generationProblems } from '../src/database/migration-safety';

export const AUTOMATIC_POLICY = 'single-new-table-v1';

export function automaticGenerationOptions(queries: string[]) {
  const tablePattern =
    /^CREATE TABLE\s+(?:"public"\.)?"([a-z][a-z0-9_]*)"\s+\([\s\S]+\)\s*$/;
  const indexPattern =
    /^CREATE (?:UNIQUE )?INDEX "([A-Za-z][A-Za-z0-9_]*)" ON\s+(?:"public"\.)?"([a-z][a-z0-9_]*)"\s+\((?:"[a-z][a-z0-9_]*"(?:, )?)+\)\s*$/;
  const created = queries.flatMap((sql) => sql.match(tablePattern)?.[1] ?? []);
  if (created.length !== 1 || !queries[0]?.match(tablePattern)) {
    throw new Error(
      'Automatic approval requires exactly one CREATE TABLE followed only by its column indexes',
    );
  }
  const table = created[0];
  const indexes: string[] = [];
  for (const sql of queries) {
    const index = sql.match(indexPattern);
    if (
      (sql.match(tablePattern)?.[1] ?? index?.[2]) !== table ||
      /;|--|\/\*|\bREFERENCES\b/i.test(sql)
    ) {
      throw new Error(
        `Automatic approval rejects unsupported or out-of-scope SQL: ${sql}`,
      );
    }
    if (index) indexes.push(index[1]);
  }
  if (new Set(indexes).size !== indexes.length)
    throw new Error('Duplicate created indexes');
  const problems = generationProblems(queries, [table]);
  if (problems.length) throw new Error(problems.join('\n'));
  return {
    name: `Create${table
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('')}`,
    tables: [table],
    down: [
      ...indexes.map((index) => `DROP INDEX "public"."${index}"`),
      `DROP TABLE "${table}"`,
    ],
  };
}

export function renderMigration(
  name: string,
  timestamp: number,
  up: string[],
  down: string[],
): string {
  const statements = (queries: string[]) =>
    queries
      .map((sql) => `    await runner.query(${JSON.stringify(sql)});`)
      .join('\n');
  return `import { MigrationInterface, QueryRunner } from 'typeorm';\n\nexport class ${name}${timestamp} implements MigrationInterface {\n  name = '${name}${timestamp}';\n  async up(runner: QueryRunner): Promise<void> {\n${statements(up)}\n  }\n  async down(runner: QueryRunner): Promise<void> {\n${statements(down)}\n  }\n}\n`;
}

// Parse static generator output without importing/executing candidate code.
// Exact reconstruction rejects extra imports, constructors, hooks and JS logic.
export function verifyAutomaticCandidate(
  file: string,
  content: string,
  expectedUp?: string[],
  expectedDown?: string[],
) {
  const identity = basename(file).match(/^(\d{13})-(Create[A-Za-z0-9]+)\.ts$/);
  if (!identity)
    throw new Error('Candidate does not have the generator naming convention');
  const normalized = content.replace(/\r\n/g, '\n');
  const calls = [
    ...normalized.matchAll(/    await runner\.query\(("(?:[^"\\]|\\.)*")\);/g),
  ].map((match) => JSON.parse(match[1]) as string);
  const split = normalized.indexOf('  async down(');
  const upCount = [
    ...normalized.slice(0, split).matchAll(/    await runner\.query\(/g),
  ].length;
  const up = calls.slice(0, upCount);
  const down = calls.slice(upCount);
  if (
    normalized !== renderMigration(identity[2], Number(identity[1]), up, down)
  ) {
    throw new Error(
      'Candidate is not exact static generator output; manual review required',
    );
  }
  const options = automaticGenerationOptions(up);
  if (options.name !== identity[2])
    throw new Error('Candidate name does not match its new table');
  const same = (a: string[], b: string[]) =>
    JSON.stringify(a.map((sql) => sql.trim())) ===
    JSON.stringify(b.map((sql) => sql.trim()));
  if (expectedUp && !same(up, expectedUp))
    throw new Error('Candidate up() does not match the entire live ORM diff');
  if (!same(down, options.down))
    throw new Error(
      'Candidate down() must drop exactly its indexes before its table',
    );
  const expectedRollback = expectedDown?.map((sql) => sql.trim()).sort();
  if (
    expectedRollback &&
    JSON.stringify([...down].map((sql) => sql.trim()).sort()) !==
      JSON.stringify(expectedRollback)
  ) {
    throw new Error('Candidate down() does not match the ORM rollback objects');
  }
  return options;
}

export function registerAutomaticIntegrity(
  file: string,
  expectedUp: string[],
  expectedDown: string[],
) {
  const content = readFileSync(file, 'utf8');
  const options = verifyAutomaticCandidate(
    file,
    content,
    expectedUp,
    expectedDown,
  );
  const manifestPath = join(
    process.cwd(),
    'src/database/migration-review-manifest.json',
  );
  const lock = `${manifestPath}.lock`;
  const temporary = `${manifestPath}.${process.pid}.tmp`;
  writeFileSync(lock, '', { flag: 'wx' });
  let temporaryCreated = false;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      files: { file: string; sha256: string; approval?: unknown }[];
    };
    const sha256 = createHash('sha256')
      .update(content.replace(/\r\n/g, '\n'))
      .digest('hex');
    const existing = manifest.files.find(
      (record) => record.file === basename(file),
    );
    if (existing) {
      if (existing.sha256 !== sha256)
        throw new Error(
          'Approved migration changed; automatic re-approval is forbidden',
        );
      return 'existing' as const;
    }
    manifest.files.push({
      file: basename(file),
      sha256,
      approval: {
        kind: 'automatic',
        policy: AUTOMATIC_POLICY,
        generator: 'scripts/migration-tools.ts',
        evidence: 'static-generator-format-and-live-orm-diff',
        tables: options.tables,
      },
    });
    if (readFileSync(file, 'utf8') !== content)
      throw new Error('Candidate changed during approval');
    writeFileSync(temporary, JSON.stringify(manifest, null, 2) + '\n', {
      flag: 'wx',
    });
    temporaryCreated = true;
    renameSync(temporary, manifestPath);
    temporaryCreated = false;
    return 'registered' as const;
  } finally {
    if (temporaryCreated) unlinkSync(temporary);
    unlinkSync(lock);
  }
}
