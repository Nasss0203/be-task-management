import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../../../../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { PageTemplateBlockResponseDto } from '../../../dto/template-block/page-template-block.response.dto';
import { TemplatePreviewResponseDto } from '../../../dto/template-preview/template-preview.response.dto';
import { PageTemplateDatabaseResponseDto } from '../../../dto/template-preview/page-template-database.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';

import { GetTemplatePreviewQuery } from './get-template-preview.query';

@Injectable()
export class GetTemplatePreviewHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,

    private readonly authorizationService: AuthorizationService,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateDatabaseSnapshotRepository)
    private readonly templateDatabaseSnapshotRepository: PageTemplateDatabaseSnapshotRepository,
  ) {}

  async execute(
    query: GetTemplatePreviewQuery,
  ): Promise<TemplatePreviewResponseDto> {
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

    const version = await this.templateVersionRepository.findById(
      query.versionId,
    );

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    if (version.getTemplateId() !== template.getId()) {
      throw new BadRequestException(
        'Template version does not belong to this template',
      );
    }

    // Critical: Draft leakage prevention!
    if (version.isDraft()) {
      const isVersionCreator = query.userId
        ? version.getCreatedBy() === query.userId
        : false;

      if (!isCreator && !isVersionCreator && !isOwner) {
        throw new ForbiddenException(
          'You do not have permission to preview draft template versions',
        );
      }
    }

    const blocks = await this.pageTemplateBlockRepository.findByVersionId(
      version.getId(),
    );

    const databases =
      await this.templateDatabaseSnapshotRepository.findByVersionId(
        version.getId(),
      );

    return new TemplatePreviewResponseDto({
      template: PageTemplateResponseDto.fromDomain(template),

      version: TemplateVersionResponseDto.fromDomain(version),

      blocks: blocks.map((block) =>
        PageTemplateBlockResponseDto.fromDomain(block),
      ),
      databases: databases.map((database) =>
        PageTemplateDatabaseResponseDto.fromDomain(database),
      ),
    });
  }
}
