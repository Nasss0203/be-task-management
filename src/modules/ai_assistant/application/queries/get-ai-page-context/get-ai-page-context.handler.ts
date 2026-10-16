import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';

import { FindPageBlockByPageHandler } from 'src/modules/content/application/queries/page-block/find-page-block-by-page/find-page-block-by-page.handler';
import { FindPageBlockByPageQuery } from 'src/modules/content/application/queries/page-block/find-page-block-by-page/find-page-block-by-page.query';
import { FindPageByIdHandler } from 'src/modules/content/application/queries/page/find-page-by-id/find-page-by-id.handler';
import { FindPageByIdQuery } from 'src/modules/content/application/queries/page/find-page-by-id/find-page-by-id.query';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import {
  PageBlockType,
  type PageBlockDatabaseViewDataConfig,
  type PageBlockJson,
} from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import { GetDatabaseViewsHandler } from 'src/modules/database/application/queries/get-database-views/get-database-views.handler';
import { GetDatabaseViewsQuery } from 'src/modules/database/application/queries/get-database-views/get-database-views.query';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { Database } from 'src/modules/database/domain/aggregates/database/database.aggregate';
import type { DatabaseRow } from 'src/modules/database/domain/aggregates/row/database-row.aggregate';
import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import type { DatabaseRowRepository } from 'src/modules/database/domain/repositories/database-row.repository';

import {
  AI_PAGE_CONTEXT_SCHEMA_VERSION,
  MAX_AI_PAGE_CONTEXT_BLOCKS,
  MAX_AI_PAGE_CONTEXT_DATABASES,
  MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE,
  MAX_AI_PAGE_CONTEXT_TEXT_LENGTH,
} from '../../constants/ai-page-context.constant';
import type {
  AiDatabaseContextDto,
  AiDatabaseRowsCompletenessDto,
  AiDatabaseViewReferenceContextDto,
  AiPageBlockContextDto,
  AiPageContextResponseDto,
} from '../../dto/response/ai-page-context.response.dto';
import { GetAiPageContextQuery } from './get-ai-page-context.query';

interface TruncatedValue<T> {
  value: T;
  truncated: boolean;
}

interface DatabaseContextBuildResult {
  context: AiDatabaseContextDto;
  rowsCompleteness: AiDatabaseRowsCompletenessDto;
  textTruncated: boolean;
}

@Injectable()
export class GetAiPageContextHandler {
  constructor(
    @Inject(CONTENT_TYPES.applications.FindPageByIdHandler)
    private readonly findPageByIdHandler: FindPageByIdHandler,

    @Inject(CONTENT_TYPES.applications.FindPageBlockByPageHandler)
    private readonly findPageBlockByPageHandler: FindPageBlockByPageHandler,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepository: PageBlockRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,

    private readonly getDatabaseViewsHandler: GetDatabaseViewsHandler,
  ) {}

