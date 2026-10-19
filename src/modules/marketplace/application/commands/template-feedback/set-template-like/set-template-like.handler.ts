import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';

import type { TemplateLikeRepository } from '../../../../domain/repositories/template-like.repository';
import type { TemplateLikeResponseDto } from '../../../dto/template-feedback/template-feedback.response.dto';
import type { TemplateFeedbackReader } from '../../../ports/template-feedback-reader.port';
import { SetTemplateLikeCommand } from './set-template-like.command';

@Injectable()
export class SetTemplateLikeHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templateRepository: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateLikeRepository)
    private readonly likeRepository: TemplateLikeRepository,

    @Inject(MARKETPLACE_TYPES.ports.FeedbackReader)
    private readonly feedbackReader: TemplateFeedbackReader,
  ) {}

  async execute(
    command: SetTemplateLikeCommand,
  ): Promise<TemplateLikeResponseDto> {
    if (command.liked) {
      const found = await this.templateRepository.findPublicById(
        command.templateId,
      );

      if (!found) {
        throw new NotFoundException('Template not found');
      }

      if (found.template.getCreatedBy() === command.userId) {
        throw new ForbiddenException('Creators cannot like their own template');
      }

      await this.likeRepository.add(command.templateId, command.userId);
    } else {
      await this.likeRepository.remove(command.templateId, command.userId);
    }

    const summaries = await this.feedbackReader.getSummaries([
      command.templateId,
    ]);

    return {
      liked: command.liked,
      like_count: summaries.get(command.templateId)?.likeCount ?? 0,
    };
  }
}
