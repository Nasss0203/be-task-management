import { Inject, Injectable } from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import type { ListTemplateVersionsResponseDto } from '../../../dto/template-version/list-template-versions.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { GetPageTemplateHandler } from '../../page-template/get-page-template/get-page-template.handler';
import { GetPageTemplateQuery } from '../../page-template/get-page-template/get-page-template.query';
import { ListTemplateVersionsQuery } from './list-template-versions.query';

@Injectable()
export class ListTemplateVersionsHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.GetPageTemplateHandler)
    private readonly getPageTemplateHandler: GetPageTemplateHandler,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: ListTemplateVersionsQuery,
  ): Promise<ListTemplateVersionsResponseDto> {
    const template = await this.getPageTemplateHandler.execute(
      new GetPageTemplateQuery(query.templateId, query.userId),
    );

    const isTemplateCreator = template.created_by === query.userId;
    let isOwner = false;

    if (!isTemplateCreator) {
      const isMember = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: template.workspace_id },
      });

      if (isMember) {
        isOwner = await this.authorizationService.authorize({
          userId: query.userId,
          permissions: [PERMISSIONS.WORKSPACE_UPDATE],
          target: { type: 'workspace', id: template.workspace_id },
        });
      }
    }

    const versions = await this.templateVersionRepository.findByTemplateId(
      query.templateId,
    );

    const items = versions
      .filter(
        (version) =>
          version.getTemplateId() === query.templateId &&
          (!version.isDraft() ||
            isTemplateCreator ||
            isOwner ||
            version.getCreatedBy() === query.userId),
      )
      .sort(
        (left, right) =>
          right.getVersionNumber() - left.getVersionNumber() ||
          right.getId().localeCompare(left.getId()),
      )
      .map((version) => TemplateVersionResponseDto.fromDomain(version));

    return { items };
  }
}
