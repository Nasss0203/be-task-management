import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { GetPageTemplateQuery } from './get-page-template.query';

@Injectable()
export class GetPageTemplateHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: GetPageTemplateQuery): Promise<PageTemplateResponseDto> {
    const template = await this.pageTemplateRepository.findById(
      query.templateId,
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

    return PageTemplateResponseDto.fromDomain(template);
  }
}
