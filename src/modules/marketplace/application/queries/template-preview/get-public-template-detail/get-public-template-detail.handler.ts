import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import type { PublicTemplateDetailResponseDto } from '../../../dto/page-template/public-template.response.dto';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';
import { PageTemplateResponseDto } from '../../../../../template/application/dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../../../template/application/dto/template-version/template-version.response.dto';
import { GetPublicTemplateDetailQuery } from './get-public-template-detail.query';

@Injectable()
export class GetPublicTemplateDetailHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly pageTemplateRepository: TemplateContentPort,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
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
    const listing =
      await this.templateListingRepository.findByTemplateId(templateId);
    if (!listing) throw new NotFoundException('Template listing not found');
    const categoriesByTemplate =
      await this.templateListingRepository.findCategoriesByTemplateIds(
        [templateId],
        { activeOnly: true },
      );
    return {
      ...PageTemplateResponseDto.fromDomain(result.template),
      offer_type: listing.getOfferType(),
      price_amount: listing.getPrice().getAmount(),
      currency: listing.getPrice().getCurrency(),
      version: TemplateVersionResponseDto.fromDomain(result.version),
      categories: (categoriesByTemplate.get(templateId) ?? []).map(
        ({ id, name, slug }) => ({ id, name, slug }),
      ),
    };
  }
}
