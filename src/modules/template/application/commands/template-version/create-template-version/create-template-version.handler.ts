import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
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

    private readonly authorizationService: AuthorizationService,
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

      const isCreator = template.getCreatedBy() === command.userId;
      const isOwner = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: { type: 'workspace', id: template.getWorkspaceId() },
      });

      if (!isCreator && !isOwner) {
        throw new ForbiddenException(
          'You do not have permission to create a version for this template',
        );
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
