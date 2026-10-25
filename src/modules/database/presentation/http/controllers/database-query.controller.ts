import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { RenameDatabaseCommand } from 'src/modules/database/application/commands/rename-database/rename-database.command';
import { RenameDatabaseHandler } from 'src/modules/database/application/commands/rename-database/rename-database.handler';
import { GetDatabaseHandler } from 'src/modules/database/application/queries/get-database/get-database.handler';
import { GetDatabaseQuery } from 'src/modules/database/application/queries/get-database/get-database.query';
import { RenameDatabaseRequest } from '../requests/rename-database.request';

@Controller('databases')
export class DatabaseQueryController {
  constructor(
    private readonly getDatabaseHandler: GetDatabaseHandler,
    private readonly renameDatabaseHandler: RenameDatabaseHandler,
  ) {}

  @Get(':databaseId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  async getDatabase(@Param('databaseId') databaseId: string) {
    const database = await this.getDatabaseHandler.execute(
      new GetDatabaseQuery(databaseId),
    );

    return {
      id: database.getId(),
      pageId: database.getPageId(),
      name: database.getName(),

      properties: database.getProperties().map((property) => ({
        id: property.getId(),
        name: property.getName(),
        type: property.getType(),
        isDefault: property.getIsDefault(),
        isHideable: property.getIsHideable(),
        position: property.getPosition(),

        options: property.getOptions().map((option) => ({
          id: option.getId(),
          name: option.getName(),
          color: option.getColor(),
          position: option.getPosition(),
        })),
      })),
    };
  }

  @Patch(':databaseId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async renameDatabase(
    @Param('databaseId') databaseId: string,
    @Body() request: RenameDatabaseRequest,
  ) {
    return this.renameDatabaseHandler.execute(
      new RenameDatabaseCommand(databaseId, request.name),
    );
  }
}
