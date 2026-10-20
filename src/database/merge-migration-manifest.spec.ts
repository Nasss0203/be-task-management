import { mergeManifests } from '../../scripts/merge-migration-manifest';

const record = (file: string, sha256 = 'a') => ({ file, sha256 });
const manifest = (...files: ReturnType<typeof record>[]) => ({ files });

describe('mergeManifests', () => {
  it('keeps the records both branches appended', () => {
    const base = manifest(record('1-Base.ts'));
    const result = mergeManifests(
      base,
      manifest(record('1-Base.ts'), record('3-Ours.ts')),
      manifest(record('1-Base.ts'), record('2-Theirs.ts')),
    );
    expect(result.conflicts).toEqual([]);
    expect(result.manifest.files.map((item) => item.file)).toEqual([
      '1-Base.ts',
      '2-Theirs.ts',
      '3-Ours.ts',
    ]);
  });

  it('takes a one-sided change or removal', () => {
    const result = mergeManifests(
      manifest(record('1-A.ts'), record('2-B.ts')),
      manifest(record('1-A.ts'), record('2-B.ts')),
      manifest(record('1-A.ts', 'b')),
    );
    expect(result.manifest.files).toEqual([record('1-A.ts', 'b')]);
  });

  it('reports records both branches changed differently', () => {
    const result = mergeManifests(
      manifest(record('1-A.ts')),
      manifest(record('1-A.ts', 'b')),
      manifest(record('1-A.ts', 'c')),
    );
    expect(result.conflicts).toEqual(['1-A.ts']);
  });
});
