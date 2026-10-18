import {
  findEntityFiles,
  syncEntitiesSource,
} from '../../scripts/sync-entities';

const source = [
  "import 'reflect-metadata';",
  "import { A } from 'src/modules/a/a.orm-entity';",
  "import { C } from 'src/modules/c/c.orm-entity';",
  '',
  'export const DATABASE_ENTITIES = [',
  '  C,',
  '  A,',
  '];',
  '',
].join('\n');

describe('syncEntitiesSource', () => {
  it('adds a new entity import and array entry in path order', () => {
    const result = syncEntitiesSource(
      source,
      [
        { importPath: 'src/modules/a/a.orm-entity', className: 'A' },
        { importPath: 'src/modules/b/b.orm-entity', className: 'B' },
        { importPath: 'src/modules/c/c.orm-entity', className: 'C' },
      ],
      () => true,
    );

    expect(result.added).toEqual(['B']);
    expect(result.source).toBe(
      [
        "import 'reflect-metadata';",
        "import { A } from 'src/modules/a/a.orm-entity';",
        "import { B } from 'src/modules/b/b.orm-entity';",
        "import { C } from 'src/modules/c/c.orm-entity';",
        '',
        'export const DATABASE_ENTITIES = [',
        '  C,',
        '  A,',
        '  B,',
        '];',
        '',
      ].join('\n'),
    );
  });

  it('drops entities whose file was deleted and keeps CRLF', () => {
    const result = syncEntitiesSource(
      source.replace(/\n/g, '\r\n'),
      [{ importPath: 'src/modules/a/a.orm-entity', className: 'A' }],
      (path) => path !== 'src/modules/c/c.orm-entity',
    );

    expect(result.removed).toEqual(['C']);
    expect(result.source).not.toMatch(/\bC\b/);
    expect(result.source).toContain('  A,\r\n];');
  });

  it('leaves an in-sync file untouched', () => {
    const entities = [
      { importPath: 'src/modules/a/a.orm-entity', className: 'A' },
      { importPath: 'src/modules/c/c.orm-entity', className: 'C' },
    ];
    expect(syncEntitiesSource(source, entities, () => true).source).toBe(
      source,
    );
  });

  it('finds every real ORM entity file', () => {
    expect(findEntityFiles().length).toBeGreaterThanOrEqual(64);
  });
});
