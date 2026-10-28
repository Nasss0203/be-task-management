import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { CreatePageBlockCommand } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.command';
import { CreatePageBlockHandler } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.handler';
import { DeletePageBlockCommand } from 'src/modules/content/application/commands/page-block/delete-page-block/delete-page-block.command';

import { DeletePageBlockHandler } from 'src/modules/content/application/commands/page-block/delete-page-block/delete-page-block.handler';

import { UpdatePageBlockCommand } from 'src/modules/content/application/commands/page-block/update-page-block/update-page-block.command';

import { UpdatePageBlockHandler } from 'src/modules/content/application/commands/page-block/update-page-block/update-page-block.handler';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

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
  AiDeleteBlockOperation,
  AiModificationPlanReady,
  AiSetBlockTextOperation,
  AiSetTodoCheckedOperation,
} from '../types/ai-modification-plan';
import { AI_MODIFICATION_SUPPORTED_BLOCK_TYPES } from '../constants/ai-modification-plan.constant';

export interface ExecuteAiModificationPlanParams {
  userId: string;
  plan: AiModificationPlanReady;
}

export interface AiModificationPlanExecutionResult {
  createdBlockIds: string[];
  createdRowIds: string[];
  updatedBlockIds: string[];

  /** DELETE_BLOCK roots; their nested blocks were deleted with them. */
  deletedBlockIds: string[];
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
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,
    @Inject(CONTENT_TYPES.applications.UpdatePageBlockHandler)
    private readonly updatePageBlockHandler: UpdatePageBlockHandler,
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepository: PageBlockRepository,
    @Inject(CONTENT_TYPES.applications.DeletePageBlockHandler)
    private readonly deletePageBlockHandler: DeletePageBlockHandler,
  ) {}

  async execute(
    params: ExecuteAiModificationPlanParams,
  ): Promise<AiModificationPlanExecutionResult> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const createdBlockIds: string[] = [];
      const createdRowIds: string[] = [];
      const updatedBlockIds: string[] = [];
      const deletedBlockIds: string[] = [];
      /*
       * Each insert lands right after its anchor block, so a later operation
       * naming the same anchor would end up above an earlier one. Continue
       * after the blocks already inserted there to keep the plan order.
       */
      const lastInsertedAfter = new Map<string, string>();

      for (const operation of params.plan.operations) {
        switch (operation.type) {
          case 'INSERT_BLOCKS': {
            const anchor = operation.afterBlockId
              ? `${operation.parentBlockId ?? ''}:${operation.afterBlockId}`
              : null;
            const blockIds = await this.executeInsertBlocks(
              params.userId,
              params.plan.pageId,
              anchor && lastInsertedAfter.has(anchor)
                ? { ...operation, afterBlockId: lastInsertedAfter.get(anchor)! }
                : operation,
            );
            if (anchor && blockIds.length > 0) {
              lastInsertedAfter.set(anchor, blockIds[blockIds.length - 1]);
            }

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

          case 'DELETE_BLOCK': {
            await this.executeDeleteBlock(
              params.userId,
              params.plan.pageId,
              operation,
              context,
            );
            deletedBlockIds.push(operation.blockId);
            break;
          }

          case 'SET_BLOCK_TEXT': {
            await this.executeSetBlockText(
              params.userId,
              params.plan.pageId,
              operation,
              context,
            );
            updatedBlockIds.push(operation.blockId);
            break;
          }

          case 'SET_TODO_CHECKED': {
            await this.executeSetTodoChecked(
              params.userId,
              params.plan.pageId,
              operation,
              context,
            );
            updatedBlockIds.push(operation.blockId);
            break;
          }
        }
      }

      // Row writes do not touch the Page, so a rows-only plan kept "Edited …" old.
      await this.pageRepository.touch(params.plan.pageId, context);
      return {
        createdBlockIds,
        createdRowIds,
        updatedBlockIds,
        deletedBlockIds,
      };
    });
  }

  /** Soft-deletes the block and everything nested in it, like the editor. */
  private async executeDeleteBlock(
    userId: string,
    pageId: string,
    operation: AiDeleteBlockOperation,
    context: PersistenceContext,
  ): Promise<void> {
    const block = await this.pageBlockRepository.findById(
      operation.blockId,
      context,
    );
    const content = block?.getContent() as Record<string, unknown> | undefined;

    // The validator checked a fresh context under lock; never delete elsewhere.
    if (
      !block ||
      block.getPageId() !== pageId ||
      content?.text !== operation.text
    ) {
      throw new ConflictException('The block changed before it was applied');
    }
    await this.deletePageBlockHandler.execute(
      new DeletePageBlockCommand(operation.blockId, userId),
    );
  }

  /** Only the text changes; any other content (checkbox…) stays as it is. */
  private async executeSetBlockText(
    userId: string,
    pageId: string,
    operation: AiSetBlockTextOperation,
    context: PersistenceContext,
  ): Promise<void> {
    const block = await this.pageBlockRepository.findById(
      operation.blockId,
      context,
    );
    const content = block?.getContent() as Record<string, unknown> | undefined;

    // The validator checked a fresh context under lock; never write elsewhere.
    if (
      !block ||
      block.getPageId() !== pageId ||
      !(
        AI_MODIFICATION_SUPPORTED_BLOCK_TYPES as readonly PageBlockType[]
      ).includes(block.getType()) ||
      content?.text !== operation.oldText
    ) {
      throw new ConflictException('The block changed before it was applied');
    }
    await this.updatePageBlockHandler.execute(
      new UpdatePageBlockCommand(
        operation.blockId,
        { content: { ...content, text: operation.newText } },
        userId,
      ),
    );
  }

  /** Only the checkbox changes; the text and any other content stay as they are. */
  private async executeSetTodoChecked(
    userId: string,
    pageId: string,
    operation: AiSetTodoCheckedOperation,
    context: PersistenceContext,
  ): Promise<void> {
    const block = await this.pageBlockRepository.findById(
      operation.blockId,
      context,
    );

    // The validator checked a fresh context under lock; never write elsewhere.
    if (
      !block ||
      block.getPageId() !== pageId ||
      block.getType() !== PageBlockType.TODO
    ) {
      throw new ConflictException('The to-do changed before it was applied');
    }
    await this.updatePageBlockHandler.execute(
      new UpdatePageBlockCommand(
        operation.blockId,
        { content: { ...block.getContent(), checked: operation.checked } },
        userId,
      ),
    );
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
