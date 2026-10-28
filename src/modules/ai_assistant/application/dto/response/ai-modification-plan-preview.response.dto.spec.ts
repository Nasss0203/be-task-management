import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import type { AiModificationPlan } from '../../types/ai-modification-plan';
import { AiModificationPlanPreviewResponseDto } from './ai-modification-plan-preview.response.dto';

describe('AiModificationPlanPreviewResponseDto', () => {
  it('builds PLAN_READY preview with actual operations and counts', () => {
    const plan: AiModificationPlan = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add content and tasks',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'First block',
              },
            },
            {
              type: PageBlockType.TODO,
              content: {
                text: 'Complete task',
                checked: false,
              },
            },
          ],
        },
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task 1',
              },
            },
            {
              values: {
                'property-title': 'Task 2',
              },
            },
          ],
        },
      ],
    };

    const result = AiModificationPlanPreviewResponseDto.fromPlan(plan);

    expect(result).toEqual({
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add content and tasks',
      counts: {
        operations: 2,
        blocks: 2,
        databaseRows: 2,
        todoUpdates: 0,
        blockEdits: 0,
        blockDeletes: 0,
      },
      operations: plan.operations,
    });

    expect(result.contextRequests).toBeUndefined();
  });

  it('counts to-do ticks apart from inserted blocks', () => {
    const plan: AiModificationPlan = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Tích 2 to-do',
      operations: [
        { type: 'SET_TODO_CHECKED', blockId: 'a', text: 'A', checked: true },
        { type: 'SET_TODO_CHECKED', blockId: 'b', text: 'B', checked: false },
      ],
    };
    expect(AiModificationPlanPreviewResponseDto.fromPlan(plan).counts).toEqual({
      operations: 2,
      blocks: 0,
      databaseRows: 0,
      todoUpdates: 2,
      blockEdits: 0,
      blockDeletes: 0,
    });
  });

  it('counts block text edits apart from ticks (kế hoạch sửa chữ block)', () => {
    const plan: AiModificationPlan = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Sửa 1 block',
      operations: [
        { type: 'SET_BLOCK_TEXT', blockId: 'a', oldText: 'A', newText: 'B' },
      ],
    };
    expect(AiModificationPlanPreviewResponseDto.fromPlan(plan).counts).toEqual({
      operations: 1,
      blocks: 0,
      databaseRows: 0,
      todoUpdates: 0,
      blockEdits: 1,
      blockDeletes: 0,
    });
  });

  it('counts deleted blocks (kế hoạch xoá block)', () => {
    const plan: AiModificationPlan = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Xoá 2 block',
      operations: [
        { type: 'DELETE_BLOCK', blockId: 'a', text: 'A', childCount: 2 },
        { type: 'DELETE_BLOCK', blockId: 'b', text: 'B', childCount: 0 },
      ],
    };
    expect(
      AiModificationPlanPreviewResponseDto.fromPlan(plan).counts,
    ).toMatchObject({
      operations: 2,
      blockDeletes: 2,
    });
  });

  it('builds NEED_MORE_CONTEXT preview with context requests', () => {
    const plan: AiModificationPlan = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More information is required',
      operations: [],
      contextRequests: [
        {
          reason: 'MISSING_RESOURCE_CONTEXT',
          description: 'More context is required.',
          question: 'Which database should be updated?',
        },
      ],
    };

    const result = AiModificationPlanPreviewResponseDto.fromPlan(plan);

    expect(result).toEqual({
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More information is required',
      counts: {
        operations: 0,
        blocks: 0,
        databaseRows: 0,
        todoUpdates: 0,
        blockEdits: 0,
        blockDeletes: 0,
      },
      operations: [],
      contextRequests: plan.contextRequests,
    });
  });
});
