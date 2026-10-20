import { ConflictException } from '@nestjs/common';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { AiPageContextResponseDto } from '../dto/response/ai-page-context.response.dto';
import {
  assertAiPageContextFresh,
  fingerprintAiPageContext,
} from './ai-page-context-fingerprint';

describe('AI Page Context fingerprint', () => {
  function context(): AiPageContextResponseDto {
    return {
      schemaVersion: 1,
      builtAt: '2026-10-19T08:00:00Z',
      page: {
        id: 'page-1',
        workspaceId: 'workspace-1',
        teamspaceId: null,
        parentPageId: null,
        title: 'Release Plan',
        icon: null,
        coverUrl: null,
        updatedAt: '2026-10-19T07:00:00Z',
      },
      blocks: [
        {
          id: 'block-1',
          parentBlockId: null,
          type: PageBlockType.TEXT,
          orderIndex: 0,
          title: null,
          content: { text: 'Release notes' },
          styleConfig: null,
          dataConfig: null,
        },
        {
          id: 'block-2',
          parentBlockId: null,
          type: PageBlockType.DATABASE_VIEW,
          orderIndex: 1,
          title: null,
          content: null,
          styleConfig: null,
          dataConfig: { database_id: 'database-1', view_id: 'view-1' },
        },
      ],
      databaseReferences: [
        { blockId: 'block-2', databaseId: 'database-1', viewId: 'view-1' },
      ],
      databases: [
        {
          id: 'database-1',
          pageId: 'page-1',
          name: 'QA Tasks',
          properties: [
            {
              id: 'property-title',
              name: 'Task',
              type: PropertyType.TITLE,
              position: '0',
              isDefault: true,
              isHideable: false,
              options: [],
            },
            {
              id: 'property-status',
              name: 'Status',
              type: PropertyType.STATUS,
              position: '1',
              isDefault: false,
              isHideable: true,
              options: [
                {
                  id: 'option-todo',
                  name: 'Todo',
                  color: 'gray',
                  position: '0',
                },
              ],
            },
          ],
          views: [
            {
              id: 'view-1',
              databaseId: 'database-1',
              name: 'Table',
              type: DatabaseViewType.TABLE,
              position: '0',
              properties: [
                {
                  propertyId: 'property-title',
                  position: '0',
                  visible: true,
                  width: 240,
                },
              ],
            },
          ],
          rows: [
            {
              id: 'row-1',
              databaseId: 'database-1',
              values: {
                'property-title': 'Ship release',
                'property-status': 'option-todo',
              },
            },
          ],
        },
      ],
      completeness: {
        blocks: { total: 2, included: 2, truncated: false },
        databases: { total: 1, included: 1, truncated: false },
        rows: [
          {
            databaseId: 'database-1',
            total: 1,
            included: 1,
            truncated: false,
            selection: 'BOUNDED',
          },
        ],
        textTruncated: false,
      },
    };
  }

  it('returns a versioned sha256 and accepts an unchanged rebuilt context', () => {
    const first = context();
    const fingerprint = fingerprintAiPageContext(first);
    expect(fingerprint.version).toBe(1);
    expect(fingerprint.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(() =>
      assertAiPageContextFresh(fingerprint, {
        ...first,
        builtAt: '2026-10-20T08:00:00Z',
      }),
    ).not.toThrow();
  });

  it('does not change for JSON key ordering or unordered collection retrieval', () => {
    const original = context();
    const copy = context();
    copy.blocks.reverse();
    copy.databases[0].properties.reverse();
    copy.databases[0].rows[0].values = {
      'property-status': 'option-todo',
      'property-title': 'Ship release',
    };
    copy.blocks.find((block) => block.id === 'block-2')!.dataConfig = {
      view_id: 'view-1',
      database_id: 'database-1',
    };
    expect(fingerprintAiPageContext(copy)).toEqual(
      fingerprintAiPageContext(original),
    );
  });

  it.each([
    [
      'page title',
      (ctx: AiPageContextResponseDto) => {
        ctx.page.title = 'New title';
      },
    ],
    [
      'Page updatedAt',
      (ctx: AiPageContextResponseDto) => {
        ctx.page.updatedAt = '2026-10-20T09:00:00Z';
      },
    ],
    [
      'block text',
      (ctx: AiPageContextResponseDto) => {
        ctx.blocks[0].content = { text: 'Changed' };
      },
    ],
    [
      'block insertion',
      (ctx: AiPageContextResponseDto) => {
        ctx.blocks.push({ ...ctx.blocks[0], id: 'block-3', orderIndex: 2 });
        ctx.completeness.blocks.total += 1;
        ctx.completeness.blocks.included += 1;
      },
    ],
    [
      'block reorder',
      (ctx: AiPageContextResponseDto) => {
        ctx.blocks[0].orderIndex = 2;
      },
    ],
    [
      'database property',
      (ctx: AiPageContextResponseDto) => {
        ctx.databases[0].properties[0].name = 'Updated';
      },
    ],
    [
      'database view',
      (ctx: AiPageContextResponseDto) => {
        ctx.databases[0].views[0].name = 'Kanban';
      },
    ],
    [
      'database row values',
      (ctx: AiPageContextResponseDto) => {
        ctx.databases[0].rows[0].values['property-title'] = 'Changed task';
      },
    ],
    [
      'database row count',
      (ctx: AiPageContextResponseDto) => {
        ctx.completeness.rows[0].total += 1;
        ctx.completeness.rows[0].included += 1;
      },
    ],
  ])('rejects stale context after %s changes', (_label, change) => {
    const baseline = context();
    const fingerprint = fingerprintAiPageContext(baseline);
    const changed = context();
    change(changed);
    expect(() => assertAiPageContextFresh(fingerprint, changed)).toThrow(
      ConflictException,
    );
  });

  it.each([
    undefined,
    null,
    {},
    { version: 2, sha256: 'a'.repeat(64) },
    { version: 1, sha256: 'broken' },
  ])('rejects missing or unsupported persisted snapshot %p', (snapshot) => {
    expect(() => assertAiPageContextFresh(snapshot, context())).toThrow(
      ConflictException,
    );
  });

  it.each([
    [
      'text truncated',
      (ctx: AiPageContextResponseDto) => {
        ctx.completeness.textTruncated = true;
      },
    ],
    [
      'rows truncated',
      (ctx: AiPageContextResponseDto) => {
        ctx.completeness.rows[0].truncated = true;
      },
    ],
    [
      'rows omitted',
      (ctx: AiPageContextResponseDto) => {
        ctx.completeness.rows[0].included = 0;
      },
    ],
    [
      'blocks truncated',
      (ctx: AiPageContextResponseDto) => {
        ctx.completeness.blocks.truncated = true;
      },
    ],
  ])('fails closed when %s', (_label, change) => {
    const current = context();
    change(current);
    const fingerprint = fingerprintAiPageContext(current);
    expect(() => assertAiPageContextFresh(fingerprint, current)).toThrow(
      ConflictException,
    );
  });
});
