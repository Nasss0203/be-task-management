import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ContentPageSnapshotReaderPort } from 'src/modules/content/application/ports/content-page-snapshot-reader.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { TemplateVersionContentSnapshotService } from '../../../services/template-version-content-snapshot.service';
import { TemplateSnapshotFingerprintService } from '../../../services/template-snapshot-fingerprint.service';
import { CreatePageTemplateCommand } from './create-page-template.command';

export type CreatePageTemplateResult = {
  template: PageTemplateResponseDto;
  version: TemplateVersionResponseDto;
};

@Injectable()
export class CreatePageTemplateHandler {
  constructor(
    @Inject(CONTENT_TYPES.ports.PageSnapshotReader)
    private readonly pageSnapshotReader: ContentPageSnapshotReaderPort,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,

    private readonly contentSnapshotService: TemplateVersionContentSnapshotService,
    private readonly fingerprintService: TemplateSnapshotFingerprintService,
  ) {}

  async execute(
    command: CreatePageTemplateCommand,
  ): Promise<CreatePageTemplateResult> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const snapshot = await this.pageSnapshotReader.getPageSnapshot(
        command.pageId,
        context,
      );

      if (!snapshot) {
        throw new NotFoundException('Page not found');
      }

      const canReadPage = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_READ],
        target: {
          type: 'page',
          id: command.pageId,
        },
      });

      if (!canReadPage) {
        throw new ForbiddenException(
          'You do not have permission to access this page',
        );
      }

      const canAccessWorkspace = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: {
          type: 'workspace',
          id: snapshot.page.workspaceId,
        },
      });

      if (!canAccessWorkspace) {
        throw new ForbiddenException(
          'You do not have permission to create templates in this workspace',
        );
      }

      const prepared = await this.contentSnapshotService.prepare({
        blocks: snapshot.blocks,
        context,
      });
      const snapshotHash = this.fingerprintService.compute(prepared);

      const template = PageTemplate.create({
        sourcePageId: snapshot.page.id,
        workspaceId: snapshot.page.workspaceId,
        name: command.name ?? snapshot.page.title,
        description: command.description ?? null,
        icon: command.icon !== undefined ? command.icon : snapshot.page.icon,
        coverUrl:
          command.coverUrl !== undefined
            ? command.coverUrl
            : snapshot.page.coverUrl,
        createdBy: command.userId,

        // visibility chỉ truyền nếu create() thực sự nhận
        ...(command.visibility !== undefined
          ? { visibility: command.visibility }
          : {}),
      });

      const savedTemplate = await this.pageTemplateRepository.create(
        template,
        context,
      );

      const version = TemplateVersion.create({
        templateId: savedTemplate.getId(),
        versionNumber: 1,
        createdBy: command.userId,
        snapshotHash,
      });

      const savedVersion = await this.templateVersionRepository.create(
        version,
        context,
      );

      await this.contentSnapshotService.persist({
        snapshot: prepared,
        versionId: savedVersion.getId(),
        userId: command.userId,
        context,
      });

      return {
        template: PageTemplateResponseDto.fromDomain(savedTemplate),
        version: TemplateVersionResponseDto.fromDomain(savedVersion),
      };
    });
  }
}
