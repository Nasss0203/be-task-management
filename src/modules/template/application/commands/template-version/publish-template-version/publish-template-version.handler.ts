import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { PublishTemplateVersionCommand } from './publish-template-version.command';

@Injectable()
export class PublishTemplateVersionHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: PublishTemplateVersionCommand,
  ): Promise<TemplateVersionResponseDto> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const template = await this.pageTemplateRepository.findById(
        command.templateId,
        context,
      );

      if (!template) {
        throw new NotFoundException('Page template not found');
      }

      const isCreator = template.getCreatedBy() === command.userId;
      const isOwner = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: { type: 'workspace', id: template.getWorkspaceId() },
      });

      if (!isCreator && !isOwner) {
        throw new ForbiddenException(
          'You do not have permission to publish this template version',
        );
      }

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
