import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { CreateTemplateVersionCommand } from './create-template-version.command';

@Injectable()
export class CreateTemplateVersionHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: CreateTemplateVersionCommand,
  ): Promise<TemplateVersionResponseDto> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const template = await this.pageTemplateRepository.findByIdForUpdate(
        command.templateId,
        context,
      );

      if (!template) {
        throw new NotFoundException('Page template not found');
      }

      template.ensureCanCreateVersion();

      const versionNumber =
        await this.templateVersionRepository.getNextVersionNumber(
          command.templateId,
          context,
        );

      const version = TemplateVersion.create({
        templateId: command.templateId,
        versionNumber,
        createdBy: command.userId,
      });

      const created = await this.templateVersionRepository.create(
        version,
        context,
      );

      return TemplateVersionResponseDto.fromDomain(created);
    });
  }
}
