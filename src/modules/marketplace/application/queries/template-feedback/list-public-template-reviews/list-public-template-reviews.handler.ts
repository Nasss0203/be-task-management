import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';

import {
  toFeedbackSummaryDto,
  toTemplateReviewDto,
  type TemplateFeedbackViewerDto,
  type TemplateReviewsResponseDto,
} from '../../../dto/template-feedback/template-feedback.response.dto';
import type { TemplateFeedbackReader } from '../../../ports/template-feedback-reader.port';
import { ListPublicTemplateReviewsQuery } from './list-public-template-reviews.query';

@Injectable()
export class ListPublicTemplateReviewsHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templateRepository: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.ports.FeedbackReader)
    private readonly feedbackReader: TemplateFeedbackReader,
  ) {}

  async execute(
    query: ListPublicTemplateReviewsQuery,
  ): Promise<TemplateReviewsResponseDto> {
    const found = await this.templateRepository.findPublicById(
      query.templateId,
    );

    if (!found) {
      throw new NotFoundException('Template not found');
    }

    const isCreator = found.template.getCreatedBy() === query.viewerId;

    const [summaries, distribution, reviews, viewer] = await Promise.all([
      this.feedbackReader.getSummaries([query.templateId]),
      this.feedbackReader.getRatingDistribution(query.templateId),
      this.feedbackReader.listReviews(
        query.templateId,
        query.page,
        query.limit,
      ),
      query.viewerId
        ? this.feedbackReader.getViewer(query.templateId, query.viewerId)
        : Promise.resolve(null),
    ]);

    const viewerDto: TemplateFeedbackViewerDto | null = viewer
      ? {
          liked: viewer.liked,
          review: viewer.review,
          is_creator: isCreator,
          can_comment: viewer.isOwner && !isCreator,
        }
      : null;

    return {
      ...toFeedbackSummaryDto(summaries.get(query.templateId)),
      distribution,
      items: reviews.items.map(toTemplateReviewDto),
      total: reviews.total,
      page: query.page,
      limit: query.limit,
      total_pages:
        reviews.total === 0 ? 0 : Math.ceil(reviews.total / query.limit),
      viewer: viewerDto,
    };
  }
}
