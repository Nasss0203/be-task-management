import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { TemplateSnapshotFingerprintService } from './template-snapshot-fingerprint.service';
import {
  TemplateVersionContentSnapshotService,
  type PreparedTemplateSnapshot,
} from './template-version-content-snapshot.service';
import type { PageTemplateBlockRepository } from '../../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateBlock } from '../../domain/entities/page-template-block.entity';
import type { PageTemplateDatabase } from '../../domain/aggregates/template-database/page-template-database.aggregate';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';

function snapshotFixture(): PreparedTemplateSnapshot {
  return {
    blocks: [
      {
        sourceId: 'parent',
        parentSourceId: null,
        type: PageBlockType.TOGGLE,
        title: null,
        positionX: null,
        positionY: null,
        width: null,
        height: null,
        orderIndex: 0,
        content: { text: 'Hello', nested: { a: 1, b: 2 } },
        styleConfig: { color: 'blue' },
        dataConfig: null,
        isOpen: true,
      },
      {
        sourceId: 'child',
        parentSourceId: 'parent',
        type: PageBlockType.DATABASE_VIEW,
        title: null,
        positionX: null,
        positionY: null,
        width: null,
        height: null,
        orderIndex: 1,
        content: null,
        styleConfig: null,
        dataConfig: { database_id: 'db', view_id: 'view' },
        isOpen: true,
      },
    ],
    databases: [
      {
        database: { id: 'db', pageId: 'page', name: 'Tasks' },
        properties: [
          {
            id: 'select',
            databaseId: 'db',
            name: 'Status',
            type: PropertyType.SELECT,
            isDefault: false,
            isHideable: true,
            position: 'a0',
            options: [0, 1].map((n) => ({
              id: `option-${n}`,
              propertyId: 'select',
              name: `Option ${n}`,
              color: 'blue',
              position: `a${n}`,
            })),
          },
          {
            id: 'person',
            databaseId: 'db',
            name: 'Person',
            type: PropertyType.PERSON,
            isDefault: false,
            isHideable: true,
            position: 'a1',
            options: [],
          },
          {
            id: 'file',
            databaseId: 'db',
            name: 'File',
            type: PropertyType.FILE,
            isDefault: false,
            isHideable: true,
            position: 'a2',
            options: [],
          },
        ],
        rows: [0, 1].map((n) => ({
          id: `row-${n}`,
          databaseId: 'db',
          values: [
            {
              id: `value-${n}`,
              rowId: `row-${n}`,
              propertyId: 'select',
              value: `option-${n}`,
            },
            {
              id: `person-${n}`,
              rowId: `row-${n}`,
              propertyId: 'person',
              value: ['raw-person'],
            },
            {
              id: `file-${n}`,
              rowId: `row-${n}`,
              propertyId: 'file',
              value: ['raw-file'],
            },
          ],
        })),
        views: [
          {
            id: 'view',
            databaseId: 'db',
            name: 'Table',
            type: DatabaseViewType.TABLE,
            position: 'a0',
            properties: [
              {
                id: 'vp',
                viewId: 'view',
                propertyId: 'select',
                position: 'a0',
                visible: true,
                width: 150,
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('TemplateSnapshotFingerprintService', () => {
  const service = new TemplateSnapshotFingerprintService();
  const compute = (input: PreparedTemplateSnapshot) => service.compute(input);

  it('returns deterministic 64 lowercase hex SHA-256 without mutation', () => {
    const input = snapshotFixture();
    const before = structuredClone(input);
    expect(compute(input)).toMatch(/^[a-f0-9]{64}$/);
    expect(compute(input)).toBe(compute(structuredClone(input)));
    expect(input).toEqual(before);
  });

  it('ignores recursive object key ordering, including numeric-looking keys', () => {
    const a = snapshotFixture();
    const b = snapshotFixture();
    a.blocks[0].content = { '10': 'ten', '2': 'two', nested: { a: 1, b: 2 } };
    b.blocks[0].content = { nested: { b: 2, a: 1 }, '2': 'two', '10': 'ten' };
    expect(compute(a)).toBe(compute(b));
  });

  it.each<[string, (s: PreparedTemplateSnapshot) => void]>([
    [
      'block content',
      (s) => {
        s.blocks[0].content = { text: 'Hello world' };
      },
    ],
    [
      'block array order',
      (s) => {
        s.blocks.reverse();
      },
    ],
    [
      'block orderIndex',
      (s) => {
        s.blocks[0].orderIndex++;
      },
    ],
    [
      'parent hierarchy',
      (s) => {
        s.blocks[1].parentSourceId = null;
      },
    ],
    [
      'style',
      (s) => {
        s.blocks[0].styleConfig = { color: 'red' };
      },
    ],
    [
      'title',
      (s) => {
        s.blocks[0].title = 'Title';
      },
    ],
    [
      'layout',
      (s) => {
        s.blocks[0].width = 300;
      },
    ],
    [
      'open state',
      (s) => {
        s.blocks[0].isOpen = false;
      },
    ],
    [
      'database name',
      (s) => {
        s.databases[0].database.name = 'Renamed';
      },
    ],
    [
      'database reference',
      (s) => {
        s.blocks[1].dataConfig = { database_id: 'other', view_id: 'view' };
      },
    ],
    [
      'view reference',
      (s) => {
        s.blocks[1].dataConfig = { database_id: 'db', view_id: 'other' };
      },
    ],
    [
      'property name',
      (s) => {
        s.databases[0].properties[0].name = 'Renamed';
      },
    ],
    [
      'property flags',
      (s) => {
        s.databases[0].properties[0].isHideable = false;
      },
    ],
    [
      'property position',
      (s) => {
        s.databases[0].properties[0].position = 'z0';
      },
    ],
    [
      'property added',
      (s) => {
        s.databases[0].properties.push({
          ...s.databases[0].properties[1],
          id: 'new',
        });
      },
    ],
    [
      'property removed',
      (s) => {
        s.databases[0].properties.pop();
      },
    ],
    [
      'property reordered',
      (s) => {
        s.databases[0].properties.reverse();
      },
    ],
    [
      'option added',
      (s) => {
        s.databases[0].properties[0].options.push({
          ...s.databases[0].properties[0].options[0],
          id: 'new',
        });
      },
    ],
    [
      'option removed',
      (s) => {
        s.databases[0].properties[0].options.pop();
      },
    ],
    [
      'option renamed',
      (s) => {
        s.databases[0].properties[0].options[0].name = 'Renamed';
      },
    ],
    [
      'option reordered',
      (s) => {
        s.databases[0].properties[0].options.reverse();
      },
    ],
    [
      'option position',
      (s) => {
        s.databases[0].properties[0].options[0].position = 'z0';
      },
    ],
    [
      'option color',
      (s) => {
        s.databases[0].properties[0].options[0].color = 'red';
      },
    ],
    [
      'row value',
      (s) => {
        s.databases[0].rows[0].values[0].value = 'option-1';
      },
    ],
    [
      'row order',
      (s) => {
        s.databases[0].rows.reverse();
      },
    ],
    [
      'row added',
      (s) => {
        s.databases[0].rows.push(structuredClone(s.databases[0].rows[0]));
      },
    ],
    [
      'row values order',
      (s) => {
        s.databases[0].rows[0].values.reverse();
      },
    ],
    [
      'PERSON raw values',
      (s) => {
        s.databases[0].rows[0].values[1].value = ['other-person'];
      },
    ],
    [
      'FILE raw values',
      (s) => {
        s.databases[0].rows[0].values[2].value = ['other-file'];
      },
    ],
    [
      'view name',
      (s) => {
        s.databases[0].views[0].name = 'Renamed';
      },
    ],
    [
      'view type',
      (s) => {
        s.databases[0].views[0].type = DatabaseViewType.BOARD;
      },
    ],
    [
      'view position',
      (s) => {
        s.databases[0].views[0].position = 'z0';
      },
    ],
    [
      'view added',
      (s) => {
        s.databases[0].views.push({
          ...s.databases[0].views[0],
          id: 'new-view',
        });
      },
    ],
    [
      'view property reference',
      (s) => {
        s.databases[0].views[0].properties[0].propertyId = 'person';
      },
    ],
    [
      'view visibility',
      (s) => {
        s.databases[0].views[0].properties[0].visible = false;
      },
    ],
    [
      'view width',
      (s) => {
        s.databases[0].views[0].properties[0].width = 200;
      },
    ],
    [
      'view property position',
      (s) => {
        s.databases[0].views[0].properties[0].position = 'z0';
      },
    ],
  ])('detects %s changes', (_name, mutate) => {
    const input = snapshotFixture();
    const changed = structuredClone(input);
    mutate(changed);
    expect(compute(changed)).not.toBe(compute(input));
  });

  it('ignores persistence IDs and lifecycle, author, and timestamp metadata', () => {
    const a = snapshotFixture();
    const b = snapshotFixture();
    Object.assign(b, {
      versionId: 'generated-version',
      status: 'PUBLISHED',
      createdBy: 'author',
      publishedAt: new Date(),
      updatedAt: new Date(),
    });
    b.blocks.forEach((block) =>
      Object.assign(block, {
        id: 'generated-block',
        createdBy: 'author',
        updatedAt: new Date(),
      }),
    );
    b.databases[0].rows.forEach((row) => {
      row.id = 'irrelevant-row';
      row.values.forEach((value) => {
        value.id = 'irrelevant-value';
        value.rowId = row.id;
      });
    });
    b.databases[0].views[0].properties[0].id = 'irrelevant-view-property';
    expect(compute(a)).toBe(compute(b));
  });

  it('normalizes missing/undefined nullable fields and factory defaults', () => {
    const a = snapshotFixture();
    const b = snapshotFixture();
    Reflect.deleteProperty(b.blocks[0], 'title');
    Object.assign(b.blocks[0], {
      width: undefined,
      orderIndex: undefined,
      isOpen: undefined,
    });
    Reflect.deleteProperty(b.databases[0].properties[0], 'isHideable');
    expect(compute(a)).toBe(compute(b));
    a.blocks[0].content = { a: null };
    b.blocks[0].content = { a: undefined };
    expect(compute(a)).not.toBe(compute(b));
    a.blocks[0].content = {};
    expect(compute(a)).toBe(compute(b));
    b.blocks[0].content = [];
    expect(compute(a)).not.toBe(compute(b));
  });

  it('matches database factory trimming', () => {
    const a = snapshotFixture();
    const b = snapshotFixture();
    b.databases[0].database.name = ' Tasks ';
    b.databases[0].properties[0].position = ' a0 ';
    expect(compute(a)).toBe(compute(b));
  });
});

describe('TemplateVersionContentSnapshotService preparation', () => {
  it('reads each source once, detaches input, and persists the same content with fresh IDs', async () => {
    const source = snapshotFixture();
    source.blocks.push({
      ...source.blocks[1],
      sourceId: 'other-view-block',
      orderIndex: 2,
    });
    const reader = {
      getDatabaseSnapshot: jest.fn().mockResolvedValue(source.databases[0]),
    };
    const savedBlocks: PageTemplateBlock[][] = [];
    const savedGraphs: PageTemplateDatabase[][] = [];
    const blockRepo = {
      saveMany: jest.fn((blocks: PageTemplateBlock[]) => {
        savedBlocks.push(blocks);
        return Promise.resolve(blocks);
      }),
    } as unknown as PageTemplateBlockRepository;
    const graphRepo = {
      saveMany: jest.fn((graphs: PageTemplateDatabase[]) => {
        savedGraphs.push(graphs);
        return Promise.resolve();
      }),
    } as unknown as PageTemplateDatabaseSnapshotRepository;
    const service = new TemplateVersionContentSnapshotService(
      reader,
      blockRepo,
      graphRepo,
    );
    const context = {} as PersistenceContext;
    const prepared = await service.prepare({ blocks: source.blocks, context });
    const fingerprint = new TemplateSnapshotFingerprintService();
    const hash = fingerprint.compute(prepared);
    source.blocks[0].content = { text: 'Changed after read' };
    source.databases[0].rows[0].values[0].value = 'option-1';
    for (const versionId of ['v1', 'v2']) {
      await service.persist({
        snapshot: prepared,
        versionId,
        userId: 'author',
        context,
      });
    }
    expect(reader.getDatabaseSnapshot).toHaveBeenCalledTimes(1);
    expect(reader.getDatabaseSnapshot).toHaveBeenCalledWith('db', context);
    expect(fingerprint.compute(prepared)).toBe(hash);
    expect(savedBlocks[0][0].getContent()).toMatchObject({ text: 'Hello' });
    expect(savedBlocks[0][0].getId()).not.toBe(savedBlocks[1][0].getId());
    expect(savedGraphs[0][0].getId()).not.toBe(savedGraphs[1][0].getId());
    const graph = savedGraphs[0][0];
    expect(graph.getRows()[0].getValues()[0].getValue()).toBe(
      graph.getProperties()[0].getOptions()[0].getId(),
    );
    expect(graph.getRows()[0].getValues()[1].getValue()).toEqual([
      'raw-person',
    ]);
    expect(graph.getRows()[0].getValues()[2].getValue()).toEqual(['raw-file']);
    expect(savedBlocks[0][1].getDataConfig()).toMatchObject({
      database_id: graph.getId(),
      view_id: graph.getViews()[0].getId(),
    });
  });

  it.each(['missing database', 'wrong view', 'cycle'])(
    'rejects %s during preparation before writes',
    async (kind) => {
      const source = snapshotFixture();
      if (kind === 'wrong view') source.databases[0].views = [];
      if (kind === 'cycle') source.blocks[0].parentSourceId = 'child';
      const reader = {
        getDatabaseSnapshot: jest
          .fn()
          .mockResolvedValue(
            kind === 'missing database' ? null : source.databases[0],
          ),
      };
      const saveMany = jest.fn();
      const service = new TemplateVersionContentSnapshotService(
        reader,
        { saveMany } as unknown as PageTemplateBlockRepository,
        { saveMany } as unknown as PageTemplateDatabaseSnapshotRepository,
      );
      await expect(
        service.prepare({
          blocks: source.blocks,
          context: {} as PersistenceContext,
        }),
      ).rejects.toThrow();
      expect(saveMany).not.toHaveBeenCalled();
    },
  );
});
