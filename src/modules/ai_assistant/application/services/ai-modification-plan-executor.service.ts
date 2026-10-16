import { Inject, Injectable } from '@nestjs/common';

import { CreatePageBlockCommand } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.command';
import { CreatePageBlockHandler } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.handler';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { CreateDatabaseRowCommand } from 'src/modules/database/application/commands/create-database-row/create-database-row.command';
import { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import { SetRowValueCommand } from 'src/modules/database/application/commands/set-row-value/set-row-value.command';
import { SetRowValueHandler } from 'src/modules/database/application/commands/set-row-value/set-row-value.handler';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type {
  AiCreateDatabaseRowsOperation,
  AiInsertBlocksOperation,
  AiModificationPlanReady,
} from '../types/ai-modification-plan';

export interface ExecuteAiModificationPlanParams {
  userId: string;
  plan: AiModificationPlanReady;
}

export interface AiModificationPlanExecutionResult {
  createdBlockIds: string[];
  createdRowIds: string[];
}

@Injectable()
export class AiModificationPlanExecutor {
  constructor(
    @Inject(CONTENT_TYPES.applications.CreatePageBlockHandler)
    private readonly createPageBlockHandler: CreatePageBlockHandler,

    private readonly createDatabaseRowHandler: CreateDatabaseRowHandler,

    private readonly setRowValueHandler: SetRowValueHandler,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    params: ExecuteAiModificationPlanParams,
  ): Promise<AiModificationPlanExecutionResult> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const createdBlockIds: string[] = [];
      const createdRowIds: string[] = [];

      for (const operation of params.plan.operations) {
        switch (operation.type) {
          case 'INSERT_BLOCKS': {
            const blockIds = await this.executeInsertBlocks(
              params.userId,
              params.plan.pageId,
              operation,
            );

            createdBlockIds.push(...blockIds);
            break;
          }

          case 'CREATE_DATABASE_ROWS': {
            const rowIds = await this.executeCreateDatabaseRows(
              operation,
              context,
            );

            createdRowIds.push(...rowIds);
            break;
          }
        }
      }

      return {
        createdBlockIds,
        createdRowIds,
      };
    });
  }

  private async executeInsertBlocks(
    userId: string,
    pageId: string,
    operation: AiInsertBlocksOperation,
  ): Promise<string[]> {
    const createdBlockIds: string[] = [];

    let afterBlockId = operation.afterBlockId;

    for (const block of operation.blocks) {
      const input: ConstructorParameters<typeof CreatePageBlockCommand>[0] = {
        pageId,
        parentBlockId: operation.parentBlockId,
        afterBlockId,
        type: block.type,
        createdBy: userId,
        content: block.content,
      };

      if ('styleConfig' in block && block.styleConfig !== undefined) {
        input.styleConfig = block.styleConfig;
      }

      const createdBlock = await this.createPageBlockHandler.execute(
        new CreatePageBlockCommand(input),
      );

      createdBlockIds.push(createdBlock.id);

      /*
       * Block kế tiếp phải được insert sau block vừa tạo,
       * không tiếp tục dùng afterBlockId ban đầu.
       */
      afterBlockId = createdBlock.id;
    }

    return createdBlockIds;
  }

  private async executeCreateDatabaseRows(
    operation: AiCreateDatabaseRowsOperation,
    context: PersistenceContext,
  ): Promise<string[]> {
    const createdRowIds: string[] = [];

    for (const rowInput of operation.rows) {
      const row = await this.createDatabaseRowHandler.execute(
        new CreateDatabaseRowCommand(operation.databaseId),
        context,
      );

      for (const [propertyId, value] of Object.entries(rowInput.values)) {
        await this.setRowValueHandler.execute(
          new SetRowValueCommand(row.getId(), propertyId, value),
          context,
        );
      }

      createdRowIds.push(row.getId());
    }

    return createdRowIds;
  }
}
