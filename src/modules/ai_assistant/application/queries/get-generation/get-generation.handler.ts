import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import { GetGenerationQuery } from './get-generation.query';

@Injectable()
export class GetGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: GetGenerationQuery): Promise<AiGenerationResponseDto> {
    const generation = await this.generationRepository.findByIdAndUserId(
      query.generationId,
      query.userId,
    );

    if (!generation) {
      throw new NotFoundException('AI generation not found');
    }

    const workspaceId = generation.getWorkspaceId();
    if (workspaceId) {
      const allowed = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException('Workspace access denied');
      }
    }

    return AiGenerationResponseDto.fromDomain(generation);
  }
}
