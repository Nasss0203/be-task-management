import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ContentPageSnapshotReaderPort } from 'src/modules/content/application/ports/content-page-snapshot-reader.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { TemplateVersionContentSnapshotService } from '../../../services/template-version-content-snapshot.service';
import { TemplateSnapshotFingerprintService } from '../../../services/template-snapshot-fingerprint.service';
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

    @Inject(CONTENT_TYPES.ports.PageSnapshotReader)
    private readonly pageSnapshotReader: ContentPageSnapshotReaderPort,

    private readonly contentSnapshotService: TemplateVersionContentSnapshotService,
    private readonly fingerprintService: TemplateSnapshotFingerprintService,
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

      const sourcePageId = template.getSourcePageId();

      if (!sourcePageId) {
        throw new BadRequestException(
          'Template source page is no longer available',
        );
      }

      const snapshot = await this.pageSnapshotReader.getPageSnapshot(
        sourcePageId,
        context,
      );

      if (!snapshot) {
        throw new NotFoundException('Page not found');
      }

      const canReadPage = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_READ],
        target: { type: 'page', id: sourcePageId },
      });

      if (!canReadPage) {
        throw new ForbiddenException(
          'You do not have permission to access this page',
        );
      }

      const canAccessWorkspace = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: snapshot.page.workspaceId },
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
      const latest =
        await this.templateVersionRepository.findLatestByTemplateId(
          command.templateId,
          context,
        );

      if (latest?.getSnapshotHash() === snapshotHash) {
        throw new ConflictException(
          'No changes detected since the latest template version',
        );
      }

      const versionNumber =
        await this.templateVersionRepository.getNextVersionNumber(
          command.templateId,
          context,
        );

      const version = TemplateVersion.create({
        templateId: command.templateId,
        versionNumber,
        createdBy: command.userId,
        snapshotHash,
      });

      const created = await this.templateVersionRepository.create(
        version,
        context,
      );

      await this.contentSnapshotService.persist({
        snapshot: prepared,
        versionId: created.getId(),
        userId: command.userId,
        context,
      });

      return TemplateVersionResponseDto.fromDomain(created);
    });
  }
}