  async execute(
    query: GetAiPageContextQuery,
  ): Promise<AiPageContextResponseDto> {
    const page = await this.findPageByIdHandler.execute(
      new FindPageByIdQuery(query.userId, query.pageId, query.shareToken),
    );

    const totalBlocks = await this.pageBlockRepository.countByPageId(page.id);

    if (totalBlocks > MAX_AI_PAGE_CONTEXT_BLOCKS) {
      throw new PayloadTooLargeException(
        `Page contains ${totalBlocks} blocks, exceeding AI context limit of ${MAX_AI_PAGE_CONTEXT_BLOCKS}`,
      );
    }

    const blocks = await this.findPageBlockByPageHandler.execute(
      new FindPageBlockByPageQuery(page.id),
    );

    if (blocks.length > MAX_AI_PAGE_CONTEXT_BLOCKS) {
      throw new PayloadTooLargeException(
        `Page contains more than ${MAX_AI_PAGE_CONTEXT_BLOCKS} blocks`,
      );
    }

    let blockTextTruncated = false;

    const normalizedBlocks: AiPageBlockContextDto[] = blocks.map((block) => {
      const titleResult = this.truncateNullableText(block.title);
      const contentResult = this.truncateJson(block.content);

      if (titleResult.truncated || contentResult.truncated) {
        blockTextTruncated = true;
      }

      return {
        id: block.id,
        parentBlockId: block.parent_block_id,
        type: block.type,
        orderIndex: block.order_index,
        title: titleResult.value,
        content: contentResult.value,
        styleConfig: block.style_config,
        dataConfig: block.data_config,
      };
    });

    const databaseReferences = blocks
      .filter((block) => block.type === PageBlockType.DATABASE_VIEW)
      .map((block) =>
        this.parseDatabaseViewReference(block.id, block.data_config),
      );

    const referencedDatabaseIds = [
      ...new Set(databaseReferences.map((reference) => reference.databaseId)),
    ];

    if (referencedDatabaseIds.length > MAX_AI_PAGE_CONTEXT_DATABASES) {
      throw new PayloadTooLargeException(
        `Page references ${referencedDatabaseIds.length} databases, exceeding AI context limit of ${MAX_AI_PAGE_CONTEXT_DATABASES}`,
      );
    }

    const pageDatabases = await this.databaseRepository.findByPageId(page.id);
    const pageDatabaseMap = new Map(
      pageDatabases.map((database) => [database.getId(), database]),
    );

    const referencedDatabases = referencedDatabaseIds.map((databaseId) => {
      const database = pageDatabaseMap.get(databaseId);

      if (!database) {
        throw new BadRequestException(
          `Database ${databaseId} referenced by this page does not belong to the target page`,
        );
      }

      return database;
    });

    const databaseResults = await Promise.all(
      referencedDatabases.map((database) =>
        this.buildDatabaseContext(database, databaseReferences),
      ),
    );

    return {
      schemaVersion: AI_PAGE_CONTEXT_SCHEMA_VERSION,
      builtAt: new Date().toISOString(),

      page: {
        id: page.id,
        workspaceId: page.workspace_id,
        teamspaceId: page.teamspace_id,
        parentPageId: page.parent_page_id,
        title: page.title,
        icon: page.icon,
        coverUrl: page.cover_url,
        updatedAt: page.updatedAt.toISOString(),
      },

      blocks: normalizedBlocks,

      databaseReferences,

      databases: databaseResults.map((result) => result.context),

      completeness: {
        blocks: {
          total: totalBlocks,
          included: normalizedBlocks.length,
          truncated: false,
        },

        databases: {
          total: referencedDatabaseIds.length,
          included: databaseResults.length,
          truncated: false,
        },

        rows: databaseResults.map((result) => result.rowsCompleteness),

        textTruncated:
          blockTextTruncated ||
          databaseResults.some((result) => result.textTruncated),
      },
    };
  }

  private async buildDatabaseContext(
    database: Database,
    references: AiDatabaseViewReferenceContextDto[],
  ): Promise<DatabaseContextBuildResult> {
    const views = await this.getDatabaseViewsHandler.execute(
      new GetDatabaseViewsQuery(database.getId()),
    );

    const viewIds = new Set(views.map((view) => view.id));

    for (const reference of references) {
      if (
        reference.databaseId === database.getId() &&
        !viewIds.has(reference.viewId)
      ) {
        throw new BadRequestException(
          `View ${reference.viewId} does not belong to database ${database.getId()}`,
        );
      }
    }

    const [rows, totalRows] = await Promise.all([
      this.databaseRowRepository.findByDatabaseId(database.getId(), undefined, {
        limit: MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE,
      }),
      this.databaseRowRepository.countByDatabaseId(database.getId()),
    ]);

    const properties = [...database.getProperties()].sort((a, b) =>
      this.comparePositions(a.getPosition(), b.getPosition()),
    );

    const propertyTypeMap = new Map(
      properties.map((property) => [property.getId(), property.getType()]),
    );

    let rowTextTruncated = false;

    const normalizedRows = rows.map((row) => {
      const result = this.normalizeRow(row, propertyTypeMap);

      if (result.textTruncated) {
        rowTextTruncated = true;
      }

      return result.row;
    });

    return {
      context: {
        id: database.getId(),
        pageId: database.getPageId(),
        name: database.getName(),

        properties: properties.map((property) => ({
          id: property.getId(),
          name: property.getName(),
          type: property.getType(),
          position: property.getPosition(),
          isDefault: property.getIsDefault(),
          isHideable: property.getIsHideable(),

          options: [...property.getOptions()]
            .sort((a, b) =>
              this.comparePositions(a.getPosition(), b.getPosition()),
            )
            .map((option) => ({
              id: option.getId(),
              name: option.getName(),
              color: option.getColor(),
              position: option.getPosition(),
            })),
        })),

        views: [...views]
          .sort((a, b) => this.comparePositions(a.position, b.position))
          .map((view) => ({
            id: view.id,
            databaseId: view.databaseId,
            name: view.name,
            type: view.type,
            position: view.position,

            properties: [...view.properties]
              .sort((a, b) => this.comparePositions(a.position, b.position))
              .map((property) => ({
                propertyId: property.propertyId,
                position: property.position,
                visible: property.visible,
                width: property.width,
              })),
          })),

        rows: normalizedRows,
      },

      rowsCompleteness: {
        databaseId: database.getId(),
        total: totalRows,
        included: normalizedRows.length,
        truncated: totalRows > normalizedRows.length,
        selection: 'BOUNDED',
      },

      textTruncated: rowTextTruncated,
    };
  }

