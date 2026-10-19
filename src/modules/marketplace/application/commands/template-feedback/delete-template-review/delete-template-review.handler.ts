import { Inject, Injectable } from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import type { TemplateReviewRepository } from '../../../../domain/repositories/template-review.repository';
import { DeleteTemplateReviewCommand } from './delete-template-review.command';

@Injectable()
export class DeleteTemplateReviewHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplateReviewRepository)
    private readonly reviewRepository: TemplateReviewRepository,
  ) {}

  async execute(command: DeleteTemplateReviewCommand): Promise<void> {
    await this.reviewRepository.deleteByTemplateAndUser(
      command.templateId,
      command.userId,
    );
  }
}
