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
      },
      operations: plan.operations,
    };
  }
}
