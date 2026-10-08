import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import type { ListPageTemplatesResponseDto } from '../../../dto/page-template/list-page-templates.response.dto';
import { ListPublicTemplatesQuery } from './list-public-templates.query';
import {
  decodeTemplateListCursor,
  encodeTemplateListCursor,
} from '../list-page-templates/template-list-cursor.helper';

@Injectable()
export class ListPublicTemplatesHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,
  ) {}

  async execute(
    query: ListPublicTemplatesQuery,
  ): Promise<ListPageTemplatesResponseDto> {
    const limit = query.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'limit must be an integer between 1 and 100',
      );
    }
    const search = query.search?.trim() || undefined;
    const cursor = query.cursor
      ? decodeTemplateListCursor(query.cursor)
      : undefined;
    const result = await this.pageTemplateRepository.findMany({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      search,
      cursor,
      limit,
    });

    const items = result.items.map((template) => {
      const version = result.versions.get(template.getId());
      return {
        ...PageTemplateResponseDto.fromDomain(template),
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
