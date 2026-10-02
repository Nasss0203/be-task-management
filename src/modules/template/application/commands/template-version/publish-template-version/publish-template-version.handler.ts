import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { PublishTemplateVersionCommand } from './publish-template-version.command';

@Injectable()
export class PublishTemplateVersionHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: PublishTemplateVersionCommand,
  ): Promise<TemplateVersionResponseDto> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const version = await this.templateVersionRepository.findByIdForUpdate(
        command.versionId,
        context,
      );

      if (!version) {
        throw new NotFoundException('Template version not found');
      }

      if (version.getTemplateId() !== command.templateId) {
        throw new BadRequestException(
          'Template version does not belong to this template',
        );
      }

      version.publish();

      const saved = await this.templateVersionRepository.save(version, context);

      return TemplateVersionResponseDto.fromDomain(saved);
    });
  }
}
