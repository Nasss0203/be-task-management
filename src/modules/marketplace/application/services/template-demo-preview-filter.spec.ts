import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { TemplatePreviewResponseDto } from 'src/modules/template/application/dto/template-preview/template-preview.response.dto';

import { TemplateDemoConfig } from '../../domain/value-objects/template-demo-config.vo';
import {
  applyTemplateDemoFilter,
  assertDemoConfigMatchesSnapshot,
} from './template-demo-preview-filter';

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const B_INTRO = id(1);
const B_TOGGLE = id(2);
const B_TOGGLE_CHILD = id(3);
const B_SECRET = id(4);
const B_DB_VIEW = id(5);
const B_IMAGE = id(6);
const B_FILE = id(7);
const B_ORPHAN = id(8);
const DB = id(20);
const VIEW = id(21);
const OTHER_VIEW = id(22);
const P_TITLE = id(30);
const P_STATUS = id(31);
const P_PRICE = id(32);
const P_OWNER = id(33);
const P_FILES = id(34);
const ROWS = [id(40), id(41), id(42), id(43)];
const OTHER_DB = id(50);

function block(
  blockId: string,
  type: PageBlockType,
  extra: Partial<TemplatePreviewResponseDto['blocks'][number]> = {},
) {
  return {
    id: blockId,
    version_id: 'v',
    parent_block_id: null,
    type,
    title: null,
    position_x: null,
    position_y: null,
    width: null,
    height: null,
    order_index: 0,
    content: { text: `content of ${blockId}` },
    style_config: {},
    data_config: {},
    created_by: 'creator',
    is_open: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...extra,
  } as TemplatePreviewResponseDto['blocks'][number];
}

function property(propertyId: string, type: PropertyType) {
  return {
    id: propertyId,
    template_database_id: DB,
    name: propertyId,
    type,
    is_default: false,
    is_hideable: true,
    position: 'a',
    options: [],
  };
}

function snapshot(): TemplatePreviewResponseDto {
  const properties = [
    property(P_TITLE, PropertyType.TITLE),
    property(P_STATUS, PropertyType.STATUS),
    property(P_PRICE, PropertyType.NUMBER),
    property(P_OWNER, PropertyType.PERSON),
    property(P_FILES, PropertyType.FILE),
  ];
  return new TemplatePreviewResponseDto({
    template: { id: 'tpl' } as never,
    version: { id: 'ver' } as never,
    blocks: [
      block(B_INTRO, PageBlockType.TEXT),
      block(B_TOGGLE, PageBlockType.TOGGLE),
      block(B_TOGGLE_CHILD, PageBlockType.TEXT, { parent_block_id: B_TOGGLE }),
      block(B_SECRET, PageBlockType.TEXT, { content: { text: 'PAID SECRET' } }),
      block(B_DB_VIEW, PageBlockType.DATABASE_VIEW, {
        data_config: { database_id: DB, view_id: VIEW },
      }),
      block(B_IMAGE, PageBlockType.IMAGE, {
        content: {
          url: 'https://bucket.example.com/img.png?X-Amz-Signature=abc',
          attachmentId: 'att-1',
          caption: 'cover',
        },
      }),
      block(B_FILE, PageBlockType.FILE, { content: { attachmentId: 'att-2' } }),
      block(B_ORPHAN, PageBlockType.TEXT, { parent_block_id: id(999) }),
    ],
    databases: [
      {
        id: DB,
        version_id: 'v',
        name: 'Tasks',
        properties,
        rows: ROWS.map((rowId) => ({
          id: rowId,
          template_database_id: DB,
          values: properties.map((p) => ({
            id: `${rowId}-${p.id}`,
            template_row_id: rowId,
            template_property_id: p.id,
            value: `${p.id} of ${rowId}`,
          })),
        })),
        views: [VIEW, OTHER_VIEW].map((viewId) => ({
          id: viewId,
          template_database_id: DB,
          name: viewId,
          type: 'TABLE' as never,
          position: 'a',
          properties: properties.map((p) => ({
            id: `${viewId}-${p.id}`,
            template_view_id: viewId,
            template_property_id: p.id,
            position: 'a',
            visible: true,
            width: null,
          })),
        })),
      },
      {
        id: OTHER_DB,
        version_id: 'v',
        name: 'Unreferenced',
        properties: [],
        rows: [],
        views: [],
      },
    ],
  });
}

const config = (overrides: Record<string, unknown> = {}) =>
  TemplateDemoConfig.parse({
    schema: 1,
    scope: 'LIMITED',
    block_ids: [
      B_INTRO,
      B_TOGGLE,
      B_TOGGLE_CHILD,
      B_DB_VIEW,
      B_IMAGE,
      B_FILE,
      B_ORPHAN,
    ],
    databases: {
      [DB]: {
        view_ids: [VIEW],
        property_ids: [P_STATUS, P_OWNER, P_FILES],
        row_limit: 2,
      },
      [OTHER_DB]: { view_ids: [id(51)], row_limit: 1 },
    },
    ...overrides,
  })!;

const allText = (value: unknown) => JSON.stringify(value);

