import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';

import { TemplateReview } from '../../../../domain/entities/template-review.entity';
import type { TemplateReviewRepository } from '../../../../domain/repositories/template-review.repository';
import type { TemplateFeedbackReader } from '../../../ports/template-feedback-reader.port';
import { UpsertTemplateReviewCommand } from './upsert-template-review.command';

export interface UpsertTemplateReviewResult {
  rating: number;
  body: string | null;
}

@Injectable()
export class UpsertTemplateReviewHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templateRepository: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateReviewRepository)
    private readonly reviewRepository: TemplateReviewRepository,

    @Inject(MARKETPLACE_TYPES.ports.FeedbackReader)
    private readonly feedbackReader: TemplateFeedbackReader,
  ) {}

  async execute(
    command: UpsertTemplateReviewCommand,
  ): Promise<UpsertTemplateReviewResult> {
    const found = await this.templateRepository.findPublicById(
      command.templateId,
    );

    if (!found) {
      throw new NotFoundException('Template not found');
    }

    if (found.template.getCreatedBy() === command.userId) {
      throw new ForbiddenException('Creators cannot review their own template');
    }

    const body = command.body?.trim() || null;

    if (
      body &&
      !(await this.feedbackReader.hasEntitlement(
        command.templateId,
        command.userId,
      ))
    ) {
      throw new ForbiddenException(
        'Only users who own this template can write a review',
      );
    }

    const versionId = found.version.getId();
    const existing = await this.reviewRepository.findByTemplateAndUser(
      command.templateId,
      command.userId,
    );

    let review: TemplateReview;

    try {
      if (existing) {
        existing.update({ versionId, rating: command.rating, body });
        review = existing;
      } else {
        review = TemplateReview.create({
          templateId: command.templateId,
          userId: command.userId,
          versionId,
          rating: command.rating,
          body,
        });
      }
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const saved = await this.reviewRepository.save(review);

    return { rating: saved.getRating(), body: saved.getBody() };
  }
}
