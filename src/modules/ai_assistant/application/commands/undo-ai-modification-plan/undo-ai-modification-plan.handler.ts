import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { PageActivityRecorder } from 'src/modules/content/application/ports/page-activity-recorder.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import type { AiPageContextTransactionLocker } from '../../services/ai-page-context-transaction-lock.port';
import type {
  AiDeleteBlockOperation,
  AiModificationOperation,
  AiModificationPlan,
} from '../../types/ai-modification-plan';

import { UndoAiModificationPlanCommand } from './undo-ai-modification-plan.command';

/** How long after Apply a delete can be undone (kế hoạch xoá block, D5). */
export const AI_DELETE_UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;
// Blocks deleted by one Apply share its moment; allow for the time Apply took.
const APPLY_TOLERANCE_MS = 60 * 1000;

export interface UndoAiModificationPlanResult {
  restoredBlockIds: string[];
}

/**
 * Restores exactly the blocks one applied AI draft deleted: each deleted root
 * and the blocks nested in it that went with it. Blocks deleted at another
 * time, or already restored, are left alone, so undoing twice is harmless.
 */
@Injectable()
export class UndoAiModificationPlanHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,

    private readonly authorizationService: AuthorizationService,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepository: PageBlockRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(AI_ASSISTANT_TYPES.ports.PageContextTransactionLocker)
    private readonly pageContextLock: AiPageContextTransactionLocker,

    @Inject(CONTENT_TYPES.ports.PageActivityRecorder)
    private readonly activity: PageActivityRecorder,
  ) {}

  async execute(
    command: UndoAiModificationPlanCommand,
    now: Date = new Date(),
  ): Promise<UndoAiModificationPlanResult> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const generation =
        await this.generationRepository.findByIdAndUserIdForUpdate(
          command.generationId,
          command.userId,
          context,
        );
      if (!generation) {
        throw new NotFoundException('AI generation not found');
      }
      if (generation.getCapability() !== AI_MODIFICATION_PLAN_CAPABILITY) {
        throw new BadRequestException(
          'AI generation is not a page modification plan generation',
        );
      }
      if (generation.getStatus() !== AiGenerationStatus.APPLIED) {
        throw new BadRequestException('Only an applied draft can be undone');
      }
      const appliedAt = generation.getAppliedAt();
      if (
        !appliedAt ||
        now.getTime() - appliedAt.getTime() > AI_DELETE_UNDO_WINDOW_MS
      ) {
        throw new BadRequestException(
          'The undo period for this draft has ended',
        );
      }

      const plan = generation.getOutputData() as unknown as AiModificationPlan;
      const operations: AiModificationOperation[] = plan.operations;
      const deletes = operations.filter(
        (operation): operation is AiDeleteBlockOperation =>
          operation.type === 'DELETE_BLOCK',
      );
      if (deletes.length === 0) {
        throw new BadRequestException('This draft did not delete any block');
      }

      await this.pageContextLock.lock(plan.pageId, context, command.userId);
      const allowed = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_BLOCK_DELETE],
        target: { type: 'page', id: plan.pageId },
        shareToken: command.shareToken,
      });
      if (!allowed) {
        throw new ForbiddenException(
          'You do not have permission to restore blocks on this page',
        );
      }

      const workspaceId = generation.getWorkspaceId();
      if (!workspaceId) {
        throw new NotFoundException('AI generation workspace not found');
      }
      const deleted = await this.pageBlockRepository.findDeletedByWorkspace(
        workspaceId,
        plan.pageId,
        context,
      );
      // Only what this Apply deleted, by this user, at this moment.
      const fromApply = (block: PageBlock) => {
        const deletedAt = block.getDeletedAt()?.getTime();
        return (
          block.getDeletedBy() === command.userId &&
          deletedAt !== undefined &&
          deletedAt >= appliedAt.getTime() - APPLY_TOLERANCE_MS &&
          deletedAt <= appliedAt.getTime() + 1000
        );
      };

      const restoredBlockIds: string[] = [];
      for (const operation of deletes) {
        const root = deleted.find(
          (block) => block.getId() === operation.blockId,
        );
        if (!root || root.getPageId() !== plan.pageId || !fromApply(root)) {
          continue;
        }
        await this.restoreRoot(root, context);
        restoredBlockIds.push(root.getId());

        const nested: PageBlock[] = [];
        const pending = [root.getId()];
        while (pending.length > 0) {
          const parentId = pending.shift();
          for (const block of deleted) {
            if (block.getParentBlockId() === parentId && fromApply(block)) {
              block.restoreDeleted();
              nested.push(block);
              pending.push(block.getId());
            }
          }
        }
        if (nested.length > 0) {
          await this.pageBlockRepository.saveMany(nested, context);
          restoredBlockIds.push(...nested.map((block) => block.getId()));
        }
      }

      if (restoredBlockIds.length > 0) {
        await this.pageRepository.touch(plan.pageId, context);
        // Restored blocks count as created (no PAGE_BLOCK_RESTORED action).
        await this.activity.record(
          {
            actorId: command.userId,
            pageId: plan.pageId,
            blockId: restoredBlockIds[0],
            action: 'PAGE_BLOCK_CREATED',
            kind: 'RESTORED',
          },
          context,
        );
      }
      return { restoredBlockIds };
    });
  }

  /** Back to its old place; later blocks move down if one took that place. */
  private async restoreRoot(
    root: PageBlock,
    context: PersistenceContext,
  ): Promise<void> {
    const parentBlockId = root.getParentBlockId();
    if (
      parentBlockId &&
      !(await this.pageBlockRepository.findById(parentBlockId, context))
    ) {
      throw new ConflictException(
        'The block it was inside was deleted; restore that block first',
      );
    }
    const siblings = await this.pageBlockRepository.findActiveSiblings(
      root.getPageId(),
      parentBlockId,
      context,
    );
    // Active order indexes are unique; a block inserted since took this place.
    if (
      siblings.some((block) => block.getOrderIndex() === root.getOrderIndex())
    ) {
      await this.pageBlockRepository.shiftSiblingOrderIndexes(
        root.getPageId(),
        parentBlockId,
        root.getOrderIndex(),
        context,
      );
    }
    root.restoreDeleted();
    await this.pageBlockRepository.save(root, context);
  }
}
