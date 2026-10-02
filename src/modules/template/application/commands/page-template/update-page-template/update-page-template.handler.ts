import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { UpdatePageTemplateCommand } from './update-page-template.command';

@Injectable()
export class UpdatePageTemplateHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,
  ) {}

  async execute(
    command: UpdatePageTemplateCommand,
  ): Promise<PageTemplateResponseDto> {
    const template = await this.pageTemplateRepository.findById(
      command.templateId,
    );

    if (!template) {
      throw new NotFoundException('Page template not found');
    }

    template.updateMetadata({
      name: command.name,
      description: command.description,
      icon: command.icon,
      coverUrl: command.coverUrl,
      visibility: command.visibility,
    });

    const updated = await this.pageTemplateRepository.save(template);

    return PageTemplateResponseDto.fromDomain(updated);
  }
}
