import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateDatabaseViewCommand } from '../../../application/commands/create-database-view/create-database-view.command';
import { CreateDatabaseViewHandler } from '../../../application/commands/create-database-view/create-database-view.handler';

import { GetDatabaseViewsHandler } from 'src/modules/database/application/queries/get-database-views/get-database-views.handler';
import { GetDatabaseViewsQuery } from 'src/modules/database/application/queries/get-database-views/get-database-views.query';
import { CreateDatabaseViewRequest } from '../requests/create-database-view.request';

@Controller('databases/:databaseId/views')
export class DatabaseViewController {
  constructor(
    private readonly createDatabaseViewHandler: CreateDatabaseViewHandler,

    private readonly getDatabaseViewsHandler: GetDatabaseViewsHandler,
  ) {}

  @Post()
  async createView(
    @Param('databaseId') databaseId: string,
    @Body() request: CreateDatabaseViewRequest,
  ) {
    return this.createDatabaseViewHandler.execute(
      new CreateDatabaseViewCommand(databaseId, request.name, request.type),
    );
  }

  @Get()
  async getViews(@Param('databaseId') databaseId: string) {
    return this.getDatabaseViewsHandler.execute(
      new GetDatabaseViewsQuery(databaseId),
    );
  }
}
