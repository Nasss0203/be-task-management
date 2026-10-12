import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { migrationFiles } from './database-options';

type IntegrityManifest = { files: { file: string; sha256: string }[] };

// This review snapshot detects later edits. TypeORM history has no SQL hashes,
// so it cannot prove which bytes an older deployment originally executed.
export function migrationIntegrityProblems(): string[] {
  const manifest = JSON.parse(
    readFileSync(join(__dirname, 'migration-review-manifest.json'), 'utf8'),
  ) as IntegrityManifest;
  const files = new Map(
    migrationFiles(undefined, undefined, 'review').map((file) => [
      basename(file),
      file,
    ]),
  );
  const problems: string[] = [];
  for (const expected of manifest.files) {
    const file = files.get(expected.file);
    if (!file) {
      problems.push(`Reviewed migration file missing: ${expected.file}`);
      continue;
    }
    const hash = createHash('sha256')
      .update(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))
      .digest('hex');
    if (hash !== expected.sha256)
      problems.push(`Reviewed migration content changed: ${expected.file}`);
  }
  for (const file of migrationFiles()) {
    if (!manifest.files.some((expected) => expected.file === basename(file)))
      problems.push(
        `Active migration lacks a reviewed integrity record: ${basename(file)}`,
      );
  }
  return problems;
}
