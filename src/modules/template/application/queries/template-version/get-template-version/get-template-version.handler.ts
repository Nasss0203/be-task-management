import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { GetTemplateVersionQuery } from './get-template-version.query';

@Injectable()
export class GetTemplateVersionHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,
  ) {}

  async execute(
    query: GetTemplateVersionQuery,
  ): Promise<TemplateVersionResponseDto> {
    const version = await this.templateVersionRepository.findById(
      query.versionId,
    );

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    return TemplateVersionResponseDto.fromDomain(version);
  }
}
