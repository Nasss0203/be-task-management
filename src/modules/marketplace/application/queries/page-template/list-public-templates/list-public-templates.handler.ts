import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
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
    const result = await this.pageTemplateRepository.findMany({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      search,
      ...(categorySlug !== undefined ? { categorySlug } : {}),
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
    const items = result.items.map((template) => {
      const listing = listingsByTemplate.get(template.getId());
      if (!listing) throw new NotFoundException('Template listing not found');
      const version = result.versions.get(template.getId());
      return {
        ...PageTemplateResponseDto.fromDomain(template),
        offer_type: listing.getOfferType(),
        price_amount: listing.getPrice().getAmount(),
        currency: listing.getPrice().getCurrency(),
        categories: (categoriesByTemplate.get(template.getId()) ?? []).map(
          ({ id, name, slug }) => ({ id, name, slug }),
        ),
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
          })
        : null;
    return { items, nextCursor };
  }
}
