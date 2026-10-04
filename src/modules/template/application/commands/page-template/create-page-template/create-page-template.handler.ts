import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ContentPageBlockSnapshot,
  ContentPageSnapshotReaderPort,
} from 'src/modules/content/application/ports/content-page-snapshot-reader.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type {
  DatabaseSnapshotProperty,
  DatabaseSnapshotReaderPort,
} from 'src/modules/database/application/ports/database-snapshot-reader.port';
import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { PageTemplateDatabase } from '../../../../domain/aggregates/template-database/page-template-database.aggregate';
import { PageTemplateDatabaseProperty } from '../../../../domain/aggregates/template-database/page-template-database-property.entity';
import { PageTemplateDatabasePropertyOption } from '../../../../domain/aggregates/template-database/page-template-database-property-option.entity';
import { PageTemplateDatabaseRow } from '../../../../domain/aggregates/template-database/page-template-database-row.entity';
import { PageTemplateDatabaseRowValue } from '../../../../domain/aggregates/template-database/page-template-database-row-value.entity';
import { PageTemplateDatabaseView } from '../../../../domain/aggregates/template-database/page-template-database-view.entity';
import { PageTemplateDatabaseViewProperty } from '../../../../domain/aggregates/template-database/page-template-database-view-property.entity';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateBlock } from '../../../../domain/entities/page-template-block.entity';
import type { PageTemplateDatabaseSnapshotRepository } from '../../../../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
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

    @Inject(DATABASE_TYPES.ports.DatabaseSnapshotReader)
    private readonly databaseSnapshotReader: DatabaseSnapshotReaderPort,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateDatabaseSnapshotRepository)
    private readonly templateDatabaseSnapshotRepository: PageTemplateDatabaseSnapshotRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
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
      });

      const savedVersion = await this.templateVersionRepository.create(
        version,
        context,
      );

      const databaseViewReferences = new Map<string, Set<string>>();

      for (const block of snapshot.blocks) {
        if (block.type !== PageBlockType.DATABASE_VIEW) {
          continue;
        }

        const { databaseId, viewId } = this.getDatabaseViewReference(block);
        const referencedViewIds =
          databaseViewReferences.get(databaseId) ?? new Set<string>();

        referencedViewIds.add(viewId);
        databaseViewReferences.set(databaseId, referencedViewIds);
      }

      const databaseIdMap = new Map<string, string>();
      const propertyIdMap = new Map<string, string>();
      const optionIdMap = new Map<string, string>();
      const rowIdMap = new Map<string, string>();
      const viewIdMap = new Map<string, string>();
      const templateDatabases: PageTemplateDatabase[] = [];

      for (const [
        sourceDatabaseId,
        referencedViewIds,
      ] of databaseViewReferences) {
        const sourceSnapshot =
          await this.databaseSnapshotReader.getDatabaseSnapshot(
            sourceDatabaseId,
            context,
          );

        if (!sourceSnapshot) {
          throw new NotFoundException(
            `Database "${sourceDatabaseId}" not found`,
          );
        }

        const sourceViewIds = new Set(
          sourceSnapshot.views.map((sourceView) => sourceView.id),
        );

        for (const referencedViewId of referencedViewIds) {
          if (!sourceViewIds.has(referencedViewId)) {
            throw new BadRequestException(
              `Database view "${referencedViewId}" does not belong to database "${sourceDatabaseId}"`,
            );
          }
        }

        const templateDatabase = PageTemplateDatabase.create({
          versionId: savedVersion.getId(),
          name: sourceSnapshot.database.name,
        });

        databaseIdMap.set(sourceSnapshot.database.id, templateDatabase.getId());

        const propertyLookup = new Map<string, DatabaseSnapshotProperty>();

        for (const sourceProperty of sourceSnapshot.properties) {
          propertyLookup.set(sourceProperty.id, sourceProperty);

          const templateProperty = PageTemplateDatabaseProperty.create({
            templateDatabaseId: templateDatabase.getId(),
            name: sourceProperty.name,
            type: sourceProperty.type,
            isDefault: sourceProperty.isDefault,
            isHideable: sourceProperty.isHideable,
            position: sourceProperty.position,
          });

          propertyIdMap.set(sourceProperty.id, templateProperty.getId());

          for (const sourceOption of sourceProperty.options) {
            const templateOption = PageTemplateDatabasePropertyOption.create({
              templatePropertyId: templateProperty.getId(),
              name: sourceOption.name,
              color: sourceOption.color,
              position: sourceOption.position,
            });

            optionIdMap.set(sourceOption.id, templateOption.getId());
            templateProperty.addOption(templateOption);
          }

          templateDatabase.addProperty(templateProperty);
        }

        for (const sourceRow of sourceSnapshot.rows) {
          const templateRow = PageTemplateDatabaseRow.create({
            templateDatabaseId: templateDatabase.getId(),
          });

          rowIdMap.set(sourceRow.id, templateRow.getId());

          for (const sourceValue of sourceRow.values) {
            const templatePropertyId = propertyIdMap.get(
              sourceValue.propertyId,
            );
            const sourceProperty = propertyLookup.get(sourceValue.propertyId);

            if (!templatePropertyId || !sourceProperty) {
              throw new BadRequestException(
                `Row value property "${sourceValue.propertyId}" could not be resolved`,
              );
            }

            const templateValue = PageTemplateDatabaseRowValue.create({
              templateRowId: templateRow.getId(),
              templatePropertyId,
              value: this.remapRowValue(
                sourceValue.value,
                sourceProperty,
                optionIdMap,
              ),
            });

            templateRow.addValue(templateValue);
          }

          templateDatabase.addRow(templateRow);
        }

        for (const sourceView of sourceSnapshot.views) {
          const templateView = PageTemplateDatabaseView.create({
            templateDatabaseId: templateDatabase.getId(),
            name: sourceView.name,
            type: sourceView.type,
            position: sourceView.position,
          });

          viewIdMap.set(sourceView.id, templateView.getId());

          for (const sourceViewProperty of sourceView.properties) {
            const templatePropertyId = propertyIdMap.get(
              sourceViewProperty.propertyId,
            );

            if (!templatePropertyId) {
              throw new BadRequestException(
                `View property "${sourceViewProperty.propertyId}" could not be resolved`,
              );
            }

            templateView.addProperty(
              PageTemplateDatabaseViewProperty.create({
                templateViewId: templateView.getId(),
                templatePropertyId,
                position: sourceViewProperty.position,
                visible: sourceViewProperty.visible,
                width: sourceViewProperty.width,
              }),
            );
          }

          templateDatabase.addView(templateView);
        }

        templateDatabases.push(templateDatabase);
      }

      await this.templateDatabaseSnapshotRepository.saveMany(
        templateDatabases,
        context,
      );

      const sortedBlocks = this.sortBlocks(snapshot.blocks);
      const sourceIdToTemplateBlockId = new Map<string, string>();
      const templateBlocks: PageTemplateBlock[] = [];

      for (const input of sortedBlocks) {
        let parentBlockId: string | null = null;

        if (input.parentSourceId) {
          const mappedParentId = sourceIdToTemplateBlockId.get(
            input.parentSourceId,
          );

          if (!mappedParentId) {
            throw new BadRequestException(
              `Page block parent "${input.parentSourceId}" could not be resolved`,
            );
          }

          parentBlockId = mappedParentId;
        }

        let dataConfig = input.dataConfig;

        if (input.type === PageBlockType.DATABASE_VIEW) {
          const {
            databaseId,
            viewId,
            dataConfig: sourceDataConfig,
          } = this.getDatabaseViewReference(input);
          const templateDatabaseId = databaseIdMap.get(databaseId);
          const templateViewId = viewIdMap.get(viewId);

          if (!templateDatabaseId || !templateViewId) {
            throw new BadRequestException(
              `Database view mapping for block "${input.sourceId}" could not be resolved`,
            );
          }

          dataConfig = {
            ...sourceDataConfig,
            database_id: templateDatabaseId,
            view_id: templateViewId,
          };
        }

        const block = PageTemplateBlock.create({
          versionId: savedVersion.getId(),
          parentBlockId,
          type: input.type,
          title: input.title,
          positionX: input.positionX,
          positionY: input.positionY,
          width: input.width,
          height: input.height,
          orderIndex: input.orderIndex,
          content: input.content,
          styleConfig: input.styleConfig,
          dataConfig,
          createdBy: command.userId,
          isOpen: input.isOpen,
        });

        sourceIdToTemplateBlockId.set(input.sourceId, block.getId());
        templateBlocks.push(block);
      }

      await this.pageTemplateBlockRepository.saveMany(templateBlocks, context);

      return {
        template: PageTemplateResponseDto.fromDomain(savedTemplate),
        version: TemplateVersionResponseDto.fromDomain(savedVersion),
      };
    });
  }

  private getDatabaseViewReference(block: ContentPageBlockSnapshot): {
    databaseId: string;
    viewId: string;
    dataConfig: Record<string, unknown>;
  } {
    const dataConfig = block.dataConfig;

    if (
      dataConfig === null ||
      Array.isArray(dataConfig) ||
      typeof dataConfig !== 'object'
    ) {
      throw new BadRequestException(
        `DATABASE_VIEW block "${block.sourceId}" requires dataConfig`,
      );
    }

    const databaseId = dataConfig.database_id;
    const viewId = dataConfig.view_id;

    if (typeof databaseId !== 'string' || !databaseId.trim()) {
      throw new BadRequestException(
        `DATABASE_VIEW block "${block.sourceId}" requires database_id`,
      );
    }

    if (typeof viewId !== 'string' || !viewId.trim()) {
      throw new BadRequestException(
        `DATABASE_VIEW block "${block.sourceId}" requires view_id`,
      );
    }

    return { databaseId, viewId, dataConfig };
  }

  private remapRowValue(
    value: RowValueData,
    property: DatabaseSnapshotProperty,
    optionIdMap: Map<string, string>,
  ): RowValueData {
    if (
      property.type === PropertyType.SELECT ||
      property.type === PropertyType.STATUS
    ) {
      if (value === null) {
        return null;
      }

      if (typeof value !== 'string') {
        throw new BadRequestException(
          `${property.type} property "${property.id}" requires an option ID value`,
        );
      }

      return this.getTemplateOptionId(value, property.id, optionIdMap);
    }

    if (property.type === PropertyType.MULTI_SELECT) {
      if (value === null) {
        return null;
      }

      if (
        !Array.isArray(value) ||
        value.some((item) => typeof item !== 'string')
      ) {
        throw new BadRequestException(
          `MULTI_SELECT property "${property.id}" requires option ID values`,
        );
      }

      return value.map((sourceOptionId) =>
        this.getTemplateOptionId(sourceOptionId, property.id, optionIdMap),
      );
    }

    return value;
  }

  private getTemplateOptionId(
    sourceOptionId: string,
    sourcePropertyId: string,
    optionIdMap: Map<string, string>,
  ): string {
    const templateOptionId = optionIdMap.get(sourceOptionId);

    if (!templateOptionId) {
      throw new BadRequestException(
        `Option "${sourceOptionId}" for property "${sourcePropertyId}" could not be resolved`,
      );
    }

    return templateOptionId;
  }

  private sortBlocks(
    blocks: ContentPageBlockSnapshot[],
  ): ContentPageBlockSnapshot[] {
    const bySourceId = new Map<string, ContentPageBlockSnapshot>();

    for (const block of blocks) {
      if (!block.sourceId.trim()) {
        throw new BadRequestException('Page block sourceId is required');
      }

      if (bySourceId.has(block.sourceId)) {
        throw new BadRequestException(
          `Duplicate page block sourceId: ${block.sourceId}`,
        );
      }

      bySourceId.set(block.sourceId, block);
    }

    for (const block of blocks) {
      if (!block.parentSourceId) {
        continue;
      }

      if (block.parentSourceId === block.sourceId) {
        throw new BadRequestException(
          `Page block "${block.sourceId}" cannot be its own parent`,
        );
      }

      if (!bySourceId.has(block.parentSourceId)) {
        throw new BadRequestException(
          `Page block parent "${block.parentSourceId}" does not exist`,
        );
      }
    }

    const result: ContentPageBlockSnapshot[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (sourceId: string): void => {
      if (visited.has(sourceId)) {
        return;
      }

      if (visiting.has(sourceId)) {
        throw new BadRequestException('Page block hierarchy contains a cycle');
      }

      const block = bySourceId.get(sourceId);

      if (!block) {
        throw new BadRequestException(
          `Page block "${sourceId}" does not exist`,
        );
      }

      visiting.add(sourceId);

      if (block.parentSourceId) {
        visit(block.parentSourceId);
      }

      visiting.delete(sourceId);
      visited.add(sourceId);
      result.push(block);
    };

    for (const block of blocks) {
      visit(block.sourceId);
    }

    return result;
  }
}
