import type {
  AiModificationContextRequest,
  AiModificationOperation,
  AiModificationPlan,
  AiModificationPlanStatus,
} from '../../types/ai-modification-plan';

export class AiModificationPlanPreviewCountsResponseDto {
  operations: number;
  blocks: number;
  databaseRows: number;
  /** SET_TODO_CHECKED operations (kế hoạch tích to-do). */
  todoUpdates: number;

  /** SET_BLOCK_TEXT operations. */
  blockEdits: number;

  /** DELETE_BLOCK operations (their nested blocks are not counted). */
  blockDeletes: number;
}

export class AiModificationPlanPreviewResponseDto {
  type: 'AI_MODIFICATION_PLAN';
  pageId: string;
  status: AiModificationPlanStatus;
  summary: string;
  counts: AiModificationPlanPreviewCountsResponseDto;
  operations: AiModificationOperation[];
  contextRequests?: AiModificationContextRequest[];

  static fromPlan(
    plan: AiModificationPlan,
  ): AiModificationPlanPreviewResponseDto {
    if (plan.status === 'NEED_MORE_CONTEXT') {
      return {
        type: plan.type,
        pageId: plan.pageId,
        status: plan.status,
        summary: plan.summary,
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
      };
    }

    const blocks = plan.operations.reduce<number>((total, operation) => {
      if (operation.type !== 'INSERT_BLOCKS') {
        return total;
      }

      return total + operation.blocks.length;
    }, 0);

    const databaseRows = plan.operations.reduce<number>((total, operation) => {
      if (operation.type !== 'CREATE_DATABASE_ROWS') {
        return total;
      }

      return total + operation.rows.length;
    }, 0);

    return {
      type: plan.type,
      pageId: plan.pageId,
      status: plan.status,
      summary: plan.summary,
      counts: {
        operations: plan.operations.length,
        blocks,
        databaseRows,
        todoUpdates: plan.operations.filter(
          (operation) => operation.type === 'SET_TODO_CHECKED',
        ).length,
        blockEdits: plan.operations.filter(
          (operation) => operation.type === 'SET_BLOCK_TEXT',
        ).length,
        blockDeletes: plan.operations.filter(
          (operation) => operation.type === 'DELETE_BLOCK',
        ).length,
      },
      operations: plan.operations,
    };
  }
}
