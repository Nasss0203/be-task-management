import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ContentPageProvisioningPort } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { CreateDatabaseCommand } from 'src/modules/database/application/commands/create-database/create-database.command';
import { CreateDatabaseHandler } from 'src/modules/database/application/commands/create-database/create-database.handler';
import { CreateDatabaseViewCommand } from 'src/modules/database/application/commands/create-database-view/create-database-view.command';
import { CreateDatabaseViewHandler } from 'src/modules/database/application/commands/create-database-view/create-database-view.handler';
import {
  ImportDatabaseRowsCommand,
  type ImportColumnMapping,
} from 'src/modules/database/application/commands/import-database-rows/import-database-rows.command';
import { ImportDatabaseRowsHandler } from 'src/modules/database/application/commands/import-database-rows/import-database-rows.handler';
import type { ImportDatabaseRowsResult } from 'src/modules/database/application/commands/import-database-rows/import-database-rows.result';
import { readCsvRecords } from 'src/modules/database/application/commands/import-database-rows/read-csv-records';
import { RenamePropertyCommand } from 'src/modules/database/application/commands/rename-property/rename-property.command';
import { RenamePropertyHandler } from 'src/modules/database/application/commands/rename-property/rename-property.handler';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import { Database } from 'src/modules/database/domain/aggregates/database/database.aggregate';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { CreatePageCommand } from '../create-page/create-page.command';
import { CreatePageHandler } from '../create-page/create-page.handler';
import { ImportCsvPageCommand } from './import-csv-page.command';

export const NEW_DATABASE_TITLE_PROPERTY_ID = 'title';

const MAX_NAME_LENGTH = 250;
const DEFAULT_TITLE_NAME = 'Name';

export interface ImportCsvPageResult extends ImportDatabaseRowsResult {
  pageId: string | null;
  databaseId: string | null;
}

const nameFromFileName = (fileName: string) =>
  (fileName.split(/[\\/]/).pop() ?? '')
    .replace(/\.csv$/i, '')
    .trim()
    .slice(0, MAX_NAME_LENGTH) || 'Untitled';

@Injectable()
export class ImportCsvPageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(CONTENT_TYPES.applications.CreatePageHandler)
    private readonly createPage: CreatePageHandler,

    @Inject(CONTENT_TYPES.ports.PageProvisioning)
    private readonly pageProvisioning: ContentPageProvisioningPort,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepo: DatabaseRepository,

    private readonly createDatabase: CreateDatabaseHandler,
    private readonly renameProperty: RenamePropertyHandler,
    private readonly createView: CreateDatabaseViewHandler,
    private readonly importRows: ImportDatabaseRowsHandler,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: ImportCsvPageCommand): Promise<ImportCsvPageResult> {
    const page = await this.pageRepo.findById(command.pageId);
    if (!page || page.getDeletedAt() !== null) {
      throw new NotFoundException('Page not found');
    }

    const { headers } = readCsvRecords(command.file);
    this.assertMapping(command.mapping, headers.length);

    const name = nameFromFileName(command.fileName);
    const titleColumn = command.mapping
      ? command.mapping.indexOf(NEW_DATABASE_TITLE_PROPERTY_ID)
      : 0;
    const titleName =
      headers[titleColumn]?.trim().slice(0, MAX_NAME_LENGTH) ||
      DEFAULT_TITLE_NAME;

    if (command.dryRun) {
      const draft = Database.create({
        id: randomUUID(),
        pageId: page.getId(),
        name,
        titlePropertyId: NEW_DATABASE_TITLE_PROPERTY_ID,
        assigneePropertyId: randomUUID(),
        dueDatePropertyId: randomUUID(),
        titleOnly: true,
      });
      draft.renameProperty(NEW_DATABASE_TITLE_PROPERTY_ID, titleName);

      const result = await this.importRows.importIntoDatabase(
        this.rowsCommand(command, draft.getId(), command.mapping),
        draft,
      );
      return { ...result, pageId: null, databaseId: null };
    }

    return this.uow.runInTransaction(async (context) => {
      const targetPageId =
        command.target === 'child_page'
          ? (
              await this.createPage.execute(
                new CreatePageCommand(
                  command.userId,
                  page.getWorkspaceId(),
                  name,
                  null,
                  page.getId(),
                ),
                context,
              )
            ).id
          : page.getId();

      const created = await this.createDatabase.execute(
        new CreateDatabaseCommand(targetPageId, name, true, command.userId),
        context,
      );
      const titleId = this.titlePropertyId(created);
      if (titleName !== DEFAULT_TITLE_NAME) {
        await this.renameProperty.execute(
          new RenamePropertyCommand(
            created.getId(),
            titleId,
            titleName,
            command.userId,
          ),
          context,
        );
      }

      const database = await this.databaseRepo.findById(
        created.getId(),
        context,
      );
      if (!database) {
        throw new NotFoundException('Database not found');
      }

      const mapping =
        command.mapping?.map((entry) =>
          entry === NEW_DATABASE_TITLE_PROPERTY_ID ? titleId : entry,
        ) ?? null;
      const result = await this.importRows.importIntoDatabase(
        this.rowsCommand(command, database.getId(), mapping),
        database,
        context,
      );

      const view = await this.createView.execute(
        new CreateDatabaseViewCommand(
          database.getId(),
          'Table',
          DatabaseViewType.TABLE,
        ),
        context,
      );
      await this.appendDatabaseBlock(
        targetPageId,
        command.userId,
        database.getId(),
        view.id,
        context,
      );

      return { ...result, pageId: targetPageId, databaseId: database.getId() };
    });
  }

  private assertMapping(
    mapping: ImportColumnMapping[] | null,
    columns: number,
  ): void {
    if (!mapping) return;
    if (mapping.length !== columns) {
      throw new BadRequestException(
        'The mapping must have one entry per CSV column',
      );
    }
    if (
      mapping.some(
        (entry) =>
          typeof entry === 'string' && entry !== NEW_DATABASE_TITLE_PROPERTY_ID,
      )
    ) {
      throw new BadRequestException(
        'A new database can only map columns to its title or to new properties',
      );
    }
  }

  private rowsCommand(
    command: ImportCsvPageCommand,
    databaseId: string,
    mapping: ImportColumnMapping[] | null,
  ): ImportDatabaseRowsCommand {
    return new ImportDatabaseRowsCommand(
      databaseId,
      command.userId,
      command.file,
      mapping,
      command.timeZone,
      command.dryRun,
      command.pageId,
    );
  }

  private titlePropertyId(database: Database): string {
    const title = database
      .getProperties()
      .find((property) => property.getType() === PropertyType.TITLE);
    if (!title) {
      throw new NotFoundException('Title property not found');
    }
    return title.getId();
  }

  private async appendDatabaseBlock(
    pageId: string,
    userId: string,
    databaseId: string,
    viewId: string,
    context: PersistenceContext,
  ): Promise<void> {
    const last = await this.pageBlockRepo.findLastSibling(
      pageId,
      null,
      null,
      context,
    );
    await this.pageProvisioning.createBlocksFromSnapshot(
      {
        pageId,
        createdBy: userId,
        blocks: [
          {
            sourceId: databaseId,
            type: PageBlockType.DATABASE_VIEW,
            positionX: null,
            positionY: null,
            width: null,
            height: null,
            orderIndex: last ? last.getOrderIndex() + 1 : 0,
            content: {},
            styleConfig: {},
            dataConfig: { database_id: databaseId, view_id: viewId },
          },
        ],
      },
      context,
    );
    await this.pageRepo.touch(pageId, context);
  }
}
