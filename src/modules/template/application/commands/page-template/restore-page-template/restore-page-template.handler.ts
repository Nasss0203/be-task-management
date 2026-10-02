import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { RestorePageTemplateCommand } from './restore-page-template.command';

@Injectable()
export class RestorePageTemplateHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,
  ) {}

  async execute(
    command: RestorePageTemplateCommand,
  ): Promise<PageTemplateResponseDto> {
    const template = await this.pageTemplateRepository.findById(
      command.templateId,
    );

    if (!template) {
      throw new NotFoundException('Page template not found');
    }

    template.restoreArchived();

    const saved = await this.pageTemplateRepository.save(template);

    return PageTemplateResponseDto.fromDomain(saved);
  }
}
