import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiUsageRepository } from '../../../domain/repositories/ai-usage.repository';
import { AiUsageSummaryResponseDto } from '../../dto/response/ai-usage-summary.response.dto';
import { GetAiUsageSummaryQuery } from './get-ai-usage-summary.query';

@Injectable()
export class GetAiUsageSummaryHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiUsageRepository)
    private readonly usageRepository: AiUsageRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: GetAiUsageSummaryQuery,
  ): Promise<AiUsageSummaryResponseDto> {
    if (query.filters.workspaceId) {
      const allowed = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: query.filters.workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException('Workspace access denied');
      }
    }

    const summary = await this.usageRepository.sumByUser(
      query.userId,
      query.filters,
    );
    return AiUsageSummaryResponseDto.fromSummary(summary);
  }
}
