import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { CreateDatabaseRowCommand } from 'src/modules/database/application/commands/create-database-row/create-database-row.command';
import { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import {
  ImportDatabaseRowsCommand,
  type ImportColumnMapping,
} from 'src/modules/database/application/commands/import-database-rows/import-database-rows.command';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { ImportDatabaseRowsHandler } from 'src/modules/database/application/commands/import-database-rows/import-database-rows.handler';
import { CSV_IMPORT_LIMITS } from 'src/modules/database/application/commands/import-database-rows/read-csv-records';
import { GetDatabasePeopleHandler } from 'src/modules/database/application/queries/get-database-people/get-database-people.handler';
import { GetDatabaseRowsHandler } from 'src/modules/database/application/queries/get-database-rows/get-database-rows.handler';
import { GetDatabaseRowsQuery } from 'src/modules/database/application/queries/get-database-rows/get-database-rows.query';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { CreateDatabaseRowRequest } from '../requests/create-database-row.request';
import { ImportDatabaseRowsRequest } from '../requests/import-database-rows.request';

const isColumnMapping = (item: unknown): item is ImportColumnMapping =>
  item === null ||
  typeof item === 'string' ||
  (typeof item === 'object' &&
    !Array.isArray(item) &&
    Object.keys(item).join() === 'type' &&
    Object.values(PropertyType).includes(
      (item as { type: PropertyType }).type,
    ));

function parseMapping(
  mapping: string | undefined,
): ImportColumnMapping[] | null {
  if (mapping === undefined) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(mapping);
  } catch {
    parsed = undefined;
  }
  if (!Array.isArray(parsed) || !parsed.every(isColumnMapping)) {
    throw new BadRequestException(
      'mapping must be a JSON array of property ids, null or { "type": "<property type>" }',
    );
  }

  return parsed;
}

@Controller('databases/:databaseId/rows')
export class DatabaseRowController {
  constructor(
    private readonly createDatabaseRowHandler: CreateDatabaseRowHandler,
    private readonly importDatabaseRowsHandler: ImportDatabaseRowsHandler,
    private readonly getDatabaseRowsHandler: GetDatabaseRowsHandler,
    private readonly getDatabasePeopleHandler: GetDatabasePeopleHandler,
  ) {}

  @Post()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_CREATE)
  async createRow(
    @Auth() user: IAuth,
    @Param('databaseId') databaseId: string,
    @Body() request: CreateDatabaseRowRequest,
  ) {
    return this.createDatabaseRowHandler.execute(
      new CreateDatabaseRowCommand(
        databaseId,
        request?.parentRowId ?? null,
        user.id,
      ),
    );
  }

  @Post('import')
  @UploadRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_CREATE)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: CSV_IMPORT_LIMITS.maxFileSize, files: 1 },
    }),
  )
  importRows(
    @Auth() user: IAuth,
    @Param('databaseId') databaseId: string,
    @Body() request: ImportDatabaseRowsRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file || !/\.csv$/i.test(file.originalname)) {
      throw new BadRequestException('Upload a .csv file');
    }

    return this.importDatabaseRowsHandler.execute(
      new ImportDatabaseRowsCommand(
        databaseId,
        user.id,
        file.buffer,
        parseMapping(request.mapping),
        request.timeZone ?? null,
        request.dryRun !== 'false',
      ),
    );
  }

  /** Names for Person cells, readable by anyone who can read the rows. */
  @Get('people')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  getPeople(@Param('databaseId') databaseId: string) {
    return this.getDatabasePeopleHandler.execute(databaseId);
  }

  @Get()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  async getRows(@Param('databaseId') databaseId: string) {
    return this.getDatabaseRowsHandler.execute(
      new GetDatabaseRowsQuery(databaseId),
    );
  }
}