  private normalizeRow(
    row: DatabaseRow,
    propertyTypeMap: ReadonlyMap<string, PropertyType>,
  ): {
    row: AiDatabaseContextDto['rows'][number];
    textTruncated: boolean;
  } {
    let textTruncated = false;

    const values: Record<string, RowValueData> = {};

    for (const rowValue of row.getValues()) {
      const propertyId = rowValue.getPropertyId();
      const propertyType = propertyTypeMap.get(propertyId);
      const rawValue = rowValue.getValue();

      const normalized = this.normalizeRowValue(rawValue, propertyType);

      if (normalized.truncated) {
        textTruncated = true;
      }

      values[propertyId] = normalized.value;
    }

    return {
      row: {
        id: row.getId(),
        databaseId: row.getDatabaseId(),
        values,
      },
      textTruncated,
    };
  }

  private normalizeRowValue(
    value: RowValueData,
    propertyType?: PropertyType,
  ): TruncatedValue<RowValueData> {
    const textualPropertyTypes: PropertyType[] = [
      PropertyType.TITLE,
      PropertyType.TEXT,
      PropertyType.URL,
      PropertyType.EMAIL,
      PropertyType.PHONE,
    ];

    if (
      typeof value === 'string' &&
      propertyType !== undefined &&
      textualPropertyTypes.includes(propertyType)
    ) {
      const result = this.truncateText(value);

      return {
        value: result.value,
        truncated: result.truncated,
      };
    }

    return {
      value,
      truncated: false,
    };
  }

  private parseDatabaseViewReference(
    blockId: string,
    dataConfig: PageBlockJson,
  ): AiDatabaseViewReferenceContextDto {
    if (!this.isDatabaseViewDataConfig(dataConfig)) {
      throw new BadRequestException(
        `DATABASE_VIEW block ${blockId} has invalid data_config`,
      );
    }

    return {
      blockId,
      databaseId: dataConfig.database_id,
      viewId: dataConfig.view_id,
    };
  }

  private isDatabaseViewDataConfig(
    value: PageBlockJson,
  ): value is PageBlockDatabaseViewDataConfig {
    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
      typeof candidate.database_id === 'string' &&
      candidate.database_id.trim().length > 0 &&
      typeof candidate.view_id === 'string' &&
      candidate.view_id.trim().length > 0
    );
  }

  private truncateNullableText(
    value: string | null,
  ): TruncatedValue<string | null> {
    if (value === null) {
      return {
        value: null,
        truncated: false,
      };
    }

    return this.truncateText(value);
  }

  private truncateText(value: string): TruncatedValue<string> {
    if (value.length <= MAX_AI_PAGE_CONTEXT_TEXT_LENGTH) {
      return {
        value,
        truncated: false,
      };
    }

    return {
      value: value.slice(0, MAX_AI_PAGE_CONTEXT_TEXT_LENGTH),
      truncated: true,
    };
  }

  private truncateJson(value: PageBlockJson): TruncatedValue<PageBlockJson> {
    const result = this.truncateUnknown(value);

    return {
      value: result.value as PageBlockJson,
      truncated: result.truncated,
    };
  }

  private truncateUnknown(value: unknown): TruncatedValue<unknown> {
    if (typeof value === 'string') {
      return this.truncateText(value);
    }

    if (Array.isArray(value)) {
      let truncated = false;

      const normalized = value.map((item) => {
        const result = this.truncateUnknown(item);

        if (result.truncated) {
          truncated = true;
        }

        return result.value;
      });

      return {
        value: normalized,
        truncated,
      };
    }

    if (value !== null && typeof value === 'object') {
      let truncated = false;
      const normalized: Record<string, unknown> = {};

      for (const [key, item] of Object.entries(value)) {
        const result = this.truncateUnknown(item);

        if (result.truncated) {
          truncated = true;
        }

        normalized[key] = result.value;
      }

      return {
        value: normalized,
        truncated,
      };
    }

    return {
      value,
      truncated: false,
    };
  }

  private comparePositions(a: string, b: string): number {
    const numericA = Number(a);
    const numericB = Number(b);

    if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
      if (numericA !== numericB) {
        return numericA - numericB;
      }
    }

    return a.localeCompare(b);
  }
}
