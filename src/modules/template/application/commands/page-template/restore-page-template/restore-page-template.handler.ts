import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { RestorePageTemplateCommand } from './restore-page-template.command';

@Injectable()
export class RestorePageTemplateHandler {
  constructor(
    @Inject(PERSISTENCE_TYPES.UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: RestorePageTemplateCommand,
  ): Promise<PageTemplateResponseDto> {
    return this.uow.runInTransaction(async (context) => {
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
          'You do not have permission to restore this template',
        );
      }

      template.restoreArchived();

      const saved = await this.pageTemplateRepository.save(template, context);

      return PageTemplateResponseDto.fromDomain(saved);
    });
  }
}
