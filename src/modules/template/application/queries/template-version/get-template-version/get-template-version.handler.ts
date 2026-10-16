import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { GetTemplateVersionQuery } from './get-template-version.query';

@Injectable()
export class GetTemplateVersionHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    private readonly authorizationService: AuthorizationService,
  ) { }

  async execute(
    query: GetTemplateVersionQuery,
  ): Promise<TemplateVersionResponseDto> {
    const version = await this.templateVersionRepository.findById(
      query.versionId,
    );

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    const template = await this.pageTemplateRepository.findById(
      version.getTemplateId(),
    );

    if (!template) {
      throw new NotFoundException('Page template not found');
    }

    const isCreator = query.userId
      ? template.getCreatedBy() === query.userId
      : false;

    let isOwner = false;
    let isMember = false;

    if (query.userId) {
      isMember = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: template.getWorkspaceId() },
      });

      if (isMember) {
        isOwner = await this.authorizationService.authorize({
          userId: query.userId,
          permissions: [PERMISSIONS.WORKSPACE_UPDATE],
          target: { type: 'workspace', id: template.getWorkspaceId() },
        });
      }
    }

    if (template.getVisibility() === TemplateVisibility.PRIVATE) {
      if (!isCreator && !isOwner) {
        throw new ForbiddenException(
          'You do not have permission to view this template',
        );
      }
    } else if (template.getVisibility() === TemplateVisibility.WORKSPACE) {
      if (!isMember) {
        throw new ForbiddenException(
          'You do not have permission to view this template',
        );
      }
    }

    if (version.isDraft()) {
      const isVersionCreator = query.userId
        ? version.getCreatedBy() === query.userId
        : false;

      if (!isCreator && !isVersionCreator && !isOwner) {
        throw new ForbiddenException(
          'You do not have permission to view draft template versions',
        );
      }
    }

    return TemplateVersionResponseDto.fromDomain(version);
  }
}
