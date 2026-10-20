import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

type ReviewRecord = { file: string };
type Manifest = { files: ReviewRecord[] };

/**
 * Three-way merge of review records keyed by migration file. Two branches that
 * each generated a migration both append a record, which plain text merge
 * always reports as a conflict.
 */
export function mergeManifests(
  base: Manifest,
  ours: Manifest,
  theirs: Manifest,
): { manifest: Manifest; conflicts: string[] } {
  const byFile = (manifest: Manifest) =>
    new Map(manifest.files.map((record) => [record.file, record]));
  const [b, o, t] = [base, ours, theirs].map(byFile);
  const same = (x?: ReviewRecord, y?: ReviewRecord) =>
    JSON.stringify(x) === JSON.stringify(y);
  const conflicts: string[] = [];
  const files = [...new Set([...o.keys(), ...t.keys()])]
    .sort()
    .flatMap((file) => {
      const [rb, ro, rt] = [b, o, t].map((records) => records.get(file));
      // Take the side that changed; a missing record on that side is a removal.
      const onlyTheirsChanged = same(ro, rb);
      if (!onlyTheirsChanged && !same(rt, rb) && !same(ro, rt))
        conflicts.push(file);
      const pick = onlyTheirsChanged ? rt : ro;
      return pick ? [pick] : [];
    });
  return { manifest: { ...ours, files }, conflicts };
}

if (require.main === module) {
  const [base, ours, theirs] = process.argv.slice(2);
  if (base === '--install') {
    // Registers this file as the git merge driver named in .gitattributes.
    try {
      execFileSync('git', [
        'config',
        'merge.migration-manifest.driver',
        'node -r ts-node/register/transpile-only scripts/merge-migration-manifest.ts %O %A %B',
      ]);
    } catch {
      // No git (e.g. Docker build): nothing to merge there.
    }
  } else {
    const read = (file: string): Manifest => {
      const text = readFileSync(file, 'utf8');
      return text.trim() ? (JSON.parse(text) as Manifest) : { files: [] };
    };
    const { manifest, conflicts } = mergeManifests(
      read(base),
      read(ours),
      read(theirs),
    );
    writeFileSync(ours, JSON.stringify(manifest, null, 2) + '\n');
    if (conflicts.length) {
      console.error(
        `Both branches changed review records differently: ${conflicts.join(', ')}`,
      );
      process.exitCode = 1;
    }
  }
}