describe('applyTemplateDemoFilter', () => {
  it('returns only allowlisted blocks and never the hidden content', () => {
    const { preview, hidden } = applyTemplateDemoFilter(snapshot(), config());

    expect(preview.blocks.map((b) => b.id)).toEqual([
      B_INTRO,
      B_TOGGLE,
      B_TOGGLE_CHILD,
      B_DB_VIEW,
      B_IMAGE,
    ]);
    expect(allText(preview)).not.toContain('PAID SECRET');
    expect(hidden.blocks).toBe(3);
  });

  it('hides children of hidden blocks even when the child is allowlisted', () => {
    const { preview } = applyTemplateDemoFilter(
      snapshot(),
      config({ block_ids: [B_TOGGLE_CHILD, B_INTRO] }),
    );
    expect(preview.blocks.map((b) => b.id)).toEqual([B_INTRO]);
  });

  it('drops database views whose view is not allowlisted', () => {
    const { preview } = applyTemplateDemoFilter(
      snapshot(),
      config({
        databases: { [DB]: { view_ids: [OTHER_VIEW], row_limit: 1 } },
      }),
    );
    expect(preview.blocks.map((b) => b.id)).not.toContain(B_DB_VIEW);
    expect(preview.databases).toEqual([]);
  });

  it('strips hidden and private property values, metadata and views', () => {
    const { preview } = applyTemplateDemoFilter(snapshot(), config());
    const [database] = preview.databases;

    expect(database.properties.map((p) => p.id)).toEqual([P_TITLE, P_STATUS]);
    expect(database.views.map((v) => v.id)).toEqual([VIEW]);
    expect(
      database.views[0].properties.map((p) => p.template_property_id),
    ).toEqual([P_TITLE, P_STATUS]);
    for (const row of database.rows) {
      expect(row.values.map((v) => v.template_property_id)).toEqual([
        P_TITLE,
        P_STATUS,
      ]);
    }
    const text = allText(database);
    expect(text).not.toContain(P_PRICE);
    expect(text).not.toContain(P_OWNER);
    expect(text).not.toContain(P_FILES);
  });

  it('limits rows by row_limit and by explicit row_ids', () => {
    const byLimit = applyTemplateDemoFilter(snapshot(), config());
    expect(byLimit.preview.databases[0].rows.map((r) => r.id)).toEqual(
      ROWS.slice(0, 2),
    );
    expect(byLimit.hidden.rows).toBe(2);

    const byIds = applyTemplateDemoFilter(
      snapshot(),
      config({
        databases: { [DB]: { view_ids: [VIEW], row_ids: [ROWS[3]] } },
      }),
    );
    expect(byIds.preview.databases[0].rows.map((r) => r.id)).toEqual([ROWS[3]]);
    expect(allText(byIds.preview)).not.toContain(`of ${ROWS[0]}`);
  });

  it('omits databases that no visible block references', () => {
    const { preview } = applyTemplateDemoFilter(snapshot(), config());
    expect(preview.databases.map((d) => d.id)).toEqual([DB]);
  });

  it('removes private media references and signed URLs', () => {
    const { preview } = applyTemplateDemoFilter(snapshot(), config());
    const image = preview.blocks.find((b) => b.id === B_IMAGE)!;

    expect(image.content).toEqual({ caption: 'cover' });
    expect(preview.blocks.some((b) => b.type === PageBlockType.FILE)).toBe(
      false,
    );
    expect(allText(preview)).not.toContain('att-');
  });

  it('keeps plain public URLs', () => {
    const source = snapshot();
    source.blocks.find((b) => b.id === B_IMAGE)!.content = {
      url: 'https://images.example.com/cover.png',
    };
    const { preview } = applyTemplateDemoFilter(source, config());
    expect(preview.blocks.find((b) => b.id === B_IMAGE)!.content).toEqual({
      url: 'https://images.example.com/cover.png',
    });
  });

  it('does not mutate the source snapshot', () => {
    const source = snapshot();
    const before = allText(source);
    applyTemplateDemoFilter(source, config());
    expect(allText(source)).toBe(before);
  });

  it('refuses FULL_VERSION configs', () => {
    const full = TemplateDemoConfig.parse({
      schema: 1,
      scope: 'FULL_VERSION',
    })!;
    expect(() => applyTemplateDemoFilter(snapshot(), full)).toThrow();
  });
});

describe('assertDemoConfigMatchesSnapshot', () => {
  it('accepts ids from the snapshot', () => {
    expect(() =>
      assertDemoConfigMatchesSnapshot(
        config({
          databases: { [DB]: { view_ids: [VIEW], row_ids: [ROWS[0]] } },
        }),
        snapshot(),
      ),
    ).not.toThrow();
  });

  it.each([
    ['block', { block_ids: [id(900)] }],
    [
      'database',
      { databases: { [id(901)]: { view_ids: [VIEW], row_limit: 1 } } },
    ],
    ['view', { databases: { [DB]: { view_ids: [id(902)], row_limit: 1 } } }],
    [
      'property',
      {
        databases: {
          [DB]: { view_ids: [VIEW], property_ids: [id(903)], row_limit: 1 },
        },
      },
    ],
    ['row', { databases: { [DB]: { view_ids: [VIEW], row_ids: [id(904)] } } }],
  ])('rejects an unknown %s id', (_, overrides) => {
    expect(() =>
      assertDemoConfigMatchesSnapshot(config(overrides), snapshot()),
    ).toThrow();
  });
});
