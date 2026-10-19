import type { TemplateCreatorReader } from '../../../ports/template-creator-reader.port';
import { toPublicCreator } from '../../../dto/page-template/public-template-creator';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { TemplateFeedbackReader } from '../../../ports/template-feedback-reader.port';
import type { CreatorProfileReader } from '../../../ports/creator-profile-reader.port';
import { toFeedbackSummaryDto } from '../../../dto/template-feedback/template-feedback.response.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type {
  TemplateListingRepository,
  TemplateListingCategoryInfo,
} from '../../../../domain/repositories/template-listing.repository';
import { TemplateListScope } from '../../../../../template/presentation/http/requests/list-page-templates.request';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';
import { TemplateVersionResponseDto } from '../../../../../template/application/dto/template-version/template-version.response.dto';
import { PageTemplateResponseDto } from '../../../../../template/application/dto/page-template/page-template.response.dto';
import type { ListPublicTemplatesResponseDto } from '../../../dto/page-template/public-template.response.dto';
import { ListPublicTemplatesQuery } from './list-public-templates.query';
import {
  decodeTemplateListCursor,
  encodeTemplateListCursor,
} from '../../../../../template/application/queries/page-template/list-page-templates/template-list-cursor.helper';

@Injectable()
export class ListPublicTemplatesHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly pageTemplateRepository: TemplateContentPort,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,
    @Inject(MARKETPLACE_TYPES.ports.CreatorReader)
    private readonly creatorReader: TemplateCreatorReader,
    @Inject(MARKETPLACE_TYPES.ports.FeedbackReader)
    private readonly feedbackReader: TemplateFeedbackReader,
    @Inject(MARKETPLACE_TYPES.ports.CreatorProfileReader)
    private readonly creatorProfileReader: CreatorProfileReader,
  ) {}

  async execute(
    query: ListPublicTemplatesQuery,
  ): Promise<ListPublicTemplatesResponseDto> {
    const limit = query.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'limit must be an integer between 1 and 100',
      );
    }
    const search = query.search?.trim() || undefined;
    let categorySlug: string | undefined;
    if (query.category !== undefined) {
      if (typeof query.category !== 'string')
        throw new BadRequestException('category must be a slug string');
      categorySlug = query.category.trim().toLowerCase();
      if (
        categorySlug.length > 100 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug) ||
        isUUID(categorySlug)
      )
        throw new BadRequestException('category must be a valid category slug');
    }
    const cursor = query.cursor
      ? decodeTemplateListCursor(query.cursor)
      : undefined;
    if (cursor && query.sort !== 'newest' && cursor.score === undefined) {
      throw new BadRequestException('Cursor does not match the sort order');
    }
    let createdBy: string | undefined;
    if (query.creator !== undefined) {
      const creator = await this.creatorProfileReader.findPublicByHandle(
        query.creator,
      );
      if (!creator) return { items: [], nextCursor: null };
      createdBy = creator.userId;
    }
    const result = await this.pageTemplateRepository.findMany({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      search,
      ...(categorySlug !== undefined ? { categorySlug } : {}),
      ...(query.tag !== undefined ? { tag: query.tag } : {}),
      ...(query.offerType !== undefined ? { offerType: query.offerType } : {}),
      ...(createdBy !== undefined ? { createdBy } : {}),
      sort: query.sort,
      cursor,
      limit,
    });

    const listingsByTemplate =
      await this.templateListingRepository.findByTemplateIds(
        result.items.map((template) => template.getId()),
      );
    const categoriesByTemplate =
      result.items.length > 0
        ? await this.templateListingRepository.findCategoriesByTemplateIds(
            result.items.map((template) => template.getId()),
            { activeOnly: true },
          )
        : new Map<string, TemplateListingCategoryInfo[]>();
    const templateIds = result.items.map((template) => template.getId());
    const [tagsByTemplate, creators, feedback] = await Promise.all([
      this.templateListingRepository.findTagsByTemplateIds(templateIds),
      this.creatorReader.findProfiles(
        result.items.map((template) => template.getCreatedBy()),
      ),
      this.feedbackReader.getSummaries(templateIds),
    ]);
    const items = result.items.map((template) => {
      const listing = listingsByTemplate.get(template.getId());
      if (!listing) throw new NotFoundException('Template listing not found');
      const version = result.versions.get(template.getId());
      return {
        ...PageTemplateResponseDto.fromDomain(template),
        offer_type: listing.getOfferType(),
        price_amount: listing.getPrice().getAmount(),
        currency: listing.getPrice().getCurrency(),
        preview_mode: listing.getPreviewMode(),
        categories: (categoriesByTemplate.get(template.getId()) ?? []).map(
          ({ id, name, slug }) => ({ id, name, slug }),
        ),
        tags: tagsByTemplate.get(template.getId()) ?? [],
        creator: toPublicCreator(creators.get(template.getCreatedBy())),
        ...toFeedbackSummaryDto(feedback.get(template.getId())),
        version: version
          ? TemplateVersionResponseDto.fromDomain(version)
          : null,
      };
    });
    const last = result.items[result.items.length - 1];
    const nextCursor =
      result.hasNextPage && last
        ? encodeTemplateListCursor({
            createdAt: last.getCreatedAt(),
            id: last.getId(),
            ...(query.sort === 'top_rated'
              ? {
                  score: Math.round(
                    (feedback.get(last.getId())?.ratingAverage ?? 0) * 100,
                  ),
                }
              : query.sort === 'most_liked'
                ? { score: feedback.get(last.getId())?.likeCount ?? 0 }
                : {}),
          })
        : null;
    return { items, nextCursor };
  }
}
