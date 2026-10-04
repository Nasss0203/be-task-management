import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ContentPageProvisioningPort,
  CreatePageBlockSnapshotInput,
} from 'src/modules/content/application/ports/content-page-provisioning.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type {
  DatabaseProvisioningPort,
  DatabaseProvisioningResult,
  ProvisionDatabaseSnapshot,
} from 'src/modules/database/application/ports/database-provisioning.port';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PageBlockJson } from 'src/shared/domain/page-block.types';

import type { PageTemplateDatabase } from '../../../../domain/aggregates/template-database/page-template-database.aggregate';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../../../../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { UseTemplateCommand } from './use-template.command';

export type UseTemplateResult = {
  pageId: string;
};

@Injectable()
export class UseTemplateHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateDatabaseSnapshotRepository)
    private readonly templateDatabaseSnapshotRepository: PageTemplateDatabaseSnapshotRepository,

    @Inject(CONTENT_TYPES.ports.PageProvisioning)
    private readonly pageProvisioningPort: ContentPageProvisioningPort,

    @Inject(DATABASE_TYPES.ports.DatabaseProvisioning)
    private readonly databaseProvisioning: DatabaseProvisioningPort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: UseTemplateCommand): Promise<UseTemplateResult> {
    return this.uow.runInTransaction(async (context) => {
      const template = await this.pageTemplateRepository.findById(
        command.templateId,
        context,
      );

      if (!template) {
        throw new NotFoundException('Page template not found');
      }

      if (template.getStatus() === TemplateStatus.ARCHIVED) {
        throw new BadRequestException('Archived template cannot be used');
      }

      if (template.getVisibility() === TemplateVisibility.PRIVATE) {
        const isCreator = template.getCreatedBy() === command.userId;
        const isOwner = await this.authorizationService.authorize({
          userId: command.userId,
          permissions: [PERMISSIONS.WORKSPACE_UPDATE],
          target: { type: 'workspace', id: template.getWorkspaceId() },
        });

        if (!isCreator && !isOwner) {
          throw new ForbiddenException(
            'You do not have permission to use this private template',
          );
        }
      } else if (template.getVisibility() === TemplateVisibility.WORKSPACE) {
        const isMember = await this.authorizationService.authorize({
          userId: command.userId,
          permissions: [PERMISSIONS.WORKSPACE_READ],
          target: { type: 'workspace', id: template.getWorkspaceId() },
        });

        if (!isMember) {
          throw new ForbiddenException(
            'You do not have permission to use this template',
          );
        }
      }

      const version = await this.templateVersionRepository.findById(
        command.versionId,
        context,
      );

      if (!version) {
        throw new NotFoundException('Template version not found');
      }

      if (version.getTemplateId() !== template.getId()) {
        throw new BadRequestException(
          'Template version does not belong to this template',
        );
      }

      version.ensureUsable();

      const canCreateInDestination = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_CREATE],
        target: {
          type: 'workspace',
          id: command.workspaceId,
        },
      });

      if (!canCreateInDestination) {
        throw new ForbiddenException(
          'You do not have permission to create page in destination workspace',
        );
      }

      const templateBlocks =
        await this.pageTemplateBlockRepository.findByVersionId(
          version.getId(),
          context,
        );

      const templateDatabases =
        await this.templateDatabaseSnapshotRepository.findByVersionId(
          version.getId(),
          context,
        );

      const pageResult = await this.pageProvisioningPort.createPageShell(
        {
          workspaceId: command.workspaceId,
          title: template.getName(),
          createdBy: command.userId,
          icon: template.getIcon(),
          coverUrl: template.getCoverUrl(),
        },
        context,
      );

      const provisioningResult =
        await this.databaseProvisioning.provisionDatabases(
          {
            pageId: pageResult.pageId,
            databases: this.toProvisioningSnapshots(templateDatabases),
          },
          context,
        );

      const templateViewIdsByDatabase =
        this.indexTemplateViewIds(templateDatabases);

      const remappedBlocks: CreatePageBlockSnapshotInput[] = templateBlocks.map(
        (block) => ({
          sourceId: block.getId(),
          parentSourceId: block.getParentBlockId(),

          type: block.getType(),
          title: block.getTitle(),

          positionX: block.getPositionX(),
          positionY: block.getPositionY(),
          width: block.getWidth(),
          height: block.getHeight(),

          orderIndex: block.getOrderIndex(),

          content: block.getContent(),
          styleConfig: block.getStyleConfig(),
          dataConfig: this.remapBlockDataConfig(
            block.getType(),
            block.getDataConfig(),
            provisioningResult,
            templateViewIdsByDatabase,
          ),

          isOpen: block.getIsOpen(),
        }),
      );

      await this.pageProvisioningPort.createBlocksFromSnapshot(
        {
          pageId: pageResult.pageId,
          createdBy: command.userId,
          blocks: remappedBlocks,
        },
        context,
      );

      return {
        pageId: pageResult.pageId,
      };
    });
  }

  private toProvisioningSnapshots(
    templateDatabases: PageTemplateDatabase[],
  ): ProvisionDatabaseSnapshot[] {
    return templateDatabases.map((database) => ({
      sourceId: database.getId(),
      name: database.getName(),
      properties: database.getProperties().map((property) => ({
        sourceId: property.getId(),
        name: property.getName(),
        type: property.getType(),
        isDefault: property.getIsDefault(),
        isHideable: property.getIsHideable(),
        position: property.getPosition(),
        options: property.getOptions().map((option) => ({
          sourceId: option.getId(),
          name: option.getName(),
          color: option.getColor(),
          position: option.getPosition(),
        })),
      })),
      rows: database.getRows().map((row) => ({
        sourceId: row.getId(),
        values: row.getValues().map((value) => ({
          sourceId: value.getId(),
          propertySourceId: value.getTemplatePropertyId(),
          value: value.getValue(),
        })),
      })),
      views: database.getViews().map((view) => {
        if (view.getTemplateDatabaseId() !== database.getId()) {
          throw new BadRequestException(
            `Template view "${view.getId()}" does not belong to template database "${database.getId()}"`,
          );
        }

        return {
          sourceId: view.getId(),
          name: view.getName(),
          type: view.getType(),
          position: view.getPosition(),
          properties: view.getProperties().map((property) => ({
            sourceId: property.getId(),
            propertySourceId: property.getTemplatePropertyId(),
            position: property.getPosition(),
            visible: property.getVisible(),
            width: property.getWidth(),
          })),
        };
      }),
    }));
  }

  private indexTemplateViewIds(
    templateDatabases: PageTemplateDatabase[],
  ): Map<string, Set<string>> {
    return new Map(
      templateDatabases.map((database) => [
        database.getId(),
        new Set(database.getViews().map((view) => view.getId())),
      ]),
    );
  }

  private remapBlockDataConfig(
    blockType: PageBlockType,
    dataConfig: PageBlockJson,
    provisioningResult: DatabaseProvisioningResult,
    templateViewIdsByDatabase: Map<string, Set<string>>,
  ): PageBlockJson {
    if (blockType !== PageBlockType.DATABASE_VIEW) {
      return dataConfig;
    }

    if (!this.isJsonRecord(dataConfig)) {
      throw new BadRequestException(
        'DATABASE_VIEW block requires an object dataConfig',
      );
    }

    const templateDatabaseId = dataConfig.database_id;
    const templateViewId = dataConfig.view_id;

    if (typeof templateDatabaseId !== 'string' || !templateDatabaseId.trim()) {
      throw new BadRequestException('DATABASE_VIEW block requires database_id');
    }

    if (typeof templateViewId !== 'string' || !templateViewId.trim()) {
      throw new BadRequestException('DATABASE_VIEW block requires view_id');
    }

    const templateViewIds = templateViewIdsByDatabase.get(templateDatabaseId);

    if (!templateViewIds) {
      throw new BadRequestException(
        `Template database snapshot not found: ${templateDatabaseId}`,
      );
    }

    if (!templateViewIds.has(templateViewId)) {
      throw new BadRequestException(
        `Template view "${templateViewId}" does not belong to template database "${templateDatabaseId}"`,
      );
    }

    const liveDatabaseId =
      provisioningResult.databaseIdMap.get(templateDatabaseId);

    if (!liveDatabaseId) {
      throw new BadRequestException(
        `Live database mapping not found: ${templateDatabaseId}`,
      );
    }

    const liveViewId = provisioningResult.viewIdMap.get(templateViewId);

    if (!liveViewId) {
      throw new BadRequestException(
        `Live database view mapping not found: ${templateViewId}`,
      );
    }

    return {
      ...dataConfig,
      database_id: liveDatabaseId,
      view_id: liveViewId,
    };
  }

  private isJsonRecord(value: PageBlockJson): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
