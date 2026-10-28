import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import type { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';

import {
  AiModificationPlanExecutor,
  type AiModificationPlanExecutionResult,
} from '../../services/ai-modification-plan-executor.service';
import { AiModificationPlanValidatorService } from '../../services/ai-modification-plan-validator.service';
import { assertAiPageContextFresh } from '../../services/ai-page-context-fingerprint';

import { GetAiPageContextHandler } from '../../queries/get-ai-page-context/get-ai-page-context.handler';
import { GetAiPageContextQuery } from '../../queries/get-ai-page-context/get-ai-page-context.query';
import type { AiPageContextTransactionLocker } from '../../services/ai-page-context-transaction-lock.port';

import { ApplyGenerationCommand } from '../apply-generation/apply-generation.command';
import { ApplyGenerationHandler } from '../apply-generation/apply-generation.handler';

import { ConfirmAiModificationPlanCommand } from './confirm-ai-modification-plan.command';

export interface ConfirmAiModificationPlanResult {
  generation: AiGenerationResponseDto;
  execution: AiModificationPlanExecutionResult;
}

@Injectable()
export class ConfirmAiModificationPlanHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,

    private readonly authorizationService: AuthorizationService,

    private readonly getAiPageContextHandler: GetAiPageContextHandler,

    private readonly planValidator: AiModificationPlanValidatorService,

    private readonly planExecutor: AiModificationPlanExecutor,

    private readonly applyGenerationHandler: ApplyGenerationHandler,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(AI_ASSISTANT_TYPES.ports.PageContextTransactionLocker)
    private readonly pageContextLock: AiPageContextTransactionLocker,
  ) {}

  async execute(
    command: ConfirmAiModificationPlanCommand,
  ): Promise<ConfirmAiModificationPlanResult> {
    return this.unitOfWork.runInTransaction(async (context) => {
      // Lock before checking status. This serializes Confirm/Confirm and
      // Confirm/Discard for this generation across server instances.
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

      if (generation.getStatus() !== AiGenerationStatus.COMPLETED) {
        throw new BadRequestException(
          'AI generation must be completed before confirmation',
        );
      }

      const inputData = generation.getInputData();

      if (
        inputData === null ||
        typeof inputData !== 'object' ||
        Array.isArray(inputData)
      ) {
        throw new InternalServerErrorException(
          'AI modification plan generation has invalid input data',
        );
      }

      const pageId = inputData.pageId;

      if (typeof pageId !== 'string' || pageId.trim().length === 0) {
        throw new InternalServerErrorException(
          'AI modification plan generation is missing pageId',
        );
      }

      // Generation lock alone cannot serialize concurrent normal Page edits.
      // Lock the entire FK-backed context before rebuilding and hashing it.
      // Keep these locks through validation, execution and Generation APPLIED.
      await this.pageContextLock.lock(pageId, context, command.userId);

      /*
       * Rebuild fresh authorized page context.
       *
       * pageId luôn lấy từ persisted generation inputData.
       * Client chỉ được cung cấp shareToken hiện tại.
       */
      const pageContext = await this.getAiPageContextHandler.execute(
        new GetAiPageContextQuery(command.userId, pageId, command.shareToken),
      );

      /*
       * Generation không được phép chuyển scope sang một Workspace khác.
       */
      if (generation.getWorkspaceId() !== pageContext.page.workspaceId) {
        throw new ForbiddenException(
          'AI generation workspace scope does not match target page',
        );
      }

      // Check staleness before revalidating operation references: a removed
      // anchor/database should return 409 STALE, not a plan-validator error.
      // Neither this step nor validation executes any Page mutation.
      assertAiPageContextFresh(inputData.pageContextFingerprint, pageContext);

      /*
       * Stored output đã validate lúc generation hoàn thành,
       * nhưng Confirm phải validate lại với fresh Page Context.
       */
      const plan = this.planValidator.validate(
        generation.getOutputData(),
        pageContext,
      );

      if (plan.status !== 'PLAN_READY') {
        throw new BadRequestException(
          'AI modification plan is not ready for confirmation',
        );
      }

      /*
       * Authorization được xác định theo operation thực tế.
       *
       * INSERT_BLOCKS:
       * - cần PAGE_BLOCK_CREATE
       * - Share Link EDITOR có thể cấp quyền này.
       *
       * CREATE_DATABASE_ROWS:
       * - cần DATABASE_UPDATE
       * - Page Share / Share Link không tự cấp quyền database.
       */
      const requiresBlockCreate = plan.operations.some(
        (operation) => operation.type === 'INSERT_BLOCKS',
      );

      if (requiresBlockCreate) {
        const allowed = await this.authorizationService.authorize({
          userId: command.userId,
          permissions: [PERMISSIONS.PAGE_BLOCK_CREATE],
          target: {
            type: 'page',
            id: pageContext.page.id,
          },
          shareToken: command.shareToken,
        });

        if (!allowed) {
          throw new ForbiddenException(
            'You do not have permission to create blocks on this page',
          );
        }
      }

      // SET_TODO_CHECKED / SET_BLOCK_TEXT edit an existing block:
      // PAGE_BLOCK_UPDATE, as in the editor.
      const requiresBlockUpdate = plan.operations.some(
        (operation) =>
          operation.type === 'SET_TODO_CHECKED' ||
          operation.type === 'SET_BLOCK_TEXT',
      );
      if (requiresBlockUpdate) {
        const allowed = await this.authorizationService.authorize({
          userId: command.userId,
          permissions: [PERMISSIONS.PAGE_BLOCK_UPDATE],
          target: {
            type: 'page',
            id: pageContext.page.id,
          },
          shareToken: command.shareToken,
        });
        if (!allowed) {
          throw new ForbiddenException(
            'You do not have permission to update blocks on this page',
          );
        }
      }

      // DELETE_BLOCK removes existing blocks: PAGE_BLOCK_DELETE, as in the editor.
      const requiresBlockDelete = plan.operations.some(
        (operation) => operation.type === 'DELETE_BLOCK',
      );
      if (requiresBlockDelete) {
        const allowed = await this.authorizationService.authorize({
          userId: command.userId,
          permissions: [PERMISSIONS.PAGE_BLOCK_DELETE],
          target: {
            type: 'page',
            id: pageContext.page.id,
          },
          shareToken: command.shareToken,
        });
        if (!allowed) {
          throw new ForbiddenException(
            'You do not have permission to delete blocks on this page',
          );
        }
      }
      const requiresDatabaseUpdate = plan.operations.some(
        (operation) => operation.type === 'CREATE_DATABASE_ROWS',
      );

      if (requiresDatabaseUpdate) {
        const allowed = await this.authorizationService.authorize({
          userId: command.userId,
          permissions: [PERMISSIONS.DATABASE_UPDATE],
          target: {
            type: 'page',
            id: pageContext.page.id,
          },
          shareToken: command.shareToken,
        });

        if (!allowed) {
          throw new ForbiddenException(
            'You do not have permission to update databases on this page',
          );
        }
      }

      /*
       * Executor tự mở UnitOfWork, nhưng TypeOrmUnitOfWork reuse
       * transaction đang active thông qua AsyncLocalStorage.
       */
      const execution = await this.planExecutor.execute({
        userId: command.userId,
        plan,
      });

      /*
       * Chỉ mark APPLIED sau khi toàn bộ operations thành công.
       *
       * Nếu executor throw:
       * - transaction rollback
       * - generation vẫn COMPLETED
       */
      const appliedGeneration = await this.applyGenerationHandler.execute(
        new ApplyGenerationCommand(command.userId, command.generationId),
        context,
      );

      return {
        generation: appliedGeneration,
        execution,
      };
    });
  }
}
