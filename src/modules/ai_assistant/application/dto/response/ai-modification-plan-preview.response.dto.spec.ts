import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';

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
      },
      operations: plan.operations,
    });

    expect(result.contextRequests).toBeUndefined();
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
      },
      operations: [],
      contextRequests: plan.contextRequests,
    });
  });
});