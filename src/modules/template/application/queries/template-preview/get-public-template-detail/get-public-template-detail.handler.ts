import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import type { PublicTemplateDetailResponseDto } from '../../../dto/page-template/public-template.response.dto';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { GetPublicTemplateDetailQuery } from './get-public-template-detail.query';

@Injectable()
export class GetPublicTemplateDetailHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,
    @Inject(TEMPLATE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,
  ) {}

  async execute(
    query: GetPublicTemplateDetailQuery,
  ): Promise<PublicTemplateDetailResponseDto> {
    const result = await this.pageTemplateRepository.findPublicById(
      query.templateId,
    );

    if (!result) {
      throw new NotFoundException('Template not found');
    }

    const templateId = result.template.getId();
    const categoriesByTemplate =
      await this.templateListingRepository.findCategoriesByTemplateIds(
        [templateId],
        { activeOnly: true },
      );
    return {
      ...PageTemplateResponseDto.fromDomain(result.template),
      version: TemplateVersionResponseDto.fromDomain(result.version),
      categories: (categoriesByTemplate.get(templateId) ?? []).map(
        ({ id, name, slug }) => ({ id, name, slug }),
      ),
    };
  }
}
