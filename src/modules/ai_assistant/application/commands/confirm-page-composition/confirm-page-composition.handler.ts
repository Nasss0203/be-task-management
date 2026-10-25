import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { AuthorizationTarget } from 'src/modules/permission/application/types/authorization-target';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import type { AiPageContextTransactionLocker } from '../../services/ai-page-context-transaction-lock.port';

import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';
import type { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import { PageCompositionDraftValidator } from '../../services/page-composition-draft-validator.service';
import {
  PageCompositionExecutor,
  type PageCompositionExecutionResult,
} from '../../services/page-composition-executor.service';

import { ApplyGenerationCommand } from '../apply-generation/apply-generation.command';
import { ApplyGenerationHandler } from '../apply-generation/apply-generation.handler';

import { ConfirmPageCompositionCommand } from './confirm-page-composition.command';

export interface ConfirmPageCompositionResult {
  generation: AiGenerationResponseDto;
  execution: PageCompositionExecutionResult;
}

@Injectable()
export class ConfirmPageCompositionHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    private readonly authorizationService: AuthorizationService,

    private readonly pageCompositionDraftValidator: PageCompositionDraftValidator,

    private readonly pageCompositionExecutor: PageCompositionExecutor,

    private readonly applyGenerationHandler: ApplyGenerationHandler,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,

    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly conversationAccess: AiConversationAccessService,

    @Inject(AI_ASSISTANT_TYPES.ports.PageContextTransactionLocker)
    private readonly pageContextLock: AiPageContextTransactionLocker,
  ) {}

  async execute(
    command: ConfirmPageCompositionCommand,
  ): Promise<ConfirmPageCompositionResult> {
    return this.unitOfWork.runInTransaction(async (context) => {
      // Also serialize Page Composition confirmation with Discard.
      const generation =
        await this.generationRepository.findByIdAndUserIdForUpdate(
          command.generationId,
          command.userId,
          context,
        );

      if (!generation || generation.getUserId() !== command.userId) {
        throw new NotFoundException('AI generation not found');
      }

      if (generation.getCapability() !== PAGE_COMPOSITION_CAPABILITY) {
        throw new BadRequestException(
          'AI generation is not a page composition generation',
        );
      }

      if (generation.getStatus() !== AiGenerationStatus.COMPLETED) {
        throw new BadRequestException(
          'AI generation must be completed before confirmation',
        );
      }

      const workspaceId = generation.getWorkspaceId();

      if (!workspaceId) {
        throw new BadRequestException(
          'Page composition generation requires a workspace',
        );
      }

      const conversationId = generation.getConversationId();
      if (conversationId !== null) {
        const conversation =
          await this.conversationRepository.findByIdAndUserId(
            conversationId,
            command.userId,
            context,
          );
        if (!conversation || conversation.getUserId() !== command.userId) {
          throw new NotFoundException('AI conversation not found');
        }
        if (workspaceId !== conversation.getWorkspaceId()) {
          throw new ForbiddenException(
            'AI generation workspace does not match conversation',
          );
        }
        if (conversation.getScope() === AiConversationScope.PAGE) {
          const pageId = conversation.getPageId();
          if (!pageId) {
            throw new ForbiddenException(
              'AI conversation is missing its page scope',
            );
          }
          // Reuse the existing Page/permission locks before fresh authorization.
          // Keep them until execution and APPLIED commit or roll back together.
          await this.pageContextLock.lock(pageId, context, command.userId);
        }
        await this.conversationAccess.assertCanRead(
          conversation,
          command.userId,
          command.shareToken,
          context,
        );
      } else {
        // Older unlinked drafts follow the same workspace-read policy as GET
        // and Discard; destination PAGE_CREATE never substitutes for reading.
        await this.conversationAccess.assertWorkspaceRead(
          command.userId,
          workspaceId,
        );
      }

      const effectiveTeamspaceId = await this.resolveEffectiveTeamspaceId({
        workspaceId,
        teamspaceId: command.teamspaceId,
        parentPageId: command.parentPageId,
        context,
      });

      const authorizationTarget: AuthorizationTarget = effectiveTeamspaceId
        ? {
            type: 'teamspace',
            id: effectiveTeamspaceId,
            workspaceId,
          }
        : {
            type: 'workspace',
            id: workspaceId,
          };

      const allowed = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_CREATE],
        target: authorizationTarget,
      });

      if (!allowed) {
        throw new ForbiddenException(
          'You do not have permission to create page in this scope',
        );
      }

      /*
       * outputData đã được validate lúc generation hoàn thành,
       * nhưng Confirm phải validate lại trước khi thực thi.
       */
      const draft = this.pageCompositionDraftValidator.validate(
        generation.getOutputData(),
      );

      /*
       * PageCompositionExecutor tự mở UnitOfWork.
       *
       * TypeOrmUnitOfWork hiện tại reuse transaction đang active,
       * vì vậy call này vẫn nằm trong transaction của Confirm.
       */
      const execution = await this.pageCompositionExecutor.execute({
        userId: command.userId,
        workspaceId,
        teamspaceId: effectiveTeamspaceId,
        parentPageId: command.parentPageId ?? null,
        draft,
      });

      /*
       * Chỉ mark APPLIED sau khi toàn bộ draft execute thành công.
       *
       * ApplyGenerationHandler nhận cùng PersistenceContext,
       * nên APPLIED và toàn bộ resource vừa tạo commit/rollback cùng nhau.
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

  private async resolveEffectiveTeamspaceId(params: {
    workspaceId: string;
    teamspaceId?: string | null;
    parentPageId?: string | null;
    context: Parameters<PageRepository['findById']>[1];
  }): Promise<string | null> {
    let effectiveTeamspaceId = params.teamspaceId ?? null;

    if (!params.parentPageId) {
      return effectiveTeamspaceId;
    }

    const parentPage = await this.pageRepository.findById(
      params.parentPageId,
      params.context,
    );

    if (!parentPage || parentPage.getDeletedAt() !== null) {
      throw new NotFoundException('Parent page not found');
    }

    if (parentPage.getWorkspaceId() !== params.workspaceId) {
      throw new BadRequestException('Parent page does not belong to workspace');
    }

    const parentTeamspaceId = parentPage.getTeamspaceId();

    if (
      params.teamspaceId !== undefined &&
      params.teamspaceId !== null &&
      params.teamspaceId !== parentTeamspaceId
    ) {
      throw new BadRequestException(
        'Child page must belong to the same teamspace as parent page',
      );
    }

    effectiveTeamspaceId = parentTeamspaceId;

    return effectiveTeamspaceId;
  }
}
