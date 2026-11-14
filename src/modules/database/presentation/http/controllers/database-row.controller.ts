import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { CreateDatabaseRowCommand } from 'src/modules/database/application/commands/create-database-row/create-database-row.command';
import { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import { GetDatabasePeopleHandler } from 'src/modules/database/application/queries/get-database-people/get-database-people.handler';
import { GetDatabaseRowsHandler } from 'src/modules/database/application/queries/get-database-rows/get-database-rows.handler';
import { GetDatabaseRowsQuery } from 'src/modules/database/application/queries/get-database-rows/get-database-rows.query';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { CreateDatabaseRowRequest } from '../requests/create-database-row.request';

@Controller('databases/:databaseId/rows')
export class DatabaseRowController {
  constructor(
    private readonly createDatabaseRowHandler: CreateDatabaseRowHandler,
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
